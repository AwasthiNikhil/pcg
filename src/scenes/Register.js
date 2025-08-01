import { LoadingSpinner } from '../components/LoadingSpinner.js';

export class Register extends Phaser.Scene {
    constructor() {
        super('Register');
    }

    preload() { }

    create() {
        const screenWidth = 1920;
        const screenHeight = 1080;

        // Set full white background behind Phaser canvas (in your HTML or with CSS)
        document.body.style.backgroundColor = '#ffffff';

        // Title
        this.add.text(screenWidth / 2 - 150, 80, 'Lucky You', { fontSize: '64px', fill: '#000' });

        // Create wrapper div
        const wrapper = document.createElement('div');
        wrapper.id = 'auth-wrapper';
        document.body.appendChild(wrapper);

        wrapper.innerHTML = `
            <div class="input-group">
                <input type="text" id="username" required>
                <label for="username">Username</label>
            </div>
            <div class="input-group">
                <input type="password" id="password" required>
                <label for="password">Password</label>
            </div>
            <div class="btn-group">
                <button id="register-btn">Register</button>
                <button id="login-btn">Already have an account? Login Here</button>
            </div>
            <p id="error-msg"></p>
        `;

        // Apply styles (via JS for self-contained example)
        const style = document.createElement('style');
        style.textContent = `
            #auth-wrapper {
                position: absolute;
                top: 30%;
                left: 50%;
                transform: translate(-50%, -30%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
                font-family: Arial, sans-serif;
            }
            .input-group {
                position: relative;
                width: 400px;
            }
            .input-group input {
                width: 100%;
                padding: 12px;
                font-size: 18px;
                border: 2px solid black;
                background: white;
                color: black;
                outline: none;
            }
            .input-group label {
                position: absolute;
                top: 12px;
                left: 12px;
                color: black;
                background: white;
                padding: 0 5px;
                transition: 0.2s;
                pointer-events: none;
            }
            .input-group input:focus + label,
            .input-group input:not(:placeholder-shown) + label {
                top: -10px;
                font-size: 14px;
                color: black;
            }
            .btn-group {
                display: flex;
                gap: 20px;
            }
            .btn-group button {
                width: 180px;
                padding: 12px;
                background: white;
                color: black;
                border: 2px solid black;
                font-size: 18px;
                cursor: pointer;
                transition: background 0.3s;
            }
            .btn-group button:hover {
                background: #000;
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

        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const loginButton = document.getElementById('login-btn');
        const registerButton = document.getElementById('register-btn');
        this.errorMessage = document.getElementById('error-msg');

        loginButton.onclick = () => {
            this.scene.start('Login');
        };

        registerButton.onclick = () => {
            this.register(
                usernameInput.value,
                passwordInput.value,
                wrapper
            );
        };

        this.events.on('shutdown', () => {
            document.getElementById('auth-wrapper')?.remove();

            // Remove any styles injected into <head> by this scene
            const styles = [...document.head.querySelectorAll('style')];
            for (const s of styles) {
                if (s.textContent.includes('#auth-wrapper')) s.remove();
            }
        });

    }
    async register(username, password, wrapper) {
        LoadingSpinner.show("Registering user info...");
        try {
            const response = await fetch('http://localhost:8000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.status === 201) {
                const token = data.token;

                // Fetch user settings using token
                const settings = await this.fetchUserSettings(token);
                if (!settings) {
                    this.showErrorMessage('Failed to load user settings.');
                    return;
                }

                wrapper.remove();
                this.registry.set('user', data.user);
                this.registry.set('token', token);
                this.registry.set('userSettings', settings);

                this.scene.start('MainMenu');
            } else {
                this.showErrorMessage('Registration failed! Username might already exist.');
            }
        } catch (error) {
            console.error('Error registering:', error);
            this.showErrorMessage('Error registering!');
        } finally {
            LoadingSpinner.hide();
        }
    }
    async fetchUserSettings(token) {
        LoadingSpinner.show("Saving settings...");
        try {
            const response = await fetch('http://localhost:8000/api/settings', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                return await response.json();
            } else {
                console.warn('Failed to fetch settings:', await response.text());
                return null;
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            return null;
        } finally {
            LoadingSpinner.hide();
        }
    }
    showErrorMessage(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
        }
    }
    update() { }
}
