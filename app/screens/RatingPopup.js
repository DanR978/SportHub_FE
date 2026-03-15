import {
    View, Text, StyleSheet, TouchableOpacity, Modal,
    TextInput, ActivityIndicator, KeyboardAvoidingView,
    Platform, ScrollView,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getToken } from '../services/auth';
import { API_URL } from '../config';

const SPORT_COLORS = {
    Soccer: '#4CAF50', Basketball: '#FF9800', Tennis: '#2196F3',
    Volleyball: '#9C27B0', Pickleball: '#e94560', Baseball: '#795548',
    Football: '#607D8B', Handball: '#E91E63', Softball: '#FFC107',
    Dodgeball: '#009688', Kickball: '#FF9800',
};
const cap = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

export default function RatingPopup({ visible, event, onClose, onRated }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (visible) { setRating(0); setComment(''); setError(''); }
    }, [visible]);

    if (!event) return null;

    const sportKey = cap(event.sport);
    const color = SPORT_COLORS[sportKey] || '#16a34a';

    const handleSubmit = async () => {
        if (rating === 0) return;
        setLoading(true);
        setError('');
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/sports-events/${event.event_id}/rate-host`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ rating, comment: comment.trim() || null }),
            });
            if (res.ok) {
                onRated?.(event.event_id);
                onClose();
            } else {
                const data = await res.json();
                setError(data.detail || 'Could not submit rating');
            }
        } catch (e) {
            setError('Network error. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.overlay}>
                    <View style={styles.sheet}>
                        <View style={styles.handle} />

                        <ScrollView bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>How was the event?</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                    <Ionicons name="close" size={22} color="#999" />
                                </TouchableOpacity>
                            </View>

                            {/* Event info */}
                            <View style={[styles.eventBanner, { backgroundColor: color + '12' }]}>
                                <View style={[styles.sportDot, { backgroundColor: color }]}>
                                    <Ionicons name="trophy" size={14} color="#fff" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                                    <Text style={styles.eventSub}>Hosted by {event.organizer_name || 'Unknown'}</Text>
                                </View>
                            </View>

                            {/* Stars */}
                            <Text style={styles.rateLabel}>Rate the host</Text>
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                                        <Ionicons
                                            name={star <= rating ? 'star' : 'star-outline'}
                                            size={40}
                                            color="#f59e0b"
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {rating > 0 && (
                                <Text style={styles.rateHint}>
                                    {rating === 1 ? 'Poor' : rating === 2 ? 'Below average' : rating === 3 ? 'Average' : rating === 4 ? 'Good' : 'Excellent!'}
                                </Text>
                            )}

                            {/* Comment */}
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Leave a comment (optional)..."
                                placeholderTextColor="#bbb"
                                value={comment}
                                onChangeText={setComment}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />

                            {error ? <Text style={styles.error}>{error}</Text> : null}

                            {/* Buttons */}
                            <TouchableOpacity
                                style={[styles.submitBtn, rating === 0 && { opacity: 0.4 }]}
                                onPress={handleSubmit}
                                disabled={rating === 0 || loading}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : (
                                    <>
                                        <Ionicons name="star" size={16} color="#fff" />
                                        <Text style={styles.submitText}>Submit Rating</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
                                <Text style={styles.skipText}>Maybe later</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '90%' },
    handle:       { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0', alignSelf: 'center', marginTop: 12, marginBottom: 8 },
    header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    title:        { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
    closeBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    eventBanner:  { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, marginBottom: 20 },
    sportDot:     { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    eventTitle:   { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
    eventSub:     { fontSize: 13, color: '#999', marginTop: 2 },
    rateLabel:    { fontSize: 14, fontWeight: '700', color: '#555', textAlign: 'center', marginBottom: 12 },
    starsRow:     { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 8 },
    rateHint:     { fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 16 },
    commentInput: { backgroundColor: '#f8f9fb', borderRadius: 12, padding: 14, fontSize: 14, color: '#1a1a2e', minHeight: 80, textAlignVertical: 'top', marginBottom: 12, borderWidth: 1, borderColor: '#f0f0f0' },
    error:        { color: '#e94560', fontSize: 13, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
    submitBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f59e0b', borderRadius: 14, paddingVertical: 15 },
    submitText:   { color: '#fff', fontWeight: '800', fontSize: 15 },
    skipBtn:      { alignItems: 'center', paddingVertical: 14 },
    skipText:     { color: '#bbb', fontSize: 14, fontWeight: '600' },
});