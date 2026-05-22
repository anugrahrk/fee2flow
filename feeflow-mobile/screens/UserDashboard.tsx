import React from 'react';
import { View, Text, StatusBar, TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useUserStore } from '../src/store/userStore';
import { Building2 } from 'lucide-react-native';

type Props = {
    navigation: any;
};

export default function UserDashboard({ navigation }: Props) {
    const { signOut } = useAuth();
    const { logout } = useUserStore();

    const handleLogout = async () => {
        await signOut();
        logout();
        navigation.replace('Login');
    };

    return (
        <View className="flex-1 bg-[#0b101e]">
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View className="px-6 pt-6 pb-4 bg-[#131b2f] border-b border-gray-800 flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                    <View className="bg-purple-500/20 p-2 rounded-xl border border-purple-500/30">
                        <Building2 color="#a855f7" size={20} />
                    </View>
                    <Text className="text-white text-xl font-bold tracking-widest">COFEEPAY</Text>
                </View>
                <TouchableOpacity onPress={handleLogout}>
                    <Text className="text-red-400 font-bold text-sm">LOGOUT</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="flex-1 items-center justify-center px-6">
                <View className="bg-[#131b2f] border border-gray-800 rounded-3xl p-8 items-center w-full">
                    <View className="bg-purple-500/20 p-4 rounded-full border border-purple-500/30 mb-6">
                        <Building2 color="#a855f7" size={40} />
                    </View>
                    <Text className="text-white text-2xl font-bold mb-2">User Dashboard</Text>
                    <Text className="text-gray-400 text-center">
                        This is the user dashboard. Features for viewing your payments and profile will be built here.
                    </Text>
                </View>
            </View>
        </View>
    );
}
