import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, Pressable, Alert, Dimensions, Platform, Vibration } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { LogOut, User, Wallet, TrendingUp, BarChart3, Clock, Send, BellRing } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import * as Notifications from 'expo-notifications';
import { io } from 'socket.io-client';
import { useUserStore } from '../../src/store/userStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const screenWidth = Dimensions.get("window").width;

type Props = {
    navigation?: any;
};

export default function AdminHome({ navigation }: Props) {
    const { getToken, signOut } = useAuth();
    const { user } = useUser();
    const { logout, user: authUser } = useUserStore();

    const [profileOpen, setProfileOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [allTransactions, setAllTransactions] = useState<any[]>([]);
    const [showAllTx, setShowAllTx] = useState(false);
    const [pendingCount, setPendingCount] = useState<number>(0);

    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [isSendingReminders, setIsSendingReminders] = useState(false);
    const [tooltipPos, setTooltipPos] = useState<any>(null);

    // Register push token and connect Socket
    useEffect(() => {
        let socket: any;

        const setupNotificationsAndSocket = async () => {
            try {
                const token = await getToken();
                const headers = { Authorization: `Bearer ${token}` };

                // 1. Request Push Notification permissions & Get Token
                const pushToken = await registerForPushNotifications();
                if (pushToken) {
                    // Send to backend
                    await axios.post(`${API_URL}/api/admin/push-token`, { pushToken }, { headers });
                    console.log('Push token successfully registered with backend');
                }

                // 2. Setup Socket.IO connection for real-time foreground alerts
                const orgId = authUser?._id || authUser?.organizationId;
                if (orgId) {
                    socket = io(API_URL);
                    
                    socket.on('connect', () => {
                        socket.emit('join_org', orgId.toString());
                    });

                    socket.on('payment_success', async (newNotification: any) => {
                        // Trigger local native heads-up/lockscreen notification
                        await Notifications.scheduleNotificationAsync({
                            content: {
                                title: 'Payment Received 💰',
                                body: newNotification.message,
                                sound: 'default',
                            },
                            trigger: null,
                        });
                    });
                }
            } catch (err) {
                console.error('Error setting up notifications / socket:', err);
            }
        };

        setupNotificationsAndSocket();

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [authUser]);

    const registerForPushNotifications = async () => {
        try {
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Permission not granted for push notifications');
                return null;
            }

            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: 'dd876f84-7708-4bc1-8998-70302af04b70',
            });
            return tokenData.data;
        } catch (err) {
            console.error('Failed to get Expo push token:', err);
            return null;
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
        }, [])
    );

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch Stats
            const statsRes = await axios.get(`${API_URL}/api/admin/stats/monthly`, { headers });
            setStats(statsRes.data);

            // Fetch Chart
            const chartRes = await axios.get(`${API_URL}/api/admin/stats/chart`, { headers });
            const rawChartData = chartRes.data || [];
            
            // Format Chart Data for 6 months
            const formattedChart = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthName = d.toLocaleString('default', { month: 'short' });
                const existing = rawChartData.find((item: any) => item.name.slice(0, 3) === monthName);
                formattedChart.push({ name: monthName, value: existing ? existing.value : 0 });
            }
            setChartData(formattedChart);

            // Fetch Pending Count
            const pendingRes = await axios.get(`${API_URL}/api/admin/students/pending-count`, { headers });
            setPendingCount(pendingRes.data?.count || 0);

            // Fetch Transactions
            const txRes = await axios.get(`${API_URL}/api/admin/transactions?limit=50`, { headers });
            // API returns { data, pagination } or just array based on version
            const txData = Array.isArray(txRes.data) ? txRes.data : (txRes.data.data || []);
            setAllTransactions(txData);
            setTransactions(txData.slice(0, 5));

        } catch (error) {
            console.error("Error fetching admin dashboard data", error);
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

    const confirmSendReminders = async () => {
        setIsSendingReminders(true);
        try {
            const token = await getToken();
            await axios.post(`${API_URL}/api/admin/students/reminder-all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Alert.alert('Success', 'Reminders sent successfully!');
            setIsReminderModalOpen(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to send reminders');
        } finally {
            setIsSendingReminders(false);
        }
    };

    const userName = user?.firstName || 'Admin';
    const userInitials = userName.substring(0, 2).toUpperCase();
    const userEmail = user?.primaryEmailAddress?.emailAddress || 'admin@feeflow.in';

    const chartConfig = {
        backgroundGradientFrom: "#131b2f",
        backgroundGradientTo: "#131b2f",
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
        strokeWidth: 3,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#3b82f6",
            fill: "#131b2f"
        }
    };

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
                        {/* Stats Section */}
                        <View className="flex-row justify-between mb-4">
                            <View className="bg-[#131b2f] border border-gray-800 rounded-2xl p-4 flex-1 mr-2">
                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="bg-blue-500/20 p-2 rounded-lg">
                                        <Wallet color="#3b82f6" size={20} />
                                    </View>
                                    <View className="flex-row items-center gap-1">
                                        <TrendingUp color="#22c55e" size={12} />
                                        <Text className="text-green-500 text-xs font-bold">+{stats?.collectionGrowth || 0}%</Text>
                                    </View>
                                </View>
                                <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Collections</Text>
                                <Text className="text-white text-2xl font-bold">₹{stats?.totalCollections?.toLocaleString() || '0'}</Text>
                            </View>
                            
                            <View className="bg-[#131b2f] border border-gray-800 rounded-2xl p-4 flex-1 ml-2">
                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="bg-orange-500/20 p-2 rounded-lg">
                                        <Clock color="#f97316" size={20} />
                                    </View>
                                </View>
                                <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Pending Dues</Text>
                                <Text className="text-white text-2xl font-bold">₹{stats?.pendingDues?.toLocaleString() || '0'}</Text>
                            </View>
                        </View>

                        <View className="bg-[#131b2f] border border-gray-800 rounded-2xl p-4 mb-6">
                            <View className="flex-row items-center justify-between mb-3">
                                <View className="bg-indigo-500/20 p-2 rounded-lg">
                                    <BarChart3 color="#6366f1" size={20} />
                                </View>
                            </View>
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Transactions</Text>
                            <Text className="text-white text-2xl font-bold">{stats?.transactionVolume || 0}</Text>
                        </View>

                        {/* Chart Section */}
                        <View className="bg-[#131b2f] border border-gray-800 rounded-2xl p-4 mb-6">
                            <Text className="text-white text-lg font-bold mb-1">Fee Collection Trends</Text>
                            <Text className="text-slate-500 text-xs mb-4">Last 6 Months Performance</Text>
                            
                            {chartData.length > 0 ? (
                                <View className="ml-[-15px] relative">
                                    <LineChart
                                        data={{
                                            labels: chartData.map(d => d.name),
                                            datasets: [{ data: chartData.map(d => d.value) }]
                                        }}
                                        width={screenWidth - 60} // Padding consideration
                                        height={220}
                                        yAxisLabel="₹"
                                        yAxisSuffix=""
                                        chartConfig={chartConfig}
                                        bezier
                                        style={{ marginVertical: 8, borderRadius: 16 }}
                                        withVerticalLines={false}
                                        withHorizontalLines={true}
                                        onDataPointClick={(data) => {
                                            Vibration.vibrate(0);
                                            const isSamePoint = (tooltipPos?.x === data.x && tooltipPos?.y === data.y);
                                            isSamePoint ? setTooltipPos(null) : setTooltipPos({
                                                x: data.x, 
                                                y: data.y, 
                                                value: data.value,
                                                index: data.index
                                            });
                                        }}
                                    />
                                    {tooltipPos && (
                                        <View 
                                            className="absolute bg-blue-600 rounded-lg p-2 shadow-xl z-50 border border-blue-400 items-center justify-center"
                                            style={{ 
                                                left: tooltipPos.x - 40, 
                                                top: tooltipPos.y - 45,
                                                minWidth: 80
                                            }}
                                        >
                                            <Text className="text-white font-bold text-xs">₹{tooltipPos.value.toLocaleString()}</Text>
                                            <Text className="text-blue-200 text-[10px]">{chartData[tooltipPos.index]?.name}</Text>
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <ActivityIndicator color="#3b82f6" />
                            )}
                        </View>

                        {/* Fee Reminders Card */}
                        <View className="bg-blue-600 rounded-2xl p-6 mb-8 relative overflow-hidden">
                            <View className="absolute top-[-20px] right-[-20px] opacity-10">
                                <BellRing color="#ffffff" size={140} />
                            </View>
                            <Text className="text-white text-lg font-bold mb-2 relative z-10">Fee Reminders</Text>
                            <Text className="text-blue-200 text-sm mb-6 relative z-10 leading-5">
                                You have {pendingCount} pending fee reminders scheduled. Send them now to improve collection rates.
                            </Text>
                            <TouchableOpacity
                                onPress={() => setIsReminderModalOpen(true)}
                                className="bg-white py-3 rounded-xl flex-row items-center justify-center gap-2 relative z-10 shadow-lg"
                            >
                                <Send color="#2563eb" size={18} />
                                <Text className="text-blue-600 font-bold">Send Reminders</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Recent Transactions */}
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-white text-lg font-bold">Recent Transactions</Text>
                            {allTransactions.length > 5 && (
                                <TouchableOpacity onPress={() => {
                                    if (showAllTx) {
                                        setTransactions(allTransactions.slice(0, 5));
                                        setShowAllTx(false);
                                    } else {
                                        setTransactions(allTransactions);
                                        setShowAllTx(true);
                                    }
                                }}>
                                    <Text className="text-blue-500 text-xs font-bold uppercase">
                                        {showAllTx ? 'Show Less' : 'View All'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {transactions.length > 0 ? (
                            transactions.map((txn: any, index: number) => {
                                const isSuccess = txn.status === 'completed' || txn.status === 'Success';
                                const isPending = txn.status === 'pending';
                                return (
                                    <View key={txn._id || index} className="bg-[#131b2f] border border-gray-800 rounded-2xl p-4 mb-4 flex-row items-center justify-between">
                                        <View className="flex-row items-center gap-3">
                                            <View className="w-10 h-10 bg-blue-500/20 rounded-full border border-blue-500/30 items-center justify-center">
                                                <Text className="text-blue-400 font-bold text-xs">
                                                    {txn.studentName ? txn.studentName.substring(0, 2).toUpperCase() : 'ST'}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text className="text-white font-bold">{txn.studentName || 'Unknown Student'}</Text>
                                                <Text className="text-slate-500 text-xs mt-1">
                                                    {new Date(txn.createdAt || txn.date).toLocaleDateString()} • {txn.transactionId?.slice(4, 12) || 'N/A'}
                                                </Text>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-white font-bold mb-1">₹{txn.amount}</Text>
                                            <View className={`px-2 py-0.5 rounded border ${isSuccess ? 'bg-green-500/10 border-green-500/20' : isPending ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                                <Text className={`text-[10px] font-bold ${isSuccess ? 'text-green-500' : isPending ? 'text-yellow-500' : 'text-red-500'}`}>
                                                    {isSuccess ? 'COMPLETED' : isPending ? 'PENDING' : 'FAILED'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <View className="bg-[#131b2f] rounded-2xl border border-gray-800 p-8 items-center">
                                <Text className="text-gray-500 text-center">No recent transactions found.</Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Bulk Reminder Modal */}
            <Modal visible={isReminderModalOpen} transparent animationType="fade">
                <View className="flex-1 bg-black/70 items-center justify-center p-6">
                    <View className="bg-[#1e293b] border border-gray-700 rounded-3xl p-6 w-full shadow-2xl">
                        <Text className="text-white text-xl font-bold mb-2">Send Payment Reminders</Text>
                        <Text className="text-slate-400 mb-6 leading-5">
                            A reminder will be sent to <Text className="text-white font-bold">{pendingCount}</Text> users.
                        </Text>
                        <View className="flex-row justify-end gap-3">
                            <TouchableOpacity
                                onPress={() => setIsReminderModalOpen(false)}
                                disabled={isSendingReminders}
                                className="px-5 py-3 rounded-xl border border-gray-600 items-center"
                            >
                                <Text className="text-slate-300 font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmSendReminders}
                                disabled={isSendingReminders}
                                className="px-5 py-3 rounded-xl bg-blue-600 items-center flex-row gap-2"
                            >
                                {isSendingReminders ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text className="text-white font-bold">Yes, Send Reminders</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
