// Level score. Keep the weights in sync with app/Support/Scoring.php in
// pcg-db, which rejects scores above the maximum a level allows.
export const SCORING = {
    clear: 100,
    perCoin: 25,
    perKill: 30,
    perSecond: 10,
    perCombo: 25,     // × best combo, when it's 2 or more
    perfect: 100,     // every coin collected
    levelStep: 0.1,   // each level is worth 10% more than the last
};

// Coins paid out at the end of an attempt, per coin picked up.
export const PAYOUT = { win: 10, loss: 5 };

export function scoreLevel({ level, coins, totalCoins, kills, secondsLeft, bestCombo }) {
    const S = SCORING;
    const parts = [
        ['Level clear', S.clear],
        [`Coins ${coins} × ${S.perCoin}`, coins * S.perCoin],
        [`Enemies ${kills} × ${S.perKill}`, kills * S.perKill],
        [`Time left ${secondsLeft}s × ${S.perSecond}`, secondsLeft * S.perSecond],
        [`Best combo ×${bestCombo}`, bestCombo > 1 ? bestCombo * S.perCombo : 0],
        ['Every coin', totalCoins > 0 && coins === totalCoins ? S.perfect : 0],
    ].filter(([, points]) => points > 0);
    const base = parts.reduce((sum, [, points]) => sum + points, 0);
    const multiplier = 1 + S.levelStep * (level - 1);
    return { parts, base, multiplier, total: Math.round(base * multiplier) };
}
