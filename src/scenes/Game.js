import { Player } from '../gameObjects/Player.js';
import { PatrollingEnemy } from '../gameObjects/PatrollingEnemy.js';
import { ShootingEnemy } from '../gameObjects/ShootingEnemy.js';
import { ChasingEnemy } from '../gameObjects/ChasingEnemy.js';
import { Projectile } from '../gameObjects/Projectile.js';

const BOMB_ITEM_ID = 3; // From temp.txt output
const WALL_ITEM_ID = 2; // From temp.txt output

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }
    init(data) {
        this.levelId = data.levelId;
        this.levelData = data.levelData;
    }
    create() {

        this.userSettings = this.registry.get('userSettings');

        this.sound.pauseAll();
        this.ingame_sound = this.sound.add('ingame', {
            loop: true,
            volume: this.userSettings.music_volume / 100
        });
        this.ingame_sound.play();

        // Inventory tracking
        this.spentResources = {}; // { item_id: quantity_spent }
        this.playerInventory = {}; // { item_id: current_quantity }

        const inventoryFromRegistry = this.registry.get('inventory') || [];
        inventoryFromRegistry.forEach(entry => {
            this.playerInventory[entry.item.id] = entry.quantity;
        });

        const grid = this.levelData.grid;
        const tileSize = 128;

        // Set camera bounds to match the grid size
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


        const bindings = this.userSettings.keyboard_bindings;
        this.keys = this.input.keyboard.addKeys({
            up: bindings.jump,
            left: bindings.move_left,
            // down: bindings.down,
            right: bindings.move_right,
            shoot: bindings.shoot,
            placeWall: bindings.place_wall,
            placeWallBelow: bindings.place_wall_below
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

        // When 'Escape' key is pressed, pause game and open pause menu
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.pause(); // Pause current game scene
            this.scene.launch('PauseMenu'); // Launch pause menu scene
        });

        this.events.on('shutdown', this.shutdown, this); // Add shutdown listener

        // --- Enemy Setup ---
        this.patrollingEnemies = this.physics.add.group({ classType: PatrollingEnemy, runChildUpdate: true });
        this.shootingEnemies = this.physics.add.group({ classType: ShootingEnemy, runChildUpdate: true });
        this.chasingEnemies = this.physics.add.group({ classType: ChasingEnemy, runChildUpdate: true });

        this.projectiles = this.physics.add.group({ classType: Projectile, runChildUpdate: true });
        this.projectiles.createMultiple({ key: 'star', quantity: 10, active: false, visible: false, classType: Projectile });

        // Enemy-world colliders
        this.physics.add.collider(this.patrollingEnemies, this.walls);
        this.physics.add.collider(this.patrollingEnemies, this.floorGroup);
        this.physics.add.collider(this.shootingEnemies, this.walls);
        this.physics.add.collider(this.shootingEnemies, this.floorGroup);
        this.physics.add.collider(this.chasingEnemies, this.walls);
        this.physics.add.collider(this.chasingEnemies, this.floorGroup);

        // Player-enemy colliders
        this.physics.add.overlap(this.player, this.patrollingEnemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.shootingEnemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.chasingEnemies, this.hitEnemy, null, this);

        // Projectile-world/player colliders
        this.physics.add.collider(this.projectiles, this.walls, (projectile) => { projectile.setActive(false); projectile.setVisible(false); });
        this.physics.add.overlap(this.player, this.projectiles, this.hitEnemy, null, this);

        // Player bomb-enemy colliders
        this.physics.add.collider(this.player.bombs, this.patrollingEnemies, this.damageEnemy, null, this);
        this.physics.add.collider(this.player.bombs, this.shootingEnemies, this.damageEnemy, null, this);
        this.physics.add.collider(this.player.bombs, this.chasingEnemies, this.damageEnemy, null, this);

        this.spawnEnemies();
    }

    damageEnemy(bomb, enemy) {
        bomb.disableBody(true, true); // Remove the bomb
        enemy.destroy(); // Remove the enemy
        // Optional: Add an explosion animation or sound effect here
    }

    spawnEnemies() {
        const grid = this.levelData.grid;
        const tileSize = 128;
        const floorSpots = this.findValid2x2Spots(grid);
        Phaser.Utils.Array.Shuffle(floorSpots);

        let spotIndex = 0;

        // Spawn Patrolling Enemies
        if (this.levelId >= 3) {
            const numPatrolling = Math.min(Math.floor((this.levelId - 2) / 2), 2); // Max 2
            for (let i = 0; i < numPatrolling && spotIndex < floorSpots.length; i++, spotIndex++) {
                const spot = floorSpots[spotIndex];
                if (Phaser.Math.Distance.Between(spot.x, spot.y, this.player.x / tileSize, this.player.y / tileSize) < 5) continue;
                const enemyX = spot.x * tileSize + tileSize / 2;
                const enemyY = spot.y * tileSize - tileSize / 2;
                this.patrollingEnemies.get(enemyX, enemyY);
            }
        }

        // Spawn Chasing Enemies
        if (this.levelId >= 10) {
            const numChasing = Math.min(Math.floor((this.levelId - 9) / 2), 2); // Max 2
            for (let i = 0; i < numChasing && spotIndex < floorSpots.length; i++, spotIndex++) {
                const spot = floorSpots[spotIndex];
                if (Phaser.Math.Distance.Between(spot.x, spot.y, this.player.x / tileSize, this.player.y / tileSize) < 10) continue;
                const enemyX = spot.x * tileSize + tileSize / 2;
                const enemyY = spot.y * tileSize - tileSize / 2;
                this.chasingEnemies.get(enemyX, enemyY);
            }
        }

        // Spawn Shooting Enemies
        if (this.levelId >= 15) {
            const numShooting = Math.min(Math.floor((this.levelId - 14) / 2), 2); // Max 2
            for (let i = 0; i < numShooting && spotIndex < floorSpots.length; i++, spotIndex++) {
                const spot = floorSpots[spotIndex];
                if (Phaser.Math.Distance.Between(spot.x, spot.y, this.player.x / tileSize, this.player.y / tileSize) < 8) continue;
                const enemyX = spot.x * tileSize + tileSize / 2;
                const enemyY = spot.y * tileSize + tileSize / 2;
                const shootingEnemy = new ShootingEnemy(this, enemyX, enemyY, this.projectiles);
                this.shootingEnemies.add(shootingEnemy);
            }
        }
    }

    hitEnemy(player, enemy) {
        // If the object hit is a projectile, disable it
        if (enemy instanceof Projectile) {
            enemy.setActive(false);
            enemy.setVisible(false);
        }
        this.onTimerExpired(); // Reuse game over logic
    }

    collectKey(player, key) {
        key.disableBody(true, true);
        this.hasKey = true;
        this.keyText.setText('Key: ✅');

        this.key_suound = this.sound.add('key', {
            loop: false,
            volume: this.userSettings.sfx_volume / 100
        });
        this.key_suound.play();

    }
    async onLevelComplete() {
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

        this.sendSpentResourcesToBackend(); // Send spent items to backend (non-blocking)

        this.scene.start('LevelComplete', {
            levelId: this.levelId,
            levelData: this.levelData,
            coinsCollected: this.coinsCollected,
            totalCoins: this.totalCoins,
            remainingTime: this.remainingTime,
        });
    }
    async addPlayerCoins(coins) {
        const response = await fetch('http://pcg.test/api/addCoin', {
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
    async onTimerExpired() {
        try {
            this.addPlayerCoins(this.coinsCollected); // Call without await
            console.log("Coins added successfully.", this.coinsCollected);
        } catch (error) {
            console.error("Failed to add coins:", error);
            this.showToast("Error adding coins.", 'error'); // Changed to showToast
        }
        
        this.sendSpentResourcesToBackend(); // Send spent items to backend (non-blocking)

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
        
        this.coin_sound = this.sound.add('coin', {
            loop: false,
            volume: this.userSettings.sfx_volume / 100
        });
        this.coin_sound.play();
        
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
    playerPlaceWall() {
        if (this.canUseItem(WALL_ITEM_ID)) {
            this.useItem(WALL_ITEM_ID);
            const tileSize = 128;
            const playerTileX = Math.floor(this.player.x / tileSize);
            const playerTileY = Math.floor(this.player.y / tileSize);

            const dx = this.player.lastDirection === 'left' ? -1 : 1;
            const targetX = playerTileX + dx;
            const targetY = playerTileY;

            const grid = this.levelData.grid;
            if (
                targetX < 0 || targetX >= grid[0].length ||
                targetY < 0 || targetY >= grid.length ||
                grid[targetY][targetX] === "2"
            ) {
                this.returnItem(WALL_ITEM_ID);
                this.showToast('Cannot place wall here!', 'error');
                return;
            }

            grid[targetY][targetX] = "2";
            const wall = this.walls.create(targetX * tileSize + tileSize / 2, targetY * tileSize + tileSize / 2, 'wall');
            wall.setOrigin(0.5);
            wall.refreshBody();
            wall.tileX = targetX;
            wall.tileY = targetY;
        } else {
            this.showToast('No walls left!', 'error');
        }
    }
    playerPlaceWallBelow() {
        if (this.canUseItem(WALL_ITEM_ID)) {
            this.useItem(WALL_ITEM_ID);
            const tileSize = 128;
            const playerTileX = Math.floor(this.player.x / tileSize);
            const playerTileY = Math.floor(this.player.y / tileSize);

            const targetX = playerTileX;
            const targetY = playerTileY + 1;

            const grid = this.levelData.grid;

            if (
                targetX < 0 || targetX >= grid[0].length ||
                targetY < 0 || targetY >= grid.length ||
                grid[targetY][targetX] === "2"
            ) {
                this.returnItem(WALL_ITEM_ID);
                this.showToast('Cannot place wall here!', 'error');
                return;
            }

            grid[targetY][targetX] = "2";
            const wall = this.walls.create(
                targetX * tileSize + tileSize / 2,
                targetY * tileSize + tileSize / 2,
                'wall'
            );
            wall.setOrigin(0.5);
            wall.refreshBody();
            wall.tileX = targetX;
            wall.tileY = targetY;
        } else {
            this.showToast('No walls left!', 'error');
        }
    }

    playerShootBomb() {
        if (this.canUseItem(BOMB_ITEM_ID)) {
            this.useItem(BOMB_ITEM_ID);
            this.player.shootBomb(); // Call the actual player method
        } else {
            this.showToast('No bombs left!', 'error');
        }
    }

    canUseItem(itemId) {
        return (this.playerInventory[itemId] && this.playerInventory[itemId] > 0);
    }

    useItem(itemId) {
        if (this.playerInventory[itemId] > 0) {
            this.playerInventory[itemId]--;
            this.spentResources[itemId] = (this.spentResources[itemId] || 0) + 1;
            // Optional: Update a HUD element for item count
            return true;
        }
        return false;
    }

    returnItem(itemId) {
        this.playerInventory[itemId]++;
        this.spentResources[itemId]--;
    }

    async sendSpentResourcesToBackend() {
        const token = this.registry.get('token');
        if (!token || Object.keys(this.spentResources).length === 0) {
            return; // No token or no items spent
        }

        const spentItemsPayload = Object.keys(this.spentResources).map(itemId => ({
            item_id: parseInt(itemId),
            quantity: this.spentResources[itemId]
        }));

        try {
            const response = await fetch('http://pcg.test/api/inventory/spend', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ spent_items: spentItemsPayload })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to deduct spent items:', errorData.message);
                // Optionally show a toast
            } else {
                console.log('Spent items deducted successfully.');
                // Re-fetch and update registry inventory
                const updatedInventory = await this.fetchUserInventory(token);
                this.registry.set('inventory', updatedInventory);
            }
        } catch (error) {
            console.error('Error sending spent items to backend:', error);
        }
    }

    async fetchUserInventory(token) {
        try {
            const response = await fetch('http://pcg.test/api/inventory', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                return await response.json();
            } else {
                console.error('Failed to fetch inventory:', response.statusText);
                return [];
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
            return [];
        }
    }

    showToast(message, type = 'info') {
        document.getElementById('toast-wrapper')?.remove();

        const toastWrapper = document.createElement('div');
        toastWrapper.id = 'toast-wrapper';
        toastWrapper.className = `toast-${type}`;
        toastWrapper.textContent = message;

        document.body.appendChild(toastWrapper);

        setTimeout(() => {
            toastWrapper.classList.add('visible');
        }, 10);

        setTimeout(() => {
            toastWrapper.classList.remove('visible');
            toastWrapper.addEventListener('transitionend', () => toastWrapper.remove());
        }, 3000);
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
            this.playerShootBomb();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.placeWall)) {
            this.playerPlaceWall();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.placeWallBelow)) {
            this.playerPlaceWallBelow();
        }
    }

    shutdown() {
        // Stop all sounds specific to this scene
        if (this.ingame_sound) {
            this.ingame_sound.stop();
            this.ingame_sound.destroy();
        }
        if (this.coin_sound) this.coin_sound.destroy();
        if (this.key_suound) this.key_suound.destroy();

        // Remove DOM elements created by this scene
        document.getElementById('toast-wrapper')?.remove(); // Ensure toast is removed

        // Destroy Phaser objects that might persist or cause issues
        if (this.timerEvent) this.timerEvent.remove();
        this.player.destroy(); // Destroy player and its associated groups (bombs)
        this.walls.destroy(true);
        this.floorGroup.destroy(true);
        this.coinsGroup.destroy(true);
        if (this.key) this.key.destroy();
        if (this.exitZone) this.exitZone.destroy();

        this.patrollingEnemies.destroy(true);
        this.shootingEnemies.destroy(true);
        this.chasingEnemies.destroy(true);
        this.projectiles.destroy(true);

        // Clear any event listeners that might persist
        this.input.keyboard.off('keydown-ESC');
        this.events.off('shutdown', this.shutdown, this);
    }
}
