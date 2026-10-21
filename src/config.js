// Where the game's two backends live. Defaults suit local development;
// override them per environment with VITE_API_URL and VITE_GENERATOR_URL
// (for example in a .env.local file or the hosting provider's settings).
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8091/api';
export const GENERATOR_URL = import.meta.env.VITE_GENERATOR_URL ?? 'http://127.0.0.1:5055';
