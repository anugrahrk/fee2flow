import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, Pressable, Platform } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useUserStore } from '../../src/store/userStore';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { LogOut, User, Wallet, CheckCircle2 } from 'lucide-react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

type Props = {
    navigation?: any;
};

export default function UserHome({ navigation }: Props) {
    const { getToken, signOut } = useAuth();
    const { user } = useUser();
    const { logout } = useUserStore();

    const [profileOpen, setProfileOpen] = useState(false);
    const [studentProfile, setStudentProfile] = useState<any>(null);
    const [outstandingBalance, setOutstandingBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handlePay = () => {
        navigation?.navigate('Payment');
    };

    const totalFeesPaid = useMemo(() => {
        return transactions
            .filter((txn: any) => txn.status === 'completed' || txn.status === 'Success')
            .reduce((acc: number, curr: any) => acc + curr.amount, 0);
    }, [transactions]);

    const userEmail = user?.primaryEmailAddress?.emailAddress || 'Unknown';
    const userName = studentProfile?.studentName || user?.firstName || 'Student';
    const userInitials = userName.substring(0, 2).toUpperCase();

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
                        {/* Welcome text */}
                        <View className="mb-6">
                            <Text className="text-white text-[28px] font-bold mb-2">Welcome, {userName}</Text>
                            {outstandingBalance > 0 ? (
                                <View className="flex-row items-center gap-2">
                                    <View className="w-2 h-2 rounded-full bg-red-500" />
                                    <Text className="text-red-400 italic text-sm">Immediate Action Required: Tuition Payment Due</Text>
                                </View>
                            ) : (
                                <View className="flex-row items-center gap-2">
                                    <CheckCircle2 color="#22c55e" size={16} />
                                    <Text className="text-green-500 italic text-sm">You are all caught up on payments!</Text>
                                </View>
                            )}
                        </View>

                        {/* Outstanding Payment Card */}
                        <View className="bg-[#131b2f] rounded-[24px] border border-gray-800 p-6 mb-4">
                            <Text className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-4">Outstanding Payment</Text>
                            <View className="flex-row items-baseline gap-2 mb-2">
                                <Text className="text-white text-[48px] font-bold leading-none">₹{outstandingBalance}</Text>
                                <Text className="text-blue-500 font-bold text-lg">INR</Text>
                            </View>
                            
                            <View className="flex-row justify-between items-center mt-2">
                                <View className={`px-3 py-1 rounded-full ${outstandingBalance > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                                    <Text className={`text-xs font-bold ${outstandingBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {outstandingBalance > 0 ? 'PAYMENT DUE' : 'NO PENDING DUES'}
                                    </Text>
                                </View>
                                
                                {/* {outstandingBalance > 0 && (
                                    <TouchableOpacity 
                                        className="bg-blue-600 px-6 py-2.5 rounded-xl shadow-lg"
                                        onPress={handlePay}
                                    >
                                        <Text className="text-white font-bold">Pay Now</Text>
                                    </TouchableOpacity>
                                )} */}
                            </View>
                        </View>

                        {/* Stats Grid */}
                        <View className="flex-row gap-4 mb-8">
                            <View className="flex-1 bg-[#131b2f] rounded-[24px] border border-gray-800 p-5">
                                <View className="bg-blue-500/20 p-2 rounded-xl self-start mb-4">
                                    <Wallet color="#3b82f6" size={20} />
                                </View>
                                <Text className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-1">Total Fees Paid</Text>
                                <Text className="text-white text-2xl font-bold">₹{totalFeesPaid}</Text>
                            </View>
                            <View className="flex-1 bg-[#131b2f] rounded-[24px] border border-gray-800 p-5">
                                <View className="bg-purple-500/20 p-2 rounded-xl self-start mb-4">
                                    <ActivityIndicator color="#a855f7" size="small" /> 
                                    {/* using ActivityIndicator icon just as a placeholder for outstanding since we don't have pending_actions */}
                                </View>
                                <Text className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-1">Outstanding</Text>
                                <Text className="text-white text-2xl font-bold">₹{outstandingBalance}</Text>
                            </View>
                        </View>

                        {/* Recent Activity */}
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-white text-xl font-bold">Recent Activity</Text>
                            <TouchableOpacity onPress={() => navigation?.navigate('Payment')}>
                                <Text className="text-blue-500 text-xs font-bold uppercase tracking-wider">View All</Text>
                            </TouchableOpacity>
                        </View>

                        {transactions.length > 0 ? (
                            transactions.slice(0, 5).map((txn: any, index: number) => {
                                const isSuccess = txn.status === 'completed' || txn.status === 'Success';
                                return (
                                    <View key={txn._id || index} className="bg-[#131b2f] border border-gray-800 rounded-2xl p-4 mb-3 flex-row items-center justify-between">
                                        <View className="flex-row items-center gap-3">
                                            <View className={`p-3 rounded-xl ${isSuccess ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-slate-800'}`}>
                                                <Text className="text-xl">🧾</Text>
                                            </View>
                                            <View>
                                                <Text className="text-white font-medium text-sm mb-1">
                                                    {txn.razorpayPaymentId ? `#pay_${txn.razorpayPaymentId.slice(-8)}` : 'Monthly Fee'}
                                                </Text>
                                                <Text className="text-slate-500 text-xs">
                                                    {new Date(txn.createdAt || txn.date).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-white font-bold mb-1">₹{txn.amount}</Text>
                                            <View className={`px-2 py-0.5 rounded text-[10px] ${isSuccess ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                                                <Text className={`text-[10px] font-medium ${isSuccess ? 'text-green-500' : 'text-yellow-500'}`}>
                                                    {isSuccess ? 'Success' : txn.status}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <View className="bg-[#131b2f] rounded-2xl border border-gray-800 p-8 items-center">
                                <Text className="text-gray-500 text-center">No recent activity.</Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}
