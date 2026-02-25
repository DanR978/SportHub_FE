import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ onFinish }) {
    const bar0 = useRef(new Animated.Value(0)).current;
    const bar1 = useRef(new Animated.Value(0)).current;
    const bar2 = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const screenOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.stagger(130, [
                Animated.spring(bar0, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
                Animated.spring(bar1, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
                Animated.spring(bar2, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]),
            Animated.timing(taglineOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.delay(900),
            Animated.timing(screenOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start(() => onFinish());
    }, []);

    const barHeights = [28, 44, 34];
    const barAnims = [bar0, bar1, bar2];

    return (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: screenOpacity }]}>
            <LinearGradient colors={['#060610', '#0a0a18', '#0d0d20']} style={StyleSheet.absoluteFill} />
            <View style={{ position: 'absolute', top: height * 0.3, left: width / 2 - 100, width: 200, height: 200, borderRadius: 100, backgroundColor: '#16a34a', opacity: 0.06 }} />
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5 }}>
                        {barAnims.map((anim, i) => (
                            <Animated.View key={i} style={{ width: 5, height: barHeights[i], backgroundColor: '#16a34a', borderRadius: 3, transform: [{ scaleY: anim }], opacity: anim }} />
                        ))}
                    </View>
                    <Animated.Text style={{ fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: 5, opacity: logoOpacity }}>
                        SPORTHUB
                    </Animated.Text>
                </View>
                <Animated.Text style={{ fontSize: 11, fontWeight: '700', color: '#16a34a', letterSpacing: 4, opacity: taglineOpacity }}>
                    FIND YOUR GAME
                </Animated.Text>
            </View>
            <Animated.View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', paddingBottom: 60, opacity: taglineOpacity }}>
                {[0,1,2].map(i => <View key={i} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#ffffff22' }} />)}
            </Animated.View>
        </Animated.View>
    );
}