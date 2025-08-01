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
                <input type="text" id="username" required placeholder=" ">
                <label for="username">Username</label>
            </div>
            <div class="input-group">
                <input type="password" id="password" required placeholder=" ">
                <label for="password">Password</label>
            </div>
            <div class="input-group">
                <input type="password" id="confirm-password" required placeholder=" ">
                <label for="confirm-password">Confirm Password</label>
            </div>
            <div class="input-group">
                <input type="email" id="email" required placeholder=" ">
                <label for="email">Email Address</label>
            </div>
            <div class="input-group">
                <select id="country" required>
                    <option value="" disabled selected hidden>Select Country</option>
                    <option value="AF">Afghanistan</option>
                    <option value="AX">Åland Islands</option>
                    <option value="AL">Albania</option>
                    <option value="DZ">Algeria</option>
                    <option value="AS">American Samoa</option>
                    <option value="AD">Andorra</option>
                    <option value="AO">Angola</option>
                    <option value="AI">Anguilla</option>
                    <option value="AQ">Antarctica</option>
                    <option value="AG">Antigua and Barbuda</option>
                    <option value="AR">Argentina</option>
                    <option value="AM">Armenia</option>
                    <option value="AW">Aruba</option>
                    <option value="AU">Australia</option>
                    <option value="AT">Austria</option>
                    <option value="AZ">Azerbaijan</option>
                    <option value="BS">Bahamas</option>
                    <option value="BH">Bahrain</option>
                    <option value="BD">Bangladesh</option>
                    <option value="BB">Barbados</option>
                    <option value="BY">Belarus</option>
                    <option value="BE">Belgium</option>
                    <option value="BZ">Belize</option>
                    <option value="BJ">Benin</option>
                    <option value="BM">Bermuda</option>
                    <option value="BT">Bhutan</option>
                    <option value="BO">Bolivia (Plurinational State of)</option>
                    <option value="BA">Bosnia and Herzegovina</option>
                    <option value="BW">Botswana</option>
                    <option value="BV">Bouvet Island</option>
                    <option value="BR">Brazil</option>
                    <option value="IO">British Indian Ocean Territory</option>
                    <option value="BN">Brunei Darussalam</option>
                    <option value="BG">Bulgaria</option>
                    <option value="BF">Burkina Faso</option>
                    <option value="BI">Burundi</option>
                    <option value="CV">Cabo Verde</option>
                    <option value="KH">Cambodia</option>
                    <option value="CM">Cameroon</option>
                    <option value="CA">Canada</option>
                    <option value="KY">Cayman Islands</option>
                    <option value="CF">Central African Republic</option>
                    <option value="TD">Chad</option>
                    <option value="CL">Chile</option>
                    <option value="CN">China</option>
                    <option value="CX">Christmas Island</option>
                    <option value="CC">Cocos (Keeling) Islands</option>
                    <option value="CO">Colombia</option>
                    <option value="KM">Comoros</option>
                    <option value="CG">Congo</option>
                    <option value="CD">Congo (Democratic Republic of the)</option>
                    <option value="CK">Cook Islands</option>
                    <option value="CR">Costa Rica</option>
                    <option value="CI">Côte d’Ivoire</option>
                    <option value="HR">Croatia</option>
                    <option value="CU">Cuba</option>
                    <option value="CY">Cyprus</option>
                    <option value="CZ">Czechia</option>
                    <option value="DK">Denmark</option>
                    <option value="DJ">Djibouti</option>
                    <option value="DM">Dominica</option>
                    <option value="DO">Dominican Republic</option>
                    <option value="EC">Ecuador</option>
                    <option value="EG">Egypt</option>
                    <option value="SV">El Salvador</option>
                    <option value="GQ">Equatorial Guinea</option>
                    <option value="ER">Eritrea</option>
                    <option value="EE">Estonia</option>
                    <option value="SZ">Eswatini</option>
                    <option value="ET">Ethiopia</option>
                    <option value="FK">Falkland Islands (Malvinas)</option>
                    <option value="FO">Faroe Islands</option>
                    <option value="FJ">Fiji</option>
                    <option value="FI">Finland</option>
                    <option value="FR">France</option>
                    <option value="GF">French Guiana</option>
                    <option value="PF">French Polynesia</option>
                    <option value="TF">French Southern Territories</option>
                    <option value="GA">Gabon</option>
                    <option value="GM">Gambia</option>
                    <option value="GE">Georgia</option>
                    <option value="DE">Germany</option>
                    <option value="GH">Ghana</option>
                    <option value="GI">Gibraltar</option>
                    <option value="GR">Greece</option>
                    <option value="GL">Greenland</option>
                    <option value="GD">Grenada</option>
                    <option value="GP">Guadeloupe</option>
                    <option value="GU">Guam</option>
                    <option value="GT">Guatemala</option>
                    <option value="GG">Guernsey</option>
                    <option value="GN">Guinea</option>
                    <option value="GW">Guinea‑Bissau</option>
                    <option value="GY">Guyana</option>
                    <option value="HT">Haiti</option>
                    <option value="HM">Heard Island and McDonald Islands</option>
                    <option value="VA">Holy See</option>
                    <option value="HN">Honduras</option>
                    <option value="HK">Hong Kong Special Administrative Region of China</option>
                    <option value="HU">Hungary</option>
                    <option value="IS">Iceland</option>
                    <option value="IN">India</option>
                    <option value="ID">Indonesia</option>
                    <option value="IR">Iran (Islamic Republic of)</option>
                    <option value="IQ">Iraq</option>
                    <option value="IE">Ireland</option>
                    <option value="IM">Isle of Man</option>
                    <option value="IL">Israel</option>
                    <option value="IT">Italy</option>
                    <option value="JM">Jamaica</option>
                    <option value="JP">Japan</option>
                    <option value="JE">Jersey</option>
                    <option value="JO">Jordan</option>
                    <option value="KZ">Kazakhstan</option>
                    <option value="KE">Kenya</option>
                    <option value="KI">Kiribati</option>
                    <option value="KP">Korea (Democratic People’s Republic of)</option>
                    <option value="KR">Korea (Republic of)</option>
                    <option value="KW">Kuwait</option>
                    <option value="KG">Kyrgyzstan</option>
                    <option value="LA">Lao People’s Democratic Republic</option>
                    <option value="LV">Latvia</option>
                    <option value="LB">Lebanon</option>
                    <option value="LS">Lesotho</option>
                    <option value="LR">Liberia</option>
                    <option value="LY">Libya</option>
                    <option value="LI">Liechtenstein</option>
                    <option value="LT">Lithuania</option>
                    <option value="LU">Luxembourg</option>
                    <option value="MO">Macao Special Administrative Region of China</option>
                    <option value="MG">Madagascar</option>
                    <option value="MW">Malawi</option>
                    <option value="MY">Malaysia</option>
                    <option value="MV">Maldives</option>
                    <option value="ML">Mali</option>
                    <option value="MT">Malta</option>
                    <option value="MH">Marshall Islands</option>
                    <option value="MQ">Martinique</option>
                    <option value="MR">Mauritania</option>
                    <option value="MU">Mauritius</option>
                    <option value="YT">Mayotte</option>
                    <option value="MX">Mexico</option>
                    <option value="FM">Micronesia (Federated States of)</option>
                    <option value="MD">Moldova (Republic of)</option>
                    <option value="MC">Monaco</option>
                    <option value="MN">Mongolia</option>
                    <option value="ME">Montenegro</option>
                    <option value="MS">Montserrat</option>
                    <option value="MA">Morocco</option>
                    <option value="MZ">Mozambique</option>
                    <option value="MM">Myanmar</option>
                    <option value="NA">Namibia</option>
                    <option value="NR">Nauru</option>
                    <option value="NP">Nepal</option>
                    <option value="NL">Netherlands</option>
                    <option value="NC">New Caledonia</option>
                    <option value="NZ">New Zealand</option>
                    <option value="NI">Nicaragua</option>
                    <option value="NE">Niger</option>
                    <option value="NG">Nigeria</option>
                    <option value="NU">Niue</option>
                    <option value="NF">Norfolk Island</option>
                    <option value="MK">North Macedonia</option>
                    <option value="MP">Northern Mariana Islands</option>
                    <option value="NO">Norway</option>
                    <option value="OM">Oman</option>
                    <option value="PK">Pakistan</option>
                    <option value="PW">Palau</option>
                    <option value="PS">Palestine, State of</option>
                    <option value="PA">Panama</option>
                    <option value="PG">Papua New Guinea</option>
                    <option value="PY">Paraguay</option>
                    <option value="PE">Peru</option>
                    <option value="PH">Philippines</option>
                    <option value="PN">Pitcairn</option>
                    <option value="PL">Poland</option>
                    <option value="PT">Portugal</option>
                    <option value="PR">Puerto Rico</option>
                    <option value="QA">Qatar</option>
                    <option value="RE">Réunion</option>
                    <option value="RO">Romania</option>
                    <option value="RU">Russian Federation</option>
                    <option value="RW">Rwanda</option>
                    <option value="BL">Saint Barthélemy</option>
                    <option value="SH">Saint Helena, Ascension and Tristan da Cunha</option>
                    <option value="KN">Saint Kitts and Nevis</option>
                    <option value="LC">Saint Lucia</option>
                    <option value="MF">Saint Martin (French part)</option>
                    <option value="PM">Saint Pierre and Miquelon</option>
                    <option value="VC">Saint Vincent and the Grenadines</option>
                    <option value="WS">Samoa</option>
                    <option value="SM">San Marino</option>
                    <option value="ST">Sao Tome and Principe</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="SN">Senegal</option>
                    <option value="RS">Serbia</option>
                    <option value="SC">Seychelles</option>
                    <option value="SL">Sierra Leone</option>
                    <option value="SG">Singapore</option>
                    <option value="SX">Sint Maarten (Dutch part)</option>
                    <option value="SK">Slovakia</option>
                    <option value="SI">Slovenia</option>
                    <option value="SB">Solomon Islands</option>
                    <option value="SO">Somalia</option>
                    <option value="ZA">South Africa</option>
                    <option value="GS">South Georgia and the South Sandwich Islands</option>
                    <option value="SS">South Sudan</option>
                    <option value="ES">Spain</option>
                    <option value="LK">Sri Lanka</option>
                    <option value="SD">Sudan</option>
                    <option value="SR">Suriname</option>
                    <option value="SJ">Svalbard and Jan Mayen</option>
                    <option value="SE">Sweden</option>
                    <option value="CH">Switzerland</option>
                    <option value="SY">Syrian Arab Republic</option>
                    <option value="TW">Taiwan, Province of China</option>
                    <option value="TJ">Tajikistan</option>
                    <option value="TZ">Tanzania, United Republic of</option>
                    <option value="TH">Thailand</option>
                    <option value="TL">Timor‑Leste</option>
                    <option value="TG">Togo</option>
                    <option value="TK">Tokelau</option>
                    <option value="TO">Tonga</option>
                    <option value="TT">Trinidad and Tobago</option>
                    <option value="TN">Tunisia</option>
                    <option value="TR">Turkey</option>
                    <option value="TM">Turkmenistan</option>
                    <option value="TC">Turks and Caicos Islands</option>
                    <option value="TV">Tuvalu</option>
                    <option value="UG">Uganda</option>
                    <option value="UA">Ukraine</option>
                    <option value="AE">United Arab Emirates</option>
                    <option value="GB">United Kingdom of Great Britain and Northern Ireland</option>
                    <option value="UM">United States Minor Outlying Islands</option>
                    <option value="US">United States of America</option>
                    <option value="UY">Uruguay</option>
                    <option value="UZ">Uzbekistan</option>
                    <option value="VU">Vanuatu</option>
                    <option value="VE">Venezuela (Bolivarian Republic of)</option>
                    <option value="VN">Viet Nam</option>
                    <option value="VG">Virgin Islands (British)</option>
                    <option value="VI">Virgin Islands (U.S.)</option>
                    <option value="WF">Wallis and Futuna</option>
                    <option value="EH">Western Sahara</option>
                    <option value="YE">Yemen</option>
                    <option value="ZM">Zambia</option>
                    <option value="ZW">Zimbabwe</option>
                </select>
            </div>
            <div class="input-group">
                <select id="avatar">
                    <option value="" disabled selected hidden>Select Avatar</option>
                    <option value="warrior">Warrior</option>
                    <option value="mage">Mage</option>
                    <option value="archer">Archer</option>
                    <!-- Replace with image picker later -->
                </select>
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
            .input-group select {
                width: 100%;
                padding: 12px;
                font-size: 18px;
                border: 2px solid black;
                background: white;
                color: black;
                appearance: none;
                -webkit-appearance: none;
                -moz-appearance: none;
            }
        `;
        document.head.appendChild(style);

        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        const emailInput = document.getElementById('email');
        const countryInput = document.getElementById('country');
        const avatarInput = document.getElementById('avatar');
        const loginButton = document.getElementById('login-btn');
        const registerButton = document.getElementById('register-btn');
        this.errorMessage = document.getElementById('error-msg');

        loginButton.onclick = () => {
            this.scene.start('Login');
        };

        registerButton.onclick = () => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            const email = emailInput.value.trim();
            const country = countryInput.value;
            const avatar = avatarInput.value;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if(!username || !password || !confirmPassword || !email || !country || !avatar ){
                this.showErrorMessage('Fill all the fields!');
                return;
            }
            if(password.length < 6){
                this.showErrorMessage('Password length should be more than 6 characters!');
                return;
            }
            if (password !== confirmPassword) {
                this.showErrorMessage('Passwords do not match!');
                return;
            }
            if (!emailRegex.test(email)) {
                this.showErrorMessage('Invalid email address!');
                return;
            }

            this.register(username, password, email, country, avatar, wrapper);
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
    async register(username, password, email, country, avatar, wrapper) {
        LoadingSpinner.show("Registering user info...");
        try {
            const response = await fetch('http://localhost:8000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email, country, avatar})
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
