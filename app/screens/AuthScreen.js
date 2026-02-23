import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    Animated, Dimensions, Platform,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

function SoccerField() {
    const fh = height, fw = width, pad = 20;
    const lc = 'rgba(255,255,255,0.75)';
    const penW = 160, penH = 90, goalW = 84, goalH = 40, arcW = 68, arcH = 34;
    return (
        <View style={{ position: 'absolute', top: 0, left: 0, width: fw, height: fh, overflow: 'hidden' }}>
            {[...Array(9)].map((_, i) => (
                <View key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * (fh / 9), height: fh / 9, backgroundColor: i % 2 === 0 ? '#27a03a' : '#2eb843' }} />
            ))}
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

export default function AuthScreen() {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedInput, setFocusedInput] = useState(null);

    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const cardAnim = useRef(new Animated.Value(60)).current;
    const cardFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(cardFade, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(cardAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
        ]).start();
    }, []);

    const switchMode = (newMode) => {
        if (newMode === mode) return;
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 130, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: newMode === 'signup' ? -24 : 24, duration: 130, useNativeDriver: true }),
        ]).start(() => {
            setMode(newMode);
            slideAnim.setValue(newMode === 'signup' ? 24 : -24);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 170, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, friction: 9, useNativeDriver: true }),
            ]).start();
        });
    };

    return (
        <View style={{ flex: 1 }}>
            <SoccerField />

            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                <Animated.View style={[styles.card, { opacity: cardFade, transform: [{ translateY: cardAnim }] }]}>

                    <View style={styles.logoRow}>
                        <View style={styles.logoMark}>
                            <View style={[styles.logoBar, { height: 12, opacity: 0.5 }]} />
                            <View style={[styles.logoBar, { height: 20 }]} />
                            <View style={[styles.logoBar, { height: 14, opacity: 0.75 }]} />
                        </View>
                        <View>
                            <Text style={styles.logoText}>SPORTHUB</Text>
                            <Text style={styles.logoSub}>FIND YOUR GAME</Text>
                        </View>
                    </View>

                    <View style={styles.tabRow}>
                        <TouchableOpacity style={styles.tabItem} onPress={() => switchMode('login')}>
                            <Text style={[styles.tabLabel, mode === 'login' && styles.tabActive]}>LOG IN</Text>
                            {mode === 'login' && <View style={styles.tabLine} />}
                        </TouchableOpacity>
                        <View style={styles.tabDivider} />
                        <TouchableOpacity style={styles.tabItem} onPress={() => switchMode('signup')}>
                            <Text style={[styles.tabLabel, mode === 'signup' && styles.tabActive]}>SIGN UP</Text>
                            {mode === 'signup' && <View style={styles.tabLine} />}
                        </TouchableOpacity>
                    </View>

                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
                        {mode === 'signup' && (
                            <View style={styles.nameRow}>
                                <View style={[styles.inputWrapper, focusedInput === 'first' && styles.inputFocused, { flex: 1, marginRight: 10 }]}>
                                    <TextInput
                                        style={[styles.input, { paddingLeft: 16 }]}
                                        placeholder="First name"
                                        placeholderTextColor="#bbb"
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        autoCapitalize="words"
                                        onFocus={() => setFocusedInput('first')}
                                        onBlur={() => setFocusedInput(null)}
                                    />
                                </View>
                                <View style={[styles.inputWrapper, focusedInput === 'last' && styles.inputFocused, { flex: 1 }]}>
                                    <TextInput
                                        style={[styles.input, { paddingLeft: 16 }]}
                                        placeholder="Last name"
                                        placeholderTextColor="#bbb"
                                        value={lastName}
                                        onChangeText={setLastName}
                                        autoCapitalize="words"
                                        onFocus={() => setFocusedInput('last')}
                                        onBlur={() => setFocusedInput(null)}
                                    />
                                </View>
                            </View>
                        )}

                        <View style={[styles.inputWrapper, focusedInput === 'email' && styles.inputFocused]}>
                            <Ionicons name="mail-outline" size={17} color={focusedInput === 'email' ? '#16a34a' : '#bbb'} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email address"
                                placeholderTextColor="#bbb"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                onFocus={() => setFocusedInput('email')}
                                onBlur={() => setFocusedInput(null)}
                            />
                        </View>

                        <View style={[styles.inputWrapper, focusedInput === 'password' && styles.inputFocused]}>
                            <Ionicons name="lock-closed-outline" size={17} color={focusedInput === 'password' ? '#16a34a' : '#bbb'} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#bbb"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                                onFocus={() => setFocusedInput('password')}
                                onBlur={() => setFocusedInput(null)}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={17} color="#bbb" />
                            </TouchableOpacity>
                        </View>

                        {mode === 'login' && (
                            <TouchableOpacity style={styles.forgotRow}>
                                <Text style={styles.forgotText}>Forgot password?</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85}>
                            <LinearGradient colors={['#16a34a', '#15803d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaInner}>
                                <Text style={styles.ctaText}>{mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}</Text>
                                <Ionicons name="arrow-forward" size={18} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity style={styles.googleBtn} activeOpacity={0.9}>
                            <Text style={styles.googleG}>G</Text>
                            <Text style={styles.googleText}>Continue with Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.appleBtn} activeOpacity={0.9}>
                            <Ionicons name="logo-apple" size={19} color="#fff" />
                            <Text style={styles.appleText}>Continue with Apple</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <View style={styles.bottomRow}>
                        <Text style={styles.bottomText}>
                            {mode === 'login' ? 'New to SportHub? ' : 'Already have an account? '}
                        </Text>
                        <TouchableOpacity onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
                            <Text style={styles.bottomLink}>{mode === 'login' ? 'Sign up free' : 'Log in'}</Text>
                        </TouchableOpacity>
                    </View>

                    {mode === 'signup' && (
                        <Text style={styles.terms}>
                            By signing up you agree to our <Text style={styles.termsLink}>Terms</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
                        </Text>
                    )}
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 26, paddingTop: 24, paddingBottom: 120, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 20 },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
    logoMark: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
    logoBar: { width: 4, backgroundColor: '#16a34a', borderRadius: 2 },
    logoText: { fontSize: 22, fontWeight: '900', color: '#1a1a2e', letterSpacing: 3 },
    logoSub: { fontSize: 9, fontWeight: '700', color: '#16a34a', letterSpacing: 3, marginTop: 2 },
    tabRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    tabItem: { paddingBottom: 8, marginRight: 22 },
    tabLabel: { fontSize: 12, fontWeight: '700', color: '#ccc', letterSpacing: 2 },
    tabActive: { color: '#1a1a2e' },
    tabLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#16a34a', borderRadius: 1 },
    tabDivider: { width: 1, height: 14, backgroundColor: '#eee', marginRight: 22 },
    nameRow: { flexDirection: 'row' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fb', borderRadius: 12, borderWidth: 1.5, borderColor: '#f0f0f0', marginBottom: 10 },
    inputFocused: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
    inputIcon: { paddingLeft: 14, paddingRight: 4 },
    input: { flex: 1, paddingVertical: 13, paddingHorizontal: 10, fontSize: 15, color: '#1a1a2e' },
    eyeBtn: { paddingRight: 14 },
    forgotRow: { alignSelf: 'flex-end', marginBottom: 14, marginTop: -2 },
    forgotText: { color: '#16a34a', fontSize: 13, fontWeight: '600' },
    ctaBtn: { borderRadius: 12, overflow: 'hidden', marginBottom: 14 },
    ctaInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 10 },
    ctaText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 2 },
    divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#f0f0f0' },
    dividerText: { color: '#ccc', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginHorizontal: 14 },
    googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, marginBottom: 10, borderWidth: 1.5, borderColor: '#e8e8e8', gap: 10 },
    googleG: { fontSize: 16, fontWeight: '800', color: '#4285F4' },
    googleText: { fontSize: 15, fontWeight: '600', color: '#1f1f1f' },
    appleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', borderRadius: 12, paddingVertical: 12, gap: 10 },
    appleText: { fontSize: 15, fontWeight: '600', color: '#fff' },
    bottomRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
    bottomText: { color: '#aaa', fontSize: 14 },
    bottomLink: { color: '#16a34a', fontSize: 14, fontWeight: '700' },
    terms: { textAlign: 'center', color: '#bbb', fontSize: 12, marginTop: 12, lineHeight: 18 },
    termsLink: { color: '#999', fontWeight: '600' },
});