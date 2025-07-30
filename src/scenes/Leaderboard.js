export class Leaderboard extends Phaser.Scene {
    constructor() {
        super('Leaderboard');
    }

    create() {
        // Fetch leaderboard data
        this.fetchLeaderboard()
            .then(data => {
                this.leaderboardData = data; // Store the leaderboard data
                console.log("Fetched leaderboard successfully.", data); 

                // Create UI elements
                this.createDropdown();
                this.displayLeaderboard('score'); // Default sort by score
            })
            .catch(error => {
                console.error("Failed fetching leaderboard:", error);
            });
    }

    // Dropdown to switch between sorting by score or coins
    createDropdown() {
        const dropdown = this.add.text(20, 20, 'Sort by: Score', {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 10, y: 5 }
        }).setOrigin(0, 0).setInteractive();

        dropdown.on('pointerdown', () => {
            // Toggle between "score" and "coins"
            if (dropdown.text === 'Sort by: Score') {
                dropdown.setText('Sort by: Coins');
                this.displayLeaderboard('coins');
            } else {
                dropdown.setText('Sort by: Score');
                this.displayLeaderboard('score');
            }
        });
    }

    // Display leaderboard sorted by score or coins
    displayLeaderboard(sortBy) {
        // Sort the leaderboard data
        let sortedData;
        if (sortBy === 'score') {
            sortedData = this.leaderboardData.sort((a, b) => b.total_score - a.total_score);
        } else if (sortBy === 'coins') {
            sortedData = this.leaderboardData.sort((a, b) => b.user.coins - a.user.coins);
        }

        // Clear previous leaderboard display
        if (this.leaderboardGroup) {
            this.leaderboardGroup.clear(true, true);
        }

        // Create the leaderboard display
        this.leaderboardGroup = this.add.group();
        const yOffset = 60; // Starting Y position for the first player
        const centerX = this.scale.width / 2; // Horizontal center of the screen

        sortedData.forEach((player, index) => {
            const isCurrentUser = player.user.id === this.registry.get('user').id;
            const color = isCurrentUser ? '#ff0' : '#fff'; // Highlight current player in yellow

            // Ensure the correct field is displayed based on sortBy
            const displayValue = sortBy === 'score' ? player.total_score : player.user.coins;

            // Create the leaderboard text with horizontal centering
            const text = this.add.text(centerX, yOffset + index * 30, `${player.user.username}: ${displayValue}`, {
                fontSize: '20px',
                fill: color
            }).setOrigin(0.5, 0); // Center horizontally, align to top vertically

            this.leaderboardGroup.add(text);
        });
    }

    // Fetch leaderboard data from the API
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
}
