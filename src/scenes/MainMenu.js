import { API_URL } from '../config.js';
import { getAlgorithmForLevel, fetchLevelData } from '../levels.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { endSession } from '../session.js';
import { mountScreen, drawBackdrop, icon, esc, avatarImg, flagImg, rovingFocus } from '../ui/dom.js';
import { CHARACTERS, characterKey, equippedSkin } from '../perks.js';

const GENERATOR_NAMES = {
    1: 'Random fill',
    2: 'Perlin noise',
    3: 'Simplex noise',
    4: 'Cellular automata',
    5: 'BSP rooms',
    6: 'Graph rooms',
    7: 'Transformer model',
};

export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    preload() {
    }

    create() {
        const userSettings = this.registry.get('userSettings');
        this.sound.pauseAll();
        this.music = this.sound.get('bg_music') || this.sound.add('bg_music', {
            loop: true,
            volume: userSettings.music_volume / 100
        });
        this.music.play();

        drawBackdrop(this, { seed: 'menu' });

        const user = this.registry.get('user');
        const inventory = this.registry.get('inventory') || [];
        const owned = (name) => inventory.find(e => e.item?.name?.toLowerCase() === name)?.quantity || 0;

        const screen = mountScreen(this, `
            <div class="menu">
                <header class="menu-top">
                    <span class="wordmark wordmark--sm">Lucky <span>You</span></span>
                    <span class="chip" title="Coins">${icon('coin')}<span id="coin-balance">${user.coins ?? 0}</span></span>
                </header>

                <div class="menu-main">
                    <button class="play" id="play">
                        <span class="eyebrow">Next up</span>
                        <b id="play-level">Play</b>
                        <small id="play-sub">Generated when you press play</small>
                    </button>
                    <nav class="nav" aria-label="Main menu">
                        <button id="shop">Shop</button>
                        <button id="locker">Locker</button>
                        <button id="leaderboard">Leaderboard</button>
                        <button id="settings">Settings</button>
                        <button id="help">How to play</button>
                    </nav>
                    <p class="message message--error" id="error-msg" role="alert"></p>
                </div>

                <aside class="menu-side">
                    <div class="panel">
                        <div class="player">
                            ${avatarImg(user.avatar)}
                            <div>
                                <div class="name">${esc(user.username)}</div>
                                <div class="sub">${flagImg(user.country)}<span id="player-progress">Loading progress</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="panel">
                        <span class="eyebrow">Loadout</span>
                        <div class="rows">
                            <div class="row"><span class="grow muted">Character</span><span class="value">${CHARACTERS[characterKey(user.avatar)].name}</span></div>
                            <div class="row"><span class="grow muted">Skin</span><span class="value">${esc(equippedSkin(user, inventory)?.name?.replace(/ Skin$/, '') || 'Default')}</span></div>
                        </div>
                    </div>
                    <div class="panel">
                        <span class="eyebrow">Inventory</span>
                        <div class="rows">
                            <div class="row">${icon('bomb')}<span class="grow">Bombs</span><span class="value">${owned('bomb')}</span></div>
                            <div class="row">${icon('wall')}<span class="grow">Walls</span><span class="value">${owned('wall')}</span></div>
                        </div>
                    </div>
                </aside>

                <footer class="menu-foot">
                    <button class="btn btn--ghost" id="logout">Sign out</button>
                </footer>
            </div>
        `);

        this.errorMessage = screen.querySelector('#error-msg');
        const $ = (id) => screen.querySelector(id);

        // Show which level is next and which generator will build it.
        this.getNextLevel(this.registry.get('token')).then(level => {
            $('#play-level').textContent = `Level ${level}`;
            $('#play-sub').textContent = `${GENERATOR_NAMES[getAlgorithmForLevel(level)]} · generated when you press play`;
            $('#player-progress').textContent = level > 1 ? `${level - 1} level${level > 2 ? 's' : ''} cleared` : 'No levels cleared yet';
        }).catch(() => {
            $('#player-progress').textContent = '';
        });

        $('#play').onclick = async () => {
            LoadingSpinner.show('Generating your level');
            try {
                await this.loadNextLevelData();
            } catch (error) {
                console.error('Error loading level:', error);
                this.showErrorMessage('Couldn’t generate the level. Is the generator running?');
            } finally {
                LoadingSpinner.hide();
            }
        };
        $('#leaderboard').onclick = () => this.scene.start('Leaderboard');
        $('#shop').onclick = () => this.scene.start('Shop');
        $('#locker').onclick = () => this.scene.start('Locker');

        // Keyboard: W/S or arrows move between options, Enter/Space picks
        rovingFocus(this, screen, '#play, .nav button, #logout');
        $('#play').focus();
        $('#settings').onclick = () => this.scene.start('Settings');
        $('#help').onclick = () => this.scene.start('Help');
        $('#logout').onclick = async () => {
            await this.logout(this.registry.get('token'));
            endSession(this.registry);
            this.scene.start('Login');
        };
    }

    showErrorMessage(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
        }
    }

    async logout(token) {
        LoadingSpinner.show('Signing out');

        try {
            const response = await fetch(`${API_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();
            if (response.status !== 200) {
                this.showErrorMessage('Your session had already ended.');
            }
        } catch (error) {
            console.error('Error logging out:', error);
            this.showErrorMessage('Couldn’t sign out cleanly.');
        }finally{
            LoadingSpinner.hide();
        }
    }

    async getNextLevel(token) {
        const response = await fetch(`${API_URL}/scores`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch scores');
        }

        const scores = await response.json();

        if (!scores || scores.length === 0) return 1;

        const highestLevel = Math.max(...scores.map(score => score.level));
        return highestLevel + 1;
    }

    async loadNextLevelData() {
        const token = this.registry.get('token');
        const nextLevel = await this.getNextLevel(token);
        const algorithm = getAlgorithmForLevel(nextLevel);
        const levelData = await fetchLevelData(algorithm, nextLevel);

        this.scene.start('Game', {
            levelId: nextLevel,
            levelData: levelData,
        });
    }
}
