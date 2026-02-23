import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SETTINGS_SECTIONS = [
    {
        title: 'Account',
        items: [
            { icon: 'person-outline', label: 'Edit Profile' },
            { icon: 'lock-closed-outline', label: 'Privacy' },
            { icon: 'notifications-outline', label: 'Notifications' },
        ]
    },
    {
        title: 'Support',
        items: [
            { icon: 'help-circle-outline', label: 'Help & Support' },
            { icon: 'document-text-outline', label: 'Terms of Service' },
            { icon: 'shield-outline', label: 'Privacy Policy' },
        ]
    },
    {
        title: 'Danger Zone',
        items: [
            { icon: 'log-out-outline', label: 'Log Out', danger: true },
            { icon: 'trash-outline', label: 'Delete Account', danger: true },
        ]
    },
];

export default function SettingsScreen() {
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            {SETTINGS_SECTIONS.map((section, sIndex) => (
                <View key={sIndex} style={styles.section}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    {section.items.map((item, iIndex) => (
                        <TouchableOpacity key={iIndex} style={styles.settingsItem}>
                            <View style={[styles.iconWrapper, item.danger && styles.iconWrapperDanger]}>
                                <Ionicons
                                    name={item.icon}
                                    size={19}
                                    color={item.danger ? '#e94560' : '#1a1a2e'}
                                />
                            </View>
                            <Text style={[styles.label, item.danger && { color: '#e94560' }]}>
                                {item.label}
                            </Text>
                            {!item.danger && (
                                <Ionicons name="chevron-forward" size={18} color="#ccc" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            ))}
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fb' },
    header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#1a1a2e' },
    section: { marginTop: 24, marginHorizontal: 20 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    settingsItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    iconWrapper: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    iconWrapperDanger: { backgroundColor: '#fdecea' },
    label: { flex: 1, fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
});