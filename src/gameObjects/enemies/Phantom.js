import { Enemy } from './Enemy.js';

// Level 15+. Drifts through walls toward you, slowly and relentlessly, and
// flickers so it's hard to track. A dash or a bomb gets rid of it.
export class Phantom extends Enemy {
    ghost = true;

    constructor(scene, x, y) {
        super(scene, x, y, 'phantom');
    }

    setup() {
        this.body.setAllowGravity(false);
        this.setImmovable(true);
        this.body.setSize(56, 64);
        this.scene.tweens.add({ targets: this, alpha: { from: 0.85, to: 0.3 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    update(time) {
        if (!this.active) return;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y);
        this.scene.physics.velocityFromRotation(angle, 120 * this.speedScale, this.body.velocity);
        this.y += Math.sin(time / 300) * 0.6;
        this.setFlipX(this.player.x > this.x);
    }
}
