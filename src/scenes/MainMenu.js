import { API_URL } from '../config.js';
import { getAlgorithmForLevel, fetchLevelData } from '../levels.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';

export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    preload() {
    }

    create() {
        const screenWidth = 1920;
        const screenHeight = 1080;

        const userSettings=this.registry.get('userSettings');
        this.sound.pauseAll();
        if (!this.sound.get('bg_music')) {
            this.music = this.sound.add('bg_music', {
                loop: true,
                volume: userSettings.music_volume / 100
            });
        }
            this.music.play();

        document.body.style.backgroundColor = '#ffffff';

        // Title (in canvas)
        this.add.text(screenWidth / 2 - 150, 100, 'Main Menu', {
            fontSize: '64px',
            fill: '#000',
            fontFamily: 'Arial',
        });
        // Phaser in-canvas coin display (top-right, tilted)
        const coinCount = this.registry.get('user').coins || 0;

        this.add.text(screenWidth - 300, 100, `💰 Coins: ${coinCount}`, {
            fontSize: '32px',
            fill: '#222',
            fontFamily: 'Arial',
            fontStyle: 'bold',
        }).setAngle(-10);

        // Inventory Display
        const inventory = this.registry.get('inventory') || [];
        const inventoryWrapper = document.createElement('div');
        inventoryWrapper.id = 'inventory-wrapper';
        document.body.appendChild(inventoryWrapper);

        let inventoryHTML = '<h3>Inventory</h3>';
        if (inventory.length === 0) {
            inventoryHTML += '<p>No items yet!</p>';
        } else {
            inventoryHTML += '<ul>';
            inventory.forEach(entry => {
                let itemName = entry.item.name;
                if (itemName && itemName.toLowerCase() === 'bomb') itemName = '💣 Bomb';
                if (itemName && itemName.toLowerCase() === 'wall') itemName = '🧱 Wall';
                inventoryHTML += `<li>${itemName} x ${entry.quantity}</li>`;
            });
            inventoryHTML += '</ul>';
        }
        inventoryWrapper.innerHTML = inventoryHTML;


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

            #inventory-wrapper {
                position: absolute;
                top: 100px;
                left: 20px;
                padding: 15px;
                background: #f0f0f0;
                border: 2px solid #000;
                border-radius: 10px;
                width: 250px;
                font-family: Arial, sans-serif;
            }

            #inventory-wrapper h3 {
                margin: 0 0 10px 0;
                padding-bottom: 5px;
                border-bottom: 1px solid #ccc;
                font-size: 20px;
            }

            #inventory-wrapper ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            #inventory-wrapper li {
                font-size: 16px;
                margin-bottom: 5px;
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
            inventoryWrapper.remove();
            this.scene.start('Login');
        };
        this.events.on('shutdown', () => {
            document.getElementById('menu-wrapper')?.remove();
            document.getElementById('inventory-wrapper')?.remove();
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
            const response = await fetch(`${API_URL}/logout`, {
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
        const response = await fetch(`${API_URL}/scores`, {
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

    async loadNextLevelData() {
        const token = this.registry.get('token');
        const nextLevel = await this.getNextLevel(token);
        const algorithm = getAlgorithmForLevel(nextLevel);
        const levelData = await fetchLevelData(algorithm, nextLevel);

        this.scene.start('Game', {
            levelId: nextLevel,
            levelData: levelData,
        });
    }
}
