import { API_URL } from '../config.js';
import { getAlgorithmForLevel, fetchLevelData } from '../levels.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { scoreLevel } from '../scoring.js';
import { mountScreen, icon, toast } from '../ui/dom.js';

export class LevelComplete extends Phaser.Scene {
    constructor() {
        super('LevelComplete');
    }

    init(data) {
        this.levelId = data.levelId;
        this.coinsCollected = data.coinsCollected;
        this.totalCoins = data.totalCoins;
        this.remainingTime = data.remainingTime;
        this.bestCombo = data.bestCombo || 0;
        this.kills = data.kills || 0;
        this.payout = data.payout || 0;
    }

    create() {
        const settings = this.registry.get('userSettings');
        this.sound.add('level_complete', { volume: settings.sfx_volume / 100 }).play();

        const score = scoreLevel({
            level: this.levelId,
            coins: this.coinsCollected,
            totalCoins: this.totalCoins,
            kills: this.kills,
            secondsLeft: this.remainingTime,
            bestCombo: this.bestCombo,
        });
        this.submitScore(this.levelId, score.total).catch(error => {
            console.error('Failed to submit score:', error);
            toast('Your score couldn’t be saved.', 'error');
        });

        const screen = mountScreen(this, `
            <div class="center">
                <div class="card" role="dialog" aria-modal="true" aria-labelledby="done-title">
                    <div>
                        <span class="eyebrow">Level ${this.levelId}</span>
                        <h1 class="title" id="done-title">Cleared</h1>
                    </div>
                    <div class="stats">
                        <div class="stat stat--wide"><span class="eyebrow">Score</span><b>${score.total}</b></div>
                        <div class="stat"><span class="eyebrow">Coins</span><b>${this.coinsCollected}/${this.totalCoins}</b></div>
                        <div class="stat"><span class="eyebrow">Earned</span><b>${icon('coin')} +${this.payout}</b></div>
                    </div>
                    <div class="breakdown">
                        ${score.parts.map(([label, points]) => `<div><span>${label}</span><b>${points}</b></div>`).join('')}
                        <div class="mult"><span>Level ${this.levelId} bonus</span><b>×${score.multiplier.toFixed(1)}</b></div>
                    </div>
                    <div class="actions">
                        <button class="btn btn--primary btn--lg" id="next">Next level</button>
                        <button class="btn" id="menu">Main menu</button>
                    </div>
                </div>
            </div>
        `, 'screen--dim');

        const next = screen.querySelector('#next');
        next.focus();
        next.onclick = async () => {
            const nextLevel = this.levelId + 1;
            LoadingSpinner.show('Generating the next level');
            try {
                const levelData = await fetchLevelData(getAlgorithmForLevel(nextLevel), nextLevel);
                this.scene.start('Game', { levelId: nextLevel, levelData });
            } catch (error) {
                console.error('Failed to load next level:', error);
                toast('Couldn’t generate the next level. Try again.', 'error');
            } finally {
                LoadingSpinner.hide();
            }
        };
        screen.querySelector('#menu').onclick = () => this.scene.start('MainMenu');
    }

    async submitScore(level, score) {
        const response = await fetch(`${API_URL}/scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + this.registry.get('token')
            },
            body: JSON.stringify({ level, score })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to submit score');
        }
        return response.json();
    }
}
