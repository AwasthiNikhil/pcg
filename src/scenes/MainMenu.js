export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    preload() {
        this.load.image('button', 'button.png');  // Example button image
        this.load.image('background', 'background.png');  // Example background
    }

    create() {

        const screenWidth = 1920;
        const screenHeight = 1080;

        // Add background image and scale to fit screen
        this.add.image(screenWidth / 2, screenHeight / 2, 'background').setOrigin(0.5, 0.5);

        // Define button height and vertical spacing between buttons
        const buttonHeight = 100;
        const verticalSpacing = 20;
        const buttonWidth = 400;  // Assuming button width is 400px

        // Calculate the starting Y position to center the buttons
        const startY = (screenHeight - (buttonHeight * 5) - (verticalSpacing * 4)) / 2;

        // Play Button (goes to Game)
        let playButton = this.add.sprite(screenWidth / 2, startY, 'button').setInteractive().setDisplaySize(buttonWidth, buttonHeight);
        playButton.on('pointerdown', () => {
            // this.scene.start('Game');  // Switch to the game scene
            try {
                this.loadNextLevelData();
            } catch (error) {
                console.error('Error loading level:', error);
                this.showErrorMessage('Failed to load next level!');
            }
        });

        // Leaderboard Button (goes to leaderboard)
        let leaderboardButton = this.add.sprite(screenWidth / 2, startY + buttonHeight + verticalSpacing, 'button').setInteractive().setDisplaySize(buttonWidth, buttonHeight);
        leaderboardButton.on('pointerdown', () => {
            this.scene.start('Leaderboard');  // Switch to the game scene
        });

        // Shop Button (opens shop submenu)
        let shopButton = this.add.sprite(screenWidth / 2, startY + (buttonHeight + verticalSpacing) * 2, 'button').setInteractive().setDisplaySize(buttonWidth, buttonHeight);
        shopButton.on('pointerdown', () => {
            this.scene.start('Shop');  // Switch to the shop scene
        });

        // Settings Button (opens settings submenu)
        let settingsButton = this.add.sprite(screenWidth / 2, startY + (buttonHeight + verticalSpacing) * 3, 'button').setInteractive().setDisplaySize(buttonWidth, buttonHeight);
        settingsButton.on('pointerdown', () => {
            this.scene.start('Settings');  // Switch to the settings scene
        });

        // Help Button (opens help screen)
        let helpButton = this.add.sprite(screenWidth / 2, startY + (buttonHeight + verticalSpacing) * 4, 'button').setInteractive().setDisplaySize(buttonWidth, buttonHeight);
        helpButton.on('pointerdown', () => {
            this.scene.start('Help');  // Switch to the help scene
        });

        // Logout Button
        let logout = this.add.sprite(screenWidth / 2, startY + (buttonHeight + verticalSpacing) * 5, 'button').setInteractive().setDisplaySize(buttonWidth, buttonHeight);
        logout.on('pointerdown', () => {
            // remove all data from registry
            const token = this.registry.get('token');
            this.logout(token);

            this.registry.remove('user');
            this.registry.remove('token');

            // redirect to login scene
            this.scene.start('LoginRegister');
        });

        // Add text to buttons, centering them horizontally
        this.add.text(screenWidth / 2 - 50, startY - 30, 'Play', { fontSize: '32px', fill: '#fff' });
        this.add.text(screenWidth / 2 - 50, startY + buttonHeight - 30, 'Leaderboard', { fontSize: '32px', fill: '#fff' });
        this.add.text(screenWidth / 2 - 50, startY + (buttonHeight + verticalSpacing) * 2 - 30, 'Shop', { fontSize: '32px', fill: '#fff' });
        this.add.text(screenWidth / 2 - 60, startY + (buttonHeight + verticalSpacing) * 3 - 30, 'Settings', { fontSize: '32px', fill: '#fff' });
        this.add.text(screenWidth / 2 - 50, startY + (buttonHeight + verticalSpacing) * 4 - 30, 'Help', { fontSize: '32px', fill: '#fff' });
        this.add.text(screenWidth / 2 - 40, startY + (buttonHeight + verticalSpacing) * 5 - 30, 'Log Out', { fontSize: '32px', fill: '#fff' });
    }
    // Send logout request to the backend
    async logout(token) {
        try {
            const response = await fetch('http://localhost:8000/api/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            });

            const data = await response.json();
            if (response.status !== 200) {
                this.showErrorMessage('Invalid token!');
            }
        } catch (error) {
            console.error('Error logging out:', error);
            this.showErrorMessage('Error logging out!');
        }
    }

    async getNextLevel(token) {
        const response = await fetch('http://localhost:8000/api/scores', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch scores');
        }

        const scores = await response.json();

        if (!scores || scores.length === 0) return 1;

        const highestLevel = Math.max(...scores.map(score => score.level));
        return highestLevel + 1;
    }
    getAlgorithmForLevel(level) {
        if (level <= 10) return 1;
        if (level <= 20) return 6;
        return 7;
    }
    async fetchLevelData(algorithmId, levelId) {
        const baseUrl = `http://localhost:5000/generate/${algorithmId}`;

        // Example of dynamic parameters based on level
        const params = new URLSearchParams({
            x: (25 + Math.floor(levelId / 2)).toString(), // Grid size grows slowly
            y: (25 + Math.floor(levelId / 2)).toString(),
            wall_probability: (0.4 + (levelId * 0.005)).toFixed(2)*100, // Slowly increase wall density
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

    async loadNextLevelData() {
        const token = this.registry.get('token');
        const nextLevel = await this.getNextLevel(token);
        const algorithm = this.getAlgorithmForLevel(nextLevel);

        const levelData = await this.fetchLevelData(algorithm, nextLevel);

        this.scene.start('Game', {
            levelId: nextLevel,
            levelData: levelData,
        });
    }

    showErrorMessage(message) {
        // Optional: create a visible text label at the top or center
        if (!this.errorText) {
            this.errorText = this.add.text(100, 100, '', { fontSize: '28px', fill: '#ff0000' });
        }
        this.errorText.setText(message);
    }

}
