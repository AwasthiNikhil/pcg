export class LoginRegister extends Phaser.Scene {
    constructor() {
        super('LoginRegister');
    }

    preload() {
        this.load.image('button', 'button.png');  // Example button image
        this.load.image('background', 'background.png');  // Example background
    }

    create() {
        
        this.checkAlreadyLoggedIn();

        const screenWidth = 1920;
        const screenHeight = 1080;

        // Add background image
        this.add.image(screenWidth / 2, screenHeight / 2, 'background');

        // Title
        this.add.text(screenWidth / 2 - 150, 100, 'Login / Register', { fontSize: '48px', fill: '#fff' });

        // Username Label
        let usernameLabel = this.add.text(screenWidth / 2 - 150, 250, 'Username:', { fontSize: '32px', fill: '#fff' });

        // Create HTML Input for username
        let usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.placeholder = 'Enter Username';
        usernameInput.style.position = 'absolute';
        usernameInput.style.left = `${screenWidth / 2 - 200}px`;
        usernameInput.style.top = `${300}px`;
        usernameInput.style.width = '400px';
        usernameInput.style.height = '40px';
        usernameInput.style.fontSize = '18px';
        usernameInput.style.padding = '10px';
        usernameInput.style.zIndex = '10';
        document.body.appendChild(usernameInput);

        // Password Label
        let passwordLabel = this.add.text(screenWidth / 2 - 150, 400, 'Password:', { fontSize: '32px', fill: '#fff' });

        // Create HTML Input for password
        let passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.placeholder = 'Enter Password';
        passwordInput.style.position = 'absolute';
        passwordInput.style.left = `${screenWidth / 2 - 200}px`;
        passwordInput.style.top = `${450}px`;
        passwordInput.style.width = '400px';
        passwordInput.style.height = '40px';
        passwordInput.style.fontSize = '18px';
        passwordInput.style.padding = '10px';
        passwordInput.style.zIndex = '10';
        document.body.appendChild(passwordInput);

        // Login Button
        let loginButton = this.add.sprite(screenWidth / 2, 550, 'button').setInteractive().setDisplaySize(400, 100);
        loginButton.on('pointerdown', () => {
            const username = usernameInput.value;
            const password = passwordInput.value;
            this.login(username, password, usernameInput, passwordInput, usernameLabel, passwordLabel, loginButton, registerButton);
        });

        this.add.text(screenWidth / 2 - 70, 530, 'Login', { fontSize: '32px', fill: '#fff' });

        // Register Button
        let registerButton = this.add.sprite(screenWidth / 2, 650, 'button').setInteractive().setDisplaySize(400, 100);
        registerButton.on('pointerdown', () => {
            const username = usernameInput.value;
            const password = passwordInput.value;
            this.register(username, password, usernameInput, passwordInput, usernameLabel, passwordLabel, loginButton, registerButton);
        });

        this.add.text(screenWidth / 2 - 80, 630, 'Register', { fontSize: '32px', fill: '#fff' });

        // Error message text (initially hidden)
        this.errorMessage = this.add.text(screenWidth / 2 - 200, 700, '', { fontSize: '24px', fill: '#ff0000' });
    }

    // Send login request to the backend
    async login(username, password, usernameInput, passwordInput, usernameLabel, passwordLabel, loginButton, registerButton) {
        try {
            const response = await fetch('http://localhost:8000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.status === 200) {
                // Hide input fields and buttons
                this.hideLoginUI(usernameInput, passwordInput, usernameLabel, passwordLabel, loginButton, registerButton);

                // set user and token in registry
                this.registry.set('user', data.user);
                this.registry.set('token', data.token);
                
                // Proceed to the main menu
                this.scene.start('MainMenu');
            } else {
                this.showErrorMessage('Invalid username or password!');
            }
        } catch (error) {
            console.error('Error logging in:', error);
            this.showErrorMessage('Error logging in!');
        }
    }

    // Send registration request to the backend
    async register(username, password, usernameInput, passwordInput, usernameLabel, passwordLabel, loginButton, registerButton) {
        try {
            const response = await fetch('http://localhost:8000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })  
            });

            const data = await response.json();
            if (response.status === 201) {
                // Hide input fields and buttons
                this.hideLoginUI(usernameInput, passwordInput, usernameLabel, passwordLabel, loginButton, registerButton);
                
                 // set user and token in registry
                this.registry.set('user', data.user);
                this.registry.set('token', data.token);

                // Proceed to the main menu
                this.scene.start('MainMenu');
            } else {
                this.showErrorMessage('Registration failed! Username might already exist.');
            }
        } catch (error) {
            console.error('Error registering:', error);
            this.showErrorMessage('Error registering!');
        }
    }
    
    // Hide all the login UI elements
    hideLoginUI(usernameInput, passwordInput, usernameLabel, passwordLabel, loginButton, registerButton) {
        // Remove the input fields and labels from the DOM
        usernameInput.style.display = 'none';
        passwordInput.style.display = 'none';
        usernameLabel.setVisible(false);
        passwordLabel.setVisible(false);
        loginButton.setVisible(false);
        registerButton.setVisible(false);
    }

    // Display error message
    showErrorMessage(message) {
        this.errorMessage.setText(message);
    }

    update() {
        // You can update anything related to the DOM or inputs here if needed
    }

    checkAlreadyLoggedIn(){
        console.log(this.registry.get('token'));
    }
}
