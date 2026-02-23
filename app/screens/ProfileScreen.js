import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const SPORTS = ['⚽ Soccer', '🏀 Basketball', '🎾 Tennis', '🏐 Volleyball'];

const RECENT_ACTIVITY = [
    { emoji: '⚽', title: 'Sunday Pickup Soccer', date: 'Feb 23', type: 'Created' },
    { emoji: '🏀', title: 'Saturday Basketball', date: 'Feb 20', type: 'Joined' },
    { emoji: '🎾', title: 'Tennis Doubles', date: 'Feb 18', type: 'Joined' },
];

export default function ProfileScreen() {
    const [profile] = useState({
        firstName: 'Daniel',
        lastName: 'Rodriguez',
        bio: 'Pickup soccer every weekend. Always down for a good game. Lexington, KY',
        nationality: 'Guatemalan',
        sports: SPORTS,
        eventsCreated: 8,
        eventsJoined: 23,
        friends: 142,
        image: null,
    });

    const initials = `${profile.firstName[0]}${profile.lastName[0]}`;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

            {/* BANNER */}
            <LinearGradient
                colors={['#1a1a2e', '#16213e', '#0f3460']}
                style={styles.banner}
            />

            {/* AVATAR */}
            <View style={styles.avatarWrapper}>
                {profile.image ? (
                    <Image source={{ uri: profile.image }} style={styles.avatar} />
                ) : (
                    <LinearGradient
                        colors={['#e94560', '#0f3460']}
                        style={styles.avatar}
                    >
                        <Text style={styles.initials}>{initials}</Text>
                    </LinearGradient>
                )}
                <TouchableOpacity style={styles.editPhotoBtn}>
                    <Ionicons name="camera-outline" size={16} color="#1a1a2e" />
                </TouchableOpacity>
            </View>

            {/* NAME */}
            <View style={styles.nameSection}>
                <Text style={styles.name}>{profile.firstName} {profile.lastName}</Text>
                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={13} color="#999" />
                    <Text style={styles.nationality}> {profile.nationality}</Text>
                </View>
            </View>

            {/* BIO */}
            <View style={styles.bioSection}>
                <Text style={styles.bio}>{profile.bio}</Text>
            </View>

            {/* STATS */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{profile.eventsCreated}</Text>
                    <Text style={styles.statLabel}>Created</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{profile.eventsJoined}</Text>
                    <Text style={styles.statLabel}>Joined</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{profile.friends}</Text>
                    <Text style={styles.statLabel}>Friends</Text>
                </View>
            </View>

            {/* EDIT BUTTON */}
            <TouchableOpacity style={styles.editBtn}>
                <Ionicons name="pencil-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>

            {/* SPORTS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sports & Interests</Text>
                <View style={styles.pillsRow}>
                    {profile.sports.map((sport, index) => (
                        <View key={index} style={styles.pill}>
                            <Text style={styles.pillText}>{sport}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* RECENT ACTIVITY */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                {RECENT_ACTIVITY.map((event, index) => (
                    <View key={index} style={styles.activityItem}>
                        <View style={styles.activityIcon}>
                            <Text style={{ fontSize: 20 }}>{event.emoji}</Text>
                        </View>
                        <View style={styles.activityInfo}>
                            <Text style={styles.activityTitle}>{event.title}</Text>
                            <Text style={styles.activityDate}>{event.date}</Text>
                        </View>
                        <View style={[
                            styles.activityBadge,
                            event.type === 'Created' ? styles.badgeCreated : styles.badgeJoined
                        ]}>
                            <Text style={styles.activityBadgeText}>{event.type}</Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fb' },
    banner: { height: 160, width: '100%' },
    avatarWrapper: { alignSelf: 'center', marginTop: -55, marginBottom: 12 },
    avatar: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff' },
    initials: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: 2 },
    editPhotoBtn: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#fff', borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
    nameSection: { alignItems: 'center', paddingHorizontal: 20 },
    name: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', letterSpacing: 0.5 },
    locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    nationality: { fontSize: 13, color: '#999' },
    bioSection: { paddingHorizontal: 32, marginTop: 12, alignItems: 'center' },
    bio: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 21 },
    statsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    statItem: { flex: 1, alignItems: 'center' },
    statNumber: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
    statLabel: { fontSize: 11, color: '#999', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    statDivider: { width: 1, height: 30, backgroundColor: '#eee' },
    editBtn: { flexDirection: 'row', marginHorizontal: 20, marginTop: 14, backgroundColor: '#1a1a2e', borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
    editBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
    section: { marginTop: 24, marginHorizontal: 20 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    pillText: { fontSize: 13, color: '#1a1a2e', fontWeight: '600' },
    activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    activityIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    activityInfo: { flex: 1, marginLeft: 12 },
    activityTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
    activityDate: { fontSize: 12, color: '#999', marginTop: 2 },
    activityBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    badgeCreated: { backgroundColor: '#e8f5e9' },
    badgeJoined: { backgroundColor: '#e3f2fd' },
    activityBadgeText: { fontSize: 11, fontWeight: '700', color: '#555' },
    settingsItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    settingsIcon: { marginRight: 14 },
    settingsLabel: { flex: 1, fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
});