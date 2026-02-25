import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.4.131:8000';

export const saveToken = async (token) => await SecureStore.setItemAsync('jwt_token', token);
export const getToken = async () => await SecureStore.getItemAsync('jwt_token');
export const removeToken = async () => await SecureStore.deleteItemAsync('jwt_token');
export const saveAuthMethod = async (method) => await SecureStore.setItemAsync('auth_method', method);
export const getAuthMethod = async () => await SecureStore.getItemAsync('auth_method');

export const loginWithEmail = async (email, password) => {
    const res = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Invalid email or password'); }
    const data = await res.json();
    await saveToken(data.access_token);
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
    return data; // includes is_new and user
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
    return data; // includes is_new and user
};