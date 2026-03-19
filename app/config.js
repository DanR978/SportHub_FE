import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

const getApiUrl = () => {
    if (extra.apiUrl && !extra.apiUrl.includes("localhost")) {
        return extra.apiUrl;
    }
    const debuggerHost =
        Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    const host = debuggerHost?.split(':')[0];
    if (host) return `http://${host}:8000`;
    return 'http://localhost:8000';
};

export const API_URL = getApiUrl();
export const GOOGLE_MAPS_API_KEY = extra.googleMapsApiKey || '';
export const GOOGLE_IOS_CLIENT_ID = extra.googleIosClientId || '';
export const APPLE_CLIENT_ID = extra.appleClientId || '';