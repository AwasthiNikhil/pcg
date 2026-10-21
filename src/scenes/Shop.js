import { api } from '../api.js';
import { SKIN_PERKS } from '../perks.js';
import { mountScreen, drawBackdrop, icon, itemIcon, esc, toast, onEscape, rovingFocus, tabBar, remember } from '../ui/dom.js';
import { perkLines, skinPreview } from '../ui/perks.js';

export class Shop extends Phaser.Scene {
    constructor() {
        super('Shop');
    }

    create() {
        drawBackdrop(this, { seed: 'shop' });
        this.tab = remember('shopTab') === 'skins' ? 'skins' : 'gear';
        this.screen = mountScreen(this, `
            <div class="page">
                <header class="page-head">
                    <div>
                        <button class="back" id="back-btn">Menu</button>
                        <h1 class="title">Shop</h1>
                    </div>
                </header>
                <div class="collection">
                    <aside class="panel loadout-card">
                        <span class="eyebrow">Balance</span>
                        <span class="title">${icon('coin', 'lg')} <span id="coin-balance"></span></span>
                        <p class="muted">Earn coins by collecting them in levels: ×10 when you clear a level, ×5 when you don’t.</p>
                        <button class="btn" id="locker-btn">Go to Locker</button>
                    </aside>
                    <div>
                        <div id="tabs"></div>
                        <div class="goods" id="items" role="tabpanel"><p class="muted">Loading</p></div>
                    </div>
                </div>
            </div>
        `);
        const back = () => this.scene.start('MainMenu');
        this.screen.querySelector('#back-btn').onclick = back;
        this.screen.querySelector('#locker-btn').onclick = () => this.scene.start('Locker');
        this.screen.addEventListener('click', (e) => this.onAction(e));
        onEscape(this, back);
        rovingFocus(this, this.screen, 'button:not([disabled])');
        this.loadItems();
    }

    async loadItems() {
        try {
            const res = await api(this.registry, '/items');
            if (!res.ok) throw new Error(res.statusText);
            this.items = await res.json();
            this.render();
        } catch (error) {
            console.error('Error fetching items:', error);
            this.screen.querySelector('#items').innerHTML = '<p class="message message--error">Couldn’t load the shop. Try again in a moment.</p>';
        }
    }

    render() {
        const user = this.registry.get('user');
        const inventory = this.registry.get('inventory') || [];
        const owned = (id) => inventory.find(e => e.item?.id === id)?.quantity || 0;
        const price = (item) => `<span class="price">${icon('coin')}${item.price}</span>`;

        this.screen.querySelector('#coin-balance').textContent = user?.coins ?? 0;

        // Gear the game uses (the Speed Boost power-up isn't in the game, so it isn't sold)
        const gearHtml = this.items.filter(i => i.type === 'item').map(item => `
            <article class="good panel">
                <div class="good-head">
                    ${itemIcon(item, 'lg')}
                    <h2 class="heading">${esc(item.name)}</h2>
                    <span class="good-owned">Owned <b>${owned(item.id)}</b></span>
                </div>
                <p class="muted">${esc(item.description)}</p>
                <div class="good-foot">
                    ${price(item)}
                    <button class="btn btn--primary" data-buy="${item.id}">Buy</button>
                </div>
            </article>`).join('');

        const skins = [{ id: null, name: 'Default', description: 'The original look.', tint: null }, ...this.items.filter(i => i.type === 'skin')];
        const equipped = user?.skin_item_id ?? null;
        const skinsHtml = skins.map(skin => {
            const isEquipped = skin.id === equipped;
            const has = skin.id === null || owned(skin.id) > 0;
            const action = isEquipped
                ? '<button class="btn" disabled>Equipped</button>'
                : has
                    ? `<button class="btn" data-equip="${skin.id ?? ''}">Equip</button>`
                    : `<button class="btn btn--primary" data-buy="${skin.id}">Buy</button>`;
            return `
            <article class="good panel ${isEquipped ? 'is-equipped' : ''}">
                <div class="good-head">
                    ${skinPreview(skin.tint)}
                    <h2 class="heading">${esc(skin.name.replace(/ Skin$/, ''))}</h2>
                </div>
                <div class="stack">
                    <p class="muted">${esc(skin.description)}</p>
                    ${skin.id ? perkLines(SKIN_PERKS[skin.name]) : '<div class="perks"><span class="muted">No perk</span></div>'}
                </div>
                <div class="good-foot">
                    ${has ? '<span class="good-owned">Owned</span>' : price(skin)}
                    ${action}
                </div>
            </article>`;
        }).join('');

        const ownedSkins = skins.filter(sk => sk.id === null || owned(sk.id) > 0).length;
        this.screen.querySelector('#tabs').innerHTML = tabBar([
            { id: 'gear', label: 'Gear' },
            { id: 'skins', label: 'Skins', count: `${ownedSkins}/${skins.length}` },
        ], this.tab);
        this.screen.querySelector('#items').innerHTML = this.tab === 'gear' ? gearHtml : skinsHtml;
    }

    async onAction(e) {
        const tab = e.target.closest('[data-tab]');
        if (tab) {
            this.tab = tab.dataset.tab;
            remember('shopTab', this.tab);
            this.render();
            this.screen.querySelector(`[data-tab="${this.tab}"]`).focus();
            return;
        }
        const btn = e.target.closest('[data-buy], [data-equip]');
        if (!btn) return;
        btn.classList.add('is-busy');
        try {
            if (btn.dataset.buy) await this.buy(Number(btn.dataset.buy));
            else await this.equip(btn.dataset.equip ? Number(btn.dataset.equip) : null);
        } finally {
            btn.classList.remove('is-busy');
        }
    }

    async buy(itemId) {
        const item = this.items.find(i => i.id === itemId);
        if ((this.registry.get('user')?.coins ?? 0) < item.price) {
            toast('Not enough coins yet. Collect more in a level.', 'error');
            return;
        }
        try {
            const res = await api(this.registry, '/shop/buy', 'POST', { item_id: itemId });
            const data = await res.json();
            if (!res.ok) {
                toast(data.message || 'Couldn’t complete the purchase.', 'error');
                return;
            }
            const user = this.registry.get('user');
            user.coins = data.coins;
            this.registry.set('user', user);
            this.registry.set('inventory', data.inventory);
            toast(item.type === 'skin' ? `${item.name.replace(/ Skin$/, '')} unlocked. Equip it here or in your Locker.` : `Bought a ${item.name.toLowerCase()}.`, 'success');
            this.render();
        } catch (error) {
            console.error('Purchase failed:', error);
            toast('Something went wrong. Try again.', 'error');
        }
    }

    async equip(itemId) {
        try {
            const res = await api(this.registry, '/skin', 'PUT', { item_id: itemId });
            const data = await res.json();
            if (!res.ok) {
                toast(data.message || 'Couldn’t change your skin.', 'error');
                return;
            }
            const user = this.registry.get('user');
            user.skin_item_id = data.skin_item_id;
            this.registry.set('user', user);
            this.render();
        } catch (error) {
            console.error('Equip failed:', error);
            toast('Something went wrong. Try again.', 'error');
        }
    }
}
