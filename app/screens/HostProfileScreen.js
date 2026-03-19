import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Image, ActivityIndicator, RefreshControl, Alert, Linking,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getToken } from '../services/auth';
import { API_URL } from '../config';
import ReportModal from './ReportModal';

const SPORT_COLORS = {
    Soccer:'#4CAF50', Basketball:'#FF9800', Tennis:'#2196F3', Volleyball:'#9C27B0',
    Pickleball:'#e94560', Baseball:'#795548', Football:'#607D8B', Handball:'#E91E63',
    Softball:'#FFC107', Dodgeball:'#009688', Kickball:'#FF9800',
};
const SPORT_ICONS = {
    Soccer:'football-outline', Basketball:'basketball-outline', Tennis:'tennisball-outline',
    Volleyball:'baseball-outline', Pickleball:'baseball-outline', Baseball:'baseball-outline',
    Football:'american-football-outline', Handball:'hand-left-outline',
    Softball:'baseball-outline', Dodgeball:'radio-button-on-outline', Kickball:'football-outline',
};
const COUNTRY_FLAGS = {
    'United States':'🇺🇸','Mexico':'🇲🇽','Guatemala':'🇬🇹','Canada':'🇨🇦','Brazil':'🇧🇷',
    'Argentina':'🇦🇷','Colombia':'🇨🇴','Spain':'🇪🇸','United Kingdom':'🇬🇧','France':'🇫🇷',
    'Germany':'🇩🇪','Italy':'🇮🇹','Japan':'🇯🇵','South Korea':'🇰🇷','India':'🇮🇳',
};
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

function ReviewerAvatar({ photo, avatarConfig, name, size = 40 }) {
    const initials = name?.split(' ').map(n => n?.[0]).join('').toUpperCase() || '?';
    if (photo) return <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size/2 }} />;
    return (
        <LinearGradient colors={['#16a34a','#0f3460']} style={{ width:size, height:size, borderRadius:size/2, justifyContent:'center', alignItems:'center' }}>
            <Text style={{ color:'#fff', fontWeight:'800', fontSize:size*0.35 }}>{initials}</Text>
        </LinearGradient>
    );
}

function ProfileAvatar({ photo, avatarConfig, name, size = 96 }) {
    const initials = name?.split(' ').map(n => n?.[0]).join('').toUpperCase() || '?';
    if (photo) return <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size/2, borderWidth: 3, borderColor: '#fff' }} />;
    return (
        <LinearGradient colors={['#16a34a','#0f3460']} style={{ width:size, height:size, borderRadius:size/2, justifyContent:'center', alignItems:'center', borderWidth: 3, borderColor: '#fff' }}>
            <Text style={{ color:'#fff', fontWeight:'900', fontSize:size*0.3 }}>{initials}</Text>
        </LinearGradient>
    );
}

const formatReviewDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function HostProfileScreen({ route, navigation }) {
    const { userId } = route.params;
    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [reportVisible, setReportVisible] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const [profileRes, reviewsRes, activityRes] = await Promise.all([
                fetch(`${API_URL}/users/${userId}/profile`),
                fetch(`${API_URL}/users/${userId}/reviews`),
                fetch(`${API_URL}/users/${userId}/recent-activity`),
            ]);
            if (profileRes.ok) setProfile(await profileRes.json());
            if (reviewsRes.ok) { const d = await reviewsRes.json(); setReviews(d.reviews || []); }
            if (activityRes.ok) { const d = await activityRes.json(); setActivity(d.activities || []); }

            // Check current user + block status
            const token = await getToken();
            if (token) {
                const [meRes, blockedRes] = await Promise.all([
                    fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`${API_URL}/users/me/blocked`, { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                if (meRes.ok) {
                    const me = await meRes.json();
                    setCurrentUserId(me.user_id);
                }
                if (blockedRes.ok) {
                    const bd = await blockedRes.json();
                    setIsBlocked((bd.blocked || []).some(b => b.user_id === userId));
                }
            }
        } catch (e) { console.log('HostProfile fetch error:', e); }
        finally { setLoading(false); setRefreshing(false); }
    }, [userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const onRefresh = () => { setRefreshing(true); fetchData(); };

    const handleBlock = () => {
        const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'this user';
        Alert.alert(
            isBlocked ? 'Unblock User' : 'Block User',
            isBlocked
                ? `Unblock ${name}? Their events will appear in your feed again.`
                : `Block ${name}? You won't see their events and they'll be removed from yours.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: isBlocked ? 'Unblock' : 'Block', style: 'destructive', onPress: async () => {
                    try {
                        const token = await getToken();
                        await fetch(`${API_URL}/users/${userId}/block`, {
                            method: isBlocked ? 'DELETE' : 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        setIsBlocked(!isBlocked);
                    } catch {}
                }},
            ]
        );
    };

    if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#16a34a" /></View>;
    if (!profile) return <View style={s.centered}><Text style={{ color:'#aaa' }}>User not found</Text></View>;

    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown';
    const sports = profile.sports ? JSON.parse(profile.sports) : [];
    const flag = COUNTRY_FLAGS[profile.nationality] || '';

    return (
        <View style={s.container}>
            {/* HEADER */}
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
                </TouchableOpacity>
                <Text style={s.headerTitle} numberOfLines={1}>{fullName}</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
            >
                {/* BANNER */}
                {profile.banner_photo ? (
                    <View style={s.banner}>
                        <Image source={{ uri: profile.banner_photo }} style={s.bannerImage} />
                        <LinearGradient colors={['transparent','rgba(0,0,0,0.2)']} style={s.bannerOverlay} />
                    </View>
                ) : (
                    <LinearGradient colors={['#1a1a2e','#16213e','#0f3460']} style={s.banner} />
                )}

                {/* AVATAR */}
                <View style={s.avatarRow}>
                    <View style={s.avatarRing}>
                        <ProfileAvatar photo={profile.avatar_photo} avatarConfig={profile.avatar_config} name={fullName} />
                    </View>
                </View>

                {/* NAME + INFO */}
                <View style={s.nameSection}>
                    <Text style={s.name}>{fullName}</Text>
                    {profile.nationality && (
                        <Text style={s.nationality}>{flag} {profile.nationality}</Text>
                    )}
                    {profile.host_rating ? (
                        <View style={s.ratingRow}>
                            {[1,2,3,4,5].map(i => <Ionicons key={i} name={i<=Math.round(profile.host_rating)?'star':'star-outline'} size={14} color="#f59e0b" />)}
                            <Text style={s.ratingText}>{Number(profile.host_rating).toFixed(1)} ({profile.total_ratings} {profile.total_ratings===1?'review':'reviews'})</Text>
                        </View>
                    ) : (
                        <Text style={s.noRating}>No ratings yet</Text>
                    )}
                </View>

                {/* SOCIAL LINKS */}
                {(profile.instagram || profile.facebook) && (
                    <View style={s.socialRow}>
                        {profile.instagram && (
                            <TouchableOpacity style={s.socialPill} activeOpacity={0.7}
                                onPress={() => {
                                    const handle = profile.instagram.replace('@','');
                                    Linking.openURL(`instagram://user?username=${handle}`).catch(() =>
                                        Linking.openURL(`https://instagram.com/${handle}`)
                                    );
                                }}>
                                <Ionicons name="logo-instagram" size={15} color="#f50057" />
                                <Text style={s.socialPillText}>@{profile.instagram}</Text>
                                <Ionicons name="open-outline" size={11} color="#ccc" />
                            </TouchableOpacity>
                        )}
                        {profile.facebook && (
                            <TouchableOpacity style={s.socialPill} activeOpacity={0.7}
                                onPress={() => {
                                    Linking.openURL(`fb://profile/${profile.facebook}`).catch(() =>
                                        Linking.openURL(`https://facebook.com/${profile.facebook}`)
                                    );
                                }}>
                                <Ionicons name="logo-facebook" size={15} color="#1877f2" />
                                <Text style={s.socialPillText}>{profile.facebook}</Text>
                                <Ionicons name="open-outline" size={11} color="#ccc" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View style={s.body}>
                    {/* BIO */}
                    {profile.bio && (
                        <View style={s.section}>
                            <Text style={s.sectionTitle}>About</Text>
                            <View style={s.card}>
                                <Text style={s.bioText}>{profile.bio}</Text>
                            </View>
                        </View>
                    )}

                    {/* SPORTS */}
                    {sports.length > 0 && (
                        <View style={s.section}>
                            <Text style={s.sectionTitle}>Sports</Text>
                            <View style={s.sportsRow}>
                                {sports.map(sp => {
                                    const key = cap(sp);
                                    const color = SPORT_COLORS[key] || '#999';
                                    return (
                                        <View key={sp} style={[s.sportChip, { backgroundColor: color + '15' }]}>
                                            <Ionicons name={SPORT_ICONS[key] || 'trophy-outline'} size={14} color={color} />
                                            <Text style={[s.sportChipText, { color }]}>{key}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* RECENT ACTIVITY */}
                    {activity.length > 0 && (
                        <View style={s.section}>
                            <Text style={s.sectionTitle}>Recent activity</Text>
                            {activity.slice(0, 5).map((a, i) => {
                                const sk = cap(a.sport);
                                const color = SPORT_COLORS[sk] || '#999';
                                return (
                                    <View key={a.event_id + i} style={s.activityRow}>
                                        <View style={[s.activityDot, { backgroundColor: color }]} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.activityTitle} numberOfLines={1}>{a.title}</Text>
                                            <Text style={s.activitySub}>{a.start_date} · {a.location}</Text>
                                        </View>
                                        {a.is_organizer && (
                                            <View style={s.hostedBadge}><Text style={s.hostedBadgeText}>Hosted</Text></View>
                                        )}
                                        {!a.is_organizer && (
                                            <View style={s.attendedBadge}><Text style={s.attendedBadgeText}>Attended</Text></View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* REVIEWS */}
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>
                            Reviews {reviews.length > 0 ? `(${reviews.length})` : ''}
                        </Text>

                        {reviews.length === 0 ? (
                            <View style={s.card}>
                                <Text style={s.emptyText}>No reviews yet</Text>
                            </View>
                        ) : (
                            reviews.map((r, i) => (
                                <View key={r.rating_id || i} style={[s.reviewCard, i > 0 && { marginTop: 10 }]}>
                                    <View style={s.reviewHeader}>
                                        <ReviewerAvatar
                                            photo={r.reviewer_photo}
                                            avatarConfig={r.reviewer_avatar}
                                            name={r.reviewer_name}
                                            size={36}
                                        />
                                        <View style={s.reviewHeaderInfo}>
                                            <Text style={s.reviewerName}>{r.reviewer_name}</Text>
                                            <Text style={s.reviewDate}>{formatReviewDate(r.created_at)}</Text>
                                        </View>
                                    </View>
                                    <View style={s.reviewStars}>
                                        {[1,2,3,4,5].map(star => (
                                            <Ionicons
                                                key={star}
                                                name={star <= r.rating ? 'star' : 'star-outline'}
                                                size={14}
                                                color="#f59e0b"
                                            />
                                        ))}
                                    </View>
                                    {r.comment ? (
                                        <Text style={s.reviewComment}>{r.comment}</Text>
                                    ) : null}
                                </View>
                            ))
                        )}
                    </View>

                    {/* REPORT / BLOCK — hidden on own profile */}
                    {currentUserId && String(currentUserId) !== String(userId) && (
                        <View style={s.actionRow}>
                            <TouchableOpacity style={s.actionBtn} onPress={() => setReportVisible(true)}>
                                <Ionicons name="flag-outline" size={14} color="#999" />
                                <Text style={s.actionBtnText}>Report</Text>
                            </TouchableOpacity>
                            <View style={s.actionDivider} />
                            <TouchableOpacity style={s.actionBtn} onPress={handleBlock}>
                                <Ionicons name={isBlocked ? 'person-add-outline' : 'ban-outline'} size={14} color={isBlocked ? '#16a34a' : '#e94560'} />
                                <Text style={[s.actionBtnText, { color: isBlocked ? '#16a34a' : '#e94560' }]}>{isBlocked ? 'Unblock' : 'Block'}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* REPORT MODAL */}
            <ReportModal
                visible={reportVisible}
                onClose={() => setReportVisible(false)}
                targetType="user"
                targetId={userId}
                targetName={fullName}
            />
        </View>
    );
}

const s = StyleSheet.create({
    container:       { flex: 1, backgroundColor: '#f8f9fb' },
    centered:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header:          { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    backBtn:         { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8f9fb', justifyContent: 'center', alignItems: 'center' },
    headerTitle:     { flex: 1, fontSize: 16, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginHorizontal: 8 },
    // Banner + Avatar (matches ProfileScreen)
    banner:          { height: 160, overflow: 'hidden' },
    bannerImage:     { width: '100%', height: '100%', resizeMode: 'cover' },
    bannerOverlay:   { ...StyleSheet.absoluteFillObject },
    avatarRow:       { alignSelf: 'center', marginTop: -52, marginBottom: 12 },
    avatarRing:      { width: 104, height: 104, borderRadius: 52, borderWidth: 4, borderColor: '#fff', backgroundColor: '#f0f0f0', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
    // Name section
    nameSection:     { alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 },
    name:            { fontSize: 24, fontWeight: '800', color: '#1a1a2e', letterSpacing: 0.5 },
    nationality:     { fontSize: 13, color: '#999', marginTop: 4 },
    ratingRow:       { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 8 },
    ratingText:      { fontSize: 12, color: '#999', marginLeft: 4, fontWeight: '600' },
    noRating:        { fontSize: 12, color: '#bbb', marginTop: 6 },
    // Social
    socialRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8, marginBottom: 8, paddingHorizontal: 20 },
    socialPill:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    socialPillText:  { fontSize: 13, color: '#1a1a2e', fontWeight: '600' },
    // Body
    body:            { padding: 20 },
    section:         { marginBottom: 24 },
    sectionTitle:    { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    card:            { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    bioText:         { fontSize: 14, color: '#555', lineHeight: 22 },
    emptyText:       { fontSize: 14, color: '#bbb', textAlign: 'center', paddingVertical: 8 },
    // Sports
    sportsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    sportChip:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
    sportChipText:   { fontSize: 13, fontWeight: '700' },
    // Activity
    activityRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 6, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
    activityDot:     { width: 8, height: 8, borderRadius: 4 },
    activityTitle:   { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
    activitySub:     { fontSize: 12, color: '#999', marginTop: 2 },
    hostedBadge:     { backgroundColor: '#dbeafe', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    hostedBadgeText: { fontSize: 10, fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase' },
    attendedBadge:   { backgroundColor: '#f0fdf4', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    attendedBadgeText:{ fontSize: 10, fontWeight: '800', color: '#16a34a', textTransform: 'uppercase' },
    // Reviews
    reviewCard:      { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    reviewHeader:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    reviewHeaderInfo:{ flex: 1 },
    reviewerName:    { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
    reviewDate:      { fontSize: 12, color: '#bbb', marginTop: 1 },
    reviewStars:     { flexDirection: 'row', gap: 2, marginBottom: 8 },
    reviewComment:   { fontSize: 14, color: '#555', lineHeight: 21 },
    // Report / Block
    actionRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 8, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
    actionBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
    actionBtnText:   { fontSize: 13, fontWeight: '600', color: '#999' },
    actionDivider:   { width: 1, height: 20, backgroundColor: '#f0f0f0' },
});