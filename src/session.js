import { API_URL } from './config.js';

// The sign-in token is kept in localStorage so a refresh (or a browser
// restart) keeps you signed in. Signing out removes it.
const KEY = 'luckyyou.token';

export function storedToken() {
    try { return localStorage.getItem(KEY); } catch { return null; }
}

// Load the player's account, settings and inventory, then remember the token.
export async function startSession(registry, token) {
    const get = async (path) => {
        const res = await fetch(`${API_URL}${path}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error(`${path}: ${res.status}`);
        return res.json();
    };
    const [user, settings, inventory] = await Promise.all([get('/user'), get('/settings'), get('/inventory')]);
    registry.set('token', token);
    registry.set('user', user);
    registry.set('userSettings', settings);
    registry.set('inventory', inventory);
    try { localStorage.setItem(KEY, token); } catch { /* private mode: session lasts until refresh */ }
}

export function endSession(registry) {
    try { localStorage.removeItem(KEY); } catch { /* nothing stored */ }
    for (const key of ['token', 'user', 'userSettings', 'inventory']) registry.remove(key);
}
