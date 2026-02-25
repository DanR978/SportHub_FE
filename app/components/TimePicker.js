import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { useState, useRef, useEffect } from 'react';

const ITEM_HEIGHT = 52;
const VISIBLE     = 5;
const PAD         = Math.floor(VISIBLE / 2);

const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// Infinite scroll wheel for a list of items
function Wheel({ items, selectedIndex, onSelect, width = 80 }) {
    const scrollRef  = useRef(null);
    const isScrolling = useRef(false);

    // Tripple the list so scroll feels infinite
    const extended = [...items, ...items, ...items];
    const offset   = items.length * ITEM_HEIGHT;

    useEffect(() => {
        // Jump to middle copy silently on mount
        scrollRef.current?.scrollTo({ y: offset + selectedIndex * ITEM_HEIGHT, animated: false });
    }, []);

    const snapToIndex = (rawY) => {
        const idx    = Math.round(rawY / ITEM_HEIGHT) % items.length;
        const clamped = (idx + items.length) % items.length;
        onSelect(clamped);
        // Snap back to middle copy to enable infinite feel
        scrollRef.current?.scrollTo({ y: offset + clamped * ITEM_HEIGHT, animated: false });
    };

    return (
        <View style={[styles.wheelWrapper, { width }]}>
            {/* Selection highlight */}
            <View style={styles.selectionBar} pointerEvents="none" />

            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => snapToIndex(e.nativeEvent.contentOffset.y)}
                contentContainerStyle={{ paddingVertical: PAD * ITEM_HEIGHT }}
            >
                {extended.map((item, i) => {
                    const realIdx   = i % items.length;
                    const isSel     = realIdx === selectedIndex && Math.floor(i / items.length) === 1;
                    return (
                        <View key={i} style={styles.wheelItem}>
                            <Text style={[styles.wheelText, isSel && styles.wheelTextSelected]}>
                                {item}
                            </Text>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

export default function TimePicker({ visible, onClose, onSelect, label = 'Select Time' }) {
    const [hourIdx,   setHourIdx]   = useState(0);   // 0 = "01"
    const [minuteIdx, setMinuteIdx] = useState(0);   // 0 = "00"
    const [ampm,      setAmpm]      = useState('AM');

    const handleConfirm = () => {
        const h   = parseInt(HOURS[hourIdx]);
        const m   = MINUTES[minuteIdx];
        let hour24 = h % 12;
        if (ampm === 'PM') hour24 += 12;
        const hStr = String(hour24).padStart(2, '0');
        onSelect(`${hStr}:${m}`);
        onClose();
    };

    const displayTime = () => {
        return `${HOURS[hourIdx]}:${MINUTES[minuteIdx]} ${ampm}`;
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.sheet}>

                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{label}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.timePreview}>{displayTime()}</Text>

                    <View style={styles.wheelRow}>
                        {/* Hours */}
                        <Wheel
                            items={HOURS}
                            selectedIndex={hourIdx}
                            onSelect={setHourIdx}
                            width={80}
                        />

                        <Text style={styles.colon}>:</Text>

                        {/* Minutes */}
                        <Wheel
                            items={MINUTES}
                            selectedIndex={minuteIdx}
                            onSelect={setMinuteIdx}
                            width={80}
                        />

                        {/* AM / PM */}
                        <View style={styles.ampmCol}>
                            <TouchableOpacity
                                style={[styles.ampmBtn, ampm === 'AM' && styles.ampmBtnActive]}
                                onPress={() => setAmpm('AM')}
                            >
                                <Text style={[styles.ampmText, ampm === 'AM' && styles.ampmTextActive]}>AM</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.ampmBtn, ampm === 'PM' && styles.ampmBtnActive]}
                                onPress={() => setAmpm('PM')}
                            >
                                <Text style={[styles.ampmText, ampm === 'PM' && styles.ampmTextActive]}>PM</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                        <Text style={styles.confirmBtnText}>Confirm — {displayTime()}</Text>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet:              { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    headerTitle:        { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
    closeBtn:           { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    closeBtnText:       { fontSize: 14, color: '#666', fontWeight: '700' },
    timePreview:        { fontSize: 32, fontWeight: '900', color: '#1a1a2e', textAlign: 'center', marginBottom: 24 },

    wheelRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28, height: ITEM_HEIGHT * VISIBLE },
    colon:              { fontSize: 32, fontWeight: '900', color: '#1a1a2e', paddingBottom: 4 },

    wheelWrapper:       { height: ITEM_HEIGHT * VISIBLE, overflow: 'hidden', position: 'relative' },
    selectionBar:       { position: 'absolute', top: PAD * ITEM_HEIGHT, left: 0, right: 0, height: ITEM_HEIGHT, backgroundColor: '#f0fdf4', borderRadius: 12, borderWidth: 1.5, borderColor: '#16a34a', zIndex: 1 },
    wheelItem:          { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
    wheelText:          { fontSize: 22, fontWeight: '600', color: '#bbb' },
    wheelTextSelected:  { fontSize: 26, fontWeight: '900', color: '#16a34a' },

    ampmCol:            { gap: 10, marginLeft: 8 },
    ampmBtn:            { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f8f9fb', borderWidth: 1.5, borderColor: '#f0f0f0' },
    ampmBtnActive:      { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
    ampmText:           { fontSize: 14, fontWeight: '700', color: '#999' },
    ampmTextActive:     { color: '#fff' },

    confirmBtn:         { backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
    confirmBtnText:     { color: '#fff', fontWeight: '800', fontSize: 15 },
});