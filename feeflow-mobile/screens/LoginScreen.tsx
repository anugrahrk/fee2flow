import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, StatusBar, Alert } from 'react-native';
import { useSignIn, useSignUp, useAuth, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { useUserStore } from '../src/store/userStore';
import { AntDesign } from '@expo/vector-icons';
// To handle Google OAuth flow
WebBrowser.maybeCompleteAuthSession();

type Props = {
    navigation: any;
};

export default function LoginScreen({ navigation }: Props) {
    const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
    const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
    const { getToken, isSignedIn, signOut } = useAuth();
    const { fetchProfile } = useUserStore();
    const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
    
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        void WebBrowser.warmUpAsync();
        return () => {
            void WebBrowser.coolDownAsync();
        };
    }, []);

    useEffect(() => {
        if (isSignedIn) {
            handleRoleRedirect();
        }
    }, [isSignedIn]);

    const navigateByRole = (role: string | null) => {
        if (role === 'super_user') {
            navigation.replace('SuperAdminTabs');
        } else if (role === 'admin') {
            navigation.replace('AdminTabs');
        } else {
            navigation.replace('UserTabs');
        }
    };

    const handleRoleRedirect = async () => {
        setIsLoading(true);
        try {
            const role = await fetchProfile(getToken);
            
            if (!role) {
                const currentError = useUserStore.getState().error;
                if (currentError) {
                    Alert.alert("Access Denied", currentError);
                    await signOut();
                    return; // Prevent navigation
                }
            }
            
            navigateByRole(role);
        } catch (error) {
            console.error("Error fetching role on redirect", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailSubmit = async () => {
        if (!isSignInLoaded || !email) return;
        setIsLoading(true);
        setErrorMsg('');

        try {
            // Try to Sign In
            try {
                const { supportedFirstFactors } = await signIn.create({ identifier: email });
                const emailCodeFactor = supportedFirstFactors?.find(f => f.strategy === "email_code");

                if (emailCodeFactor && 'emailAddressId' in emailCodeFactor) {
                    await signIn.prepareFirstFactor({
                        strategy: "email_code",
                        emailAddressId: emailCodeFactor.emailAddressId,
                    });
                    setStep('otp');
                    return;
                }
            } catch (err: any) {
                // If user doesn't exist, start Sign Up instead
                if (err.errors?.[0]?.code === "form_identifier_not_found") {
                    if (!isSignUpLoaded) return;
                    await signUp.create({ emailAddress: email });
                    await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
                    setStep('otp');
                    return;
                }
                throw err;
            }
        } catch (err: any) {
            console.error("Email flow error:", err);
            setErrorMsg(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp) return;
        setIsLoading(true);
        setErrorMsg('');

        try {
            if (isSignUpLoaded && signUp?.status === "missing_requirements") {
                const completeSignUp = await signUp.attemptEmailAddressVerification({ code: otp });
                if (completeSignUp.status === "complete") {
                    await setActive!({ session: completeSignUp.createdSessionId });
                    
                    const role = await fetchProfile(getToken);
                    if (!role) {
                        const currentError = useUserStore.getState().error;
                        if (currentError) {
                            Alert.alert("Access Denied", currentError);
                            await signOut();
                            return;
                        }
                    }
                    navigateByRole(role);
                    return;
                }
            } else if (isSignInLoaded && signIn?.status === "needs_first_factor") {
                const completeSignIn = await signIn.attemptFirstFactor({
                    strategy: "email_code",
                    code: otp,
                });
                if (completeSignIn.status === "complete") {
                    await setActive!({ session: completeSignIn.createdSessionId });
                    
                    const role = await fetchProfile(getToken);
                    if (!role) {
                        const currentError = useUserStore.getState().error;
                        if (currentError) {
                            Alert.alert("Access Denied", currentError);
                            await signOut();
                            return;
                        }
                    }
                    navigateByRole(role);
                    return;
                }
            }
        } catch (err: any) {
            console.error("OTP Verification Error:", err);
            setErrorMsg(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Invalid OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            const { createdSessionId, setActive } = await startOAuthFlow();
            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
                // Role redirect will be handled by the useEffect on isSignedIn
            }
        } catch (err: any) {
            console.error("Google Sign In Error:", err);
            setErrorMsg(err.errors?.[0]?.message || err.message || "Failed to start Google Sign In");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-[#0b101e]">
            <StatusBar barStyle="light-content" />


            {/* Main Content */}
            <View className="flex-1 px-6 justify-center">
                {/* Title Section */}
                <View className="items-center mb-10">
                    <View className="flex-row items-center">
                        <Text className="text-white font-bold text-[54px] tracking-tight">FEE<Text className='text-blue-500'>2</Text>FLOW</Text>
                    </View>
                    <Text className="text-gray-400 text-lg text-center mt-2">
                        Frictionless payments for modern institutions.
                    </Text>
                </View>

                {/* Login Card */}
                <View className="bg-[#131b2f] border border-gray-800 rounded-3xl p-6">
                    <Text className="text-white text-3xl font-bold mb-2 text-center">
                        {step === 'email' ? 'Welcome Back' : 'Verify Email'}
                    </Text>
                    <Text className="text-gray-400 text-base mb-6 text-center">
                        {step === 'email' 
                            ? 'Please enter your email to access your account.' 
                            : `We've sent a code to ${email}`}
                    </Text>

                    {errorMsg ? (
                        <Text className="text-red-400 text-sm mb-4">{errorMsg}</Text>
                    ) : null}

                    {step === 'email' ? (
                        <View>
                            <Text className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-2 pl-3">
                                Email Address
                            </Text>
                            <View className="bg-[#0b101e] border border-gray-800 rounded-xl px-4 h-14 justify-center mb-6">
                                <TextInput
                                    className="text-white text-base"
                                    placeholder="name@company.com"
                                    placeholderTextColor="#475569"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <TouchableOpacity 
                                className="bg-blue-500 h-14 rounded-xl items-center justify-center flex-row"
                                onPress={handleEmailSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Text className="text-white font-semibold text-lg mr-2">Continue with Email</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <View className="flex-row items-center my-6">
                                <View className="flex-1 h-[1px] bg-gray-800" />
                                <Text className="text-slate-500 text-xs font-bold tracking-widest px-4">
                                    OR CONTINUE WITH
                                </Text>
                                <View className="flex-1 h-[1px] bg-gray-800" />
                            </View>

                            <TouchableOpacity 
                                className="bg-[#1e293b]/50 border border-slate-700 h-14 rounded-xl items-center justify-center flex-row"
                                onPress={handleGoogleSignIn}
                                disabled={isLoading}
                            >
                               
                            <AntDesign name="google" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            <Text className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-2">
                                Verification Code
                            </Text>
                            <View className="bg-[#0b101e] border border-gray-800 rounded-xl px-4 h-14 justify-center mb-6">
                                <TextInput
                                    className="text-white text-base"
                                    placeholder="Enter 6-digit code"
                                    placeholderTextColor="#475569"
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="number-pad"
                                />
                            </View>

                            <TouchableOpacity 
                                className="bg-blue-500 h-14 rounded-xl items-center justify-center"
                                onPress={handleVerifyOtp}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-semibold text-lg">Verify</Text>
                                )}
                            </TouchableOpacity>
                            
                            <TouchableOpacity className="mt-4 items-center" onPress={() => setStep('email')}>
                                <Text className="text-blue-400 font-medium">Use a different email</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    
                    {/* {step === 'email' && (
                        <View className="mt-6 items-center">
                            <Text className="text-slate-400">
                                Don't have an account? <Text className="text-blue-500 font-semibold" onPress={() => {}}>Get Started</Text>
                            </Text>
                        </View>
                    )} */}
                </View>
            </View>

            {/* Footer */}
            <View className="pb-12 pt-4 flex-row justify-center items-center gap-6">
                <View className="flex-row items-center gap-2">
                    <Text className="text-green-500">✓</Text>
                    <Text className="text-slate-500 text-xs font-bold tracking-widest">BANK-GRADE SECURITY</Text>
                </View>
                <View className="flex-row items-center gap-2">
                    <Text className="text-purple-500">⚡</Text>
                    <Text className="text-slate-500 text-xs font-bold tracking-widest">REAL-TIME SETTLEMENT</Text>
                </View>
            </View>
        </View>
    );
}
