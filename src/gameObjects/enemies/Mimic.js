import { Enemy } from './Enemy.js';

// Level 12+. Looks exactly like a coin until you get close, then bares its
// colours and hops after you.
export class Mimic extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'coin');
        this.revealed = false;
        this.nextHop = 0;
    }

    setup() {
        this.body.setAllowGravity(false);
        this.setImmovable(true);
        this.body.setSize(44, 44);
        // idle like a real coin
        this.idle = this.scene.tweens.add({ targets: this, scaleX: 0.9, duration: 700, yoyo: true, repeat: -1 });
    }

    update(time) {
        if (!this.active) return;
        if (!this.revealed) {
            if (Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y) < 230 * (this.scene.perks?.detection ?? 1)) this.reveal(time);
            return;
        }
        if (this.body.blocked.down && time > this.nextHop) {
            this.nextHop = time + 650;
            const dir = this.player.x < this.x ? -1 : 1;
            this.setVelocity(dir * 300 * this.speedScale, -560);
        }
        if (this.body.blocked.down && time > this.nextHop - 500) this.setVelocityX(0);
    }

    reveal(time) {
        this.revealed = true;
        this.idle.remove();
        this.setScale(1).setTint(0xff6b5e);
        this.alert('!');
        this.scene.tweens.add({ targets: this, scale: 1.25, duration: 120, yoyo: true });
        this.body.setAllowGravity(true);
        this.setGravityY(700).setCollideWorldBounds(true);
        this.nextHop = time + 250;
    }
}
