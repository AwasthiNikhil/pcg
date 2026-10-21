export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'dude');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setBounce(0);
        this.setGravityY(Player.GRAVITY);
        this.lastDirection = 'right';
        this.applyPerks({});
        this.setCollideWorldBounds(true);

        this.scene = scene;
        this.lastShot = 0;

        // Bomb group
        this.bombs = scene.physics.add.group({
            classType: Phaser.Physics.Arcade.Image,
            defaultKey: 'bomb',
            runChildUpdate: true
        });

        this.initAnimations();
    }

    initAnimations() {
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'turn',
            frames: this.anims.generateFrameNumbers('dude', { start: 4, end: 4 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
    }

    // Movement tuning. Tiles are 128px; the sprite is 32x48.
    static RUN_SPEED = 520;
    static GROUND_ACCEL = 18;      // how fast velocity reaches its target (per second)
    static AIR_ACCEL = 9;
    static GRAVITY = 1100;         // extra on top of the world's 500
    static JUMP_SPEED = 980;       // ~300px (2.3 tiles) high
    static JUMP_CUT = 0.45;        // releasing jump early keeps this share of upward speed
    static MAX_FALL = 1150;
    static WALL_SLIDE = 260;
    static WALL_JUMP_PUSH = 480;
    static COYOTE_MS = 90;         // jump still allowed this long after leaving a ledge
    static BUFFER_MS = 120;        // a jump pressed this early before landing still counts
    static DASH_SPEED = 1200;
    static DASH_MS = 160;
    static DASH_COOLDOWN_MS = 450;

    // Called every frame by the Game scene with this frame's input.
    handleInput(input, time, delta) {
        const P = Player;
        const body = this.body;
        const dt = delta / 1000;
        const onGround = body.blocked.down;
        const wallDir = body.blocked.left ? -1 : body.blocked.right ? 1 : 0;

        if (onGround) {
            if (!this.wasOnGround) this.emit('land');
            this.lastGroundedAt = time;
            this.airJumps = 1;
        }
        if (wallDir && !onGround) {
            this.lastWallAt = time;
            this.lastWallDir = wallDir;
            this.airJumps = 1;
        }
        this.wasOnGround = onGround;

        // Dash: a gravity-free burst. Sideways lasts DASH_MS; downward lasts
        // until it lands (the Game breaks the block it lands on).
        if (this.dashing) {
            const over = time >= this.dashEndsAt || (this.dashDown && body.blocked.down);
            if (over) {
                this.endDash(time);
            } else {
                this.setVelocity(this.dashDown ? 0 : this.dashDir * P.DASH_SPEED, this.dashDown ? P.DASH_SPEED : 0);
                return;
            }
        }
        if ((input.dash || input.dashDown) && time >= (this.dashReadyAt || 0)) {
            this.dashing = true;
            this.dashDown = !!input.dashDown;
            this.dashDir = input.left ? -1 : input.right ? 1 : (this.lastDirection === 'left' ? -1 : 1);
            this.dashEndsAt = time + (this.dashDown ? 1500 : P.DASH_MS);
            this.dashReadyAt = Infinity; // cooldown starts when the dash ends
            body.setAllowGravity(false);
            this.setTint(0x66e0ff);
            this.emit('dash', this.dashDir);
            return;
        }

        // Run: ease velocity toward the target instead of snapping or crawling.
        const dir = input.left ? -1 : input.right ? 1 : 0;
        const k = Math.min(1, (onGround ? P.GROUND_ACCEL : P.AIR_ACCEL) * dt);
        this.setVelocityX(body.velocity.x + (dir * this.runSpeed - body.velocity.x) * k);
        if (dir) {
            this.lastDirection = dir < 0 ? 'left' : 'right';
            this.anims.play(this.lastDirection, true);
        } else {
            this.anims.play('turn');
        }

        // Jump: buffered presses, coyote time, wall jumps, one air jump.
        if (input.jumpPressed) this.jumpPressedAt = time;
        const wantsJump = time - (this.jumpPressedAt ?? -1e9) <= P.BUFFER_MS;
        if (wantsJump) {
            if (time - (this.lastGroundedAt ?? -1e9) <= P.COYOTE_MS) {
                this.doJump(this.jumpSpeed);
            } else if (time - (this.lastWallAt ?? -1e9) <= P.COYOTE_MS) {
                this.doJump(this.jumpSpeed);
                this.setVelocityX(-this.lastWallDir * P.WALL_JUMP_PUSH);
                this.lastWallAt = -1e9;
            } else if (input.jumpPressed && this.airJumps > 0) {
                this.airJumps--;
                this.doJump(this.jumpSpeed * 0.85);
            }
        }
        // Variable height: let go early for a short hop.
        if (!input.jumpHeld && body.velocity.y < 0 && !this.jumpCut) {
            this.setVelocityY(body.velocity.y * P.JUMP_CUT);
            this.jumpCut = true;
        }

        // Wall slide when pushing into a wall, and a terminal fall speed.
        const maxFall = wallDir && dir === wallDir ? P.WALL_SLIDE : P.MAX_FALL;
        if (body.velocity.y > maxFall) this.setVelocityY(maxFall);
    }

    // Character and skin perks (see src/perks.js)
    applyPerks(effects) {
        this.runSpeed = Player.RUN_SPEED * (effects.run ?? 1);
        this.jumpSpeed = Player.JUMP_SPEED * (effects.jump ?? 1);
        this.dashCooldown = Player.DASH_COOLDOWN_MS * (effects.dashCooldown ?? 1);
    }

    // Dashing, or just finished a dash: contact kills enemies
    isDashAttacking(time) {
        return this.dashing || time < (this.dashKillUntil || 0);
    }

    setSkin(tint) {
        this.skinTint = tint;
        if (tint === null) this.clearTint(); else this.setTint(tint);
    }

    endDash(time) {
        this.dashing = false;
        this.dashKillUntil = time + 150; // grace: touching an enemy just after the dash still counts
        this.body.setAllowGravity(true);
        this.setSkin(this.skinTint ?? null);
        this.dashReadyAt = time + this.dashCooldown;
        if (!this.dashDown) this.setVelocityX(this.dashDir * this.runSpeed);
    }

    doJump(speed) {
        this.setVelocityY(-speed);
        this.jumpPressedAt = -1e9;
        this.lastGroundedAt = -1e9;
        this.jumpCut = false;
        this.emit('jump');
    }

    shootBomb() {
        const now = this.scene.time.now;
        if (now - this.lastShot < 300) return;

        const offsetX = this.lastDirection === 'left' ? -30 : 30;
        const bomb = this.bombs.get(this.x + offsetX, this.y - 20); // Slightly in front and above

        if (!bomb) return;

        bomb.setActive(true).setVisible(true);
        bomb.body.allowGravity = true;
        bomb.body.setBounce(0.1); // Lower the bounce to reduce friction
        bomb.body.setFriction(0.1); // Reduce friction to prevent it from sticking

        const velocityX = this.lastDirection === 'left' ? -650 : 650;
        bomb.setVelocity(velocityX + this.body.velocity.x * 0.3, -220);

        this.lastShot = now;
    }
}
