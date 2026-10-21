import { api } from '../api.js';
import { CHARACTERS, SKIN_PERKS, characterKey, equippedSkin } from '../perks.js';
import { mountScreen, drawBackdrop, icon, esc, toast, onEscape, rovingFocus, tabBar, remember } from '../ui/dom.js';
import { perkLines, skinPreview } from '../ui/perks.js';

// What you own and what you're wearing. Buying happens in the Shop.
export class Locker extends Phaser.Scene {
    constructor() {
        super('Locker');
    }

    create() {
        drawBackdrop(this, { seed: 'locker' });
        this.tab = ['characters', 'skins', 'gear'].includes(remember('lockerTab')) ? remember('lockerTab') : 'characters';
        this.screen = mountScreen(this, `
            <div class="page">
                <header class="page-head">
                    <div>
                        <button class="back" id="back-btn">Menu</button>
                        <h1 class="title">Locker</h1>
                    </div>
                    <button class="btn" id="shop-btn">Shop</button>
                </header>
                <div class="collection">
                    <aside class="panel loadout-card" id="loadout"></aside>
                    <div>
                        <div id="tabs"></div>
                        <div class="goods" id="items" role="tabpanel"></div>
                    </div>
                </div>
            </div>
        `);
        const back = () => this.scene.start('MainMenu');
        this.screen.querySelector('#back-btn').onclick = back;
        this.screen.querySelector('#shop-btn').onclick = () => this.scene.start('Shop');
        this.screen.addEventListener('click', (e) => this.onAction(e));
        onEscape(this, back);
        rovingFocus(this, this.screen, 'button:not([disabled])');
        this.render();
    }

    render() {
        const user = this.registry.get('user');
        const inventory = this.registry.get('inventory') || [];
        const current = characterKey(user.avatar);
        const skin = equippedSkin(user, inventory);
        const count = (name) => inventory.find(e => e.item?.name?.toLowerCase() === name)?.quantity || 0;
        const skins = [{ id: null, name: 'Default', tint: null }, ...inventory.filter(e => e.item?.type === 'skin').map(e => e.item)];

        // Pinned summary of what you're wearing and what it does
        this.screen.querySelector('#loadout').innerHTML = `
            <span class="eyebrow">Your loadout</span>
            <div class="loadout-art">
                <img class="character-art" src="assets/avatars/${CHARACTERS[current].avatar}.png" alt="">
                ${skinPreview(skin?.tint)}
            </div>
            <h2 class="heading">${CHARACTERS[current].name}<br><span class="muted">${esc(skin?.name.replace(/ Skin$/, '') || 'Default')} skin</span></h2>
            ${perkLines(CHARACTERS[current])}
            ${perkLines(SKIN_PERKS[skin?.name])}
            <div class="rows">
                <div class="row">${icon('bomb')}<span class="grow">Bombs</span><span class="value">${count('bomb')}</span></div>
                <div class="row">${icon('wall')}<span class="grow">Walls</span><span class="value">${count('wall')}</span></div>
            </div>`;

        this.screen.querySelector('#tabs').innerHTML = tabBar([
            { id: 'characters', label: 'Characters', count: Object.keys(CHARACTERS).length },
            { id: 'skins', label: 'Skins', count: skins.length },
            { id: 'gear', label: 'Gear', count: count('bomb') + count('wall') },
        ], this.tab);

        const card = (art, title, body, action, equipped) => `
            <article class="good panel ${equipped ? 'is-equipped' : ''}">
                <div class="good-head">${art}<h2 class="heading">${title}</h2></div>
                ${body}
                <div class="good-foot"><span></span>${action}</div>
            </article>`;

        let html = '';
        if (this.tab === 'characters') {
            html = Object.entries(CHARACTERS).map(([key, c]) => card(
                `<img class="character-art" src="assets/avatars/${c.avatar}.png" alt="">`, c.name, perkLines(c),
                key === current ? '<button class="btn" disabled>Selected</button>' : `<button class="btn" data-character="${key}">Select</button>`,
                key === current)).join('');
        } else if (this.tab === 'skins') {
            const equippedId = user.skin_item_id ?? null;
            html = skins.map(s => card(skinPreview(s.tint), esc(s.name.replace(/ Skin$/, '')),
                s.id ? perkLines(SKIN_PERKS[s.name]) : '<div class="perks"><span class="muted">No perk</span></div>',
                s.id === equippedId ? '<button class="btn" disabled>Equipped</button>' : `<button class="btn" data-equip="${s.id ?? ''}">Equip</button>`,
                s.id === equippedId)).join('')
                + `<article class="panel cta-card"><p class="muted">More skins in the shop</p><button class="btn btn--primary" data-go="Shop">Browse skins</button></article>`;
        } else {
            html = [['bomb', 'Bombs', 'Clears a 2×2 block of walls'], ['wall', 'Walls', 'Place ahead or below you. Dash through blocks to collect more']]
                .map(([k, label, what]) => card(icon(k, 'lg'), `${label} <span class="muted">× ${count(k)}</span>`, `<p class="muted">${what}</p>`,
                    '<button class="btn" data-go="Shop">Buy more</button>')).join('');
        }
        this.screen.querySelector('#items').innerHTML = html;
    }

    async onAction(e) {
        const tab = e.target.closest('[data-tab]');
        if (tab) {
            this.tab = tab.dataset.tab;
            remember('lockerTab', this.tab);
            this.render();
            this.screen.querySelector(`[data-tab="${this.tab}"]`).focus();
            return;
        }
        const btn = e.target.closest('[data-character], [data-equip], [data-go]');
        if (!btn) return;
        if (btn.dataset.go) return this.scene.start(btn.dataset.go);
        btn.classList.add('is-busy');
        try {
            const user = this.registry.get('user');
            if (btn.dataset.character) {
                const res = await api(this.registry, '/character', 'PUT', { character: btn.dataset.character });
                const data = await res.json();
                if (!res.ok) return toast(data.message || 'Couldn’t switch character.', 'error');
                user.avatar = data.avatar;
            } else {
                const res = await api(this.registry, '/skin', 'PUT', { item_id: btn.dataset.equip ? Number(btn.dataset.equip) : null });
                const data = await res.json();
                if (!res.ok) return toast(data.message || 'Couldn’t change your skin.', 'error');
                user.skin_item_id = data.skin_item_id;
            }
            this.registry.set('user', user);
            this.render();
            // keep keyboard focus in the section the player was using
            this.screen.querySelector('#items button:not([disabled])')?.focus();
        } catch (error) {
            console.error('Locker update failed:', error);
            toast('Something went wrong. Try again.', 'error');
        } finally {
            btn.classList.remove('is-busy');
        }
    }
}
