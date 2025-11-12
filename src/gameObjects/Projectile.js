export class Projectile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'star'); // Using 'star' as a placeholder
    }

    fire(x, y, velocityX, velocityY) {
        this.body.reset(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.setVelocity(velocityX, velocityY);

        // Set a random lifespan between 700ms and 1500ms
        this.lifespan = Phaser.Math.Between(700, 1500);
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
