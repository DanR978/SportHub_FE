import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Modal, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import * as Location from 'expo-location';
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

const ALL_SPORTS = ['Soccer','Basketball','Tennis','Volleyball','Pickleball','Baseball','Football','Handball','Softball','Dodgeball','Kickball'];
const ALL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];
const ALL_PRICES = ['Free', 'Paid'];

const cap = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

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

const CheckItem = ({ label, checked, onPress }) => (
    <TouchableOpacity style={styles.checkItem} onPress={onPress}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked && <Ionicons name="checkmark" size={13} color="#fff" />}
        </View>
        <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
);

export default function EventsScreen({ navigation }) {
    const [events, setEvents]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [refreshing, setRefreshing]   = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [search, setSearch]           = useState('');
    const [view, setView]               = useState('list');   // 'list' | 'map'
    const [filterVisible, setFilterVisible] = useState(false);

    const [selectedSports, setSelectedSports] = useState([]);
    const [selectedLevels, setSelectedLevels] = useState([]);
    const [selectedPrices, setSelectedPrices] = useState([]);

    const [tempSports, setTempSports] = useState([]);
    const [tempLevels, setTempLevels] = useState([]);
    const [tempPrices, setTempPrices] = useState([]);

    // ── FETCH ─────────────────────────────────────────────────
    const fetchEvents = useCallback(async (filters = {}) => {
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };
            const hasFilters = filters.sports?.length || filters.levels?.length;

            let url;
            if (hasFilters || userLocation) {
                const params = new URLSearchParams();
                if (userLocation) {
                    params.append('latitude', userLocation.latitude);
                    params.append('longitude', userLocation.longitude);
                    params.append('radius_miles', '20');
                }
                filters.sports?.forEach(s => params.append('sports', s.toLowerCase()));
                filters.levels?.forEach(l => params.append('experience_levels', l.toLowerCase()));
                url = `${API_URL}/sports-events/filter?${params.toString()}`;
            } else {
                url = `${API_URL}/sports-events`;
            }

            const res = await fetch(url, { headers });
            if (res.ok) setEvents(await res.json());
        } catch (e) {
            console.log('Fetch events error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userLocation]);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                setUserLocation(loc.coords);
            } else {
                fetchEvents();
            }
        })();
    }, []);

    useEffect(() => {
        if (userLocation) fetchEvents();
    }, [userLocation]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchEvents({ sports: selectedSports, levels: selectedLevels });
    }, [selectedSports, selectedLevels, userLocation]);

    // ── JOIN / LEAVE ──────────────────────────────────────────
    const joinEvent = async (eventId) => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/sports-events/${eventId}/join`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setEvents(prev => prev.map(e =>
                    e.event_id === eventId
                        ? { ...e, participant_count: (e.participant_count || 0) + 1, joined: true }
                        : e
                ));
            } else {
                const err = await res.json();
                console.log('Join error:', err.detail);
            }
        } catch (e) { console.log('Join error:', e); }
    };

    const leaveEvent = async (eventId) => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/sports-events/${eventId}/leave`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setEvents(prev => prev.map(e =>
                    e.event_id === eventId
                        ? { ...e, participant_count: Math.max((e.participant_count || 1) - 1, 0), joined: false }
                        : e
                ));
            }
        } catch (e) { console.log('Leave error:', e); }
    };

    // ── FILTERS ───────────────────────────────────────────────
    const openFilter = () => {
        setTempSports([...selectedSports]);
        setTempLevels([...selectedLevels]);
        setTempPrices([...selectedPrices]);
        setFilterVisible(true);
    };

    const applyFilters = () => {
        setSelectedSports([...tempSports]);
        setSelectedLevels([...tempLevels]);
        setSelectedPrices([...tempPrices]);
        setFilterVisible(false);
        fetchEvents({ sports: tempSports, levels: tempLevels });
    };

    const clearFilters = () => {
        setTempSports([]);
        setTempLevels([]);
        setTempPrices([]);
    };

    const toggle = (list, setList, value) => {
        setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
    };

    const activeFilterCount = selectedSports.length + selectedLevels.length + selectedPrices.length;

    const filtered = events.filter(e => {
        const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
            e.location.toLowerCase().includes(search.toLowerCase());
        const matchPrice = selectedPrices.length === 0 ||
            (selectedPrices.includes('Free') && (e.cost === 0 || e.cost === null)) ||
            (selectedPrices.includes('Paid') && e.cost > 0);
        return matchSearch && matchPrice;
    });

    // ── CARD ──────────────────────────────────────────────────
    const renderListCard = (item) => {
        const sportKey = cap(item.sport);
        const color    = SPORT_COLORS[sportKey] || '#999';
        const icon     = SPORT_ICONS[sportKey]  || 'trophy-outline';
        const isFull   = item.participant_count >= item.max_players;

        return (
            <TouchableOpacity
                style={styles.eventCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('EventDetail', { eventId: item.event_id })}
            >
                <View style={[styles.sportTag, { backgroundColor: color + '18' }]}>
                    <Ionicons name={icon} size={13} color={color} />
                    <Text style={[styles.sportTagText, { color }]}>{sportKey}</Text>
                </View>

                <Text style={styles.eventTitle}>{item.title}</Text>

                <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={13} color="#999" />
                    <Text style={styles.detailText}>{formatDate(item.start_date)} · {formatTime(item.start_time)}</Text>
                </View>

                <View style={[styles.detailItem, { marginTop: 4 }]}>
                    <Ionicons name="location-outline" size={13} color="#999" />
                    <Text style={styles.detailText}>{item.location}</Text>
                </View>

                <View style={styles.cardBottom}>
                    <View style={styles.playersRow}>
                        <Ionicons name="people-outline" size={14} color="#666" />
                        <Text style={styles.playersText}>{item.participant_count}/{item.max_players} players</Text>
                        {isFull && <View style={styles.fullBadge}><Text style={styles.fullBadgeText}>FULL</Text></View>}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelText}>{cap(item.experience_level)}</Text>
                        </View>
                        <Text style={[styles.price, item.cost > 0 && { color: '#e94560' }]}>
                            {item.cost === 0 || item.cost === null ? 'Free' : `$${item.cost}`}
                        </Text>
                    </View>
                </View>

                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, {
                        width: `${Math.min((item.participant_count / item.max_players) * 100, 100)}%`,
                        backgroundColor: color,
                    }]} />
                </View>

                {!isFull || item.joined ? (
                    <TouchableOpacity
                        style={[styles.joinBtn, item.joined && styles.leaveBtn]}
                        onPress={(e) => {
                            e.stopPropagation();
                            item.joined ? leaveEvent(item.event_id) : joinEvent(item.event_id);
                        }}
                    >
                        <Text style={styles.joinBtnText}>
                            {item.joined ? 'Leave Event' : 'Join Event'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.fullBtn}>
                        <Text style={styles.fullBtnText}>Event Full</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    // ── RENDER ────────────────────────────────────────────────
    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Explore</Text>
                <TouchableOpacity
                    style={styles.createBtn}
                    onPress={() => navigation.navigate('CreateEvent')}
                >
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
                <View style={styles.searchWrapper}>
                    <Ionicons name="search-outline" size={18} color="#999" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search events or locations..."
                        placeholderTextColor="#bbb"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color="#ccc" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
                    onPress={openFilter}
                >
                    <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? '#fff' : '#1a1a2e'} />
                    {activeFilterCount > 0 && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.resultsRow}>
                <Text style={styles.resultsCount}>{filtered.length} events</Text>
                <View style={styles.viewToggle}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
                        onPress={() => setView('list')}
                    >
                        <Ionicons name="list-outline" size={16} color={view === 'list' ? '#fff' : '#999'} />
                        <Text style={[styles.toggleLabel, view === 'list' && styles.toggleLabelActive]}>List</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, view === 'map' && styles.toggleBtnActive]}
                        onPress={() => setView('map')}
                    >
                        <Ionicons name="map-outline" size={16} color={view === 'map' ? '#fff' : '#999'} />
                        <Text style={[styles.toggleLabel, view === 'map' && styles.toggleLabelActive]}>Map</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#16a34a" />
                </View>
            ) : view === 'map' ? (
                <View style={styles.mapPlaceholder}>
                    <View style={styles.mapPlaceholderInner}>
                        <Ionicons name="map-outline" size={52} color="#ccc" />
                        <Text style={styles.mapPlaceholderText}>Map coming soon</Text>
                        <Text style={styles.mapPlaceholderSub}>Google Maps API key pending verification</Text>
                        <View style={styles.mapEventPills}>
                            {filtered.slice(0, 3).map(e => (
                                <TouchableOpacity
                                    key={e.event_id}
                                    style={[styles.mapPill, { borderLeftColor: SPORT_COLORS[cap(e.sport)] || '#999' }]}
                                    onPress={() => navigation.navigate('EventDetail', { eventId: e.event_id })}
                                >
                                    <Text style={styles.mapPillTitle} numberOfLines={1}>{e.title}</Text>
                                    <Text style={styles.mapPillSub}>{e.location}</Text>
                                </TouchableOpacity>
                            ))}
                            {filtered.length > 3 && (
                                <Text style={styles.mapPillMore}>+{filtered.length - 3} more nearby</Text>
                            )}
                        </View>
                    </View>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.event_id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.listContent, filtered.length === 0 && styles.emptyList]}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
                    renderItem={({ item }) => renderListCard(item)}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={48} color="#ddd" />
                            <Text style={styles.emptyText}>No events found</Text>
                            <Text style={styles.emptySub}>Try adjusting filters or create one!</Text>
                        </View>
                    }
                />
            )}

            <Modal visible={filterVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter Events</Text>
                            <TouchableOpacity onPress={() => setFilterVisible(false)}>
                                <Ionicons name="close" size={24} color="#1a1a2e" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.filterSection}>Sport</Text>
                            {ALL_SPORTS.map(sport => (
                                <CheckItem key={sport} label={sport} checked={tempSports.includes(sport)}
                                    onPress={() => toggle(tempSports, setTempSports, sport)} />
                            ))}
                            <Text style={styles.filterSection}>Experience Level</Text>
                            {ALL_LEVELS.map(level => (
                                <CheckItem key={level} label={level} checked={tempLevels.includes(level)}
                                    onPress={() => toggle(tempLevels, setTempLevels, level)} />
                            ))}
                            <Text style={styles.filterSection}>Price</Text>
                            {ALL_PRICES.map(price => (
                                <CheckItem key={price} label={price} checked={tempPrices.includes(price)}
                                    onPress={() => toggle(tempPrices, setTempPrices, price)} />
                            ))}
                        </ScrollView>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                                <Text style={styles.clearBtnText}>Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                                <Text style={styles.applyBtnText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container:          { flex: 1, backgroundColor: '#f8f9fb' },
    header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12 },
    headerTitle:        { fontSize: 28, fontWeight: '800', color: '#1a1a2e' },
    createBtn:          { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e94560', justifyContent: 'center', alignItems: 'center' },
    searchRow:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10 },
    searchWrapper:      { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    searchInput:        { flex: 1, fontSize: 14, color: '#1a1a2e' },
    filterBtn:          { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    filterBtnActive:    { backgroundColor: '#1a1a2e' },
    filterBadge:        { position: 'absolute', top: -4, right: -4, backgroundColor: '#e94560', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
    filterBadgeText:    { color: '#fff', fontSize: 10, fontWeight: '700' },
    resultsRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 14, marginBottom: 4 },
    resultsCount:       { fontSize: 13, color: '#999', fontWeight: '600' },
    viewToggle:         { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 3, gap: 2 },
    toggleBtn:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
    toggleBtnActive:    { backgroundColor: '#1a1a2e' },
    toggleLabel:        { fontSize: 12, fontWeight: '700', color: '#999', marginLeft: 4 },
    toggleLabelActive:  { color: '#fff' },
    loadingContainer:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent:        { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },
    emptyList:          { flex: 1 },
    emptyContainer:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 60 },
    emptyText:          { fontSize: 16, fontWeight: '700', color: '#ccc' },
    emptySub:           { fontSize: 13, color: '#ddd' },
    eventCard:          { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    sportTag:           { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, gap: 4, marginBottom: 8 },
    sportTagText:       { fontSize: 12, fontWeight: '700' },
    eventTitle:         { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
    detailItem:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailText:         { fontSize: 13, color: '#666' },
    cardBottom:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    playersRow:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
    playersText:        { fontSize: 13, color: '#666', fontWeight: '500' },
    fullBadge:          { backgroundColor: '#fee2e2', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    fullBadgeText:      { fontSize: 10, fontWeight: '800', color: '#e94560' },
    levelBadge:         { backgroundColor: '#f0f0f0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    levelText:          { fontSize: 11, fontWeight: '700', color: '#666' },
    price:              { fontSize: 13, fontWeight: '700', color: '#4CAF50' },
    progressBar:        { height: 3, backgroundColor: '#f0f0f0', borderRadius: 2, marginTop: 10 },
    progressFill:       { height: 3, borderRadius: 2 },
    joinBtn:            { marginTop: 12, backgroundColor: '#16a34a', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
    joinBtnText:        { color: '#fff', fontWeight: '700', fontSize: 14 },
    leaveBtn:           { backgroundColor: '#dc360d' },
    fullBtn:            { marginTop: 12, backgroundColor: '#f8f9fb', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
    fullBtnText:        { color: '#ccc', fontWeight: '700', fontSize: 14 },
    modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet:         { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    modalHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    modalTitle:         { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
    filterSection:      { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
    checkItem:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    checkbox:           { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#ddd', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
    checkboxChecked:    { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
    checkLabel:         { fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
    modalButtons:       { flexDirection: 'row', gap: 12, marginTop: 20 },
    clearBtn:           { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
    clearBtnText:       { fontSize: 15, fontWeight: '700', color: '#666' },
    applyBtn:           { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1a1a2e', alignItems: 'center' },
    applyBtnText:       { fontSize: 15, fontWeight: '700', color: '#fff' },
    mapPlaceholder:     { flex: 1, padding: 20 },
    mapPlaceholderInner:{ flex: 1, backgroundColor: '#fff', borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    mapPlaceholderText: { fontSize: 18, fontWeight: '800', color: '#ccc', marginTop: 8 },
    mapPlaceholderSub:  { fontSize: 13, color: '#ddd', marginBottom: 16 },
    mapEventPills:      { width: '100%', paddingHorizontal: 24, gap: 8 },
    mapPill:            { backgroundColor: '#f8f9fb', borderRadius: 10, padding: 12, borderLeftWidth: 3 },
    mapPillTitle:       { fontSize: 13, fontWeight: '700', color: '#1a1a2e' },
    mapPillSub:         { fontSize: 12, color: '#999', marginTop: 2 },
    mapPillMore:        { textAlign: 'center', fontSize: 13, color: '#bbb', fontWeight: '600', marginTop: 4 },
});