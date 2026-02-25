import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Image, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getToken } from '../services/auth';
import { AvatarPreview } from './SetupAvatar';

const API_URL = 'http://192.168.4.131:8000';

const SPORT_ICONS = {
    Soccer:'football-outline', Basketball:'basketball-outline', Tennis:'tennisball-outline',
    Volleyball:'baseball-outline', Pickleball:'baseball-outline', Baseball:'baseball-outline',
    Football:'american-football-outline', Handball:'hand-left-outline',
    Softball:'baseball-outline', Dodgeball:'radio-button-on-outline', Kickball:'football-outline',
};

const SPORT_COLORS = {
    Soccer:'#4CAF50', Basketball:'#FF9800', Tennis:'#2196F3',
    Volleyball:'#9C27B0', Pickleball:'#e94560', Baseball:'#795548',
    Football:'#607D8B', Handball:'#E91E63', Softball:'#FFC107',
    Dodgeball:'#009688', Kickball:'#FF9800',
};

const COUNTRY_FLAGS = {
    'Andorra':'🇦🇩','United Arab Emirates':'🇦🇪','Afghanistan':'🇦🇫','Antigua and Barbuda':'🇦🇬','Anguilla':'🇦🇮',
    'Albania':'🇦🇱','Armenia':'🇦🇲','Angola':'🇦🇴','Antarctica':'🇦🇶','Argentina':'🇦🇷',
    'American Samoa':'🇦🇸','Austria':'🇦🇹','Australia':'🇦🇺','Aruba':'🇦🇼','Åland Islands':'🇦🇽',
    'Azerbaijan':'🇦🇿','Bosnia and Herzegovina':'🇧🇦','Barbados':'🇧🇧','Bangladesh':'🇧🇩','Belgium':'🇧🇪',
    'Burkina Faso':'🇧🇫','Bulgaria':'🇧🇬','Bahrain':'🇧🇭','Burundi':'🇧🇮','Benin':'🇧🇯',
    'Saint Barthélemy':'🇧🇱','Bermuda':'🇧🇲','Brunei Darussalam':'🇧🇳','Bolivia':'🇧🇴','Bonaire, Sint Eustatius and Saba':'🇧🇶',
    'Brazil':'🇧🇷','Bahamas':'🇧🇸','Bhutan':'🇧🇹','Bouvet Island':'🇧🇻','Botswana':'🇧🇼',
    'Belarus':'🇧🇾','Belize':'🇧🇿','Canada':'🇨🇦','Cocos (Keeling) Islands':'🇨🇨','Congo':'🇨🇩',
    'Central African Republic':'🇨🇫','Congo (Republic)':'🇨🇬','Switzerland':'🇨🇭',"Côte D'Ivoire":'🇨🇮','Cook Islands':'🇨🇰',
    'Chile':'🇨🇱','Cameroon':'🇨🇲','China':'🇨🇳','Colombia':'🇨🇴','Costa Rica':'🇨🇷',
    'Cuba':'🇨🇺','Cape Verde':'🇨🇻','Curaçao':'🇨🇼','Christmas Island':'🇨🇽','Cyprus':'🇨🇾',
    'Czech Republic':'🇨🇿','Germany':'🇩🇪','Djibouti':'🇩🇯','Denmark':'🇩🇰','Dominica':'🇩🇲',
    'Dominican Republic':'🇩🇴','Algeria':'🇩🇿','Ecuador':'🇪🇨','Estonia':'🇪🇪','Egypt':'🇪🇬',
    'Western Sahara':'🇪🇭','Eritrea':'🇪🇷','Spain':'🇪🇸','Ethiopia':'🇪🇹','Finland':'🇫🇮',
    'Fiji':'🇫🇯','Falkland Islands (Malvinas)':'🇫🇰','Micronesia':'🇫🇲','Faroe Islands':'🇫🇴','France':'🇫🇷',
    'Gabon':'🇬🇦','United Kingdom':'🇬🇧','Grenada':'🇬🇩','Georgia':'🇬🇪','French Guiana':'🇬🇫',
    'Guernsey':'🇬🇬','Ghana':'🇬🇭','Gibraltar':'🇬🇮','Greenland':'🇬🇱','Gambia':'🇬🇲',
    'Guinea':'🇬🇳','Guadeloupe':'🇬🇵','Equatorial Guinea':'🇬🇶','Greece':'🇬🇷','South Georgia':'🇬🇸',
    'Guatemala':'🇬🇹','Guam':'🇬🇺','Guinea-Bissau':'🇬🇼','Guyana':'🇬🇾','Hong Kong':'🇭🇰',
    'Heard Island and Mcdonald Islands':'🇭🇲','Honduras':'🇭🇳','Croatia':'🇭🇷','Haiti':'🇭🇹','Hungary':'🇭🇺',
    'Indonesia':'🇮🇩','Ireland':'🇮🇪','Israel':'🇮🇱','Isle of Man':'🇮🇲','India':'🇮🇳',
    'British Indian Ocean Territory':'🇮🇴','Iraq':'🇮🇶','Iran':'🇮🇷','Iceland':'🇮🇸','Italy':'🇮🇹',
    'Jersey':'🇯🇪','Jamaica':'🇯🇲','Jordan':'🇯🇴','Japan':'🇯🇵','Kenya':'🇰🇪',
    'Kyrgyzstan':'🇰🇬','Cambodia':'🇰🇭','Kiribati':'🇰🇮','Comoros':'🇰🇲','Saint Kitts and Nevis':'🇰🇳',
    'North Korea':'🇰🇵','South Korea':'🇰🇷','Kuwait':'🇰🇼','Cayman Islands':'🇰🇾','Kazakhstan':'🇰🇿',
    "Lao People's Democratic Republic":'🇱🇦','Lebanon':'🇱🇧','Saint Lucia':'🇱🇨','Liechtenstein':'🇱🇮','Sri Lanka':'🇱🇰',
    'Liberia':'🇱🇷','Lesotho':'🇱🇸','Lithuania':'🇱🇹','Luxembourg':'🇱🇺','Latvia':'🇱🇻',
    'Libya':'🇱🇾','Morocco':'🇲🇦','Monaco':'🇲🇨','Moldova':'🇲🇩','Montenegro':'🇲🇪',
    'Saint Martin (French Part)':'🇲🇫','Madagascar':'🇲🇬','Marshall Islands':'🇲🇭','Macedonia':'🇲🇰','Mali':'🇲🇱',
    'Myanmar':'🇲🇲','Mongolia':'🇲🇳','Macao':'🇲🇴','Northern Mariana Islands':'🇲🇵','Martinique':'🇲🇶',
    'Mauritania':'🇲🇷','Montserrat':'🇲🇸','Malta':'🇲🇹','Mauritius':'🇲🇺','Maldives':'🇲🇻',
    'Malawi':'🇲🇼','Mexico':'🇲🇽','Malaysia':'🇲🇾','Mozambique':'🇲🇿','Namibia':'🇳🇦',
    'New Caledonia':'🇳🇨','Niger':'🇳🇪','Norfolk Island':'🇳🇫','Nigeria':'🇳🇬','Nicaragua':'🇳🇮',
    'Netherlands':'🇳🇱','Norway':'🇳🇴','Nepal':'🇳🇵','Nauru':'🇳🇷','Niue':'🇳🇺',
    'New Zealand':'🇳🇿','Oman':'🇴🇲','Panama':'🇵🇦','Peru':'🇵🇪','French Polynesia':'🇵🇫',
    'Papua New Guinea':'🇵🇬','Philippines':'🇵🇭','Pakistan':'🇵🇰','Poland':'🇵🇱','Saint Pierre and Miquelon':'🇵🇲',
    'Pitcairn':'🇵🇳','Puerto Rico':'🇵🇷','Palestinian Territory':'🇵🇸','Portugal':'🇵🇹','Palau':'🇵🇼',
    'Paraguay':'🇵🇾','Qatar':'🇶🇦','Réunion':'🇷🇪','Romania':'🇷🇴','Serbia':'🇷🇸',
    'Russia':'🇷🇺','Rwanda':'🇷🇼','Saudi Arabia':'🇸🇦','Solomon Islands':'🇸🇧','Seychelles':'🇸🇨',
    'Sudan':'🇸🇩','Sweden':'🇸🇪','Singapore':'🇸🇬','Saint Helena, Ascension and Tristan Da Cunha':'🇸🇭','Slovenia':'🇸🇮',
    'Svalbard and Jan Mayen':'🇸🇯','Slovakia':'🇸🇰','Sierra Leone':'🇸🇱','San Marino':'🇸🇲','Senegal':'🇸🇳',
    'Somalia':'🇸🇴','Suriname':'🇸🇷','South Sudan':'🇸🇸','Sao Tome and Principe':'🇸🇹','El Salvador':'🇸🇻',
    'Sint Maarten (Dutch Part)':'🇸🇽','Syrian Arab Republic':'🇸🇾','Swaziland':'🇸🇿','Turks and Caicos Islands':'🇹🇨','Chad':'🇹🇩',
    'French Southern Territories':'🇹🇫','Togo':'🇹🇬','Thailand':'🇹🇭','Tajikistan':'🇹🇯','Tokelau':'🇹🇰',
    'Timor-Leste':'🇹🇱','Turkmenistan':'🇹🇲','Tunisia':'🇹🇳','Tonga':'🇹🇴','Turkey':'🇹🇷',
    'Trinidad and Tobago':'🇹🇹','Tuvalu':'🇹🇻','Taiwan':'🇹🇼','Tanzania':'🇹🇿','Ukraine':'🇺🇦',
    'Uganda':'🇺🇬','United States Minor Outlying Islands':'🇺🇲','United States':'🇺🇸','Uruguay':'🇺🇾','Uzbekistan':'🇺🇿',
    'Vatican City':'🇻🇦','Saint Vincent and The Grenadines':'🇻🇨','Venezuela':'🇻🇪','Virgin Islands, British':'🇻🇬','Virgin Islands, U.S.':'🇻🇮',
    'Viet Nam':'🇻🇳','Vanuatu':'🇻🇺','Wallis and Futuna':'🇼🇫','Samoa':'🇼🇸','Yemen':'🇾🇪',
    'Mayotte':'🇾🇹','South Africa':'🇿🇦','Zambia':'🇿🇲','Zimbabwe':'🇿🇼'
};

const cap = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

function getAge(dobString) {
    if (!dobString) return null;
    const dob = new Date(dobString);
    return Math.floor((new Date() - dob) / (1000 * 60 * 60 * 24 * 365.25));
}

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
};

export default function ProfileScreen({ navigation }) {
    const [user, setUser]               = useState(null);
    const [stats, setStats]             = useState({ created: 0, joined: 0 });
    const [upcoming, setUpcoming]       = useState({ organizing: [], joined: [] });
    const [loading, setLoading]         = useState(true);
    const [refreshing, setRefreshing]   = useState(false);
    const [deletingId, setDeletingId]   = useState(null);

    const fetchProfile = async () => {
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };

            const [userRes, statsRes, upcomingRes] = await Promise.all([
                fetch(`${API_URL}/users/me`, { headers }),
                fetch(`${API_URL}/users/me/stats`, { headers }),
                fetch(`${API_URL}/users/me/upcoming-events`, { headers }),
            ]);

            if (userRes.ok)     setUser(await userRes.json());
            if (statsRes.ok)    setStats(await statsRes.json());
            if (upcomingRes.ok) setUpcoming(await upcomingRes.json());
        } catch (e) {
            console.log('Profile fetch error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchProfile(); }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProfile();
    }, []);

    const handleDeleteEvent = (eventId, title) => {
        Alert.alert(
            'Delete Event',
            `Are you sure you want to delete "${title}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeletingId(eventId);
                        try {
                            const token = await getToken();
                            const res = await fetch(`${API_URL}/sports-events/${eventId}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            if (res.ok) {
                                setUpcoming(prev => ({
                                    ...prev,
                                    organizing: prev.organizing.filter(e => e.event_id !== eventId),
                                }));
                                setStats(prev => ({ ...prev, created: Math.max(prev.created - 1, 0) }));
                            }
                        } catch (e) {
                            console.log('Delete error:', e);
                        } finally {
                            setDeletingId(null);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#16a34a" />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.centered}>
                <Ionicons name="person-outline" size={48} color="#ddd" />
                <Text style={{ color: '#aaa', marginTop: 12 }}>Could not load profile</Text>
            </View>
        );
    }

    const initials     = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
    const sports       = user.sports ? JSON.parse(user.sports) : [];
    const avatarConfig = user.avatar_config ? JSON.parse(user.avatar_config) : null;
    const hasPhoto     = !!user.avatar_photo;
    const hasAvatar    = !!avatarConfig;
    const flag         = COUNTRY_FLAGS[user.nationality] || '🌍';
    const age          = getAge(user.date_of_birth);
    const allUpcoming  = [...upcoming.organizing, ...upcoming.joined]
        .sort((a, b) => a.start_date.localeCompare(b.start_date));
    const isOrganizing = (id) => upcoming.organizing.some(e => e.event_id === id);

    // ── EVENT CARD ────────────────────────────────────────────
    const renderUpcomingCard = (event) => {
        const sportKey  = cap(event.sport);
        const color     = SPORT_COLORS[sportKey] || '#16a34a';
        const icon      = SPORT_ICONS[sportKey]  || 'trophy-outline';
        const organizing = isOrganizing(event.event_id);
        const isDeleting = deletingId === event.event_id;

        return (
            <TouchableOpacity
                key={event.event_id}
                style={styles.eventCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('EventDetail', { eventId: event.event_id })}
            >
                {/* Left color bar */}
                <View style={[styles.eventCardBar, { backgroundColor: color }]} />

                <View style={styles.eventCardBody}>
                    <View style={styles.eventCardTop}>
                        <View style={[styles.sportBadge, { backgroundColor: color + '18' }]}>
                            <Ionicons name={icon} size={12} color={color} />
                            <Text style={[styles.sportBadgeText, { color }]}>{sportKey}</Text>
                        </View>
                        {organizing && (
                            <View style={styles.hostBadge}>
                                <Ionicons name="star" size={10} color="#f59e0b" />
                                <Text style={styles.hostBadgeText}>Hosting</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.eventCardTitle} numberOfLines={1}>{event.title}</Text>

                    <View style={styles.eventCardMeta}>
                        <Ionicons name="calendar-outline" size={12} color="#999" />
                        <Text style={styles.eventCardMetaText}>
                            {formatDate(event.start_date)} · {formatTime(event.start_time)}
                        </Text>
                    </View>
                    <View style={[styles.eventCardMeta, { marginTop: 2 }]}>
                        <Ionicons name="people-outline" size={12} color="#999" />
                        <Text style={styles.eventCardMetaText}>
                            {event.participant_count}/{event.max_players} players
                        </Text>
                    </View>
                </View>

                {/* Delete button — only for events you're organizing */}
                {organizing && (
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteEvent(event.event_id, event.title)}
                        disabled={isDeleting}
                    >
                        {isDeleting
                            ? <ActivityIndicator size="small" color="#e94560" />
                            : <Ionicons name="trash-outline" size={18} color="#e94560" />
                        }
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
        >
            {/* ── BANNER ── */}
            <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.banner} />

            {/* ── AVATAR ── */}
            <View style={styles.avatarWrapper}>
                {hasPhoto ? (
                    <Image source={{ uri: user.avatar_photo }} style={styles.avatar} />
                ) : hasAvatar ? (
                    <View style={[styles.avatar, styles.avatarBuilt]}>
                        <AvatarPreview config={avatarConfig} size={88} />
                    </View>
                ) : (
                    <LinearGradient colors={['#e94560', '#0f3460']} style={styles.avatar}>
                        <Text style={styles.initials}>{initials}</Text>
                    </LinearGradient>
                )}
                <TouchableOpacity style={styles.editPhotoBtn}>
                    <Ionicons name="camera-outline" size={15} color="#1a1a2e" />
                </TouchableOpacity>
            </View>

            {/* ── NAME ── */}
            <View style={styles.nameSection}>
                <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
                <View style={styles.locationRow}>
                    {user.nationality && (
                        <>
                            <Text style={{ fontSize: 14 }}>{flag}</Text>
                            <Text style={styles.nationality}> {user.nationality}</Text>
                        </>
                    )}
                    {age !== null && <Text style={styles.ageDot}>  ·  {age} yrs</Text>}
                </View>

                {/* Host rating */}
                {user.host_rating && (
                    <View style={styles.hostRatingRow}>
                        {[1,2,3,4,5].map(star => (
                            <Ionicons
                                key={star}
                                name={star <= Math.round(user.host_rating) ? 'star' : 'star-outline'}
                                size={14}
                                color="#f59e0b"
                            />
                        ))}
                        <Text style={styles.hostRatingText}>
                            {Number(user.host_rating).toFixed(1)} host rating ({user.total_ratings} {user.total_ratings === 1 ? 'review' : 'reviews'})
                        </Text>
                    </View>
                )}
            </View>

            {/* ── BIO ── */}
            {user.bio && (
                <View style={styles.bioSection}>
                    <Text style={styles.bio}>{user.bio}</Text>
                </View>
            )}

            {/* ── STATS ── */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.created}</Text>
                    <Text style={styles.statLabel}>Created</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{stats.joined}</Text>
                    <Text style={styles.statLabel}>Joined</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{allUpcoming.length}</Text>
                    <Text style={styles.statLabel}>Upcoming</Text>
                </View>
            </View>

            {/* ── UPCOMING EVENTS ── */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming Events</Text>
                {allUpcoming.length > 0 ? (
                    allUpcoming.map(event => renderUpcomingCard(event))
                ) : (
                    <View style={styles.emptyCard}>
                        <Ionicons name="calendar-outline" size={26} color="#ddd" />
                        <Text style={styles.emptyCardText}>No upcoming events</Text>
                        <Text style={styles.emptyCardSub}>Join or create an event to get started</Text>
                    </View>
                )}
            </View>

            {/* ── SPORTS ── */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sports & Interests</Text>
                {sports.length > 0 ? (
                    <View style={styles.pillsRow}>
                        {sports.map((sport, i) => (
                            <View key={i} style={styles.pill}>
                                <Ionicons name={SPORT_ICONS[sport] || 'tennisball-outline'} size={14} color="#16a34a" />
                                <Text style={styles.pillText}>{sport}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyCard}>
                        <Ionicons name="football-outline" size={26} color="#ddd" />
                        <Text style={styles.emptyCardText}>No sports added yet</Text>
                        <Text style={styles.emptyCardSub}>Edit your profile to add sports</Text>
                    </View>
                )}
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container:       { flex: 1, backgroundColor: '#f8f9fb' },
    centered:        { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fb' },
    banner:          { height: 160, width: '100%' },
    avatarWrapper:   { alignSelf: 'center', marginTop: -55, marginBottom: 12 },
    avatar:          { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
    avatarBuilt:     { backgroundColor: '#f0fdf4', overflow: 'hidden' },
    initials:        { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: 2 },
    editPhotoBtn:    { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#fff', borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
    nameSection:     { alignItems: 'center', paddingHorizontal: 20 },
    name:            { fontSize: 26, fontWeight: '800', color: '#1a1a2e', letterSpacing: 0.5 },
    locationRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    nationality:     { fontSize: 13, color: '#999' },
    ageDot:          { fontSize: 13, color: '#bbb' },
    hostRatingRow:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 8 },
    hostRatingText:  { fontSize: 12, color: '#999', marginLeft: 4, fontWeight: '600' },
    bioSection:      { paddingHorizontal: 32, marginTop: 12, alignItems: 'center' },
    bio:             { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 21 },
    statsRow:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    statItem:        { flex: 1, alignItems: 'center' },
    statNumber:      { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
    statLabel:       { fontSize: 11, color: '#999', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    statDivider:     { width: 1, height: 30, backgroundColor: '#eee' },
    section:         { marginTop: 24, marginHorizontal: 20 },
    sectionTitle:    { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },

    // Upcoming event cards
    eventCard:       { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, overflow: 'hidden' },
    eventCardBar:    { width: 4, alignSelf: 'stretch' },
    eventCardBody:   { flex: 1, padding: 14 },
    eventCardTop:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    sportBadge:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    sportBadgeText:  { fontSize: 11, fontWeight: '700' },
    hostBadge:       { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fffbeb', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#fde68a' },
    hostBadgeText:   { fontSize: 11, fontWeight: '700', color: '#f59e0b' },
    eventCardTitle:  { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
    eventCardMeta:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
    eventCardMetaText: { fontSize: 12, color: '#999' },
    deleteBtn:       { padding: 16, justifyContent: 'center', alignItems: 'center' },

    // Sports pills
    pillsRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill:            { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    pillText:        { fontSize: 13, color: '#1a1a2e', fontWeight: '600' },
    emptyCard:       { alignItems: 'center', paddingVertical: 28, backgroundColor: '#fff', borderRadius: 16, gap: 6 },
    emptyCardText:   { fontSize: 14, fontWeight: '600', color: '#ccc' },
    emptyCardSub:    { fontSize: 12, color: '#ddd' },
});