import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    Animated, Dimensions, Platform,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { loginWithEmail, loginWithGoogle, loginWithApple } from '../services/auth';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');
const GOOGLE_IOS_CLIENT_ID = '187761642850-na0mblct6dtn9dqnaej7qn3v1ns5ongc.apps.googleusercontent.com';

function SoccerField() {
    const fh = height, fw = width, pad = 20;
    const lc = 'rgba(255,255,255,0.75)';
    const penW = 160, penH = 90, goalW = 84, goalH = 40, arcW = 68, arcH = 34;
    const diagSize = 56;
    const numX = Math.ceil(fw / diagSize) + 2;
    const numY = Math.ceil(fh / diagSize) + 2;
    return (
        <View style={{ position: 'absolute', top: 0, left: 0, width: fw, height: fh, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#27a03a' }} />
            {[...Array(numY)].map((_, row) =>
                [...Array(numX)].map((_, col) =>
                    (row + col) % 2 === 0 ? (
                        <View key={`${row}-${col}`} style={{ position: 'absolute', width: diagSize * 1.42, height: diagSize * 1.42, backgroundColor: '#2eb843', opacity: 0.65, transform: [{ rotate: '45deg' }], left: col * diagSize - diagSize * 0.21, top: row * diagSize - diagSize * 0.21 }} />
                    ) : null
                )
            )}
            <View style={{ position: 'absolute', top: pad + 30, left: pad, right: pad, bottom: pad, borderWidth: 2, borderColor: lc }} />
            <View style={{ position: 'absolute', top: fh * 0.5, left: pad, right: pad, height: 2, backgroundColor: lc }} />
            <View style={{ position: 'absolute', top: fh * 0.5 - 52, left: fw / 2 - 52, width: 104, height: 104, borderRadius: 52, borderWidth: 2, borderColor: lc }} />
            <View style={{ position: 'absolute', top: fh * 0.5 - 5, left: fw / 2 - 5, width: 10, height: 10, borderRadius: 5, backgroundColor: lc }} />
            <View style={{ position: 'absolute', top: pad + 30, left: fw / 2 - penW / 2, width: penW, height: penH, borderWidth: 2, borderColor: lc, borderTopWidth: 0 }} />
            <View style={{ position: 'absolute', top: pad + 30, left: fw / 2 - goalW / 2, width: goalW, height: goalH, borderWidth: 2, borderColor: lc, borderTopWidth: 0 }} />
            <View style={{ position: 'absolute', top: pad + 30 + penH, left: fw / 2 - arcW / 2, width: arcW, height: arcH, borderBottomLeftRadius: arcH, borderBottomRightRadius: arcH, borderWidth: 2, borderColor: lc, borderTopWidth: 0 }} />
            <View style={{ position: 'absolute', bottom: pad, left: fw / 2 - penW / 2, width: penW, height: penH, borderWidth: 2, borderColor: lc, borderBottomWidth: 0 }} />
            <View style={{ position: 'absolute', bottom: pad, left: fw / 2 - goalW / 2, width: goalW, height: goalH, borderWidth: 2, borderColor: lc, borderBottomWidth: 0 }} />
            <View style={{ position: 'absolute', bottom: pad + penH, left: fw / 2 - arcW / 2, width: arcW, height: arcH, borderTopLeftRadius: arcH, borderTopRightRadius: arcH, borderWidth: 2, borderColor: lc, borderBottomWidth: 0 }} />
        </View>
    );
}

export default function AuthScreen({ onLogin, onSignup }) {
    const [mode, setMode] = useState('landing'); // landing | login | signup
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedInput, setFocusedInput] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const cardAnim = useRef(new Animated.Value(60)).current;
    const cardFade = useRef(new Animated.Value(0)).current;
    const contentFade = useRef(new Animated.Value(1)).current;

    const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId: GOOGLE_IOS_CLIENT_ID,
        redirectUri: 'com.googleusercontent.apps.187761642850-na0mblct6dtn9dqnaej7qn3v1ns5ongc:/oauth2redirect',
    });

    useEffect(() => {
        Animated.parallel([
            Animated.timing(cardFade, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(cardAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
        ]).start();
    }, []);

    useEffect(() => {
        if (response?.type === 'success') {
            handleGoogleSuccess(response.authentication.accessToken);
        }
    }, [response]);

    const switchMode = (newMode) => {
        Animated.timing(contentFade, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
            setMode(newMode);
            setError('');
            Animated.timing(contentFade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        });
    };

    const handleLogin = async () => {
        if (!email || !password) { setError('Please fill in all fields'); return; }
        try {
            setLoading(true); setError('');
            await loginWithEmail(email, password);
            onLogin();
        } catch (e) {
            setError(e.message || 'Invalid email or password');
        } finally { setLoading(false); }
    };

    const handleGoogleSuccess = async (accessToken) => {
        try {
            setLoading(true);
            const result = await loginWithGoogle(accessToken);
            // result.is_new tells us if we need setup
            if (result.is_new) onSignup('google', result.user);
            else onLogin();
        } catch (e) {
            setError('Google sign in failed');
        } finally { setLoading(false); }
    };

    const handleApple = async () => {
        try {
            setLoading(true);
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });
            const result = await loginWithApple(
                credential.identityToken,
                credential.email,
                credential.fullName?.givenName || '',
                credential.fullName?.familyName || '',
            );
            if (result.is_new) onSignup('apple', result.user);
            else onLogin();
        } catch (e) {
            if (e.code !== 'ERR_REQUEST_CANCELED') setError('Apple sign in failed');
        } finally { setLoading(false); }
    };

    return (
        <View style={{ flex: 1 }}>
            <SoccerField />
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                <Animated.View style={[styles.card, { opacity: cardFade, transform: [{ translateY: cardAnim }] }]}>

                    {/* LOGO */}
                    <View style={styles.logoRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
                            {[12, 20, 14].map((h, i) => (
                                <View key={i} style={{ width: 4, height: h, backgroundColor: '#16a34a', borderRadius: 2, opacity: i === 0 ? 0.5 : i === 2 ? 0.75 : 1 }} />
                            ))}
                        </View>
                        <View>
                            <Text style={styles.logoText}>SPORTHUB</Text>
                            <Text style={styles.logoSub}>FIND YOUR GAME</Text>
                        </View>
                    </View>

                    <Animated.View style={{ opacity: contentFade }}>

                        {/* ── LANDING MODE ── */}
                        {mode === 'landing' && (
                            <View>
                                <Text style={styles.headline}>Play more.{'\n'}Connect more.</Text>
                                <Text style={styles.subheadline}>Join thousands of players finding pickup games near them.</Text>

                                <TouchableOpacity style={styles.primaryBtn} onPress={() => switchMode('signup')}>
                                    <LinearGradient colors={['#16a34a','#15803d']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.primaryBtnInner}>
                                        <Text style={styles.primaryBtnText}>CREATE ACCOUNT</Text>
                                        <Ionicons name="arrow-forward" size={17} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>

                                <View style={styles.divider}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>OR</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                <TouchableOpacity style={styles.googleBtn} onPress={() => promptAsync()} disabled={!request || loading}>
                                    <Text style={styles.googleG}>G</Text>
                                    <Text style={styles.googleText}>Continue with Google</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.appleBtn} onPress={handleApple} disabled={loading}>
                                    <Ionicons name="logo-apple" size={18} color="#fff" />
                                    <Text style={styles.appleText}>Continue with Apple</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.loginLink} onPress={() => switchMode('login')}>
                                    <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Log in</Text></Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ── LOGIN MODE ── */}
                        {mode === 'login' && (
                            <View>
                                <Text style={styles.modeTitle}>Welcome back</Text>

                                {error ? <View style={styles.errorBox}><Text style={styles.errorBoxText}>{error}</Text></View> : null}

                                <View style={[styles.inputWrapper, focusedInput === 'email' && styles.inputFocused]}>
                                    <Ionicons name="mail-outline" size={17} color={focusedInput === 'email' ? '#16a34a' : '#bbb'} style={styles.inputIcon} />
                                    <TextInput style={styles.input} placeholder="Email address" placeholderTextColor="#bbb"
                                        value={email} onChangeText={setEmail} keyboardType="email-address"
                                        autoCapitalize="none" autoCorrect={false}
                                        onFocus={() => setFocusedInput('email')} onBlur={() => setFocusedInput(null)} />
                                </View>

                                <View style={[styles.inputWrapper, focusedInput === 'password' && styles.inputFocused]}>
                                    <Ionicons name="lock-closed-outline" size={17} color={focusedInput === 'password' ? '#16a34a' : '#bbb'} style={styles.inputIcon} />
                                    <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#bbb"
                                        value={password} onChangeText={setPassword} secureTextEntry={!showPassword}
                                        autoCapitalize="none" autoCorrect={false}
                                        onFocus={() => setFocusedInput('password')} onBlur={() => setFocusedInput(null)} />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingRight: 14 }}>
                                        <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={17} color="#bbb" />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
                                    <Text style={{ color: '#16a34a', fontSize: 13, fontWeight: '600' }}>Forgot password?</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
                                    <LinearGradient colors={['#16a34a','#15803d']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.primaryBtnInner}>
                                        <Text style={styles.primaryBtnText}>{loading ? 'LOGGING IN...' : 'LOG IN'}</Text>
                                        <Ionicons name="arrow-forward" size={17} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>

                                <View style={styles.divider}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>OR</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                <TouchableOpacity style={styles.googleBtn} onPress={() => promptAsync()} disabled={!request || loading}>
                                    <Text style={styles.googleG}>G</Text>
                                    <Text style={styles.googleText}>Continue with Google</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.appleBtn, { marginBottom: 0 }]} onPress={handleApple} disabled={loading}>
                                    <Ionicons name="logo-apple" size={18} color="#fff" />
                                    <Text style={styles.appleText}>Continue with Apple</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.loginLink} onPress={() => switchMode('landing')}>
                                    <Text style={styles.loginLinkText}>Don't have an account? <Text style={styles.loginLinkBold}>Sign up</Text></Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ── SIGNUP MODE ── */}
                        {mode === 'signup' && (
                            <View>
                                <Text style={styles.modeTitle}>Create account</Text>
                                <Text style={{ color: '#aaa', fontSize: 13, marginBottom: 16 }}>Or sign up faster with Google or Apple</Text>

                                <TouchableOpacity style={[styles.googleBtn, { marginBottom: 10 }]} onPress={() => promptAsync()} disabled={!request || loading}>
                                    <Text style={styles.googleG}>G</Text>
                                    <Text style={styles.googleText}>Sign up with Google</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.appleBtn, { marginBottom: 16 }]} onPress={handleApple} disabled={loading}>
                                    <Ionicons name="logo-apple" size={18} color="#fff" />
                                    <Text style={styles.appleText}>Sign up with Apple</Text>
                                </TouchableOpacity>

                                <View style={styles.divider}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>OR</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                <TouchableOpacity style={styles.primaryBtn} onPress={() => onSignup('email', null)}>
                                    <LinearGradient colors={['#1a1a2e','#0f3460']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.primaryBtnInner}>
                                        <Text style={styles.primaryBtnText}>SIGN UP WITH EMAIL</Text>
                                        <Ionicons name="mail-outline" size={17} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.loginLink} onPress={() => switchMode('login')}>
                                    <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Log in</Text></Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Animated.View>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 26, paddingTop: 24, paddingBottom: 52 },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    logoText: { fontSize: 22, fontWeight: '900', color: '#1a1a2e', letterSpacing: 3 },
    logoSub: { fontSize: 9, fontWeight: '700', color: '#16a34a', letterSpacing: 3, marginTop: 2 },
    headline: { fontSize: 28, fontWeight: '900', color: '#1a1a2e', lineHeight: 34, marginBottom: 8 },
    subheadline: { fontSize: 14, color: '#999', marginBottom: 24, lineHeight: 20 },
    modeTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a2e', marginBottom: 18 },
    errorBox: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#fecaca' },
    errorBoxText: { color: '#e94560', fontSize: 13, fontWeight: '600' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fb', borderRadius: 12, borderWidth: 1.5, borderColor: '#f0f0f0', marginBottom: 10 },
    inputFocused: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
    inputIcon: { paddingLeft: 14, paddingRight: 4 },
    input: { flex: 1, paddingVertical: 13, paddingHorizontal: 10, fontSize: 15, color: '#1a1a2e' },
    primaryBtn: { borderRadius: 12, overflow: 'hidden', marginBottom: 14 },
    primaryBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 10 },
    primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
    divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#f0f0f0' },
    dividerText: { color: '#ccc', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginHorizontal: 14 },
    googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, borderWidth: 1.5, borderColor: '#e8e8e8', gap: 10, marginBottom: 10 },
    googleG: { fontSize: 16, fontWeight: '800', color: '#4285F4' },
    googleText: { fontSize: 15, fontWeight: '600', color: '#1f1f1f' },
    appleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', borderRadius: 12, paddingVertical: 12, gap: 10 },
    appleText: { fontSize: 15, fontWeight: '600', color: '#fff' },
    loginLink: { alignItems: 'center', marginTop: 16 },
    loginLinkText: { color: '#aaa', fontSize: 14 },
    loginLinkBold: { color: '#16a34a', fontWeight: '700' },
});