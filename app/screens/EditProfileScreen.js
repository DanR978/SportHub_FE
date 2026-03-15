import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, Image, KeyboardAvoidingView,
    Platform, Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getToken } from '../services/auth';
import { EditProfileSkeleton } from './Skeleton';
import { AvatarPreview } from './SetupAvatar';

import { API_URL } from '../config';

const SPORTS = ['Soccer','Basketball','Tennis','Volleyball','Pickleball','Baseball','Football','Handball','Softball','Dodgeball','Kickball'];
const SPORT_ICONS = {
    Soccer:'football-outline', Basketball:'basketball-outline', Tennis:'tennisball-outline',
    Volleyball:'baseball-outline', Pickleball:'baseball-outline', Baseball:'baseball-outline',
    Football:'american-football-outline', Handball:'hand-left-outline',
    Softball:'baseball-outline', Dodgeball:'radio-button-on-outline', Kickball:'football-outline',
};
const COUNTRIES = [
    'United States','Mexico','Guatemala','Canada','Brazil','Argentina','Colombia','Spain',
    'United Kingdom','France','Germany','Italy','Honduras','El Salvador','Nicaragua',
    'Costa Rica','Venezuela','Peru','Chile','Ecuador','Japan','South Korea','China',
    'India','Nigeria','Ghana','South Africa','Kenya','Dominican Republic','Puerto Rico',
    'Jamaica','Australia','Portugal','Netherlands','Turkey',
];
const COUNTRY_FLAGS = {
    'United States':'🇺🇸','Mexico':'🇲🇽','Guatemala':'🇬🇹','Canada':'🇨🇦',
    'Brazil':'🇧🇷','Argentina':'🇦🇷','Colombia':'🇨🇴','Spain':'🇪🇸',
    'United Kingdom':'🇬🇧','France':'🇫🇷','Germany':'🇩🇪','Italy':'🇮🇹',
    'Honduras':'🇭🇳','El Salvador':'🇸🇻','Nicaragua':'🇳🇮','Costa Rica':'🇨🇷',
    'Venezuela':'🇻🇪','Peru':'🇵🇪','Chile':'🇨🇱','Ecuador':'🇪🇨',
    'Japan':'🇯🇵','South Korea':'🇰🇷','China':'🇨🇳','India':'🇮🇳',
    'Nigeria':'🇳🇬','Ghana':'🇬🇭','South Africa':'🇿🇦','Kenya':'🇰🇪',
    'Dominican Republic':'🇩🇴','Puerto Rico':'🇵🇷','Jamaica':'🇯🇲',
    'Australia':'🇦🇺','Portugal':'🇵🇹','Netherlands':'🇳🇱','Turkey':'🇹🇷',
};
const pad = n => String(n).padStart(2, '0');

export default function EditProfileScreen({ navigation }) {
    const [user, setUser]                     = useState(null);
    const [loading, setLoading]               = useState(true);
    const [saving, setSaving]                 = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const [firstName, setFirstName]           = useState('');
    const [lastName, setLastName]             = useState('');
    const [bio, setBio]                       = useState('');
    const [nationality, setNationality]       = useState('');
    const [dob, setDob]                       = useState(null);
    const [sports, setSports]                 = useState([]);
    const [instagram, setInstagram]           = useState('');
    const [facebook, setFacebook]             = useState('');

    const [showDobPicker, setShowDobPicker]           = useState(false);
    const [tempDob, setTempDob]                       = useState(new Date());
    const [showCountryPicker, setShowCountryPicker]   = useState(false);
    const [countrySearch, setCountrySearch]           = useState('');

    useEffect(() => { fetchUser(); }, []);

    const fetchUser = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setFirstName(data.first_name || '');
                setLastName(data.last_name || '');
                setBio(data.bio || '');
                setNationality(data.nationality || '');
                setInstagram(data.instagram || '');
                setFacebook(data.facebook || '');
                if (data.date_of_birth) setDob(new Date(data.date_of_birth + 'T00:00:00'));
                if (data.sports) setSports(JSON.parse(data.sports));
            }
        } catch (e) { console.log('Fetch user error:', e); }
        finally { setLoading(false); }
    };

    const toggleSport = s => setSports(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

    const pickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow photo access.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,   // lower quality = smaller base64
            base64: true,
        });
        if (result.canceled || !result.assets?.[0]?.base64) return;

        setUploadingPhoto(true);
        try {
            const token = await getToken();
            const photoData = `data:image/jpeg;base64,${result.assets[0].base64}`;
            const res = await fetch(`${API_URL}/users/me`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ avatar_photo: photoData }),
            });
            if (res.ok) {
                const updated = await res.json();
                setUser(updated);
                Alert.alert('Success', 'Profile photo updated!');
            } else {
                const err = await res.json().catch(() => ({}));
                Alert.alert('Upload failed', err.detail || `Server error ${res.status}`);
            }
        } catch (e) {
            console.log('Upload error:', e);
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const removePhoto = () => {
        Alert.alert('Remove Photo', 'Remove your profile photo?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive', onPress: async () => {
                    try {
                        const token = await getToken();
                        const res = await fetch(`${API_URL}/users/me`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ avatar_photo: null }),
                        });
                        if (res.ok) {
                            const updated = await res.json();
                            setUser(updated);
                        }
                    } catch (e) { console.log('Remove photo error:', e); }
                }
            }
        ]);
    };

    const handleSave = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert('Required', 'First and last name are required.');
            return;
        }
        setSaving(true);
        try {
            const token = await getToken();
            const body = {
                first_name:  firstName.trim(),
                last_name:   lastName.trim(),
                bio:         bio.trim() || null,
                nationality: nationality || null,
                sports:      JSON.stringify(sports),
                instagram:   instagram.trim().replace('@', '') || null,
                facebook:    facebook.trim() || null,
            };
            if (dob) body.date_of_birth = `${dob.getFullYear()}-${pad(dob.getMonth()+1)}-${pad(dob.getDate())}`;

            const res = await fetch(`${API_URL}/users/me`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                navigation.goBack();
            } else {
                const err = await res.json().catch(() => ({}));
                Alert.alert('Error', err.detail || 'Failed to save.');
            }
        } catch (e) {
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <EditProfileSkeleton />;

    const avatarConfig     = user?.avatar_config ? JSON.parse(user.avatar_config) : null;
    const initials         = `${firstName?.[0]||''}${lastName?.[0]||''}`.toUpperCase();
    const filteredCountries = COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()));

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={s.container}>

                {/* HEADER */}
                <View style={s.header}>
                    <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="close" size={22} color="#1a1a2e" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Edit Profile</Text>
                    <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                        {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnText}>Save</Text>}
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

                    {/* AVATAR */}
                    <View style={s.avatarSection}>
                        <View style={s.avatarWrapper}>
                            {uploadingPhoto ? (
                                <View style={s.avatar}><ActivityIndicator color="#16a34a" /></View>
                            ) : user?.avatar_photo ? (
                                <Image source={{ uri: user.avatar_photo }} style={s.avatar} />
                            ) : avatarConfig ? (
                                <View style={[s.avatar, s.avatarBuilt]}><AvatarPreview config={avatarConfig} size={88} /></View>
                            ) : (
                                <LinearGradient colors={['#e94560','#0f3460']} style={s.avatar}>
                                    <Text style={s.initials}>{initials}</Text>
                                </LinearGradient>
                            )}
                            <TouchableOpacity style={s.cameraBtn} onPress={pickPhoto} disabled={uploadingPhoto}>
                                <Ionicons name="camera" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={s.avatarActions}>
                            <TouchableOpacity style={s.avatarActionBtn} onPress={pickPhoto} disabled={uploadingPhoto}>
                                {uploadingPhoto
                                    ? <ActivityIndicator size="small" color="#16a34a" />
                                    : <Text style={s.avatarActionText}>Upload Photo</Text>
                                }
                            </TouchableOpacity>
                            {user?.avatar_photo && (
                                <TouchableOpacity style={[s.avatarActionBtn, s.avatarActionDanger]} onPress={removePhoto}>
                                    <Text style={s.avatarActionDangerText}>Remove Photo</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* BASIC INFO */}
                    <View style={s.card}>
                        <Text style={s.cardTitle}>Basic Info</Text>
                        <Text style={s.label}>First Name</Text>
                        <TextInput style={s.input} value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor="#bbb" maxLength={50} />
                        <Text style={s.label}>Last Name</Text>
                        <TextInput style={s.input} value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor="#bbb" maxLength={50} />
                        <Text style={s.label}>Bio</Text>
                        <TextInput style={[s.input, s.textArea]} value={bio} onChangeText={setBio} placeholder="Tell people about yourself..." placeholderTextColor="#bbb" multiline numberOfLines={3} maxLength={300} />
                        <Text style={s.charCount}>{bio.length}/300</Text>
                    </View>

                    {/* PERSONAL */}
                    <View style={s.card}>
                        <Text style={s.cardTitle}>Personal</Text>
                        <Text style={s.label}>Date of Birth</Text>
                        <TouchableOpacity style={s.pickerField} onPress={() => { setTempDob(dob || new Date()); setShowDobPicker(true); }}>
                            <Ionicons name="calendar-outline" size={18} color={dob ? '#1a1a2e' : '#bbb'} />
                            <Text style={[s.pickerText, !dob && s.placeholderText]}>
                                {dob ? dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select date of birth'}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color="#bbb" />
                        </TouchableOpacity>
                        <Text style={s.label}>Nationality</Text>
                        <TouchableOpacity style={s.pickerField} onPress={() => setShowCountryPicker(true)}>
                            <Text style={{ fontSize: 18 }}>{COUNTRY_FLAGS[nationality] || '🌍'}</Text>
                            <Text style={[s.pickerText, !nationality && s.placeholderText]}>{nationality || 'Select country'}</Text>
                            <Ionicons name="chevron-forward" size={16} color="#bbb" />
                        </TouchableOpacity>
                    </View>

                    {/* SPORTS */}
                    <View style={s.card}>
                        <Text style={s.cardTitle}>Sports & Interests</Text>
                        <View style={s.chipGrid}>
                            {SPORTS.map(sp => {
                                const active = sports.includes(sp);
                                return (
                                    <TouchableOpacity key={sp} style={[s.chip, active && s.chipActive]} onPress={() => toggleSport(sp)}>
                                        <Ionicons name={SPORT_ICONS[sp]} size={14} color={active ? '#fff' : '#666'} />
                                        <Text style={[s.chipText, active && s.chipTextActive]}>{sp}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* SOCIAL */}
                    <View style={s.card}>
                        <Text style={s.cardTitle}>Social Media</Text>
                        <Text style={s.cardSub}>Shown on your profile so other players can connect.</Text>
                        <Text style={s.label}>Instagram</Text>
                        <View style={s.socialRow}>
                            <View style={[s.socialPrefix, { backgroundColor: '#f5005715' }]}>
                                <Ionicons name="logo-instagram" size={18} color="#f50057" />
                                <Text style={[s.socialPrefixText, { color: '#f50057' }]}>@</Text>
                            </View>
                            <TextInput style={s.socialInput} value={instagram} onChangeText={t => setInstagram(t.replace('@',''))} placeholder="your_handle" placeholderTextColor="#bbb" autoCapitalize="none" maxLength={50} />
                        </View>
                        <Text style={s.label}>Facebook</Text>
                        <View style={s.socialRow}>
                            <View style={[s.socialPrefix, { backgroundColor: '#1877f215' }]}>
                                <Ionicons name="logo-facebook" size={18} color="#1877f2" />
                                <Text style={[s.socialPrefixText, { color: '#1877f2' }]}>fb/</Text>
                            </View>
                            <TextInput style={s.socialInput} value={facebook} onChangeText={setFacebook} placeholder="your.name" placeholderTextColor="#bbb" autoCapitalize="none" maxLength={100} />
                        </View>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>

                {/* DOB PICKER */}
                {Platform.OS === 'ios' && showDobPicker && (
                    <View style={s.overlay}>
                        <View style={s.sheet}>
                            <View style={s.sheetHeader}>
                                <TouchableOpacity onPress={() => setShowDobPicker(false)}><Text style={s.cancel}>Cancel</Text></TouchableOpacity>
                                <TouchableOpacity onPress={() => { setDob(tempDob); setShowDobPicker(false); }}><Text style={s.done}>Done</Text></TouchableOpacity>
                            </View>
                            <DateTimePicker value={tempDob} mode="date" display="spinner" maximumDate={new Date()} onChange={(_, d) => { if (d) setTempDob(d); }} />
                        </View>
                    </View>
                )}
                {Platform.OS === 'android' && showDobPicker && (
                    <DateTimePicker value={tempDob} mode="date" maximumDate={new Date()} onChange={(_, d) => { setShowDobPicker(false); if (d) setDob(d); }} />
                )}

                {/* COUNTRY PICKER */}
                {showCountryPicker && (
                    <View style={s.overlay}>
                        <View style={[s.sheet, { maxHeight: '75%' }]}>
                            <View style={s.sheetHeader}>
                                <TouchableOpacity onPress={() => { setShowCountryPicker(false); setCountrySearch(''); }}><Text style={s.cancel}>Cancel</Text></TouchableOpacity>
                                <Text style={s.sheetTitle}>Select Country</Text>
                                <View style={{ width: 60 }} />
                            </View>
                            <View style={s.searchRow}>
                                <Ionicons name="search-outline" size={16} color="#bbb" />
                                <TextInput style={s.searchInput} value={countrySearch} onChangeText={setCountrySearch} placeholder="Search..." placeholderTextColor="#bbb" autoFocus />
                            </View>
                            <ScrollView keyboardShouldPersistTaps="handled">
                                {filteredCountries.map(c => (
                                    <TouchableOpacity key={c} style={[s.countryRow, nationality===c && s.countryRowActive]}
                                        onPress={() => { setNationality(c); setShowCountryPicker(false); setCountrySearch(''); }}>
                                        <Text style={{ fontSize: 22 }}>{COUNTRY_FLAGS[c]||'🌍'}</Text>
                                        <Text style={[s.countryName, nationality===c && s.countryNameActive]}>{c}</Text>
                                        {nationality===c && <Ionicons name="checkmark" size={18} color="#16a34a" />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    container:           { flex: 1, backgroundColor: '#f8f9fb' },
    centered:            { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    headerBtn:           { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8f9fb', justifyContent: 'center', alignItems: 'center' },
    headerTitle:         { fontSize: 17, fontWeight: '800', color: '#1a1a2e' },
    saveBtn:             { backgroundColor: '#16a34a', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 8 },
    saveBtnText:         { color: '#fff', fontWeight: '800', fontSize: 14 },
    scroll:              { padding: 20 },
    avatarSection:       { alignItems: 'center', marginBottom: 24 },
    avatarWrapper:       { position: 'relative', marginBottom: 12 },
    avatar:              { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    avatarBuilt:         { backgroundColor: '#f0fdf4', overflow: 'hidden' },
    initials:            { fontSize: 32, fontWeight: '800', color: '#fff' },
    cameraBtn:           { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#16a34a', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    avatarActions:       { flexDirection: 'row', gap: 10 },
    avatarActionBtn:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e0e0e0', minWidth: 110, alignItems: 'center' },
    avatarActionText:    { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
    avatarActionDanger:  { borderColor: '#fee2e2' },
    avatarActionDangerText: { fontSize: 13, fontWeight: '600', color: '#e94560' },
    card:                { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardTitle:           { fontSize: 15, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
    cardSub:             { fontSize: 12, color: '#bbb', marginBottom: 4 },
    label:               { fontSize: 12, fontWeight: '700', color: '#999', marginTop: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input:               { backgroundColor: '#f8f9fb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1a1a2e', borderWidth: 1.5, borderColor: '#f0f0f0' },
    textArea:            { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
    charCount:           { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 4 },
    pickerField:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f8f9fb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1.5, borderColor: '#f0f0f0' },
    pickerText:          { flex: 1, fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
    placeholderText:     { color: '#bbb', fontWeight: '400' },
    chipGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    chip:                { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f8f9fb', borderWidth: 1.5, borderColor: '#f0f0f0' },
    chipActive:          { backgroundColor: '#16a34a', borderColor: '#16a34a' },
    chipText:            { fontSize: 13, fontWeight: '600', color: '#666' },
    chipTextActive:      { color: '#fff' },
    socialRow:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fb', borderRadius: 10, borderWidth: 1.5, borderColor: '#f0f0f0', overflow: 'hidden' },
    socialPrefix:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 12 },
    socialPrefixText:    { fontSize: 15, fontWeight: '700' },
    socialInput:         { flex: 1, fontSize: 15, color: '#1a1a2e', paddingVertical: 12, paddingRight: 12 },
    overlay:             { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', zIndex: 100 },
    sheet:               { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 36 },
    sheetHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    sheetTitle:          { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
    cancel:              { fontSize: 16, color: '#999', fontWeight: '600' },
    done:                { fontSize: 16, color: '#16a34a', fontWeight: '800' },
    searchRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, backgroundColor: '#f8f9fb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5, borderColor: '#f0f0f0' },
    searchInput:         { flex: 1, fontSize: 15, color: '#1a1a2e' },
    countryRow:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f8f9fb' },
    countryRowActive:    { backgroundColor: '#f0fdf4' },
    countryName:         { flex: 1, fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
    countryNameActive:   { color: '#16a34a', fontWeight: '700' },
});