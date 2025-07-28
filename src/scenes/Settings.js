export class Settings extends Phaser.Scene {
    constructor() {
        super('Settings');
    }

    create() {
        // Background for Settings Menu
        this.add.image(400, 300, 'background');

       
        // Back Button to return to the Main Menu
        let backButton = this.add.sprite(400, 350, 'button').setInteractive();
        backButton.on('pointerdown', () => {
            this.scene.start('MainMenu');  // Go back to main menu
        });

        this.add.text(380, 320, 'Back to Menu', { fontSize: '24px', fill: '#fff' });
    }
}
