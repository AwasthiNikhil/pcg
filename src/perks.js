// Characters are free to switch between; skins are bought in the shop.
// Each gives a perk, some with a drawback. Effects multiply/combine below.
export const CHARACTERS = {
    rookie:  { name: 'Rookie',  avatar: 'avatar',  perk: 'Balanced. No perks, no drawbacks.', effects: {} },
    warrior: { name: 'Warrior', avatar: 'warrior', perk: 'Shrugs off one hit each level', drawback: '5% slower', effects: { shield: 1, run: 0.95 } },
    mage:    { name: 'Mage',    avatar: 'mage',    perk: 'Dash recharges 40% faster', effects: { dashCooldown: 0.6 } },
    archer:  { name: 'Archer',  avatar: 'archer',  perk: 'Starts every level with a free bomb', effects: { freeBombs: 1 } },
};

export const SKIN_PERKS = {
    'Golden Skin': { perk: 'Coins pay out 20% more', effects: { payout: 1.2 } },
    'Frost Skin':  { perk: 'Runs 15% faster and jumps higher', effects: { run: 1.15, jump: 1.05 } },
    'Ember Skin':  { perk: 'Walks on lava', drawback: '5% slower', effects: { lavaProof: true, run: 0.95 } },
    'Shadow Skin': { perk: 'Enemies only notice you up close', drawback: '10% slower', effects: { detection: 0.5, run: 0.9 } },
};

export function characterKey(avatar) {
    const key = String(avatar || '').replace(/(\.png)+$/, '');
    return CHARACTERS[key] ? key : 'rookie';
}

export function equippedSkin(user, inventory) {
    return (inventory || []).find(e => e.item?.id === user?.skin_item_id)?.item || null;
}

// The combined effect of the player's character and skin.
export function loadout(user, inventory) {
    const parts = [CHARACTERS[characterKey(user?.avatar)].effects, SKIN_PERKS[equippedSkin(user, inventory)?.name]?.effects || {}];
    const out = { run: 1, jump: 1, dashCooldown: 1, payout: 1, detection: 1, shield: 0, freeBombs: 0, lavaProof: false };
    for (const e of parts) {
        for (const k of ['run', 'jump', 'dashCooldown', 'payout', 'detection']) if (e[k]) out[k] *= e[k];
        out.shield += e.shield || 0;
        out.freeBombs += e.freeBombs || 0;
        out.lavaProof ||= !!e.lavaProof;
    }
    return out;
}
