export class PauseMenu extends Phaser.Scene {
    constructor() {
        super('PauseMenu');
    }

    create() {
        // Dim background overlay
        this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.5);

        this.add.text(960, 400, 'Game Paused', {
            fontSize: '64px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        const resumeBtn = this.add.text(960, 500, 'Resume', {
            fontSize: '48px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        const mainMenuBtn = this.add.text(960, 580, 'Main Menu', {
            fontSize: '48px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        resumeBtn.on('pointerdown', () => {
            this.scene.stop();         // Stop pause scene
            this.scene.resume('Game'); // Resume game
        });

        mainMenuBtn.on('pointerdown', () => {
            this.scene.stop('Game');
            this.scene.start('MainMenu');
            this.scene.stop(); // Stop pause scene too
        });

        // Optional: resume with ESC again
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.stop();
            this.scene.resume('Game');
        });
    }
}
