import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';
import { useUserStore } from '../src/store/userStore';

type Props = {
    navigation: any;
};

// Create animated component from LinearGradient
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function OpeningScreen({ navigation }: Props) {
    const { isSignedIn, getToken, isLoaded, signOut } = useAuth();
    const { fetchProfile } = useUserStore();
    const gradientAnim = useRef(new Animated.Value(0)).current;
    const [statusText, setStatusText] = useState('Initializing...');
    const hasNavigated = useRef(false);

    // Start gradient animation
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(gradientAnim, {
                    toValue: 1,
                    duration: 4000,
                    useNativeDriver: false,
                }),
                Animated.timing(gradientAnim, {
                    toValue: 0,
                    duration: 4000,
                    useNativeDriver: false,
                })
            ])
        ).start();
    }, []);
    // Set the hasSeenOpening flag once
    useEffect(() => {
        AsyncStorage.setItem('hasSeenOpening', 'true').catch(console.error);
    }, []);

    // Wait for Clerk to load, THEN check session — this runs every time isLoaded changes
    useEffect(() => {
        if (!isLoaded || hasNavigated.current) return;
        const checkBackendStatus=()=>{
            fetch(process.env.EXPO_PUBLIC_API_URL!)
            .then(() => {
                setStatusText("Server is live")
            })
            .catch(() => {
                setStatusText('Server failed. try again later');
            });

        }

        const checkSessionAndRedirect = async () => {
            // Small delay for the splash screen visual
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (hasNavigated.current) return;

            if (isSignedIn) {
                setStatusText('Checking your account...');
                try {
                    const role = await fetchProfile(getToken);
                    if (hasNavigated.current) return;
                    hasNavigated.current = true;

                    console.log('User role detected:', role);

                    if (!role) {
                        const currentError = useUserStore.getState().error;
                        if (currentError) {
                            console.error('Access Denied:', currentError);
                            // Call sign out to clear the bad session
                            try {
                                await signOut();
                            } catch (e) {
                                console.error('Error signing out:', e);
                            }
                        }
                        navigation.replace('Login');
                        return;
                    }

                    if (role === 'super_user') {
                        navigation.replace('SuperAdminTabs');
                    } else if (role === 'admin') {
                        navigation.replace('AdminTabs');
                    } else {
                        navigation.replace('UserTabs');
                    }
                } catch (error) {
                    console.error('Profile fetch failed:', error);
                    if (hasNavigated.current) return;
                    hasNavigated.current = true;
                    // Even if profile fetch fails, user IS signed in.
                    // Send them to a default dashboard or login to re-auth
                    navigation.replace('Login');
                }
            } else {
                setStatusText('Redirecting to login...');
                hasNavigated.current = true;
                navigation.replace('Login');
            }
        };
        checkBackendStatus()
        checkSessionAndRedirect();
    }, [isLoaded]); // Re-run when isLoaded becomes true

    // Interpolate colors for the live background effect
    const color1 = gradientAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#0f172a', '#1e1b4b']
    });
    
    const color2 = gradientAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#172554', '#0f172a']
    });

    return (
        <View className="flex-1">
            <StatusBar barStyle="light-content" />
            
            <AnimatedLinearGradient
                colors={[color1 as unknown as string, color2 as unknown as string]}
                style={{ flex: 1 }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Center Content */}
                <View className="flex-1 items-center justify-center px-6">
                    <View className="w-64 h-64 mb-8 bg-[#0a1628]/50 rounded-[40px] border border-blue-500/20 shadow-2xl items-center justify-center">
                        <Image
                            source={require('../assets/logo.png')}
                            style={{ width: '100%', height: '100%', borderRadius: 30 }}
                            resizeMode='cover'
                        />
                    </View>
                    
                    <Text className="text-white font-bold text-[54px] tracking-tight mb-2">
                        FEE<Text className='text-blue-500'>2</Text>FLOW
                    </Text>
                    <Text className="text-gray-400 text-lg text-center">
                        Streamline your fintech destiny.
                    </Text>
                </View>

                {/* Footer with status */}
                <View className="px-6 pb-12 items-center">
                    <Text className="text-slate-500 text-xs font-bold tracking-[0.2em] mb-4 uppercase">
                        Powered by Razorpay and Clerk
                    </Text>
                    <ActivityIndicator size="small" color="#3b82f6" />
                    <Text className="text-slate-600 text-xs mt-2">{statusText}</Text>
                </View>
            </AnimatedLinearGradient>
        </View>
    );
}
