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
            <h2>Controls</h2>
            <div class="setting-group"><label>Jump Key: <input type="text" id="jump-key"></label></div>
            <div class="setting-group"><label>Shoot Key: <input type="text" id="shoot-key"></label></div>
            <div class="setting-group"><label>Move Left Key: <input type="text" id="left-key"></label></div>
            <div class="setting-group"><label>Move Right Key: <input type="text" id="right-key"></label></div>
            <div class="setting-group"><label>Place Wall Key: <input type="text" id="place-wall-key"></label></div>
            <button class="menu-btn" id="back-btn">Back to Menu</button>
        `;

        this.addDOMStyles();
        this.loadSettings();
    }
    loadSettings() {
        const data = this.registry.get('userSettings');  
        console.log("settings",data)
        if (!data) {
            console.error("No settings in registry.");
            return;
        }

        const { master_volume, music_volume, sfx_volume, keyboard_bindings } = data;

        const updateDisplay = () => {
            document.getElementById('master-val').textContent = master.value;
            document.getElementById('music-val').textContent = music.value;
            document.getElementById('sfx-val').textContent = sfx.value;
        };

        const master = document.getElementById('master-volume');
        const music = document.getElementById('music-volume');
        const sfx = document.getElementById('sfx-volume');

        master.value = master_volume;
        music.value = music_volume;
        sfx.value = sfx_volume;
        updateDisplay();

        master.oninput = updateDisplay;
        music.oninput = updateDisplay;
        sfx.oninput = updateDisplay;

        document.getElementById('jump-key').value = keyboard_bindings.jump;
        document.getElementById('shoot-key').value = keyboard_bindings.shoot;
        document.getElementById('left-key').value = keyboard_bindings.move_left;
        document.getElementById('right-key').value = keyboard_bindings.move_right;
        document.getElementById('place-wall-key').value = keyboard_bindings.place_wall;

        document.getElementById('back-btn').onclick = async () => {
            await this.saveSettings();
            document.getElementById('settings-wrapper')?.remove();
            this.scene.start('MainMenu');
        };
    }


    async saveSettings() {
        const token = this.registry.get('token');

        const payload = {
            "master_volume": parseInt(document.getElementById('master-volume').value),
            "music_volume": parseInt(document.getElementById('music-volume').value),
            "sfx_volume": parseInt(document.getElementById('sfx-volume').value),
            "keyboard_bindings": {
                jump: document.getElementById('jump-key').value,
                shoot: document.getElementById('shoot-key').value,
                move_left: document.getElementById('left-key').value,
                move_right: document.getElementById('right-key').value,
                place_wall: document.getElementById('place-wall-key').value,
            }
        };
        console.log("payload", payload)
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
            this.registry.set('userSettings', payload);  // Update in registry

            console.log("Settings updated successfully");

        } catch (err) {
            console.error("Failed to save settings:", err);
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

            #settings-wrapper h2 {
                font-size: 32px;
                margin: 20px 0 10px 0;
            }

            .setting-group {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                width: 300px;
                font-size: 20px;
                padding: 10px;
            }

            .setting-group input[type="range"] {
                width: 100%;
            }

            .setting-group input[type="text"] {
                font-size: 18px;
                padding: 5px;
                width: 100%;
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
        `;
        document.head.appendChild(style);
    }
}
