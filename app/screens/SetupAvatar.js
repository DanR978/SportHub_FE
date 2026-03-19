import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const SKIN_TONES = ['#FDDBB4','#F5C89A','#E8A87C','#C68642','#8D5524','#4A2912'];
const HAIR_COLORS = ['#1a1a1a','#4a3728','#8B4513','#D4A017','#E8C99A','#FF6B6B','#4ECDC4','#9B59B6'];
const HAIR_STYLES = ['short','medium','long','curly','bun','buzz','none'];
const HAIR_LABELS = ['Short','Medium','Long','Curly','Bun','Buzz','Bald'];
const FACIAL_HAIR = ['none','stubble','beard','mustache','goatee'];
const FACIAL_LABELS = ['None','Stubble','Beard','Mustache','Goatee'];
const ACCESSORIES = ['none','headband','cap','sunglasses','bandana'];
const ACC_LABELS = ['None','Headband','Cap','Shades','Bandana'];
const EYE_COLORS = [
    { key: 'dark',  color: '#1a1a2e', label: 'Dark' },
    { key: 'brown', color: '#8B4513', label: 'Brown' },
    { key: 'hazel', color: '#9B7D2E', label: 'Hazel' },
    { key: 'green', color: '#2E8B57', label: 'Green' },
    { key: 'blue',  color: '#4169E1', label: 'Blue' },
    { key: 'gray',  color: '#708090', label: 'Gray' },
];
const EXPRESSIONS = [
    { key: 'neutral',  label: 'Neutral',  icon: 'remove-outline' },
    { key: 'happy',    label: 'Happy',    icon: 'happy-outline' },
    { key: 'cool',     label: 'Cool',     icon: 'sunglasses-outline' },
    { key: 'surprised',label: 'Surprised',icon: 'alert-circle-outline' },
    { key: 'wink',     label: 'Wink',     icon: 'eye-outline' },
];

export function AvatarPreview({ config, size = 120 }) {
    const s = size;
    const skin = config.skinTone || '#F5C89A';
    const hair = config.hairColor || '#1a1a1a';
    const eyeColor = config.eyeColor || '#1a1a2e';
    const expression = config.expression || 'neutral';
    const jerseyNum = config.jerseyNumber || '';

    // Mouth based on expression
    const renderMouth = () => {
        const cx = s * 0.3; // center x relative to face
        const my = s * 0.5;
        switch (expression) {
            case 'happy':
                return <View style={{ position:'absolute', top: my, alignSelf:'center', width: s*0.2, height: s*0.08, borderBottomWidth: 2.5, borderColor:'#c07070', borderBottomLeftRadius: 99, borderBottomRightRadius: 99 }} />;
            case 'surprised':
                return <View style={{ position:'absolute', top: my, alignSelf:'center', width: s*0.1, height: s*0.1, backgroundColor:'#c07070', borderRadius: 99, opacity: 0.6 }} />;
            case 'cool':
                return <View style={{ position:'absolute', top: my, alignSelf:'center', width: s*0.22, height: s*0.03, backgroundColor:'#c07070', borderRadius: 99, opacity: 0.5 }} />;
            case 'wink':
                return <View style={{ position:'absolute', top: my, alignSelf:'center', width: s*0.16, height: s*0.06, borderBottomWidth: 2, borderColor:'#c07070', borderBottomLeftRadius: 99, borderBottomRightRadius: 99 }} />;
            default: // neutral
                return <View style={{ position:'absolute', top: my, alignSelf:'center', width: s*0.18, height: s*0.04, borderBottomWidth: 2, borderColor:'#c0707080', borderRadius: 99 }} />;
        }
    };

    // Eyes — wink makes one eye a line
    const renderEyes = () => {
        const ey = s * 0.26;
        const eSize = s * 0.12;
        const pupil = s * 0.04;
        
        const normalEye = (left) => (
            <View style={{ position:'absolute', top: ey, [left ? 'left' : 'right']: s*0.1, width: eSize, height: s*0.08, backgroundColor: '#fff', borderRadius: s*0.04, justifyContent:'center', alignItems:'center' }}>
                <View style={{ width: pupil + 2, height: pupil + 2, backgroundColor: eyeColor, borderRadius: 99 }}>
                    <View style={{ position:'absolute', top: 1, right: 1, width: s*0.02, height: s*0.02, backgroundColor:'#fff', borderRadius: 99 }} />
                </View>
            </View>
        );

        const winkEye = (left) => (
            <View style={{ position:'absolute', top: ey + s*0.02, [left ? 'left' : 'right']: s*0.1, width: eSize, height: 2.5, backgroundColor: '#1a1a2e', borderRadius: 2 }} />
        );

        if (expression === 'surprised') {
            // Bigger eyes
            return (<>
                <View style={{ position:'absolute', top: ey - 2, left: s*0.09, width: eSize + 2, height: s*0.1, backgroundColor: '#fff', borderRadius: s*0.05, justifyContent:'center', alignItems:'center' }}>
                    <View style={{ width: pupil + 2, height: pupil + 2, backgroundColor: eyeColor, borderRadius: 99 }} />
                </View>
                <View style={{ position:'absolute', top: ey - 2, right: s*0.09, width: eSize + 2, height: s*0.1, backgroundColor: '#fff', borderRadius: s*0.05, justifyContent:'center', alignItems:'center' }}>
                    <View style={{ width: pupil + 2, height: pupil + 2, backgroundColor: eyeColor, borderRadius: 99 }} />
                </View>
            </>);
        }

        return (<>
            {expression === 'wink' ? winkEye(true) : normalEye(true)}
            {normalEye(false)}
        </>);
    };

    return (
        <View style={{ width: s, height: s * 1.1, alignItems: 'center' }}>
            {/* Neck */}
            <View style={{ position:'absolute', bottom: s*0.18, width: s*0.22, height: s*0.18, backgroundColor: skin, borderRadius: 4, zIndex: 1 }} />
            {/* Jersey */}
            <LinearGradient colors={['#16a34a','#15803d']} style={{ position:'absolute', bottom: 0, width: s*0.85, height: s*0.28, borderRadius: s*0.1, alignItems:'center', justifyContent:'center' }}>
                <View style={{ width: s*0.18, height: s*0.08, backgroundColor: '#fff', borderBottomLeftRadius: s*0.05, borderBottomRightRadius: s*0.05, position:'absolute', top: 0 }} />
                {jerseyNum ? (
                    <Text style={{ color:'#fff', fontSize: s*0.12, fontWeight:'900', marginTop: s*0.04 }}>{jerseyNum}</Text>
                ) : null}
            </LinearGradient>
            {/* Head */}
            <View style={{ position:'absolute', top: s*0.02, width: s*0.6, height: s*0.65, backgroundColor: skin, borderRadius: s*0.32, zIndex: 2, shadowColor:'#000', shadowOpacity:0.15, shadowRadius:6 }}>
                {/* Ears */}
                <View style={{ position:'absolute', left: -s*0.04, top: s*0.28, width: s*0.08, height: s*0.12, backgroundColor: skin, borderRadius: s*0.04 }} />
                <View style={{ position:'absolute', right: -s*0.04, top: s*0.28, width: s*0.08, height: s*0.12, backgroundColor: skin, borderRadius: s*0.04 }} />
                {/* Eyebrows */}
                <View style={{ position:'absolute', top: s*0.2, left: s*0.1, width: s*0.12, height: 2.5, backgroundColor: `${hair}88`, borderRadius: 2 }} />
                <View style={{ position:'absolute', top: s*0.2, right: s*0.1, width: s*0.12, height: 2.5, backgroundColor: `${hair}88`, borderRadius: 2 }} />
                {/* Eyes */}
                {renderEyes()}
                {/* Nose */}
                <View style={{ position:'absolute', top: s*0.38, alignSelf:'center', width: s*0.06, height: s*0.08, borderBottomWidth: 2, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor:`${skin}88`, borderRadius: 4 }} />
                {/* Mouth */}
                {renderMouth()}
                {/* Facial hair */}
                {config.facialHair==='stubble'&&<View style={{ position:'absolute', top: s*0.46, alignSelf:'center', width: s*0.28, height: s*0.1, backgroundColor:'#00000015', borderRadius: 4 }} />}
                {config.facialHair==='mustache'&&<View style={{ position:'absolute', top: s*0.44, alignSelf:'center', width: s*0.2, height: s*0.05, backgroundColor:`${hair}88`, borderRadius: 8 }} />}
                {config.facialHair==='beard'&&<View style={{ position:'absolute', top: s*0.44, alignSelf:'center', width: s*0.34, height: s*0.18, backgroundColor:`${hair}66`, borderRadius: 8, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 }} />}
                {config.facialHair==='goatee'&&<View style={{ position:'absolute', top: s*0.48, alignSelf:'center', width: s*0.14, height: s*0.14, backgroundColor:`${hair}66`, borderRadius: 4, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }} />}
            </View>
            {/* Hair */}
            {config.hairStyle!=='none'&&(
                <View style={{ position:'absolute', top: 0, zIndex: 3, alignItems:'center', width: s*0.6 }}>
                    {config.hairStyle==='short'&&<View style={{ width: s*0.6, height: s*0.22, backgroundColor: hair, borderTopLeftRadius: s*0.3, borderTopRightRadius: s*0.3, borderBottomLeftRadius: s*0.04, borderBottomRightRadius: s*0.04 }} />}
                    {config.hairStyle==='medium'&&<><View style={{ width: s*0.6, height: s*0.22, backgroundColor: hair, borderTopLeftRadius: s*0.3, borderTopRightRadius: s*0.3 }} /><View style={{ position:'absolute', top: s*0.12, left:-s*0.02, width: s*0.1, height: s*0.28, backgroundColor: hair, borderRadius: 4 }} /><View style={{ position:'absolute', top: s*0.12, right:-s*0.02, width: s*0.1, height: s*0.28, backgroundColor: hair, borderRadius: 4 }} /></>}
                    {config.hairStyle==='long'&&<><View style={{ width: s*0.6, height: s*0.2, backgroundColor: hair, borderTopLeftRadius: s*0.3, borderTopRightRadius: s*0.3 }} /><View style={{ position:'absolute', top: s*0.1, left:-s*0.02, width: s*0.1, height: s*0.5, backgroundColor: hair, borderRadius: 4 }} /><View style={{ position:'absolute', top: s*0.1, right:-s*0.02, width: s*0.1, height: s*0.5, backgroundColor: hair, borderRadius: 4 }} /></>}
                    {config.hairStyle==='curly'&&<View style={{ width: s*0.68, height: s*0.3, backgroundColor: hair, borderRadius: s*0.15, marginTop: -s*0.04 }} />}
                    {config.hairStyle==='bun'&&<><View style={{ width: s*0.6, height: s*0.18, backgroundColor: hair, borderTopLeftRadius: s*0.3, borderTopRightRadius: s*0.3 }} /><View style={{ position:'absolute', top:-s*0.06, width: s*0.18, height: s*0.18, backgroundColor: hair, borderRadius: s*0.09 }} /></>}
                    {config.hairStyle==='buzz'&&<View style={{ width: s*0.6, height: s*0.14, backgroundColor: `${hair}55`, borderTopLeftRadius: s*0.3, borderTopRightRadius: s*0.3 }} />}
                </View>
            )}
            {/* Accessories */}
            {config.accessory==='headband'&&<View style={{ position:'absolute', top: s*0.2, zIndex: 4, width: s*0.62, height: s*0.07, backgroundColor:'#e94560', borderRadius: 4 }} />}
            {config.accessory==='cap'&&<View style={{ position:'absolute', top: -s*0.02, zIndex: 4, alignItems:'center' }}><View style={{ width: s*0.66, height: s*0.2, backgroundColor:'#1a1a2e', borderTopLeftRadius: s*0.33, borderTopRightRadius: s*0.33 }} /><View style={{ marginTop:-s*0.02, width: s*0.78, height: s*0.07, backgroundColor:'#1a1a2e', borderRadius: 4 }} /></View>}
            {config.accessory==='sunglasses'&&<View style={{ position:'absolute', top: s*0.26, zIndex: 4, flexDirection:'row', alignItems:'center', gap: 2 }}><View style={{ width: s*0.16, height: s*0.1, backgroundColor:'#1a1a2e', borderRadius: 4, opacity:0.85 }} /><View style={{ width: s*0.06, height: s*0.02, backgroundColor:'#1a1a2e' }} /><View style={{ width: s*0.16, height: s*0.1, backgroundColor:'#1a1a2e', borderRadius: 4, opacity:0.85 }} /></View>}
            {config.accessory==='bandana'&&<View style={{ position:'absolute', top: s*0.08, zIndex: 4, width: s*0.64, height: s*0.1, backgroundColor:'#f59e0b', borderRadius: 3, opacity: 0.85 }}><View style={{ position:'absolute', right: -s*0.06, top: s*0.02, width: s*0.12, height: s*0.06, backgroundColor:'#f59e0b', borderRadius: 3, transform:[{rotate:'15deg'}] }} /></View>}
        </View>
    );
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionLabel({ text }) {
    return <Text style={st.optLabel}>{text}</Text>;
}

// ── Color dot row ────────────────────────────────────────────────────────────
function ColorRow({ items, selected, onSelect, labelKey }) {
    return (
        <View style={st.colorRow}>
            {items.map((item, i) => {
                const color = typeof item === 'string' ? item : item.color;
                const key = typeof item === 'string' ? item : item.key;
                const active = selected === key || selected === color;
                return (
                    <TouchableOpacity key={i} onPress={() => onSelect(typeof item === 'string' ? item : item.key)}
                        style={[st.dot, { backgroundColor: color }, active && st.dotSel]}>
                        {active && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

// ── Chip row ─────────────────────────────────────────────────────────────────
function ChipRow({ items, labels, selected, onSelect, icons }) {
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection:'row', gap: 8, paddingHorizontal: 20 }}>
                {items.map((item, i) => {
                    const active = selected === item;
                    return (
                        <TouchableOpacity key={item} onPress={() => onSelect(item)}
                            style={[st.chip, active && st.chipActive]}>
                            {icons?.[i] && <Ionicons name={icons[i]} size={14} color={active ? '#fff' : '#666'} />}
                            <Text style={[st.chipText, active && st.chipTextActive]}>{labels[i]}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function StepAvatar({ formData, update }) {
    const [tab, setTab] = useState('avatar');
    const av = formData.avatar;

    const updateAv = (patch) => update({ avatar: { ...av, ...patch } });

    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={st.stepTitle}>Your look</Text>
            <Text style={st.stepSub}>Build an avatar or upload a photo — changeable anytime</Text>

            <View style={st.tabSwitch}>
                <TouchableOpacity style={[st.tabBtn, tab==='avatar'&&st.tabBtnActive]} onPress={()=>setTab('avatar')}>
                    <Text style={[st.tabBtnText, tab==='avatar'&&st.tabBtnTextActive]}>Build Avatar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.tabBtn, tab==='photo'&&st.tabBtnActive]} onPress={()=>setTab('photo')}>
                    <Text style={[st.tabBtnText, tab==='photo'&&st.tabBtnTextActive]}>Upload Photo</Text>
                </TouchableOpacity>
            </View>

            {tab === 'avatar' && (
                <View style={{ alignItems:'center' }}>
                    <View style={st.previewBox}><AvatarPreview config={av} size={140} /></View>

                    <SectionLabel text="Skin Tone" />
                    <ColorRow items={SKIN_TONES} selected={av.skinTone} onSelect={v => updateAv({ skinTone: v })} />

                    <SectionLabel text="Eye Color" />
                    <ColorRow items={EYE_COLORS} selected={av.eyeColor || 'dark'} onSelect={v => updateAv({ eyeColor: v })} />

                    <SectionLabel text="Expression" />
                    <ChipRow items={EXPRESSIONS.map(e=>e.key)} labels={EXPRESSIONS.map(e=>e.label)}
                        selected={av.expression || 'neutral'} onSelect={v => updateAv({ expression: v })}
                        icons={EXPRESSIONS.map(e=>e.icon)} />

                    <SectionLabel text="Hair Style" />
                    <ChipRow items={HAIR_STYLES} labels={HAIR_LABELS}
                        selected={av.hairStyle} onSelect={v => updateAv({ hairStyle: v })} />

                    {av.hairStyle!=='none' && <>
                        <SectionLabel text="Hair Color" />
                        <ColorRow items={HAIR_COLORS} selected={av.hairColor} onSelect={v => updateAv({ hairColor: v })} />
                    </>}

                    <SectionLabel text="Facial Hair" />
                    <ChipRow items={FACIAL_HAIR} labels={FACIAL_LABELS}
                        selected={av.facialHair} onSelect={v => updateAv({ facialHair: v })} />

                    <SectionLabel text="Accessory" />
                    <ChipRow items={ACCESSORIES} labels={ACC_LABELS}
                        selected={av.accessory} onSelect={v => updateAv({ accessory: v })} />

                    <SectionLabel text="Jersey Number" />
                    <View style={st.jerseyRow}>
                        <TextInput
                            style={st.jerseyInput}
                            value={av.jerseyNumber || ''}
                            onChangeText={t => updateAv({ jerseyNumber: t.replace(/\D/g, '').slice(0, 2) })}
                            placeholder="—"
                            placeholderTextColor="#ccc"
                            keyboardType="number-pad"
                            maxLength={2}
                        />
                        <Text style={st.jerseyHint}>Optional · shows on jersey</Text>
                    </View>
                </View>
            )}

            {tab === 'photo' && (
                <View style={{ alignItems:'center', paddingTop: 20 }}>
                    <TouchableOpacity style={st.photoBox} onPress={async () => {
                        const r = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            allowsEditing: true, aspect: [1,1], quality: 0.8,
                        });
                        if (!r.canceled) update({ photo: r.assets[0].uri });
                    }}>
                        {formData.photo
                            ? <Image source={{ uri: formData.photo }} style={{ width: 140, height: 140, borderRadius: 70 }} />
                            : <><Ionicons name="camera-outline" size={40} color="#bbb" /><Text style={{ color:'#bbb', marginTop: 8 }}>Tap to choose photo</Text></>
                        }
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const st = StyleSheet.create({
    stepTitle:     { fontSize: 26, fontWeight: '900', color: '#1a1a2e', marginBottom: 6, marginTop: 8 },
    stepSub:       { fontSize: 13, color: '#aaa', marginBottom: 20, lineHeight: 19 },
    tabSwitch:     { flexDirection: 'row', backgroundColor: '#f8f9fb', borderRadius: 12, padding: 4, marginBottom: 20 },
    tabBtn:        { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabBtnActive:  { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    tabBtnText:    { fontSize: 14, fontWeight: '600', color: '#999' },
    tabBtnTextActive: { color: '#1a1a2e' },
    previewBox:    { width: 180, height: 200, backgroundColor: '#f0fdf4', borderRadius: 90, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 3, borderColor: '#86efac' },
    colorRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 16 },
    dot:           { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
    dotSel:        { borderWidth: 3, borderColor: '#16a34a', transform: [{ scale: 1.15 }] },
    optLabel:      { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, alignSelf: 'flex-start', paddingLeft: 20 },
    chip:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: '#f8f9fb', borderRadius: 20, borderWidth: 1.5, borderColor: '#f0f0f0' },
    chipActive:    { backgroundColor: '#16a34a', borderColor: '#16a34a' },
    chipText:      { fontSize: 13, fontWeight: '600', color: '#555' },
    chipTextActive:{ color: '#fff' },
    photoBox:      { width: 160, height: 160, borderRadius: 80, backgroundColor: '#f8f9fb', borderWidth: 2, borderColor: '#e0e0e0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    jerseyRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, paddingHorizontal: 20 },
    jerseyInput:   { width: 56, height: 44, backgroundColor: '#f8f9fb', borderRadius: 10, borderWidth: 1.5, borderColor: '#f0f0f0', textAlign: 'center', fontSize: 20, fontWeight: '900', color: '#1a1a2e' },
    jerseyHint:    { fontSize: 12, color: '#bbb' },
});