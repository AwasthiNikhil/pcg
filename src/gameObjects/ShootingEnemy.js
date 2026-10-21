import { Enemy } from './enemies/Enemy.js';

// A turret. Only fires with a clear line of sight, flashes before each shot,
// and aims where you're going rather than where you are. From level 12 it
// fires a three-shot spread.
export class ShootingEnemy extends Enemy {
    constructor(scene, x, y, projectiles) {
        super(scene, x, y, 'cannon');
        this.projectiles = projectiles;
        this.shotSpeed = 480;
        this.interval = Math.max(1000, 1700 - scene.levelId * 25);
        this.nextShot = scene.time.now + 1200;
        this.spread = scene.levelId >= 12;
    }

    setup() {
        this.body.setAllowGravity(false);
        this.setImmovable(true);
        // barrel pivots on the dome and tracks the player
        this.barrel = this.scene.add.image(this.x, this.y + 6, 'cannon-barrel').setOrigin(0.12, 0.5).setDepth(1);
        this.setDepth(2); // dome in front of the barrel's pivot
        this.barrel.rotation = -Math.PI / 2;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (!this.barrel) return;
        this.barrel.setPosition(this.x, this.y + 6);
        const target = Phaser.Math.Angle.Between(this.barrel.x, this.barrel.y, this.player.x, this.player.y);
        // a floor cannon aims anywhere in the upper half; below the horizon it holds level
        const t = Phaser.Math.Angle.Wrap(target);
        const clamped = t > 0 ? (t < Math.PI / 2 ? 0 : Math.PI) : t;
        this.barrel.rotation = Phaser.Math.Angle.RotateTo(this.barrel.rotation, clamped, 0.08);
    }

    destroy(fromScene) {
        // On scene shutdown Phaser destroys the barrel itself; destroying it here
        // would change the display list while Phaser is walking it.
        if (!fromScene) this.barrel?.destroy();
        super.destroy(fromScene);
    }

    update(time) {
        if (!this.active || this.charging || time < this.nextShot) return;
        this.nextShot = time + this.interval;
        if (!this.canSee(950)) return;
        this.charging = true;
        this.scene.tweens.add({
            targets: this, alpha: 0.55, duration: 90, yoyo: true, repeat: 2,
            onStart: () => this.barrel?.setTint(0xff6b5e),
            onComplete: () => { this.charging = false; this.barrel?.clearTint(); this.setAlpha(1); if (this.active) this.fire(); },
        });
    }

    fire() {
        const p = this.player;
        const lead = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y) / this.shotSpeed;
        const aim = Phaser.Math.Angle.Between(this.x, this.y, p.x + p.body.velocity.x * lead * 0.6, p.y + p.body.velocity.y * lead * 0.3);
        // shots leave from the muzzle
        const mx = this.barrel.x + Math.cos(this.barrel.rotation) * 48, my = this.barrel.y + Math.sin(this.barrel.rotation) * 48;
        for (const offset of this.spread ? [-0.18, 0, 0.18] : [0]) {
            const shot = this.projectiles.getFirstDead(false);
            if (!shot) return;
            shot.fire(mx, my, Math.cos(aim + offset) * this.shotSpeed, Math.sin(aim + offset) * this.shotSpeed);
        }
        this.scene.tweens.add({ targets: this.barrel, scaleX: 0.8, duration: 60, yoyo: true }); // recoil
    }
}
