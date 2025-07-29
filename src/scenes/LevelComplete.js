export class LevelComplete extends Phaser.Scene {
    constructor() {
        super('LevelComplete');
    }

    init(data) {
        this.levelId = data.levelId;
        this.levelData = data.levelData;
        this.coinsCollected = this.coinsCollected;
        this.totalCoins = this.totalCoins;
    }

    create() {
        console.log("coins collected", this.coinsCollected);
        console.log("coins total", this.totalCoins);
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
                const levelData = await this.fetchLevelData(algorithm, nextLevel);

                this.scene.start('Game', {
                    levelId: nextLevel,
                    levelData: levelData
                });
            } catch (error) {
                console.error('Failed to load next level:', error);
                this.showErrorMessage('Error loading next level!');
            }
        });

        // Return to Main Menu Button
        const menuButton = this.add.text(screenWidth / 2, screenHeight / 2 + 80, 'Main Menu', buttonStyle).setOrigin(0.5).setInteractive();
        menuButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }

    // Calculate algorithm based on level number
    getAlgorithmForLevel(level) {
        if (level <= 10) return 1;
        if (level <= 20) return 6;
        return 7;
    }

    // Fetch level data dynamically
    async fetchLevelData(algorithmId, levelId) {
        const baseUrl = `http://localhost:5000/generate/${algorithmId}`;

        // Dynamic parameters based on level
        const params = new URLSearchParams({
            x: (25 + Math.floor(levelId / 2)).toString(), // Grid size grows slowly
            y: (25 + Math.floor(levelId / 2)).toString(),
            wall_probability: (0.4 + (levelId * 0.005)).toFixed(2) * 100, // Slowly increase wall density
            iterations: (1 + Math.floor(levelId / 5)).toString(),
            min_leaf_size: Math.max(5, 8 - Math.floor(levelId / 10)).toString(),
            max_leaf_size: Math.min(20, 15 + Math.floor(levelId / 10)).toString(),
            max_rooms: Math.min(25, 10 + levelId).toString()
        });

        const response = await fetch(`${baseUrl}?${params.toString()}`);

        if (!response.ok) {
            throw new Error('Failed to fetch level data');
        }

        return await response.json();
    }

    // Display error message if any
    showErrorMessage(message) {
        // Optional: create a visible text label at the top or center
        if (!this.errorText) {
            this.errorText = this.add.text(100, 100, '', { fontSize: '28px', fill: '#ff0000' });
        }
        this.errorText.setText(message);
    }
}
