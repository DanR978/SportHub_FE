import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Share, ActivityIndicator, Image, Modal, TextInput,
    KeyboardAvoidingView, Platform, Alert, Linking, RefreshControl,
} from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { getToken } from '../services/auth';
import { API_URL, GOOGLE_MAPS_API_KEY } from '../config';
import ReportModal from './ReportModal';
import { useToast } from './Toast';

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
const LEVELS = ['Beginner','Intermediate','Advanced','All Levels'];
const CLEAN_MAP_STYLE = [
    { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.sports_complex', stylers: [{ visibility: 'on' }] },
    { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
];

const cap = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
const formatDate = (dateStr) => { if (!dateStr) return ''; const d = new Date(dateStr+'T00:00:00'); return d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}); };
const formatTime = (timeStr) => { if (!timeStr) return ''; const [h,m] = timeStr.split(':'); const hour = parseInt(h); return `${hour%12||12}:${m} ${hour>=12?'PM':'AM'}`; };

function OrganizerAvatar({ photo, avatarConfig, name, size = 56 }) {
    const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
    if (photo) return <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size/2 }} />;
    return (
        <LinearGradient colors={['#16a34a','#0f3460']} style={{ width:size, height:size, borderRadius:size/2, justifyContent:'center', alignItems:'center' }}>
            <Text style={{ color:'#fff', fontWeight:'800', fontSize:size*0.3 }}>{initials}</Text>
        </LinearGradient>
    );
}

export default function EventDetailScreen({ route, navigation }) {
    const { eventId } = route.params;
    const toast = useToast();

    const [event, setEvent]               = useState(null);
    const [loading, setLoading]           = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rateVisible, setRateVisible]   = useState(false);
    const [selectedRating, setSelectedRating] = useState(0);
    const [rateComment, setRateComment]   = useState('');
    const [rateLoading, setRateLoading]   = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Edit modal state
    const [editVisible, setEditVisible]   = useState(false);
    const [editData, setEditData]         = useState({});
    const [editLoading, setEditLoading]   = useState(false);

    // Participants + Report
    const [participants, setParticipants] = useState([]);
    const [reportVisible, setReportVisible] = useState(false);

    // Edit location state
    const [editSuggestions, setEditSuggestions] = useState([]);
    const [showEditSuggestions, setShowEditSuggestions] = useState(false);
    const [editPinCoords, setEditPinCoords] = useState(null);
    const [editMapVisible, setEditMapVisible] = useState(false);
    const [editTempPin, setEditTempPin] = useState(null);
    const [editUserLocation, setEditUserLocation] = useState(null);
    const editDebounceRef = useRef(null);

    useEffect(() => { fetchEvent(); fetchCurrentUser(); fetchParticipants(); }, []);

    const fetchCurrentUser = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const u = await res.json(); setCurrentUserId(u.user_id); }
        } catch {}
    };

    const fetchEvent = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/sports-events/${eventId}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setEvent(await res.json());
            else toast.error('Could not load event details');
        } catch (e) { toast.error('Check your internet and try again.', 'Connection Error'); }
        finally { setLoading(false); setRefreshing(false); }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchEvent();
        fetchParticipants();
    };

    const fetchParticipants = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/sports-events/${eventId}/participants`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) { const d = await res.json(); setParticipants(d.participants || []); }
        } catch {}
    };

    const handleJoinLeave = async () => {
        if (!event) return;
        setActionLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/sports-events/${eventId}/${event.joined ? 'leave' : 'join'}`,
                { method: event.joined ? 'DELETE' : 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const wasJoined = event.joined;
                setEvent(prev => ({ ...prev, joined: !prev.joined, participant_count: prev.joined ? Math.max(prev.participant_count-1,0) : prev.participant_count+1 }));
                fetchParticipants();
                toast.success(wasJoined ? 'You left the event' : 'You joined the event!');
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.detail || 'Something went wrong');
            }
        } catch (e) { toast.error('Check your internet and try again.', 'Connection Error'); }
        finally { setActionLoading(false); }
    };

    const handleShare = async () => {
        try { await Share.share({ message: `Join me at ${event.title} on ${formatDate(event.start_date)} at ${event.location}! Find it on Game Radar.` }); }
        catch {}
    };

    const handleDelete = () => {
        Alert.alert('Delete Event', 'Are you sure? This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                try {
                    const token = await getToken();
                    const res = await fetch(`${API_URL}/sports-events/${eventId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                    if (res.ok) navigation.goBack();
                } catch (e) { console.log('Delete error:', e); }
            }},
        ]);
    };

    // ── NAVIGATE TO MAPS ─────────────────────────────────────────
    const openInMaps = () => {
        if (!event.latitude || !event.longitude) return;
        const label = encodeURIComponent(event.location || event.title);
        const url = Platform.select({
            ios:     `maps:0,0?q=${label}@${event.latitude},${event.longitude}`,
            android: `geo:${event.latitude},${event.longitude}?q=${event.latitude},${event.longitude}(${label})`,
        });
        Linking.openURL(url).catch(() => {
            Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`);
        });
    };

    // ── VIEW HOST PROFILE ────────────────────────────────────────
    const viewHostProfile = () => {
        if (event.organizer_id) {
            navigation.navigate('HostProfile', { userId: event.organizer_id });
        }
    };

    // ── RATE HOST ────────────────────────────────────────────────
    const submitRating = async () => {
        if (selectedRating === 0) return;
        setRateLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/sports-events/${eventId}/rate-host`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ rating: selectedRating, comment: rateComment.trim() || null }),
            });
            if (res.ok) {
                const data = await res.json();
                setEvent(prev => ({ ...prev, host_rating: data.new_average, total_ratings: data.total_ratings }));
                setRateVisible(false); setSelectedRating(0); setRateComment('');
                toast.success('Rating submitted — thanks!');
            } else {
                const err = await res.json();
                toast.error(err.detail || 'Could not submit rating');
            }
        } catch (e) { toast.error('Could not submit rating. Try again.'); }
        finally { setRateLoading(false); }
    };

    // ── EDIT EVENT ───────────────────────────────────────────────
    const openEdit = () => {
        setEditData({
            title: event.title,
            description: event.description || '',
            location: event.location,
            max_players: String(event.max_players),
            cost: String(event.cost || 0),
            experience_level: cap(event.experience_level),
        });
        setEditPinCoords(event.latitude && event.longitude ? { latitude: event.latitude, longitude: event.longitude } : null);
        setEditSuggestions([]);
        setShowEditSuggestions(false);
        setEditVisible(true);
    };

    // Edit location autocomplete
    const fetchEditSuggestions = useCallback((text) => {
        if (editDebounceRef.current) clearTimeout(editDebounceRef.current);
        if (!text || text.length < 3) { setEditSuggestions([]); setShowEditSuggestions(false); return; }
        editDebounceRef.current = setTimeout(async () => {
            try {
                let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_MAPS_API_KEY}`;
                if (event.latitude && event.longitude) {
                    url += `&location=${event.latitude},${event.longitude}&radius=32000`;
                }
                const res = await fetch(url);
                const data = await res.json();
                if (data.predictions?.length) {
                    setEditSuggestions(data.predictions.slice(0, 4));
                    setShowEditSuggestions(true);
                } else { setEditSuggestions([]); setShowEditSuggestions(false); }
            } catch { setEditSuggestions([]); setShowEditSuggestions(false); }
        }, 350);
    }, [event]);

    const selectEditSuggestion = async (s) => {
        const name = s.structured_formatting?.main_text || s.description || '';
        setEditData(p => ({ ...p, location: name }));
        setEditSuggestions([]); setShowEditSuggestions(false);
        if (s.place_id) {
            try {
                const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${s.place_id}&fields=geometry,formatted_address&key=${GOOGLE_MAPS_API_KEY}`);
                const data = await res.json();
                if (data.result?.geometry?.location) {
                    const { lat, lng } = data.result.geometry.location;
                    setEditPinCoords({ latitude: lat, longitude: lng });
                    if (name.length < 8 && data.result.formatted_address) {
                        setEditData(p => ({ ...p, location: data.result.formatted_address }));
                    }
                }
            } catch {}
        }
    };

    const handleEditLocationChange = (text) => {
        setEditData(p => ({ ...p, location: text }));
        fetchEditSuggestions(text);
    };

    // Edit map pin-drop
    const openEditMap = async () => {
        // Get user location for centering
        if (!editUserLocation) {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                    setEditUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                }
            } catch {}
        }
        setEditTempPin(editPinCoords);
        setEditMapVisible(true);
    };

    const confirmEditPin = async () => {
        if (editTempPin) {
            setEditPinCoords(editTempPin);
            try {
                const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${editTempPin.latitude},${editTempPin.longitude}&key=${GOOGLE_MAPS_API_KEY}`);
                const data = await res.json();
                if (data.results?.[0]) {
                    setEditData(p => ({ ...p, location: data.results[0].formatted_address }));
                }
            } catch {}
        }
        setEditMapVisible(false);
    };

    const saveEdit = async () => {
        setEditLoading(true);
        try {
            const token = await getToken();
            const body = {};
            if (editData.title !== event.title) body.title = editData.title.trim();
            if (editData.description !== (event.description || '')) body.description = editData.description.trim() || null;
            if (editData.location !== event.location) body.location = editData.location.trim();
            if (editData.max_players !== String(event.max_players)) body.max_players = parseInt(editData.max_players);
            if (editData.cost !== String(event.cost || 0)) body.cost = parseFloat(editData.cost) || 0;
            if (editData.experience_level.toLowerCase() !== event.experience_level) body.experience_level = editData.experience_level.toLowerCase();
            // Send updated coordinates if location changed
            if (editPinCoords && (editPinCoords.latitude !== event.latitude || editPinCoords.longitude !== event.longitude)) {
                body.latitude = editPinCoords.latitude;
                body.longitude = editPinCoords.longitude;
            }

            if (Object.keys(body).length === 0) { setEditVisible(false); return; }

            const res = await fetch(`${API_URL}/sports-events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                const updated = await res.json();
                setEvent(updated);
                setEditVisible(false);
                toast.success('Event updated');
            } else {
                const err = await res.json();
                toast.error(err.detail || 'Could not update event');
            }
        } catch (e) { toast.error('Network error. Try again.'); }
        finally { setEditLoading(false); }
    };

    // ── LOADING ──────────────────────────────────────────────────
    if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#16a34a" /></View>;
    if (!event) return <View style={styles.centered}><Text style={{ color:'#aaa' }}>Event not found</Text></View>;

    const sportKey = cap(event.sport);
    const color    = SPORT_COLORS[sportKey] || '#16a34a';
    const icon     = SPORT_ICONS[sportKey]  || 'trophy-outline';
    const isFull   = event.participant_count >= event.max_players;
    const fillPct  = Math.min((event.participant_count / event.max_players) * 100, 100);
    const eventPassed = new Date() > new Date(`${event.start_date}T${event.start_time}`);
    const isOrganizer = currentUserId && event.organizer_id && String(currentUserId) === String(event.organizer_id);
    const canRate  = event.joined && !isOrganizer && eventPassed;
    const hasCoords = event.latitude != null && event.longitude != null;

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{event.title}</Text>
                <View style={{ flexDirection:'row', gap:8 }}>
                    {isOrganizer && (
                        <TouchableOpacity style={styles.shareBtn} onPress={openEdit}>
                            <Ionicons name="create-outline" size={20} color="#3b82f6" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                        <Ionicons name="share-outline" size={20} color="#1a1a2e" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
            >
                {/* BANNER */}
                <LinearGradient colors={[color+'cc', color+'66']} style={styles.banner}>
                    <View style={styles.bannerIcon}><Ionicons name={icon} size={48} color="#fff" /></View>
                    <View style={[styles.statusBadge, event.status !== 'active' && styles.statusBadgeInactive]}>
                        <Text style={styles.statusBadgeText}>{cap(event.status)}</Text>
                    </View>
                </LinearGradient>

                <View style={styles.body}>
                    {/* TITLE ROW */}
                    <View style={styles.titleRow}>
                        <View style={[styles.sportTag, { backgroundColor: color+'18' }]}>
                            <Ionicons name={icon} size={13} color={color} />
                            <Text style={[styles.sportTagText, { color }]}>{sportKey}</Text>
                        </View>
                        <Text style={[styles.costBadge, event.cost > 0 && styles.costBadgePaid]}>
                            {event.cost === 0 || event.cost === null ? 'Free' : `$${event.cost}`}
                        </Text>
                    </View>
                    <Text style={styles.title}>{event.title}</Text>

                    {/* INFO CARD */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: color+'18' }]}><Ionicons name="calendar-outline" size={18} color={color} /></View>
                            <View><Text style={styles.infoLabel}>Date</Text><Text style={styles.infoValue}>{formatDate(event.start_date)}</Text></View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: color+'18' }]}><Ionicons name="time-outline" size={18} color={color} /></View>
                            <View><Text style={styles.infoLabel}>Time</Text><Text style={styles.infoValue}>{formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}</Text></View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: color+'18' }]}><Ionicons name="location-outline" size={18} color={color} /></View>
                            <View style={{ flex:1 }}><Text style={styles.infoLabel}>Location</Text><Text style={styles.infoValue}>{event.location}</Text></View>
                        </View>
                    </View>

                    {/* MINI MAP */}
                    {hasCoords && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Location</Text>
                            <View style={styles.miniMapContainer}>
                                {isFull && !event.joined && !isOrganizer ? (
                                    /* Full event — hide exact location */
                                    <View style={styles.fullMapOverlay}>
                                        <View style={styles.fullMapIconCircle}>
                                            <Ionicons name="people" size={28} color="#e94560" />
                                        </View>
                                        <Text style={styles.fullMapTitle}>This event is full</Text>
                                        <Text style={styles.fullMapSub}>The exact location is hidden because all spots have been taken. Check back later if a spot opens up.</Text>
                                    </View>
                                ) : (
                                    /* Normal — show map + directions */
                                    <>
                                        <MapView key={`${event.latitude}-${event.longitude}`} style={styles.miniMap} scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false}
                                            initialRegion={{ latitude: event.latitude, longitude: event.longitude, latitudeDelta: 0.006, longitudeDelta: 0.006 }}
                                            customMapStyle={CLEAN_MAP_STYLE}>
                                            <Marker coordinate={{ latitude: event.latitude, longitude: event.longitude }}>
                                                <View style={[styles.mapPin, { backgroundColor: color }]}><Ionicons name={icon} size={16} color="#fff" /></View>
                                            </Marker>
                                        </MapView>
                                        <View style={styles.miniMapLabel}>
                                            <Ionicons name="location" size={14} color={color} />
                                            <Text style={styles.miniMapText} numberOfLines={1}>{event.location}</Text>
                                        </View>
                                        <TouchableOpacity style={styles.navigateBtn} onPress={openInMaps} activeOpacity={0.7}>
                                            <Ionicons name="navigate-outline" size={16} color="#fff" />
                                            <Text style={styles.navigateBtnText}>Get Directions</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>
                    )}

                    {/* PLAYERS */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Players</Text>
                        <View style={styles.playersCard}>
                            <View style={styles.playersHeader}>
                                <Text style={styles.playersCount}><Text style={{ color, fontSize:22 }}>{event.participant_count}</Text><Text style={styles.playersMax}>/{event.max_players} joined</Text></Text>
                                {isFull ? <View style={styles.fullBadge}><Text style={styles.fullBadgeText}>FULL</Text></View> : <Text style={styles.spotsLeft}>{event.max_players - event.participant_count} spots left</Text>}
                            </View>
                            <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${fillPct}%`, backgroundColor: color }]} /></View>
                            <View style={styles.levelRow}><Ionicons name="bar-chart-outline" size={14} color="#999" /><Text style={styles.levelText}>{cap(event.experience_level)} level</Text></View>

                            {/* Participant list */}
                            {participants.length > 0 && (
                                <View style={styles.participantList}>
                                    {participants.map(p => (
                                        <TouchableOpacity key={p.user_id} style={styles.participantRow}
                                            onPress={() => navigation.navigate('HostProfile', { userId: p.user_id })}
                                            activeOpacity={0.7}>
                                            <OrganizerAvatar photo={p.avatar_photo} avatarConfig={p.avatar_config} name={`${p.first_name} ${p.last_name}`} size={32} />
                                            <Text style={styles.participantName}>{p.first_name} {p.last_name}</Text>
                                            {p.is_organizer && (
                                                <View style={styles.hostBadge}><Text style={styles.hostBadgeText}>HOST</Text></View>
                                            )}
                                            <Ionicons name="chevron-forward" size={14} color="#ddd" />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* DESCRIPTION */}
                    {event.description && (
                        <View style={styles.section}><Text style={styles.sectionTitle}>About this event</Text>
                            <View style={styles.descCard}><Text style={styles.descText}>{event.description}</Text></View>
                        </View>
                    )}

                    {/* ORGANIZER */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Hosted by</Text>
                        <TouchableOpacity style={styles.organizerCard} onPress={viewHostProfile} activeOpacity={0.7}>
                            <OrganizerAvatar photo={event.organizer_photo} avatarConfig={event.organizer_avatar} name={event.organizer_name} size={52} />
                            <View style={styles.organizerInfo}>
                                <Text style={styles.organizerName}>{event.organizer_name || 'Unknown'}</Text>
                                <View style={styles.ratingRow}>
                                    {event.host_rating ? (
                                        <>{[1,2,3,4,5].map(s => <Ionicons key={s} name={s<=Math.round(event.host_rating)?'star':'star-outline'} size={13} color="#f59e0b" />)}<Text style={styles.ratingText}>{Number(event.host_rating).toFixed(1)} ({event.total_ratings})</Text></>
                                    ) : <Text style={styles.noRatingText}>No ratings yet</Text>}
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#ccc" />
                        </TouchableOpacity>
                        {canRate && (
                            <TouchableOpacity style={styles.rateBtn} onPress={() => setRateVisible(true)}>
                                <Ionicons name="star-outline" size={16} color="#f59e0b" /><Text style={styles.rateBtnText}>Rate this host</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* DELETE for organizer */}
                    {isOrganizer && (
                        <TouchableOpacity style={styles.deleteBtnRow} onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={16} color="#e94560" />
                            <Text style={styles.deleteBtnText}>Delete this event</Text>
                        </TouchableOpacity>
                    )}

                    {/* REPORT for non-organizers */}
                    {!isOrganizer && (
                        <TouchableOpacity style={styles.reportBtnRow} onPress={() => setReportVisible(true)}>
                            <Ionicons name="flag-outline" size={14} color="#999" />
                            <Text style={styles.reportBtnText}>Report this event</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* BOTTOM BAR */}
            <View style={styles.bottomBar}>
                {isOrganizer ? (
                    <View style={styles.hostingBadgeBar}>
                        <Ionicons name="megaphone-outline" size={18} color="#3b82f6" />
                        <Text style={styles.hostingBadgeText}>You're hosting this event</Text>
                    </View>
                ) : !isFull || event.joined ? (
                    <TouchableOpacity style={[styles.joinBtn, event.joined && styles.leaveBtn, actionLoading && { opacity:0.7 }]} onPress={handleJoinLeave} disabled={actionLoading}>
                        {actionLoading ? <ActivityIndicator color="#fff" /> : <><Ionicons name={event.joined?'exit-outline':'enter-outline'} size={20} color="#fff" /><Text style={styles.joinBtnText}>{event.joined?'Leave Event':'Join Event'}</Text></>}
                    </TouchableOpacity>
                ) : (
                    <View style={styles.fullBtnBar}><Text style={styles.fullBtnBarText}>Event Full</Text></View>
                )}
            </View>

            {/* RATE MODAL — pageSheet per Apple HIG */}
            <Modal visible={rateVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setRateVisible(false)}>
                <View style={styles.rateContainer}>
                    <View style={styles.rateModalHeader}>
                        <TouchableOpacity onPress={() => setRateVisible(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                            <Text style={styles.rateCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.rateModalTitle}>Rate Host</Text>
                        <TouchableOpacity
                            onPress={submitRating}
                            disabled={selectedRating === 0 || rateLoading}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            {rateLoading
                                ? <ActivityIndicator size="small" color="#f59e0b" />
                                : <Text style={[styles.rateSubmitAction, selectedRating === 0 && { color: '#ccc' }]}>Submit</Text>
                            }
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        style={styles.rateBody}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    >
                        <Text style={styles.rateSub}>How was your experience with {event.organizer_name}?</Text>
                        <View style={styles.starsRow}>
                            {[1,2,3,4,5].map(star => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setSelectedRating(star)}
                                    style={styles.starTouch}
                                >
                                    <Ionicons name={star <= selectedRating ? 'star' : 'star-outline'} size={40} color="#f59e0b" />
                                </TouchableOpacity>
                            ))}
                        </View>
                        {selectedRating > 0 && (
                            <Text style={styles.rateLabel}>
                                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][selectedRating]}
                            </Text>
                        )}
                        <Text style={styles.rateInputLabel}>Comment (optional)</Text>
                        <TextInput
                            style={styles.rateInput}
                            placeholder="Share your experience..."
                            placeholderTextColor="#bbb"
                            value={rateComment}
                            onChangeText={setRateComment}
                            multiline
                            numberOfLines={4}
                            maxLength={300}
                            textAlignVertical="top"
                        />
                        <Text style={styles.rateCharCount}>{rateComment.length}/300</Text>
                    </ScrollView>
                </View>
            </Modal>

            {/* EDIT MODAL */}
            <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet">
                <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{ flex:1 }}>
                    <View style={styles.editContainer}>
                        <View style={styles.editHeader}>
                            <TouchableOpacity onPress={() => setEditVisible(false)}><Text style={styles.editCancel}>Cancel</Text></TouchableOpacity>
                            <Text style={styles.editTitle}>Edit Event</Text>
                            <TouchableOpacity onPress={saveEdit} disabled={editLoading}>
                                {editLoading ? <ActivityIndicator size="small" color="#16a34a" /> : <Text style={styles.editSave}>Save</Text>}
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.editBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                            <Text style={styles.editLabel}>Title</Text>
                            <TextInput style={styles.editInput} value={editData.title} onChangeText={t => setEditData(p => ({...p, title: t}))} maxLength={60} />

                            <Text style={styles.editLabel}>Location</Text>
                            <View style={styles.editLocationBox}>
                                <Ionicons name="location-outline" size={18} color="#999" style={{ marginRight: 8 }} />
                                <TextInput
                                    style={styles.editLocationInput}
                                    placeholder="Search for a place..."
                                    placeholderTextColor="#bbb"
                                    value={editData.location}
                                    onChangeText={handleEditLocationChange}
                                    onBlur={() => setTimeout(() => setShowEditSuggestions(false), 200)}
                                />
                                <TouchableOpacity style={styles.editPinBtn} onPress={openEditMap}>
                                    <Ionicons name="map-outline" size={18} color="#16a34a" />
                                </TouchableOpacity>
                            </View>
                            {showEditSuggestions && editSuggestions.length > 0 && (
                                <View style={styles.editSuggestionsBox}>
                                    {editSuggestions.map((s, i) => (
                                        <TouchableOpacity key={s.place_id || i}
                                            style={[styles.editSuggestionRow, i < editSuggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' }]}
                                            onPress={() => selectEditSuggestion(s)}>
                                            <Ionicons name="location" size={14} color="#16a34a" style={{ marginRight: 8 }} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a2e' }} numberOfLines={1}>{s.structured_formatting?.main_text}</Text>
                                                <Text style={{ fontSize: 12, color: '#999', marginTop: 1 }} numberOfLines={1}>{s.structured_formatting?.secondary_text}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                            {editPinCoords && (
                                <View style={styles.editPinIndicator}>
                                    <Ionicons name="pin" size={14} color="#16a34a" />
                                    <Text style={styles.editPinText}>Pin: {editPinCoords.latitude.toFixed(4)}, {editPinCoords.longitude.toFixed(4)}</Text>
                                </View>
                            )}

                            <Text style={styles.editLabel}>Experience Level</Text>
                            <View style={styles.editLevelRow}>
                                {LEVELS.map(l => (
                                    <TouchableOpacity key={l} style={[styles.editLevelChip, editData.experience_level === l && styles.editLevelChipActive]}
                                        onPress={() => setEditData(p => ({...p, experience_level: l}))}>
                                        <Text style={[styles.editLevelText, editData.experience_level === l && styles.editLevelTextActive]}>{l}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={{ flexDirection:'row', gap:12 }}>
                                <View style={{ flex:1 }}>
                                    <Text style={styles.editLabel}>Max Players</Text>
                                    <TextInput style={styles.editInput} value={editData.max_players} onChangeText={t => setEditData(p => ({...p, max_players: t.replace(/\D/g,'')}))} keyboardType="numeric" maxLength={3} />
                                </View>
                                <View style={{ flex:1 }}>
                                    <Text style={styles.editLabel}>Cost ($)</Text>
                                    <TextInput style={styles.editInput} value={editData.cost} onChangeText={t => setEditData(p => ({...p, cost: t}))} keyboardType="decimal-pad" maxLength={6} />
                                </View>
                            </View>

                            <Text style={styles.editLabel}>Description</Text>
                            <TextInput style={[styles.editInput, { minHeight:100, textAlignVertical:'top' }]} value={editData.description} onChangeText={t => setEditData(p => ({...p, description: t}))} multiline maxLength={500} />
                            <Text style={{ fontSize:11, color:'#bbb', textAlign:'right', marginTop:4 }}>{(editData.description||'').length}/500</Text>

                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>

                    {/* PIN-DROP MAP — nested inside edit modal so it opens on top */}
                    <Modal visible={editMapVisible} animationType="slide">
                        <View style={{ flex: 1 }}>
                            <View style={styles.editMapHeader}>
                                <TouchableOpacity onPress={() => setEditMapVisible(false)}>
                                    <Text style={styles.editCancel}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={styles.editTitle}>Drop a Pin</Text>
                                <TouchableOpacity onPress={confirmEditPin}>
                                    <Text style={[styles.editSave, !editTempPin && { color: '#ccc' }]}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                            <MapView
                                style={{ flex: 1 }}
                                initialRegion={{
                                    latitude: editPinCoords?.latitude || editUserLocation?.latitude || event?.latitude || 38.9,
                                    longitude: editPinCoords?.longitude || editUserLocation?.longitude || event?.longitude || -77.0,
                                    latitudeDelta: 0.08,
                                    longitudeDelta: 0.08,
                                }}
                                showsUserLocation
                                showsMyLocationButton
                                customMapStyle={CLEAN_MAP_STYLE}
                                onPress={(e) => setEditTempPin(e.nativeEvent.coordinate)}
                                onLongPress={(e) => setEditTempPin(e.nativeEvent.coordinate)}
                            >
                                {editTempPin && (
                                    <Marker coordinate={editTempPin} draggable
                                        onDragEnd={(e) => setEditTempPin(e.nativeEvent.coordinate)}>
                                        <View style={[styles.mapPin, { backgroundColor: '#16a34a' }]}>
                                            <Ionicons name="location" size={16} color="#fff" />
                                        </View>
                                    </Marker>
                                )}
                            </MapView>
                            <View style={styles.editMapBottom}>
                                {editTempPin ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text style={{ fontSize: 13, color: '#666' }}>{editTempPin.latitude.toFixed(5)}, {editTempPin.longitude.toFixed(5)}</Text>
                                        <TouchableOpacity onPress={() => setEditTempPin(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Ionicons name="trash-outline" size={16} color="#e94560" />
                                            <Text style={{ fontSize: 13, color: '#e94560', fontWeight: '600' }}>Remove</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <Text style={{ fontSize: 13, color: '#bbb', textAlign: 'center' }}>Tap the map to drop a pin</Text>
                                )}
                            </View>
                        </View>
                    </Modal>
                </KeyboardAvoidingView>
            </Modal>

            {/* REPORT MODAL */}
            <ReportModal
                visible={reportVisible}
                onClose={() => setReportVisible(false)}
                targetType="event"
                targetId={eventId}
                targetName={event?.title}
            />
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
    // Mini map
    miniMapContainer:    { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    miniMap:             { height: 180, borderRadius: 16 },
    mapPin:              { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
    miniMapLabel:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10 },
    miniMapText:         { fontSize: 13, color: '#666', fontWeight: '500', flex: 1 },
    // Full event overlay
    fullMapOverlay:      { backgroundColor: '#fef2f2', borderRadius: 16, padding: 28, alignItems: 'center' },
    fullMapIconCircle:   { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    fullMapTitle:        { fontSize: 17, fontWeight: '800', color: '#1a1a2e', marginBottom: 6 },
    fullMapSub:          { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 19 },
    navigateBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#16a34a', paddingVertical: 12, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
    navigateBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
    // Players
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
    // Participant list
    participantList:     { marginTop: 14, borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 10 },
    participantRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
    participantName:     { fontSize: 14, fontWeight: '500', color: '#1a1a2e', flex: 1 },
    hostBadge:           { backgroundColor: '#dbeafe', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginRight: 4 },
    hostBadgeText:       { fontSize: 10, fontWeight: '800', color: '#3b82f6' },
    // Report
    reportBtnRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 14 },
    reportBtnText:       { fontSize: 13, color: '#999' },
    descCard:            { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    descText:            { fontSize: 14, color: '#555', lineHeight: 22 },
    organizerCard:       { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    organizerInfo:       { flex: 1 },
    organizerName:       { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
    ratingRow:           { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
    ratingText:          { fontSize: 12, color: '#999', marginLeft: 4, fontWeight: '600' },
    noRatingText:        { fontSize: 12, color: '#bbb' },
    rateBtn:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, backgroundColor: '#fffbeb', borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: '#fde68a' },
    rateBtnText:         { fontSize: 14, fontWeight: '700', color: '#f59e0b' },
    deleteBtnRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 28, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#fecaca', backgroundColor: '#fef2f2' },
    deleteBtnText:       { fontSize: 14, fontWeight: '700', color: '#e94560' },
    // Bottom bar
    bottomBar:           { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    joinBtn:             { backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    joinBtnText:         { color: '#fff', fontWeight: '800', fontSize: 16 },
    leaveBtn:            { backgroundColor: '#dc360d' },
    fullBtnBar:          { backgroundColor: '#f8f9fb', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    fullBtnBarText:      { color: '#ccc', fontWeight: '700', fontSize: 16 },
    hostingBadgeBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#dbeafe', borderRadius: 14, paddingVertical: 16, borderWidth: 1.5, borderColor: '#93c5fd' },
    hostingBadgeText:    { fontSize: 15, fontWeight: '700', color: '#3b82f6' },
    // Rate modal — pageSheet
    rateContainer:       { flex: 1, backgroundColor: '#f8f9fb' },
    rateModalHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    rateCancel:          { fontSize: 16, color: '#999', fontWeight: '600' },
    rateModalTitle:      { fontSize: 17, fontWeight: '800', color: '#1a1a2e' },
    rateSubmitAction:    { fontSize: 16, color: '#f59e0b', fontWeight: '800' },
    rateBody:            { flex: 1, padding: 20 },
    rateSub:             { fontSize: 15, color: '#666', marginBottom: 24, lineHeight: 22 },
    starsRow:            { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
    starTouch:           { padding: 4 },
    rateLabel:           { fontSize: 14, fontWeight: '600', color: '#f59e0b', textAlign: 'center', marginBottom: 24 },
    rateInputLabel:      { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
    rateInput:           { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 14, color: '#1a1a2e', minHeight: 100, textAlignVertical: 'top' },
    rateCharCount:       { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 4 },
    // Edit modal
    editContainer:       { flex: 1, backgroundColor: '#f8f9fb' },
    editHeader:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    editCancel:          { fontSize: 16, color: '#999', fontWeight: '600' },
    editTitle:           { fontSize: 17, fontWeight: '800', color: '#1a1a2e' },
    editSave:            { fontSize: 16, color: '#16a34a', fontWeight: '800' },
    editBody:            { padding: 20 },
    editLabel:           { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8, marginTop: 16 },
    editInput:           { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#1a1a2e', borderWidth: 1.5, borderColor: '#f0f0f0' },
    editLevelRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    editLevelChip:       { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#f0f0f0' },
    editLevelChipActive: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
    editLevelText:       { fontSize: 13, fontWeight: '600', color: '#666' },
    editLevelTextActive: { color: '#fff' },
    // Edit location
    editLocationBox:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingLeft: 14, borderWidth: 1.5, borderColor: '#f0f0f0' },
    editLocationInput:   { flex: 1, fontSize: 15, color: '#1a1a2e', paddingVertical: 13 },
    editPinBtn:          { paddingHorizontal: 14, paddingVertical: 13 },
    editSuggestionsBox:  { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#f0f0f0', marginTop: 4, overflow: 'hidden' },
    editSuggestionRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
    editPinIndicator:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    editPinText:         { fontSize: 12, color: '#16a34a', fontWeight: '500' },
    editMapHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    editMapBottom:       { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
});