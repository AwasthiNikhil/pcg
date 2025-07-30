export class Help extends Phaser.Scene {
    constructor() {
        super('Help');
    }

    create() {
        this.cleanupDOM();

        const wrapper = document.createElement('div');
        wrapper.id = 'help-wrapper';
        document.body.appendChild(wrapper);

        wrapper.innerHTML = `
            <h1>How to Play</h1>

            <div class="accordion">
                <div class="card">
                    <div class="card-header">🎯 Game Objective</div>
                    <div class="card-content">
                    <br/>
                        Your goal is to <strong>collect the key</strong> and reach the exit before the timer runs out. 
                        Gather as many coins as possible for a higher score.
                    </div>
                    <br/>
                </div>

                <div class="card">
                    <div class="card-header">🎮 Controls</div>
                    <div class="card-content">
                    <br/>
                        - Move: <strong>WASD</strong><br>
                        - Bomb (destroys 2x2 walls): <strong>SPACE</strong><br>
                        - Place Wall Block: <strong>E</strong><br>
                        - Menu Navigation: <strong>Mouse</strong><br>
                        Controls are customizable in the <em>Settings</em> menu.
                    </div>
                    <br/>
                </div>

                <div class="card">
                    <div class="card-header">🧠 Level Generation</div>
                    <div class="card-content">
                    <br/>
                        Levels are procedurally generated using different algorithms:
                        <ul>
                            <li>Perlin</li>
                            <li>Cellular Automata</li>
                            <li>Graph-based</li>
                            <li>Transformer model (trained on Lode Runner)</li>
                        </ul>
                        The algorithm used depends on your level range.
                    </div>
                    <br/>
                </div>

                <div class="card">
                    <div class="card-header">🏆 Scoring</div>
                    <div class="card-content">
                    <br/>
                        Score = Coins collected + Time remaining + Level completion bonus
                    </div>
                    <br/>
                </div>

                <div class="card">
                    <div class="card-header">📈 Profile & Leaderboard</div>
                    <div class="card-content">
                    <br/>
                        - Login required to play<br>
                        - View top players by different categories in leaderboard
                    </div>
                    <br/>
                </div>
            </div>

            <button class="menu-btn" id="back-btn">Back to Menu</button>
        `;

        this.addDOMStyles();

        document.getElementById('back-btn').onclick = () => {
            wrapper.remove();
            this.scene.start('MainMenu');
        };

        // Add collapsible behavior
        document.querySelectorAll('.card-header').forEach(header => {
            header.addEventListener('click', () => {
                header.classList.toggle('active');
                const content = header.nextElementSibling;
                content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + "px";
            });
        });
    }

    cleanupDOM() {
        document.getElementById('help-wrapper')?.remove();
    }

    addDOMStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #help-wrapper {
                position: absolute;
                top: 8%;
                left: 50%;
                transform: translateX(-50%);
                width: 600px;
                font-family: Arial, sans-serif;
                color: black;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
            }

            #help-wrapper h1 {
                font-size: 48px;
                margin-bottom: 10px;
            }

            .accordion {
                width: 100%;
            }

            .card {
                background: #fff;
                border: 1px solid #000;
                border-radius: 8px;
                margin-bottom: 10px;
                overflow: hidden;
                transition: all 0.3s ease;
            }

            .card-header {
                padding: 15px 20px;
                font-weight: bold;
                cursor: pointer;
                background: #f0f0f0;
                border-bottom: 1px solid #000;
            }

            .card-header:hover {
                background: #ddd;
            }

            .card-content {
                padding: 0 20px;
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
            }

            .card-content ul {
                margin: 10px 0;
                padding-left: 20px;
                padding-top:20px;
                padding-bottom:20px;
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
                margin-top: 20px;
            }

            .menu-btn:hover {
                background: black;
                color: white;
            }
        `;
        document.head.appendChild(style);
    }
}
