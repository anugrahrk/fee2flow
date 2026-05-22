import React, { useEffect, useState, useCallback } from 'react';
import { View, Text,Image, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Pressable, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useUserStore } from '../../src/store/userStore';
import axios from 'axios';
import { Building2, CheckCircle2, Ban, Search, LogOut, User, ChevronDown, X } from 'lucide-react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

type Props = {
    navigation?: any;
};

export default function InsightsScreen({ navigation }: Props) {
    const { getToken, signOut } = useAuth();
    const { user } = useUser();
    const { logout } = useUserStore();

    const [stats, setStats] = useState({ total: 0, active: 0, disabled: 0 });
    const [transactions, setTransactions] = useState<any[]>([]);
    const [totalTx, setTotalTx] = useState(0);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingTx, setLoadingTx] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAll, setShowAll] = useState(false);
    const [expandedTx, setExpandedTx] = useState<string | null>(null);
    const [profileOpen, setProfileOpen] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchStats();
            fetchTransactions();
        }, [])
    );

    const fetchStats = async () => {
        try {
            const token = await getToken();
            const res = await axios.get(`${API_URL}/api/su/organizations/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (error) {
            console.error("Error fetching stats", error);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchTransactions = async (query = '', fetchAll = false) => {
        setLoadingTx(true);
        try {
            const token = await getToken();
            const limit = fetchAll ? 100 : 5;
            const res = await axios.get(`${API_URL}/api/su/transactions?search=${query}&limit=${limit}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTransactions(res.data.data || []);
            setTotalTx(res.data.pagination?.total || 0);
        } catch (error) {
            console.error("Error fetching transactions", error);
        } finally {
            setLoadingTx(false);
        }
    };

    const handleSearch = useCallback((text: string) => {
        setSearchQuery(text);
        // Debounce slightly by using a small timeout
        fetchTransactions(text, showAll);
    }, [showAll]);

    const handleViewAll = () => {
        setShowAll(true);
        fetchTransactions(searchQuery, true);
    };

    const handleViewLess = () => {
        setShowAll(false);
        fetchTransactions(searchQuery, false);
    };

    const handleLogout = async () => {
        setProfileOpen(false);
        try {
            await signOut();
            logout();
            // Navigate to login - need to get navigation from parent
            const nav = navigation || (global as any).__rootNavigation;
            if (nav) nav.replace('Login');
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedTx(expandedTx === id ? null : id);
    };

    const userEmail = user?.primaryEmailAddress?.emailAddress || 'Unknown';
    const userInitials = userEmail.substring(0, 2).toUpperCase();

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
                <Text className="text-blue-500 font-bold text-xs tracking-widest uppercase mb-1">Platform Overview</Text>
                <Text className="text-white text-[32px] font-bold mb-2">Insights & Metrics</Text>
                <Text className="text-gray-400 mb-8">Real-time synchronization across your organization nodes.</Text>

                {/* Stats Cards */}
                {loadingStats ? <ActivityIndicator color="#3b82f6" /> : (
                    <>
                        <View className="bg-[#131b2f] rounded-[24px] border border-gray-800 p-6 mb-4">
                            <View className="flex-row justify-between items-center mb-6">
                                <View className="bg-blue-500/20 p-3 rounded-xl border border-blue-500/30">
                                    <Building2 color="#3b82f6" size={24} />
                                </View>
                                <View className="bg-green-500/10 px-3 py-1 rounded-full flex-row items-center gap-2 border border-green-500/20">
                                    <View className="w-2 h-2 bg-green-500 rounded-full" />
                                    <Text className="text-green-500 text-xs font-bold">LIVE</Text>
                                </View>
                            </View>
                            <Text className="text-slate-400 text-xs font-bold tracking-widest mb-2 uppercase">Total Organizations</Text>
                            <View className="flex-row items-baseline gap-4">
                                <Text className="text-white text-[56px] font-bold leading-none">{stats.total}</Text>
                                <Text className="text-green-500 font-medium">+0% vs prev. month</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-4 mb-4">
                            <View className="flex-1 bg-[#131b2f] rounded-[24px] border border-gray-800 p-6">
                                <View className="bg-green-500/20 p-3 rounded-xl border border-green-500/30 self-start mb-6">
                                    <CheckCircle2 color="#22c55e" size={24} />
                                </View>
                                <Text className="text-slate-400 text-xs font-bold tracking-widest mb-2 uppercase">Active</Text>
                                <Text className="text-white text-[32px] font-bold">{stats.active}</Text>
                            </View>
                            <View className="flex-1 bg-[#131b2f] rounded-[24px] border border-gray-800 p-6">
                                <View className="bg-slate-700/50 p-3 rounded-xl border border-slate-600 self-start mb-6">
                                    <Ban color="#94a3b8" size={24} />
                                </View>
                                <Text className="text-slate-400 text-xs font-bold tracking-widest mb-2 uppercase">Disabled</Text>
                                <Text className="text-white text-[32px] font-bold">{stats.disabled}</Text>
                            </View>
                        </View>
                    </>
                )}

                {/* Recent Activity Header */}
                <View className="flex-row justify-between items-center mb-6 mt-10">
                    <Text className="text-slate-400 text-xs font-bold tracking-widest uppercase">
                        Recent Activity {totalTx > 0 ? `(${totalTx})` : ''}
                    </Text>
                    {!showAll ? (
                        <TouchableOpacity onPress={handleViewAll}>
                            <Text className="text-blue-500 text-xs font-bold uppercase">View All</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleViewLess}>
                            <Text className="text-blue-500 text-xs font-bold uppercase">Show Less</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Search Bar */}
                <View className="bg-[#131b2f] border border-gray-800 rounded-xl px-4 h-12 flex-row items-center mb-6">
                    <Search color="#64748b" size={20} />
                    <TextInput
                        className="flex-1 text-white ml-3"
                        placeholder="Search by email, amount, or status..."
                        placeholderTextColor="#64748b"
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); fetchTransactions('', showAll); }}>
                            <X color="#64748b" size={18} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Transaction List */}
                {loadingTx ? <ActivityIndicator color="#3b82f6" /> : transactions.map((tx: any, index: number) => (
                    <TouchableOpacity 
                        key={tx._id || index} 
                        onPress={() => toggleExpand(tx._id)}
                        activeOpacity={0.7}
                    >
                        <View className="bg-[#131b2f] rounded-2xl border border-gray-800 p-4 mb-3">
                            <View className="flex-row items-center">
                                <View className={`w-3 h-3 rounded-full mr-4 ${tx.status === 'completed' ? 'bg-green-500' : tx.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                <View className="flex-1">
                                    <Text className="text-white font-medium mb-1">
                                        {tx.organizationId?.orgName || 'Unknown Org'} — ₹{tx.amount}
                                    </Text>
                                    <Text className="text-slate-500 text-xs">
                                        {new Date(tx.createdAt).toLocaleString()} • {tx.studentId?.studentName || 'Unknown'}
                                    </Text>
                                </View>
                                <View className={`px-2 py-1 rounded-full ${tx.status === 'completed' ? 'bg-green-500/10' : tx.status === 'failed' ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
                                    <Text className={`text-xs font-bold uppercase ${tx.status === 'completed' ? 'text-green-500' : tx.status === 'failed' ? 'text-red-500' : 'text-yellow-500'}`}>
                                        {tx.status}
                                    </Text>
                                </View>
                            </View>

                            {/* Expanded Details */}
                            {expandedTx === tx._id && (
                                <View className="mt-4 pt-4 border-t border-gray-800">
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-slate-500 text-xs">Student Email</Text>
                                        <Text className="text-white text-xs">{tx.studentId?.email || 'N/A'}</Text>
                                    </View>
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-slate-500 text-xs">Organization</Text>
                                        <Text className="text-white text-xs">{tx.organizationId?.orgName || 'N/A'}</Text>
                                    </View>
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-slate-500 text-xs">Org Email</Text>
                                        <Text className="text-white text-xs">{tx.organizationId?.email || 'N/A'}</Text>
                                    </View>
                                    {tx.razorpayOrderId && (
                                        <View className="flex-row justify-between mb-2">
                                            <Text className="text-slate-500 text-xs">Razorpay Order</Text>
                                            <Text className="text-white text-xs font-mono">{tx.razorpayOrderId}</Text>
                                        </View>
                                    )}
                                    {tx.razorpayPaymentId && (
                                        <View className="flex-row justify-between mb-2">
                                            <Text className="text-slate-500 text-xs">Payment ID</Text>
                                            <Text className="text-white text-xs font-mono">{tx.razorpayPaymentId}</Text>
                                        </View>
                                    )}
                                    <View className="flex-row justify-between">
                                        <Text className="text-slate-500 text-xs">Transaction ID</Text>
                                        <Text className="text-white text-xs font-mono">{tx._id}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
                
                {transactions.length === 0 && !loadingTx && (
                    <View className="bg-[#131b2f] rounded-2xl border border-gray-800 p-8 items-center">
                        <Text className="text-gray-500 text-center">No recent transactions found.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
