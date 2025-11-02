export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    init() {
    }

    preload() {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');
        this.load.image('star', 'star.png');
        this.load.image('bomb', 'bomb.png');
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
        // this.load.audio('jump', 'audio/jump.wav');
        // this.load.audio('game_over', 'audio/game_over.wav');

    }
    create() {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('Login');
    }
}
