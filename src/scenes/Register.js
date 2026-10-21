import { mountScreen, authLayout, drawBackdrop } from '../ui/dom.js';
import { startSession } from '../session.js';
import { API_URL } from '../config.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';

const COUNTRIES = [
    ["AF", "Afghanistan"],
    ["AX", "Åland Islands"],
    ["AL", "Albania"],
    ["DZ", "Algeria"],
    ["AS", "American Samoa"],
    ["AD", "Andorra"],
    ["AO", "Angola"],
    ["AI", "Anguilla"],
    ["AQ", "Antarctica"],
    ["AG", "Antigua and Barbuda"],
    ["AR", "Argentina"],
    ["AM", "Armenia"],
    ["AW", "Aruba"],
    ["AU", "Australia"],
    ["AT", "Austria"],
    ["AZ", "Azerbaijan"],
    ["BS", "Bahamas"],
    ["BH", "Bahrain"],
    ["BD", "Bangladesh"],
    ["BB", "Barbados"],
    ["BY", "Belarus"],
    ["BE", "Belgium"],
    ["BZ", "Belize"],
    ["BJ", "Benin"],
    ["BM", "Bermuda"],
    ["BT", "Bhutan"],
    ["BO", "Bolivia (Plurinational State of)"],
    ["BA", "Bosnia and Herzegovina"],
    ["BW", "Botswana"],
    ["BV", "Bouvet Island"],
    ["BR", "Brazil"],
    ["IO", "British Indian Ocean Territory"],
    ["BN", "Brunei Darussalam"],
    ["BG", "Bulgaria"],
    ["BF", "Burkina Faso"],
    ["BI", "Burundi"],
    ["CV", "Cabo Verde"],
    ["KH", "Cambodia"],
    ["CM", "Cameroon"],
    ["CA", "Canada"],
    ["KY", "Cayman Islands"],
    ["CF", "Central African Republic"],
    ["TD", "Chad"],
    ["CL", "Chile"],
    ["CN", "China"],
    ["CX", "Christmas Island"],
    ["CC", "Cocos (Keeling) Islands"],
    ["CO", "Colombia"],
    ["KM", "Comoros"],
    ["CG", "Congo"],
    ["CD", "Congo (Democratic Republic of the)"],
    ["CK", "Cook Islands"],
    ["CR", "Costa Rica"],
    ["CI", "Côte d’Ivoire"],
    ["HR", "Croatia"],
    ["CU", "Cuba"],
    ["CY", "Cyprus"],
    ["CZ", "Czechia"],
    ["DK", "Denmark"],
    ["DJ", "Djibouti"],
    ["DM", "Dominica"],
    ["DO", "Dominican Republic"],
    ["EC", "Ecuador"],
    ["EG", "Egypt"],
    ["SV", "El Salvador"],
    ["GQ", "Equatorial Guinea"],
    ["ER", "Eritrea"],
    ["EE", "Estonia"],
    ["SZ", "Eswatini"],
    ["ET", "Ethiopia"],
    ["FK", "Falkland Islands (Malvinas)"],
    ["FO", "Faroe Islands"],
    ["FJ", "Fiji"],
    ["FI", "Finland"],
    ["FR", "France"],
    ["GF", "French Guiana"],
    ["PF", "French Polynesia"],
    ["TF", "French Southern Territories"],
    ["GA", "Gabon"],
    ["GM", "Gambia"],
    ["GE", "Georgia"],
    ["DE", "Germany"],
    ["GH", "Ghana"],
    ["GI", "Gibraltar"],
    ["GR", "Greece"],
    ["GL", "Greenland"],
    ["GD", "Grenada"],
    ["GP", "Guadeloupe"],
    ["GU", "Guam"],
    ["GT", "Guatemala"],
    ["GG", "Guernsey"],
    ["GN", "Guinea"],
    ["GW", "Guinea‑Bissau"],
    ["GY", "Guyana"],
    ["HT", "Haiti"],
    ["HM", "Heard Island and McDonald Islands"],
    ["VA", "Holy See"],
    ["HN", "Honduras"],
    ["HK", "Hong Kong Special Administrative Region of China"],
    ["HU", "Hungary"],
    ["IS", "Iceland"],
    ["IN", "India"],
    ["ID", "Indonesia"],
    ["IR", "Iran (Islamic Republic of)"],
    ["IQ", "Iraq"],
    ["IE", "Ireland"],
    ["IM", "Isle of Man"],
    ["IL", "Israel"],
    ["IT", "Italy"],
    ["JM", "Jamaica"],
    ["JP", "Japan"],
    ["JE", "Jersey"],
    ["JO", "Jordan"],
    ["KZ", "Kazakhstan"],
    ["KE", "Kenya"],
    ["KI", "Kiribati"],
    ["KP", "Korea (Democratic People’s Republic of)"],
    ["KR", "Korea (Republic of)"],
    ["KW", "Kuwait"],
    ["KG", "Kyrgyzstan"],
    ["LA", "Lao People’s Democratic Republic"],
    ["LV", "Latvia"],
    ["LB", "Lebanon"],
    ["LS", "Lesotho"],
    ["LR", "Liberia"],
    ["LY", "Libya"],
    ["LI", "Liechtenstein"],
    ["LT", "Lithuania"],
    ["LU", "Luxembourg"],
    ["MO", "Macao Special Administrative Region of China"],
    ["MG", "Madagascar"],
    ["MW", "Malawi"],
    ["MY", "Malaysia"],
    ["MV", "Maldives"],
    ["ML", "Mali"],
    ["MT", "Malta"],
    ["MH", "Marshall Islands"],
    ["MQ", "Martinique"],
    ["MR", "Mauritania"],
    ["MU", "Mauritius"],
    ["YT", "Mayotte"],
    ["MX", "Mexico"],
    ["FM", "Micronesia (Federated States of)"],
    ["MD", "Moldova (Republic of)"],
    ["MC", "Monaco"],
    ["MN", "Mongolia"],
    ["ME", "Montenegro"],
    ["MS", "Montserrat"],
    ["MA", "Morocco"],
    ["MZ", "Mozambique"],
    ["MM", "Myanmar"],
    ["NA", "Namibia"],
    ["NR", "Nauru"],
    ["NP", "Nepal"],
    ["NL", "Netherlands"],
    ["NC", "New Caledonia"],
    ["NZ", "New Zealand"],
    ["NI", "Nicaragua"],
    ["NE", "Niger"],
    ["NG", "Nigeria"],
    ["NU", "Niue"],
    ["NF", "Norfolk Island"],
    ["MK", "North Macedonia"],
    ["MP", "Northern Mariana Islands"],
    ["NO", "Norway"],
    ["OM", "Oman"],
    ["PK", "Pakistan"],
    ["PW", "Palau"],
    ["PS", "Palestine, State of"],
    ["PA", "Panama"],
    ["PG", "Papua New Guinea"],
    ["PY", "Paraguay"],
    ["PE", "Peru"],
    ["PH", "Philippines"],
    ["PN", "Pitcairn"],
    ["PL", "Poland"],
    ["PT", "Portugal"],
    ["PR", "Puerto Rico"],
    ["QA", "Qatar"],
    ["RE", "Réunion"],
    ["RO", "Romania"],
    ["RU", "Russian Federation"],
    ["RW", "Rwanda"],
    ["BL", "Saint Barthélemy"],
    ["SH", "Saint Helena, Ascension and Tristan da Cunha"],
    ["KN", "Saint Kitts and Nevis"],
    ["LC", "Saint Lucia"],
    ["MF", "Saint Martin (French part)"],
    ["PM", "Saint Pierre and Miquelon"],
    ["VC", "Saint Vincent and the Grenadines"],
    ["WS", "Samoa"],
    ["SM", "San Marino"],
    ["ST", "Sao Tome and Principe"],
    ["SA", "Saudi Arabia"],
    ["SN", "Senegal"],
    ["RS", "Serbia"],
    ["SC", "Seychelles"],
    ["SL", "Sierra Leone"],
    ["SG", "Singapore"],
    ["SX", "Sint Maarten (Dutch part)"],
    ["SK", "Slovakia"],
    ["SI", "Slovenia"],
    ["SB", "Solomon Islands"],
    ["SO", "Somalia"],
    ["ZA", "South Africa"],
    ["GS", "South Georgia and the South Sandwich Islands"],
    ["SS", "South Sudan"],
    ["ES", "Spain"],
    ["LK", "Sri Lanka"],
    ["SD", "Sudan"],
    ["SR", "Suriname"],
    ["SJ", "Svalbard and Jan Mayen"],
    ["SE", "Sweden"],
    ["CH", "Switzerland"],
    ["SY", "Syrian Arab Republic"],
    ["TW", "Taiwan, Province of China"],
    ["TJ", "Tajikistan"],
    ["TZ", "Tanzania, United Republic of"],
    ["TH", "Thailand"],
    ["TL", "Timor‑Leste"],
    ["TG", "Togo"],
    ["TK", "Tokelau"],
    ["TO", "Tonga"],
    ["TT", "Trinidad and Tobago"],
    ["TN", "Tunisia"],
    ["TR", "Turkey"],
    ["TM", "Turkmenistan"],
    ["TC", "Turks and Caicos Islands"],
    ["TV", "Tuvalu"],
    ["UG", "Uganda"],
    ["UA", "Ukraine"],
    ["AE", "United Arab Emirates"],
    ["GB", "United Kingdom of Great Britain and Northern Ireland"],
    ["UM", "United States Minor Outlying Islands"],
    ["US", "United States of America"],
    ["UY", "Uruguay"],
    ["UZ", "Uzbekistan"],
    ["VU", "Vanuatu"],
    ["VE", "Venezuela (Bolivarian Republic of)"],
    ["VN", "Viet Nam"],
    ["VG", "Virgin Islands (British)"],
    ["VI", "Virgin Islands (U.S.)"],
    ["WF", "Wallis and Futuna"],
    ["EH", "Western Sahara"],
    ["YE", "Yemen"],
    ["ZM", "Zambia"],
    ["ZW", "Zimbabwe"],
];

export class Register extends Phaser.Scene {
    constructor() {
        super('Register');
    }

    preload() { }

    create() {
        drawBackdrop(this, { seed: 'register' });

        const avatars = ['warrior', 'mage', 'archer'];
        const screen = mountScreen(this, authLayout(`
            <h2 class="heading">Create an account</h2>
            <form class="form" id="register-form" novalidate>
                <div class="form-grid">
                    <label class="field"><span>Username</span>
                        <input class="input" id="username" autocomplete="username" required></label>
                    <label class="field"><span>Email</span>
                        <input class="input" id="email" type="email" autocomplete="email" required></label>
                    <label class="field"><span>Password</span>
                        <input class="input" id="password" type="password" autocomplete="new-password" minlength="6" required></label>
                    <label class="field"><span>Confirm password</span>
                        <input class="input" id="confirm-password" type="password" autocomplete="new-password" required></label>
                    <label class="field span-2"><span>Country</span>
                        <select class="input" id="country" required>
                            <option value="" disabled selected>Choose your country</option>
                            ${COUNTRIES.map(([code, name]) => `<option value="${code}">${name}</option>`).join('')}
                        </select></label>
                </div>
                <fieldset class="choice-group">
                    <legend>Avatar</legend>
                    ${avatars.map((a, i) => `
                        <label class="choice">
                            <input type="radio" name="avatar" value="${a}" ${i === 0 ? 'checked' : ''}>
                            <span class="choice-card"><img src="assets/avatars/${a}.png" alt="">${a[0].toUpperCase() + a.slice(1)}</span>
                        </label>`).join('')}
                </fieldset>
                <p class="message message--error" id="error-msg" role="alert"></p>
                <button class="btn btn--primary btn--lg btn--block" type="submit">Create account</button>
            </form>
            <p class="auth-switch">Already playing? <button type="button" id="login-btn">Sign in</button></p>
        `));

        this.errorMessage = screen.querySelector('#error-msg');
        const $ = (id) => screen.querySelector(id);
        $('#username').focus();
        $('#login-btn').onclick = () => this.scene.start('Login');

        $('#register-form').onsubmit = (e) => {
            e.preventDefault();
            const username = $('#username').value.trim();
            const password = $('#password').value;
            const confirmPassword = $('#confirm-password').value;
            const email = $('#email').value.trim();
            const country = $('#country').value;
            const avatar = screen.querySelector('input[name="avatar"]:checked')?.value;

            if (!username || !password || !confirmPassword || !email || !country || !avatar) {
                this.showErrorMessage('Fill in every field.');
                return;
            }
            if (password.length < 6) {
                this.showErrorMessage('Use at least 6 characters for your password.');
                return;
            }
            if (password !== confirmPassword) {
                this.showErrorMessage('The passwords don’t match.');
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                this.showErrorMessage('That email address doesn’t look right.');
                return;
            }
            this.register(username, password, email, country, avatar);
        };
    }

    async register(username, password, email, country, avatar) {
        LoadingSpinner.show('Creating your account');
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ username, password, email, country, avatar })
            });
            const data = await response.json();
            if (response.status !== 201) {
                this.showErrorMessage(data.message || 'That username is taken. Try another.');
                return;
            }
            await startSession(this.registry, data.token);
            this.scene.start('MainMenu');
        } catch (error) {
            console.error('Error registering:', error);
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
