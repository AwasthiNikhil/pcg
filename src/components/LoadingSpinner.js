import { esc } from '../ui/dom.js';

// Full-screen loading state: a small grid that "generates" while you wait.
export class LoadingSpinner {
    static show(message = 'Loading') {
        if (document.getElementById('loading-spinner')) return;
        const el = document.createElement('div');
        el.id = 'loading-spinner';
        el.className = 'loading';
        el.setAttribute('role', 'status');
        el.innerHTML = `
            <div class="loading-grid" aria-hidden="true">${'<i></i>'.repeat(9)}</div>
            <p>${esc(message)}</p>
        `;
        document.getElementById('ui').appendChild(el);
    }

    static hide() {
        document.getElementById('loading-spinner')?.remove();
    }
}
