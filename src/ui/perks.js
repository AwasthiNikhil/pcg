import { esc } from './dom.js';

// "+ perk / − drawback" lines
export function perkLines(def) {
    if (!def) return '';
    return `<div class="perks">
        ${def.perk ? `<span class="up">${esc(def.perk)}</span>` : ''}
        ${def.drawback ? `<span class="down">${esc(def.drawback)}</span>` : ''}
    </div>`;
}

// Skin preview: the player sprite tinted like in game
export function skinPreview(tint) {
    return `<span class="skin-preview" ${tint ? `style="--tint:${esc(tint)}"` : ''} aria-hidden="true"></span>`;
}
