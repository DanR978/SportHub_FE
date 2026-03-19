import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

// Re-export API_URL for backwards compatibility
export { API_URL };

// ── Token storage ────────────────────────────────────────────────────────────
export const saveToken      = async (token)  => await SecureStore.setItemAsync('jwt_token', token);
export const getToken       = async ()       => await SecureStore.getItemAsync('jwt_token');
export const removeToken    = async ()       => await SecureStore.deleteItemAsync('jwt_token');
export const saveAuthMethod = async (method) => await SecureStore.setItemAsync('auth_method', method);
export const getAuthMethod  = async ()       => await SecureStore.getItemAsync('auth_method');

// ── Multi-account cache ────────────────────────────────────────────────────────
// Stores an array of { email, first_name, last_name, avatar_photo, avatar_config, token }
// Each account keeps its own token so one-tap login works for any of them.

const CACHE_KEY = 'accounts_cache';

const loadAccounts = async () => {
    try {
        const raw = await SecureStore.getItemAsync(CACHE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
};

const saveAccounts = async (accounts) => {
    try {
        const slim = accounts.map(a => ({
            email:        a.email,
            first_name:   a.first_name,
            last_name:    a.last_name,
            avatar_config:a.avatar_config || null,
            avatar_photo: a.avatar_photo && a.avatar_photo.length < 8000 ? a.avatar_photo : null,
            token:        a.token || null,
        }));
        await SecureStore.setItemAsync(CACHE_KEY, JSON.stringify(slim));
    } catch (e) {
        console.log('saveAccounts error:', e);
    }
};

// Upsert a user into the cache (call after login/profile fetch)
export const saveUserCache = async (user, token = null) => {
    try {
        const accounts = await loadAccounts();
        const idx = accounts.findIndex(a => a.email === user.email);
        const currentToken = token || (await getToken());
        const entry = {
            email:        user.email,
            first_name:   user.first_name,
            last_name:    user.last_name,
            avatar_config:user.avatar_config || null,
            avatar_photo: user.avatar_photo  || null,
            token:        currentToken || (idx >= 0 ? accounts[idx]?.token : null),
        };
        if (idx >= 0) accounts[idx] = entry;
        else accounts.unshift(entry);
        await saveAccounts(accounts);
    } catch (e) { console.log('saveUserCache error:', e); }
};

// Update token for a specific email (call after login)
export const saveTokenForEmail = async (email, token) => {
    const accounts = await loadAccounts();
    const idx = accounts.findIndex(a => a.email === email);
    if (idx >= 0) {
        accounts[idx].token = token;
        await saveAccounts(accounts);
    }
};

// Get token for a specific cached email
export const getTokenForEmail = async (email) => {
    const accounts = await loadAccounts();
    const account = accounts.find(a => a.email === email);
    return account?.token || null;
};

// Remove token for a specific email (e.g., on logout of that account)
export const removeTokenForEmail = async (email) => {
    const accounts = await loadAccounts();
    const idx = accounts.findIndex(a => a.email === email);
    if (idx >= 0) {
        accounts[idx].token = null;
        await saveAccounts(accounts);
    }
};

// Verify a cached token is still valid — returns user object or null
export const verifyCachedToken = async (token) => {
    try {
        const res = await fetch(`${API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) return await res.json();
        return null;
    } catch { return null; }
};

// Get all cached accounts (returns array)
export const getUserCache = async () => {
    return await loadAccounts();
};
export const getCachedAccounts = getUserCache;

// Remove a specific account from cache
export const removeCachedAccount = async (email) => {
    const accounts = await loadAccounts();
    await saveAccounts(accounts.filter(a => a.email !== email));
};
export const removeFromCache = removeCachedAccount;

// Clear all cached accounts
export const clearUserCache = async () => {
    try { await SecureStore.deleteItemAsync(CACHE_KEY); } catch {}
};

// ── Auth methods ───────────────────────────────────────────────────────────────

export const loginWithEmail = async (email, password) => {
    const res = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Invalid email or password'); }
    const data = await res.json();
    await saveToken(data.access_token);
    await saveTokenForEmail(email, data.access_token);
    await saveAuthMethod('email');
    return data;
};

export const signupWithEmail = async (firstName, lastName, email, password) => {
    const res = await fetch(`${API_URL}/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password }),
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Signup failed'); }
    return await loginWithEmail(email, password);
};

export const loginWithGoogle = async (accessToken) => {
    const res = await fetch(`${API_URL}/users/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
    });
    if (!res.ok) throw new Error('Google login failed');
    const data = await res.json();
    await saveToken(data.access_token);
    await saveAuthMethod('google');
    // Save per-email token: fetch user profile to get the email
    try {
        const meRes = await fetch(`${API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${data.access_token}` },
        });
        if (meRes.ok) {
            const user = await meRes.json();
            await saveUserCache(user, data.access_token);
            await saveTokenForEmail(user.email, data.access_token);
        }
    } catch {}
    return data;
};

export const loginWithApple = async (identityToken, email, firstName, lastName) => {
    const res = await fetch(`${API_URL}/users/apple-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity_token: identityToken, email, first_name: firstName, last_name: lastName }),
    });
    if (!res.ok) throw new Error('Apple login failed');
    const data = await res.json();
    await saveToken(data.access_token);
    await saveAuthMethod('apple');
    // Save per-email token: fetch user profile to get the email
    try {
        const meRes = await fetch(`${API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${data.access_token}` },
        });
        if (meRes.ok) {
            const user = await meRes.json();
            await saveUserCache(user, data.access_token);
            await saveTokenForEmail(user.email, data.access_token);
        }
    } catch {}
    return data;
};