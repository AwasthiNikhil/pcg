import { Enemy } from './Enemy.js';

// Level 5+. Hovers in open air, then winds up and dives at you, and flies
// back to where it was hovering.
export class Bat extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'bat');
        this.home = { x, y };
        this.state = 'hover';
        this.until = 0;
        this.phase = Math.random() * Math.PI * 2;
    }

    setup() {
        this.body.setAllowGravity(false);
        this.setCollideWorldBounds(true).setImmovable(true);
        this.body.setSize(60, 34);
    }

    update(time, delta) {
        if (!this.active) return;
        this.setAngle(Math.sin(time / 70) * 8); // flap

        if (this.state === 'hover') {
            this.phase += delta / 500;
            this.setVelocity((this.home.x + Math.cos(this.phase * 0.7) * 60 - this.x) * 3, (this.home.y + Math.sin(this.phase) * 40 - this.y) * 3);
            if (time > this.until && this.canSee(480)) {
                this.state = 'windup';
                this.until = time + 320;
                this.setVelocity(0, 0);
                this.setTint(0xff6b5e);
            }
        } else if (this.state === 'windup') {
            this.x += Math.sin(time / 20) * 2;
            if (time > this.until) {
                const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y);
                this.scene.physics.velocityFromRotation(angle, 560 * this.speedScale, this.body.velocity);
                this.state = 'dive';
                this.until = time + 650;
            }
        } else if (this.state === 'dive') {
            if (time > this.until || this.body.blocked.none === false) {
                this.state = 'return';
                this.clearTint();
            }
        } else if (this.state === 'return') {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.home.x, this.home.y);
            this.scene.physics.velocityFromRotation(angle, 220, this.body.velocity);
            if (Phaser.Math.Distance.Between(this.x, this.y, this.home.x, this.home.y) < 24) {
                this.state = 'hover';
                this.until = time + 1400; // rest before the next dive
            }
        }
        this.setFlipX(this.body.velocity.x > 0);
    }
}
