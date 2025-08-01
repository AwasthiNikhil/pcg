import { LoadingSpinner } from '../components/LoadingSpinner.js';

export class Settings extends Phaser.Scene {
    constructor() {
        super('Settings');
    }

    create() {
        this.cleanupDOM();

        const wrapper = document.createElement('div');
        wrapper.id = 'settings-wrapper';
        document.body.appendChild(wrapper);

        wrapper.innerHTML = `
           <h1>Settings</h1>

            <details open class="setting-collapse">
            <summary>Volume Settings</summary>
            <div class="setting-group">
                <label>Master Volume: <span id="master-val">0</span>%</label>
                <input type="range" id="master-volume" min="0" max="100">
            </div>
            <div class="setting-group">
                <label>Music Volume: <span id="music-val">0</span>%</label>
                <input type="range" id="music-volume" min="0" max="100">
            </div>
            <div class="setting-group">
                <label>SFX Volume: <span id="sfx-val">0</span>%</label>
                <input type="range" id="sfx-volume" min="0" max="100">
            </div>
            </details>

            <details open class="setting-collapse">
            <summary>Controls</summary>
            <div class="setting-group"><label>Jump Key: <input type="text" id="jump-key"></label></div>
            <div class="setting-group"><label>Shoot Key: <input type="text" id="shoot-key"></label></div>
            <div class="setting-group"><label>Move Left Key: <input type="text" id="left-key"></label></div>
            <div class="setting-group"><label>Move Right Key: <input type="text" id="right-key"></label></div>
            <div class="setting-group"><label>Place Wall Key: <input type="text" id="place-wall-key"></label></div>
            <div class="setting-group"><label>Place Wall Below Key: <input type="text" id="place-wall-below-key"></label></div>
            </details>
            <button class="menu-btn" id="back-btn">Back to Menu</button>
        `;

        this.addDOMStyles();
        this.loadSettings();
    }

    loadSettings() {
        const data = this.registry.get('userSettings');
        console.log("settings", data)
        if (!data) {
            console.error("No settings in registry.");
            return;
        }

        const { master_volume, music_volume, sfx_volume, keyboard_bindings } = data;

        const master = document.getElementById('master-volume');
        const music = document.getElementById('music-volume');
        const sfx = document.getElementById('sfx-volume');

        const updateDisplay = () => {
            document.getElementById('master-val').textContent = master.value;
            document.getElementById('music-val').textContent = music.value;
            document.getElementById('sfx-val').textContent = sfx.value;
        };

        master.value = master_volume;
        music.value = music_volume;
        sfx.value = sfx_volume;
        updateDisplay();

        master.oninput = updateDisplay;
        music.oninput = updateDisplay;
        sfx.oninput = updateDisplay;

        const setKeyInput = (id, code) => {
            const input = document.getElementById(id);
            input.value = this.getKeyName(code);
            input.dataset.code = code;
        };

        setKeyInput('jump-key', keyboard_bindings.jump);
        setKeyInput('shoot-key', keyboard_bindings.shoot);
        setKeyInput('left-key', keyboard_bindings.move_left);
        setKeyInput('right-key', keyboard_bindings.move_right);
        setKeyInput('place-wall-key', keyboard_bindings.place_wall);
        setKeyInput('place-wall-below-key', keyboard_bindings.place_wall_below);

        const bindKeyInput = (inputId) => {
            const input = document.getElementById(inputId);
            input.readOnly = true;
            input.addEventListener('focus', () => {
                const handleKeydown = (e) => {
                    e.preventDefault();
                    const code = e.keyCode;
                    const keyName = this.getKeyName(code);
                    input.value = keyName;
                    input.dataset.code = code;
                    window.removeEventListener('keydown', handleKeydown);
                };
                window.addEventListener('keydown', handleKeydown);
            });
        };

        bindKeyInput('jump-key');
        bindKeyInput('shoot-key');
        bindKeyInput('left-key');
        bindKeyInput('right-key');
        bindKeyInput('place-wall-key');
        bindKeyInput('place-wall-below-key');

        document.getElementById('back-btn').onclick = async () => {
            await this.saveSettings();
            document.getElementById('settings-wrapper')?.remove();
            this.scene.start('MainMenu');
        };
    }

    getKeyName(code) {
        const keys = Object.entries(Phaser.Input.Keyboard.KeyCodes);
        const match = keys.find(([key, value]) => value === code);
        return match ? match[0] : '';
    }


    async saveSettings() {
        const token = this.registry.get('token');

        const payload = {
            "master_volume": parseInt(document.getElementById('master-volume').value),
            "music_volume": parseInt(document.getElementById('music-volume').value),
            "sfx_volume": parseInt(document.getElementById('sfx-volume').value),
            "keyboard_bindings": {
                jump: parseInt(document.getElementById('jump-key').dataset.code || 0),
                shoot: parseInt(document.getElementById('shoot-key').dataset.code || 0),
                move_left: parseInt(document.getElementById('left-key').dataset.code || 0),
                move_right: parseInt(document.getElementById('right-key').dataset.code || 0),
                place_wall: parseInt(document.getElementById('place-wall-key').dataset.code || 0),
                place_wall_below: parseInt(document.getElementById('place-wall-below-key').dataset.code || 0),
            }
        };

        LoadingSpinner.show("Saving user settings.");

        try {
            const res = await fetch('http://localhost:8000/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Settings update failed');
            }

            this.registry.set('userSettings', payload);  // Update registry
            console.log("Settings updated successfully");

        } catch (err) {
            console.error("Failed to save settings:", err);
        } finally {
            LoadingSpinner.hide();
        }
    }

    cleanupDOM() {
        document.getElementById('settings-wrapper')?.remove();
    }

    addDOMStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #settings-wrapper {
                position: absolute;
                top: 10%;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
                font-family: Arial, sans-serif;
                color: black;
            }

            #settings-wrapper h1 {
                font-size: 48px;
                margin-bottom: 10px;
            }

            .setting-group {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                width: 300px;
                font-size: 20px;
                padding: 10px;
            }

            .setting-group input[type="range"],
            .setting-group input[type="text"] {
                width: 100%;
                font-size: 18px;
                padding: 5px;
            }

            .menu-btn {
                width: 300px;
                padding: 15px;
                font-size: 20px;
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

            .setting-collapse {
                width: 320px;
                border: 2px solid black;
                border-radius: 6px;
                padding: 10px;
                background: #f9f9f9;
            }

            .setting-collapse summary {
                font-size: 24px;
                font-weight: bold;
                cursor: pointer;
                outline: none;
                margin-bottom: 10px;
            }
        `;
        document.head.appendChild(style);
    }
}
