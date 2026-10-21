import { mountScreen } from '../ui/dom.js';

export class PauseMenu extends Phaser.Scene {
    constructor() {
        super('PauseMenu');
    }

    create() {
        const screen = mountScreen(this, `
            <div class="center">
                <div class="card" role="dialog" aria-modal="true" aria-labelledby="pause-title">
                    <div>
                        <span class="eyebrow">Game paused</span>
                        <h1 class="title" id="pause-title">Take a breath</h1>
                    </div>
                    <div class="actions">
                        <button class="btn btn--primary btn--lg" id="resume">Resume</button>
                        <button class="btn" id="menu">Quit to menu</button>
                    </div>
                    <p class="muted">Press Esc to resume. Quitting ends this run.</p>
                </div>
            </div>
        `, 'screen--dim');

        const resume = () => {
            this.scene.stop();
            this.scene.resume('Game');
        };
        screen.querySelector('#resume').onclick = resume;
        screen.querySelector('#resume').focus();
        screen.querySelector('#menu').onclick = () => {
            this.scene.stop('Game');
            this.scene.start('MainMenu');
        };
        this.input.keyboard.once('keydown-ESC', resume);
    }
}
