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
        wrapper.innerHTML = this.getWrapperHtml(user);
        document.body.appendChild(wrapper);

        this.addDOMStyles();
        this.loadSettings();

        const passwordForm = document.getElementById('password-form');
        this.errorMessage = document.getElementById('error-msg');
        this.successMessage = document.getElementById('success-msg');

        document.getElementById('change-password-btn').onclick = () => {
            passwordForm.style.display = passwordForm.style.display === 'block' ? 'none' : 'block';
        };
        document.getElementById('change-btn').onclick = async () => {
                await this.changePassword();
        }
    }

    loadSettings() {
        const data = this.registry.get('userSettings');
        if (!data) {
            console.error("No settings in registry.");
            return;
        }

        const { music_volume, sfx_volume, keyboard_bindings } = data;

        const music = document.getElementById('music-volume');
        const sfx = document.getElementById('sfx-volume');

        const updateDisplay = () => {
            document.getElementById('music-val').textContent = music.value;
            document.getElementById('sfx-val').textContent = sfx.value;
        };

        music.value = music_volume;
        sfx.value = sfx_volume;
        updateDisplay();

        // change display label
        music.oninput = ()=>{
            updateDisplay();
            this.updateIngameVolume('music',music.value);
        }
        sfx.oninput = ()=>{
            updateDisplay();
            this.updateIngameVolume('sfx',sfx.value);
        }

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

    resetPasswordFields(){
        document.getElementById('old-password').value='';
        document.getElementById('new-password').value='';
        document.getElementById('confirm-password').value='';
    }

    async changePassword(){
        const oldPassword = document.getElementById('old-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        if (newPassword !== confirmPassword) {
            this.showErrorMessage('New password and confirmation do not match.');
            return;
        }
        const token = this.registry.get('token');

        try{
            LoadingSpinner.show("Changing password...");
            const response = await  fetch('http://pcg.test/api/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        old_password: oldPassword,
                        new_password: newPassword
                    })
                });
            const data = await response.json();
            if (response.status === 200) {
                this.showSuccessMessage(data.message);
                this.resetPasswordFields();
            }else{
                this.showErrorMessage(data.message);
            }
        }catch (error) {
            this.showErrorMessage('Error changing password!');
        } finally {
            LoadingSpinner.hide();
        }           
    }
    
    cleanupDOM() {
        document.getElementById('settings-wrapper')?.remove();
    }

    updateIngameVolume(type, volume){
        switch(type){
            case 'music':
                const bg_music = this.sound.get('bg_music');
                if (bg_music) {
                    bg_music.setVolume(volume/ 100);
                }else{
                    console.log("No bg_music found.")
                }
                break;
            case 'sfx':
                const sfx = this.sound.get('sfx');
                if (sfx) {
                    sfx.setVolume(volume/ 100);
                }else{
                    console.log("No sfx found.")
                }
                break;
        }
    }

    getWrapperHtml(user){
        return  `
           <h1>Settings</h1>
            <details open class="setting-collapse">
                <summary>Account Info</summary>
                <div class="profile-container">
                    <div class="player-banner">
                    <div class="player-info">
                        <div class="username">${user.username}</div>
                        <div class="email">${user.email}</div>
                        <div class="joined">Joined ${Math.floor((new Date()-new Date(user.created_at))/ (1000 * 60 * 60 * 24))} days ago</div>
                    </div>
                    
                    <div class="avatar-container">
                        <img src="assets/avatars/${user.avatar}" alt="Profile Icon" class="avatar">
                        <img src="assets/flags/${user.country}.png" alt="Country Flag" class="flag">
                    </div>
                    </div>

                    <button class="menu-btn" id="change-password-btn">Change Password</button>
                    <form id="password-form" class="password-form">
                        <p id="error-msg"></p>
                        <p id="success-msg"></p>
                        <div class="setting-group">
                            <label for="old-password">
                                Old Password: 
                                <input type="password" id="old-password" name="old_password">
                            </label>
                        </div>
                        <div class="setting-group">
                            <label for="new-password">
                                New Password
                                <input type="password" id="new-password" name="new_password">
                            </label>
                        </div>
                        <div class="setting-group">
                            <label for="confirm-password">
                                Confirm Password
                                <input type="password" id="confirm-password" name="confirm_password">
                                <input type='button' id='change-btn' value='Submit'/>            
                            </label>
                    </form>
                </div>
            </details>

            <details open class="setting-collapse">
            <summary>Volume Settings</summary>
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
    }

    addDOMStyles() {
        const style = document.createElement('style');
        style.textContent = `

            #success-msg{
                color:green;
            }

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
                background-color: #fff;
                color: black;
                border: none;
                border-radius: 8px;
                padding: 10px;
                margin-top: 10px;
                cursor: pointer;
                font-weight: 500;
            }
            .password-form button:hover {
                background-color: #000;
                color:#fff;
            }


            .player-banner {
                display: grid;
                grid-template-columns: 1fr auto;
                grid-template-rows: auto auto;
                gap: 8px 20px;
                border: 1px solid black;
                padding: 20px 30px;
                position: relative;
                align-items: center;
            }
            .player-info>div{
                margin-bottom: 10px;
            }

            .username{
                font-weight: bold;
            }
            
            /* Avatar section */
            .avatar-container {
                grid-row: 1 / span 2; /* make avatar span 2 rows */
                position: relative;
            }

            .avatar {
                width: 75px;
                height: 75px;
                border-radius: 50%;
                object-fit: cover;
            }

            /* Country flag overlay */
            .flag {
                position: absolute;
                bottom: 5px;
                left: 5px;
                width: 28px;
                height: 20px;
                border-radius: 4px;
                object-fit: cover;
                box-shadow: 0 0 5px rgba(0,0,0,0.2);
            }
        `;
        document.head.appendChild(style);
    }

    showErrorMessage(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
        }
        this.successMessage.textContent = '';

    }
    
    showSuccessMessage(message) {
        if (this.successMessage) {
            this.successMessage.textContent = message;
        }
        this.errorMessage.textContent = '';

    }
}
