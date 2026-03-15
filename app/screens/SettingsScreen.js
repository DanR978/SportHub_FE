import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Switch } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import appCallbacks from '../services/appCallbacks';

// ── Simple info screen modal ─────────────────────────────────────────────────
function InfoModal({ visible, onClose, title, children }) {
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={s.modalContainer}>
                <View style={s.modalHeader}>
                    <TouchableOpacity onPress={onClose} style={s.modalBack}>
                        <Ionicons name="arrow-back" size={22} color="#1a1a2e" />
                    </TouchableOpacity>
                    <Text style={s.modalTitle}>{title}</Text>
                    <View style={{ width: 36 }} />
                </View>
                <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
                    {children}
                </ScrollView>
            </View>
        </Modal>
    );
}

function SectionText({ title, body }) {
    return (
        <View style={{ marginBottom: 20 }}>
            <Text style={s.infoTitle}>{title}</Text>
            <Text style={s.infoBody}>{body}</Text>
        </View>
    );
}

export default function SettingsScreen({ navigation }) {
    const [privacyVisible, setPrivacyVisible] = useState(false);
    const [notifVisible, setNotifVisible] = useState(false);
    const [helpVisible, setHelpVisible] = useState(false);
    const [termsVisible, setTermsVisible] = useState(false);
    const [policyVisible, setPolicyVisible] = useState(false);

    // Notification preferences (local state — connect to backend later)
    const [notifEventJoin, setNotifEventJoin] = useState(true);
    const [notifReminders, setNotifReminders] = useState(true);
    const [notifNearby, setNotifNearby] = useState(false);

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: () => appCallbacks.onLogout?.() },
        ]);
    };

    const SECTIONS = [
        {
            title: 'Account',
            items: [
                { icon: 'person-outline', label: 'Edit Profile', onPress: () => navigation.navigate('EditProfile') },
                { icon: 'lock-closed-outline', label: 'Privacy', onPress: () => setPrivacyVisible(true) },
                { icon: 'notifications-outline', label: 'Notifications', onPress: () => setNotifVisible(true) },
            ],
        },
        {
            title: 'Support',
            items: [
                { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => setHelpVisible(true) },
                { icon: 'document-text-outline', label: 'Terms of Service', onPress: () => setTermsVisible(true) },
                { icon: 'shield-outline', label: 'Privacy Policy', onPress: () => setPolicyVisible(true) },
            ],
        },
        {
            title: 'Danger Zone',
            items: [
                { icon: 'log-out-outline', label: 'Log Out', danger: true, onPress: handleLogout },
                {
                    icon: 'trash-outline', label: 'Delete Account', danger: true,
                    onPress: () => navigation.navigate('DeleteSurvey', {
                        onDeleted: () => appCallbacks.onDeleted?.(),
                        onDeactivated: () => appCallbacks.onDeactivated?.(),
                    }),
                },
            ],
        },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: '#f8f9fb' }}>
            <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
                <View style={s.header}>
                    <Text style={s.headerTitle}>Settings</Text>
                </View>
                {SECTIONS.map((section, si) => (
                    <View key={si} style={s.section}>
                        <Text style={s.sectionTitle}>{section.title}</Text>
                        {section.items.map((item, ii) => (
                            <TouchableOpacity key={ii} style={s.item} onPress={item.onPress} activeOpacity={0.7}>
                                <View style={[s.iconBox, item.danger && s.iconBoxDanger]}>
                                    <Ionicons name={item.icon} size={19} color={item.danger ? '#e94560' : '#1a1a2e'} />
                                </View>
                                <Text style={[s.label, item.danger && { color: '#e94560' }]}>{item.label}</Text>
                                {!item.danger && <Ionicons name="chevron-forward" size={18} color="#ccc" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
                <Text style={s.version}>SportHub v1.0.0</Text>
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* ── Privacy Modal ── */}
            <InfoModal visible={privacyVisible} onClose={() => setPrivacyVisible(false)} title="Privacy">
                <SectionText title="Profile Visibility" body="Your profile is visible to other SportHub users. Your email is never shared publicly. Only your first name, avatar, sports, and bio are visible to other players." />
                <SectionText title="Location Data" body="SportHub uses your location to show nearby events. Your exact location is never stored on our servers — only the approximate area is used for proximity filtering." />
                <SectionText title="Event Participation" body="When you join an event, the organizer and other participants can see your name and avatar. You can leave an event at any time to remove yourself from the participant list." />
                <SectionText title="Data You Can Control" body="You can edit or delete your profile information at any time from the Edit Profile screen. Deleting your account permanently removes all your data from our servers." />
            </InfoModal>

            {/* ── Notifications Modal ── */}
            <InfoModal visible={notifVisible} onClose={() => setNotifVisible(false)} title="Notifications">
                <View style={s.notifRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.notifLabel}>Event joins</Text>
                        <Text style={s.notifSub}>Get notified when someone joins your event</Text>
                    </View>
                    <Switch value={notifEventJoin} onValueChange={setNotifEventJoin} trackColor={{ true: '#16a34a' }} />
                </View>
                <View style={s.notifRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.notifLabel}>Event reminders</Text>
                        <Text style={s.notifSub}>Remind me 1 hour before events I joined</Text>
                    </View>
                    <Switch value={notifReminders} onValueChange={setNotifReminders} trackColor={{ true: '#16a34a' }} />
                </View>
                <View style={s.notifRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.notifLabel}>Nearby events</Text>
                        <Text style={s.notifSub}>Notify me about new events matching my sports</Text>
                    </View>
                    <Switch value={notifNearby} onValueChange={setNotifNearby} trackColor={{ true: '#16a34a' }} />
                </View>
                <Text style={s.notifNote}>Push notifications coming soon. These preferences will be saved once notifications are enabled.</Text>
            </InfoModal>

            {/* ── Help & Support Modal ── */}
            <InfoModal visible={helpVisible} onClose={() => setHelpVisible(false)} title="Help & Support">
                <SectionText title="How do I create an event?" body="Tap the red + button on the Explore screen. Fill in the sport, title, date, time, location, and player limit. Other users can then discover and join your event." />
                <SectionText title="How do I join an event?" body="Browse events on the Explore screen using list or map view. Tap an event card to see details, then tap 'Join Event' to reserve your spot." />
                <SectionText title="Can I cancel or leave an event?" body="Yes. If you joined an event, open the event details and tap 'Leave Event'. If you're the organizer, you can delete the event from the detail screen." />
                <SectionText title="How does host rating work?" body="After participating in an event, you can rate the host from 1-5 stars. Host ratings help the community identify reliable organizers." />
                <SectionText title="I forgot my password" body="On the login screen, tap 'Forgot password?' and enter your email. We'll send you a 6-digit code to reset your password." />
                <SectionText title="How do I delete my account?" body="Go to Settings → Delete Account. You'll have the option to deactivate (temporary) or permanently delete your account and all associated data." />
                <SectionText title="Contact us" body="For additional help, reach out to support@sportmap.app. We typically respond within 24 hours." />
            </InfoModal>

            {/* ── Terms of Service Modal ── */}
            <InfoModal visible={termsVisible} onClose={() => setTermsVisible(false)} title="Terms of Service">
                <SectionText title="1. Acceptance of Terms" body="By using SportHub, you agree to these Terms of Service. If you do not agree, please do not use the app." />
                <SectionText title="2. User Accounts" body="You must provide accurate information when creating an account. You are responsible for maintaining the security of your account and all activity under it." />
                <SectionText title="3. User Conduct" body="You agree not to use SportHub to post offensive content, harass other users, or create fraudulent events. We reserve the right to remove content or suspend accounts that violate these terms." />
                <SectionText title="4. Events & Safety" body="SportHub is a platform for organizing sports events. We do not guarantee the safety of any event. Users participate at their own risk and should exercise personal judgment." />
                <SectionText title="5. Content" body="You retain ownership of content you post. By posting content on SportHub, you grant us a license to display it within the app for the purpose of providing our service." />
                <SectionText title="6. Termination" body="We may suspend or terminate your access at any time for violation of these terms. You may delete your account at any time through the Settings screen." />
                <SectionText title="7. Changes" body="We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms." />
                <Text style={s.lastUpdated}>Last updated: March 2026</Text>
            </InfoModal>

            {/* ── Privacy Policy Modal ── */}
            <InfoModal visible={policyVisible} onClose={() => setPolicyVisible(false)} title="Privacy Policy">
                <SectionText title="Information We Collect" body="We collect the information you provide when creating an account (name, email, date of birth, nationality) and event data you create or join. We also collect approximate location data when you use the map features." />
                <SectionText title="How We Use Your Information" body="Your information is used to provide the SportHub service: displaying your profile to other users, showing nearby events, and sending notifications about events you've joined." />
                <SectionText title="Data Sharing" body="We do not sell your personal data. Your profile information (name, avatar, sports) is visible to other SportHub users. We may share anonymized, aggregate data for analytics purposes." />
                <SectionText title="Data Storage" body="Your data is stored securely on encrypted servers. Authentication tokens are stored locally on your device using secure storage." />
                <SectionText title="Your Rights" body="You can access, edit, or delete your personal data at any time through the app. Deleting your account removes all your data from our servers." />
                <SectionText title="Contact" body="For privacy-related questions, contact privacy@sportmap.app." />
                <Text style={s.lastUpdated}>Last updated: March 2026</Text>
            </InfoModal>
        </View>
    );
}

const s = StyleSheet.create({
    container:    { flex: 1, backgroundColor: '#f8f9fb' },
    header:       { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 10 },
    headerTitle:  { fontSize: 28, fontWeight: '800', color: '#1a1a2e' },
    section:      { marginTop: 24, marginHorizontal: 20 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    item:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    iconBox:      { width: 34, height: 34, borderRadius: 10, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    iconBoxDanger:{ backgroundColor: '#fdecea' },
    label:        { flex: 1, fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
    version:      { textAlign: 'center', color: '#ccc', fontSize: 12, fontWeight: '600', marginTop: 32 },
    // Modal
    modalContainer: { flex: 1, backgroundColor: '#f8f9fb' },
    modalHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    modalBack:      { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
    modalTitle:     { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
    modalBody:      { padding: 20 },
    // Info content
    infoTitle:  { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
    infoBody:   { fontSize: 14, color: '#666', lineHeight: 21 },
    lastUpdated:{ fontSize: 12, color: '#bbb', textAlign: 'center', marginTop: 12, marginBottom: 40 },
    // Notifications
    notifRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    notifLabel: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
    notifSub:   { fontSize: 12, color: '#999', marginTop: 2 },
    notifNote:  { fontSize: 13, color: '#bbb', textAlign: 'center', marginTop: 20, lineHeight: 19, paddingHorizontal: 10 },
});
