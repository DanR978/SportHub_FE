import { View, Text, StyleSheet, Platform } from 'react-native';
import { useState, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// AdBanner — Google AdMob banner ad
//
// SETUP:
// 1. npm install react-native-google-mobile-ads
// 2. Add to app.config.js plugins:
   ["react-native-google-mobile-ads", {
       androidAppId: "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY",
       iosAppId:     "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY",
   }]
// 3. Replace TEST_AD_UNIT_IDS below with your real ad unit IDs from AdMob
// 4. For dev/testing, the test IDs below show Google's test ads
// ─────────────────────────────────────────────────────────────────────────────

// Test ad unit IDs — replace with real ones from AdMob dashboard before production
const AD_UNIT_IDS = {
    ios:     'ca-app-pub-3940256099942544/2934735716', // Google test banner
    android: 'ca-app-pub-3940256099942544/6300978111', // Google test banner
};

let BannerAd = null;
let BannerAdSize = null;
let AdLoaded = false;

try {
    const admob = require('react-native-google-mobile-ads');
    BannerAd = admob.BannerAd;
    BannerAdSize = admob.BannerAdSize;
    AdLoaded = true;
} catch {
    // AdMob not installed — show placeholder
    AdLoaded = false;
}

export default function AdBanner({ style }) {
    const [adError, setAdError] = useState(false);

    if (!AdLoaded || adError) {
        // Placeholder — renders nothing when ads aren't configured
        return null;
    }

    const unitId = Platform.OS === 'ios' ? AD_UNIT_IDS.ios : AD_UNIT_IDS.android;

    return (
        <View style={[styles.container, style]}>
            <BannerAd
                unitId={unitId}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                requestOptions={{ requestNonPersonalizedAdsOnly: true }}
                onAdFailedToLoad={() => setAdError(true)}
            />
        </View>
    );
}

// Smaller inline ad for between list items
export function AdBannerInline({ style }) {
    const [adError, setAdError] = useState(false);

    if (!AdLoaded || adError) return null;

    const unitId = Platform.OS === 'ios' ? AD_UNIT_IDS.ios : AD_UNIT_IDS.android;

    return (
        <View style={[styles.inlineContainer, style]}>
            <Text style={styles.adLabel}>Sponsored</Text>
            <BannerAd
                unitId={unitId}
                size={BannerAdSize.MEDIUM_RECTANGLE}
                requestOptions={{ requestNonPersonalizedAdsOnly: true }}
                onAdFailedToLoad={() => setAdError(true)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container:       { alignItems: 'center', backgroundColor: '#f8f9fb', paddingVertical: 4 },
    inlineContainer: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginVertical: 8, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
    adLabel:         { fontSize: 10, fontWeight: '600', color: '#ccc', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
});