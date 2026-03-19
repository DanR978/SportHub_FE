import "dotenv/config";

export default {
  expo: {
    name: "SportMap",
    slug: "SportMap",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.sportmap.app",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
        googleSignIn: {
          reservedClientId: process.env.GOOGLE_IOS_CLIENT_ID,
        },
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "SportMap needs your location to show nearby events.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: ["ACCESS_FINE_LOCATION"],
      edgeToEdgeEnabled: true,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-secure-store",
      "expo-web-browser",
      "expo-apple-authentication",
      "expo-location",
      "@react-native-community/datetimepicker",
    ],
    extra: {
      apiUrl: process.env.API_URL,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
      appleClientId: process.env.APPLE_CLIENT_ID,
      eas: {
        projectId: "7e41a264-e270-4be4-9162-1714e804b8c8",
      }
    },
  },
};