import { GENERATOR_URL } from './config.js';

// Which generator builds each level. Shared by the main menu (continue)
// and the level-complete screen (next level) so both give the same level.
export function getAlgorithmForLevel(level) {
    if (level <= 2) return 1;  // random
    if (level <= 4) return 4;  // cellular automata
    if (level <= 6) return 6;  // graph (rooms + corridors)
    if (level <= 8) return 2;  // perlin
    return 7;                  // transformer
}

// Fetch a level grid; parameters grow slowly with the level number.
export async function fetchLevelData(algorithmId, levelId) {
    const params = new URLSearchParams({
        x: 20 + 2 * Math.floor(levelId / 2),
        y: 15 + Math.floor(levelId / 2),
        wall_probability: (0.4 + levelId * 0.005).toFixed(2) * 100,
        iterations: 1 + Math.floor(levelId / 5),
        min_leaf_size: Math.max(5, 8 - Math.floor(levelId / 10)),
        max_leaf_size: Math.min(20, 15 + Math.floor(levelId / 10)),
        max_rooms: 7,
    });

    const response = await fetch(`${GENERATOR_URL}/generate/${algorithmId}?${params}`);
    if (!response.ok) {
        throw new Error('Failed to fetch level data');
    }
    return await response.json();
}
