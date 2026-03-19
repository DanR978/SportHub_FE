import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getToken } from '../services/auth';
import { API_URL } from '../config';

// ─────────────────────────────────────────────────────────────────────────────
// PremiumScreen — shown when a free user tries to create a paid event
// or navigated from Settings
//
// For real IAP:
// 1. npm install react-native-purchases (RevenueCat) or expo-in-app-purchases
// 2. Replace handlePurchase() with real StoreKit/Play Store purchase flow
// 3. On successful purchase, call POST /users/me/premium/activate
// ─────────────────────────────────────────────────────────────────────────────

const FEATURES = [
    { icon: 'cash-outline',      title: 'Create paid events',    sub: 'Charge attendees for your events and earn from organizing' },
    { icon: 'ribbon-outline',    title: 'Premium badge',         sub: 'Stand out with a badge on your profile and events' },
    { icon: 'ban-outline',       title: 'Ad-free experience',    sub: 'No banner ads anywhere in the app' },
    { icon: 'star-outline',      title: 'Priority support',      sub: 'Get help faster when you need it' },
];

export default function PremiumScreen({ navigation, route }) {
    const [loading, setLoading] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [expires, setExpires] = useState(null);
    const fromCreate = route?.params?.fromCreate || false;

    useEffect(() => { checkStatus(); }, []);

    const checkStatus = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/users/me/premium`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setIsPremium(data.is_premium);
                setExpires(data.expires);
            }
        } catch {}
    };

    const handlePurchase = async () => {
        // ── PLACEHOLDER ──
        // Replace this with real IAP via RevenueCat or expo-in-app-purchases
        // After successful purchase receipt validation, call the activate endpoint
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/users/me/premium/activate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setIsPremium(true);
                Alert.alert('Welcome to Premium!', 'You can now create paid events. Go back and set your price.', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            } else {
                Alert.alert('Error', 'Could not activate premium. Try again.');
            }
        } catch {
            Alert.alert('Error', 'Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top:12,bottom:12,left:12,right:12 }}>
                    <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
                {/* Hero */}
                <LinearGradient colors={['#f59e0b','#d97706']} style={s.heroIcon}>
                    <Ionicons name="diamond" size={36} color="#fff" />
                </LinearGradient>
                <Text style={s.heroTitle}>SportMap Premium</Text>
                <Text style={s.heroSub}>
                    {fromCreate
                        ? 'Upgrade to create events that charge an entry fee'
                        : 'Unlock the full SportMap experience'}
                </Text>

                {/* Price */}
                <View style={s.priceCard}>
                    <Text style={s.priceAmount}>$4.99</Text>
                    <Text style={s.pricePer}>/month</Text>
                </View>

                {/* Features */}
                <View style={s.featureList}>
                    {FEATURES.map((f, i) => (
                        <View key={i} style={s.featureRow}>
                            <View style={s.featureIcon}>
                                <Ionicons name={f.icon} size={20} color="#f59e0b" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.featureTitle}>{f.title}</Text>
                                <Text style={s.featureSub}>{f.sub}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Already premium */}
                {isPremium && (
                    <View style={s.activeBadge}>
                        <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                        <Text style={s.activeText}>You're a Premium member</Text>
                    </View>
                )}
            </ScrollView>

            {/* Bottom CTA */}
            {!isPremium && (
                <View style={s.bottomBar}>
                    <TouchableOpacity style={s.purchaseBtn} onPress={handlePurchase} disabled={loading} activeOpacity={0.8}>
                        <LinearGradient colors={['#f59e0b','#d97706']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.purchaseBtnInner}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="diamond" size={18} color="#fff" />
                                    <Text style={s.purchaseBtnText}>Subscribe for $4.99/month</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                    <Text style={s.legalText}>Cancel anytime. Subscription auto-renews monthly.</Text>
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container:      { flex: 1, backgroundColor: '#1a1a2e' },
    header:         { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
    body:           { paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' },
    heroIcon:       { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 20 },
    heroTitle:      { fontSize: 28, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 8 },
    heroSub:        { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 16 },
    priceCard:      { flexDirection: 'row', alignItems: 'baseline', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 28, marginBottom: 32 },
    priceAmount:    { fontSize: 40, fontWeight: '900', color: '#f59e0b' },
    pricePer:       { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginLeft: 4 },
    featureList:    { width: '100%' },
    featureRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 20 },
    featureIcon:    { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.12)', justifyContent: 'center', alignItems: 'center' },
    featureTitle:   { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
    featureSub:     { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 18 },
    activeBadge:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(22,163,74,0.15)', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, marginTop: 12 },
    activeText:     { fontSize: 15, fontWeight: '700', color: '#16a34a' },
    bottomBar:      { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 40, backgroundColor: '#1a1a2e', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
    purchaseBtn:    { borderRadius: 16, overflow: 'hidden' },
    purchaseBtnInner:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
    purchaseBtnText:{ fontSize: 16, fontWeight: '800', color: '#fff' },
    legalText:      { fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 10 },
});