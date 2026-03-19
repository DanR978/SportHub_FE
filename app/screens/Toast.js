import { useEffect, useRef, useState, createContext, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ── Toast Context ────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

export function useToast() {
    return useContext(ToastContext);
}

const ICONS = {
    success: 'checkmark-circle',
    error:   'alert-circle',
    warning: 'warning',
    info:    'information-circle',
};

const COLORS = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '#16a34a', text: '#15803d' },
    error:   { bg: '#fef2f2', border: '#fecaca', icon: '#e94560', text: '#dc2626' },
    warning: { bg: '#fffbeb', border: '#fde68a', icon: '#f59e0b', text: '#d97706' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', icon: '#3b82f6', text: '#2563eb' },
};

function ToastItem({ toast, onDismiss }) {
    const slideY = useRef(new Animated.Value(-80)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(slideY, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();

        const timer = setTimeout(() => dismiss(), toast.duration || 3000);
        return () => clearTimeout(timer);
    }, []);

    const dismiss = () => {
        Animated.parallel([
            Animated.timing(slideY, { toValue: -80, duration: 200, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => onDismiss(toast.id));
    };

    const c = COLORS[toast.type] || COLORS.info;

    return (
        <Animated.View style={[s.toast, { backgroundColor: c.bg, borderColor: c.border, transform: [{ translateY: slideY }], opacity }]}>
            <TouchableOpacity style={s.toastInner} onPress={dismiss} activeOpacity={0.8}>
                <Ionicons name={ICONS[toast.type] || 'information-circle'} size={20} color={c.icon} />
                <View style={s.toastContent}>
                    {toast.title && <Text style={[s.toastTitle, { color: c.text }]}>{toast.title}</Text>}
                    <Text style={[s.toastMessage, { color: c.text }]} numberOfLines={2}>{toast.message}</Text>
                </View>
                <Ionicons name="close" size={16} color={c.icon} style={{ opacity: 0.5 }} />
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Toast Provider — wrap your app in this ───────────────────────────────────
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const show = useCallback(({ type = 'info', title, message, duration = 3000 }) => {
        const id = ++idRef.current;
        setToasts(prev => [...prev, { id, type, title, message, duration }]);
    }, []);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Convenience methods
    const toast = useCallback({
        success: (message, title) => show({ type: 'success', message, title, duration: 2500 }),
        error:   (message, title) => show({ type: 'error', message, title: title || 'Error', duration: 4000 }),
        warning: (message, title) => show({ type: 'warning', message, title, duration: 3500 }),
        info:    (message, title) => show({ type: 'info', message, title, duration: 3000 }),
    }, [show]);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <View style={s.container} pointerEvents="box-none">
                {toasts.map(t => (
                    <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
                ))}
            </View>
        </ToastContext.Provider>
    );
}

const s = StyleSheet.create({
    container:    { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 24, left: 16, right: 16, zIndex: 9999 },
    toast:        { borderRadius: 14, borderWidth: 1, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    toastInner:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 16 },
    toastContent: { flex: 1 },
    toastTitle:   { fontSize: 14, fontWeight: '700', marginBottom: 1 },
    toastMessage: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
});