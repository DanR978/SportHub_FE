import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, TouchableWithoutFeedback,
    Image, ActivityIndicator, RefreshControl, Alert, Modal, Animated, Dimensions, Linking,
} from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getToken } from '../services/auth';
import { ProfileSkeleton } from './Skeleton';
import { AvatarPreview } from './SetupAvatar';

import { API_URL } from '../config';
const { width: SW } = Dimensions.get('window');

const SPORT_ICONS = {
    Soccer:'football-outline', Basketball:'basketball-outline', Tennis:'tennisball-outline',
    Volleyball:'baseball-outline', Pickleball:'baseball-outline', Baseball:'baseball-outline',
    Football:'american-football-outline', Handball:'hand-left-outline',
    Softball:'baseball-outline', Dodgeball:'radio-button-on-outline', Kickball:'football-outline',
};
const SPORT_COLORS = {
    Soccer:'#4CAF50', Basketball:'#FF9800', Tennis:'#2196F3', Volleyball:'#9C27B0',
    Pickleball:'#e94560', Baseball:'#795548', Football:'#607D8B', Handball:'#E91E63',
    Softball:'#FFC107', Dodgeball:'#009688', Kickball:'#FF9800',
};
const COUNTRY_FLAGS = {
    'United States':'🇺🇸','Mexico':'🇲🇽','Guatemala':'🇬🇹','Canada':'🇨🇦','Brazil':'🇧🇷',
    'Argentina':'🇦🇷','Colombia':'🇨🇴','Spain':'🇪🇸','United Kingdom':'🇬🇧','France':'🇫🇷',
    'Germany':'🇩🇪','Italy':'🇮🇹','Honduras':'🇭🇳','El Salvador':'🇸🇻','Nicaragua':'🇳🇮',
    'Costa Rica':'🇨🇷','Venezuela':'🇻🇪','Peru':'🇵🇪','Chile':'🇨🇱','Ecuador':'🇪🇨',
    'Japan':'🇯🇵','South Korea':'🇰🇷','China':'🇨🇳','India':'🇮🇳','Nigeria':'🇳🇬',
    'Ghana':'🇬🇭','South Africa':'🇿🇦','Kenya':'🇰🇪','Dominican Republic':'🇩🇴',
    'Puerto Rico':'🇵🇷','Jamaica':'🇯🇲','Australia':'🇦🇺','Portugal':'🇵🇹',
    'Netherlands':'🇳🇱','Turkey':'🇹🇷',
};

const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const getAge = dob => !dob ? null : Math.floor((new Date() - new Date(dob)) / (1000*60*60*24*365.25));
const formatDate = d => !d ? '' : new Date(d+'T00:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
const formatTime = t => {
    if (!t) return '';
    const [h,m] = t.split(':'); const hr = parseInt(h);
    return `${hr%12||12}:${m} ${hr>=12?'PM':'AM'}`;
};

// ── COIN FLIP — fast then slow, like a real coin ──────────────────────────────
function CoinFlipAvatar({ photo, avatarConfig, initials, size = 110 }) {
    const anim      = useRef(new Animated.Value(0)).current;
    const [front, setFront] = useState(true); // true = photo, false = avatar
    const hasBoth   = !!photo && !!avatarConfig;

    useEffect(() => {
        if (!hasBoth) return;
        const run = () => {
            anim.setValue(0);
            // Coin flip: ease in fast, then decelerate (like a coin spinning down)
            Animated.sequence([
                Animated.timing(anim, { toValue: 0.5, duration: 180, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 1,   duration: 520, useNativeDriver: true }),
            ]).start(() => setFront(f => !f));
        };
        const timer = setInterval(run, 8000); // flip every 8 seconds
        return () => clearInterval(timer);
    }, [hasBoth]);

    const scaleX = anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 0, 1],
    });

    const renderFace = () => {
        const config = avatarConfig ? (typeof avatarConfig === 'string' ? JSON.parse(avatarConfig) : avatarConfig) : null;
        if (hasBoth) {
            if (front && photo) return <Image source={{ uri: photo }} style={{ width: size, height: size }} />;
            if (!front && config) return (
                <View style={{ backgroundColor: '#f0fdf4', width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                    <AvatarPreview config={config} size={size * 0.82} />
                </View>
            );
        }
        if (photo) return <Image source={{ uri: photo }} style={{ width: size, height: size }} />;
        if (config) return (
            <View style={{ backgroundColor: '#f0fdf4', width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                <AvatarPreview config={config} size={size * 0.82} />
            </View>
        );
        return (
            <LinearGradient colors={['#e94560','#0f3460']} style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: size*0.3, fontWeight: '800', color: '#fff' }}>{initials}</Text>
            </LinearGradient>
        );
    };

    return (
        <Animated.View style={{
            width: size, height: size, borderRadius: size/2,
            overflow: 'hidden',
            transform: hasBoth ? [{ scaleX }] : [],
        }}>
            {renderFace()}
        </Animated.View>
    );
}

// ── BOTTOM SHEET (Facebook style) ────────────────────────────────────────────
function AvatarSheet({ visible, onClose, hasPhoto, onViewPhoto, onSelectPhoto, onEditAvatar, onRemovePhoto }) {
    const slide = useRef(new Animated.Value(400)).current;
    const fade  = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slide, { toValue: 0, useNativeDriver: true, bounciness: 2 }),
                Animated.timing(fade,  { toValue: 1, duration: 250, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slide, { toValue: 400, duration: 220, useNativeDriver: true }),
                Animated.timing(fade,  { toValue: 0,   duration: 220, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    const items = [
        hasPhoto  && { icon: 'person-circle-outline', label: 'See profile picture',    sub: null, onPress: onViewPhoto },
        { icon: 'image-outline',          label: 'Select profile picture', sub: null, onPress: onSelectPhoto },
        { icon: 'happy-outline',          label: 'Edit avatar',            sub: null, onPress: onEditAvatar },
        hasPhoto  && { icon: 'trash-outline', label: 'Remove photo', sub: null, onPress: onRemovePhoto, color: '#e94560' },
    ].filter(Boolean);

    if (!visible) return null;

    return (
        <Modal visible transparent animationType="none" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.sheetBg, { opacity: fade }]} />
            </TouchableWithoutFeedback>
            <Animated.View style={[styles.sheet, { transform: [{ translateY: slide }] }]}>
                <View style={styles.sheetPill} />
                <Text style={styles.sheetHeading}>Profile Picture</Text>
                {items.map((item, i) => (
                    <TouchableOpacity
                        key={i}
                        style={[styles.sheetRow, i === items.length - 1 && { borderBottomWidth: 0 }]}
                        activeOpacity={item.onPress ? 0.65 : 1}
                        onPress={() => {
                            if (!item.onPress) {
                                Alert.alert('Coming Soon', `${item.label} will be available in a future update.`);
                                return;
                            }
                            onClose();
                            setTimeout(item.onPress, 280);
                        }}
                    >
                        <View style={[styles.sheetIconCircle, item.color && { backgroundColor: item.color + '18' }]}>
                            <Ionicons name={item.icon} size={22} color={item.color || '#1a1a2e'} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.sheetRowLabel, item.color && { color: item.color }]}>{item.label}</Text>
                            {item.sub && <Text style={styles.sheetRowSub}>{item.sub}</Text>}
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#ddd" />
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.sheetCancelBtn} onPress={onClose}>
                    <Text style={styles.sheetCancelText}>Cancel</Text>
                </TouchableOpacity>
            </Animated.View>
        </Modal>
    );
}

// ── PHOTO VIEWER ──────────────────────────────────────────────────────────────
function PhotoViewer({ visible, uri, onClose }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.photoViewerBg}>
                    {uri && <Image source={{ uri }} style={{ width: SW, height: SW }} resizeMode="contain" />}
                    <TouchableOpacity style={styles.photoViewerClose} onPress={onClose}>
                        <Ionicons name="close" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
    const [user, setUser]             = useState(null);
    const [stats, setStats]           = useState({ created: 0, joined: 0 });
    const [upcoming, setUpcoming]     = useState({ organizing: [], joined: [] });
    const [loading, setLoading]       = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [uploading, setUploading]   = useState(false);
    const [sheetOpen, setSheetOpen]   = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [recentActivity, setRecentActivity] = useState([]);
    const [bannerUploading, setBannerUploading] = useState(false);

    const fetchProfile = async () => {
        try {
            const token = await getToken();
            const h = { Authorization: `Bearer ${token}` };
            const [uR, sR, upR, raR] = await Promise.all([
                fetch(`${API_URL}/users/me`, { headers: h }),
                fetch(`${API_URL}/users/me/stats`, { headers: h }),
                fetch(`${API_URL}/users/me/upcoming-events`, { headers: h }),
                fetch(`${API_URL}/users/me/recent-activity`, { headers: h }),
            ]);
            if (uR.ok)  setUser(await uR.json());
            if (sR.ok)  setStats(await sR.json());
            if (upR.ok) setUpcoming(await upR.json());
            if (raR.ok) { const ra = await raR.json(); setRecentActivity(ra.activities || []); }
        } catch (e) { console.log('Profile error:', e); }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { fetchProfile(); }, []);
    useFocusEffect(useCallback(() => { if (!loading) fetchProfile(); }, [loading]));
    const onRefresh = useCallback(() => { setRefreshing(true); fetchProfile(); }, []);

    const pickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow photo access.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true, aspect: [1,1], quality: 0.8, base64: true,
        });
        if (!result.canceled && result.assets?.[0]) {
            setUploading(true);
            try {
                const token = await getToken();
                const res = await fetch(`${API_URL}/users/me`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ avatar_photo: `data:image/jpeg;base64,${result.assets[0].base64}` }),
                });
                if (res.ok) setUser(await res.json());
            } catch (e) { console.log('Upload error:', e); }
            finally { setUploading(false); }
        }
    };

    const pickBanner = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow photo access.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true, aspect: [3, 1], quality: 0.7, base64: true,
        });
        if (!result.canceled && result.assets?.[0]) {
            setBannerUploading(true);
            try {
                const token = await getToken();
                const res = await fetch(`${API_URL}/users/me`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ banner_photo: `data:image/jpeg;base64,${result.assets[0].base64}` }),
                });
                if (res.ok) setUser(await res.json());
            } catch (e) { console.log('Banner upload error:', e); }
            finally { setBannerUploading(false); }
        }
    };

    const removePhoto = async () => {
        setSheetOpen(false);
        Alert.alert('Remove Photo', 'Remove your profile photo?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: async () => {
                try {
                    const token = await getToken();
                    const res = await fetch(`${API_URL}/users/me`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ avatar_photo: null }),
                    });
                    if (res.ok) setUser(await res.json());
                } catch (e) { console.log('Remove photo error:', e); }
            }},
        ]);
    };

    const handleDeleteEvent = (id, title) => {
        Alert.alert('Delete Event', `Delete "${title}"? Cannot be undone.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                setDeletingId(id);
                try {
                    const token = await getToken();
                    const res = await fetch(`${API_URL}/sports-events/${id}`, {
                        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                        setUpcoming(p => ({ ...p, organizing: p.organizing.filter(e => e.event_id !== id) }));
                        setStats(p => ({ ...p, created: Math.max(p.created-1,0) }));
                    }
                } catch (e) { console.log(e); }
                finally { setDeletingId(null); }
            }}
        ]);
    };

    if (loading) return <ProfileSkeleton />;
    if (!user) return (
        <View style={styles.centered}>
            <Ionicons name="person-outline" size={48} color="#ddd" />
            <Text style={{ color: '#aaa', marginTop: 12 }}>Could not load profile</Text>
        </View>
    );

    const initials    = `${user.first_name?.[0]||''}${user.last_name?.[0]||''}`.toUpperCase();
    const sports      = user.sports ? JSON.parse(user.sports) : [];
    const flag        = COUNTRY_FLAGS[user.nationality] || '🌍';
    const age         = getAge(user.date_of_birth);
    const allUpcoming = [...(upcoming.organizing||[]), ...(upcoming.joined||[])].sort((a,b)=>a.start_date.localeCompare(b.start_date));
    const isOrg       = id => (upcoming.organizing||[]).some(e => e.event_id === id);

    const renderCard = (event) => {
        const sk  = cap(event.sport);
        const col = SPORT_COLORS[sk] || '#16a34a';
        const ico = SPORT_ICONS[sk]  || 'trophy-outline';
        const org = isOrg(event.event_id);
        const del = deletingId === event.event_id;
        return (
            <TouchableOpacity key={event.event_id} style={styles.eventCard} activeOpacity={0.85}
                onPress={() => navigation.navigate('EventDetail', { eventId: event.event_id })}>
                <View style={[styles.eventBar, { backgroundColor: col }]} />
                <View style={styles.eventBody}>
                    <View style={styles.eventTop}>
                        <View style={[styles.sportBadge, { backgroundColor: col+'18' }]}>
                            <Ionicons name={ico} size={12} color={col} />
                            <Text style={[styles.sportBadgeText, { color: col }]}>{sk}</Text>
                        </View>
                        {org && <View style={styles.hostBadge}><Ionicons name="star" size={10} color="#f59e0b" /><Text style={styles.hostBadgeText}>Hosting</Text></View>}
                        {!org && <View style={styles.attendBadge}><Ionicons name="person" size={10} color="#3b82f6" /><Text style={styles.attendBadgeText}>Attending</Text></View>}
                    </View>
                    <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                    <View style={styles.eventMeta}><Ionicons name="calendar-outline" size={12} color="#999" /><Text style={styles.eventMetaText}>{formatDate(event.start_date)} · {formatTime(event.start_time)}</Text></View>
                    <View style={[styles.eventMeta, { marginTop: 2 }]}><Ionicons name="people-outline" size={12} color="#999" /><Text style={styles.eventMetaText}>{event.participant_count}/{event.max_players} players</Text></View>
                </View>
                {org && (
                    <TouchableOpacity style={styles.deleteBtn} disabled={del} onPress={() => handleDeleteEvent(event.event_id, event.title)}>
                        {del ? <ActivityIndicator size="small" color="#e94560" /> : <Ionicons name="trash-outline" size={18} color="#e94560" />}
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}>

                {/* BANNER — tappable to upload background */}
                <TouchableOpacity activeOpacity={0.9} onPress={pickBanner}>
                    {user.banner_photo ? (
                        <View style={styles.banner}>
                            <Image source={{ uri: user.banner_photo }} style={styles.bannerImage} />
                            <LinearGradient colors={['transparent','rgba(0,0,0,0.3)']} style={styles.bannerOverlay} />
                            <View style={styles.bannerEditHint}>
                                {bannerUploading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera-outline" size={14} color="#fff" />}
                            </View>
                        </View>
                    ) : (
                        <LinearGradient colors={['#1a1a2e','#16213e','#0f3460']} style={styles.banner}>
                            <View style={styles.bannerEditHint}>
                                {bannerUploading ? <ActivityIndicator size="small" color="#fff" /> : <>
                                    <Ionicons name="image-outline" size={14} color="rgba(255,255,255,0.7)" />
                                    <Text style={styles.bannerEditText}>Add cover photo</Text>
                                </>}
                            </View>
                        </LinearGradient>
                    )}
                </TouchableOpacity>

                {/* AVATAR — circle opens sheet, camera goes straight to picker */}
                <View style={styles.avatarRow}>
                    {/* Main circle — opens sheet */}
                    <TouchableOpacity onPress={() => setSheetOpen(true)} activeOpacity={1}>
                        <View style={styles.avatarRing}>
                            {uploading ? (
                                <View style={styles.avatarInner}><ActivityIndicator color="#16a34a" /></View>
                            ) : (
                                <CoinFlipAvatar
                                    photo={user.avatar_photo}
                                    avatarConfig={user.avatar_config}
                                    initials={initials}
                                    size={102}
                                />
                            )}
                        </View>
                    </TouchableOpacity>
                    {/* Camera badge — goes straight to photo picker */}
                    <TouchableOpacity style={styles.cameraBadge} onPress={pickPhoto} activeOpacity={0.8}>
                        <Ionicons name="camera" size={14} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.nameSection}>
                    <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
                    <View style={styles.locationRow}>
                        {user.nationality && <><Text style={{ fontSize: 14 }}>{flag}</Text><Text style={styles.nationality}> {user.nationality}</Text></>}
                        {age !== null && <Text style={styles.ageDot}>  ·  {age} yrs</Text>}
                    </View>
                    {user.host_rating && (
                        <View style={styles.ratingRow}>
                            {[1,2,3,4,5].map(s => <Ionicons key={s} name={s<=Math.round(user.host_rating)?'star':'star-outline'} size={14} color="#f59e0b" />)}
                            <Text style={styles.ratingText}>{Number(user.host_rating).toFixed(1)} ({user.total_ratings} {user.total_ratings===1?'review':'reviews'})</Text>
                        </View>
                    )}
                    {(user.instagram||user.facebook) && (
                        <View style={styles.socialRow}>
                            {user.instagram && (
                                <TouchableOpacity style={styles.socialPill} activeOpacity={0.7}
                                    onPress={() => {
                                        const handle = user.instagram.replace('@','');
                                        Linking.openURL(`instagram://user?username=${handle}`).catch(() =>
                                            Linking.openURL(`https://instagram.com/${handle}`)
                                        );
                                    }}>
                                    <Ionicons name="logo-instagram" size={14} color="#f50057" />
                                    <Text style={styles.socialPillText}>@{user.instagram}</Text>
                                    <Ionicons name="open-outline" size={11} color="#ccc" />
                                </TouchableOpacity>
                            )}
                            {user.facebook && (
                                <TouchableOpacity style={styles.socialPill} activeOpacity={0.7}
                                    onPress={() => {
                                        Linking.openURL(`fb://profile/${user.facebook}`).catch(() =>
                                            Linking.openURL(`https://facebook.com/${user.facebook}`)
                                        );
                                    }}>
                                    <Ionicons name="logo-facebook" size={14} color="#1877f2" />
                                    <Text style={styles.socialPillText}>{user.facebook}</Text>
                                    <Ionicons name="open-outline" size={11} color="#ccc" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

                {user.bio && <View style={styles.bioSection}><Text style={styles.bio}>{user.bio}</Text></View>}

                {/* SPORTS — prominent position */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sports & Interests</Text>
                    {sports.length > 0 ? (
                        <View style={styles.pillsRow}>
                            {sports.map((sp,i) => (
                                <View key={i} style={[styles.pill, { backgroundColor: (SPORT_COLORS[sp] || '#16a34a') + '12' }]}>
                                    <Ionicons name={SPORT_ICONS[sp]||'tennisball-outline'} size={15} color={SPORT_COLORS[sp] || '#16a34a'} />
                                    <Text style={[styles.pillText, { color: SPORT_COLORS[sp] || '#16a34a' }]}>{sp}</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyCard}>
                            <Ionicons name="football-outline" size={26} color="#ddd" />
                            <Text style={styles.emptyText}>No sports added yet</Text>
                            <Text style={styles.emptySub}>Settings → Edit Profile to add sports</Text>
                        </View>
                    )}
                </View>

                {/* STATS */}
                <View style={styles.statsRow}>
                    {[['Created',stats.created],['Joined',stats.joined],['Upcoming',allUpcoming.length]].map(([label,val],i,arr)=>(
                        <View key={label} style={{ flex:1, flexDirection:'row', alignItems:'center' }}>
                            <View style={styles.statItem}><Text style={styles.statNum}>{val}</Text><Text style={styles.statLabel}>{label}</Text></View>
                            {i < arr.length-1 && <View style={styles.statDiv} />}
                        </View>
                    ))}
                </View>

                {/* UPCOMING EVENTS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Upcoming Events</Text>
                    {allUpcoming.length > 0 ? allUpcoming.map(renderCard) : (
                        <View style={styles.emptyCard}>
                            <Ionicons name="calendar-outline" size={26} color="#ddd" />
                            <Text style={styles.emptyText}>No upcoming events</Text>
                            <Text style={styles.emptySub}>Join or create an event to get started</Text>
                        </View>
                    )}
                </View>


                {/* ── RECENT ACTIVITY ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    {recentActivity.length > 0 ? recentActivity.slice(0, 5).map(act => {
                        const sk = cap(act.sport);
                        const col = SPORT_COLORS[sk] || '#16a34a';
                        const ico = SPORT_ICONS[sk] || 'trophy-outline';
                        return (
                            <View key={act.event_id} style={styles.eventCard}>
                                <View style={[styles.eventBar, { backgroundColor: col }]} />
                                <View style={styles.eventBody}>
                                    <View style={styles.eventTop}>
                                        <View style={[styles.sportBadge, { backgroundColor: col+'18' }]}>
                                            <Ionicons name={ico} size={12} color={col} />
                                            <Text style={[styles.sportBadgeText, { color: col }]}>{sk}</Text>
                                        </View>
                                        {act.is_organizer && (
                                            <View style={styles.hostBadge}>
                                                <Ionicons name="star" size={10} color="#f59e0b" />
                                                <Text style={styles.hostBadgeText}>Hosted</Text>
                                            </View>
                                        )}
                                        {act.my_rating && (
                                            <View style={{ flexDirection:'row', alignItems:'center', gap:2, marginLeft:'auto' }}>
                                                <Ionicons name="star" size={12} color="#f59e0b" />
                                                <Text style={{ fontSize:12, fontWeight:'700', color:'#f59e0b' }}>{act.my_rating}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.eventTitle} numberOfLines={1}>{act.title}</Text>
                                    <View style={styles.eventMeta}>
                                        <Ionicons name="calendar-outline" size={12} color="#999" />
                                        <Text style={styles.eventMetaText}>{formatDate(act.start_date)}</Text>
                                    </View>
                                    {act.can_rate && (
                                        <TouchableOpacity
                                            style={{ flexDirection:'row', alignItems:'center', gap:4, marginTop:8, backgroundColor:'#fffbeb', borderRadius:8, paddingHorizontal:10, paddingVertical:6, alignSelf:'flex-start', borderWidth:1, borderColor:'#fde68a' }}
                                            onPress={() => {
                                                // Navigate to event detail where they can rate
                                                // Or trigger inline rating — for now navigate
                                                navigation.navigate('EventDetail', { eventId: act.event_id });
                                            }}
                                        >
                                            <Ionicons name="star-outline" size={14} color="#f59e0b" />
                                            <Text style={{ fontSize:12, fontWeight:'700', color:'#f59e0b' }}>Rate Host</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        );
                    }) : (
                        <View style={styles.emptyCard}>
                            <Ionicons name="time-outline" size={26} color="#ddd" />
                            <Text style={styles.emptyText}>No recent activity</Text>
                            <Text style={styles.emptySub}>Past events from the last 2 weeks appear here</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <AvatarSheet
                visible={sheetOpen}
                onClose={() => setSheetOpen(false)}
                hasPhoto={!!user.avatar_photo}
                onViewPhoto={() => setViewerOpen(true)}
                onSelectPhoto={pickPhoto}
                onEditAvatar={() => navigation.navigate('EditAvatar')}
            />
            <PhotoViewer visible={viewerOpen} uri={user.avatar_photo} onClose={() => setViewerOpen(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container:       { flex: 1, backgroundColor: '#f8f9fb' },
    centered:        { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fb' },
    banner:          { height: 260, overflow: 'hidden' },
    bannerImage:     { width: '100%', height: '100%', resizeMode: 'cover' },
    bannerOverlay:   { ...StyleSheet.absoluteFillObject },
    bannerEditHint:  { position: 'absolute', bottom: 10, right: 14, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
    bannerEditText:  { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    avatarRow:       { alignSelf: 'center', marginTop: -57, marginBottom: 12 },
    avatarRing:      { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#fff', backgroundColor: '#f0f0f0', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
    avatarInner:     { width: 102, height: 102, borderRadius: 51, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
    cameraBadge:     { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#16a34a', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#fff' },
    nameSection:     { alignItems: 'center', paddingHorizontal: 20 },
    name:            { fontSize: 26, fontWeight: '800', color: '#1a1a2e', letterSpacing: 0.5 },
    locationRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    nationality:     { fontSize: 13, color: '#999' },
    ageDot:          { fontSize: 13, color: '#bbb' },
    ratingRow:       { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 8 },
    ratingText:      { fontSize: 12, color: '#999', marginLeft: 4, fontWeight: '600' },
    socialRow:       { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' },
    socialPill:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    socialPillText:  { fontSize: 13, color: '#1a1a2e', fontWeight: '600' },
    bioSection:      { paddingHorizontal: 32, marginTop: 12, alignItems: 'center' },
    bio:             { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 21 },
    statsRow:        { flexDirection: 'row', marginTop: 20, marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    statItem:        { flex: 1, alignItems: 'center' },
    statNum:         { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
    statLabel:       { fontSize: 11, color: '#999', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    statDiv:         { width: 1, height: 30, backgroundColor: '#eee' },
    section:         { marginTop: 24, marginHorizontal: 20 },
    sectionTitle:    { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    eventCard:       { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, overflow: 'hidden' },
    eventBar:        { width: 4, alignSelf: 'stretch' },
    eventBody:       { flex: 1, padding: 14 },
    eventTop:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    sportBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    sportBadgeText:  { fontSize: 11, fontWeight: '700' },
    hostBadge:       { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fffbeb', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#fde68a' },
    hostBadgeText:   { fontSize: 11, fontWeight: '700', color: '#f59e0b' },
    attendBadge:     { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#bfdbfe' },
    attendBadgeText: { fontSize: 11, fontWeight: '700', color: '#3b82f6' },
    eventTitle:      { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
    eventMeta:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
    eventMetaText:   { fontSize: 12, color: '#999' },
    deleteBtn:       { padding: 16 },
    pillsRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill:            { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
    pillText:        { fontSize: 13, fontWeight: '700' },
    emptyCard:       { alignItems: 'center', paddingVertical: 28, backgroundColor: '#fff', borderRadius: 16, gap: 6 },
    emptyText:       { fontSize: 14, fontWeight: '600', color: '#ccc' },
    emptySub:        { fontSize: 12, color: '#ddd' },
    // Sheet
    sheetBg:         { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet:           { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 36 },
    sheetPill:       { width: 36, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
    sheetHeading:    { fontSize: 17, fontWeight: '800', color: '#1a1a2e', paddingHorizontal: 20, paddingVertical: 12 },
    sheetRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, gap: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f0f0f0' },
    sheetIconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
    sheetRowLabel:   { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
    sheetRowSub:     { fontSize: 12, color: '#bbb', marginTop: 1 },
    sheetCancelBtn:  { margin: 16, marginBottom: 0, backgroundColor: '#f5f5f5', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    sheetCancelText: { fontSize: 15, fontWeight: '700', color: '#666' },
    // Photo viewer
    photoViewerBg:   { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
    photoViewerClose:{ position: 'absolute', top: 56, right: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
});