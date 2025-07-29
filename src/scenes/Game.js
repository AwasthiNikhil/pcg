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
        const tileSize = 128; // Keep original tile size.

        // Set camera bounds to match the grid size.
        this.physics.world.setBounds(0, 0, grid[0].length * tileSize, grid.length * tileSize);
        this.cameras.main.setBounds(0, 0, grid[0].length * tileSize, grid.length * tileSize);

        // Set camera zoom level
        const zoomLevel = 1; // Zoom level, adjust as needed
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

        // Add level text and timer
        // === HUD Setup ===
        const barWidth = 200;
        const barHeight = 20;
        const barX = 20;
        const barY = 20;

        // Full background bar (gray)
        this.timeBarBackground = this.add.rectangle(barX, barY, barWidth, barHeight, 0x444444)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(100);

        // Foreground bar (red, shrinking)
        this.timeBar = this.add.rectangle(barX, barY, barWidth, barHeight, 0xff5555)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(101);

        // Level text beside the bar
        this.levelText = this.add.text(barX + barWidth + 10, barY - 2, `Level ${this.levelId}`, {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0, 0).setScrollFactor(0).setDepth(101);

        this.totalTime = 30 + (this.levelId - 1) * 2;
        this.remainingTime = this.totalTime;

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.remainingTime--;

                // Update bar width based on percentage
                const percent = Phaser.Math.Clamp(this.remainingTime / this.totalTime, 0, 1);
                this.timeBar.scaleX = percent;


                if (this.remainingTime <= 0) {
                    this.onTimerExpired();
                }
            },
            callbackScope: this,
            loop: true
        });

        this.coinText = this.add.text(barX, barY + barHeight + 10, `Coins: 0 / ${this.totalCoins}`, {
            fontSize: '18px',
            fill: '#ffff00'
        }).setOrigin(0, 0).setScrollFactor(0).setDepth(101);

        // coins
        this.coinsCollected = 0;
        this.totalCoins = 3 + this.levelId;
        this.coinsGroup = this.physics.add.staticGroup();
        const floorSpots = this.findValid2x2Spots(grid); // reuse existing valid floor logic
        Phaser.Utils.Array.Shuffle(floorSpots);
        for (let i = 0; i < this.totalCoins && i < floorSpots.length; i++) {
            const spot = floorSpots[i];
            const coinX = spot.x * tileSize + tileSize / 2;
            const coinY = spot.y * tileSize + tileSize / 2;
            const coin = this.coinsGroup.create(coinX, coinY, 'coin').setOrigin(0.5);
        }
        // Set up overlap detection
        this.physics.add.overlap(this.player, this.coinsGroup, this.collectCoin, null, this);

        //key
        this.hasKey = false;
        const keySpot = floorSpots[this.totalCoins]; // Use the next unused spot after coins
        if (keySpot) {
            const keyX = keySpot.x * tileSize + tileSize / 2;
            const keyY = keySpot.y * tileSize + tileSize / 2;
            this.key = this.physics.add.staticImage(keyX, keyY, 'key').setOrigin(0.5);
            this.physics.add.overlap(this.player, this.key, this.collectKey, null, this);
        }

        this.keyText = this.add.text(barX, barY + barHeight + 35, 'Key: ❌', {
            fontSize: '18px',
            fill: '#ffff00'
        }).setOrigin(0, 0).setScrollFactor(0).setDepth(101);


    }
    collectKey(player, key) {
        key.disableBody(true, true);
        this.hasKey = true;
        this.keyText.setText('Key: ✅');
    }
    onLevelComplete() {
        if (!this.hasKey) {
            // Optional: give feedback
            const msg = this.add.text(this.scale.width / 2, this.scale.height / 2 - 100, 'You need the key!', {
                fontSize: '32px',
                fill: '#ff4444',
                backgroundColor: '#000',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

            this.time.delayedCall(1500, () => msg.destroy());
            return;
        }

        if (this.timerEvent) this.timerEvent.remove();

        this.scene.start('LevelComplete', {
            levelId: this.levelId,
            levelData: this.levelData,
            coinsCollected: this.coinsCollected,
            totalCoins: this.totalCoins
        });
    }
    async addPlayerCoins(coins) {
        const response = await fetch('http://localhost:8000/api/addCoin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.registry.get('token')
            },
            body: JSON.stringify({
                coins: coins
            })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add coin');
        }
        return await response.json(); // optional: use returned score data
    }
    onTimerExpired() {
        try {
            this.addPlayerCoins(this.coinsCollected);
            console.log("Coins added successfully.", this.coinsCollected); //TODO: scores check later
        } catch (error) {
            console.error("Failed to add coins:", error);
            this.showErrorMessage("Error addin coins.");
        }
        // Disable player controls or physics
        this.player.setVelocity(0, 0);
        this.player.body.enable = false;

        // Fade camera or dark overlay
        const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7)
            .setOrigin(0).setScrollFactor(0).setDepth(100);

        this.add.text(this.scale.width / 2, this.scale.height / 2 - 50, 'Game Over', {
            fontSize: '48px',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        const buttonStyle = {
            fontSize: '28px',
            fill: '#fff',
            backgroundColor: '#444',
            padding: { x: 20, y: 10 }
        };

        const retryBtn = this.add.text(this.scale.width / 2, this.scale.height / 2 + 30, 'Retry Level', buttonStyle)
            .setOrigin(0.5).setInteractive().setScrollFactor(0).setDepth(101);
        retryBtn.on('pointerdown', () => {
            this.scene.restart({
                levelId: this.levelId,
                levelData: this.levelData
            });
        });

        const menuBtn = this.add.text(this.scale.width / 2, this.scale.height / 2 + 80, 'Main Menu', buttonStyle)
            .setOrigin(0.5).setInteractive().setScrollFactor(0).setDepth(101);
        menuBtn.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });

        // Stop timer if still running
        if (this.timerEvent) this.timerEvent.remove();
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
    collectCoin(player, coin) {
        coin.disableBody(true, true);
        this.coinsCollected++;

        this.coinText.setText(`Coins: ${this.coinsCollected} / ${this.totalCoins}`);

        // Optionally: check if all coins collected
        if (this.coinsCollected === this.totalCoins) {
            this.showAllCoinsCollectedMessage();
        }
    }
    showAllCoinsCollectedMessage() {
        const msg = this.add.text(this.scale.width / 2, 100, 'All coins collected!', {
            fontSize: '24px',
            fill: '#00ff00',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

        this.time.delayedCall(2000, () => {
            msg.destroy();
        });
    }
    placeWall() {
        const tileSize = 128;
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
        const tileSize = 128;

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
                        this.floorGroup.create(tx * tileSize + 64, ty * tileSize + 64, 'floor').setOrigin(0.5);
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
