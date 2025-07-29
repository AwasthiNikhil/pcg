export class LevelComplete extends Phaser.Scene {
    constructor() {
        super('LevelComplete');
    }

    init(data) {
        this.levelId = data.levelId;
        this.levelData = data.levelData;
        this.coinsCollected = data.coinsCollected;
        this.totalCoins = data.totalCoins;
    }
    create() {
        // TODO: get in init later
        this.totalScore = 1000

        // Save score to server
        try {
            this.submitScore(this.levelId, this.totalScore);
            console.log("Score submitted successfully.", this.levelId, this.totalScore); //TODO: scores check later
        } catch (error) {
            console.error("Failed to submit score:", error);
            this.showErrorMessage("Error saving score.");
        }
        try {
            this.addPlayerCoins(this.coinsCollected);
            console.log("Coins added successfully.",  this.coinsCollected); //TODO: scores check later
        } catch (error) {
            console.error("Failed to add coins:", error);
            this.showErrorMessage("Error addin coins.");
        }

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

        // coins collected summary
        this.add.text(screenWidth / 2, screenHeight / 2 - 30, `Coins: ${this.coinsCollected} / ${this.totalCoins}`, {
            fontSize: '28px',
            fill: '#ffff00'
        }).setOrigin(0.5);
    }
    async submitScore(levelId, score) {
        const response = await fetch('http://localhost:8000/api/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.registry.get('token') 
            },
            body: JSON.stringify({
                level: levelId,
                score: score
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to submit score');
        }

        return await response.json(); // optional: use returned score data
    }
    async addPlayerCoins(coins) {
        const response = await fetch('http://localhost:8000/api/addCoin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.registry.get('token') 
            },
            body: JSON.stringify({
                coins: coins
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add coin');
        }

        return await response.json(); // optional: use returned score data
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
