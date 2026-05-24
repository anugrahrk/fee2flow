import './global.css';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from './screens/OnboardingScreen';

import OpeningScreen from './screens/OpeningScreen';
import LoginScreen from './screens/LoginScreen';
import SuperAdminTabs from './screens/SuperAdminTabs';
import AdminTabs from './screens/AdminTabs';
import UserTabs from './screens/UserTabs';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Placeholder screens — replace with real ones as you build them
import { View, Text } from 'react-native';

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';


const Stack = createNativeStackNavigator();

export default function App() {
    const [isReady, setIsReady] = useState(false);
    const [initialRoute, setInitialRoute] = useState('Onboarding1');

    useEffect(() => {
        const checkAppLaunch = async () => {
            try {
                const hasSeenOpening = await AsyncStorage.getItem('hasSeenOpening');
                if (hasSeenOpening === 'true') {
                    setInitialRoute('OpeningScreen'); // Changed from Login so OpeningScreen can check session
                }
            } catch (error) {
                console.error("Error reading AsyncStorage", error);
            } finally {
                setIsReady(true);
            }
        };
        checkAppLaunch();
    }, []);

    if (!isReady) return null; // Or a splash screen

    return (
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName={initialRoute as any}
                    screenOptions={{
                        headerShown: false,        // hide default header — we build our own
                        animation: 'slide_from_right', // smooth slide transition
                        contentStyle: { backgroundColor: '#0a1628' }
                    }}
                >
                    <Stack.Screen name="Onboarding1" component={OnboardingScreen} />
                    <Stack.Screen name="OpeningScreen" component={OpeningScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="SuperAdminTabs" component={SuperAdminTabs} />
                    <Stack.Screen name="AdminTabs" component={AdminTabs} />
                    <Stack.Screen name="UserTabs" component={UserTabs} />
                </Stack.Navigator>
            </NavigationContainer>
        </ClerkProvider>
    );
}