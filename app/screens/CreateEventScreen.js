import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Dimensions,
} from 'react-native';
import { useState, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker } from 'react-native-maps';
import { getToken } from '../services/auth';
import { API_URL, GOOGLE_MAPS_API_KEY } from '../config';

const { width: SW } = Dimensions.get('window');

const SPORTS = ['Soccer','Basketball','Tennis','Volleyball','Pickleball','Baseball','Football','Handball','Softball','Dodgeball','Kickball'];
const LEVELS = ['Beginner','Intermediate','Advanced','All Levels'];

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

const CLEAN_MAP_STYLE = [
    { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.sports_complex', stylers: [{ visibility: 'on' }] },
    { featureType: 'poi.park', stylers: [{ visibility: 'on' }] },
];

const BAD_WORDS = ['fuck','shit','ass','bitch','cunt','dick','pussy','bastard'];
const hasProfanity = (str) => {
    if (!str) return false;
    return BAD_WORDS.some(w => str.toLowerCase().includes(w));
};

const pad = n => String(n).padStart(2, '0');
const formatDisplayDate = (d) => {
    if (!d) return '';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
};
const formatDisplayTime = (d) => {
    if (!d) return '';
    const h = d.getHours();
    const m = pad(d.getMinutes());
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m} ${ampm}`;
};
const toDateString = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const toTimeString = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

function SectionLabel({ text }) {
    return <Text style={styles.sectionLabel}>{text}</Text>;
}
function FieldError({ msg }) {
    if (!msg) return null;
    return (
        <View style={styles.fieldError}>
            <Ionicons name="alert-circle-outline" size={13} color="#e94560" />
            <Text style={styles.fieldErrorText}>{msg}</Text>
        </View>
    );
}
function PickerField({ value, placeholder, icon, onPress, error }) {
    return (
        <TouchableOpacity style={[styles.pickerField, error && styles.inputError]} onPress={onPress} activeOpacity={0.7}>
            <Ionicons name={icon} size={18} color={value ? '#1a1a2e' : '#bbb'} />
            <Text style={[styles.pickerFieldText, !value && styles.pickerFieldPlaceholder]}>{value || placeholder}</Text>
            <Ionicons name="chevron-forward" size={16} color="#bbb" />
        </TouchableOpacity>
    );
}
function IOSPickerModal({ visible, onClose, onConfirm, children }) {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.iosOverlay}>
                <View style={styles.iosSheet}>
                    <View style={styles.iosSheetHeader}>
                        <TouchableOpacity onPress={onClose}><Text style={styles.iosCancel}>Cancel</Text></TouchableOpacity>
                        <TouchableOpacity onPress={onConfirm}><Text style={styles.iosDone}>Done</Text></TouchableOpacity>
                    </View>
                    {children}
                </View>
            </View>
        </Modal>
    );
}

export default function CreateEventScreen({ navigation }) {
    const [title, setTitle]             = useState('');
    const [sport, setSport]             = useState('');
    const [level, setLevel]             = useState('');
    const [date, setDate]               = useState(null);
    const [startTime, setStartTime]     = useState(null);
    const [endTime, setEndTime]         = useState(null);
    const [location, setLocation]       = useState('');
    const [maxPlayers, setMaxPlayers]   = useState('10');
    const [cost, setCost]               = useState('0');
    const [description, setDescription] = useState('');

    // Coordinates from pin drop or autocomplete
    const [pinCoords, setPinCoords] = useState(null); // { latitude, longitude }

    // Google Places autocomplete
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef(null);

    // Pin-drop map modal
    const [mapModalVisible, setMapModalVisible] = useState(false);
    const [tempPin, setTempPin] = useState(null); // temp pin while modal is open

    // Temp values for pickers
    const [tempDate, setTempDate]           = useState(new Date());
    const [tempStartTime, setTempStartTime] = useState(new Date());
    const [tempEndTime, setTempEndTime]     = useState(new Date());
    const [showDate, setShowDate]           = useState(false);
    const [showStartTime, setShowStartTime] = useState(false);
    const [showEndTime, setShowEndTime]     = useState(false);

    const [errors, setErrors]   = useState({});
    const [loading, setLoading] = useState(false);
    const [step, setStep]       = useState(1);

    const today = new Date();
    today.setHours(0,0,0,0);

    // ── GOOGLE PLACES AUTOCOMPLETE ────────────────────────────
    const fetchSuggestions = useCallback((text) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!text || text.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(text)}&key=${GOOGLE_MAPS_API_KEY}`
                );
                const data = await res.json();
                if (data.results?.length) {
                    setSuggestions(data.results.slice(0, 4).map(r => ({
                        place_id: r.place_id,
                        structured_formatting: {
                            main_text: r.formatted_address.split(',')[0],
                            secondary_text: r.formatted_address.split(',').slice(1).join(',').trim(),
                        },
                        lat: r.geometry.location.lat,
                        lng: r.geometry.location.lng,
                    })));
                    setShowSuggestions(true);
                } else { setSuggestions([]); setShowSuggestions(false); }
            } catch { setSuggestions([]); setShowSuggestions(false); }
        }, 400);
    }, []);

    const selectSuggestion = async (s) => {
        setSearch(s.structured_formatting?.main_text || '');
        setSuggestions([]); setShowSuggestions(false);
        if (s.lat && s.lng && view === 'map' && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: s.lat, longitude: s.lng,
                latitudeDelta: 0.05, longitudeDelta: 0.05,
            }, 600);
        }
    };

    const handleLocationChange = (text) => {
        setLocation(text);
        setErrors(e => ({ ...e, location: null }));
        if (!text.trim()) {
            setPinCoords(null);
        }
        fetchSuggestions(text);
    };

    // ── PIN DROP MAP ──────────────────────────────────────────
    const openMapModal = () => {
        setTempPin(pinCoords);
        setMapModalVisible(true);
    };

    const handleMapPress = (e) => {
        setTempPin(e.nativeEvent.coordinate);
    };

    const confirmPin = async () => {
        if (tempPin) {
            setPinCoords(tempPin);
            // Reverse geocode to get address
            try {
                const res = await fetch(
                    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${tempPin.latitude},${tempPin.longitude}&key=${GOOGLE_MAPS_API_KEY}`
                );
                const data = await res.json();
                if (data.results?.[0]) {
                    setLocation(data.results[0].formatted_address);
                }
            } catch (e) {
                console.log('Reverse geocode error:', e);
            }
        }
        setMapModalVisible(false);
        setErrors(e => ({ ...e, location: null }));
    };

    const removePin = () => {
        setPinCoords(null);
        setTempPin(null);
    };

    // ── VALIDATION ────────────────────────────────────────────
    const validateStep1 = () => {
        const e = {};
        if (!title.trim())           e.title = 'Title is required';
        else if (title.length < 4)   e.title = 'At least 4 characters';
        else if (hasProfanity(title)) e.title = 'Title contains inappropriate language';
        if (!sport) e.sport = 'Select a sport';
        if (!level) e.level = 'Select an experience level';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep2 = () => {
        const e = {};
        if (!date)      e.date      = 'Select a date';
        if (!startTime) e.startTime = 'Select a start time';
        if (!location.trim() && !pinCoords) e.location = 'Enter an address or drop a pin';
        if (startTime && endTime) {
            const diff = (endTime - startTime) / (1000 * 60 * 60);
            const adjusted = diff < 0 ? diff + 24 : diff;
            if (adjusted > 6) e.endTime = 'Events cannot last more than 6 hours';
        }
        const mp = parseInt(maxPlayers);
        if (!maxPlayers || isNaN(mp) || mp < 2 || mp > 100) e.maxPlayers = 'Must be between 2 and 100';
        const c = parseFloat(cost);
        if (cost !== '' && (isNaN(c) || c < 0)) e.cost = 'Must be 0 or positive';
        if (hasProfanity(description)) e.description = 'Description contains inappropriate language';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const nextStep = () => {
        if (step === 1 && validateStep1()) setStep(2);
        if (step === 2 && validateStep2()) setStep(3);
    };
    const prevStep = () => { setErrors({}); setStep(s => Math.max(s - 1, 1)); };

    // ── SUBMIT ────────────────────────────────────────────────
    const handleSubmit = async () => {
        setLoading(true);
        setErrors({});
        try {
            const token = await getToken();
            const body = {
                title:            title.trim(),
                sport:            sport.toLowerCase(),
                experience_level: level.toLowerCase(),
                start_date:       toDateString(date),
                start_time:       toTimeString(startTime),
                end_time:         endTime ? toTimeString(endTime) : null,
                location:         location.trim(),
                max_players:      parseInt(maxPlayers),
                cost:             parseFloat(cost) || 0,
                description:      description.trim() || null,
                latitude:         pinCoords?.latitude || null,
                longitude:        pinCoords?.longitude || null,
            };

            const res = await fetch(`${API_URL}/sports-events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                navigation.goBack();
            } else {
                const err = await res.json();
                setErrors({ submit: err.detail || 'Something went wrong' });
                setStep(3);
            }
        } catch (e) {
            setErrors({ submit: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    // ── STEP INDICATOR ────────────────────────────────────────
    const StepIndicator = () => (
        <View style={styles.stepRow}>
            {[1,2,3].map(s => (
                <View key={s} style={styles.stepItem}>
                    <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
                        {step > s
                            ? <Ionicons name="checkmark" size={12} color="#fff" />
                            : <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{s}</Text>
                        }
                    </View>
                    {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
                </View>
            ))}
        </View>
    );

    // ── STEP 1 ────────────────────────────────────────────────
    const renderStep1 = () => (
        <View>
            <SectionLabel text="Event Title" />
            <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="e.g. Sunday Pickup Soccer"
                placeholderTextColor="#bbb"
                value={title}
                onChangeText={t => { setTitle(t); setErrors(e => ({...e, title: null})); }}
                maxLength={60}
            />
            <FieldError msg={errors.title} />

            <SectionLabel text="Sport" />
            <View style={styles.chipGrid}>
                {SPORTS.map(s => {
                    const active = sport === s;
                    const color  = SPORT_COLORS[s] || '#999';
                    return (
                        <TouchableOpacity
                            key={s}
                            style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
                            onPress={() => { setSport(s); setErrors(e => ({...e, sport: null})); }}
                        >
                            <Ionicons name={SPORT_ICONS[s] || 'trophy-outline'} size={14} color={active ? '#fff' : '#666'} />
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <FieldError msg={errors.sport} />

            <SectionLabel text="Experience Level" />
            <View style={styles.levelRow}>
                {LEVELS.map(l => {
                    const active = level === l;
                    return (
                        <TouchableOpacity
                            key={l}
                            style={[styles.levelChip, active && styles.levelChipActive]}
                            onPress={() => { setLevel(l); setErrors(e => ({...e, level: null})); }}
                        >
                            <Text style={[styles.levelChipText, active && styles.levelChipTextActive]}>{l}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <FieldError msg={errors.level} />
        </View>
    );

    // ── STEP 2 ────────────────────────────────────────────────
    const renderStep2 = () => (
        <View>
            <SectionLabel text="Date" />
            <PickerField
                value={date ? formatDisplayDate(date) : ''}
                placeholder="Tap to select date"
                icon="calendar-outline"
                onPress={() => { setTempDate(date || new Date()); setShowDate(true); }}
                error={errors.date}
            />
            <FieldError msg={errors.date} />

            <SectionLabel text="Start Time" />
            <PickerField
                value={startTime ? formatDisplayTime(startTime) : ''}
                placeholder="Tap to select start time"
                icon="time-outline"
                onPress={() => { setTempStartTime(startTime || new Date()); setShowStartTime(true); }}
                error={errors.startTime}
            />
            <FieldError msg={errors.startTime} />

            <SectionLabel text="End Time (optional)" />
            <PickerField
                value={endTime ? formatDisplayTime(endTime) : ''}
                placeholder="Tap to select end time"
                icon="time-outline"
                onPress={() => { setTempEndTime(endTime || new Date()); setShowEndTime(true); }}
                error={errors.endTime}
            />

            <SectionLabel text="Location" />
            <View style={[styles.locationBox, errors.location && styles.inputError]}>
                <Ionicons name="location-outline" size={18} color="#999" style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.locationInput}
                    placeholder="Search for a place..."
                    placeholderTextColor="#bbb"
                    value={location}
                    onChangeText={handleLocationChange}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                <TouchableOpacity style={styles.pinBtn} onPress={openMapModal}>
                    <Ionicons name="map-outline" size={18} color="#16a34a" />
                </TouchableOpacity>
            </View>

            {/* Google Places Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestionsBox}>
                    {suggestions.map((s, i) => (
                        <TouchableOpacity
                            key={s.place_id || i}
                            style={[styles.suggestionRow, i < suggestions.length - 1 && styles.suggestionBorder]}
                            onPress={() => selectSuggestion(s)}
                        >
                            <Ionicons name="location" size={16} color="#16a34a" style={{ marginRight: 10 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.suggestionMain} numberOfLines={1}>
                                    {s.structured_formatting?.main_text || s.description}
                                </Text>
                                <Text style={styles.suggestionSub} numberOfLines={1}>
                                    {s.structured_formatting?.secondary_text || ''}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Selected pin indicator */}
            {pinCoords && (
                <View style={styles.pinIndicator}>
                    <Ionicons name="pin" size={16} color="#16a34a" />
                    <Text style={styles.pinIndicatorText}>
                        Pin dropped ({pinCoords.latitude.toFixed(4)}, {pinCoords.longitude.toFixed(4)})
                    </Text>
                    <TouchableOpacity onPress={removePin} style={styles.pinRemoveBtn}>
                        <Ionicons name="close-circle" size={20} color="#e94560" />
                    </TouchableOpacity>
                </View>
            )}

            {!pinCoords && (
                <Text style={styles.locationHint}>Search above or tap the map icon to drop a pin</Text>
            )}
            <FieldError msg={errors.location} />

            <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                    <SectionLabel text="Max Players" />
                    <TextInput
                        style={[styles.input, errors.maxPlayers && styles.inputError]}
                        placeholder="10" placeholderTextColor="#bbb"
                        value={maxPlayers}
                        onChangeText={t => { setMaxPlayers(t.replace(/\D/g,'')); setErrors(e => ({...e, maxPlayers: null})); }}
                        keyboardType="numeric" maxLength={3}
                    />
                    <FieldError msg={errors.maxPlayers} />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                    <SectionLabel text="Cost ($)" />
                    <TextInput
                        style={[styles.input, errors.cost && styles.inputError]}
                        placeholder="0" placeholderTextColor="#bbb"
                        value={cost}
                        onChangeText={t => { setCost(t); setErrors(e => ({...e, cost: null})); }}
                        keyboardType="decimal-pad" maxLength={6}
                    />
                    <FieldError msg={errors.cost} />
                </View>
            </View>

            <SectionLabel text="Description (optional)" />
            <TextInput
                style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                placeholder="What to expect, what to bring, any rules..."
                placeholderTextColor="#bbb"
                value={description}
                onChangeText={t => { setDescription(t); setErrors(e => ({...e, description: null})); }}
                multiline numberOfLines={4} maxLength={500}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
            <FieldError msg={errors.description} />

            {/* Android inline pickers */}
            {Platform.OS === 'android' && showDate && (
                <DateTimePicker value={tempDate} mode="date" minimumDate={today}
                    onChange={(e, d) => { setShowDate(false); if (d) setDate(d); }} />
            )}
            {Platform.OS === 'android' && showStartTime && (
                <DateTimePicker value={tempStartTime} mode="time" is24Hour={false}
                    onChange={(e, d) => { setShowStartTime(false); if (d) setStartTime(d); }} />
            )}
            {Platform.OS === 'android' && showEndTime && (
                <DateTimePicker value={tempEndTime} mode="time" is24Hour={false}
                    onChange={(e, d) => { setShowEndTime(false); if (d) setEndTime(d); }} />
            )}
        </View>
    );

    // ── STEP 3: REVIEW ────────────────────────────────────────
    const renderStep3 = () => {
        const color = SPORT_COLORS[sport] || '#16a34a';
        return (
            <View>
                <Text style={styles.reviewTitle}>Review your event</Text>
                <View style={[styles.reviewBanner, { backgroundColor: color + '18' }]}>
                    <Ionicons name={SPORT_ICONS[sport] || 'trophy-outline'} size={32} color={color} />
                    <Text style={[styles.reviewEventTitle, { color }]} numberOfLines={2}>{title}</Text>
                </View>
                <View style={styles.reviewCard}>
                    <ReviewRow icon="football-outline"  label="Sport"    value={sport} />
                    <ReviewRow icon="bar-chart-outline" label="Level"    value={level} />
                    <ReviewRow icon="calendar-outline"  label="Date"     value={date ? formatDisplayDate(date) : ''} />
                    <ReviewRow icon="time-outline"      label="Time"     value={endTime ? `${formatDisplayTime(startTime)} – ${formatDisplayTime(endTime)}` : formatDisplayTime(startTime)} />
                    <ReviewRow icon="location-outline"  label="Location" value={location} />
                    <ReviewRow icon="people-outline"    label="Players"  value={`Max ${maxPlayers}`} />
                    <ReviewRow icon="cash-outline"      label="Cost"     value={parseFloat(cost) > 0 ? `$${cost}` : 'Free'} last />
                </View>

                {/* Mini preview map if pin was dropped */}
                {pinCoords && (
                    <View style={styles.reviewMapContainer}>
                        <MapView
                            style={styles.reviewMap}
                            scrollEnabled={false} zoomEnabled={false} rotateEnabled={false} pitchEnabled={false}
                            initialRegion={{
                                latitude: pinCoords.latitude, longitude: pinCoords.longitude,
                                latitudeDelta: 0.008, longitudeDelta: 0.008,
                            }}
                            customMapStyle={CLEAN_MAP_STYLE}
                        >
                            <Marker coordinate={pinCoords}>
                                <View style={styles.reviewMapPin}>
                                    <Ionicons name={SPORT_ICONS[sport] || 'location'} size={14} color="#fff" />
                                </View>
                            </Marker>
                        </MapView>
                    </View>
                )}

                {description ? (
                    <View style={styles.reviewDescCard}>
                        <Text style={styles.reviewDescLabel}>Description</Text>
                        <Text style={styles.reviewDescText}>{description}</Text>
                    </View>
                ) : null}
                {errors.submit && (
                    <View style={styles.submitError}>
                        <Ionicons name="alert-circle-outline" size={16} color="#e94560" />
                        <Text style={styles.submitErrorText}>{errors.submit}</Text>
                    </View>
                )}
            </View>
        );
    };

    const ReviewRow = ({ icon, label, value, last }) => (
        <View style={[styles.reviewRow, !last && styles.reviewRowBorder]}>
            <Ionicons name={icon} size={16} color="#999" style={{ width: 22 }} />
            <Text style={styles.reviewLabel}>{label}</Text>
            <Text style={styles.reviewValue} numberOfLines={2}>{value}</Text>
        </View>
    );

    // ── RENDER ────────────────────────────────────────────────
    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={22} color="#1a1a2e" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Create Event</Text>
                    <View style={{ width: 36 }} />
                </View>

                <StepIndicator />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.stepTitle}>
                        {step === 1 ? 'The basics' : step === 2 ? 'Time & place' : 'Looks good?'}
                    </Text>
                    <Text style={styles.stepSub}>
                        {step === 1 ? 'What kind of event are you hosting?'
                            : step === 2 ? 'When and where is it happening?'
                            : 'Double-check everything before publishing.'}
                    </Text>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </ScrollView>

                <View style={styles.bottomBar}>
                    {step > 1 && (
                        <TouchableOpacity style={styles.backStepBtn} onPress={prevStep}>
                            <Ionicons name="arrow-back" size={18} color="#1a1a2e" />
                            <Text style={styles.backStepText}>Back</Text>
                        </TouchableOpacity>
                    )}
                    {step < 3 ? (
                        <TouchableOpacity style={styles.nextBtn} onPress={nextStep}>
                            <Text style={styles.nextBtnText}>Continue</Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.nextBtn, styles.publishBtn, loading && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <>
                                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                                    <Text style={styles.nextBtnText}>Publish Event</Text>
                                </>
                            }
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* iOS pickers in modals */}
            {Platform.OS === 'ios' && (
                <>
                    <IOSPickerModal visible={showDate} onClose={() => setShowDate(false)}
                        onConfirm={() => { setDate(tempDate); setShowDate(false); setErrors(e => ({...e, date: null})); }}>
                        <DateTimePicker value={tempDate} mode="date" display="inline" minimumDate={today}
                            onChange={(_, d) => { if (d) setTempDate(d); }} style={{ alignSelf: 'center' }} />
                    </IOSPickerModal>
                    <IOSPickerModal visible={showStartTime} onClose={() => setShowStartTime(false)}
                        onConfirm={() => { setStartTime(tempStartTime); setShowStartTime(false); setErrors(e => ({...e, startTime: null})); }}>
                        <DateTimePicker value={tempStartTime} mode="time" display="spinner"
                            onChange={(_, d) => { if (d) setTempStartTime(d); }} />
                    </IOSPickerModal>
                    <IOSPickerModal visible={showEndTime} onClose={() => setShowEndTime(false)}
                        onConfirm={() => { setEndTime(tempEndTime); setShowEndTime(false); }}>
                        <DateTimePicker value={tempEndTime} mode="time" display="spinner"
                            onChange={(_, d) => { if (d) setTempEndTime(d); }} style={{ width: 200, alignSelf: 'center' }} />
                    </IOSPickerModal>
                </>
            )}

            {/* ── PIN DROP MAP MODAL ── */}
            <Modal visible={mapModalVisible} animationType="slide">
                <View style={{ flex: 1 }}>
                    <View style={styles.mapModalHeader}>
                        <TouchableOpacity onPress={() => setMapModalVisible(false)}>
                            <Text style={styles.mapModalCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.mapModalTitle}>Drop a Pin</Text>
                        <TouchableOpacity onPress={confirmPin}>
                            <Text style={[styles.mapModalConfirm, !tempPin && { color: '#ccc' }]}>
                                {tempPin ? 'Confirm' : 'Confirm'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <MapView
                        style={{ flex: 1 }}
                        initialRegion={{
                            latitude: pinCoords?.latitude || 37.78,
                            longitude: pinCoords?.longitude || -122.42,
                            latitudeDelta: 0.02,
                            longitudeDelta: 0.02,
                        }}
                        showsUserLocation
                        customMapStyle={CLEAN_MAP_STYLE}
                        onPress={handleMapPress}
                        onLongPress={handleMapPress}
                    >
                        {tempPin && (
                            <Marker coordinate={tempPin} draggable
                                onDragEnd={(e) => setTempPin(e.nativeEvent.coordinate)}
                            >
                                <View style={styles.dropPinMarker}>
                                    <Ionicons name="location" size={22} color="#fff" />
                                </View>
                            </Marker>
                        )}
                    </MapView>

                    {/* Bottom info bar */}
                    <View style={styles.mapModalBottom}>
                        {tempPin ? (
                            <View style={styles.mapModalPinInfo}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.mapModalPinLabel}>Pin Location</Text>
                                    <Text style={styles.mapModalPinCoords}>
                                        {tempPin.latitude.toFixed(5)}, {tempPin.longitude.toFixed(5)}
                                    </Text>
                                </View>
                                <TouchableOpacity style={styles.mapModalDeleteBtn} onPress={() => setTempPin(null)}>
                                    <Ionicons name="trash-outline" size={18} color="#e94560" />
                                    <Text style={styles.mapModalDeleteText}>Remove</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text style={styles.mapModalHint}>Tap anywhere on the map to drop a pin</Text>
                        )}
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container:           { flex: 1, backgroundColor: '#f8f9fb' },
    header:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    backBtn:             { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8f9fb', justifyContent: 'center', alignItems: 'center' },
    headerTitle:         { fontSize: 17, fontWeight: '800', color: '#1a1a2e' },
    stepRow:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: '#fff', paddingHorizontal: 20 },
    stepItem:            { flexDirection: 'row', alignItems: 'center' },
    stepDot:             { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    stepDotActive:       { backgroundColor: '#16a34a' },
    stepNum:             { fontSize: 13, fontWeight: '700', color: '#bbb' },
    stepNumActive:       { color: '#fff' },
    stepLine:            { width: 40, height: 2, backgroundColor: '#f0f0f0', marginHorizontal: 4 },
    stepLineActive:      { backgroundColor: '#16a34a' },
    scrollContent:       { padding: 20, paddingBottom: 40 },
    stepTitle:           { fontSize: 22, fontWeight: '900', color: '#1a1a2e', marginBottom: 4 },
    stepSub:             { fontSize: 14, color: '#999', marginBottom: 24 },
    sectionLabel:        { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8, marginTop: 16 },
    input:               { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#1a1a2e', borderWidth: 1.5, borderColor: '#f0f0f0' },
    inputError:          { borderColor: '#e94560' },
    textArea:            { minHeight: 100, textAlignVertical: 'top', paddingTop: 13 },
    charCount:           { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 4 },
    twoCol:              { flexDirection: 'row', alignItems: 'flex-start' },
    fieldError:          { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    fieldErrorText:      { fontSize: 12, color: '#e94560' },
    pickerField:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1.5, borderColor: '#f0f0f0' },
    pickerFieldText:     { flex: 1, fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
    pickerFieldPlaceholder: { color: '#bbb', fontWeight: '400' },
    // Location
    locationBox:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1.5, borderColor: '#f0f0f0' },
    locationInput:       { flex: 1, fontSize: 15, color: '#1a1a2e', paddingVertical: 10 },
    pinBtn:              { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
    locationHint:        { fontSize: 11, color: '#bbb', marginTop: 5, marginLeft: 2 },
    // Autocomplete suggestions
    suggestionsBox:      { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#f0f0f0', marginTop: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    suggestionRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
    suggestionBorder:    { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    suggestionMain:      { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
    suggestionSub:       { fontSize: 12, color: '#999', marginTop: 1 },
    // Pin indicator
    pinIndicator:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 6, gap: 6, borderWidth: 1, borderColor: '#bbf7d0' },
    pinIndicatorText:    { flex: 1, fontSize: 12, color: '#16a34a', fontWeight: '600' },
    pinRemoveBtn:        { padding: 2 },
    // Sport chips
    chipGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip:                { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#f0f0f0' },
    chipText:            { fontSize: 13, fontWeight: '600', color: '#666' },
    chipTextActive:      { color: '#fff' },
    levelRow:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    levelChip:           { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#f0f0f0' },
    levelChipActive:     { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
    levelChipText:       { fontSize: 13, fontWeight: '600', color: '#666' },
    levelChipTextActive: { color: '#fff' },
    // Review
    reviewTitle:         { fontSize: 18, fontWeight: '800', color: '#1a1a2e', marginBottom: 16 },
    reviewBanner:        { borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    reviewEventTitle:    { fontSize: 18, fontWeight: '800', flex: 1 },
    reviewCard:          { backgroundColor: '#fff', borderRadius: 16, padding: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 16 },
    reviewRow:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
    reviewRowBorder:     { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    reviewLabel:         { fontSize: 13, color: '#999', width: 64 },
    reviewValue:         { fontSize: 14, fontWeight: '600', color: '#1a1a2e', flex: 1 },
    reviewMapContainer:  { borderRadius: 16, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    reviewMap:           { height: 140 },
    reviewMapPin:        { width: 30, height: 30, borderRadius: 15, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    reviewDescCard:      { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    reviewDescLabel:     { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    reviewDescText:      { fontSize: 14, color: '#555', lineHeight: 22 },
    submitError:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fee2e2', borderRadius: 12, padding: 14, marginTop: 16 },
    submitErrorText:     { fontSize: 13, color: '#e94560', fontWeight: '600', flex: 1 },
    // Bottom bar
    bottomBar:           { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 36, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    backStepBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f8f9fb', borderWidth: 1, borderColor: '#e0e0e0' },
    backStepText:        { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
    nextBtn:             { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1a1a2e', borderRadius: 12, paddingVertical: 14 },
    nextBtnText:         { fontSize: 15, fontWeight: '800', color: '#fff' },
    publishBtn:          { backgroundColor: '#16a34a' },
    // iOS picker
    iosOverlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    iosSheet:            { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 36, alignItems: 'center' },
    iosSheetHeader:      { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', width: '100%' },
    iosCancel:           { fontSize: 16, color: '#999', fontWeight: '600' },
    iosDone:             { fontSize: 16, color: '#16a34a', fontWeight: '800' },
    // Pin-drop map modal
    mapModalHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    mapModalCancel:      { fontSize: 16, color: '#e94560', fontWeight: '600' },
    mapModalTitle:       { fontSize: 17, fontWeight: '800', color: '#1a1a2e' },
    mapModalConfirm:     { fontSize: 16, color: '#16a34a', fontWeight: '800' },
    dropPinMarker:       { width: 40, height: 40, borderRadius: 20, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
    mapModalBottom:      { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 36, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    mapModalHint:        { fontSize: 14, color: '#999', textAlign: 'center', fontWeight: '500' },
    mapModalPinInfo:     { flexDirection: 'row', alignItems: 'center' },
    mapModalPinLabel:    { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
    mapModalPinCoords:   { fontSize: 12, color: '#999', marginTop: 2 },
    mapModalDeleteBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef2f2', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#fecaca' },
    mapModalDeleteText:  { fontSize: 13, fontWeight: '700', color: '#e94560' },
});
