import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const SAMPLE_EVENTS = [
    {
        id: '1',
        title: 'Sunday Pickup Soccer',
        sport: 'Soccer',
        date: 'Sun, Feb 23',
        time: '5:00 PM',
        location: 'Kirklevington Park',
        distance: '1.2 mi',
        experience: 'All Levels',
        players: 8,
        maxPlayers: 14,
        free: true,
    },
    {
        id: '2',
        title: 'Saturday Basketball 3v3',
        sport: 'Basketball',
        date: 'Sat, Feb 22',
        time: '10:00 AM',
        location: 'Rupp Arena Courts',
        distance: '2.5 mi',
        experience: 'Intermediate',
        players: 4,
        maxPlayers: 6,
        free: true,
    },
    {
        id: '3',
        title: 'Tennis Doubles League',
        sport: 'Tennis',
        date: 'Mon, Feb 24',
        time: '7:00 PM',
        location: 'Lexington Tennis Club',
        distance: '3.8 mi',
        experience: 'Advanced',
        players: 2,
        maxPlayers: 4,
        free: false,
        price: '$5',
    },
    {
        id: '4',
        title: 'Pickleball Friday Mixer',
        sport: 'Pickleball',
        date: 'Fri, Feb 28',
        time: '6:30 PM',
        location: 'Tates Creek Centre',
        distance: '4.1 mi',
        experience: 'Beginner',
        players: 6,
        maxPlayers: 12,
        free: true,
    },
    {
        id: '5',
        title: 'Volleyball Beach Day',
        sport: 'Volleyball',
        date: 'Sat, Mar 1',
        time: '2:00 PM',
        location: 'Veterans Park',
        distance: '5.0 mi',
        experience: 'All Levels',
        players: 3,
        maxPlayers: 10,
        free: true,
    },
];

const SPORT_COLORS = {
    Soccer: '#4CAF50',
    Basketball: '#FF9800',
    Tennis: '#2196F3',
    Volleyball: '#9C27B0',
    Pickleball: '#e94560',
    Baseball: '#795548',
    Football: '#607D8B',
    Rugby: '#F44336',
    Hockey: '#00BCD4',
    Golf: '#8BC34A',
    Cricket: '#FF5722',
    Handball: '#E91E63',
    Lacrosse: '#3F51B5',
    Softball: '#FFC107',
    Dodgeball: '#009688',
    Kickball: '#FF9800',
    Futsal: '#4CAF50',
    Waterpolo: '#03A9F4',
    Polo: '#9E9E9E',
    Bowling: '#673AB7',
};

const SPORT_ICONS = {
    Soccer: 'football-outline',
    Basketball: 'basketball-outline',
    Tennis: 'tennisball-outline',
    Volleyball: 'baseball-outline',
    Pickleball: 'baseball-outline',
    Baseball: 'baseball-outline',
    Football: 'american-football-outline',
    Handball: 'hand-left-outline',
    Softball: 'baseball-outline',
    Dodgeball: 'radio-button-on-outline',
    Kickball: 'football-outline',
};

const ALL_SPORTS = [
    'Soccer', 'Basketball', 'Tennis', 'Volleyball', 'Pickleball',
    'Baseball', 'Football','Handball', 'Softball', 'Dodgeball',
    'Kickball',
];

const ALL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];
const ALL_PRICES = ['Free', 'Paid'];

export default function EventsScreen() {
    const [search, setSearch] = useState('');
    const [view, setView] = useState('list');
    const [filterVisible, setFilterVisible] = useState(false);

    const [selectedSports, setSelectedSports] = useState([]);
    const [selectedLevels, setSelectedLevels] = useState([]);
    const [selectedPrices, setSelectedPrices] = useState([]);

    const [tempSports, setTempSports] = useState([]);
    const [tempLevels, setTempLevels] = useState([]);
    const [tempPrices, setTempPrices] = useState([]);

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
    };

    const clearFilters = () => {
        setTempSports([]);
        setTempLevels([]);
        setTempPrices([]);
    };

    const toggle = (list, setList, value) => {
        if (list.includes(value)) {
            setList(list.filter(v => v !== value));
        } else {
            setList([...list, value]);
        }
    };

    const activeFilterCount = selectedSports.length + selectedLevels.length + selectedPrices.length;

    const filtered = SAMPLE_EVENTS.filter(e => {
        const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
            e.location.toLowerCase().includes(search.toLowerCase());
        const matchSport = selectedSports.length === 0 || selectedSports.includes(e.sport);
        const matchLevel = selectedLevels.length === 0 || selectedLevels.includes(e.experience);
        const matchPrice = selectedPrices.length === 0 ||
            (selectedPrices.includes('Free') && e.free) ||
            (selectedPrices.includes('Paid') && !e.free);
        return matchSearch && matchSport && matchLevel && matchPrice;
    });

    const CheckItem = ({ label, checked, onPress }) => (
        <TouchableOpacity style={styles.checkItem} onPress={onPress}>
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked && <Ionicons name="checkmark" size={13} color="#fff" />}
            </View>
            <Text style={styles.checkLabel}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Nearby Events</Text>
                <TouchableOpacity style={styles.createBtn}>
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* SEARCH + FILTER ROW */}
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

                {/* FILTER BUTTON — always visible */}
                <TouchableOpacity
                    style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
                    onPress={openFilter}
                >
                    <Ionicons
                        name="options-outline"
                        size={20}
                        color={activeFilterCount > 0 ? '#fff' : '#1a1a2e'}
                    />
                    {activeFilterCount > 0 && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* RESULTS ROW */}
            <View style={styles.resultsRow}>
                <Text style={styles.resultsCount}>{filtered.length} events found</Text>
                <View style={styles.viewToggle}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
                        onPress={() => setView('list')}
                    >
                        <Ionicons name="list-outline" size={18} color={view === 'list' ? '#fff' : '#999'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, view === 'grid' && styles.toggleBtnActive]}
                        onPress={() => setView('grid')}
                    >
                        <Ionicons name="grid-outline" size={18} color={view === 'grid' ? '#fff' : '#999'} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* EVENTS LIST */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                numColumns={view === 'grid' ? 2 : 1}
                key={view}
                renderItem={({ item }) =>
                    view === 'list' ? (
                        <TouchableOpacity style={styles.eventCard}>
                            <View style={[styles.sportTag, { backgroundColor: (SPORT_COLORS[item.sport] || '#999') + '18' }]}>
                                <Ionicons name={SPORT_ICONS[item.sport] || 'trophy-outline'} size={13} color={SPORT_COLORS[item.sport] || '#999'} />
                                <Text style={[styles.sportTagText, { color: SPORT_COLORS[item.sport] || '#999' }]}>{item.sport}</Text>
                            </View>
                            <Text style={styles.eventTitle}>{item.title}</Text>
                            <View style={styles.detailItem}>
                                <Ionicons name="calendar-outline" size={13} color="#999" />
                                <Text style={styles.detailText}>{item.date} · {item.time}</Text>
                            </View>
                            <View style={[styles.detailItem, { marginTop: 4 }]}>
                                <Ionicons name="location-outline" size={13} color="#999" />
                                <Text style={styles.detailText}>{item.location} · {item.distance}</Text>
                            </View>
                            <View style={styles.cardBottom}>
                                <View style={styles.playersRow}>
                                    <Ionicons name="people-outline" size={14} color="#666" />
                                    <Text style={styles.playersText}>{item.players}/{item.maxPlayers} players</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={styles.levelBadge}>
                                        <Text style={styles.levelText}>{item.experience}</Text>
                                    </View>
                                    <Text style={[styles.price, !item.free && { color: '#e94560' }]}>
                                        {item.free ? 'Free' : item.price}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, {
                                    width: `${(item.players / item.maxPlayers) * 100}%`,
                                    backgroundColor: SPORT_COLORS[item.sport] || '#999'
                                }]} />
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.gridCard}>
                            <View style={[styles.gridSportDot, { backgroundColor: SPORT_COLORS[item.sport] || '#999' }]} />
                            <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
                            <Text style={styles.gridDate}>{item.date}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="people-outline" size={12} color="#999" />
                                <Text style={styles.gridPlayers}> {item.players}/{item.maxPlayers}</Text>
                            </View>
                        </TouchableOpacity>
                    )
                }
            />

            {/* FILTER MODAL */}
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
                                <CheckItem
                                    key={sport}
                                    label={sport}
                                    checked={tempSports.includes(sport)}
                                    onPress={() => toggle(tempSports, setTempSports, sport)}
                                />
                            ))}

                            <Text style={styles.filterSection}>Experience Level</Text>
                            {ALL_LEVELS.map(level => (
                                <CheckItem
                                    key={level}
                                    label={level}
                                    checked={tempLevels.includes(level)}
                                    onPress={() => toggle(tempLevels, setTempLevels, level)}
                                />
                            ))}

                            <Text style={styles.filterSection}>Price</Text>
                            {ALL_PRICES.map(price => (
                                <CheckItem
                                    key={price}
                                    label={price}
                                    checked={tempPrices.includes(price)}
                                    onPress={() => toggle(tempPrices, setTempPrices, price)}
                                />
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
    container: { flex: 1, backgroundColor: '#f8f9fb' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#1a1a2e' },
    createBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e94560', justifyContent: 'center', alignItems: 'center' },
    searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10 },
    searchWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    searchInput: { flex: 1, fontSize: 14, color: '#1a1a2e' },
    filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    filterBtnActive: { backgroundColor: '#1a1a2e' },
    filterBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#e94560', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
    filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    resultsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 14, marginBottom: 4 },
    resultsCount: { fontSize: 13, color: '#999', fontWeight: '600' },
    viewToggle: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 3, gap: 2 },
    toggleBtn: { padding: 6, borderRadius: 8 },
    toggleBtnActive: { backgroundColor: '#1a1a2e' },
    listContent: { paddingHorizontal: 20, paddingBottom: 20 },
    eventCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    sportTag: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, gap: 4, marginBottom: 8 },
    sportTagText: { fontSize: 12, fontWeight: '700' },
    eventTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailText: { fontSize: 13, color: '#666' },
    cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    playersRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    playersText: { fontSize: 13, color: '#666', fontWeight: '500' },
    levelBadge: { backgroundColor: '#f0f0f0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    levelText: { fontSize: 11, fontWeight: '700', color: '#666' },
    price: { fontSize: 13, fontWeight: '700', color: '#4CAF50' },
    progressBar: { height: 3, backgroundColor: '#f0f0f0', borderRadius: 2, marginTop: 10 },
    progressFill: { height: 3, borderRadius: 2 },
    gridCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, margin: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
    gridSportDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8 },
    gridTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
    gridDate: { fontSize: 11, color: '#999', marginBottom: 8 },
    gridPlayers: { fontSize: 11, color: '#999' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
    filterSection: { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
    checkItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#ddd', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
    checkLabel: { fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
    modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
    clearBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
    clearBtnText: { fontSize: 15, fontWeight: '700', color: '#666' },
    applyBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1a1a2e', alignItems: 'center' },
    applyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});