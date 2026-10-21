export class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'star'); // Using 'star' as a placeholder
    }

    fire(x, y, velocityX, velocityY) {
        this.body.reset(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.body.setAllowGravity(false); // shots fly straight
        this.setVelocity(velocityX, velocityY);
        this.lifespan = 2400;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        this.lifespan -= delta;
        if (this.lifespan <= 0) {
            this.setActive(false);
            this.setVisible(false);
        }
    }
}
