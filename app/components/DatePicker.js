import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useState } from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

export default function DatePicker({ visible, onClose, onSelect, minDate }) {
    const today    = minDate || new Date();
    const [year,  setYear]  = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [selected, setSelected] = useState(null);

    const daysInMonth  = getDaysInMonth(year, month);
    const firstDay     = getFirstDayOfMonth(year, month);
    const totalCells   = Math.ceil((firstDay + daysInMonth) / 7) * 7;

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };

    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    const isDisabled = (day) => {
        if (!day) return true;
        const d = new Date(year, month, day);
        const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return d < t;
    };

    const isSelected = (day) => {
        if (!day || !selected) return false;
        return selected.getDate() === day && selected.getMonth() === month && selected.getFullYear() === year;
    };

    const isToday = (day) => {
        if (!day) return false;
        const t = new Date();
        return day === t.getDate() && month === t.getMonth() && year === t.getFullYear();
    };

    const handleSelect = (day) => {
        if (!day || isDisabled(day)) return;
        const d = new Date(year, month, day);
        setSelected(d);
    };

    const handleConfirm = () => {
        if (!selected) return;
        const yyyy = selected.getFullYear();
        const mm   = String(selected.getMonth() + 1).padStart(2, '0');
        const dd   = String(selected.getDate()).padStart(2, '0');
        onSelect(`${yyyy}-${mm}-${dd}`);
        onClose();
    };

    const cells = Array.from({ length: totalCells }, (_, i) => {
        const day = i - firstDay + 1;
        return (day >= 1 && day <= daysInMonth) ? day : null;
    });

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.sheet}>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Select Date</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Month nav */}
                    <View style={styles.monthNav}>
                        <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
                            <Text style={styles.navArrow}>‹</Text>
                        </TouchableOpacity>
                        <Text style={styles.monthLabel}>{MONTHS[month]} {year}</Text>
                        <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
                            <Text style={styles.navArrow}>›</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Day headers */}
                    <View style={styles.dayHeaders}>
                        {DAYS.map(d => (
                            <Text key={d} style={styles.dayHeader}>{d}</Text>
                        ))}
                    </View>

                    {/* Calendar grid */}
                    <View style={styles.grid}>
                        {cells.map((day, i) => {
                            const disabled = isDisabled(day);
                            const sel      = isSelected(day);
                            const tod      = isToday(day);
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        styles.cell,
                                        sel && styles.cellSelected,
                                        tod && !sel && styles.cellToday,
                                    ]}
                                    onPress={() => handleSelect(day)}
                                    disabled={disabled || !day}
                                >
                                    <Text style={[
                                        styles.cellText,
                                        disabled && styles.cellDisabled,
                                        sel && styles.cellTextSelected,
                                        tod && !sel && styles.cellTextToday,
                                    ]}>
                                        {day || ''}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Confirm */}
                    <TouchableOpacity
                        style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
                        onPress={handleConfirm}
                        disabled={!selected}
                    >
                        <Text style={styles.confirmBtnText}>
                            {selected
                                ? `Confirm — ${MONTHS[selected.getMonth()]} ${selected.getDate()}, ${selected.getFullYear()}`
                                : 'Select a date'}
                        </Text>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet:          { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    headerTitle:    { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
    closeBtn:       { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    closeBtnText:   { fontSize: 14, color: '#666', fontWeight: '700' },
    monthNav:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    navBtn:         { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8f9fb', justifyContent: 'center', alignItems: 'center' },
    navArrow:       { fontSize: 22, color: '#1a1a2e', fontWeight: '700', lineHeight: 26 },
    monthLabel:     { fontSize: 16, fontWeight: '800', color: '#1a1a2e' },
    dayHeaders:     { flexDirection: 'row', marginBottom: 8 },
    dayHeader:      { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#bbb' },
    grid:           { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    cell:           { width: `${100/7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 100 },
    cellSelected:   { backgroundColor: '#16a34a' },
    cellToday:      { backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#16a34a' },
    cellText:       { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
    cellDisabled:   { color: '#ddd' },
    cellTextSelected: { color: '#fff' },
    cellTextToday:  { color: '#16a34a' },
    confirmBtn:     { backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
    confirmBtnDisabled: { backgroundColor: '#e0e0e0' },
    confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});