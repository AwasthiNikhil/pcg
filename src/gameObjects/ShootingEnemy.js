import { Projectile } from './Projectile.js';

export class ShootingEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, projectiles) {
        super(scene, x, y, 'shooter'); // Using 'spike' texture

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setImmovable(true);
        this.body.setAllowGravity(false);

        this.projectiles = projectiles;
        this.player = scene.player;

        // Fire every 2 seconds
        this.fireTimer = scene.time.addEvent({
            delay: 2000,
            callback: this.fireProjectile,
            callbackScope: this,
            loop: true
        });
    }

    fireProjectile() {
        // Only fire if the player is within a certain range
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
        if (distance > 800) {
            return; // Player is too far, don't fire
        }

        console.log('shoot');
        const projectile = this.projectiles.getFirstDead(false);
        if (projectile) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y);
            const velocityX = Math.cos(angle) * 300; // 300 is projectile speed
            const velocityY = Math.sin(angle) * 300;
            
            projectile.fire(this.x, this.y, velocityX, velocityY);
        }
    }

    // Call this method when the enemy is destroyed to clean up the timer
    destroy(fromScene) {
        this.fireTimer.remove();
        super.destroy(fromScene);
    }
}
