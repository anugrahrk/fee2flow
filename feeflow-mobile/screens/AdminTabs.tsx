import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Platform } from 'react-native';
import { LayoutDashboard, Users } from 'lucide-react-native';
import AdminHome from './admin/AdminHome';
import AdminStudents from './admin/AdminStudents';

const Tab = createBottomTabNavigator();

type Props = {
    navigation: any;
};

export default function AdminTabs({ navigation }: Props) {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#1a1f2e',
                    borderTopWidth: 0,
                    height: Platform.OS === 'ios' ? 88 : 80,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                    paddingTop: 10,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    position: 'absolute',
                    bottom: 0,
                },
                tabBarActiveTintColor: '#3b82f6',
                tabBarInactiveTintColor: '#64748b',
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                    marginTop: 5,
                }
            }}
        >
            <Tab.Screen 
                name="Dashboard" 
                component={AdminHome}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <View className={color === '#3b82f6' ? 'bg-blue-500/20 p-2 rounded-full' : 'p-2'}>
                            <LayoutDashboard color={color} size={24} />
                        </View>
                    )
                }}
            />
            <Tab.Screen 
                name="Students" 
                component={AdminStudents}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <View className={color === '#3b82f6' ? 'bg-blue-500/20 p-2 rounded-full' : 'p-2'}>
                            <Users color={color} size={24} />
                        </View>
                    )
                }}
            />
        </Tab.Navigator>
    );
}
