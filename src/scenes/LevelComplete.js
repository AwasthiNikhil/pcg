export class LevelComplete extends Phaser.Scene {
    constructor() {
        super('LevelComplete');
    }

    init(data) {
        this.levelId = data.levelId;
        this.levelData = data.levelData;
    }

    create() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        // Background dim
        this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.7).setOrigin(0);

        this.add.text(screenWidth / 2, screenHeight / 2 - 100, `Level ${this.levelId} Complete!`, {
            fontSize: '48px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const buttonStyle = { fontSize: '32px', fill: '#fff', backgroundColor: '#333', padding: { x: 20, y: 10 } };

        // Play Next Level Button
        const nextButton = this.add.text(screenWidth / 2, screenHeight / 2 + 20, 'Play Next Level', buttonStyle).setOrigin(0.5).setInteractive();
        nextButton.on('pointerdown', async () => {
            const nextLevel = this.levelId + 1;
            const algorithm = this.getAlgorithmForLevel(nextLevel);

            try {
                const response = await fetch(`http://localhost:5000/generate/${algorithm}?x=26&y=26`);
                const levelData = await response.json();

                this.scene.start('Game', {
                    levelId: nextLevel,
                    levelData: levelData
                });
            } catch (error) {
                console.error('Failed to load next level:', error);
            }
        });

        // Return to Main Menu Button
        const menuButton = this.add.text(screenWidth / 2, screenHeight / 2 + 80, 'Main Menu', buttonStyle).setOrigin(0.5).setInteractive();
        menuButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }

    getAlgorithmForLevel(level) {
        if (level <= 10) return 1;
        if (level <= 20) return 6;
        return 7;
    }
}
