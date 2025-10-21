import { LoadingSpinner } from '../components/LoadingSpinner.js';

export class Settings extends Phaser.Scene {
    constructor() {
        super('Settings');
    }

    create() {
        this.cleanupDOM();
        const user = this.registry.get('user');
        const wrapper = document.createElement('div');
        wrapper.id = 'settings-wrapper';
        document.body.appendChild(wrapper);

        wrapper.innerHTML = `
           <h1>Settings</h1>

            <details open class="setting-collapse">
                <summary>Account Info</summary>
                <div class="setting-group">
                    
<div class="profile-container">
    <label><span id="username">demo_user</span></label>
    <label><span id="email">user@example.com</span></label>
    <label><span id="country">Nepal</span></label>
    <img src="assets/avatars/avatar1.png" alt="Avatar" width="100" height="100">
    <button class="menu-btn" id="change-password-btn">Change Password</button>

    <form id="password-form" class="password-form">
        <label for="old-password">Old Password</label>
        <input type="password" id="old-password" name="old_password" required>

        <label for="new-password">New Password</label>
        <input type="password" id="new-password" name="new_password" required>

        <label for="confirm-password">Confirm Password</label>
        <input type="password" id="confirm-password" name="confirm_password" required>

        <button type="submit">Submit</button>
    </form>
</div>
                </div>
            </details>

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
        const passwordForm = document.getElementById('password-form');

        passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const oldPassword = document.getElementById('old-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            alert('New password and confirmation do not match.');
            return;
        }

        // Example request (replace URL with your real API endpoint)
        fetch('http://pcg.test/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer YOUR_TOKEN' // Include token if needed
            },
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword
            })
        })
        .then(res => res.json())
        .then(data => {
            alert('Password changed successfully!');
            passwordForm.reset();
            passwordForm.style.display = 'none';
            changeBtn.textContent = 'Change Password';
        })
        .catch(err => {
            console.error(err);
            alert('Failed to change password.');
        });
    });
    document.getElementById('change-password-btn').onclick = () => {
        passwordForm.style.display = passwordForm.style.display === 'block' ? 'none' : 'block';
        changeBtn.textContent = passwordForm.style.display === 'block' ? 'Cancel' : 'Change Password';
    };
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
            const res = await fetch('http://pcg.test/api/settings', {
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

    .profile-container {
        border-radius: 16px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        text-align: center;
    }

    .profile-container label {
        display: block;
        text-align: left;
        font-weight: 500;
        margin: 10px 0 5px;
    }

    .profile-container span {
        font-weight: 400;
        color: #555;
    }

    .profile-container img {
        border-radius: 50%;
        margin: 15px 0;
        object-fit: cover;
    }

    .menu-btn {
        background-color: #6c63ff;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 15px;
        cursor: pointer;
        font-weight: 500;
        transition: background 0.2s;
    }

    .menu-btn:hover {
        background-color: #5848e5;
    }

    .password-form {
        margin-top: 20px;
        display: none;
        text-align: left;
    }

    .password-form input {
        width: 100%;
        padding: 8px 10px;
        margin: 8px 0;
        border: 1px solid #ccc;
        border-radius: 6px;
        font-size: 14px;
    }

    .password-form button {
        width: 100%;
        background-color: #6c63ff;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px;
        margin-top: 10px;
        cursor: pointer;
        font-weight: 500;
    }

    .password-form button:hover {
        background-color: #5848e5;
    }


        `;
        document.head.appendChild(style);
    }
}
