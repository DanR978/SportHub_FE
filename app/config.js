import Constants from 'expo-constants';

const getApiUrl = () => {
    if (__DEV__) {
        const debuggerHost =
            Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
        const host = debuggerHost?.split(':')[0];
        if (host) return `http://${host}:8000`;
        return 'http://localhost:8000';
    }
    return 'https://api.sportmap.app';
};

export const API_URL = getApiUrl();

// ── Google ───────────────────────────────────────────────────────────────────
// Same key used in app.json for Maps SDK — also needs Places API enabled
export const GOOGLE_IOS_CLIENT_ID =
    '187761642850-na0mblct6dtn9dqnaej7qn3v1ns5ongc.apps.googleusercontent.com';

export const GOOGLE_MAPS_API_KEY = 'AIzaSyDeL2CyP9BDjBW6WeNZvqCS_jx1xdxrD6U';