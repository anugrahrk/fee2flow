import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Pressable, Alert, Platform, Image, Linking, Switch } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { Search, Plus, User, Calendar, DollarSign, Bell, Edit3, X, LogOut, MessageCircle, MoreVertical, Trash2 } from 'lucide-react-native';
import { useUserStore } from '../../src/store/userStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

type Props = {
    navigation?: any;
};

export default function AdminStudents({ navigation }: Props) {
    const { getToken, signOut } = useAuth();
    const { user } = useUser();
    const { logout } = useUserStore();
    
    const [profileOpen, setProfileOpen] = useState(false);
    
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        studentName: '',
        email: '',
        mobileNumber: '',
        amount: '',
        feeRecurringDate: ''
    });

    useFocusEffect(
        useCallback(() => {
            fetchStudents();
        }, [])
    );

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const response = await axios.get(`${API_URL}/api/admin/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data.data || response.data || [];
            setStudents(data);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const filteredStudents = students.filter(student => 
        student.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student._id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openAddModal = () => {
        setFormData({
            studentName: '',
            email: '',
            mobileNumber: '',
            amount: '',
            feeRecurringDate: new Date().toISOString()
        });
        setIsAddModalOpen(true);
    };

    const openActionModal = (student: any) => {
        setSelectedStudent(student);
        setIsActionModalOpen(true);
    };

    const openEditModal = () => {
        if (!selectedStudent) return;
        setFormData({
            studentName: selectedStudent.studentName || '',
            email: selectedStudent.email || '',
            mobileNumber: selectedStudent.mobileNumber || '',
            amount: selectedStudent.amount ? selectedStudent.amount.toString() : '',
            feeRecurringDate: selectedStudent.feeRecurringDate || new Date().toISOString()
        });
        setIsActionModalOpen(false);
        setIsEditModalOpen(true);
    };

    const openReminderModal = () => {
        if (!selectedStudent) return;
        setIsActionModalOpen(false);
        setIsReminderModalOpen(true);
    };

    const handleSaveStudent = async (isEdit: boolean) => {
        if (!formData.studentName || !formData.email || !formData.amount) {
            Alert.alert("Error", "Please fill all required fields (Name, Email, Amount)");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };
            
            const payload = {
                ...formData,
                amount: Number(formData.amount)
            };

            if (isEdit && selectedStudent) {
                await axios.put(`${API_URL}/api/admin/students/${selectedStudent._id}`, payload, { headers });
                Alert.alert("Success", "Student updated successfully");
            } else {
                await axios.post(`${API_URL}/api/admin/students`, payload, { headers });
                Alert.alert("Success", "Student added successfully");
            }
            
            setIsAddModalOpen(false);
            setIsEditModalOpen(false);
            fetchStudents();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to save student");
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmSendReminder = async () => {
        if (!selectedStudent) return;
        setIsSubmitting(true);
        try {
            const token = await getToken();
            await axios.post(`${API_URL}/api/admin/students/reminder/${selectedStudent._id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Alert.alert("Success", `Reminder sent to ${selectedStudent.studentName}`);
            setIsReminderModalOpen(false);
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to send reminder");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStudentStatus = async (student: any) => {
        try {
            const token = await getToken();
            await axios.patch(`${API_URL}/api/admin/students/${student._id}/status`, {
                isEnabled: !student.isEnabled
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStudents(); // Refresh to get updated status
        } catch (error) {
            Alert.alert("Error", "Failed to update user status");
        }
    };

    const handleDeleteStudent = async () => {
        if (!selectedStudent) return;
        
        Alert.alert(
            "Delete Student",
            `Are you sure you want to delete ${selectedStudent.studentName}? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await getToken();
                            await axios.delete(`${API_URL}/api/admin/students/${selectedStudent._id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            setIsActionModalOpen(false);
                            fetchStudents();
                            Alert.alert("Success", "Student deleted successfully");
                        } catch (error: any) {
                            Alert.alert("Error", error.response?.data?.message || "Failed to delete student");
                        }
                    }
                }
            ]
        );
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

    const userName = user?.firstName || 'Super Admin';
    const userInitials = userName.substring(0, 2).toUpperCase();
    const userEmail = user?.primaryEmailAddress?.emailAddress || 'admin@feeflow.in';

    // Helper for formatting date
    const getRecurringDay = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'N/A';
        
        const day = date.getDate();
        const suffix = (day % 10 === 1 && day !== 11) ? 'st' :
                       (day % 10 === 2 && day !== 12) ? 'nd' :
                       (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
        return `${day}${suffix} of month`;
    };

    const handleWhatsAppReminder = async () => {
        if (!selectedStudent || !selectedStudent.mobileNumber) {
            Alert.alert("Error", "No mobile number found for this student.");
            return;
        }
        
        const dueDate = getRecurringDay(selectedStudent.feeRecurringDate);
        const orgName = selectedStudent.organizationId?.orgName || "our organization";
        const message = `Hi ${selectedStudent.studentName},\nyour fees for ${orgName} for ${dueDate} is pending please kindly find the attached link and pay through it.`;
        
        // Remove spaces and '+' from phone number for URL
        const cleanPhone = selectedStudent.mobileNumber.replace(/[^0-9]/g, '');
        const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
        
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert("Error", "WhatsApp is not installed on your device.");
            }
        } catch (err) {
            console.error("Error opening WhatsApp:", err);
            Alert.alert("Error", "Failed to open WhatsApp.");
        } finally {
            setIsActionModalOpen(false);
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
                    <View className={`absolute top-16 right-0 bg-[#1e293b] border border-gray-700 rounded-2xl p-5 w-72 shadow-2xl ${Platform.OS === 'android' ? 'mt-4' : 'mt-16'}`} style={{ elevation: 10 }}>
                        {/* User Info */}
                        <View className="items-center mb-4 pb-4 border-b border-gray-700">
                            <View className="w-16 h-16 bg-blue-500/20 rounded-full border-2 border-blue-500/30 items-center justify-center mb-3">
                                <User color="#3b82f6" size={28} />
                            </View>
                            <Text className="text-white font-bold text-base mb-1">{userName}</Text>
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
            <View className="px-6 pt-6 pb-4 ">
                <Text className="text-white text-3xl font-bold mb-1">Students</Text>
                <Text className="text-slate-400 text-sm">Total Students: {students.length}</Text>
            </View>

            {/* Actions Bar */}
            <View className="px-6 py-4 flex-row justify-between items-center z-40 bg-[#0b101e]">
                <View className="flex-1 mr-4 flex-row bg-[#131b2f] border border-gray-800 rounded-xl items-center px-4 h-12">
                    <Search color="#64748b" size={20} />
                    <TextInput 
                        className="flex-1 text-white ml-2 h-full"
                        placeholder="Search students..."
                        placeholderTextColor="#64748b"
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X color="#64748b" size={16} />
                        </TouchableOpacity>
                    )}
                </View>
                
                <TouchableOpacity 
                    onPress={openAddModal}
                    className="bg-blue-600 h-12 px-4 rounded-xl items-center justify-center flex-row shadow-lg"
                >
                    <Plus color="white" size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
                {loading ? (
                    <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />
                ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student: any) => (
                        <View key={student._id} className="bg-[#131b2f] border border-gray-800 rounded-2xl p-5 mb-4">
                            <View className="flex-row justify-between items-start mb-4">
                                <View className="flex-row items-center gap-3">
                                    <View className="w-12 h-12 bg-blue-500/10 rounded-xl border border-blue-500/20 items-center justify-center">
                                        <User color="#3b82f6" size={24} />
                                    </View>
                                    <View>
                                        <Text className="text-white text-lg font-bold">{student.studentName}</Text>
                                        <View className="flex-row items-center mt-1">
                                            <View className={`px-2 py-0.5 rounded border ${student.isEnabled ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                                <Text className={`text-[10px] font-bold ${student.isEnabled ? 'text-green-500' : 'text-red-500'}`}>
                                                    {student.isEnabled ? 'ACTIVE' : 'DISABLED'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                                <View className="flex-row gap-4 items-center">
                                    <Switch
                                        trackColor={{ false: '#334155', true: '#3b82f6' }}
                                        thumbColor={student.isEnabled ? '#ffffff' : '#94a3b8'}
                                        onValueChange={() => toggleStudentStatus(student)}
                                        value={student.isEnabled}
                                    />
                                    <TouchableOpacity 
                                        onPress={() => openActionModal(student)}
                                        className="w-10 h-10 items-center justify-center rounded-xl bg-slate-800 border border-slate-700"
                                    >
                                        <MoreVertical color="#cbd5e1" size={20} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View className="flex-row justify-between pt-4 border-t border-gray-800">
                                <View>
                                    <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Recurring Date</Text>
                                    <View className="flex-row items-center gap-1.5">
                                        <Calendar color="#64748b" size={14} />
                                        <Text className="text-white text-sm">{getRecurringDay(student.feeRecurringDate)}</Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Amount Due</Text>
                                    <View className="flex-row items-center">
                                        <Text className="text-white text-lg font-bold">₹{student.amount || 0}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                    <View className="bg-[#131b2f] rounded-2xl border border-gray-800 p-8 items-center mt-4">
                        <Text className="text-gray-500 text-center">No students found matching your search.</Text>
                    </View>
                )}
            </ScrollView>

            {/* Add / Edit Student Modal */}
            <Modal visible={isAddModalOpen || isEditModalOpen} transparent animationType="slide">
                <View className="flex-1 justify-end bg-black/70">
                    <View className="bg-[#1a2230] rounded-t-3xl border-t border-gray-700 p-6 pt-8 h-[80%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-white text-xl font-bold">
                                {isEditModalOpen ? 'Edit Student' : 'Add New Student'}
                            </Text>
                            <TouchableOpacity onPress={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
                                <X color="#94a3b8" size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                            <View className="mb-4">
                                <Text className="text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Full Name *</Text>
                                <TextInput
                                    className="bg-[#0b101e] border border-gray-800 text-white p-4 rounded-xl"
                                    placeholder="e.g. John Doe"
                                    placeholderTextColor="#475569"
                                    value={formData.studentName}
                                    onChangeText={(val) => setFormData({...formData, studentName: val})}
                                />
                            </View>

                            <View className="mb-4">
                                <Text className="text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Email Address *</Text>
                                <TextInput
                                    className="bg-[#0b101e] border border-gray-800 text-white p-4 rounded-xl"
                                    placeholder="student@example.com"
                                    placeholderTextColor="#475569"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={formData.email}
                                    onChangeText={(val) => setFormData({...formData, email: val})}
                                />
                            </View>

                            <View className="mb-4">
                                <Text className="text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Mobile Number</Text>
                                <TextInput
                                    className="bg-[#0b101e] border border-gray-800 text-white p-4 rounded-xl"
                                    placeholder="+91 9876543210"
                                    placeholderTextColor="#475569"
                                    keyboardType="phone-pad"
                                    value={formData.mobileNumber}
                                    onChangeText={(val) => setFormData({...formData, mobileNumber: val})}
                                />
                            </View>

                            <View className="mb-6">
                                <Text className="text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Recurring Amount *</Text>
                                <TextInput
                                    className="bg-[#0b101e] border border-gray-800 text-white p-4 rounded-xl"
                                    placeholder="e.g. 5000"
                                    placeholderTextColor="#475569"
                                    keyboardType="numeric"
                                    value={formData.amount}
                                    onChangeText={(val) => setFormData({...formData, amount: val})}
                                />
                            </View>

                            <TouchableOpacity 
                                onPress={() => handleSaveStudent(isEditModalOpen)}
                                disabled={isSubmitting}
                                className="bg-blue-600 p-4 rounded-xl items-center shadow-lg shadow-blue-600/30 mb-8"
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-base">
                                        {isEditModalOpen ? 'Save Changes' : 'Create Student'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Individual Reminder Modal */}
            <Modal visible={isReminderModalOpen} transparent animationType="fade">
                <View className="flex-1 bg-black/70 items-center justify-center p-6">
                    <View className="bg-[#1e293b] border border-gray-700 rounded-3xl p-6 w-full shadow-2xl">
                        <View className="w-16 h-16 bg-blue-500/20 rounded-full items-center justify-center mb-4 self-center border border-blue-500/30">
                            <Bell color="#3b82f6" size={32} />
                        </View>
                        <Text className="text-white text-xl font-bold mb-2 text-center">Send Reminder</Text>
                        <Text className="text-slate-400 mb-6 leading-5 text-center">
                            Are you sure you want to send a payment reminder to <Text className="text-white font-bold">{selectedStudent?.studentName}</Text>?
                        </Text>
                        <View className="flex-row justify-center gap-3">
                            <TouchableOpacity
                                onPress={() => setIsReminderModalOpen(false)}
                                disabled={isSubmitting}
                                className="px-6 py-3 rounded-xl border border-gray-600 items-center flex-1"
                            >
                                <Text className="text-slate-300 font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmSendReminder}
                                disabled={isSubmitting}
                                className="px-6 py-3 rounded-xl bg-blue-600 items-center flex-row justify-center gap-2 flex-1 shadow-lg shadow-blue-600/30"
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text className="text-white font-bold">Send</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Action Menu Modal */}
            <Modal visible={isActionModalOpen} transparent animationType="slide">
                <Pressable className="flex-1 justify-end bg-black/70" onPress={() => setIsActionModalOpen(false)}>
                    <View className="bg-[#1e293b] rounded-t-3xl border-t border-gray-700 p-6 pt-8 pb-10">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-white text-xl font-bold">Options for {selectedStudent?.studentName}</Text>
                            <TouchableOpacity onPress={() => setIsActionModalOpen(false)}>
                                <X color="#94a3b8" size={24} />
                            </TouchableOpacity>
                        </View>

                        <View className="gap-3">
                            <TouchableOpacity 
                                onPress={openEditModal}
                                className="bg-[#131b2f] border border-gray-800 rounded-xl p-4 flex-row items-center gap-4"
                            >
                                <View className="w-10 h-10 bg-slate-800 rounded-full items-center justify-center">
                                    <Edit3 color="#cbd5e1" size={20} />
                                </View>
                                <Text className="text-white font-bold text-base">Edit Details</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={openReminderModal}
                                className="bg-[#131b2f] border border-gray-800 rounded-xl p-4 flex-row items-center gap-4"
                            >
                                <View className="w-10 h-10 bg-blue-500/20 rounded-full items-center justify-center">
                                    <Bell color="#3b82f6" size={20} />
                                </View>
                                <Text className="text-white font-bold text-base">Send Reminder</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={handleWhatsAppReminder}
                                className="bg-[#131b2f] border border-gray-800 rounded-xl p-4 flex-row items-center gap-4"
                            >
                                <View className="w-10 h-10 bg-green-500/20 rounded-full items-center justify-center">
                                    <FontAwesome name="whatsapp" size={22} color="#22c55e" />
                                </View>
                                <Text className="text-white font-bold text-base">Send WhatsApp Reminder</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={handleDeleteStudent}
                                className="bg-[#131b2f] border border-red-500/20 rounded-xl p-4 flex-row items-center gap-4 mt-2"
                            >
                                <View className="w-10 h-10 bg-red-500/20 rounded-full items-center justify-center">
                                    <Trash2 color="#ef4444" size={20} />
                                </View>
                                <Text className="text-red-400 font-bold text-base">Delete Student</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}
