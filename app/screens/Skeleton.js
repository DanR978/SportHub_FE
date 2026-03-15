import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Single shimmer bone
export function Bone({ width, height, borderRadius = 8, style }) {
    const shimmer = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.timing(shimmer, {
                toValue: SCREEN_WIDTH,
                duration: 1200,
                useNativeDriver: true,
            })
        );
        anim.start();
        return () => anim.stop();
    }, []);

    return (
        <View style={[{ width, height, borderRadius, backgroundColor: '#e8e8e8', overflow: 'hidden' }, style]}>
            <Animated.View style={{ flex: 1, transform: [{ translateX: shimmer }] }}>
                <LinearGradient
                    colors={['#e8e8e8', '#f5f5f5', '#e8e8e8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
}

// ── PROFILE SKELETON ────────────────────────────────────────────────────────
export function ProfileSkeleton() {
    return (
        <View style={sk.container}>
            {/* Banner */}
            <View style={sk.banner} />
            {/* Avatar */}
            <View style={sk.avatarWrapper}>
                <Bone width={110} height={110} borderRadius={55} />
            </View>
            {/* Name */}
            <View style={sk.nameSection}>
                <Bone width={180} height={22} borderRadius={6} style={{ marginBottom: 8 }} />
                <Bone width={120} height={14} borderRadius={4} />
            </View>
            {/* Stats */}
            <View style={sk.statsRow}>
                {[0,1,2].map(i => (
                    <View key={i} style={sk.statItem}>
                        <Bone width={36} height={22} borderRadius={4} style={{ marginBottom: 6 }} />
                        <Bone width={52} height={10} borderRadius={3} />
                    </View>
                ))}
            </View>
            {/* Section */}
            <View style={sk.section}>
                <Bone width={120} height={12} borderRadius={3} style={{ marginBottom: 12 }} />
                {[1,2].map(i => <EventCardSkeleton key={i} />)}
            </View>
            <View style={sk.section}>
                <Bone width={140} height={12} borderRadius={3} style={{ marginBottom: 12 }} />
                <View style={sk.pillsRow}>
                    {[80,90,70,100].map((w,i) => <Bone key={i} width={w} height={32} borderRadius={16} />)}
                </View>
            </View>
        </View>
    );
}

// ── EVENTS LIST SKELETON ────────────────────────────────────────────────────
export function EventsListSkeleton() {
    return (
        <View style={{ flex: 1, backgroundColor: '#f8f9fb' }}>
            {/* Header */}
            <View style={sk.eventsHeader}>
                <Bone width={120} height={28} borderRadius={6} />
                <Bone width={40} height={40} borderRadius={12} />
            </View>
            {/* Search bar */}
            <View style={sk.searchRow}>
                <Bone width='90%' height={44} borderRadius={12} style={{ flex: 1 }} />
                <Bone width={44} height={44} borderRadius={12} />
            </View>
            {/* Results row */}
            <View style={sk.resultsRow}>
                <Bone width={80} height={14} borderRadius={4} />
                <Bone width={90} height={32} borderRadius={10} />
            </View>
            {/* Cards */}
            <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
                {[1,2,3].map(i => <EventCardSkeleton key={i} tall />)}
            </View>
        </View>
    );
}

// ── EVENT DETAIL SKELETON ───────────────────────────────────────────────────
export function EventDetailSkeleton() {
    return (
        <View style={{ flex: 1, backgroundColor: '#f8f9fb' }}>
            {/* Header */}
            <View style={sk.detailHeader}>
                <Bone width={36} height={36} borderRadius={10} />
                <Bone width={160} height={16} borderRadius={5} />
                <Bone width={36} height={36} borderRadius={10} />
            </View>
            {/* Banner */}
            <Bone width='100%' height={160} borderRadius={0} />
            <View style={{ padding: 20 }}>
                {/* Title row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Bone width={80} height={26} borderRadius={8} />
                    <Bone width={40} height={20} borderRadius={5} />
                </View>
                <Bone width={240} height={28} borderRadius={6} style={{ marginBottom: 20 }} />
                {/* Info card */}
                <View style={sk.infoCard}>
                    {[0,1,2].map((i) => (
                        <View key={i}>
                            {i > 0 && <View style={sk.divider} />}
                            <View style={sk.infoRow}>
                                <Bone width={38} height={38} borderRadius={10} />
                                <View>
                                    <Bone width={50} height={10} borderRadius={3} style={{ marginBottom: 6 }} />
                                    <Bone width={160} height={14} borderRadius={4} />
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
                {/* Players card */}
                <View style={[sk.infoCard, { marginTop: 20 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Bone width={80} height={22} borderRadius={5} />
                        <Bone width={70} height={16} borderRadius={4} />
                    </View>
                    <Bone width='100%' height={6} borderRadius={3} style={{ marginBottom: 10 }} />
                    <Bone width={100} height={13} borderRadius={4} />
                </View>
                {/* Organizer */}
                <View style={[sk.infoCard, { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                    <Bone width={52} height={52} borderRadius={26} />
                    <View style={{ flex: 1 }}>
                        <Bone width={120} height={15} borderRadius={4} style={{ marginBottom: 8 }} />
                        <Bone width={80} height={12} borderRadius={3} />
                    </View>
                    <Bone width={40} height={40} borderRadius={12} />
                </View>
            </View>
        </View>
    );
}

// ── EDIT PROFILE SKELETON ───────────────────────────────────────────────────
export function EditProfileSkeleton() {
    return (
        <View style={{ flex: 1, backgroundColor: '#f8f9fb' }}>
            {/* Header */}
            <View style={sk.detailHeader}>
                <Bone width={36} height={36} borderRadius={10} />
                <Bone width={100} height={16} borderRadius={5} />
                <Bone width={60} height={36} borderRadius={10} />
            </View>
            <View style={{ padding: 20 }}>
                {/* Avatar */}
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <Bone width={100} height={100} borderRadius={50} style={{ marginBottom: 12 }} />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Bone width={110} height={36} borderRadius={10} />
                    </View>
                </View>
                {/* Cards */}
                {[140, 120, 200, 160].map((h, i) => (
                    <View key={i} style={[sk.infoCard, { marginBottom: 16, height: h }]}>
                        <Bone width={80} height={14} borderRadius={4} style={{ marginBottom: 16 }} />
                        <Bone width='100%' height={44} borderRadius={10} style={{ marginBottom: 12 }} />
                        {h > 140 && <Bone width='100%' height={44} borderRadius={10} />}
                    </View>
                ))}
            </View>
        </View>
    );
}

// ── SHARED: EVENT CARD SKELETON ─────────────────────────────────────────────
function EventCardSkeleton({ tall }) {
    return (
        <View style={sk.eventCard}>
            <Bone width={70} height={24} borderRadius={6} style={{ marginBottom: 10 }} />
            <Bone width={200} height={18} borderRadius={5} style={{ marginBottom: 10 }} />
            <Bone width={160} height={13} borderRadius={4} style={{ marginBottom: 6 }} />
            <Bone width={130} height={13} borderRadius={4} style={{ marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Bone width={90} height={13} borderRadius={4} />
                <Bone width={60} height={22} borderRadius={6} />
            </View>
            <Bone width='100%' height={3} borderRadius={2} style={{ marginBottom: 12 }} />
            {tall && <Bone width='100%' height={40} borderRadius={10} />}
        </View>
    );
}

const sk = StyleSheet.create({
    container:    { flex: 1, backgroundColor: '#f8f9fb' },
    banner:       { height: 160, backgroundColor: '#e0e0e0' },
    avatarWrapper:{ alignSelf: 'center', marginTop: -55, marginBottom: 16 },
    nameSection:  { alignItems: 'center', marginBottom: 20 },
    statsRow:     { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 20, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
    statItem:     { alignItems: 'center' },
    section:      { marginTop: 24, marginHorizontal: 20 },
    pillsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    eventsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12 },
    searchRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10, marginBottom: 4 },
    resultsRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 14, marginBottom: 8 },
    detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    infoCard:     { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 },
    divider:      { height: 1, backgroundColor: '#f5f5f5', marginVertical: 8 },
    eventCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
});