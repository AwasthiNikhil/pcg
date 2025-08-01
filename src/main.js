import { Boot } from './scenes/Boot.js';
import { Preloader } from './scenes/Preloader.js';
import { Login } from './scenes/Login.js';
import { Register } from './scenes/Register.js';
import { MainMenu } from './scenes/MainMenu.js';
import { Game } from './scenes/Game.js';
import { PauseMenu } from './scenes/PauseMenu.js';
import { Leaderboard } from './scenes/Leaderboard.js';
import { Settings } from './scenes/Settings.js';
import { Shop } from './scenes/Shop.js';
import { Help } from './scenes/Help.js';
import { GameOver } from './scenes/GameOver.js';
import { LevelComplete } from './scenes/LevelComplete.js';


const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: 'game-container',
    // backgroundColor: '#028af8',
    backgroundColor: '#ffffff',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 500 }
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preloader,
        Login,
        Register,
        MainMenu,
        Game,
        PauseMenu,
        LevelComplete,
        Leaderboard,
        Shop,
        Settings,
        Help,
        GameOver,
    ]
};

new Phaser.Game(config);
