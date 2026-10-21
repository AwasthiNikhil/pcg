import { Enemy } from './enemies/Enemy.js';

// Walks back and forth. Turns at walls and at ledge edges (with a short pause
// that gives away the turn), so it guards its platform instead of falling off.
export class PatrollingEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'crawler');
        this.direction = Math.random() < 0.5 ? -1 : 1;
        this.speed = 170 * this.speedScale;
        this.pausedUntil = 0;
    }

    setup() {
        this.setCollideWorldBounds(true).setGravityY(500);
    }

    update(time) {
        if (!this.active) return;
        const body = this.body;
        if (time < this.pausedUntil) {
            this.setVelocityX(0);
            return;
        }
        const ahead = this.x + this.direction * (body.width / 2 + 6);
        const ledge = body.blocked.down && !this.solidAt(ahead, body.bottom + 10);
        const wall = this.direction < 0 ? body.blocked.left : body.blocked.right;
        if (ledge || wall) {
            this.direction *= -1;
            this.pausedUntil = time + 280;
            this.setVelocityX(0);
            return;
        }
        this.setVelocityX(this.direction * this.speed);
        this.setFlipX(this.direction > 0);
    }
}
