import { useEffect, useState, useRef } from 'react';
import { View, Animated, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import WelcomeScreen from './app/screens/WelcomeScreen';
import AuthScreen from './app/screens/AuthScreen';
import SetupScreen from './app/screens/SetupScreen';
import EventsScreen from './app/screens/EventsScreen';
import EventDetailScreen from './app/screens/EventDetailScreen';
import ProfileScreen from './app/screens/ProfileScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import CreateEventScreen from './app/screens/CreateEventScreen';
import EditProfileScreen from './app/screens/EditProfileScreen';
import EditAvatarScreen from './app/screens/EditAvatarScreen';
import DeleteSurveyScreen from './app/screens/DeleteSurveyScreen';
import HostProfileScreen from './app/screens/HostProfileScreen';
import PremiumScreen from './app/screens/PremiumScreen';
import RatingPopup from './app/screens/RatingPopup';
import { ToastProvider } from './app/screens/Toast';

import {
    getToken, saveToken, removeToken, getAuthMethod,
    saveUserCache, clearUserCache,
    getTokenForEmail, getCachedAccounts,
    verifyCachedToken, removeTokenForEmail,
} from './app/services/auth';
import { API_URL } from './app/config';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

import appCallbacks from './app/services/appCallbacks';

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#16a34a',
                tabBarInactiveTintColor: '#999',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopColor: '#f0f0f0',
                    height: 80,
                    paddingBottom: 8,
                },
                tabBarIcon: ({ focused, color, size }) => {
                    const icons = {
                        Explore: focused ? 'compass' : 'compass-outline',
                        Profile: focused ? 'person' : 'person-outline',
                        Settings: focused ? 'settings' : 'settings-outline',
                    };
                    return <Ionicons name={icons[route.name]} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Explore" component={EventsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="EditAvatar" component={EditAvatarScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="DeleteSurvey" component={DeleteSurveyScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="HostProfile" component={HostProfileScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Premium" component={PremiumScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        </Stack.Navigator>
    );
}

export default function App() {
    const [state, setState] = useState('welcome');
    const [setupInfo, setSetupInfo] = useState({ authMethod: 'email', socialUser: null });
    const [cachedUsers, setCachedUsers] = useState([]);
    const crossFade = useRef(new Animated.Value(1)).current;

    // Rating popup state
    const [pendingRatings, setPendingRatings] = useState([]);
    const [ratingPopupVisible, setRatingPopupVisible] = useState(false);
    const [currentRatingEvent, setCurrentRatingEvent] = useState(null);

    const transition = (newState, duration = 350) => {
        Animated.timing(crossFade, { toValue: 0, duration: 250, useNativeDriver: true }).start(async () => {
            setState(newState);
            Animated.timing(crossFade, { toValue: 1, duration: duration, useNativeDriver: true }).start();
        });
    };

    // ── Check for unrated past events and show popup ─────────────
    const checkPendingRatings = async () => {
        try {
            const token = await getToken();
            if (!token) return;
            const res = await fetch(`${API_URL}/users/me/pending-ratings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.pending?.length > 0) {
                    setPendingRatings(data.pending);
                    setCurrentRatingEvent(data.pending[0]);
                    // Small delay so the app loads first, then popup slides in
                    setTimeout(() => setRatingPopupVisible(true), 1500);
                }
            }
        } catch (e) {
            console.log('Pending ratings check error:', e);
        }
    };

    const handleRated = (eventId) => {
        const remaining = pendingRatings.filter(e => e.event_id !== eventId);
        setPendingRatings(remaining);
        if (remaining.length > 0) {
            // Show the next unrated event after a short pause
            setCurrentRatingEvent(remaining[0]);
            setTimeout(() => setRatingPopupVisible(true), 800);
        }
    };

    // ── Auth check ───────────────────────────────────────────────
    const checkAuth = async () => {
        try {
            const token = await getToken();
            if (!token) {
                const cached = await getCachedAccounts();
                setCachedUsers(cached || []);
                transition('auth');
                return;
            }
            const res = await fetch(`${API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                // Token expired or invalid — clear it so we don't loop
                await removeToken();
                const cached = await getCachedAccounts();
                setCachedUsers(cached || []);
                transition('auth');
                return;
            }
            const user = await res.json();
            await saveUserCache(user);

            // Silently archive any expired events on login
            fetch(`${API_URL}/sports-events/archive-expired`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {});

            if (!user.date_of_birth || !user.nationality || !user.first_name) {
                const method = await getAuthMethod();
                setSetupInfo({ authMethod: method || 'email', socialUser: user });
                transition('setup');
            } else {
                transition('app', 450);
                // After entering app, check if there are events to rate
                checkPendingRatings();
            }
        } catch {
            const cached = await getCachedAccounts();
            setCachedUsers(cached || []);
            transition('auth');
        }
    };

    const handleLogin = () => { setPrefillEmail(''); checkAuth(); };

    const [prefillEmail, setPrefillEmail] = useState('');

    const handleSwitchToAccount = async (email) => {
        const token = await getTokenForEmail(email);
        if (token) {
            // Verify the cached token is still valid
            const user = await verifyCachedToken(token);
            if (user) {
                await saveToken(token);
                await saveUserCache(user, token);
                if (!user.date_of_birth || !user.nationality || !user.first_name) {
                    const method = await getAuthMethod();
                    setSetupInfo({ authMethod: method || 'email', socialUser: user });
                    transition('setup');
                } else {
                    transition('app', 450);
                    checkPendingRatings();
                }
                return;
            }
            // Token expired — clear it from cache
            await removeTokenForEmail(email);
        }
        // No valid token — go to login with email prefilled
        setPrefillEmail(email);
        const cached = await getCachedAccounts();
        setCachedUsers(cached || []);
        transition('auth');
    };

    const handleSignup = (authMethod, socialUser) => {
        setSetupInfo({ authMethod, socialUser });
        transition('setup');
    };

    const handleSetupComplete = async (formData) => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/users/me`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    date_of_birth: formData.dateOfBirth || null,
                    nationality: formData.nationality || null,
                    phone_number: formData.phoneNumber || null,
                    bio: formData.bio || null,
                    sports: formData.sports?.length ? JSON.stringify(formData.sports) : null,
                    avatar_config: formData.photo ? null : JSON.stringify(formData.avatar),
                    avatar_photo: formData.photo || null,
                }),
            });
            if (res.ok) await saveUserCache(await res.json());
        } catch (e) {
            console.log('Setup save error:', e);
        }
        transition('app', 450);
        checkPendingRatings();
    };

    const handleLogout = async () => {
        await removeToken();
        const cached = await getCachedAccounts();
        setCachedUsers(cached || []);
        transition('auth', 400);
    };

    const handleDeleted = async () => {
        await removeToken();
        await clearUserCache();
        setCachedUsers([]);
        transition('auth', 400);
    };

    const handleDeactivated = async () => {
        await removeToken();
        const cached = await getCachedAccounts();
        setCachedUsers(cached || []);
        transition('auth', 400);
    };

    appCallbacks.onLogout = handleLogout;
    appCallbacks.onDeleted = handleDeleted;
    appCallbacks.onDeactivated = handleDeactivated;

    return (
        <ToastProvider>
            <Animated.View style={{ flex: 1, opacity: crossFade }}>
                {state === 'welcome' && <WelcomeScreen onFinish={checkAuth} />}
                {state === 'loading' && (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#060610' }}>
                        <ActivityIndicator size="large" color="#16a34a" />
                    </View>
                )}
                {state === 'auth' && (
                    <AuthScreen
                        onLogin={handleLogin}
                        onSignup={handleSignup}
                        cachedAccounts={cachedUsers}
                        onSwitchToAccount={handleSwitchToAccount}
                        onQuickLogin={handleLogin}
                        prefillEmail={prefillEmail}
                    />
                )}
                {state === 'setup' && (
                    <SetupScreen
                        onComplete={handleSetupComplete}
                        authMethod={setupInfo.authMethod}
                        socialUser={setupInfo.socialUser}
                    />
                )}
                {state === 'app' && (
                    <NavigationContainer>
                        <AppNavigator />
                    </NavigationContainer>
                )}

                <RatingPopup
                    visible={ratingPopupVisible}
                    event={currentRatingEvent}
                    onClose={() => setRatingPopupVisible(false)}
                    onRated={handleRated}
                />
            </Animated.View>
        </ToastProvider>
    );
}