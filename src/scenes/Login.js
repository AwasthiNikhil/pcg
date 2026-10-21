import { API_URL } from '../config.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { mountScreen, authLayout, drawBackdrop } from '../ui/dom.js';
import { startSession } from '../session.js';

export class Login extends Phaser.Scene {
    constructor() {
        super('Login');
    }

    preload() { }

    create() {
        drawBackdrop(this, { seed: 'login' });

        const screen = mountScreen(this, authLayout(`
            <h2 class="heading">Sign in</h2>
            <form class="form" id="login-form" novalidate>
                <label class="field"><span>Username</span>
                    <input class="input" id="username" autocomplete="username" required></label>
                <label class="field"><span>Password</span>
                    <input class="input" id="password" type="password" autocomplete="current-password" required></label>
                <p class="message message--error" id="error-msg" role="alert"></p>
                <button class="btn btn--primary btn--lg btn--block" type="submit">Play</button>
            </form>
            <p class="auth-switch">New here? <button type="button" id="register-btn">Create an account</button></p>
        `));

        this.errorMessage = screen.querySelector('#error-msg');
        const username = screen.querySelector('#username');
        const password = screen.querySelector('#password');
        username.focus();

        screen.querySelector('#login-form').onsubmit = (e) => {
            e.preventDefault();
            if (!username.value.trim() || !password.value) {
                this.showErrorMessage('Enter your username and password.');
                return;
            }
            this.login(username.value.trim(), password.value);
        };
        screen.querySelector('#register-btn').onclick = () => this.scene.start('Register');
    }

    async login(username, password) {
        LoadingSpinner.show('Signing in');
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) {
                this.showErrorMessage(data.message || 'Wrong username or password.');
                return;
            }
            await startSession(this.registry, data.token);
            this.scene.start('MainMenu');
        } catch (error) {
            console.error('Error signing in:', error);
            this.showErrorMessage('Couldn’t reach the server. Try again.');
        } finally {
            LoadingSpinner.hide();
        }
    }

    showErrorMessage(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
        }
    }

}
