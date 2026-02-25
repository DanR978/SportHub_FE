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
import { getToken, removeToken, getAuthMethod } from './app/services/auth';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const API_URL = 'http://192.168.4.131:8000';

function TabNavigator({ onLogout }) {
    return (
        <Tab.Navigator screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#16a34a',
            tabBarInactiveTintColor: '#999',
            tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#f0f0f0', height: 80, paddingBottom: 8 },
            tabBarIcon: ({ focused, color, size }) => {
                const icons = {
                    Explore:  focused ? 'compass'  : 'compass-outline',
                    Profile:  focused ? 'person'   : 'person-outline',
                    Settings: focused ? 'settings' : 'settings-outline',
                };
                return <Ionicons name={icons[route.name]} size={size} color={color} />;
            },
        })}>
            <Tab.Screen name="Explore"  component={EventsScreen} />
            <Tab.Screen name="Profile"  component={ProfileScreen} />
            <Tab.Screen name="Settings" children={() => <SettingsScreen onLogout={onLogout} />} />
        </Tab.Navigator>
    );
}

// Stack wraps the tabs so EventDetail can slide over everything
function AppNavigator({ onLogout }) {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" children={() => <TabNavigator onLogout={onLogout} />} />
            <Stack.Screen
                name="EventDetail"
                component={EventDetailScreen}
                options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
                name="CreateEvent"
                component={CreateEventScreen}
                options={{ animation: 'slide_from_bottom' }}
/>
        </Stack.Navigator>
    );
}

export default function App() {
    const [state, setState]       = useState('welcome');
    const [setupInfo, setSetupInfo] = useState({ authMethod: 'email', socialUser: null });
    const crossFade = useRef(new Animated.Value(1)).current;

    const transition = (newState) => {
        Animated.timing(crossFade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
            setState(newState);
            Animated.timing(crossFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        });
    };

    const checkAuth = async () => {
        try {
            const token = await getToken();
            if (!token) { transition('auth'); return; }
            const res = await fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) { transition('auth'); return; }
            const user = await res.json();
            if (!user.date_of_birth || !user.nationality) {
                const method = await getAuthMethod();
                setSetupInfo({ authMethod: method || 'email', socialUser: user });
                transition('setup');
            } else {
                transition('app');
            }
        } catch { transition('auth'); }
    };

    const handleLogin = () => checkAuth();

    const handleSignup = (authMethod, socialUser) => {
        setSetupInfo({ authMethod, socialUser });
        transition('setup');
    };

    const handleSetupComplete = async (formData) => {
        try {
            const token = await getToken();
            await fetch(`${API_URL}/users/me`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    first_name:    formData.firstName,
                    last_name:     formData.lastName,
                    date_of_birth: formData.dateOfBirth || null,
                    nationality:   formData.nationality || null,
                    phone_number:  formData.phoneNumber || null,
                    bio:           formData.bio || null,
                    sports:        formData.sports?.length ? JSON.stringify(formData.sports) : null,
                    avatar_config: formData.photo ? null : JSON.stringify(formData.avatar),
                    avatar_photo:  formData.photo || null,
                }),
            });
        } catch (e) { console.log('Setup save error:', e); }
        transition('app');
    };

    const handleLogout = async () => {
        await removeToken();
        transition('auth');
    };

    return (
        <Animated.View style={{ flex: 1, opacity: crossFade }}>
            {state === 'welcome' && <WelcomeScreen onFinish={checkAuth} />}
            {state === 'loading' && (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#060610' }}>
                    <ActivityIndicator size="large" color="#16a34a" />
                </View>
            )}
            {state === 'auth'  && <AuthScreen onLogin={handleLogin} onSignup={handleSignup} />}
            {state === 'setup' && <SetupScreen onComplete={handleSetupComplete} authMethod={setupInfo.authMethod} socialUser={setupInfo.socialUser} />}
            {state === 'app'   && (
                <NavigationContainer>
                    <AppNavigator onLogout={handleLogout} />
                </NavigationContainer>
            )}
        </Animated.View>
    );
}