import { Player } from '../gameObjects/Player.js';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        this.levelId = data.levelId;
        this.levelData = data.levelData;
    }

    create() {
        const grid = this.levelData.grid;
        const tileSize = 64; // Keep original tile size.

        // Set camera bounds to match the grid size.
        this.physics.world.setBounds(0, 0, grid[0].length * tileSize, grid.length * tileSize);
        this.cameras.main.setBounds(0, 0, grid[0].length * tileSize, grid.length * tileSize);

        // Set camera zoom level
        const zoomLevel = 2; // Zoom level, adjust as needed
        this.cameras.main.setZoom(zoomLevel);  // Zooms in by 50% (or out if < 1)

        // Create walls as usual
        this.walls = this.physics.add.staticGroup();
        this.floorGroup = this.physics.add.staticGroup();  // Group for floor tiles
        this.floorGroup.setDepth(0);

        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const tile = grid[row][col];
                const x = col * tileSize;
                const y = row * tileSize;

                if (tile === "1") {
                    this.add.image(x, y, 'floor').setOrigin(0); // just visual
                } else if (tile === "2") {
                    const wall = this.walls.create(x + tileSize / 2, y + tileSize / 2, 'wall');
                    wall.setOrigin(0.5);
                    wall.refreshBody(); // ensure physics body is updated
                    wall.tileX = col; // store the tile position in the grid
                    wall.tileY = row;
                }
            }
        }

        const validSpots = this.findValid2x2Spots(grid);

        if (validSpots.length < 2) {
            console.error("No valid start/exit positions found");
            this.scene.start('MainMenu'); // fallback
            return;
        }

        // Sort by distance from origin, then pick furthest
        validSpots.sort((a, b) => {
            const da = a.x * a.x + a.y * a.y;
            const db = b.x * b.x + b.y * b.y;
            return da - db;
        });

        const playerStart = validSpots[0];
        const exitSpot = validSpots[validSpots.length - 1];

        const playerX = playerStart.x * tileSize + tileSize / 2;
        const playerY = playerStart.y * tileSize + tileSize / 2;
        this.player = new Player(this, playerX, playerY);
        this.player.setDepth(10);
        this.physics.add.collider(this.player, this.walls);


        const exitX = exitSpot.x * tileSize + tileSize / 2;
        const exitY = exitSpot.y * tileSize + tileSize / 2;

        // After calculating exitX and exitY
        this.exitZone = this.add.zone(exitX, exitY, tileSize, tileSize);
        this.physics.world.enable(this.exitZone);
        this.exitZone.body.setAllowGravity(false);
        this.exitZone.body.setImmovable(true);
        // Detect overlap between player and exit
        this.physics.add.overlap(this.player, this.exitZone, this.onLevelComplete, null, this);
        this.add.image(exitX, exitY, 'exit').setOrigin(0.5);

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Define controls (WASD and spacebar for shooting)
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shoot: Phaser.Input.Keyboard.KeyCodes.SPACE,
            placeWall: Phaser.Input.Keyboard.KeyCodes.E
        });

        // Handle bomb collisions with walls
        this.physics.add.collider(this.player.bombs, this.walls, this.handleBombCollision, null, this);
    }

    onLevelComplete() {
        this.scene.start('LevelComplete', {
            levelId: this.levelId,
            levelData: this.levelData
        });
    }
    findValid2x2Spots(grid, floorValue = "1") {
        const positions = [];
        const height = grid.length;
        const width = grid[0].length;

        for (let y = 0; y < height - 1; y++) {
            for (let x = 0; x < width - 1; x++) {
                if (
                    grid[y][x] === floorValue &&
                    grid[y][x + 1] === floorValue &&
                    grid[y + 1][x] === floorValue &&
                    grid[y + 1][x + 1] === floorValue
                ) {
                    positions.push({ x, y });
                }
            }
        }

        return positions;
    }


    collectStar(player, star) {
        star.disableBody(this, this);

        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);

        if (this.stars.countActive(true) === 0) {
            this.stars.children.iterate(function (child) {
                child.enableBody(true, child.x, 0, true, true)
            });
            this.releaseBomb();
        }
    }
    placeWall() {
        const tileSize = 64;
        const playerTileX = Math.floor(this.player.x / tileSize);
        const playerTileY = Math.floor(this.player.y / tileSize);

        // Offset based on player facing direction
        const dx = this.player.lastDirection === 'left' ? -1 : 1;
        const targetX = playerTileX + dx;
        const targetY = playerTileY;

        // Bounds check
        const grid = this.levelData.grid;
        if (
            targetX < 0 || targetX >= grid[0].length ||
            targetY < 0 || targetY >= grid.length
        ) return;

        // Prevent placing on existing walls or other obstacles
        if (grid[targetY][targetX] === "2") return;

        // Update grid
        grid[targetY][targetX] = "2";

        // Create the wall in the scene
        const wall = this.walls.create(targetX * tileSize + tileSize / 2, targetY * tileSize + tileSize / 2, 'wall');
        wall.setOrigin(0.5);
        wall.refreshBody();
        wall.tileX = targetX;
        wall.tileY = targetY;
    }
    handleBombCollision = (bomb, wall) => {
        const tileSize = 64;

        // Find center wall tile
        const centerX = wall.tileX;
        const centerY = wall.tileY;

        // Loop through 2x2 area: top-left to bottom-right
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                const tx = centerX + dx;
                const ty = centerY + dy;

                // Bounds check
                if (
                    ty >= 0 &&
                    ty < this.levelData.grid.length &&
                    tx >= 0 &&
                    tx < this.levelData.grid[0].length
                ) {
                    if (this.levelData.grid[ty][tx] === "2") {
                        // Remove from walls group
                        const wallToRemove = this.walls.getChildren().find(w => w.tileX === tx && w.tileY === ty);
                        if (wallToRemove) {
                            wallToRemove.disableBody(true, true);
                            this.walls.remove(wallToRemove, true, true);
                        }

                        // Replace with floor in data and visually
                        this.levelData.grid[ty][tx] = "1";
                        this.floorGroup.create(tx * tileSize + 32, ty * tileSize + 32, 'floor').setOrigin(0.5);
                    }
                }
            }
        }

        // Remove bomb immediately
        bomb.disableBody(true, true);

        // Optional: add explosion particle/sound here
    };


    update() {
        const { left, right, up, shoot } = this.keys;

        if (left.isDown) {
            this.player.moveLeft();
        } else if (right.isDown) {
            this.player.moveRight();
        } else {
            this.player.idle();
        }

        if (Phaser.Input.Keyboard.JustDown(up)) {
            this.player.jump();
        }

        if (Phaser.Input.Keyboard.JustDown(shoot)) {
            this.player.shootBomb();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.placeWall)) {
            this.placeWall();
        }

    }
}
