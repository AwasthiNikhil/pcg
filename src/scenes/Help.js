import { mountScreen, drawBackdrop, icon, bindingsFor, keyName, onEscape } from '../ui/dom.js';

const K = Phaser.Input.Keyboard.KeyCodes;

const LEVELS = [
    ['1–2', 'Random fill'],
    ['3–4', 'Cellular automata'],
    ['5–6', 'Graph rooms and corridors'],
    ['7–8', 'Perlin noise'],
    ['9–12', 'Rooms stitched from hand-made templates'],
    ['13+', 'Transformer model trained on Lode Runner levels'],
];

export class Help extends Phaser.Scene {
    constructor() {
        super('Help');
    }

    create() {
        drawBackdrop(this, { seed: 'help' });
        const b = bindingsFor(this.registry.get('userSettings'));
        const key = (code) => `<kbd class="keycap">${keyName(code)}</kbd>`;
        const controls = [
            [`${key(b.move_left)} ${key(b.move_right)}`, 'Move'],
            [key(b.jump), 'Jump. Press again in the air to double jump, or off a wall to wall jump'],
            [key(b.dash), 'Dash. Breaks walls and enemies in your way'],
            [`${key(b.dash_down)} ${key(b.dash_down)}`, 'Dash down through the block you land on'],
            [key(b.shoot), 'Throw a bomb. Clears a 2×2 block of walls'],
            [`${key(b.place_wall)} ${key(b.place_wall_below)}`, 'Place a wall ahead of you / below you'],
            [key(K.ESC), 'Pause'],
        ];

        const screen = mountScreen(this, `
            <div class="page">
                <header class="page-head">
                    <div>
                        <button class="back" id="back-btn">Menu</button>
                        <h1 class="title">How to play</h1>
                    </div>
                </header>
                <div class="help">
                    <div class="stack">
                        <section class="panel">
                            <span class="eyebrow">Goal</span>
                            <p>Find the ${icon('key')} key, then reach the exit before the clock runs out.</p>
                            <p class="muted">Each ${icon('coin')} coin adds 2 seconds. Grab coins, or take out enemies, within 2.5 seconds of each other to build a combo. When the target is off screen, an arrow at the edge points to it.</p>
                            <p class="muted">From level 6, lava pools appear on the floor. Jump or dash across them. Enemies get tougher as you go, and new ones turn up without warning.</p>
                        </section>
                        <section class="panel">
                            <span class="eyebrow">Levels</span>
                            <div class="rows">
                                ${LEVELS.map(([range, name]) => `<div class="row"><span class="num">${range}</span><span class="grow">${name}</span></div>`).join('')}
                            </div>
                            <p class="muted note">Every level is generated fresh when you start it, and grows as you progress.</p>
                        </section>
                        <section class="panel">
                            <span class="eyebrow">Characters and skins</span>
                            <p>Each character and skin has a perk, such as running faster, walking on lava, or shrugging off a hit. Some come with a drawback.</p>
                            <p class="muted">Switch characters for free and equip skins in the Locker. Buy skins and gear in the Shop.</p>
                        </section>
                        <section class="panel">
                            <span class="eyebrow">Scoring</span>
                            <p class="formula"><b>100</b> for clearing the level, <b>+25</b> per coin, <b>+30</b> per enemy, <b>+10</b> per second left, <b>+25 ×</b> your best combo, and <b>+100</b> for every coin. Each level is worth <b>10%</b> more than the last.</p>
                            <p class="muted">The leaderboard adds up your best score on each level, so replaying can only improve it. Coins you pick up pay out ×10 when you clear the level and ×5 if you don’t.</p>
                        </section>
                    </div>
                    <section class="panel">
                        <span class="eyebrow">Controls</span>
                        <div class="rows">
                            ${controls.map(([keys, what]) => `<div class="row control-row"><span>${what}</span><span>${keys}</span></div>`).join('')}
                        </div>
                        <p class="muted note">Change any key in Settings. Blocks broken by a dash drop as ${icon('wall')} pickups that refill your walls.</p>
                    </section>
                </div>
            </div>
        `);
        const back = () => this.scene.start('MainMenu');
        screen.querySelector('#back-btn').onclick = back;
        screen.querySelector('#back-btn').focus();
        onEscape(this, back);
    }

}
