// Small helpers for the HTML interface layered over the Phaser canvas.

const root = () => document.getElementById('ui');

// Render a screen for a scene; it is removed when the scene shuts down.
export function mountScreen(scene, html, className = '') {
    const el = document.createElement('section');
    el.className = `screen ${className}`.trim();
    el.innerHTML = html;
    root().appendChild(el);
    scene.events.once('shutdown', () => el.remove());
    // The game scene captures keys (Space, W, S...) page-wide; menus need them back.
    scene.input.keyboard.clearCaptures();
    return el;
}

// Run fn on Esc, unless something already handled the key (e.g. key capture in Settings).
export function onEscape(scene, fn) {
    const handler = (e) => {
        if (e.key === 'Escape' && !e.defaultPrevented) fn();
    };
    window.addEventListener('keydown', handler);
    scene.events.once('shutdown', () => window.removeEventListener('keydown', handler));
}

// Move focus through a list of controls with W/S, A/D or the arrow keys;
// Enter and Space press the focused button as usual.
export function rovingFocus(scene, container, selector) {
    const keys = { ArrowUp: -1, ArrowLeft: -1, w: -1, a: -1, ArrowDown: 1, ArrowRight: 1, s: 1, d: 1 };
    const handler = (e) => {
        const step = keys[e.key.length === 1 ? e.key.toLowerCase() : e.key];
        if (!step || e.target.matches?.('input, select, textarea')) return;
        const items = [...container.querySelectorAll(selector)].filter(el => !el.disabled && el.offsetParent !== null);
        const i = items.indexOf(document.activeElement);
        items[(i + step + items.length) % items.length]?.focus();
        e.preventDefault();
    };
    window.addEventListener('keydown', handler);
    scene.events.once('shutdown', () => window.removeEventListener('keydown', handler));
}

// Escape text that came from the server before putting it into markup.
export function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Game sprites used as interface icons.
export function icon(name, size = '') {
    const cls = `icon ${size ? `icon--${size}` : ''}`;
    if (name === 'wall') return `<span class="${cls} icon-brick" aria-hidden="true"></span>`;
    return `<img class="${cls}" src="assets/${name}.png" alt="" aria-hidden="true">`;
}

export function itemIcon(item, size) {
    const name = (item?.name || '').toLowerCase();
    if (name === 'bomb') return icon('bomb', size);
    if (name === 'wall') return icon('wall', size);
    return icon('star', size);
}

// Avatars are stored with or without the extension depending on how the user was created.
export function avatarSrc(avatar) {
    return `assets/avatars/${String(avatar || 'avatar').replace(/(\.png)+$/, '')}.png`;
}

// <img> for an avatar, falling back to the default if the file is missing
export function avatarImg(avatar, cls = 'avatar') {
    return `<img class="${cls}" src="${avatarSrc(avatar)}" alt="" onerror="this.onerror=null;this.src='assets/avatars/avatar.png'">`;
}

// Flag for an ISO country code; older accounts stored names, which have no flag
export function flagImg(country) {
    return /^[A-Z]{2}$/.test(country || '') ? `<img class="flag" src="assets/flags/${country}.png" alt="${country}">` : '';
}

let toastTimer;
export function toast(message, type = 'info') {
    document.querySelector('.toast')?.remove();
    clearTimeout(toastTimer);
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', 'status');
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    toastTimer = setTimeout(() => {
        el.classList.remove('is-visible');
        setTimeout(() => el.remove(), 400);
    }, 2800);
}

// Behind every menu: a cave grown by cellular automata, the same family of
// algorithm that builds the levels. Drawn once per scene on the canvas.
export function drawBackdrop(scene, { seed = Date.now() } = {}) {
    const W = 1920, H = 1080, size = 60;
    const cols = Math.ceil(W / size), rows = Math.ceil(H / size);
    const rnd = new Phaser.Math.RandomDataGenerator([String(seed)]);

    let grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => rnd.frac() < 0.46));
    for (let pass = 0; pass < 4; pass++) {
        grid = grid.map((row, y) => row.map((_, x) => {
            let n = 0;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                if (dx || dy) n += grid[y + dy]?.[x + dx] ?? 1;
            }
            return n >= 5;
        }));
    }

    scene.cameras.main.setBackgroundColor('#0e0e10');
    const g = scene.add.graphics();
    g.fillStyle(0x1a1a1f);
    grid.forEach((row, y) => row.forEach((wall, x) => {
        if (wall) g.fillRect(x * size, y * size, size - 2, size - 2);
    }));
    // a few coins resting on ledges
    g.fillStyle(0xf5c542, 0.55);
    for (let i = 0; i < 9; i++) {
        const x = rnd.between(1, cols - 2), y = rnd.between(1, rows - 2);
        if (!grid[y][x] && grid[y + 1][x]) g.fillCircle(x * size + size / 2, y * size + size / 2, 7);
    }
    scene.tweens.add({ targets: g, y: -24, duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return g;
}

// Brand column + form panel shared by Login and Register.
export function authLayout(panelHtml) {
    return `
        <div class="auth">
            <div class="auth-brand">
                <span class="eyebrow">A procedural platformer</span>
                <h1 class="wordmark">Lucky<br><span>You</span></h1>
                <p class="lede">Every level is generated the moment you press play. Grab the key, beat the clock, find the exit.</p>
            </div>
            <div class="auth-panel panel">${panelHtml}</div>
        </div>`;
}

// Default key bindings (keyCodes); saved bindings override these.
const K = () => Phaser.Input.Keyboard.KeyCodes;
export function bindingsFor(settings) {
    const k = K();
    return {
        jump: k.W, move_left: k.A, move_right: k.D, shoot: k.SPACE,
        place_wall: k.E, place_wall_below: k.Q, dash: k.SHIFT, dash_down: k.S,
        ...(settings?.keyboard_bindings || {}),
    };
}

// "SPACE" -> "Space", 87 -> "W"
export function keyName(code) {
    const match = Object.entries(K()).find(([, value]) => value === code);
    if (!match) return '—';
    const name = match[0].replace(/_/g, ' ');
    return name.length === 1 ? name : name[0] + name.slice(1).toLowerCase();
}

// Tab bar markup: [{ id, label, count }]
export function tabBar(tabs, active) {
    return `<div class="segmented" role="tablist">${tabs.map(t => `
        <button role="tab" data-tab="${t.id}" aria-selected="${t.id === active}">${t.label}${t.count != null ? `<span class="count">${t.count}</span>` : ''}</button>`).join('')}
    </div>`;
}

// Remember small UI choices (like the last tab) for this browser
export function remember(key, value) {
    try {
        if (value === undefined) return localStorage.getItem(`luckyyou.${key}`);
        localStorage.setItem(`luckyyou.${key}`, value);
    } catch { return null; }
}
