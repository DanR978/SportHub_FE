import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Share, ActivityIndicator, Image, Modal, TextInput,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getToken } from '../services/auth';

const API_URL = 'http://192.168.4.131:8000';

const SPORT_COLORS = {
    Soccer: '#4CAF50', Basketball: '#FF9800', Tennis: '#2196F3',
    Volleyball: '#9C27B0', Pickleball: '#e94560', Baseball: '#795548',
    Football: '#607D8B', Handball: '#E91E63', Softball: '#FFC107',
    Dodgeball: '#009688', Kickball: '#FF9800',
};

const SPORT_ICONS = {
    Soccer: 'football-outline', Basketball: 'basketball-outline', Tennis: 'tennisball-outline',
    Volleyball: 'baseball-outline', Pickleball: 'baseball-outline', Baseball: 'baseball-outline',
    Football: 'american-football-outline', Handball: 'hand-left-outline',
    Softball: 'baseball-outline', Dodgeball: 'radio-button-on-outline', Kickball: 'football-outline',
};

const cap = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
};

function OrganizerAvatar({ photo, avatarConfig, name, size = 56 }) {
    const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
    const config = avatarConfig ? JSON.parse(avatarConfig) : null;

    if (photo) {
        return <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
    }
    return (
        <LinearGradient
            colors={['#16a34a', '#0f3460']}
            style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}
        >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.3 }}>{initials}</Text>
        </LinearGradient>
    );
}

export default function EventDetailScreen({ route, navigation }) {
    const { eventId } = route.params;

    // ── ALL STATE UP TOP ──────────────────────────────────────
    const [event, setEvent]               = useState(null);
    const [loading, setLoading]           = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rateVisible, setRateVisible]   = useState(false);
    const [selectedRating, setSelectedRating] = useState(0);
    const [rateComment, setRateComment]   = useState('');
    const [rateLoading, setRateLoading]   = useState(false);

    useEffect(() => { fetchEvent(); }, []);

    // ── FETCH ─────────────────────────────────────────────────
    const fetchEvent = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/sports-events/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setEvent(await res.json());
        } catch (e) {
            console.log('Fetch event detail error:', e);
        } finally {
            setLoading(false);
        }
    };

    // ── JOIN / LEAVE ──────────────────────────────────────────
    const handleJoinLeave = async () => {
        if (!event) return;
        setActionLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(
                `${API_URL}/sports-events/${eventId}/${event.joined ? 'leave' : 'join'}`,
                { method: event.joined ? 'DELETE' : 'POST', headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                setEvent(prev => ({
                    ...prev,
                    joined: !prev.joined,
                    participant_count: prev.joined
                        ? Math.max(prev.participant_count - 1, 0)
                        : prev.participant_count + 1,
                }));
            }
        } catch (e) {
            console.log('Join/leave error:', e);
        } finally {
            setActionLoading(false);
        }
    };

    // ── SHARE ─────────────────────────────────────────────────
    const handleShare = async () => {
        try {
            await Share.share({
                message: `Join me at ${event.title} on ${formatDate(event.start_date)} at ${event.location}! Find it on SportHub.`,
            });
        } catch (e) { console.log('Share error:', e); }
    };

    // ── RATE ──────────────────────────────────────────────────
    const submitRating = async () => {
        if (selectedRating === 0) return;
        setRateLoading(true);
        try {
            const token = await getToken();
            const params = new URLSearchParams({ rating: selectedRating });
            if (rateComment) params.append('comment', rateComment);
            const res = await fetch(`${API_URL}/sports-events/${eventId}/rate?${params.toString()}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setEvent(prev => ({
                    ...prev,
                    host_rating: data.new_average,
                    total_ratings: data.total_ratings,
                }));
                setRateVisible(false);
                setSelectedRating(0);
                setRateComment('');
            }
        } catch (e) {
            console.log('Rate error:', e);
        } finally {
            setRateLoading(false);
        }
    };

    // ── LOADING / NOT FOUND ───────────────────────────────────
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#16a34a" />
            </View>
        );
    }

    if (!event) {
        return (
            <View style={styles.centered}>
                <Text style={{ color: '#aaa' }}>Event not found</Text>
            </View>
        );
    }

    const sportKey = cap(event.sport);
    const color    = SPORT_COLORS[sportKey] || '#16a34a';
    const icon     = SPORT_ICONS[sportKey]  || 'trophy-outline';
    const isFull   = event.participant_count >= event.max_players;
    const fillPct  = Math.min((event.participant_count / event.max_players) * 100, 100);
    const eventPassed = new Date() > new Date(`${event.start_date}T${event.start_time}`);
    const canRate  = event.joined && event.organizer_id !== null && eventPassed;

    return (
        <View style={styles.container}>

            {/* ── HEADER ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{event.title}</Text>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                    <Ionicons name="share-outline" size={20} color="#1a1a2e" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

                {/* ── BANNER ── */}
                <LinearGradient colors={[color + 'cc', color + '66']} style={styles.banner}>
                    <View style={styles.bannerIcon}>
                        <Ionicons name={icon} size={48} color="#fff" />
                    </View>
                    <View style={[styles.statusBadge, event.status !== 'active' && styles.statusBadgeInactive]}>
                        <Text style={styles.statusBadgeText}>{cap(event.status)}</Text>
                    </View>
                </LinearGradient>

                <View style={styles.body}>

                    {/* ── TITLE ROW ── */}
                    <View style={styles.titleRow}>
                        <View style={[styles.sportTag, { backgroundColor: color + '18' }]}>
                            <Ionicons name={icon} size={13} color={color} />
                            <Text style={[styles.sportTagText, { color }]}>{sportKey}</Text>
                        </View>
                        <Text style={[styles.costBadge, event.cost > 0 && styles.costBadgePaid]}>
                            {event.cost === 0 || event.cost === null ? 'Free' : `$${event.cost}`}
                        </Text>
                    </View>

                    <Text style={styles.title}>{event.title}</Text>

                    {/* ── DATE / TIME / LOCATION ── */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: color + '18' }]}>
                                <Ionicons name="calendar-outline" size={18} color={color} />
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>Date</Text>
                                <Text style={styles.infoValue}>{formatDate(event.start_date)}</Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: color + '18' }]}>
                                <Ionicons name="time-outline" size={18} color={color} />
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>Time</Text>
                                <Text style={styles.infoValue}>
                                    {formatTime(event.start_time)}
                                    {event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: color + '18' }]}>
                                <Ionicons name="location-outline" size={18} color={color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.infoLabel}>Location</Text>
                                <Text style={styles.infoValue}>{event.location}</Text>
                            </View>
                        </View>
                    </View>

                    {/* ── PLAYERS ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Players</Text>
                        <View style={styles.playersCard}>
                            <View style={styles.playersHeader}>
                                <Text style={styles.playersCount}>
                                    <Text style={{ color, fontSize: 22 }}>{event.participant_count}</Text>
                                    <Text style={styles.playersMax}>/{event.max_players} joined</Text>
                                </Text>
                                {isFull
                                    ? <View style={styles.fullBadge}><Text style={styles.fullBadgeText}>FULL</Text></View>
                                    : <Text style={styles.spotsLeft}>{event.max_players - event.participant_count} spots left</Text>
                                }
                            </View>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${fillPct}%`, backgroundColor: color }]} />
                            </View>
                            <View style={styles.levelRow}>
                                <Ionicons name="bar-chart-outline" size={14} color="#999" />
                                <Text style={styles.levelText}>{cap(event.experience_level)} level</Text>
                            </View>
                        </View>
                    </View>

                    {/* ── DESCRIPTION ── */}
                    {event.description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>About this event</Text>
                            <View style={styles.descCard}>
                                <Text style={styles.descText}>{event.description}</Text>
                            </View>
                        </View>
                    )}

                    {/* ── ORGANIZER ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Hosted by</Text>
                        <View style={styles.organizerCard}>
                            <OrganizerAvatar
                                photo={event.organizer_photo}
                                avatarConfig={event.organizer_avatar}
                                name={event.organizer_name}
                                size={52}
                            />
                            <View style={styles.organizerInfo}>
                                <Text style={styles.organizerName}>{event.organizer_name || 'Unknown'}</Text>
                                <View style={styles.ratingRow}>
                                    {event.host_rating ? (
                                        <>
                                            {[1,2,3,4,5].map(star => (
                                                <Ionicons
                                                    key={star}
                                                    name={star <= Math.round(event.host_rating) ? 'star' : 'star-outline'}
                                                    size={13}
                                                    color="#f59e0b"
                                                />
                                            ))}
                                            <Text style={styles.ratingText}>
                                                {Number(event.host_rating).toFixed(1)} ({event.total_ratings})
                                            </Text>
                                        </>
                                    ) : (
                                        <Text style={styles.noRatingText}>No ratings yet</Text>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity style={styles.messageBtn}>
                                <Ionicons name="chatbubble-outline" size={18} color={color} />
                            </TouchableOpacity>
                        </View>

                        {canRate && (
                            <TouchableOpacity style={styles.rateBtn} onPress={() => setRateVisible(true)}>
                                <Ionicons name="star-outline" size={16} color="#f59e0b" />
                                <Text style={styles.rateBtnText}>Rate this host</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* ── MAP PLACEHOLDER ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Location</Text>
                        <View style={styles.mapPlaceholder}>
                            <Ionicons name="map-outline" size={36} color="#ccc" />
                            <Text style={styles.mapPlaceholderText}>{event.location}</Text>
                            <Text style={styles.mapPlaceholderSub}>Map coming soon</Text>
                        </View>
                    </View>

                </View>
            </ScrollView>

            {/* ── BOTTOM BAR ── */}
            <View style={styles.bottomBar}>
                {!isFull || event.joined ? (
                    <TouchableOpacity
                        style={[styles.joinBtn, event.joined && styles.leaveBtn, actionLoading && { opacity: 0.7 }]}
                        onPress={handleJoinLeave}
                        disabled={actionLoading}
                    >
                        {actionLoading
                            ? <ActivityIndicator color="#fff" />
                            : <>
                                <Ionicons name={event.joined ? 'exit-outline' : 'enter-outline'} size={20} color="#fff" />
                                <Text style={styles.joinBtnText}>{event.joined ? 'Leave Event' : 'Join Event'}</Text>
                            </>
                        }
                    </TouchableOpacity>
                ) : (
                    <View style={styles.fullBtn}>
                        <Text style={styles.fullBtnText}>Event Full</Text>
                    </View>
                )}
            </View>

            {/* ── RATE MODAL ── */}
            <Modal visible={rateVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.rateSheet}>
                        <View style={styles.rateHeader}>
                            <Text style={styles.rateTitle}>Rate the host</Text>
                            <TouchableOpacity onPress={() => setRateVisible(false)}>
                                <Ionicons name="close" size={24} color="#1a1a2e" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.rateSub}>How was {event.organizer_name}?</Text>
                        <View style={styles.starsRow}>
                            {[1,2,3,4,5].map(star => (
                                <TouchableOpacity key={star} onPress={() => setSelectedRating(star)}>
                                    <Ionicons
                                        name={star <= selectedRating ? 'star' : 'star-outline'}
                                        size={40}
                                        color="#f59e0b"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TextInput
                            style={styles.rateInput}
                            placeholder="Leave a comment (optional)..."
                            placeholderTextColor="#bbb"
                            value={rateComment}
                            onChangeText={setRateComment}
                            multiline
                            numberOfLines={3}
                        />
                        <TouchableOpacity
                            style={[styles.rateSubmitBtn, selectedRating === 0 && { opacity: 0.4 }]}
                            onPress={submitRating}
                            disabled={selectedRating === 0 || rateLoading}
                        >
                            {rateLoading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.rateSubmitText}>Submit Rating</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container:           { flex: 1, backgroundColor: '#f8f9fb' },
    centered:            { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header:              { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    backBtn:             { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8f9fb', justifyContent: 'center', alignItems: 'center' },
    headerTitle:         { flex: 1, fontSize: 16, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginHorizontal: 8 },
    shareBtn:            { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8f9fb', justifyContent: 'center', alignItems: 'center' },
    banner:              { height: 160, justifyContent: 'center', alignItems: 'center' },
    bannerIcon:          { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    statusBadge:         { position: 'absolute', top: 16, right: 16, backgroundColor: '#16a34a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    statusBadgeInactive: { backgroundColor: '#999' },
    statusBadgeText:     { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    body:                { padding: 20 },
    titleRow:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    sportTag:            { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, gap: 5 },
    sportTagText:        { fontSize: 12, fontWeight: '700' },
    costBadge:           { fontSize: 14, fontWeight: '800', color: '#16a34a' },
    costBadgePaid:       { color: '#e94560' },
    title:               { fontSize: 24, fontWeight: '900', color: '#1a1a2e', marginBottom: 20, lineHeight: 30 },
    infoCard:            { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    infoRow:             { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 },
    infoIcon:            { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    infoLabel:           { fontSize: 11, color: '#bbb', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    infoValue:           { fontSize: 14, color: '#1a1a2e', fontWeight: '600', marginTop: 1 },
    infoDivider:         { height: 1, backgroundColor: '#f5f5f5', marginVertical: 8 },
    section:             { marginTop: 20 },
    sectionTitle:        { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    playersCard:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    playersHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    playersCount:        { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
    playersMax:          { fontSize: 16, color: '#999' },
    spotsLeft:           { fontSize: 13, color: '#16a34a', fontWeight: '600' },
    fullBadge:           { backgroundColor: '#fee2e2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    fullBadgeText:       { fontSize: 11, fontWeight: '800', color: '#e94560' },
    progressBar:         { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, marginBottom: 10 },
    progressFill:        { height: 6, borderRadius: 3 },
    levelRow:            { flexDirection: 'row', alignItems: 'center', gap: 6 },
    levelText:           { fontSize: 13, color: '#999' },
    descCard:            { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    descText:            { fontSize: 14, color: '#555', lineHeight: 22 },
    organizerCard:       { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    organizerInfo:       { flex: 1 },
    organizerName:       { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
    messageBtn:          { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
    ratingRow:           { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
    ratingText:          { fontSize: 12, color: '#999', marginLeft: 4, fontWeight: '600' },
    noRatingText:        { fontSize: 12, color: '#bbb' },
    rateBtn:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, backgroundColor: '#fffbeb', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#fde68a' },
    rateBtnText:         { fontSize: 14, fontWeight: '700', color: '#f59e0b' },
    mapPlaceholder:      { backgroundColor: '#fff', borderRadius: 16, height: 160, justifyContent: 'center', alignItems: 'center', gap: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    mapPlaceholderText:  { fontSize: 14, fontWeight: '600', color: '#aaa' },
    mapPlaceholderSub:   { fontSize: 12, color: '#ddd' },
    bottomBar:           { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    joinBtn:             { backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    joinBtnText:         { color: '#fff', fontWeight: '800', fontSize: 16 },
    leaveBtn:            { backgroundColor: '#dc360d' },
    fullBtn:             { backgroundColor: '#f8f9fb', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    fullBtnText:         { color: '#ccc', fontWeight: '700', fontSize: 16 },
    modalOverlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    rateSheet:           { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    rateHeader:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    rateTitle:           { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
    rateSub:             { fontSize: 14, color: '#999', marginBottom: 20 },
    starsRow:            { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
    rateInput:           { backgroundColor: '#f8f9fb', borderRadius: 12, padding: 14, fontSize: 14, color: '#1a1a2e', minHeight: 80, textAlignVertical: 'top', marginBottom: 16 },
    rateSubmitBtn:       { backgroundColor: '#f59e0b', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    rateSubmitText:      { color: '#fff', fontWeight: '800', fontSize: 15 },
});