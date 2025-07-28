export class Shop extends Phaser.Scene {
    constructor() {
        super('Shop');
    }

    preload() {
        this.load.image('button', 'button.png');
        this.load.image('background', 'background.png');
    }

    create() {
        // Set screen width and height
        const screenWidth = 1920;
        const screenHeight = 1080;

        // Add background image
        this.add.image(screenWidth / 2, screenHeight / 2, 'background');

        // Shop content (e.g., items for purchase)
        this.add.text(screenWidth / 2 - 100, 100, 'Welcome to the Shop!', { fontSize: '32px', fill: '#fff' });

        // Example button for buying an item
        let buyItemButton = this.add.sprite(screenWidth / 2, 250, 'button').setInteractive().setDisplaySize(400, 100);
        buyItemButton.on('pointerdown', () => {
            console.log("Item purchased!");
            // Logic to handle item purchase (e.g., update inventory, decrease currency)
        });

        this.add.text(screenWidth / 2 - 70, 230, 'Buy Item', { fontSize: '32px', fill: '#fff' });

        // Back Button to return to Main Menu
        let backButton = this.add.sprite(screenWidth / 2, 500, 'button').setInteractive().setDisplaySize(400, 100);
        backButton.on('pointerdown', () => {
            this.scene.start('MainMenu');  // Go back to main menu
        });

        this.add.text(screenWidth / 2 - 60, 480, 'Back to Menu', { fontSize: '32px', fill: '#fff' });
    }
}
