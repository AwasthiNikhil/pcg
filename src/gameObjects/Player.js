export class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'dude');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setBounce(0.05);
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

    moveLeft() {
        this.setVelocityX(-200);
        this.anims.play('left', true);
        this.lastDirection = 'left';
    }

    moveRight() {
        this.setVelocityX(200);
        this.anims.play('right', true);
        this.lastDirection = 'right';
    }

    idle() {
        this.setVelocityX(0);
        this.anims.play('turn');
    }

    jump() {
        if (this.body.blocked.down) {
            this.setVelocityY(-500);
        } else if (this.body.blocked.left || this.body.blocked.right) {
            // Wall jump
            const direction = this.body.blocked.left ? 1 : -1;
            this.setVelocityY(-500);
            this.setVelocityX(200 * direction);
        }
    }


    shootBomb() {
        const now = this.scene.time.now;
        if (now - this.lastShot < 500) return;

        const offsetX = this.lastDirection === 'left' ? -30 : 30;
        const bomb = this.bombs.get(this.x + offsetX, this.y - 20); // Slightly in front and above

        if (!bomb) return;

        bomb.setActive(true).setVisible(true);
        bomb.body.allowGravity = true;
        bomb.body.setBounce(0.1); // Lower the bounce to reduce friction
        bomb.body.setFriction(0.1); // Reduce friction to prevent it from sticking

        const velocityX = this.lastDirection === 'left' ? -300 : 300;
        bomb.setVelocity(velocityX, -100);

        this.lastShot = now;
    }

    // Add this method to handle collision and remove bombs correctly
    handleBombCollision(bomb, wall) {
        bomb.setActive(false).setVisible(false); // Make bomb disappear immediately
        bomb.body.setVelocity(0, 0); // Stop movement of the bomb
        bomb.disableBody(true, true); // Disable the body (and remove it from physics)

        // Add custom logic for wall destruction here (e.g., destroying 2x2 tiles)
    }
}
