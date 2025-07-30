export class Leaderboard extends Phaser.Scene {
    constructor() {
        super('Leaderboard');
    }

    create() {
        // Clear any existing DOM from other scenes
        this.cleanupDOM();

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.id = 'leaderboard-wrapper';
        document.body.appendChild(wrapper);

        wrapper.innerHTML = `
            <h1>Leaderboard</h1>
            <select id="sort-select">
                <option value="score">Sort by Score</option>
                <option value="coins">Sort by Coins</option>
            </select>
            <ul id="leaderboard-list"></ul>
            <button class="menu-btn" id="back-btn">Back to Menu</button>
        `;

        this.addDOMStyles();

        document.getElementById('back-btn').onclick = () => {
            wrapper.remove();
            this.scene.start('MainMenu');
        };

        document.getElementById('sort-select').onchange = (e) => {
            const sortBy = e.target.value;
            this.displayLeaderboard(sortBy);
        };

        this.fetchLeaderboard()
            .then(data => {
                this.leaderboardData = data;
                this.displayLeaderboard('score');
            })
            .catch(err => {
                console.error("Failed fetching leaderboard:", err);
                document.getElementById('leaderboard-list').innerHTML = `<li style="color:red;">Failed to load leaderboard.</li>`;
            });
    }

    displayLeaderboard(sortBy) {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = ''; // Clear existing

        let sorted = [...this.leaderboardData];
        if (sortBy === 'score') {
            sorted.sort((a, b) => b.total_score - a.total_score);
        } else {
            sorted.sort((a, b) => b.user.coins - a.user.coins);
        }

        const currentUserId = this.registry.get('user')?.id;

        // Add header row
        const header = document.createElement('div');
        header.className = 'leaderboard-row header';
        header.innerHTML = `
        <span>#</span>
        <span>Username</span>
        <span>${sortBy === 'score' ? 'Score' : 'Coins'}</span>
    `;
        list.appendChild(header);

        sorted.forEach((player, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            if (player.user.id === currentUserId) {
                row.classList.add('highlight');
            }

            row.innerHTML = `
            <span>${index + 1}</span>
            <span>${player.user.username}</span>
            <span>${sortBy === 'score' ? player.total_score : player.user.coins}</span>
        `;
            list.appendChild(row);
        });
    }


    async fetchLeaderboard() {
        const response = await fetch('http://localhost:8000/api/leaderboard', {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.registry.get('token')
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch leaderboard');
        }

        return await response.json();
    }

    cleanupDOM() {
        document.getElementById('leaderboard-wrapper')?.remove();
    }

    addDOMStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #leaderboard-wrapper {
                position: absolute;
                top: 10%;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
                font-family: Arial, sans-serif;
            }

            #leaderboard-wrapper h1 {
                font-size: 48px;
                color: #000;
                margin-bottom: 10px;
            }

            #sort-select {
                font-size: 20px;
                padding: 10px;
                width: 250px;
            }

            #leaderboard-list {
                list-style: none;
                padding: 0;
                margin: 0;
                width: 100%;
                max-height: 500px;
                overflow-y: auto;
                text-align: center;
                font-size: 20px;
                color: #000;
            }

            #leaderboard-list li {
                margin: 5px 0;
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

            #leaderboard-list {
                display: flex;
                flex-direction: column;
                width: 500px;
                margin-top: 10px;
                border: 1px solid #ccc;
                border-radius: 10px;
                overflow: hidden;
            }

            .leaderboard-row {
                display: grid;
                grid-template-columns: 50px 1fr 100px;
                padding: 10px 15px;
                border-bottom: 1px solid #ddd;
                font-size: 18px;
                color: #000;
                background-color: #fff;
            }

            .leaderboard-row.header {
                font-weight: bold;
                background-color: #f0f0f0;
            }

            .leaderboard-row.highlight {
                background-color: #fffae6;
                color: #d4a200;
                font-weight: bold;
            }

        `;
        document.head.appendChild(style);
    }
}
