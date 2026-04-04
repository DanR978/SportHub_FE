import {
    View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList,
    Modal, ScrollView, RefreshControl, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getToken } from '../services/auth';
import { API_URL, GOOGLE_MAPS_API_KEY } from '../config';
import AdBanner, { AdBannerInline } from './AdBanner';

const { width: SW } = Dimensions.get('window');

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
const RADIUS_OPTIONS = [5, 10, 25, 50, 100];
const DEFAULT_RADIUS = 25;
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
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
};

const CLEAN_MAP_STYLE = [
    { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.government', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.sports_complex', stylers: [{ visibility: 'on' }] },
    { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];


function offsetMarkers(events) {
    const groups = {};
    events.forEach(e => {
        if (!e.latitude || !e.longitude) return;
        const key = `${e.latitude.toFixed(4)},${e.longitude.toFixed(4)}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(e);
    });
    const result = {};
    Object.values(groups).forEach(group => {
        if (group.length === 1) {
            result[group[0].event_id] = { latitude: group[0].latitude, longitude: group[0].longitude };
        } else {
            const radius = 0.0003; // ~30 meters
            group.forEach((e, i) => {
                const angle = (2 * Math.PI * i) / group.length;
                result[e.event_id] = {
                    latitude: e.latitude + radius * Math.cos(angle),
                    longitude: e.longitude + radius * Math.sin(angle),
                };
            });
        }
    });
    return result;
}


const CheckItem = ({ label, checked, onPress }) => (
    <TouchableOpacity style={styles.checkItem} onPress={onPress}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked && <Ionicons name="checkmark" size={13} color="#fff" />}
        </View>
        <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
);

export default function EventsScreen({ navigation }) {
    const [events, setEvents]             = useState([]);
    const [loading, setLoading]           = useState(true);
    const [refreshing, setRefreshing]     = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [search, setSearch]             = useState('');
    const [view, setView]                 = useState('list');
    const [filterVisible, setFilterVisible] = useState(false);
    const [selectedSports, setSelectedSports] = useState([]);
    const [selectedLevels, setSelectedLevels] = useState([]);
    const [selectedPrices, setSelectedPrices] = useState([]);
    const [tempSports, setTempSports] = useState([]);
    const [tempLevels, setTempLevels] = useState([]);
    const [tempPrices, setTempPrices] = useState([]);

    // Distance radius
    const [selectedRadius, setSelectedRadius] = useState(DEFAULT_RADIUS);
    const [tempRadius, setTempRadius] = useState(DEFAULT_RADIUS);

    // Date range filter
    const [selectedDateFrom, setSelectedDateFrom] = useState(null);
    const [selectedDateTo, setSelectedDateTo] = useState(null);
    const [tempDateFrom, setTempDateFrom] = useState(null);
    const [tempDateTo, setTempDateTo] = useState(null);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    // Quick chip
    const [selectedMapEvent, setSelectedMapEvent] = useState(null);
    const [locationReady, setLocationReady] = useState(false);
    const mapRef = useRef(null);

    // Autocomplete
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef(null);

    // ── Date filter helpers ─────────────────────────────────────
    const pad2 = n => String(n).padStart(2, '0');
    const fmtDate = d => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
    const fmtDateDisplay = d => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

    const today = new Date(); today.setHours(0,0,0,0);

    // ── Archive expired events then fetch fresh list ─────────────
    const archiveThenFetch = useCallback(async (filters = {}) => {
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };

            // Archive expired events first so they don't come back
            await fetch(`${API_URL}/sports-events/archive-expired`, {
                method: 'POST', headers,
            }).catch(() => {});

            // Now fetch fresh events
            const hasFilters = filters.sports?.length || filters.levels?.length || filters.dateFrom;
            let url;
            if (hasFilters || userLocation) {
                const params = new URLSearchParams();
                if (userLocation) {
                    params.append('latitude', userLocation.latitude);
                    params.append('longitude', userLocation.longitude);
                    params.append('radius_miles', String(filters.radius ?? selectedRadius));
                }
                filters.sports?.forEach(s => params.append('sports', s.toLowerCase()));
                filters.levels?.forEach(l => params.append('experience_levels', l.toLowerCase()));
                // Date range
                if (filters.dateFrom) {
                    params.append('start_from', fmtDate(filters.dateFrom));
                    if (filters.dateTo) params.append('date_to', fmtDate(filters.dateTo));
                }
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

    // ── Get location once ────────────────────────────────────────
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                setUserLocation(loc.coords);
            }
            setLocationReady(true);
        })();
    }, []);

    // Helper to build current filter args
    const buildFilterArgs = (overrides = {}) => ({
        sports: overrides.sports ?? selectedSports,
        levels: overrides.levels ?? selectedLevels,
        dateFrom: overrides.dateFrom ?? selectedDateFrom,
        dateTo: overrides.dateTo ?? selectedDateTo,
        radius: overrides.radius ?? selectedRadius,
    });

    // Fetch once location is ready
    useEffect(() => {
        if (locationReady) archiveThenFetch(buildFilterArgs());
    }, [locationReady]);

    // ── Auto-refresh every time screen comes into focus ──────────
    useFocusEffect(
        useCallback(() => {
            if (locationReady) {
                archiveThenFetch(buildFilterArgs());
            }
        }, [locationReady, selectedSports, selectedLevels, selectedDateFrom, selectedDateTo, selectedRadius, userLocation])
    );

    // ── Pull to refresh ──────────────────────────────────────────
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        archiveThenFetch(buildFilterArgs());
    }, [selectedSports, selectedLevels, selectedDateFrom, selectedDateTo, selectedRadius, userLocation]);

    // ── Join / Leave ─────────────────────────────────────────────
    const joinEvent = async (eventId) => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/sports-events/${eventId}/join`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setEvents(prev => prev.map(e =>
                e.event_id === eventId ? { ...e, participant_count: (e.participant_count || 0) + 1, joined: true } : e
            ));
        } catch (e) { console.log('Join error:', e); }
    };

    const leaveEvent = async (eventId) => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/sports-events/${eventId}/leave`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setEvents(prev => prev.map(e =>
                e.event_id === eventId ? { ...e, participant_count: Math.max((e.participant_count || 1) - 1, 0), joined: false } : e
            ));
        } catch (e) { console.log('Leave error:', e); }
    };

    // ── Filters ──────────────────────────────────────────────────
    const openFilter = () => {
        setTempSports([...selectedSports]); setTempLevels([...selectedLevels]); setTempPrices([...selectedPrices]);
        setTempDateFrom(selectedDateFrom); setTempDateTo(selectedDateTo);
        setTempRadius(selectedRadius);
        setShowFromPicker(false); setShowToPicker(false);
        setFilterVisible(true);
    };
    const applyFilters = () => {
        setSelectedSports([...tempSports]); setSelectedLevels([...tempLevels]); setSelectedPrices([...tempPrices]);
        setSelectedDateFrom(tempDateFrom); setSelectedDateTo(tempDateTo);
        setSelectedRadius(tempRadius);
        setFilterVisible(false);
        archiveThenFetch({ sports: tempSports, levels: tempLevels, dateFrom: tempDateFrom, dateTo: tempDateTo, radius: tempRadius });
    };
    const clearFilters = () => {
        setTempSports([]); setTempLevels([]); setTempPrices([]);
        setTempDateFrom(null); setTempDateTo(null);
        setTempRadius(DEFAULT_RADIUS);
        setShowFromPicker(false); setShowToPicker(false);
    };
    const toggle = (list, setList, value) => setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);

    const hasDateFilter = selectedDateFrom;
    const activeFilterCount = selectedSports.length + selectedLevels.length + selectedPrices.length + (hasDateFilter ? 1 : 0) + (selectedRadius !== DEFAULT_RADIUS ? 1 : 0);
    const filtered = events.filter(e => {
        const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.location.toLowerCase().includes(search.toLowerCase());
        const matchPrice = selectedPrices.length === 0 || (selectedPrices.includes('Free') && (e.cost === 0 || e.cost === null)) || (selectedPrices.includes('Paid') && e.cost > 0);
        return matchSearch && matchPrice;
    });

    // ── Autocomplete ─────────────────────────────────────────────
    const fetchSuggestions = useCallback((text) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!text || text.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_MAPS_API_KEY}&types=geocode`);
                const data = await res.json();
                if (data.predictions?.length) { setSuggestions(data.predictions.slice(0, 4)); setShowSuggestions(true); }
                else { setSuggestions([]); setShowSuggestions(false); }
            } catch (e) { console.log('Autocomplete error:', e); }
        }, 350);
    }, []);

    const selectSuggestion = async (s) => {
        setSearch(s.structured_formatting?.main_text || s.description);
        setSuggestions([]); setShowSuggestions(false);
        try {
            const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${s.place_id}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`);
            const data = await res.json();
            if (data.result?.geometry?.location && view === 'map' && mapRef.current) {
                const { lat, lng } = data.result.geometry.location;
                mapRef.current.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 600);
            }
        } catch {}
    };

    const handleSearchChange = (text) => { setSearch(text); fetchSuggestions(text); };

    // ── Render card ──────────────────────────────────────────────
    const renderListCard = (item) => {
        const sportKey  = cap(item.sport);
        const color     = SPORT_COLORS[sportKey] || '#999';
        const icon      = SPORT_ICONS[sportKey]  || 'trophy-outline';
        const isFull    = item.participant_count >= item.max_players;
        const hosting   = item.is_organizer;

        return (
            <TouchableOpacity
                style={[styles.eventCard, hosting && styles.eventCardHosting]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('EventDetail', { eventId: item.event_id })}
            >
                {/* Sport tag + hosting badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <View style={[styles.sportTag, { backgroundColor: color + '18' }]}>
                        <Ionicons name={icon} size={13} color={color} />
                        <Text style={[styles.sportTagText, { color }]}>{sportKey}</Text>
                    </View>
                    {hosting && (
                        <View style={styles.hostingTag}>
                            <Ionicons name="megaphone" size={11} color="#3b82f6" />
                            <Text style={styles.hostingTagText}>Hosting</Text>
                        </View>
                    )}
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
                        <View style={styles.levelBadge}><Text style={styles.levelText}>{cap(item.experience_level)}</Text></View>
                        <Text style={[styles.price, item.cost > 0 && { color: '#e94560' }]}>{item.cost === 0 || item.cost === null ? 'Free' : `$${item.cost}`}</Text>
                    </View>
                </View>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min((item.participant_count / item.max_players) * 100, 100)}%`, backgroundColor: color }]} />
                </View>

                {/* Bottom action — Hosting / Join / Leave / Full */}
                {hosting ? (
                    <View style={styles.hostingBtn}>
                        <Ionicons name="megaphone-outline" size={16} color="#3b82f6" />
                        <Text style={styles.hostingBtnText}>You're hosting this event</Text>
                    </View>
                ) : !isFull || item.joined ? (
                    <TouchableOpacity
                        style={[styles.joinBtn, item.joined && styles.leaveBtn]}
                        onPress={() => item.joined ? leaveEvent(item.event_id) : joinEvent(item.event_id)}
                    >
                        <Text style={styles.joinBtnText}>{item.joined ? 'Leave Event' : 'Join Event'}</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.fullBtn}><Text style={styles.fullBtnText}>Event Full</Text></View>
                )}
            </TouchableOpacity>
        );
    };

    // ── Map View ─────────────────────────────────────────────────
    const renderMapView = () => {
    const offsets = offsetMarkers(filtered);
    return (
        <View style={{ flex: 1 }}>
            <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={{
                    latitude: userLocation?.latitude || 37.78,
                    longitude: userLocation?.longitude || -122.42,
                    latitudeDelta: 0.08, longitudeDelta: 0.08,
                }}
                showsUserLocation
                showsMyLocationButton={false}
                customMapStyle={CLEAN_MAP_STYLE}
            >
                {filtered.map(event => {
                    const coords = offsets[event.event_id];
                    if (!coords) return null;
                    const sk = cap(event.sport);
                    const col = SPORT_COLORS[sk] || '#999';
                    const ico = SPORT_ICONS[sk] || 'trophy-outline';
                    return (
                        <Marker key={event.event_id}
                            coordinate={coords}
                            onPress={() => navigation.navigate('EventDetail', { eventId: event.event_id })}
                        >
                            <View style={[styles.mapMarker, { backgroundColor: col }]}>
                                <Ionicons name={ico} size={16} color="#fff" />
                            </View>
                        </Marker>
                    );
                })}
            </MapView>

            {selectedMapEvent && (
                <TouchableOpacity style={styles.mapEventCard} activeOpacity={0.9}
                    onPress={() => { navigation.navigate('EventDetail', { eventId: selectedMapEvent.event_id }); setSelectedMapEvent(null); }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={[styles.sportTag, { backgroundColor: (SPORT_COLORS[cap(selectedMapEvent.sport)] || '#999') + '18' }]}>
                            <Ionicons name={SPORT_ICONS[cap(selectedMapEvent.sport)] || 'trophy-outline'} size={13} color={SPORT_COLORS[cap(selectedMapEvent.sport)] || '#999'} />
                            <Text style={[styles.sportTagText, { color: SPORT_COLORS[cap(selectedMapEvent.sport)] }]}>{cap(selectedMapEvent.sport)}</Text>
                        </View>
                        {selectedMapEvent.is_organizer && (
                            <View style={styles.hostingTag}>
                                <Ionicons name="megaphone" size={11} color="#3b82f6" />
                                <Text style={styles.hostingTagText}>Hosting</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.eventTitle} numberOfLines={1}>{selectedMapEvent.title}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.detailText}>{formatDate(selectedMapEvent.start_date)} · {formatTime(selectedMapEvent.start_time)}</Text>
                        <Text style={styles.playersText}>{selectedMapEvent.participant_count}/{selectedMapEvent.max_players} players</Text>
                    </View>
                </TouchableOpacity>
            )}
        </View>
        );
    };

    // ── Skeleton ─────────────────────────────────────────────────
    const renderSkeleton = () => (
        <View style={{ flex: 1 }}>
            <ScrollView style={{ paddingHorizontal: 20, paddingTop: 8 }} showsVerticalScrollIndicator={false} scrollEnabled={false}>
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </ScrollView>
        </View>
    );

    // ── RENDER ───────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Explore</Text>
                <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreateEvent')}>
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Search with autocomplete */}
            <View style={{ zIndex: 10 }}>
                <View style={styles.searchRow}>
                    <View style={styles.searchWrapper}>
                        <Ionicons name="search-outline" size={18} color="#999" style={{ marginRight: 8 }} />
                        <TextInput style={styles.searchInput} placeholder="Search events or locations..." placeholderTextColor="#bbb"
                            value={search} onChangeText={handleSearchChange}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => { setSearch(''); setSuggestions([]); setShowSuggestions(false); }}>
                                <Ionicons name="close-circle" size={18} color="#ccc" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]} onPress={openFilter}>
                        <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? '#fff' : '#1a1a2e'} />
                        {activeFilterCount > 0 && <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeFilterCount}</Text></View>}
                    </TouchableOpacity>
                </View>

                {showSuggestions && suggestions.length > 0 && (
                    <View style={styles.suggestionsBox}>
                        {suggestions.map((s, i) => (
                            <TouchableOpacity key={s.place_id || i} style={[styles.suggestionRow, i < suggestions.length - 1 && styles.suggestionBorder]}
                                onPress={() => selectSuggestion(s)}>
                                <Ionicons name="location" size={16} color="#16a34a" style={{ marginRight: 10 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.suggestionMain} numberOfLines={1}>{s.structured_formatting?.main_text}</Text>
                                    <Text style={styles.suggestionSub} numberOfLines={1}>{s.structured_formatting?.secondary_text}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Toggle — always visible */}
            <View style={styles.resultsRow}>
                <Text style={styles.resultsCount}>{loading ? '...' : `${filtered.length} events`}</Text>
                <View style={styles.viewToggle}>
                    <TouchableOpacity style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]} onPress={() => setView('list')}>
                        <Ionicons name="list-outline" size={16} color={view === 'list' ? '#fff' : '#999'} />
                        <Text style={[styles.toggleLabel, view === 'list' && styles.toggleLabelActive]}>List</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.toggleBtn, view === 'map' && styles.toggleBtnActive]} onPress={() => setView('map')}>
                        <Ionicons name="map-outline" size={16} color={view === 'map' ? '#fff' : '#999'} />
                        <Text style={[styles.toggleLabel, view === 'map' && styles.toggleLabelActive]}>Map</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? renderSkeleton() : view === 'map' ? renderMapView() : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.event_id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.listContent, filtered.length === 0 && styles.emptyList]}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
                    renderItem={({ item, index }) => (
                        <>
                            {renderListCard(item)}
                            {(index + 1) % 5 === 0 && index < filtered.length - 1 && (
                                <AdBannerInline key={`ad-${index}`} />
                            )}
                        </>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={48} color="#ddd" />
                            <Text style={styles.emptyText}>No events found</Text>
                            <Text style={styles.emptySub}>Try adjusting filters or create one!</Text>
                        </View>
                    }
                />
            )}

            {/* Filter Modal — pageSheet per Apple HIG */}
            <Modal visible={filterVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFilterVisible(false)}>
                <View style={styles.filterContainer}>
                    <View style={styles.filterHeader}>
                        <TouchableOpacity onPress={() => setFilterVisible(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                            <Text style={styles.filterCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.filterHeaderTitle}>Filter Events</Text>
                        <TouchableOpacity onPress={applyFilters} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                            <Text style={styles.filterApplyText}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.filterBody} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                        {/* DATE RANGE */}
                        <Text style={styles.filterSection}>Date range</Text>
                        <View style={styles.dateRangeRow}>
                            <TouchableOpacity style={[styles.datePickerBtn, tempDateFrom && styles.datePickerBtnActive]}
                                onPress={() => { setShowFromPicker(!showFromPicker); setShowToPicker(false); }}>
                                <Ionicons name="calendar-outline" size={16} color={tempDateFrom ? '#16a34a' : '#999'} />
                                <Text style={[styles.datePickerBtnText, tempDateFrom && { color: '#1a1a2e' }]}>
                                    {tempDateFrom ? fmtDateDisplay(tempDateFrom) : 'From date'}
                                </Text>
                                {tempDateFrom && (
                                    <TouchableOpacity onPress={() => { setTempDateFrom(null); setShowFromPicker(false); }} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                                        <Ionicons name="close-circle" size={16} color="#ccc" />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                            <Ionicons name="arrow-forward" size={14} color="#ccc" />
                            <TouchableOpacity style={[styles.datePickerBtn, tempDateTo && styles.datePickerBtnActive]}
                                onPress={() => { setShowToPicker(!showToPicker); setShowFromPicker(false); }}>
                                <Ionicons name="calendar-outline" size={16} color={tempDateTo ? '#16a34a' : '#999'} />
                                <Text style={[styles.datePickerBtnText, tempDateTo && { color: '#1a1a2e' }]}>
                                    {tempDateTo ? fmtDateDisplay(tempDateTo) : 'To date'}
                                </Text>
                                {tempDateTo && (
                                    <TouchableOpacity onPress={() => { setTempDateTo(null); setShowToPicker(false); }} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                                        <Ionicons name="close-circle" size={16} color="#ccc" />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        </View>
                        {showFromPicker && (
                            <View style={styles.inlinePicker}>
                                <DateTimePicker
                                    value={tempDateFrom || today}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                    minimumDate={today}
                                    onChange={(_, d) => { if (d) { setTempDateFrom(d); if (tempDateTo && d > tempDateTo) setTempDateTo(null); } if (Platform.OS === 'android') setShowFromPicker(false); }}
                                    style={Platform.OS === 'ios' ? { alignSelf: 'center' } : {}}
                                />
                                {Platform.OS === 'ios' && (
                                    <TouchableOpacity style={styles.pickerDoneBtn} onPress={() => setShowFromPicker(false)}>
                                        <Text style={styles.pickerDoneText}>Done</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                        {showToPicker && (
                            <View style={styles.inlinePicker}>
                                <DateTimePicker
                                    value={tempDateTo || tempDateFrom || today}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                    minimumDate={tempDateFrom || today}
                                    onChange={(_, d) => { if (d) setTempDateTo(d); if (Platform.OS === 'android') setShowToPicker(false); }}
                                    style={Platform.OS === 'ios' ? { alignSelf: 'center' } : {}}
                                />
                                {Platform.OS === 'ios' && (
                                    <TouchableOpacity style={styles.pickerDoneBtn} onPress={() => setShowToPicker(false)}>
                                        <Text style={styles.pickerDoneText}>Done</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* DISTANCE */}
                        <Text style={styles.filterSection}>Distance</Text>
                        <View style={styles.radiusRow}>
                            {RADIUS_OPTIONS.map(r => (
                                <TouchableOpacity
                                    key={r}
                                    style={[styles.radiusChip, tempRadius === r && styles.radiusChipActive]}
                                    onPress={() => setTempRadius(r)}
                                >
                                    <Text style={[styles.radiusChipText, tempRadius === r && styles.radiusChipTextActive]}>
                                        {r} mi
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* SPORT */}
                        <Text style={styles.filterSection}>Sport</Text>
                        {ALL_SPORTS.map(sport => <CheckItem key={sport} label={sport} checked={tempSports.includes(sport)} onPress={() => toggle(tempSports, setTempSports, sport)} />)}

                        {/* LEVEL */}
                        <Text style={styles.filterSection}>Experience Level</Text>
                        {ALL_LEVELS.map(level => <CheckItem key={level} label={level} checked={tempLevels.includes(level)} onPress={() => toggle(tempLevels, setTempLevels, level)} />)}

                        {/* PRICE */}
                        <Text style={styles.filterSection}>Price</Text>
                        {ALL_PRICES.map(price => <CheckItem key={price} label={price} checked={tempPrices.includes(price)} onPress={() => toggle(tempPrices, setTempPrices, price)} />)}
                    </ScrollView>

                    {/* Bottom bar */}
                    <View style={styles.filterBottomBar}>
                        <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                            <Text style={styles.clearBtnText}>Clear All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                            <Text style={styles.applyBtnText}>Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
    const shimmer = useRef(new Animated.Value(-SW)).current;
    useEffect(() => {
        const anim = Animated.loop(Animated.timing(shimmer, { toValue: SW, duration: 1200, useNativeDriver: true }));
        anim.start();
        return () => anim.stop();
    }, []);
    const Bone = ({ width, height, borderRadius = 8, style }) => (
        <View style={[{ width, height, borderRadius, backgroundColor: '#e8e8e8', overflow: 'hidden' }, style]}>
            <Animated.View style={{ flex: 1, transform: [{ translateX: shimmer }] }}>
                <LinearGradient colors={['#e8e8e8','#f5f5f5','#e8e8e8']} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
        </View>
    );
    return (
        <View style={styles.eventCard}>
            <Bone width={70} height={24} borderRadius={6} style={{ marginBottom: 10 }} />
            <Bone width={200} height={18} borderRadius={5} style={{ marginBottom: 10 }} />
            <Bone width={160} height={13} borderRadius={4} style={{ marginBottom: 6 }} />
            <Bone width={130} height={13} borderRadius={4} style={{ marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Bone width={90} height={13} borderRadius={4} />
                <Bone width={60} height={22} borderRadius={6} />
            </View>
            <Bone width="100%" height={3} borderRadius={2} style={{ marginBottom: 12 }} />
            <Bone width="100%" height={40} borderRadius={10} />
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
    suggestionsBox:     { marginHorizontal: 20, marginTop: 4, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#f0f0f0', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    suggestionRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
    suggestionBorder:   { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    suggestionMain:     { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
    suggestionSub:      { fontSize: 12, color: '#999', marginTop: 1 },
    resultsRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 14, marginBottom: 4 },
    resultsCount:       { fontSize: 13, color: '#999', fontWeight: '600' },
    viewToggle:         { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 3, gap: 2 },
    toggleBtn:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
    toggleBtnActive:    { backgroundColor: '#1a1a2e' },
    toggleLabel:        { fontSize: 12, fontWeight: '700', color: '#999', marginLeft: 4 },
    toggleLabelActive:  { color: '#fff' },
    listContent:        { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 },
    emptyList:          { flex: 1 },
    emptyContainer:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 60 },
    emptyText:          { fontSize: 16, fontWeight: '700', color: '#ccc' },
    emptySub:           { fontSize: 13, color: '#ddd' },
    // Cards
    eventCard:          { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    eventCardHosting:   { backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: '#bfdbfe' },
    sportTag:           { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, gap: 4 },
    sportTagText:       { fontSize: 12, fontWeight: '700' },
    hostingTag:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dbeafe', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    hostingTagText:     { fontSize: 11, fontWeight: '700', color: '#3b82f6' },
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
    hostingBtn:         { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#dbeafe', borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: '#93c5fd' },
    hostingBtnText:     { color: '#3b82f6', fontWeight: '700', fontSize: 14 },
    // Map
    mapMarker:          { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
    mapEventCard:       { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
    // Filter modal — pageSheet
    filterContainer:    { flex: 1, backgroundColor: '#f8f9fb' },
    filterHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 30, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    filterCancelText:   { fontSize: 16, color: '#999', fontWeight: '600' },
    filterHeaderTitle:  { fontSize: 17, fontWeight: '800', color: '#1a1a2e' },
    filterApplyText:    { fontSize: 16, color: '#16a34a', fontWeight: '800' },
    filterBody:         { flex: 1, paddingHorizontal: 20 },
    filterBottomBar:    { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 34, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    filterSection:      { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
    dateRangeRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
    datePickerBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8f9fb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1.5, borderColor: '#f0f0f0' },
    datePickerBtnActive:{ borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
    datePickerBtnText:  { fontSize: 13, fontWeight: '500', color: '#bbb', flex: 1 },
    inlinePicker:       { backgroundColor: '#f8f9fb', borderRadius: 12, marginTop: 10, paddingBottom: 8, overflow: 'hidden' },
    pickerDoneBtn:      { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8 },
    pickerDoneText:     { fontSize: 15, fontWeight: '700', color: '#16a34a' },
    checkItem:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    checkbox:           { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#ddd', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
    checkboxChecked:    { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
    checkLabel:         { fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
    clearBtn:           { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
    clearBtnText:       { fontSize: 15, fontWeight: '700', color: '#666' },
    applyBtn:           { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1a1a2e', alignItems: 'center' },
    applyBtnText:       { fontSize: 15, fontWeight: '700', color: '#fff' },
    // Radius chips
    radiusRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    radiusChip:         { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f0f0f0', borderWidth: 1.5, borderColor: '#f0f0f0' },
    radiusChipActive:   { backgroundColor: '#e8f5e9', borderColor: '#16a34a' },
    radiusChipText:     { fontSize: 14, fontWeight: '600', color: '#999' },
    radiusChipTextActive: { color: '#16a34a' },
});