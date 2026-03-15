import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getToken } from '../services/auth';
import { AvatarPreview } from './SetupAvatar';

import { API_URL } from '../config';

const SKIN_TONES  = ['#FDDBB4','#F5C89A','#E8A87C','#C68642','#8D5524','#4A2912'];
const HAIR_COLORS = ['#1a1a1a','#4a3728','#8B4513','#D4A017','#E8C99A','#FF6B6B','#4ECDC4'];
const HAIR_STYLES = ['short','medium','long','curly','bun','none'];
const HAIR_LABELS = ['Short','Medium','Long','Curly','Bun','Bald'];
const FACIAL_HAIR  = ['none','stubble','beard','mustache'];
const FACIAL_LABELS= ['None','Stubble','Beard','Mustache'];
const ACCESSORIES  = ['none','headband','cap','sunglasses'];
const ACC_LABELS   = ['None','Headband','Cap','Shades'];

const DEFAULT_CONFIG = {
    skinTone: '#F5C89A', hairColor: '#4a3728', hairStyle: 'short',
    facialHair: 'none', accessory: 'none',
};

export default function EditAvatarScreen({ navigation }) {
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken();
                const res = await fetch(`${API_URL}/users/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const user = await res.json();
                    if (user.avatar_config) setConfig(JSON.parse(user.avatar_config));
                }
            } catch (e) { console.log('Fetch avatar error:', e); }
            finally { setLoading(false); }
        })();
    }, []);

    const update = (field, value) => setConfig(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/users/me`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ avatar_config: JSON.stringify(config) }),
            });
            if (res.ok) {
                navigation.goBack();
            } else {
                Alert.alert('Error', 'Failed to save avatar.');
            }
        } catch (e) {
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#16a34a" /></View>;

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={22} color="#1a1a2e" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Avatar</Text>
                <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.saveBtnText}>Save</Text>
                    }
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* PREVIEW */}
                <View style={styles.previewSection}>
                    <View style={styles.previewBox}>
                        <AvatarPreview config={config} size={140} />
                    </View>
                </View>

                {/* SKIN TONE */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Skin Tone</Text>
                    <View style={styles.colorRow}>
                        {SKIN_TONES.map(t => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.colorDot, { backgroundColor: t }, config.skinTone === t && styles.colorDotSelected]}
                                onPress={() => update('skinTone', t)}
                            />
                        ))}
                    </View>
                </View>

                {/* HAIR STYLE */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Hair Style</Text>
                    <View style={styles.chipRow}>
                        {HAIR_STYLES.map((hs, i) => (
                            <TouchableOpacity
                                key={hs}
                                style={[styles.chip, config.hairStyle === hs && styles.chipActive]}
                                onPress={() => update('hairStyle', hs)}
                            >
                                <Text style={[styles.chipText, config.hairStyle === hs && styles.chipTextActive]}>
                                    {HAIR_LABELS[i]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {config.hairStyle !== 'none' && (
                        <>
                            <Text style={styles.subLabel}>Hair Color</Text>
                            <View style={styles.colorRow}>
                                {HAIR_COLORS.map(c => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.colorDot, { backgroundColor: c }, config.hairColor === c && styles.colorDotSelected]}
                                        onPress={() => update('hairColor', c)}
                                    />
                                ))}
                            </View>
                        </>
                    )}
                </View>

                {/* FACIAL HAIR */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Facial Hair</Text>
                    <View style={styles.chipRow}>
                        {FACIAL_HAIR.map((f, i) => (
                            <TouchableOpacity
                                key={f}
                                style={[styles.chip, config.facialHair === f && styles.chipActive]}
                                onPress={() => update('facialHair', f)}
                            >
                                <Text style={[styles.chipText, config.facialHair === f && styles.chipTextActive]}>
                                    {FACIAL_LABELS[i]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ACCESSORIES */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Accessories</Text>
                    <View style={styles.chipRow}>
                        {ACCESSORIES.map((a, i) => (
                            <TouchableOpacity
                                key={a}
                                style={[styles.chip, config.accessory === a && styles.chipActive]}
                                onPress={() => update('accessory', a)}
                            >
                                <Text style={[styles.chipText, config.accessory === a && styles.chipTextActive]}>
                                    {ACC_LABELS[i]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container:          { flex: 1, backgroundColor: '#f8f9fb' },
    centered:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    headerBtn:          { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8f9fb', justifyContent: 'center', alignItems: 'center' },
    headerTitle:        { fontSize: 17, fontWeight: '800', color: '#1a1a2e' },
    saveBtn:            { backgroundColor: '#16a34a', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 8 },
    saveBtnText:        { color: '#fff', fontWeight: '800', fontSize: 14 },
    scroll:             { padding: 20 },
    previewSection:     { alignItems: 'center', marginBottom: 8 },
    previewBox:         { width: 180, height: 200, backgroundColor: '#f0fdf4', borderRadius: 90, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#86efac' },
    card:               { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardTitle:          { fontSize: 15, fontWeight: '800', color: '#1a1a2e', marginBottom: 14 },
    subLabel:           { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 10 },
    colorRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    colorDot:           { width: 36, height: 36, borderRadius: 18 },
    colorDotSelected:   { borderWidth: 3, borderColor: '#16a34a', transform: [{ scale: 1.15 }] },
    chipRow:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip:               { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#f8f9fb', borderWidth: 1.5, borderColor: '#f0f0f0' },
    chipActive:         { backgroundColor: '#16a34a', borderColor: '#16a34a' },
    chipText:           { fontSize: 13, fontWeight: '600', color: '#666' },
    chipTextActive:     { color: '#fff' },
});