import { API_URL } from '../config.js';
import { getAlgorithmForLevel, fetchLevelData } from '../levels.js';
import {LoadingSpinner} from '../components/LoadingSpinner.js';

export class LevelComplete extends Phaser.Scene {
    constructor() {
        super('LevelComplete');
    }
    init(data) {
        this.levelId = data.levelId;
        this.levelData = data.levelData;
        this.coinsCollected = data.coinsCollected;
        this.totalCoins = data.totalCoins;
        this.remainingTime = data.remainingTime;
    }
    create() {

        this.userSettings = this.registry.get('userSettings');
        
        this.level_complete_sound = this.sound.add('level_complete', {
            loop: false,
            volume: this.userSettings.sfx_volume / 100
        });
        this.level_complete_sound.play();

        this.totalScore = 100 + this.coinsCollected * 20 + this.remainingTime * 10;

        // Save score to server
        try {
            this.submitScore(this.levelId, this.totalScore);
        } catch (error) {
            console.error("Failed to submit score:", error);
            this.showErrorMessage("Error saving score.");
        }
        try {
            this.addPlayerCoins(this.coinsCollected * 10);
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
            const algorithm = getAlgorithmForLevel(nextLevel);

            LoadingSpinner.show("Loading next level. Might take some time.");

            try {
                const levelData = await fetchLevelData(algorithm, nextLevel);

                this.scene.start('Game', {
                    levelId: nextLevel,
                    levelData: levelData
                });
            } catch (error) {
                console.error('Failed to load next level:', error);
                this.showErrorMessage('Error loading next level!');
            }finally{
                LoadingSpinner.hide();
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
        const response = await fetch(`${API_URL}/scores`, {
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
        const response = await fetch(`${API_URL}/addCoin`, {
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

    // Display error message if any
    showErrorMessage(message) {
        // Optional: create a visible text label at the top or center
        if (!this.errorText) {
            this.errorText = this.add.text(100, 100, '', { fontSize: '28px', fill: '#ff0000' });
        }
        this.errorText.setText(message);
    }
}
