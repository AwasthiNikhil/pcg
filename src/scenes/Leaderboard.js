import { API_URL } from '../config.js';
import { mountScreen, drawBackdrop, esc, avatarImg, flagImg, onEscape, rovingFocus } from '../ui/dom.js';

export class Leaderboard extends Phaser.Scene {
    constructor() {
        super('Leaderboard');
    }

    create() {
        drawBackdrop(this, { seed: 'leaderboard' });
        this.screen = mountScreen(this, `
            <div class="page">
                <header class="page-head">
                    <div>
                        <button class="back" id="back-btn">Menu</button>
                        <h1 class="title">Leaderboard</h1>
                    </div>
                    <div class="segmented" role="group" aria-label="Rank by">
                        <button data-sort="score" aria-pressed="true">Score</button>
                        <button data-sort="coins" aria-pressed="false">Coins</button>
                    </div>
                </header>
                <div class="panel board" id="leaderboard-list"><div class="board-row"><span></span><span class="muted">Loading</span></div></div>
            </div>
        `);
        const back = () => this.scene.start('MainMenu');
        this.screen.querySelector('#back-btn').onclick = back;
        onEscape(this, back);
        rovingFocus(this, this.screen, 'button');
        this.screen.querySelectorAll('[data-sort]').forEach(btn => {
            btn.onclick = () => {
                this.screen.querySelectorAll('[data-sort]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
                this.displayLeaderboard(btn.dataset.sort);
            };
        });

        this.fetchLeaderboard()
            .then(data => {
                this.leaderboardData = data;
                this.displayLeaderboard('score');
            })
            .catch(err => {
                console.error('Failed fetching leaderboard:', err);
                this.screen.querySelector('#leaderboard-list').innerHTML = '<p class="message message--error board-row">Couldn’t load the leaderboard.</p>';
            });
    }

    displayLeaderboard(sortBy) {
        const value = (p) => sortBy === 'score' ? p.total_score : p.user.coins;
        const sorted = [...this.leaderboardData].sort((a, b) => value(b) - value(a));
        const youId = this.registry.get('user')?.id;
        const youIndex = sorted.findIndex(p => p.user.id === youId);

        const row = (p, i) => `
            <div class="board-row ${p.user.id === youId ? 'is-you' : ''}">
                <span class="rank">${i + 1}</span>
                <span class="who">
                    ${avatarImg(p.user.avatar, 'avatar avatar--sm')}
                    <span>${esc(p.user.username)}</span>
                    ${flagImg(p.user.country)}
                </span>
                <span class="lvl">${p.highest_level ?? ''}</span>
                <span class="score">${value(p)}</span>
            </div>`;

        let html = `<div class="board-row board-row--head"><span>#</span><span>Player</span><span class="lvl">Level</span><span class="score">${sortBy === 'score' ? 'Score' : 'Coins'}</span></div>`;
        html += sorted.slice(0, 10).map(row).join('');
        if (youIndex >= 10) {
            html += '<div class="board-gap" aria-hidden="true">···</div>' + row(sorted[youIndex], youIndex);
        }
        this.screen.querySelector('#leaderboard-list').innerHTML = html;
    }

    async fetchLeaderboard() {
        const response = await fetch(`${API_URL}/leaderboard`, {
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
