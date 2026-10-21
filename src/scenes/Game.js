import { API_URL } from '../config.js';
import { PAYOUT } from '../scoring.js';
import { loadout, equippedSkin } from '../perks.js';
import { mountScreen, toast, bindingsFor } from '../ui/dom.js';
import { Player } from '../gameObjects/Player.js';
import { PatrollingEnemy } from '../gameObjects/PatrollingEnemy.js';
import { ShootingEnemy } from '../gameObjects/ShootingEnemy.js';
import { ChasingEnemy } from '../gameObjects/ChasingEnemy.js';
import { Bat } from '../gameObjects/enemies/Bat.js';
import { Dropper } from '../gameObjects/enemies/Dropper.js';
import { Mimic } from '../gameObjects/enemies/Mimic.js';
import { Phantom } from '../gameObjects/enemies/Phantom.js';
import { Projectile } from '../gameObjects/Projectile.js';

const BOMB_ITEM_ID = 3; // From temp.txt output
const WALL_ITEM_ID = 2; // From temp.txt output

const FONT_DISPLAY = 'Unbounded, Archivo, sans-serif';
const FONT_UI = 'Archivo, sans-serif';
const COLORS = { ink: 0x0e0e10, line: 0x2c2c34, gold: 0xf5c542, danger: 0xff6b5e, ok: 0x7ddc8a };

// Pace tuning
const COIN_TIME_BONUS = 2;      // seconds added per coin
const COMBO_WINDOW_MS = 2500;   // chain coins (or dash kills) inside this to grow the combo
const HURRY_AT = 10;            // seconds left when the music speeds up
const DOUBLE_TAP_MS = 250;      // S twice inside this = dash down

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }
    init(data) {
        this.levelId = data.levelId;
        this.levelData = data.levelData;
    }
    create() {

        this.levelEnded = false;
        this.makeEffectTextures();
        this.combo = 0;
        this.bestCombo = 0;
        this.kills = 0;
        this.comboExpiresAt = 0;
        this.hurry = false;
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
        this.player.setSkin(this.equippedSkinTint());
        this.perks = loadout(this.registry.get('user'), this.registry.get('inventory'));
        this.player.applyPerks(this.perks);
        this.shield = this.perks.shield;
        this.freeBombs = this.perks.freeBombs;
        this.physics.add.collider(this.player, this.walls, null, this.dashBreaksWall, this);

        const exitX = exitSpot.x * tileSize + tileSize / 2;
        const exitY = exitSpot.y * tileSize + tileSize / 2;

        // After calculating exitX and exitY
        this.exitZone = this.add.zone(exitX, exitY, tileSize, tileSize);
        this.physics.world.enable(this.exitZone);
        this.exitZone.body.setAllowGravity(false);
        this.exitZone.body.setImmovable(true);
        // Detect overlap between player and exit
        this.physics.add.overlap(this.player, this.exitZone, this.onLevelComplete, null, this);
        this.exitImage = this.add.image(exitX, exitY, 'exit').setOrigin(0.5);

        this.cameras.main.startFollow(this.player, true, 0.16, 0.16);
        this.lookAhead = 0;

        // Effects
        this.sparks = this.add.particles(0, 0, 'spark', {
            speed: { min: 150, max: 450 }, lifespan: 450, scale: { start: 1, end: 0 },
            gravityY: 600, emitting: false
        }).setDepth(50);
        this.dust = this.add.particles(0, 0, 'spark', {
            speed: { min: 40, max: 140 }, angle: { min: 200, max: 340 }, lifespan: 300,
            scale: { start: 0.8, end: 0 }, tint: 0x999999, alpha: { start: 0.7, end: 0 }, emitting: false
        }).setDepth(9);
        // Blocks knocked loose by a dash: they fall, and picking one up gives a wall
        this.collectedWalls = 0;
        this.blockDrops = this.physics.add.group();
        this.physics.add.collider(this.blockDrops, this.walls);
        this.physics.add.overlap(this.player, this.blockDrops, this.collectBlock, null, this);

        this.player.on('jump', () => this.dust.explode(6, this.player.x, this.player.body.bottom));
        this.player.on('land', () => this.dust.explode(8, this.player.x, this.player.body.bottom));
        this.player.on('dash', () => {
            this.cameras.main.shake(80, 0.004);
            this.dashGhostTimer = 0;
        });


        const bindings = bindingsFor(this.userSettings);
        this.keys = this.input.keyboard.addKeys({
            up: bindings.jump,
            left: bindings.move_left,
            right: bindings.move_right,
            shoot: bindings.shoot,
            placeWall: bindings.place_wall,
            placeWallBelow: bindings.place_wall_below,
            dash: bindings.dash,
            dashDown: bindings.dash_down,
        });

        // Handle bomb collisions with walls
        this.physics.add.collider(this.player.bombs, this.walls, this.handleBombCollision, null, this);

        this.totalTime = 30 + (this.levelId - 1) * 2;
        this.remainingTime = this.totalTime;
        this.buildHud();

        // coins
        this.coinsGroup = this.physics.add.staticGroup();
        const floorSpots = this.findValid2x2Spots(grid); // reuse existing valid floor logic
        Phaser.Utils.Array.Shuffle(floorSpots);
        this.coinsCollected = 0;
        // 3 + level coins, but never more than the map has room for, keeping
        // one spot free for the key; otherwise the level can't be completed.
        this.totalCoins = Math.max(0, Math.min(3 + this.levelId, floorSpots.length - 1));
        this.coinText.setText(`0/${this.totalCoins}`);
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
        // Cells already taken by coins and the key; enemies spawn elsewhere
        this.usedSpots = new Set(floorSpots.slice(0, this.totalCoins + 1).map(s => `${s.x},${s.y}`));
        if (keySpot) {
            const keyX = keySpot.x * tileSize + tileSize / 2;
            const keyY = keySpot.y * tileSize + tileSize / 2;
            this.key = this.physics.add.staticImage(keyX, keyY, 'key').setOrigin(0.5);
            this.tweens.add({ targets: this.key, y: keyY - 12, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            this.physics.add.overlap(this.player, this.key, this.collectKey, null, this);
        }

        // When 'Escape' key is pressed, pause game and open pause menu
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.pause(); // Pause current game scene
            this.scene.launch('PauseMenu'); // Launch pause menu scene
        });

        this.events.on('shutdown', this.shutdown, this); // Add shutdown listener

        // --- Enemy Setup ---
        // All enemies share one group; each sets up its own body in setup().
        this.enemies = this.physics.add.group({ runChildUpdate: true });
        this.projectiles = this.physics.add.group({ classType: Projectile, runChildUpdate: true });
        this.projectiles.createMultiple({ key: 'star', quantity: 12, active: false, visible: false, classType: Projectile });

        // Ghosts (phantoms) pass through walls; everything else collides.
        this.physics.add.collider(this.enemies, this.walls, null, (enemy) => !enemy.ghost);
        this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
        this.physics.add.collider(this.projectiles, this.walls, (projectile) => { projectile.setActive(false); projectile.setVisible(false); });
        this.physics.add.overlap(this.player, this.projectiles, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player.bombs, this.enemies, this.damageEnemy, null, this);

        this.spawnEnemies();
        this.placeLava();
        this.showBanner('GO', '#f4f1ea');
    }

    // Tint of the equipped skin (null for the default look)
    equippedSkinTint() {
        const skin = equippedSkin(this.registry.get('user'), this.registry.get('inventory'));
        return skin?.tint ? Phaser.Display.Color.HexStringToColor(skin.tint).color : null;
    }

    // Top-left HUD: level, countdown, time bar, then coin / key / bomb / wall counters.
    buildHud() {
        const fixed = (o, depth = 101) => o.setScrollFactor(0).setDepth(depth);
        const x = 24, y = 24, w = 520, pad = 22;

        fixed(this.add.rectangle(x, y, w, 140, COLORS.ink, 0.9).setOrigin(0).setStrokeStyle(2, COLORS.line), 99);
        fixed(this.add.text(x + pad, y + 22, `LEVEL ${this.levelId}`, {
            fontFamily: FONT_UI, fontSize: '20px', fontStyle: '600', color: '#a3a097'
        }).setLetterSpacing(3));
        this.timeText = fixed(this.add.text(x + w - pad, y + 12, '', {
            fontFamily: FONT_DISPLAY, fontSize: '40px', fontStyle: '700', color: '#f4f1ea'
        }).setOrigin(1, 0));

        fixed(this.add.rectangle(x + pad, y + 70, w - pad * 2, 6, COLORS.line).setOrigin(0), 100);
        this.timeBar = fixed(this.add.rectangle(x + pad, y + 70, w - pad * 2, 6, COLORS.gold).setOrigin(0));

        // Counters with the game's own sprites as icons
        this.textures.get('bomb').setFilter(Phaser.Textures.FilterMode.NEAREST);
        const slots = [0, 150, 262, 374]; // coin count needs the most room ("23/23")
        const counter = (i, texture) => {
            const cx = x + pad + slots[i];
            const img = fixed(this.add.image(cx + 15, y + 108, texture));
            img.setScale(30 / Math.max(img.width, img.height));
            const text = fixed(this.add.text(cx + 38, y + 108, '0', {
                fontFamily: FONT_DISPLAY, fontSize: '24px', fontStyle: '700', color: '#f4f1ea'
            }).setOrigin(0, 0.5));
            return [img, text];
        };
        [, this.coinText] = counter(0, 'coin');
        [this.keyIcon, this.keyText] = counter(1, 'key');
        this.keyIcon.setAlpha(0.3);
        this.keyText.setText('0/1');
        [, this.bombText] = counter(2, 'bomb');
        [, this.wallText] = counter(3, 'brick');

        this.comboText = fixed(this.add.text(x + 4, y + 156, '', {
            fontFamily: FONT_DISPLAY, fontSize: '26px', fontStyle: '700', color: '#f5c542', stroke: '#0e0e10', strokeThickness: 6
        }));

        // Points to the key, then the exit, when it's off screen
        this.objectiveArrow = this.add.image(0, 0, 'arrow').setScrollFactor(0).setDepth(150).setVisible(false);
        this.updateInventoryDisplay();
    }

    makeEffectTextures() {
        if (this.textures.exists('spark')) return;
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff).fillCircle(6, 6, 6).generateTexture('spark', 12, 12).clear();
        g.fillStyle(0xffffff).lineStyle(4, 0x000000)
            .fillTriangle(4, 4, 44, 24, 4, 44).strokeTriangle(4, 4, 44, 24, 4, 44)
            .generateTexture('arrow', 48, 48).clear();
        g.fillStyle(0x2a2a31).fillRect(0, 0, 36, 36).lineStyle(3, 0xf5c542).strokeRect(1.5, 1.5, 33, 33)
            .lineBetween(0, 18, 36, 18).lineBetween(11, 0, 11, 18).lineBetween(25, 18, 25, 36)
            .generateTexture('brick', 36, 36).clear();
        // bat: body and two wings, red eyes
        g.fillStyle(0x3b2f5e)
            .fillTriangle(0, 10, 30, 18, 14, 34).fillTriangle(72, 10, 42, 18, 58, 34)
            .fillCircle(36, 22, 14)
            .fillStyle(0xff6b5e).fillCircle(31, 20, 3).fillCircle(41, 20, 3)
            .generateTexture('bat', 72, 40).clear();
        // phantom: rounded head, wavy hem, hollow eyes
        g.fillStyle(0xe8e4ff)
            .fillCircle(32, 30, 28).fillRect(4, 30, 56, 34)
            .fillStyle(0x0e0e10).fillCircle(4 + 9, 68, 9).fillCircle(32, 68, 9).fillCircle(60 - 9, 68, 9)
            .fillCircle(22, 30, 6).fillCircle(42, 30, 6)
            .generateTexture('phantom', 64, 72).clear();
        // crawler (patroller) and hunter (chaser): a spiked dome with eyes
        const crawler = (key, body, eye) => {
            g.fillStyle(0x9a9aa6);
            for (let i = 0; i < 5; i++) g.fillTriangle(8 + i * 11, 18, 14 + i * 11, 2, 20 + i * 11, 18);
            g.fillStyle(body).fillEllipse(32, 30, 60, 30).fillRect(4, 30, 56, 14)
                .fillStyle(0xf4f1ea).fillCircle(22, 30, 7).fillCircle(42, 30, 7)
                .fillStyle(eye).fillCircle(24, 31, 3.5).fillCircle(44, 31, 3.5)
                .generateTexture(key, 64, 44).clear();
        };
        crawler('crawler', 0x2a2a33, 0x0e0e10);
        crawler('hunter', 0xc2412f, 0x0e0e10);
        // icicle (dropper): hangs point-down
        g.fillStyle(0x1a1a1f).fillTriangle(0, 0, 44, 0, 22, 80)
            .fillStyle(0xbcd3e6).fillTriangle(4, 2, 40, 2, 22, 72)
            .fillStyle(0x0e0e10).fillCircle(16, 14, 3.5).fillCircle(28, 14, 3.5)
            .generateTexture('icicle', 44, 80).clear();
        // cannon: dome on a base plate with a sensor eye; the barrel is separate so it can aim
        g.fillStyle(0x1a1a1f).fillRect(0, 34, 72, 14)
            .fillStyle(0x2a2a33).fillCircle(36, 34, 26).fillRect(10, 30, 52, 6)
            .fillStyle(0x9a9aa6).fillRect(0, 44, 72, 4)
            .fillStyle(0xff6b5e).fillCircle(36, 30, 6)
            .generateTexture('cannon', 72, 48).clear();
        g.fillStyle(0x3a3a45).fillRect(0, 3, 52, 14)
            .fillStyle(0x9a9aa6).fillRect(46, 0, 8, 20)
            .generateTexture('cannon-barrel', 54, 20);
        g.destroy();
    }

    // Big centred text that pops in and fades, e.g. GO! / HURRY!
    showBanner(text, color) {
        const banner = this.add.text(this.scale.width / 2, this.scale.height / 2 - 160, text, {
            fontFamily: FONT_DISPLAY, fontSize: '104px', fontStyle: '800', fill: color, stroke: '#0e0e10', strokeThickness: 12
        }).setOrigin(0.5).setScrollFactor(0).setDepth(300).setScale(1.6).setAlpha(0);
        this.tweens.add({ targets: banner, scale: 1, alpha: 1, duration: 180, ease: 'Back.easeOut' });
        this.tweens.add({ targets: banner, alpha: 0, delay: 650, duration: 300, onComplete: () => banner.destroy() });
    }

    // Small text that floats up from a world position
    popText(x, y, text, color = '#ffffff') {
        const t = this.add.text(x, y, text, {
            fontFamily: FONT_DISPLAY, fontSize: '30px', fontStyle: '700', fill: color, stroke: '#0e0e10', strokeThickness: 6
        }).setOrigin(0.5).setDepth(60);
        this.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 700, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
    }

    bumpCombo(x, y) {
        const now = this.time.now;
        this.combo = now < this.comboExpiresAt ? this.combo + 1 : 1;
        this.comboExpiresAt = now + COMBO_WINDOW_MS;
        this.bestCombo = Math.max(this.bestCombo, this.combo);
        if (this.combo > 1) this.popText(x, y - 40, `×${this.combo}`, '#f5c542');
    }

    killEnemy(enemy) {
        this.kills++;
        this.sparks.explode(18, enemy.x, enemy.y);
        this.cameras.main.shake(120, 0.006);
        this.bumpCombo(enemy.x, enemy.y);
        enemy.destroy();
    }

    damageEnemy(bomb, enemy) {
        bomb.disableBody(true, true);
        this.killEnemy(enemy);
    }

    // Which enemies appear, from which level, and how many. New types arrive
    // unannounced; the Help screen doesn't list them.
    spawnEnemies() {
        const L = this.levelId;
        const grid = this.levelData.grid;
        const T = 128;
        const start = { x: this.player.x / T, y: this.player.y / T };
        const awayFromStart = (spot, min) => Phaser.Math.Distance.Between(spot.x, spot.y, start.x, start.y) >= min;
        const pick = (spots, n, min) => Phaser.Utils.Array.Shuffle(spots.filter(s => awayFromStart(s, min) && !this.usedSpots.has(`${s.x},${s.y}`))).slice(0, n)
            .map(s => { this.usedSpots.add(`${s.x},${s.y}`); return s; });
        const count = (from, every, max, base = 1) => L < from ? 0 : Math.min(max, base + Math.floor((L - from) / every));
        const add = (enemy) => { this.enemies.add(enemy); enemy.setup(); };

        const open = this.findValid2x2Spots(grid);                 // 2x2 floor: standing room
        const ceilings = [];                                        // floor under a wall, with room to fall
        for (let y = 1; y < grid.length - 3; y++) for (let x = 0; x < grid[0].length; x++) {
            if (grid[y - 1][x] === '2' && grid[y][x] === '1' && grid[y + 1][x] === '1' && grid[y + 2][x] === '1') ceilings.push({ x, y });
        }
        const centre = (s) => [s.x * T + T / 2, s.y * T + T / 2];
        const ground = [];                                          // floor cells with solid ground under them
        for (let y = 0; y < grid.length - 1; y++) for (let x = 0; x < grid[0].length; x++) {
            if (grid[y][x] === '1' && grid[y + 1][x] === '2' && grid[y - 1]?.[x] === '1') ground.push({ x, y });
        }

        pick(open, count(2, 3, 3), 5).forEach(s => add(new PatrollingEnemy(this, s.x * T + T / 2, s.y * T + T / 2)));
        pick(ground, count(4, 4, 2), 7).forEach(s => add(new ShootingEnemy(this, s.x * T + T / 2, (s.y + 1) * T - 24, this.projectiles)));
        pick(open, count(5, 3, 3), 6).forEach(s => add(new Bat(this, s.x * T + T, s.y * T + T / 2)));
        pick(open, count(7, 4, 2), 9).forEach(s => add(new ChasingEnemy(this, ...centre(s))));
        pick(ceilings, count(9, 3, 4, 2), 4).forEach(s => add(new Dropper(this, s.x * T + T / 2, s.y * T + 36)));
        pick(open, count(12, 4, 2), 6).forEach(s => add(new Mimic(this, ...centre(s))));
        pick(open, count(15, 5, 2), 12).forEach(s => add(new Phantom(this, ...centre(s))));
    }

    // From level 6: single-tile lava pools on the floor. They're never wider
    // than one tile, so a jump or a dash always gets you across.
    placeLava() {
        this.lava = this.physics.add.staticGroup();
        if (this.levelId < 6) return;
        const grid = this.levelData.grid, T = 128;
        const start = { x: Math.floor(this.player.x / T), y: Math.floor(this.player.y / T) };
        const exit = { x: Math.floor(this.exitZone.x / T), y: Math.floor(this.exitZone.y / T) };
        const cells = [];
        for (let y = 0; y < grid.length - 1; y++) for (let x = 1; x < grid[0].length - 1; x++) {
            const ok = grid[y][x] === '1' && grid[y + 1][x] === '2'
                && Math.abs(x - start.x) + Math.abs(y - start.y) > 4 && !(x === exit.x && y === exit.y)
                && !this.usedSpots.has(`${x},${y}`) && !this.usedSpots.has(`${x},${y - 1}`);
            if (ok) cells.push({ x, y });
        }
        const want = Math.min(8, 2 + Math.floor((this.levelId - 6) / 2));
        const taken = new Set();
        for (const c of Phaser.Utils.Array.Shuffle(cells)) {
            if (taken.size >= want) break;
            if (taken.has(`${c.x - 1},${c.y}`) || taken.has(`${c.x + 1},${c.y}`)) continue; // keep pools one tile wide
            taken.add(`${c.x},${c.y}`);
            const pool = this.add.rectangle(c.x * T + T / 2, c.y * T + T - 18, T, 36, 0xff5a1f).setDepth(5);
            this.add.rectangle(c.x * T + T / 2, c.y * T + T - 36, T, 4, 0xffc247).setDepth(5);
            this.tweens.add({ targets: pool, alpha: 0.75, duration: 500 + Math.random() * 300, yoyo: true, repeat: -1 });
            this.lava.add(pool);
        }
        this.physics.add.overlap(this.player, this.lava, () => {
            if (this.perks.lavaProof || this.levelEnded || this.player.dashing) return;
            this.cameras.main.flash(250, 255, 120, 40);
            this.endLevel(false, 'lava');
        });
    }

    hitEnemy(player, enemy) {
        // If the object hit is a projectile, disable it
        if (enemy instanceof Projectile) {
            enemy.setActive(false);
            enemy.setVisible(false);
            if (player.isDashAttacking(this.time.now)) return; // dashing shrugs off shots
        } else if (player.isDashAttacking(this.time.now)) {
            this.killEnemy(enemy); // the dash is a weapon
            player.dashReadyAt = this.time.now; // and chains into the next dash
            return;
        }
        if (this.levelEnded || this.time.now < (this.invulnerableUntil || 0)) return;
        if (this.shield > 0) {
            // Warrior perk: absorb the hit, flash, and get a moment to escape
            this.shield--;
            this.invulnerableUntil = this.time.now + 1200;
            if (!(enemy instanceof Projectile)) this.killEnemy(enemy);
            this.popText(player.x, player.y - 50, 'Shield broken', '#f4f1ea');
            this.tweens.add({ targets: player, alpha: 0.3, duration: 100, yoyo: true, repeat: 5 });
            this.cameras.main.shake(120, 0.006);
            return;
        }
        this.cameras.main.shake(200, 0.01);
        this.cameras.main.flash(200, 255, 60, 60);
        this.endLevel(false);
    }

    collectKey(player, key) {
        key.disableBody(true, true);
        this.hasKey = true;
        this.keyText.setText('1/1');
        this.keyIcon.setAlpha(1);
        this.sparks.explode(24, key.x, key.y);
        this.popText(key.x, key.y, 'Exit open', '#7ddc8a');

        this.key_suound = this.sound.add('key', {
            loop: false,
            volume: this.userSettings.sfx_volume / 100
        });
        this.key_suound.play();

    }

    onLevelComplete() {
        if (!this.hasKey) {
            if (this.time.now < (this.needKeyUntil || 0)) return;
            this.needKeyUntil = this.time.now + 1500;
            this.popText(this.player.x, this.player.y - 50, 'Find the key first', '#ff6b5e');
            this.tweens.add({ targets: this.keyIcon, alpha: 1, duration: 120, yoyo: true, repeat: 3 });
            return;
        }
        this.endLevel(true);
    }

    async addPlayerCoins(coins) {
        const response = await fetch(`${API_URL}/addCoin`, {
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
        this.endLevel(false, 'time');
    }

    async endLevel(isComplete, reason = 'caught') {
        if (this.levelEnded) {
            return; // Prevent multiple executions
        }
        this.levelEnded = true;

        this.player.setVelocity(0, 0);
        this.player.body.enable = false;

        // --- Backend and Registry Updates ---
        try {
            // This runs for both win and lose scenarios
            // One payout per attempt: more for clearing the level than for dying in it
            this.payout = Math.round(this.coinsCollected * (isComplete ? PAYOUT.win : PAYOUT.loss) * this.perks.payout);
            if (this.payout > 0) {
                await this.addPlayerCoins(this.payout);
                const user = this.registry.get('user');
                if (user) {
                    user.coins += this.payout;
                    this.registry.set('user', user);
                }
            }

            await this.sendSpentResourcesToBackend();

        } catch (error) {
            console.error("API Error on level end:", error);
            toast('Couldn’t save your progress.', 'error');
        }

        // --- Scene Transition or Game Over UI ---
        if (isComplete) {
            this.scene.start('LevelComplete', {
                levelId: this.levelId,
                levelData: this.levelData,
                coinsCollected: this.coinsCollected,
                totalCoins: this.totalCoins,
                remainingTime: Math.floor(this.remainingTime),
                bestCombo: this.bestCombo,
                kills: this.kills,
                payout: this.payout,
            });
        } else {
            this.showGameOver(reason);
        }
    }

    showGameOver(reason) {
        const screen = mountScreen(this, `
            <div class="center">
                <div class="card" role="dialog" aria-modal="true" aria-labelledby="over-title">
                    <div>
                        <span class="eyebrow">Level ${this.levelId}</span>
                        <h1 class="title" id="over-title">${{ time: 'Out of time', lava: 'Burned' }[reason] || 'Caught'}</h1>
                    </div>
                    <div class="stats">
                        <div class="stat"><span class="eyebrow">Coins</span><b>${this.coinsCollected}/${this.totalCoins}</b></div>
                        <div class="stat"><span class="eyebrow">Best combo</span><b>${this.bestCombo > 1 ? `×${this.bestCombo}` : '—'}</b></div>
                    </div>
                    <p class="muted">${this.payout ? `You keep ${this.payout} coins from this run. ` : ''}Same level, same layout. Try a faster route.</p>
                    <div class="actions">
                        <button class="btn btn--primary btn--lg" id="retry">Retry level</button>
                        <button class="btn" id="menu">Main menu</button>
                    </div>
                </div>
            </div>
        `, 'screen--dim');
        screen.querySelector('#retry').focus();
        screen.querySelector('#retry').onclick = () => this.scene.restart({ levelId: this.levelId, levelData: this.levelData });
        screen.querySelector('#menu').onclick = () => this.scene.start('MainMenu');
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
        this.remainingTime = Math.min(this.totalTime, this.remainingTime + COIN_TIME_BONUS);
        this.sparks.explode(14, coin.x, coin.y);
        this.popText(coin.x, coin.y, `+${COIN_TIME_BONUS}s`, '#f4f1ea');
        this.bumpCombo(coin.x, coin.y);
        this.coinText.setText(`${this.coinsCollected}/${this.totalCoins}`);
        
        this.coin_sound = this.sound.add('coin', {
            loop: false,
            volume: this.userSettings.sfx_volume / 100,
            rate: Math.min(1.6, 1 + 0.08 * (this.combo - 1)) // pitch climbs with the combo
        });
        this.coin_sound.play();
        
        // Optionally: check if all coins collected
        if (this.coinsCollected === this.totalCoins) {
            this.showAllCoinsCollectedMessage();
        }
    }
    showAllCoinsCollectedMessage() {
        this.popText(this.player.x, this.player.y - 90, 'All coins', '#f5c542');
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
                toast('No room for a wall there.', 'error');
                return;
            }

            grid[targetY][targetX] = "2";
            const wall = this.walls.create(targetX * tileSize + tileSize / 2, targetY * tileSize + tileSize / 2, 'wall');
            wall.setOrigin(0.5);
            wall.refreshBody();
            wall.tileX = targetX;
            wall.tileY = targetY;
        } else {
            toast('No walls left. Dash through blocks or buy more in the shop.', 'error');
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
                toast('No room for a wall there.', 'error');
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
            toast('No walls left. Dash through blocks or buy more in the shop.', 'error');
        }
    }

    playerShootBomb() {
        if (this.freeBombs > 0) {
            // Archer perk: a free bomb each level, used before your own
            this.freeBombs--;
            this.updateInventoryDisplay();
            this.player.shootBomb();
        } else if (this.canUseItem(BOMB_ITEM_ID)) {
            this.useItem(BOMB_ITEM_ID);
            this.player.shootBomb(); // Call the actual player method
        } else {
            toast('No bombs left. Buy more in the shop.', 'error');
        }
    }

    canUseItem(itemId) {
        return (this.playerInventory[itemId] && this.playerInventory[itemId] > 0);
    }

    useItem(itemId) {
        if (this.playerInventory[itemId] > 0) {
            this.playerInventory[itemId]--;
            this.spentResources[itemId] = (this.spentResources[itemId] || 0) + 1;
            this.updateInventoryDisplay(); // Update HUD
            return true;
        }
        return false;
    }

    returnItem(itemId) {
        this.playerInventory[itemId]++;
        this.spentResources[itemId]--;
        this.updateInventoryDisplay(); // Update HUD
    }

    updateInventoryDisplay() {
        this.bombText.setText(`${(this.playerInventory[BOMB_ITEM_ID] || 0) + (this.freeBombs || 0)}`);
        this.wallText.setText(`${this.playerInventory[WALL_ITEM_ID] || 0}`);
    }

    async sendSpentResourcesToBackend() {
        const token = this.registry.get('token');
        if (!token) return;

        // Net change per item: spent minus picked up (dash-broken blocks give walls)
        const net = { ...this.spentResources };
        net[WALL_ITEM_ID] = (net[WALL_ITEM_ID] || 0) - this.collectedWalls;
        const spent = Object.entries(net).filter(([, q]) => q > 0);
        const gained = Object.entries(net).filter(([, q]) => q < 0);
        if (!spent.length && !gained.length) return;

        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' };
        try {
            if (spent.length) {
                const response = await fetch(`${API_URL}/inventory/spend`, {
                    method: 'POST', headers,
                    body: JSON.stringify({ spent_items: spent.map(([id, q]) => ({ item_id: parseInt(id), quantity: q })) })
                });
                if (!response.ok) console.error('Failed to deduct spent items:', (await response.json()).message);
            }
            for (const [id, q] of gained) {
                const response = await fetch(`${API_URL}/inventory`, {
                    method: 'POST', headers,
                    body: JSON.stringify({ item_id: parseInt(id), quantity: -q })
                });
                if (!response.ok) console.error('Failed to add collected items:', (await response.json()).message);
            }
            this.registry.set('inventory', await this.fetchUserInventory(token));
        } catch (error) {
            console.error('Error syncing inventory with backend:', error);
        }
    }

    async fetchUserInventory(token) {
        try {
            const response = await fetch(`${API_URL}/inventory`, {
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


    // Collider process callback: a wall in the dash's path breaks instead of
    // stopping the player. Floor/ceiling tiles (not level with the player) don't.
    dashBreaksWall(player, wall) {
        if (!player.dashing) return true;
        if (player.dashDown) {
            // break whatever is under the body (both tiles if straddling), then fall through
            if (wall.y <= player.y || Math.abs(wall.x - player.x) >= 64 + player.body.width / 2 - 2) return true;
            for (let tx = Math.floor(player.body.left / 128); tx <= Math.floor((player.body.right - 1) / 128); tx++) {
                if (this.breakWall(tx, wall.tileY)) this.dropBlock(tx * 128 + 64, wall.tileY * 128 + 64);
            }
            this.sparks.explode(20, player.x, player.body.bottom);
            this.cameras.main.shake(140, 0.009);
            player.endDash(this.time.now);
            return false;
        }
        const ahead = player.dashDir > 0 ? wall.x > player.x : wall.x < player.x;
        if (!ahead || Math.abs(wall.y - player.y) >= 80) return true;
        if (this.breakWall(wall.tileX, wall.tileY)) this.dropBlock(wall.x, wall.y);
        this.sparks.explode(12, wall.x, player.y);
        this.cameras.main.shake(90, 0.005);
        return false;
    }

    dropBlock(x, y) {
        const block = this.blockDrops.create(x, y, 'brick').setDepth(20);
        block.setBounce(0.3).setCollideWorldBounds(true).setDragX(300);
        block.setVelocity(Phaser.Math.Between(-140, 140), -260);
        block.pickableAt = this.time.now + 300; // let it pop out before it can be grabbed
    }

    collectBlock(player, block) {
        if (this.time.now < block.pickableAt) return;
        block.destroy();
        this.playerInventory[WALL_ITEM_ID] = (this.playerInventory[WALL_ITEM_ID] || 0) + 1;
        this.collectedWalls++;
        this.updateInventoryDisplay();
        this.popText(player.x, player.y - 40, '+1 wall', '#f4f1ea');
    }

    // Returns true if a wall was there and got broken
    breakWall(tx, ty) {
        const grid = this.levelData.grid;
        if (grid[ty]?.[tx] !== "2") return false;
        const wall = this.walls.getChildren().find(w => w.tileX === tx && w.tileY === ty);
        if (wall) {
            wall.disableBody(true, true);
            this.walls.remove(wall, true, true);
        }
        grid[ty][tx] = "1";
        this.floorGroup.create(tx * 128 + 64, ty * 128 + 64, 'floor').setOrigin(0.5);
        return true;
    }

    handleBombCollision = (bomb, wall) => {
        // Clear the 2x2 area from the wall that was hit
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                this.breakWall(wall.tileX + dx, wall.tileY + dy);
            }
        }

        // Remove bomb immediately
        bomb.disableBody(true, true);
        this.sparks.explode(20, bomb.x, bomb.y);
        this.cameras.main.shake(150, 0.008);
    };
    update(time, delta) {
        if (this.levelEnded) return;
        const { left, right, up, shoot, dash } = this.keys;

        // Down-dash: double tap (S by default)
        let dashDown = false;
        if (Phaser.Input.Keyboard.JustDown(this.keys.dashDown)) {
            dashDown = time - (this.lastDownTap ?? -1e9) < DOUBLE_TAP_MS;
            this.lastDownTap = dashDown ? -1e9 : time;
        }

        this.player.handleInput({
            left: left.isDown,
            right: right.isDown,
            jumpPressed: Phaser.Input.Keyboard.JustDown(up),
            jumpHeld: up.isDown,
            dash: Phaser.Input.Keyboard.JustDown(dash),
            dashDown,
        }, time, delta);

        if (Phaser.Input.Keyboard.JustDown(shoot)) {
            this.playerShootBomb();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.placeWall)) {
            this.playerPlaceWall();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.placeWallBelow)) {
            this.playerPlaceWallBelow();
        }

        this.tickTimer(delta);
        this.tickCombo(time);
        this.tickCamera(delta);
        this.tickDashGhosts(delta);
        this.tickObjectiveArrow();
        this.tickBlockDrops(time);
    }

    // Loose blocks drift to you once they've popped out, so they're never lost down a hole
    tickBlockDrops(time) {
        for (const block of this.blockDrops.getChildren()) {
            if (!block.active || time < block.pickableAt) continue;
            if (Phaser.Math.Distance.Between(block.x, block.y, this.player.x, this.player.y) < 260) {
                block.body.setAllowGravity(false);
                this.physics.moveToObject(block, this.player, 700);
            }
        }
    }

    tickTimer(delta) {
        this.remainingTime = Math.max(0, this.remainingTime - delta / 1000);
        this.timeBar.scaleX = Phaser.Math.Clamp(this.remainingTime / this.totalTime, 0, 1);
        this.timeText.setText(`${this.remainingTime.toFixed(1)}s`);

        if (!this.hurry && this.remainingTime <= HURRY_AT) {
            this.hurry = true;
            this.showBanner('HURRY', '#ff6b5e');
            this.ingame_sound.setRate(1.25);
            this.timeBar.setFillStyle(COLORS.danger);
            this.hurryTween = this.tweens.add({ targets: this.timeBar, alpha: 0.35, duration: 220, yoyo: true, repeat: -1 });
        } else if (this.hurry && this.remainingTime > HURRY_AT) {
            // coins can buy you out of hurry mode
            this.hurry = false;
            this.ingame_sound.setRate(1);
            this.hurryTween?.remove();
            this.timeBar.setAlpha(1).setFillStyle(COLORS.gold);
        }
        if (this.remainingTime <= 0) this.onTimerExpired();
    }

    tickCombo(time) {
        if (this.combo > 1 && time < this.comboExpiresAt) {
            this.comboText.setText(`COMBO ×${this.combo}`).setAlpha(0.4 + 0.6 * (this.comboExpiresAt - time) / COMBO_WINDOW_MS);
        } else {
            this.comboText.setText('');
        }
    }

    // Lead the camera in the direction of travel so you can see where you're going.
    tickCamera(delta) {
        const target = Phaser.Math.Clamp(this.player.body.velocity.x * 0.35, -260, 260);
        this.lookAhead += (target - this.lookAhead) * Math.min(1, 4 * delta / 1000);
        this.cameras.main.setFollowOffset(-this.lookAhead, 0);
    }

    tickDashGhosts(delta) {
        if (!this.player.dashing) return;
        this.dashGhostTimer -= delta;
        if (this.dashGhostTimer > 0) return;
        this.dashGhostTimer = 22;
        const ghost = this.add.image(this.player.x, this.player.y, 'dude', this.player.frame.name)
            .setTint(0x66e0ff).setAlpha(0.6).setDepth(9);
        this.tweens.add({ targets: ghost, alpha: 0, duration: 220, onComplete: () => ghost.destroy() });
    }

    tickObjectiveArrow() {
        const target = this.hasKey ? this.exitImage : this.key;
        if (!target) return this.objectiveArrow.setVisible(false);
        const view = this.cameras.main.worldView;
        if (view.contains(target.x, target.y)) return this.objectiveArrow.setVisible(false);

        const angle = Phaser.Math.Angle.Between(view.centerX, view.centerY, target.x, target.y);
        const margin = 60;
        const cx = this.scale.width / 2, cy = this.scale.height / 2;
        // push from the screen centre along the angle until we hit the inset edge
        const dx = Math.cos(angle), dy = Math.sin(angle);
        const t = Math.min((cx - margin) / Math.abs(dx || 1e-6), (cy - margin) / Math.abs(dy || 1e-6));
        this.objectiveArrow
            .setVisible(true)
            .setPosition(cx + dx * t, cy + dy * t)
            .setRotation(angle)
            .setTint(this.hasKey ? COLORS.ok : COLORS.gold);
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
        
        // Destroy Phaser objects that might persist or cause issues
        this.player.destroy(); // Destroy player and its associated groups (bombs)
        this.sparks.destroy();
        this.dust.destroy();
        this.walls.destroy(true);
        this.floorGroup.destroy(true);
        this.coinsGroup.destroy(true);
        this.lava?.destroy(true);
        this.blockDrops.destroy(true);
        if (this.key) this.key.destroy();
        if (this.exitZone) this.exitZone.destroy();

        this.enemies.destroy(true);
        this.projectiles.destroy(true);

        // Clear any event listeners that might persist
        this.input.keyboard.off('keydown-ESC');
        this.events.off('shutdown', this.shutdown, this);
    }
}
