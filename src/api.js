import { API_URL } from './config.js';

// Authenticated JSON request to the pcg-db API.
export function api(registry, path, method = 'GET', body) {
    return fetch(`${API_URL}${path}`, {
        method,
        headers: {
            'Authorization': `Bearer ${registry.get('token')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
}
