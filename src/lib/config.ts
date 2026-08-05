// In production, use the current domain dynamically if env vars aren't set
export const API_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : "http://localhost:1234");

export const WS_URL = import.meta.env.VITE_WS_URL || (typeof window !== 'undefined' ? (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host : "ws://localhost:1234");
