import { API_URL } from '../config.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { mountScreen, drawBackdrop, esc, avatarImg, flagImg, bindingsFor, keyName, onEscape } from '../ui/dom.js';

const CONTROLS = [
    ['move_left', 'Move left'],
    ['move_right', 'Move right'],
    ['jump', 'Jump', 'Press again in the air to double jump'],
    ['dash', 'Dash', 'Breaks walls and enemies'],
    ['dash_down', 'Dash down', 'Press twice'],
    ['shoot', 'Throw bomb'],
    ['place_wall', 'Place wall ahead'],
    ['place_wall_below', 'Place wall below'],
];

export class Settings extends Phaser.Scene {
    constructor() {
        super('Settings');
    }

    create() {
        drawBackdrop(this, { seed: 'settings' });
        const user = this.registry.get('user');
        const settings = this.registry.get('userSettings') || {};
        this.bindings = bindingsFor(settings);
        const days = Math.max(0, Math.floor((Date.now() - new Date(user.created_at)) / 86400000));

        this.screen = mountScreen(this, `
            <div class="page">
                <header class="page-head">
                    <div>
                        <button class="back" id="back-btn">Menu</button>
                        <h1 class="title">Settings</h1>
                    </div>
                    <button class="btn btn--primary" id="done-btn">Save and close</button>
                </header>
                <div class="settings">
                    <div class="stack">
                        <section class="panel">
                            <span class="eyebrow">Audio</span>
                            <div class="rows">
                                ${['music', 'sfx'].map(k => `
                                <div class="row"><label class="range grow">
                                    <span class="range-head"><span>${k === 'music' ? 'Music' : 'Sound effects'}</span><b class="num" id="${k}-val"></b></span>
                                    <input type="range" id="${k}-volume" min="0" max="100">
                                </label></div>`).join('')}
                            </div>
                        </section>
                        <section class="panel">
                            <span class="eyebrow">Account</span>
                            <div class="rows">
                                <div class="row">
                                    <div class="player">
                                        ${avatarImg(user.avatar)}
                                        <div>
                                            <div class="name">${esc(user.username)}</div>
                                            <div class="sub">${flagImg(user.country)}${esc(user.email)}</div>
                                            <div class="sub">Joined ${days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'} ago`}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <details class="disclosure grow">
                                        <summary>Change password</summary>
                                        <form class="form" id="password-form" novalidate>
                                            <label class="field"><span>Current password</span><input class="input" type="password" id="old-password" autocomplete="current-password"></label>
                                            <label class="field"><span>New password</span><input class="input" type="password" id="new-password" autocomplete="new-password"></label>
                                            <label class="field"><span>Confirm new password</span><input class="input" type="password" id="confirm-password" autocomplete="new-password"></label>
                                            <p class="message" id="password-msg" role="status"></p>
                                            <button class="btn" type="submit">Update password</button>
                                        </form>
                                    </details>
                                </div>
                            </div>
                        </section>
                    </div>
                    <section class="panel">
                        <span class="eyebrow">Controls</span>
                        <div class="rows">
                            ${CONTROLS.map(([key, label, hint]) => `
                            <div class="row control-row">
                                <span>${label}${hint ? `<small>${hint}</small>` : ''}</span>
                                <button class="keycap" data-binding="${key}" aria-label="${label}: ${keyName(this.bindings[key])}. Click to change.">${keyName(this.bindings[key])}</button>
                            </div>`).join('')}
                        </div>
                    </section>
                </div>
            </div>
        `);

        const $ = (id) => this.screen.querySelector(id);

        // Volume sliders: live preview, saved on close
        for (const k of ['music', 'sfx']) {
            const input = $(`#${k}-volume`);
            input.value = settings[`${k}_volume`] ?? 70;
            const show = () => {
                $(`#${k}-val`).textContent = `${input.value}%`;
                input.style.setProperty('--fill', `${input.value}%`);
            };
            show();
            input.oninput = () => { show(); this.updateIngameVolume(k, input.value); };
        }

        // Key capture: click a keycap, press a key (Esc cancels)
        this.screen.querySelectorAll('.keycap[data-binding]').forEach(cap => {
            cap.onclick = () => {
                this.screen.querySelectorAll('.keycap.is-listening').forEach(c => c.click());
                if (cap.classList.contains('is-listening')) return;
                cap.classList.add('is-listening');
                const previous = cap.textContent;
                cap.textContent = 'Press a key';
                const onKey = (e) => {
                    e.preventDefault();
                    window.removeEventListener('keydown', onKey, true);
                    cap.classList.remove('is-listening');
                    if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.ESC) {
                        cap.textContent = previous;
                        return;
                    }
                    this.bindings[cap.dataset.binding] = e.keyCode;
                    cap.textContent = keyName(e.keyCode);
                };
                window.addEventListener('keydown', onKey, true);
            };
        });

        $('#password-form').onsubmit = async (e) => {
            e.preventDefault();
            await this.changePassword();
        };
        const close = async () => {
            await this.saveSettings();
            this.scene.start('MainMenu');
        };
        $('#back-btn').onclick = close;
        $('#done-btn').onclick = close;
        onEscape(this, close);
    }

    async saveSettings() {
        const token = this.registry.get('token');

        const payload = {
            music_volume: parseInt(this.screen.querySelector('#music-volume').value),
            sfx_volume: parseInt(this.screen.querySelector('#sfx-volume').value),
            keyboard_bindings: { ...this.bindings },
        };

        LoadingSpinner.show('Saving settings');

        try {
            const res = await fetch(`${API_URL}/settings`, {
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

    resetPasswordFields() {
        for (const id of ['old-password', 'new-password', 'confirm-password']) {
            this.screen.querySelector(`#${id}`).value = '';
        }
    }

    showErrorMessage(message) {
        const el = this.screen.querySelector('#password-msg');
        el.className = 'message message--error';
        el.textContent = message;
    }

    showSuccessMessage(message) {
        const el = this.screen.querySelector('#password-msg');
        el.className = 'message message--ok';
        el.textContent = message;
    }

    async changePassword(){
        const oldPassword = this.screen.querySelector('#old-password').value;
        const newPassword = this.screen.querySelector('#new-password').value;
        const confirmPassword = this.screen.querySelector('#confirm-password').value;
        if (newPassword !== confirmPassword) {
            this.showErrorMessage('The new passwords don’t match.');
            return;
        }
        const token = this.registry.get('token');

        try{
            LoadingSpinner.show('Updating password');
            const response = await  fetch(`${API_URL}/change-password`, {
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
            this.showErrorMessage('Couldn’t reach the server. Try again.');
        } finally {
            LoadingSpinner.hide();
        }           
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
}
