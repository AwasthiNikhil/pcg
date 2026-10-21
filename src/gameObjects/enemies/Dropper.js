import { Enemy } from './Enemy.js';

// Level 9+. A spike hanging from the ceiling. When you pass underneath it
// shakes, then drops and shatters on whatever it hits.
export class Dropper extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'icicle');
        this.state = 'hang';
    }

    setup() {
        this.body.setAllowGravity(false);
        this.setImmovable(true);
    }

    update(time) {
        if (!this.active) return;
        const p = this.player;
        if (this.state === 'hang') {
            const below = p.y > this.y && Math.abs(p.x - this.x) < 110 && this.canSee(900);
            if (below) {
                this.state = 'shake';
                this.until = time + 340;
                this.baseX = this.x;
            }
        } else if (this.state === 'shake') {
            this.x = this.baseX + Math.sin(time / 15) * 4;
            if (time > this.until) {
                this.x = this.baseX;
                this.state = 'fall';
                this.body.setAllowGravity(true);
                this.setGravityY(1500);
            }
        } else if (this.state === 'fall' && this.body.blocked.down) {
            this.scene.sparks.explode(14, this.x, this.body.bottom);
            this.scene.cameras.main.shake(90, 0.004);
            this.destroy();
        }
    }
}
