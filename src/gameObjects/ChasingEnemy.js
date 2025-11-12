export class ChasingEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'spike');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setGravityY(500);
        this.setTint(0xff0000); // Tint red to differentiate

        this.player = scene.player;
        this.levelData = scene.levelData;
        this.tileSize = 128;

        this.speed = 120; // Slightly slower than patrolling enemy for balance
        this.aggroRadius = 600;
        this.direction = 1; // 1 for right, -1 for left
        this.body.setImmovable(true);
    }

    update(time, delta) {
        if (!this.active) {
            return;
        }

        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
        const isPlayerOnSameLevel = Math.abs(this.y - this.player.y) < this.tileSize;

        // --- Ledge Detection ---
        const probeX = this.x + (this.direction * (this.width / 2 + 10));
        const probeY = this.y + this.height / 2 + 20; // Point just below the enemy's feet

        const probeTileX = Math.floor(probeX / this.tileSize);
        const probeTileY = Math.floor(probeY / this.tileSize);

        let groundAhead = false;
        if (this.levelData.grid[probeTileY] && this.levelData.grid[probeTileY][probeTileX]) {
            const tile = this.levelData.grid[probeTileY][probeTileX];
            if (tile === "1" || tile === "2") { // "1" is floor, "2" is wall
                groundAhead = true;
            }
        }

        // --- AI Decision ---
        let isChasing = false;
        if (distanceToPlayer < this.aggroRadius && isPlayerOnSameLevel) {
            // Check for walls between enemy and player (simple line of sight)
            const line = new Phaser.Geom.Line(this.x, this.y, this.player.x, this.player.y);
            const wallsInSight = this.scene.walls.getMatching('active', true);
            if (!Phaser.Geom.Intersects.LineToRectangle(line, this.player.getBounds())) {
                 //This check is not perfect, but good enough for now
            }

            const wallBlocking = wallsInSight.some(wall => Phaser.Geom.Intersects.LineToRectangle(line, wall.getBounds()));

            if (!wallBlocking) {
                isChasing = true;
            }
        }

        // --- Execution ---
        if (isChasing) {
            // Chase Logic
            this.direction = (this.player.x < this.x) ? -1 : 1;
            if (!groundAhead) {
                // Don't fall off ledge even when chasing
                this.body.setVelocityX(0);
            } else {
                this.body.setVelocityX(this.direction * this.speed);
            }
        } else {
            // Patrol Logic
            if (!groundAhead || this.body.blocked.right || this.body.blocked.left) {
                this.direction *= -1; // Turn around
            }
            this.body.setVelocityX(this.direction * this.speed);
        }

        // Flip sprite based on direction
        this.setFlipX(this.direction > 0);
    }

    destroy(fromScene) {
        // In case we add timers or other resources later
        super.destroy(fromScene);
    }
}
