import { storedToken, startSession, endSession } from '../session.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';

export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    init() {
    }

    preload() {
        // Progress bar while assets load
        const bar = this.add.rectangle(960 - 240, 540, 0, 4, 0xf5c542).setOrigin(0, 0.5);
        this.add.rectangle(960, 540, 480, 4, 0x2c2c34).setDepth(-1);
        this.load.on('progress', p => { bar.width = 480 * p; });

        this.load.setPath('assets');
        this.load.image('star', 'star.png');
        this.load.image('bomb', 'bomb.png');
        this.load.image('spike', 'spike.png');
        this.load.image('shooter', 'shooter.png');
        this.load.image('floor', 'floor.png');
        this.load.image('wall', 'wall.png');
        this.load.image('exit', 'exit.png');
        this.load.image('coin', 'coin.png'); 
        this.load.image('key', 'key.png'); 
        this.load.image('button', 'button.png');

        this.load.spritesheet(
            'dude',
            'dude.png',
            { frameWidth : 32, frameHeight : 48}
        );

        this.load.audio('bg_music', 'audio/bg_music.mp3');
        this.load.audio('level_complete', 'audio/level_complete.mp3');
        this.load.audio('coin', 'audio/coin.mp3');
        this.load.audio('key', 'audio/key.mp3');
        this.load.audio('ingame', 'audio/ingame.mp3');
    }
    create() {
        // Canvas text needs the web fonts loaded before it is first drawn.
        Promise.all([
            document.fonts.load('700 32px Unbounded'),
            document.fonts.load('800 32px Unbounded'),
            document.fonts.load('600 16px Archivo'),
        ]).catch(() => {}).finally(() => this.resume());
    }

    // Signed in before? Go straight to the menu; otherwise to sign-in.
    async resume() {
        const token = storedToken();
        if (!token) return this.scene.start('Login');
        LoadingSpinner.show('Signing you back in');
        try {
            await startSession(this.registry, token);
            this.scene.start('MainMenu');
        } catch {
            endSession(this.registry); // expired or revoked token
            this.scene.start('Login');
        } finally {
            LoadingSpinner.hide();
        }
    }
}
