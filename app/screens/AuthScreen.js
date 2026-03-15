import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    Animated, Dimensions, Image, StatusBar, Alert,
    Modal, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { loginWithEmail, loginWithGoogle, loginWithApple, clearUserCache, removeFromCache } from '../services/auth';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');
import { API_URL, GOOGLE_IOS_CLIENT_ID } from '../config';

// ── Soccer field ──────────────────────────────────────────────────────────────
function SoccerField() {
    const fh = height, fw = width, pad = 20;
    const lc = 'rgba(255,255,255,0.75)';
    const penW = 160, penH = 90, goalW = 84, goalH = 40, arcW = 68, arcH = 34;
    const diagSize = 56;
    const numX = Math.ceil(fw / diagSize) + 2;
    const numY = Math.ceil(fh / diagSize) + 2;
    return (
        <View style={{ position: 'absolute', top: 0, left: 0, width: fw, height: fh, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', inset: 0, backgroundColor: '#27a03a' }} />
            {[...Array(numY)].map((_, row) =>
                [...Array(numX)].map((_, col) =>
                    (row + col) % 2 === 0 ? (
                        <View key={`${row}-${col}`} style={{ position:'absolute', width:diagSize*1.42, height:diagSize*1.42, backgroundColor:'#2eb843', opacity:0.65, transform:[{rotate:'45deg'}], left:col*diagSize-diagSize*0.21, top:row*diagSize-diagSize*0.21 }} />
                    ) : null
                )
            )}
            <View style={{ position:'absolute', top:pad+30, left:pad, right:pad, bottom:pad, borderWidth:2, borderColor:lc }} />
            <View style={{ position:'absolute', top:fh*0.5, left:pad, right:pad, height:2, backgroundColor:lc }} />
            <View style={{ position:'absolute', top:fh*0.5-52, left:fw/2-52, width:104, height:104, borderRadius:52, borderWidth:2, borderColor:lc }} />
            <View style={{ position:'absolute', top:fh*0.5-5, left:fw/2-5, width:10, height:10, borderRadius:5, backgroundColor:lc }} />
            <View style={{ position:'absolute', top:pad+30, left:fw/2-penW/2, width:penW, height:penH, borderWidth:2, borderColor:lc, borderTopWidth:0 }} />
            <View style={{ position:'absolute', top:pad+30, left:fw/2-goalW/2, width:goalW, height:goalH, borderWidth:2, borderColor:lc, borderTopWidth:0 }} />
            <View style={{ position:'absolute', top:pad+30+penH, left:fw/2-arcW/2, width:arcW, height:arcH, borderBottomLeftRadius:arcH, borderBottomRightRadius:arcH, borderWidth:2, borderColor:lc, borderTopWidth:0 }} />
            <View style={{ position:'absolute', bottom:pad, left:fw/2-penW/2, width:penW, height:penH, borderWidth:2, borderColor:lc, borderBottomWidth:0 }} />
            <View style={{ position:'absolute', bottom:pad, left:fw/2-goalW/2, width:goalW, height:goalH, borderWidth:2, borderColor:lc, borderBottomWidth:0 }} />
            <View style={{ position:'absolute', bottom:pad+penH, left:fw/2-arcW/2, width:arcW, height:arcH, borderTopLeftRadius:arcH, borderTopRightRadius:arcH, borderWidth:2, borderColor:lc, borderBottomWidth:0 }} />
        </View>
    );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function UserAvatar({ user, size = 56 }) {
    const initials = `${user.first_name?.[0]||''}${user.last_name?.[0]||''}`.toUpperCase();
    if (user.avatar_photo) return <Image source={{ uri: user.avatar_photo }} style={{ width:size, height:size, borderRadius:size/2 }} />;
    return (
        <LinearGradient colors={['#e94560','#0f3460']} style={{ width:size, height:size, borderRadius:size/2, justifyContent:'center', alignItems:'center' }}>
            <Text style={{ color:'#fff', fontWeight:'800', fontSize:size*0.32 }}>{initials}</Text>
        </LinearGradient>
    );
}

// ── Logo mark ────────────────────────────────────────────────────────────────
function LogoMark({ dark = false }) {
    const color = dark ? '#1a1a2e' : '#fff';
    const accent = dark ? '#16a34a' : '#fff';
    return (
        <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
            <View style={{ flexDirection:'row', alignItems:'flex-end', gap:3 }}>
                {[10,18,12].map((h,i) => <View key={i} style={{ width:5, height:h, backgroundColor:accent, borderRadius:3, opacity:i===0?0.5:i===2?0.75:1 }} />)}
            </View>
            <Text style={{ fontSize:22, fontWeight:'900', color, letterSpacing:3 }}>SPORTHUB</Text>
        </View>
    );
}

// ── 3-dot menu ────────────────────────────────────────────────────────────────
function AccountMenu({ visible, onClose, onRemove, onSwitchAccount }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={menu.overlay} activeOpacity={1} onPress={onClose}>
                <View style={menu.sheet}>
                    <View style={menu.handle} />
                    <TouchableOpacity style={menu.item} onPress={() => { onClose(); onSwitchAccount(); }}>
                        <View style={menu.itemIcon}><Ionicons name="person-add-outline" size={20} color="#1a1a2e" /></View>
                        <View>
                            <Text style={menu.itemLabel}>Use a different account</Text>
                            <Text style={menu.itemSub}>Log in with another email</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={menu.divider} />
                    <TouchableOpacity style={menu.item} onPress={() => { onClose(); onRemove(); }}>
                        <View style={[menu.itemIcon, { backgroundColor:'#fdecea' }]}><Ionicons name="trash-outline" size={20} color="#e94560" /></View>
                        <View>
                            <Text style={[menu.itemLabel, { color:'#e94560' }]}>Remove account</Text>
                            <Text style={menu.itemSub}>Remove from this device</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

// ── Forgot password flow (3 steps inside a modal) ────────────────────────────
function ForgotPasswordModal({ visible, onClose, prefillEmail = '' }) {
    const [step, setStep]           = useState(1); // 1=enter email, 2=choose method, 3=enter code, 4=new password, 5=success
    const [email, setEmail]         = useState(prefillEmail);
    const [method, setMethod]       = useState('email');
    const [hasPhone, setHasPhone]   = useState(false);
    const [code, setCode]           = useState('');
    const [password, setPassword]   = useState('');
    const [password2, setPassword2] = useState('');
    const [showPw, setShowPw]       = useState(false);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState('');
    const [timer, setTimer]         = useState(0);
    const fade = useRef(new Animated.Value(1)).current;

    useEffect(() => { if (visible) { setStep(1); setEmail(prefillEmail); setError(''); setCode(''); setPassword(''); setPassword2(''); } }, [visible]);
    useEffect(() => {
        if (timer <= 0) return;
        const t = setTimeout(() => setTimer(t => t - 1), 1000);
        return () => clearTimeout(t);
    }, [timer]);

    const goStep = (n) => {
        Animated.sequence([
            Animated.timing(fade, { toValue:0, duration:120, useNativeDriver:true }),
            Animated.timing(fade, { toValue:1, duration:160, useNativeDriver:true }),
        ]).start();
        setTimeout(() => { setStep(n); setError(''); }, 120);
    };

    // Step 1 → check if account has phone, go to step 2 (method choice) or skip to code send
    const handleCheckEmail = async () => {
        if (!email.trim()) { setError('Enter your email address'); return; }
        setLoading(true); setError('');
        try {
            const res = await fetch(`${API_URL}/users/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase(), method: 'check' }),
            });
            const data = await res.json();
            // Backend always returns 200; check if phone available
            setHasPhone(!!data.has_phone);
            if (data.has_phone) {
                goStep(2); // let user pick email vs sms
            } else {
                await sendCode('email');
            }
        } catch { setError('Something went wrong. Try again.'); }
        finally { setLoading(false); }
    };

    const sendCode = async (m = method) => {
        setLoading(true); setError('');
        setMethod(m);
        try {
            await fetch(`${API_URL}/users/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase(), method: m }),
            });
            setTimer(60);
            goStep(3);
        } catch { setError('Could not send code. Try again.'); }
        finally { setLoading(false); }
    };

    const handleVerifyCode = async () => {
        if (code.length !== 6) { setError('Enter the 6-digit code'); return; }
        setLoading(true); setError('');
        try {
            const res = await fetch(`${API_URL}/users/verify-reset-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: code }),
            });
            if (!res.ok) { const d = await res.json(); setError(d.detail || 'Invalid code'); return; }
            goStep(4);
        } catch { setError('Something went wrong.'); }
        finally { setLoading(false); }
    };

    const handleResetPassword = async () => {
        if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
        if (password !== password2) { setError('Passwords do not match'); return; }
        setLoading(true); setError('');
        try {
            const res = await fetch(`${API_URL}/users/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: code, new_password: password }),
            });
            if (!res.ok) { const d = await res.json(); setError(d.detail || 'Reset failed'); return; }
            goStep(5);
        } catch { setError('Something went wrong.'); }
        finally { setLoading(false); }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
            <View style={fp.overlay}>
                <View style={fp.sheet}>
                    {/* Header */}
                    <View style={fp.header}>
                        {step < 5 && step > 1 && (
                            <TouchableOpacity style={fp.backBtn} onPress={() => goStep(step - 1)}>
                                <Ionicons name="arrow-back" size={18} color="#666" />
                            </TouchableOpacity>
                        )}
                        <View style={{ flex:1 }} />
                        <TouchableOpacity style={fp.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* Step dots */}
                    {step < 5 && (
                        <View style={fp.dots}>
                            {[1,2,3,4].map(n => <View key={n} style={[fp.dot, step >= n && fp.dotActive, step === n && fp.dotCurrent]} />)}
                        </View>
                    )}

                    <Animated.View style={{ opacity: fade, padding: 24, paddingTop: 8 }}>

                        {/* Step 1 — Enter email */}
                        {step === 1 && (
                            <>
                                <View style={fp.iconCircle}><Ionicons name="lock-open-outline" size={32} color="#16a34a" /></View>
                                <Text style={fp.title}>Forgot password?</Text>
                                <Text style={fp.sub}>Enter your email and we'll send you a reset code.</Text>
                                {error ? <View style={fp.error}><Text style={fp.errorText}>{error}</Text></View> : null}
                                <View style={fp.inputWrap}>
                                    <Ionicons name="mail-outline" size={17} color="#bbb" style={{ paddingLeft:14, paddingRight:4 }} />
                                    <TextInput style={fp.input} placeholder="Email address" placeholderTextColor="#bbb"
                                        value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                                </View>
                                <TouchableOpacity style={fp.primaryBtn} onPress={handleCheckEmail} disabled={loading}>
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={fp.primaryBtnText}>Continue</Text>}
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Step 2 — Choose method (only shown if account has phone) */}
                        {step === 2 && (
                            <>
                                <View style={fp.iconCircle}><Ionicons name="notifications-outline" size={32} color="#16a34a" /></View>
                                <Text style={fp.title}>How do you want your code?</Text>
                                <Text style={fp.sub}>We'll send a 6-digit reset code to your chosen contact.</Text>
                                {error ? <View style={fp.error}><Text style={fp.errorText}>{error}</Text></View> : null}
                                <TouchableOpacity style={[fp.methodRow, method==='email' && fp.methodRowActive]} onPress={() => setMethod('email')}>
                                    <View style={[fp.methodIcon, method==='email' && fp.methodIconActive]}>
                                        <Ionicons name="mail-outline" size={22} color={method==='email' ? '#fff' : '#666'} />
                                    </View>
                                    <View style={{ flex:1 }}>
                                        <Text style={[fp.methodLabel, method==='email' && { color:'#16a34a' }]}>Send to email</Text>
                                        <Text style={fp.methodSub}>{email}</Text>
                                    </View>
                                    <View style={[fp.radio, method==='email' && fp.radioActive]}>
                                        {method==='email' && <View style={fp.radioDot} />}
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={[fp.methodRow, method==='sms' && fp.methodRowActive]} onPress={() => setMethod('sms')}>
                                    <View style={[fp.methodIcon, method==='sms' && fp.methodIconActive]}>
                                        <Ionicons name="chatbubble-outline" size={22} color={method==='sms' ? '#fff' : '#666'} />
                                    </View>
                                    <View style={{ flex:1 }}>
                                        <Text style={[fp.methodLabel, method==='sms' && { color:'#16a34a' }]}>Send via text message</Text>
                                        <Text style={fp.methodSub}>To your registered phone number</Text>
                                    </View>
                                    <View style={[fp.radio, method==='sms' && fp.radioActive]}>
                                        {method==='sms' && <View style={fp.radioDot} />}
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={fp.primaryBtn} onPress={() => sendCode(method)} disabled={loading}>
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={fp.primaryBtnText}>Send Code</Text>}
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Step 3 — Enter code */}
                        {step === 3 && (
                            <>
                                <View style={fp.iconCircle}>
                                    <Ionicons name={method==='sms' ? 'chatbubble-outline' : 'mail-outline'} size={32} color="#16a34a" />
                                </View>
                                <Text style={fp.title}>Check your {method === 'sms' ? 'messages' : 'email'}</Text>
                                <Text style={fp.sub}>Enter the 6-digit code we sent{method === 'sms' ? ' to your phone' : ` to ${email}`}.</Text>
                                {error ? <View style={fp.error}><Text style={fp.errorText}>{error}</Text></View> : null}
                                <TextInput style={fp.codeInput} placeholder="000000" placeholderTextColor="#ccc"
                                    value={code} onChangeText={t => setCode(t.replace(/\D/g,'').slice(0,6))}
                                    keyboardType="number-pad" maxLength={6} />
                                <TouchableOpacity style={fp.primaryBtn} onPress={handleVerifyCode} disabled={loading || code.length < 6}>
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={fp.primaryBtnText}>Verify Code</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity style={fp.resendRow} onPress={() => sendCode(method)} disabled={timer > 0 || loading}>
                                    <Text style={[fp.resendText, timer > 0 && { color:'#ccc' }]}>
                                        {timer > 0 ? `Resend in ${timer}s` : "Didn't get it? Resend"}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Step 4 — New password */}
                        {step === 4 && (
                            <>
                                <View style={fp.iconCircle}><Ionicons name="key-outline" size={32} color="#16a34a" /></View>
                                <Text style={fp.title}>Set new password</Text>
                                <Text style={fp.sub}>Choose a strong password, at least 8 characters.</Text>
                                {error ? <View style={fp.error}><Text style={fp.errorText}>{error}</Text></View> : null}
                                <View style={fp.inputWrap}>
                                    <Ionicons name="lock-closed-outline" size={17} color="#bbb" style={{ paddingLeft:14, paddingRight:4 }} />
                                    <TextInput style={fp.input} placeholder="New password" placeholderTextColor="#bbb"
                                        value={password} onChangeText={setPassword} secureTextEntry={!showPw} autoCapitalize="none" />
                                    <TouchableOpacity onPress={() => setShowPw(!showPw)} style={{ paddingRight:14 }}>
                                        <Ionicons name={showPw ? 'eye-outline' : 'eye-off-outline'} size={17} color="#bbb" />
                                    </TouchableOpacity>
                                </View>
                                <View style={fp.inputWrap}>
                                    <Ionicons name="lock-closed-outline" size={17} color="#bbb" style={{ paddingLeft:14, paddingRight:4 }} />
                                    <TextInput style={fp.input} placeholder="Confirm password" placeholderTextColor="#bbb"
                                        value={password2} onChangeText={setPassword2} secureTextEntry={!showPw} autoCapitalize="none" />
                                </View>
                                <TouchableOpacity style={fp.primaryBtn} onPress={handleResetPassword} disabled={loading}>
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={fp.primaryBtnText}>Reset Password</Text>}
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Step 5 — Success */}
                        {step === 5 && (
                            <View style={{ alignItems:'center', paddingVertical:16 }}>
                                <View style={[fp.iconCircle, { backgroundColor:'#dcfce7', width:80, height:80, borderRadius:40 }]}>
                                    <Ionicons name="checkmark-circle" size={44} color="#16a34a" />
                                </View>
                                <Text style={[fp.title, { marginTop:16 }]}>Password updated!</Text>
                                <Text style={fp.sub}>You can now log in with your new password.</Text>
                                <TouchableOpacity style={fp.primaryBtn} onPress={onClose}>
                                    <Text style={fp.primaryBtnText}>Back to Login</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                    </Animated.View>
                </View>
            </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ── Main AuthScreen ───────────────────────────────────────────────────────────
export default function AuthScreen({ onLogin, onSignup, cachedAccounts = [], onSwitchToAccount, onQuickLogin }) {
    const [mode, setMode]             = useState(cachedAccounts.length > 0 ? 'picker' : 'landing');
    const [localAccounts, setLocalAccounts] = useState(cachedAccounts);
    const [menuTarget, setMenuTarget]     = useState(null);
    const [email, setEmail]           = useState('');
    const [password, setPassword]     = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused]       = useState(null);
    const [loading, setLoading]       = useState(false);
    const [error, setError]           = useState('');
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuAccount, setMenuAccount] = useState(null);
    const [forgotVisible, setForgotVisible] = useState(false);

    const cardAnim = useRef(new Animated.Value(60)).current;
    const cardFade = useRef(new Animated.Value(0)).current;
    const fade     = useRef(new Animated.Value(1)).current;

    const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId: GOOGLE_IOS_CLIENT_ID,
        redirectUri: 'com.googleusercontent.apps.187761642850-na0mblct6dtn9dqnaej7qn3v1ns5ongc:/oauth2redirect',
    });

    useEffect(() => {
        Animated.parallel([
            Animated.timing(cardFade, { toValue:1, duration:500, useNativeDriver:true }),
            Animated.spring(cardAnim, { toValue:0, friction:8, useNativeDriver:true }),
        ]).start();
    }, []);

    useEffect(() => {
        if (response?.type === 'success') handleGoogleSuccess(response.authentication.accessToken);
    }, [response]);

    const switchMode = (next) => {
        Animated.timing(fade, { toValue:0, duration:150, useNativeDriver:true }).start(() => {
            setMode(next); setError('');
            Animated.timing(fade, { toValue:1, duration:200, useNativeDriver:true }).start();
        });
    };

    // ── Quick login — switch token to that account then checkAuth ────────────
    const handleQuickLogin = (account) => {
        if (!account?.email) { switchMode('login'); return; }
        onSwitchToAccount(account.email);
    };

    // ── Email login ───────────────────────────────────────────────────────────
    const handleEmailLogin = async () => {
        if (!email || !password) { setError('Please fill in all fields'); return; }
        try {
            setLoading(true); setError('');
            await loginWithEmail(email, password);
            onLogin();
        } catch (e) { setError(e.message || 'Invalid email or password'); }
        finally { setLoading(false); }
    };

    // ── Google ────────────────────────────────────────────────────────────────
    const handleGoogleSuccess = async (accessToken) => {
        try {
            setLoading(true);
            const result = await loginWithGoogle(accessToken);
            if (result.is_new) onSignup('google', result.user);
            else onLogin();
        } catch { setError('Google sign in failed'); }
        finally { setLoading(false); }
    };

    // ── Apple ─────────────────────────────────────────────────────────────────
    const handleApple = async () => {
        try {
            setLoading(true);
            const cred = await AppleAuthentication.signInAsync({
                requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
            });
            const result = await loginWithApple(cred.identityToken, cred.email, cred.fullName?.givenName||'', cred.fullName?.familyName||'');
            if (result.is_new) onSignup('apple', result.user);
            else onLogin();
        } catch (e) { if (e.code !== 'ERR_REQUEST_CANCELED') setError('Apple sign in failed'); }
        finally { setLoading(false); }
    };

    // ── Remove cached account ─────────────────────────────────────────────────
    const handleRemoveCached = (account) => {
        Alert.alert('Remove account', `Remove ${account?.first_name}'s account from this device?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: async () => {
                await removeFromCache(account.email);
                const updated = localAccounts.filter(a => a.email !== account.email);
                setLocalAccounts(updated);
                if (updated.length === 0) switchMode('landing');
            }},
        ]);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // PICKER MODE
    // ─────────────────────────────────────────────────────────────────────────
    if (mode === 'picker') {
        return (
            <View style={{ flex:1, backgroundColor:'#fff' }}>
                <StatusBar barStyle="light-content" />
                <LinearGradient colors={['#16a34a','#15803d']} style={pk.header}>
                    <LogoMark />
                </LinearGradient>

                <View style={pk.sheet}>
                    <Text style={pk.sheetTitle}>Log in as</Text>

                    {/* Account list */}
                    {localAccounts.map((account, idx) => (
                        <View key={account.email}>
                            <View style={pk.accountRowWrap}>
                                <TouchableOpacity style={pk.accountRow} onPress={() => handleQuickLogin(account)} activeOpacity={0.7}>
                                    <UserAvatar user={account} size={56} />
                                    <View style={{ flex:1 }}>
                                        <Text style={pk.accountName}>
                                            {account.first_name || account.email.split('@')[0]} {account.last_name || ''}
                                        </Text>
                                        <Text style={pk.accountEmail}>{account.email}</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity style={pk.dotsBtn} onPress={() => { setMenuAccount(account); setMenuVisible(true); }}>
                                    <Ionicons name="ellipsis-vertical" size={20} color="#999" />
                                </TouchableOpacity>
                            </View>
                            {idx < localAccounts.length - 1 && <View style={pk.divider} />}
                        </View>
                    ))}

                    <View style={pk.divider} />

                    <TouchableOpacity style={pk.otherRow} onPress={() => switchMode('login')} activeOpacity={0.7}>
                        <View style={pk.otherIcon}>
                            <Ionicons name="person-add-outline" size={22} color="#1a1a2e" />
                        </View>
                        <Text style={pk.otherText}>Use another account</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                </View>

                <View style={pk.bottom}>
                    <TouchableOpacity style={pk.createBtn} onPress={() => switchMode('signup')} activeOpacity={0.8}>
                        <Text style={pk.createBtnText}>Create new account</Text>
                    </TouchableOpacity>
                    <View style={pk.metaRow}><LogoMark dark /></View>
                </View>

                <AccountMenu
                    visible={menuVisible}
                    onClose={() => { setMenuVisible(false); setMenuAccount(null); }}
                    onRemove={() => menuAccount && handleRemoveCached(menuAccount)}
                    onSwitchAccount={() => switchMode('login')}
                />
            </View>
        );
    }
    // ─────────────────────────────────────────────────────────────────────────
    // CARD MODES (landing / login / signup)
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <View style={{ flex:1 }}>
            <SoccerField />
            <View style={{ flex:1, justifyContent:'flex-end' }}>
                <Animated.View style={[s.card, { opacity:cardFade, transform:[{translateY:cardAnim}] }]}>

                    {/* Logo */}
                    <View style={s.logoRow}>
                        <View style={{ flexDirection:'row', alignItems:'flex-end', gap:3 }}>
                            {[12,20,14].map((h,i) => <View key={i} style={{ width:4, height:h, backgroundColor:'#16a34a', borderRadius:2, opacity:i===0?0.5:i===2?0.75:1 }} />)}
                        </View>
                        <View>
                            <Text style={s.logoText}>SPORTHUB</Text>
                            <Text style={s.logoSub}>FIND YOUR GAME</Text>
                        </View>
                    </View>

                    <Animated.View style={{ opacity:fade }}>

                        {/* ── LANDING ── */}
                        {mode === 'landing' && (
                            <View>
                                <Text style={s.headline}>Play more.{'\n'}Connect more.</Text>
                                <Text style={s.sub}>Join thousands of players finding pickup games near you.</Text>
                                <TouchableOpacity style={s.primaryBtn} onPress={() => switchMode('signup')}>
                                    <LinearGradient colors={['#16a34a','#15803d']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.primaryBtnInner}>
                                        <Text style={s.primaryBtnText}>CREATE ACCOUNT</Text>
                                        <Ionicons name="arrow-forward" size={17} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity style={s.secondaryBtn} onPress={() => switchMode('login')}>
                                    <Text style={s.secondaryBtnText}>LOG IN</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ── LOGIN ── */}
                        {mode === 'login' && (
                            <View>
                                <View style={s.topRow}>
                                    <TouchableOpacity style={s.backRow} onPress={() => switchMode(localCached ? 'picker' : 'landing')}>
                                        <Ionicons name="arrow-back" size={18} color="#999" />
                                        <Text style={s.backText}>{localCached ? 'Back' : 'Cancel'}</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={s.modeTitle}>Welcome back</Text>
                                {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}
                                <View style={[s.inputWrap, focused==='email' && s.inputFocused]}>
                                    <Ionicons name="mail-outline" size={17} color={focused==='email'?'#16a34a':'#bbb'} style={s.inputIcon} />
                                    <TextInput style={s.input} placeholder="Email address" placeholderTextColor="#bbb"
                                        value={email} onChangeText={setEmail} keyboardType="email-address"
                                        autoCapitalize="none" autoCorrect={false}
                                        onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />
                                </View>
                                <View style={[s.inputWrap, focused==='pass' && s.inputFocused]}>
                                    <Ionicons name="lock-closed-outline" size={17} color={focused==='pass'?'#16a34a':'#bbb'} style={s.inputIcon} />
                                    <TextInput style={s.input} placeholder="Password" placeholderTextColor="#bbb"
                                        value={password} onChangeText={setPassword} secureTextEntry={!showPassword}
                                        autoCapitalize="none" autoCorrect={false}
                                        onFocus={() => setFocused('pass')} onBlur={() => setFocused(null)} />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingRight:14 }}>
                                        <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={17} color="#bbb" />
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity style={{ alignSelf:'flex-end', marginBottom:16 }} onPress={() => setForgotVisible(true)}>
                                    <Text style={{ color:'#16a34a', fontSize:13, fontWeight:'600' }}>Forgot password?</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={s.primaryBtn} onPress={handleEmailLogin} disabled={loading}>
                                    <LinearGradient colors={['#16a34a','#15803d']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.primaryBtnInner}>
                                        {loading ? <ActivityIndicator color="#fff" /> : <>
                                            <Text style={s.primaryBtnText}>LOG IN</Text>
                                            <Ionicons name="arrow-forward" size={17} color="#fff" />
                                        </>}
                                    </LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity style={s.linkRow} onPress={() => switchMode('signup')}>
                                    <Text style={s.linkText}>Don't have an account? <Text style={s.linkBold}>Sign up</Text></Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ── SIGNUP ── */}
                        {mode === 'signup' && (
                            <View>
                                <View style={s.topRow}>
                                    <TouchableOpacity style={s.backRow} onPress={() => switchMode(localCached ? 'picker' : 'landing')}>
                                        <Ionicons name="close" size={20} color="#999" />
                                        <Text style={s.backText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={s.modeTitle}>Create account</Text>
                                <Text style={{ color:'#aaa', fontSize:13, marginBottom:16 }}>Sign up faster with Google or Apple</Text>
                                <TouchableOpacity style={[s.googleBtn,{marginBottom:10}]} onPress={() => promptAsync()} disabled={!request||loading}>
                                    <Text style={s.googleG}>G</Text>
                                    <Text style={s.googleText}>Sign up with Google</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.appleBtn,{marginBottom:16}]} onPress={handleApple} disabled={loading}>
                                    <Ionicons name="logo-apple" size={18} color="#fff" />
                                    <Text style={s.appleText}>Sign up with Apple</Text>
                                </TouchableOpacity>
                                <View style={s.divider}>
                                    <View style={s.divLine} />
                                    <Text style={s.divText}>OR</Text>
                                    <View style={s.divLine} />
                                </View>
                                <TouchableOpacity style={s.primaryBtn} onPress={() => onSignup('email', null)}>
                                    <LinearGradient colors={['#1a1a2e','#0f3460']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.primaryBtnInner}>
                                        <Text style={s.primaryBtnText}>SIGN UP WITH EMAIL</Text>
                                        <Ionicons name="mail-outline" size={17} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity style={s.linkRow} onPress={() => switchMode('login')}>
                                    <Text style={s.linkText}>Already have an account? <Text style={s.linkBold}>Log in</Text></Text>
                                </TouchableOpacity>
                            </View>
                        )}

                    </Animated.View>
                </Animated.View>
            </View>

            {/* Forgot password modal */}
            <ForgotPasswordModal
                visible={forgotVisible}
                onClose={() => setForgotVisible(false)}
                prefillEmail={email}
            />
        </View>
    );
}

// ── Picker styles ─────────────────────────────────────────────────────────────
const pk = StyleSheet.create({
    header:         { paddingTop:80, paddingBottom:40, alignItems:'center' },
    sheet:          { flex:1, backgroundColor:'#fff', borderTopLeftRadius:28, borderTopRightRadius:28, paddingTop:28, paddingHorizontal:24 },
    sheetTitle:     { fontSize:13, fontWeight:'700', color:'#bbb', textTransform:'uppercase', letterSpacing:1, marginBottom:20 },
    accountRowWrap: { flexDirection:'row', alignItems:'center' },
    accountRow:     { flex:1, flexDirection:'row', alignItems:'center', gap:16, paddingVertical:14 },
    accountName:    { fontSize:16, fontWeight:'700', color:'#1a1a2e' },
    accountEmail:   { fontSize:13, color:'#999', marginTop:2 },
    dotsBtn:        { width:36, height:36, borderRadius:18, justifyContent:'center', alignItems:'center' },
    divider:        { height:StyleSheet.hairlineWidth, backgroundColor:'#f0f0f0', marginVertical:8 },
    otherRow:       { flexDirection:'row', alignItems:'center', gap:16, paddingVertical:14 },
    otherIcon:      { width:56, height:56, borderRadius:28, backgroundColor:'#f0f0f0', justifyContent:'center', alignItems:'center' },
    otherText:      { flex:1, fontSize:16, fontWeight:'600', color:'#1a1a2e' },
    bottom:         { backgroundColor:'#fff', paddingHorizontal:24, paddingBottom:48, paddingTop:8, gap:20 },
    createBtn:      { borderWidth:1.5, borderColor:'#1a1a2e', borderRadius:28, paddingVertical:14, alignItems:'center' },
    createBtnText:  { fontSize:15, fontWeight:'700', color:'#1a1a2e' },
    metaRow:        { alignItems:'center' },
});

// ── Account menu styles ───────────────────────────────────────────────────────
const menu = StyleSheet.create({
    overlay:    { flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end' },
    sheet:      { backgroundColor:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24, paddingBottom:36, paddingTop:12 },
    handle:     { width:40, height:4, borderRadius:2, backgroundColor:'#e0e0e0', alignSelf:'center', marginBottom:16 },
    item:       { flexDirection:'row', alignItems:'center', gap:16, paddingHorizontal:24, paddingVertical:16 },
    itemIcon:   { width:44, height:44, borderRadius:12, backgroundColor:'#f0f0f0', justifyContent:'center', alignItems:'center' },
    itemLabel:  { fontSize:16, fontWeight:'700', color:'#1a1a2e' },
    itemSub:    { fontSize:13, color:'#bbb', marginTop:2 },
    divider:    { height:StyleSheet.hairlineWidth, backgroundColor:'#f5f5f5', marginHorizontal:24 },
});

// ── Forgot password modal styles ──────────────────────────────────────────────
const fp = StyleSheet.create({
    overlay:        { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end' },
    sheet:          { backgroundColor:'#fff', borderTopLeftRadius:28, borderTopRightRadius:28, paddingBottom:40 },
    header:         { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:16, paddingBottom:8 },
    backBtn:        { width:36, height:36, borderRadius:10, backgroundColor:'#f8f9fb', justifyContent:'center', alignItems:'center' },
    closeBtn:       { width:36, height:36, borderRadius:18, backgroundColor:'#f0f0f0', justifyContent:'center', alignItems:'center' },
    dots:           { flexDirection:'row', gap:6, paddingHorizontal:24, paddingBottom:8 },
    dot:            { height:4, flex:1, borderRadius:2, backgroundColor:'#f0f0f0' },
    dotActive:      { backgroundColor:'#d0f0da' },
    dotCurrent:     { backgroundColor:'#16a34a' },
    iconCircle:     { width:72, height:72, borderRadius:36, backgroundColor:'#f0fdf4', justifyContent:'center', alignItems:'center', alignSelf:'center', marginBottom:16 },
    title:          { fontSize:22, fontWeight:'900', color:'#1a1a2e', textAlign:'center', marginBottom:8 },
    sub:            { fontSize:14, color:'#999', textAlign:'center', lineHeight:21, marginBottom:24 },
    error:          { backgroundColor:'#fef2f2', borderRadius:10, padding:12, marginBottom:14, borderWidth:1, borderColor:'#fecaca' },
    errorText:      { color:'#e94560', fontSize:13, fontWeight:'600' },
    inputWrap:      { flexDirection:'row', alignItems:'center', backgroundColor:'#f8f9fb', borderRadius:12, borderWidth:1.5, borderColor:'#f0f0f0', marginBottom:12 },
    input:          { flex:1, paddingVertical:13, paddingHorizontal:10, fontSize:15, color:'#1a1a2e' },
    primaryBtn:     { backgroundColor:'#16a34a', borderRadius:12, paddingVertical:15, alignItems:'center', marginTop:4 },
    primaryBtnText: { color:'#fff', fontWeight:'800', fontSize:15 },
    codeInput:      { fontSize:36, fontWeight:'900', color:'#1a1a2e', textAlign:'center', letterSpacing:12, borderBottomWidth:2, borderBottomColor:'#16a34a', paddingVertical:12, marginBottom:24 },
    resendRow:      { alignItems:'center', marginTop:16 },
    resendText:     { fontSize:14, color:'#16a34a', fontWeight:'600' },
    methodRow:      { flexDirection:'row', alignItems:'center', gap:14, padding:14, borderRadius:14, borderWidth:1.5, borderColor:'#f0f0f0', backgroundColor:'#fafafa', marginBottom:10 },
    methodRowActive:{ borderColor:'#16a34a', backgroundColor:'#f0fdf4' },
    methodIcon:     { width:44, height:44, borderRadius:12, backgroundColor:'#f0f0f0', justifyContent:'center', alignItems:'center' },
    methodIconActive:{ backgroundColor:'#16a34a' },
    methodLabel:    { fontSize:15, fontWeight:'700', color:'#1a1a2e' },
    methodSub:      { fontSize:12, color:'#bbb', marginTop:2 },
    radio:          { width:20, height:20, borderRadius:10, borderWidth:2, borderColor:'#ddd', justifyContent:'center', alignItems:'center' },
    radioActive:    { borderColor:'#16a34a' },
    radioDot:       { width:10, height:10, borderRadius:5, backgroundColor:'#16a34a' },
});

// ── Card styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    card:           { backgroundColor:'#fff', borderTopLeftRadius:28, borderTopRightRadius:28, paddingHorizontal:26, paddingTop:24, paddingBottom:52 },
    logoRow:        { flexDirection:'row', alignItems:'center', gap:12, marginBottom:20 },
    logoText:       { fontSize:22, fontWeight:'900', color:'#1a1a2e', letterSpacing:3 },
    logoSub:        { fontSize:9, fontWeight:'700', color:'#16a34a', letterSpacing:3, marginTop:2 },
    headline:       { fontSize:28, fontWeight:'900', color:'#1a1a2e', lineHeight:34, marginBottom:8 },
    sub:            { fontSize:14, color:'#999', marginBottom:24, lineHeight:20 },
    topRow:         { marginBottom:12 },
    backRow:        { flexDirection:'row', alignItems:'center', gap:6 },
    backText:       { fontSize:14, color:'#999', fontWeight:'600' },
    modeTitle:      { fontSize:24, fontWeight:'900', color:'#1a1a2e', marginBottom:18 },
    errorBox:       { backgroundColor:'#fef2f2', borderRadius:10, padding:12, marginBottom:14, borderWidth:1, borderColor:'#fecaca' },
    errorText:      { color:'#e94560', fontSize:13, fontWeight:'600' },
    inputWrap:      { flexDirection:'row', alignItems:'center', backgroundColor:'#f8f9fb', borderRadius:12, borderWidth:1.5, borderColor:'#f0f0f0', marginBottom:10 },
    inputFocused:   { borderColor:'#16a34a', backgroundColor:'#f0fdf4' },
    inputIcon:      { paddingLeft:14, paddingRight:4 },
    input:          { flex:1, paddingVertical:13, paddingHorizontal:10, fontSize:15, color:'#1a1a2e' },
    primaryBtn:     { borderRadius:12, overflow:'hidden', marginBottom:10 },
    primaryBtnInner:{ flexDirection:'row', alignItems:'center', justifyContent:'center', paddingVertical:14, gap:10 },
    primaryBtnText: { color:'#fff', fontSize:14, fontWeight:'800', letterSpacing:1.5 },
    secondaryBtn:   { borderRadius:12, paddingVertical:14, alignItems:'center', borderWidth:1.5, borderColor:'#e0e0e0', marginBottom:4 },
    secondaryBtnText:{ fontSize:14, fontWeight:'800', color:'#1a1a2e', letterSpacing:1.5 },
    divider:        { flexDirection:'row', alignItems:'center', marginBottom:12 },
    divLine:        { flex:1, height:1, backgroundColor:'#f0f0f0' },
    divText:        { color:'#ccc', fontSize:11, fontWeight:'700', letterSpacing:2, marginHorizontal:14 },
    googleBtn:      { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'#fff', borderRadius:12, paddingVertical:12, borderWidth:1.5, borderColor:'#e8e8e8', gap:10 },
    googleG:        { fontSize:16, fontWeight:'800', color:'#4285F4' },
    googleText:     { fontSize:15, fontWeight:'600', color:'#1f1f1f' },
    appleBtn:       { flexDirection:'row', alignItems:'center', justifyContent:'center', backgroundColor:'#000', borderRadius:12, paddingVertical:12, gap:10 },
    appleText:      { fontSize:15, fontWeight:'600', color:'#fff' },
    linkRow:        { alignItems:'center', marginTop:16 },
    linkText:       { color:'#aaa', fontSize:14 },
    linkBold:       { color:'#16a34a', fontWeight:'700' },
});