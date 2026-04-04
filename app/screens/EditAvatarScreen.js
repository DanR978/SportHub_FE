import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getToken } from '../services/auth';
import StepAvatar from './SetupAvatar';

import { API_URL } from '../config';

const DEFAULT_CONFIG = {
    skinTone: '#F5C89A', hairColor: '#1a1a1a', hairStyle: 'short',
    facialHair: 'none', accessory: 'none', eyeColor: 'dark',
    expression: 'neutral', jerseyNumber: '',
};

export default function EditAvatarScreen({ navigation }) {
    const [formData, setFormData] = useState({
        avatar: DEFAULT_CONFIG,
        photo: null,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken();
                const res = await fetch(`${API_URL}/users/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const user = await res.json();
                    if (user.avatar_config) {
                        const parsed = typeof user.avatar_config === 'string'
                            ? JSON.parse(user.avatar_config)
                            : user.avatar_config;
                        setFormData(prev => ({
                            ...prev,
                            avatar: { ...DEFAULT_CONFIG, ...parsed },
                        }));
                    }
                }
            } catch (e) { console.log('Fetch avatar error:', e); }
            finally { setLoading(false); }
        })();
    }, []);

    const update = (changes) => {
        setFormData(prev => ({ ...prev, ...changes }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = await getToken();
            const body = {};
            if (formData.photo) {
                body.avatar_photo = formData.photo;
                body.avatar_config = null;
            } else {
                body.avatar_config = JSON.stringify(formData.avatar);
            }
            const res = await fetch(`${API_URL}/users/me`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
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

            {/* Reuse the same avatar editor from setup */}
            <StepAvatar formData={formData} update={update} />
        </View>
    );
}

const styles = StyleSheet.create({
    container:  { flex: 1, backgroundColor: '#fff' },
    centered:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    headerBtn:  { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8f9fb', justifyContent: 'center', alignItems: 'center' },
    headerTitle:{ fontSize: 17, fontWeight: '800', color: '#1a1a2e' },
    saveBtn:    { backgroundColor: '#16a34a', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 8 },
    saveBtnText:{ color: '#fff', fontWeight: '800', fontSize: 14 },
});