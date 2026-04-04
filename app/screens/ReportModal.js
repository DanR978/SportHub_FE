import {
    View, Text, StyleSheet, TouchableOpacity, Modal,
    TextInput, ActivityIndicator, ScrollView,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getToken } from '../services/auth';
import { API_URL } from '../config';

const REASONS = [
    { key: 'spam',          label: 'Spam or fake',           icon: 'megaphone-outline' },
    { key: 'harassment',    label: 'Harassment or bullying', icon: 'alert-circle-outline' },
    { key: 'inappropriate', label: 'Inappropriate content',  icon: 'eye-off-outline' },
    { key: 'safety',        label: 'Safety concern',         icon: 'shield-outline' },
    { key: 'other',         label: 'Other',                  icon: 'ellipsis-horizontal-outline' },
];

export default function ReportModal({ visible, onClose, targetType, targetId, targetName }) {
    const [selectedReason, setSelectedReason] = useState(null);
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (visible) {
            setSelectedReason(null);
            setDetails('');
            setSubmitted(false);
            setError('');
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (!selectedReason) return;
        setLoading(true);
        setError('');
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/reports`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    target_type: targetType,
                    target_id: targetId,
                    reason: selectedReason,
                    details: details.trim() || null,
                }),
            });
            if (res.ok) {
                setSubmitted(true);
            } else {
                const data = await res.json();
                setError(data.detail || 'Could not submit report');
            }
        } catch {
            setError('Network error. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={s.container}>
                <View style={s.header}>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={s.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Report {targetType === 'user' ? 'User' : 'Event'}</Text>
                    <View style={{ width: 50 }} />
                </View>

                {submitted ? (
                    <View style={s.successContainer}>
                        <View style={s.successIcon}>
                            <Ionicons name="checkmark-circle" size={56} color="#16a34a" />
                        </View>
                        <Text style={s.successTitle}>Report submitted</Text>
                        <Text style={s.successSub}>
                            We'll review your report and take action if needed. Thank you for helping keep Game Radar safe.
                        </Text>
                        <TouchableOpacity style={s.doneBtn} onPress={onClose}>
                            <Text style={s.doneBtnText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView
                        style={s.body}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    >

                        <Text style={s.sectionLabel}>What's the issue?</Text>
                        {REASONS.map(r => (
                            <TouchableOpacity
                                key={r.key}
                                style={[s.reasonRow, selectedReason === r.key && s.reasonRowActive]}
                                onPress={() => setSelectedReason(r.key)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name={r.icon} size={18} color={selectedReason === r.key ? '#16a34a' : '#999'} />
                                <Text style={[s.reasonText, selectedReason === r.key && s.reasonTextActive]}>{r.label}</Text>
                                {selectedReason === r.key && <Ionicons name="checkmark-circle" size={18} color="#16a34a" />}
                            </TouchableOpacity>
                        ))}

                        <Text style={s.sectionLabel}>Additional details (optional)</Text>
                        <TextInput
                            style={s.input}
                            placeholder="Tell us more about what happened..."
                            placeholderTextColor="#bbb"
                            value={details}
                            onChangeText={setDetails}
                            multiline
                            numberOfLines={3}
                            maxLength={500}
                            textAlignVertical="top"
                        />

                        {error ? (
                            <View style={s.errorBox}>
                                <Text style={s.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[s.submitBtn, !selectedReason && { opacity: 0.4 }]}
                            onPress={handleSubmit}
                            disabled={!selectedReason || loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={s.submitBtnText}>Submit Report</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    container:        { flex: 1, backgroundColor: '#f8f9fb' },
    header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    cancelText:       { fontSize: 16, color: '#999', fontWeight: '600' },
    headerTitle:      { fontSize: 17, fontWeight: '800', color: '#1a1a2e' },
    body:             { flex: 1, padding: 20 },
    sectionLabel:     { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 10 },
    reasonRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 6, backgroundColor: '#fff' },
    reasonRowActive:  { backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#bbf7d0' },
    reasonText:       { flex: 1, fontSize: 15, fontWeight: '500', color: '#666' },
    reasonTextActive: { color: '#1a1a2e', fontWeight: '600' },
    input:            { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 14, color: '#1a1a2e', minHeight: 100, textAlignVertical: 'top' },
    errorBox:         { backgroundColor: '#fee2e2', borderRadius: 10, padding: 12, marginTop: 12 },
    errorText:        { fontSize: 13, color: '#e94560', fontWeight: '600' },
    submitBtn:        { backgroundColor: '#e94560', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
    submitBtnText:    { color: '#fff', fontWeight: '800', fontSize: 16 },
    successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    successIcon:      { marginBottom: 20 },
    successTitle:     { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
    successSub:       { fontSize: 15, color: '#999', textAlign: 'center', lineHeight: 22 },
    doneBtn:          { backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 48, marginTop: 28 },
    doneBtnText:      { color: '#fff', fontWeight: '800', fontSize: 16 },
});