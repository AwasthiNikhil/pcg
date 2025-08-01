import { LoadingSpinner } from '../components/LoadingSpinner.js';

export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    preload() {
        // No need for button image anymore
    }

    create() {
        const screenWidth = 1920;
        const screenHeight = 1080;

        document.body.style.backgroundColor = '#ffffff';

        // Title (in canvas)
        this.add.text(screenWidth / 2 - 150, 100, 'Main Menu', {
            fontSize: '64px',
            fill: '#000',
            fontFamily: 'Arial',
        });
        // Phaser in-canvas coin display (top-right, tilted)
        const coinCount = this.registry.get('user').coins || 0;

        const coinText = this.add.text(screenWidth - 300, 100, `💰 Coins: ${coinCount}`, {
            fontSize: '32px',
            fill: '#222',
            fontFamily: 'Arial',
            fontStyle: 'bold',
        }).setAngle(-10);


        // Wrapper div for buttons
        const wrapper = document.createElement('div');
        wrapper.id = 'menu-wrapper';
        document.body.appendChild(wrapper);

        // Add buttons to the wrapper
        wrapper.innerHTML = `
            <button class="menu-btn" id="play">Play</button>
            <button class="menu-btn" id="leaderboard">Leaderboard</button>
            <button class="menu-btn" id="shop">Shop</button>
            <button class="menu-btn" id="settings">Settings</button>
            <button class="menu-btn" id="help">Help</button>
            <button class="menu-btn" id="logout">Log Out</button>
            <p id="error-msg"></p>
        `;

        // Add styling via JS
        const style = document.createElement('style');
        style.textContent = `
            #menu-wrapper {
                position: absolute;
                top: 30%;
                left: 50%;
                transform: translate(-50%, -25%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
                font-family: Arial, sans-serif;
            }

            .menu-btn {
                width: 400px;
                padding: 20px;
                font-size: 24px;
                background: white;
                border: 2px solid black;
                color: black;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .menu-btn:hover {
                background: black;
                color: white;
            }

            #error-msg {
                color: red;
                font-size: 18px;
                margin-top: 10px;
                height: 24px;
            }

        `;
        document.head.appendChild(style);

        // Get references to buttons
        const playBtn = document.getElementById('play');
        const leaderboardBtn = document.getElementById('leaderboard');
        const shopBtn = document.getElementById('shop');
        const settingsBtn = document.getElementById('settings');
        const helpBtn = document.getElementById('help');
        const logoutBtn = document.getElementById('logout');
        this.errorMessage = document.getElementById('error-msg');

        // Bind events
        playBtn.onclick = async () => {
            LoadingSpinner.show("Loading Level. Have patience...");

            try {
                await this.loadNextLevelData();
            } catch (error) {
                console.error('Error loading level:', error);
                this.showErrorMessage('Failed to load next level!');
            } finally {
                LoadingSpinner.hide();
            }
        };

        leaderboardBtn.onclick = () => this.scene.start('Leaderboard');
        shopBtn.onclick = () => this.scene.start('Shop');
        settingsBtn.onclick = () => this.scene.start('Settings');
        helpBtn.onclick = () => this.scene.start('Help');

        logoutBtn.onclick = async () => {
            const token = this.registry.get('token');
            await this.logout(token);
            this.registry.remove('user');
            this.registry.remove('token');
            wrapper.remove(); // Remove UI
            this.scene.start('Login');
        };
        this.events.on('shutdown', () => {
            document.getElementById('menu-wrapper')?.remove();
        });
    }

    showErrorMessage(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
        }
    }

    async logout(token) {
        LoadingSpinner.show("See ya player...");

        try {
            const response = await fetch('http://localhost:8000/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();
            if (response.status !== 200) {
                this.showErrorMessage('Invalid token!');
            }
        } catch (error) {
            console.error('Error logging out:', error);
            this.showErrorMessage('Error logging out!');
        }finally{
            LoadingSpinner.hide();
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
        if (level <= 5) return 1;
        if (level <= 10) return 4;
        if (level <= 15) return 6;
        if (level <= 20) return 2;
        return 7;
    }

    async fetchLevelData(algorithmId, levelId) {
        const baseUrl = `http://localhost:5000/generate/${algorithmId}`;
        const params = new URLSearchParams({
            x: (25 + Math.floor(levelId / 2)).toString(),
            y: (25 + Math.floor(levelId / 2)).toString(),
            wall_probability: (0.4 + (levelId * 0.005)).toFixed(2) * 100,
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
}
