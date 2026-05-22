import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, Pressable, Alert, Platform } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useUserStore } from '../../src/store/userStore';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { LogOut, User, CheckCircle2, Calendar, Download, FileText } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

let RazorpayCheckout: any = null;
try {
    RazorpayCheckout = require('react-native-razorpay').default;
} catch (e) {
    console.log("Razorpay native module not found (expected in Expo Go or iOS without custom build)");
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

type Props = {
    navigation?: any;
};

export default function UserPayment({ navigation }: Props) {
    const { getToken, signOut } = useAuth();
    const { user } = useUser();
    const { logout } = useUserStore();

    const [profileOpen, setProfileOpen] = useState(false);
    const [studentProfile, setStudentProfile] = useState<any>(null);
    const [outstandingBalance, setOutstandingBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [paymentResult, setPaymentResult] = useState<'success' | 'failed' | null>(null);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };

            const profileRes = await axios.get(`${API_URL}/api/student/profile`, { headers });
            setStudentProfile(profileRes.data.student);
            setOutstandingBalance(profileRes.data.outstandingBalance);

            const txRes = await axios.get(`${API_URL}/api/student/transactions`, { headers });
            setTransactions(txRes.data || []);
        } catch (error) {
            console.error("Error fetching user data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setProfileOpen(false);
        try {
            await signOut();
            logout();
            if (navigation) {
                const parentNav = navigation.getParent();
                if (parentNav) {
                    parentNav.replace('Login');
                } else {
                    navigation.replace('Login');
                }
            }
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    const handlePayNow = async () => {
        if (!studentProfile?._id || outstandingBalance <= 0) return;
        setPaying(true);
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };

            // 1. Create Order
            const { data: orderData } = await axios.post(`${API_URL}/payments/create-order`, {
                studentId: studentProfile._id,
                amount: outstandingBalance
            }, { headers });

            if (!orderData || !orderData.id) {
                throw new Error("Invalid order data received");
            }

            // 2. Open Razorpay
            const options = {
                description: 'Tuition Payment',
                image: 'https://feeflow.in/logo.png', // Or app logo URL
                currency: orderData.currency,
                key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'YOUR_RAZORPAY_KEY', // You need EXPO_PUBLIC_RAZORPAY_KEY_ID in .env
                amount: orderData.amount,
                name: studentProfile.organizationId?.orgName || 'FeeFlow',
                order_id: orderData.id,
                prefill: {
                    email: studentProfile.email || user?.primaryEmailAddress?.emailAddress,
                    contact: studentProfile.mobileNumber || '',
                    name: studentProfile.studentName || user?.firstName
                },
                theme: { color: '#3b82f6' }
            };

            if (Platform.OS === 'android' && RazorpayCheckout) {
                RazorpayCheckout.open(options).then(async (data: any) => {
                    // 3. Verify Payment
                    try {
                        const verifyRes = await axios.post(`${API_URL}/payments/verify-payment`, {
                            razorpay_order_id: data.razorpay_order_id,
                            razorpay_payment_id: data.razorpay_payment_id,
                            razorpay_signature: data.razorpay_signature,
                            studentId: studentProfile._id,
                            amount: outstandingBalance,
                            organizationId: studentProfile.organizationId
                        }, { headers });

                        if (verifyRes.data.status === 'success') {
                            setPaymentResult('success');
                            fetchData(); // Refresh data
                        } else {
                            setPaymentResult('failed');
                        }
                    } catch (verifyError) {
                        console.error("Verification error:", verifyError);
                        setPaymentResult('failed');
                    }
                }).catch((error: any) => {
                    console.log("Payment Error or Cancelled:", error);
                    setPaymentResult('failed');
                });
            } else {
                // Mock payment for iOS since native SDK won't compile without Apple Dev account
                Alert.alert(
                    "Simulated Payment",
                    "Razorpay is only enabled on Android for now. Would you like to simulate a successful payment?",
                    [
                        { text: "Cancel", style: "cancel", onPress: () => setPaymentResult('failed') },
                        { 
                            text: "Simulate Success", 
                            onPress: () => {
                                setPaymentResult('success');
                                fetchData();
                            }
                        }
                    ]
                );
            }

        } catch (error) {
            console.error("Error initiating payment", error);
            setPaymentResult('failed');
        } finally {
            setPaying(false);
        }
    };

    const handleDownloadReceipt = async (paymentId: string) => {
        setDownloading(paymentId);
        try {
            const token = await getToken();
            const fileUri = `${FileSystem.documentDirectory}receipt_${paymentId}.pdf`;
            
            const downloadRes = await FileSystem.downloadAsync(
                `${API_URL}/payments/receipt/${paymentId}`,
                fileUri,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (downloadRes.status === 200) {
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(downloadRes.uri);
                } else {
                    Alert.alert('Success', 'Receipt saved, but sharing is not available on this device.');
                }
            } else {
                Alert.alert('Error', 'Failed to fetch receipt from the server.');
            }
        } catch (error) {
            console.error("Error downloading receipt:", error);
            Alert.alert('Error', 'Failed to download receipt.');
        } finally {
            setDownloading(null);
        }
    };

    const userEmail = user?.primaryEmailAddress?.emailAddress || 'Unknown';
    const userName = studentProfile?.studentName || user?.firstName || 'Student';
    const userInitials = userName.substring(0, 2).toUpperCase();

    // Default dates for the UI if not available from backend easily
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const expectedDate = nextMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
            <View className={`flex-1 bg-[#0b101e] ${Platform.OS === 'android' ? 'pt-9' : 'pt-9'}`}>
            {/* Header */}
            <View className="px-6 pt-6 pb-4 bg-[#131b2f] border-b border-gray-800 flex-row justify-between items-center z-50">
                <View className="flex-row items-center gap-1">
                    <View className="w-20 h-12">
                    <Image
                                                source={require('../../assets/logo.png')}
                                                style={{ width: '100%', height: '100%', borderRadius: 30 }}
                                                resizeMode='contain'
                                            />
                    </View>
                    <Text className="text-white text-xl font-bold tracking-widest">FEE<Text className='text-blue-500'>2</Text>FLOW</Text>
                </View>
                {/* Profile Icon */}
                <TouchableOpacity onPress={() => setProfileOpen(!profileOpen)}>
                    <View className="w-10 h-10 bg-blue-500/20 rounded-full border border-blue-500/30 items-center justify-center">
                        <Text className="text-blue-400 font-bold text-sm">{userInitials}</Text>
                    </View>
                </TouchableOpacity>
            </View>

                {/* Profile Dropdown Modal */}
            <Modal visible={profileOpen} transparent animationType="fade">
                <Pressable className="flex-1" onPress={() => setProfileOpen(false)}>
                    <View className={`absolute top-16 right-0 bg-[#1e293b] border border-gray-700 rounded-2xl p-5 w-72 shadow-2xl ${Platform.OS === 'android' ? 'mt-16' : 'mt-16'}`} style={{ elevation: 10 }}>
                        {/* User Info */}
                        <View className="items-center mb-4 pb-4 border-b border-gray-700">
                            <View className="w-16 h-16 bg-blue-500/20 rounded-full border-2 border-blue-500/30 items-center justify-center mb-3">
                                <User color="#3b82f6" size={28} />
                            </View>
                            <Text className="text-white font-bold text-base mb-1">Super Admin</Text>
                            <Text className="text-slate-400 text-sm">{userEmail}</Text>
                        </View>

                        {/* Logout Button */}
                        <TouchableOpacity 
                            onPress={handleLogout}
                            className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex-row items-center justify-center gap-2"
                        >
                            <LogOut color="#ef4444" size={18} />
                            <Text className="text-red-400 font-bold text-sm">Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
            <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
                {loading ? (
                    <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />
                ) : (
                    <>
                        {/* Status Icon */}
                        <View className="items-center mb-10">
                            {outstandingBalance > 0 ? (
                                <>
                                    {/* <View className="bg-red-500/10 p-4 rounded-full border border-red-500/20 mb-4">
                                        <ActivityIndicator color="#ef4444" size="large" /> 
                                    </View> */}
                                    <Text className="text-white text-[32px] font-bold mb-2">Pending Dues!</Text>
                                    <Text className="text-gray-400 text-center">You have an outstanding payment required.</Text>
                                </>
                            ) : (
                                <>
                                    <View className="bg-green-500/10 p-4 rounded-full border border-green-500/20 mb-4">
                                        <CheckCircle2 color="#22c55e" size={48} />
                                    </View>
                                    <Text className="text-white text-[32px] font-bold mb-2">All Caught Up!</Text>
                                    <Text className="text-gray-400 text-center">No pending actions required at this time.</Text>
                                </>
                            )}
                        </View>

                        {/* Upcoming / Pending Payments */}
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-slate-400 text-xs font-bold tracking-widest uppercase">
                                {outstandingBalance > 0 ? 'Pending Payment' : 'Upcoming Payments'}
                            </Text>
                            {/* <TouchableOpacity>
                                <Text className="text-blue-500 text-xs font-bold">View Schedule</Text>
                            </TouchableOpacity> */}
                        </View>

                        <View className="bg-[#131b2f] rounded-[24px] border border-gray-800 p-5 mb-8">
                            <View className="flex-row items-center mb-6">
                                <View className="bg-blue-500/20 p-3 rounded-xl border border-blue-500/30 mr-4">
                                    <Calendar color="#3b82f6" size={24} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white text-lg font-bold mb-1">
                                        {outstandingBalance > 0 ? 'Immediate Tuition Fee' : 'Next Monthly Fee'}
                                    </Text>
                                    <Text className="text-slate-400 text-sm">
                                        {outstandingBalance > 0 ? 'Due immediately' : `Expected by ${expectedDate}`}
                                    </Text>
                                </View>
                                {!outstandingBalance && (
                                    <View className="bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
                                        <Text className="text-slate-300 text-xs font-medium">Automatic</Text>
                                    </View>
                                )}
                            </View>

                            <View className="flex-row justify-between items-center">
                                <Text className="text-white text-3xl font-bold">
                                    ₹{outstandingBalance > 0 ? outstandingBalance : (studentProfile?.amount || 0)}
                                </Text>
                                
                                {outstandingBalance > 0 && (
                                    <TouchableOpacity 
                                        className="bg-blue-600 px-6 py-3 rounded-xl shadow-lg flex-row items-center"
                                        onPress={handlePayNow}
                                        disabled={paying}
                                    >
                                        {paying ? (
                                            <ActivityIndicator color="white" size="small" />
                                        ) : (
                                            <Text className="text-white font-bold text-base">Pay Now →</Text>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Payment History */}
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-slate-400 text-xs font-bold tracking-widest uppercase">Payment History</Text>
                        </View>

                        {transactions.length > 0 ? (
                            transactions.map((txn: any, index: number) => {
                                const isSuccess = txn.status === 'completed' || txn.status === 'Success';
                                const isPending = txn.status === 'pending';
                                return (
                                    <View key={txn._id || index} className="bg-[#131b2f] border border-gray-800 rounded-2xl p-4 mb-4 flex-row items-center justify-between">
                                        <View className="flex-row items-center gap-4">
                                            <View className={`w-12 h-12 rounded-full items-center justify-center border ${isSuccess ? 'bg-green-500/10 border-green-500/30' : isPending ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                                {isSuccess ? <CheckCircle2 color="#22c55e" size={24} /> : <FileText color={isPending ? "#eab308" : "#ef4444"} size={24} />}
                                            </View>
                                            <View>
                                                <Text className="text-white text-lg font-bold mb-1">₹{txn.amount}</Text>
                                                <Text className="text-slate-500 text-sm">
                                                    {new Date(txn.createdAt || txn.date).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        <View className="flex-row items-center gap-3">
                                            <View className={`px-2 py-1 rounded border ${isSuccess ? 'bg-green-500/10 border-green-500/20' : isPending ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                                <Text className={`text-xs font-medium ${isSuccess ? 'text-green-500' : isPending ? 'text-yellow-500' : 'text-red-500'}`}>
                                                    {isSuccess ? 'Completed' : isPending ? 'Pending' : 'Failed'}
                                                </Text>
                                            </View>
                                            
                                            {isSuccess && (
                                                <TouchableOpacity 
                                                    className="bg-slate-800 p-2.5 rounded-xl border border-slate-700"
                                                    onPress={() => handleDownloadReceipt(txn._id)}
                                                    disabled={downloading === txn._id}
                                                >
                                                    {downloading === txn._id ? (
                                                        <ActivityIndicator color="#cbd5e1" size="small" />
                                                    ) : (
                                                        <Download color="#cbd5e1" size={20} />
                                                    )}
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <View className="bg-[#131b2f] rounded-2xl border border-gray-800 p-8 items-center">
                                <Text className="text-gray-500 text-center">No payment history found.</Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Payment Result Modal */}
            <Modal visible={paymentResult !== null} transparent animationType="fade">
                <View className="flex-1 bg-black/70 items-center justify-center p-6">
                    <View className="bg-[#1e293b] border border-gray-700 rounded-3xl p-8 w-full max-w-sm items-center shadow-2xl">
                        {paymentResult === 'success' ? (
                            <>
                                <View className="w-24 h-24 bg-green-500/20 rounded-full items-center justify-center mb-6 border-4 border-green-500/30">
                                    <CheckCircle2 color="#22c55e" size={48} />
                                </View>
                                <Text className="text-white text-2xl font-bold mb-2">Payment Successful!</Text>
                                <Text className="text-slate-400 text-center mb-8">
                                    Your transaction has been securely processed and recorded.
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setPaymentResult(null)}
                                    className="w-full bg-green-600 py-4 rounded-xl items-center shadow-lg shadow-green-600/20"
                                >
                                    <Text className="text-white font-bold text-lg">Continue</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View className="w-24 h-24 bg-red-500/20 rounded-full items-center justify-center mb-6 border-4 border-red-500/30">
                                    <Text className="text-red-500 text-5xl">✕</Text>
                                </View>
                                <Text className="text-white text-2xl font-bold mb-2">Payment Failed</Text>
                                <Text className="text-slate-400 text-center mb-8">
                                    We couldn't process your transaction. Please check your connection or payment method.
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setPaymentResult(null)}
                                    className="w-full bg-slate-700 border border-slate-600 py-4 rounded-xl items-center"
                                >
                                    <Text className="text-white font-bold text-lg">Try Again</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}
