import { Enemy } from './enemies/Enemy.js';

// Patrols until it sees you, then chases: hops over one-block steps and
// follows you down ledges. Gives up two seconds after losing sight of you.
export class ChasingEnemy extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'hunter');
        this.direction = 1;
        this.speed = 240 * this.speedScale;
        this.lastSeen = -1e9;
        this.chasing = false;
    }

    setup() {
        this.setCollideWorldBounds(true).setGravityY(500).setImmovable(true);
    }

    update(time) {
        if (!this.active) return;
        const body = this.body;
        const onGround = body.blocked.down;

        if (this.canSee(750)) {
            if (!this.chasing) {
                this.alert('!');
                if (onGround) this.setVelocityY(-450);
            }
            this.chasing = true;
            this.lastSeen = time;
        } else if (time - this.lastSeen > 2000) {
            this.chasing = false;
        }

        if (this.chasing) {
            this.direction = this.player.x < this.x ? -1 : 1;
            this.setVelocityX(this.direction * this.speed);
            const blocked = this.direction < 0 ? body.blocked.left : body.blocked.right;
            if (blocked && onGround) this.setVelocityY(-720); // hop up a step
        } else {
            const ahead = this.x + this.direction * (body.width / 2 + 6);
            const ledge = onGround && !this.solidAt(ahead, body.bottom + 10);
            if (ledge || body.blocked.left || body.blocked.right) this.direction *= -1;
            this.setVelocityX(this.direction * this.speed * 0.55);
        }
        this.setFlipX(this.direction > 0);
    }
}
