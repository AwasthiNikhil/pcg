// import { Physics } from 'phaser';

export class PatrollingEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'spike'); // Using 'bomb' as a placeholder texture

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBounce(0);
        this.setGravityY(500); // Match player gravity

        // Initial movement direction
        this.setVelocityX(100);
        this.body.setImmovable(true);
    }

    update() {
        // This is a simple way to make the enemy patrol.
        // It reverses direction when it hits a wall.
        if (this.body.blocked.right) {
            this.setVelocityX(-100);
        } else if (this.body.blocked.left) {
            this.setVelocityX(100);
        }
    }
}
