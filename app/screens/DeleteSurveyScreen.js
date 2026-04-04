import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Animated, Alert, ActivityIndicator,
} from 'react-native';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getToken, removeToken } from '../services/auth';
import appCallbacks from '../services/appCallbacks';

import { API_URL } from '../config';

const REASONS = [
    { id: 'not_useful',    icon: 'sad-outline',           label: "It's not useful to me",         sub: 'I don\'t find events I like' },
    { id: 'privacy',       icon: 'shield-outline',        label: 'Privacy concerns',               sub: 'I\'m not comfortable sharing my data' },
    { id: 'too_many',      icon: 'notifications-outline', label: 'Too many notifications',         sub: 'I get too many emails or alerts' },
    { id: 'switching',     icon: 'swap-horizontal-outline',label: 'Switching to another app',      sub: 'I found a better alternative' },
    { id: 'temporary',     icon: 'time-outline',          label: 'Taking a break',                 sub: 'I\'ll be back later' },
    { id: 'other',         icon: 'ellipsis-horizontal-outline', label: 'Other reason',             sub: 'Something else' },
];

export default function DeleteSurveyScreen({ navigation, route }) {
    const { onDeleted, onDeactivated } = route.params || {};
    const [step, setStep]         = useState(1); // 1=reason, 2=deactivate offer, 3=confirm
    const [selected, setSelected] = useState(null);
    const [loading, setLoading]   = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const goToStep = (next) => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start();
        setTimeout(() => setStep(next), 180);
    };

    const handleDeactivate = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            await fetch(`${API_URL}/users/me`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ is_active: false }),
            });
            await removeToken();
            onDeactivated?.();
            appCallbacks.onDeactivated?.();
        } catch (e) {
            Alert.alert('Error', 'Could not deactivate. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            await fetch(`${API_URL}/users/me`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            await removeToken();
            onDeleted?.();
            appCallbacks.onDeleted?.();
        } catch (e) {
            Alert.alert('Error', 'Could not delete account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => step > 1 ? goToStep(step - 1) : navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
                </TouchableOpacity>
                <View style={s.stepDots}>
                    {[1,2,3].map(n => <View key={n} style={[s.dot, step >= n && s.dotActive]} />)}
                </View>
                <View style={{ width: 36 }} />
            </View>

            <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                    {/* ── STEP 1: REASON ── */}
                    {step === 1 && (
                        <>
                            <View style={s.iconCircle}>
                                <Ionicons name="help-circle-outline" size={40} color="#e94560" />
                            </View>
                            <Text style={s.title}>Why are you leaving?</Text>
                            <Text style={s.sub}>Your feedback helps us improve Game Radar for everyone.</Text>
                            <View style={s.reasonList}>
                                {REASONS.map(r => (
                                    <TouchableOpacity
                                        key={r.id}
                                        style={[s.reasonRow, selected === r.id && s.reasonRowActive]}
                                        onPress={() => setSelected(r.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[s.reasonIcon, selected === r.id && s.reasonIconActive]}>
                                            <Ionicons name={r.icon} size={20} color={selected === r.id ? '#fff' : '#666'} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[s.reasonLabel, selected === r.id && s.reasonLabelActive]}>{r.label}</Text>
                                            <Text style={s.reasonSub}>{r.sub}</Text>
                                        </View>
                                        <View style={[s.radio, selected === r.id && s.radioActive]}>
                                            {selected === r.id && <View style={s.radioDot} />}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TouchableOpacity
                                style={[s.primaryBtn, !selected && { opacity: 0.4 }]}
                                disabled={!selected}
                                onPress={() => goToStep(2)}
                            >
                                <Text style={s.primaryBtnText}>Continue</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* ── STEP 2: DEACTIVATE OFFER ── */}
                    {step === 2 && (
                        <>
                            <LinearGradient colors={['#f0fdf4','#fff']} style={s.deactivateCard}>
                                <View style={s.deactivateIconRow}>
                                    <View style={s.deactivateIcon}>
                                        <Ionicons name="pause-circle-outline" size={48} color="#16a34a" />
                                    </View>
                                </View>
                                <Text style={s.title}>Want to take a break instead?</Text>
                                <Text style={s.sub}>Deactivating hides your profile and pauses all notifications. Your data stays safe and you can come back anytime.</Text>
                                <View style={s.benefitList}>
                                    {[
                                        ['checkmark-circle','Your events and history are saved'],
                                        ['checkmark-circle','No emails or notifications'],
                                        ['checkmark-circle','Reactivate instantly by logging back in'],
                                    ].map(([icon, text], i) => (
                                        <View key={i} style={s.benefitRow}>
                                            <Ionicons name={icon} size={18} color="#16a34a" />
                                            <Text style={s.benefitText}>{text}</Text>
                                        </View>
                                    ))}
                                </View>
                                <TouchableOpacity style={s.deactivateBtn} onPress={handleDeactivate} disabled={loading}>
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.deactivateBtnText}>Deactivate My Account</Text>}
                                </TouchableOpacity>
                            </LinearGradient>

                            <TouchableOpacity style={s.ghostBtn} onPress={() => goToStep(3)}>
                                <Text style={s.ghostBtnText}>No thanks, I still want to delete</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* ── STEP 3: FINAL CONFIRM ── */}
                    {step === 3 && (
                        <>
                            <View style={s.warningCircle}>
                                <Ionicons name="warning-outline" size={40} color="#e94560" />
                            </View>
                            <Text style={s.title}>This cannot be undone</Text>
                            <Text style={s.sub}>Deleting your account will permanently remove:</Text>
                            <View style={s.loseList}>
                                {[
                                    ['close-circle','Your profile and all personal info'],
                                    ['close-circle','All events you created'],
                                    ['close-circle','Your ratings and reviews'],
                                    ['close-circle','Your event history'],
                                ].map(([icon, text], i) => (
                                    <View key={i} style={s.loseRow}>
                                        <Ionicons name={icon} size={18} color="#e94560" />
                                        <Text style={s.loseText}>{text}</Text>
                                    </View>
                                ))}
                            </View>
                            <TouchableOpacity style={s.deleteBtn} onPress={handleDelete} disabled={loading}>
                                {loading
                                    ? <ActivityIndicator color="#fff" />
                                    : <><Ionicons name="trash-outline" size={18} color="#fff" /><Text style={s.deleteBtnText}>Yes, Delete My Account</Text></>
                                }
                            </TouchableOpacity>
                            <TouchableOpacity style={s.ghostBtn} onPress={() => navigation.goBack()}>
                                <Text style={s.ghostBtnText}>Never mind, keep my account</Text>
                            </TouchableOpacity>
                        </>
                    )}

                </ScrollView>
            </Animated.View>
        </View>
    );
}

const s = StyleSheet.create({
    container:        { flex: 1, backgroundColor: '#fff' },
    header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
    backBtn:          { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8f9fb', justifyContent: 'center', alignItems: 'center' },
    stepDots:         { flexDirection: 'row', gap: 6 },
    dot:              { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e0e0e0' },
    dotActive:        { backgroundColor: '#e94560', width: 20 },
    scroll:           { padding: 24, paddingTop: 8 },
    iconCircle:       { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fdecea', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20 },
    warningCircle:    { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fdecea', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20 },
    title:            { fontSize: 24, fontWeight: '800', color: '#1a1a2e', textAlign: 'center', marginBottom: 10 },
    sub:              { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 21, marginBottom: 28 },
    reasonList:       { gap: 10, marginBottom: 28 },
    reasonRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#f0f0f0', backgroundColor: '#fafafa' },
    reasonRowActive:  { borderColor: '#e94560', backgroundColor: '#fef2f2' },
    reasonIcon:       { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    reasonIconActive: { backgroundColor: '#e94560' },
    reasonLabel:      { fontSize: 14, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
    reasonLabelActive:{ color: '#e94560' },
    reasonSub:        { fontSize: 12, color: '#bbb' },
    radio:            { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
    radioActive:      { borderColor: '#e94560' },
    radioDot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e94560' },
    primaryBtn:       { backgroundColor: '#1a1a2e', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    primaryBtnText:   { color: '#fff', fontWeight: '800', fontSize: 16 },
    deactivateCard:   { borderRadius: 20, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: '#dcfce7' },
    deactivateIconRow:{ alignItems: 'center', marginBottom: 16 },
    deactivateIcon:   { width: 88, height: 88, borderRadius: 44, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
    benefitList:      { gap: 12, marginBottom: 24 },
    benefitRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
    benefitText:      { fontSize: 14, color: '#1a1a2e', fontWeight: '500' },
    deactivateBtn:    { backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    deactivateBtnText:{ color: '#fff', fontWeight: '800', fontSize: 15 },
    ghostBtn:         { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    ghostBtnText:     { fontSize: 14, color: '#bbb', fontWeight: '600' },
    loseList:         { gap: 12, marginBottom: 32, alignSelf: 'stretch' },
    loseRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fef2f2', padding: 12, borderRadius: 10 },
    loseText:         { fontSize: 14, color: '#1a1a2e', fontWeight: '500' },
    deleteBtn:        { backgroundColor: '#e94560', borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
    deleteBtnText:    { color: '#fff', fontWeight: '800', fontSize: 15 },
});