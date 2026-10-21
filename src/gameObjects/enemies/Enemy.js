export const TILE = 128;

// Is there a clear line between two points? Walks the level grid in small
// steps rather than testing every wall body.
export function lineOfSight(grid, x1, y1, x2, y2) {
    const steps = Math.ceil(Phaser.Math.Distance.Between(x1, y1, x2, y2) / 32);
    for (let i = 1; i < steps; i++) {
        const x = x1 + (x2 - x1) * (i / steps), y = y1 + (y2 - y1) * (i / steps);
        if (grid[Math.floor(y / TILE)]?.[Math.floor(x / TILE)] === '2') return false;
    }
    return true;
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    // ghost enemies pass through walls
    ghost = false;

    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.player = scene.player;
        this.grid = scene.levelData.grid;
        // enemies get a little faster as levels go up (up to +50%)
        this.speedScale = 1 + Math.min(0.5, (scene.levelId - 1) * 0.02);
    }

    // Body settings go here: adding a sprite to a physics group resets them.
    // Don't make moving enemies immovable: Arcade physics never separates two
    // immovable bodies, and walls are static, so they'd sink through floors.
    setup() {}

    solidAt(x, y) {
        return this.grid[Math.floor(y / TILE)]?.[Math.floor(x / TILE)] === '2';
    }

    canSee(range) {
        const p = this.player;
        // a stealthy loadout shrinks how far enemies notice you
        return Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y) < range * (this.scene.perks?.detection ?? 1)
            && lineOfSight(this.grid, this.x, this.y, p.x, p.y);
    }

    alert(text = '!') {
        this.scene.popText(this.x, this.y - 50, text, '#ff6b5e');
    }
}
