import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Switch, Modal, Pressable, Alert, Image, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useUserStore } from '../../src/store/userStore';
import axios from 'axios';
import { Building2, Search, Plus, Edit2, Trash2, LogOut, User, X } from 'lucide-react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

type Props = {
    navigation?: any;
};

export default function OrganizationsScreen({ navigation }: Props) {
    const { getToken, signOut } = useAuth();
    const { user } = useUser();
    const { logout } = useUserStore();

    const [organizations, setOrganizations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [total, setTotal] = useState(0);
    const [profileOpen, setProfileOpen] = useState(false);

    // Add Organization Modal
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [newOrg, setNewOrg] = useState({ orgName: '', ownerName: '', mobileNumber: '', email: '' });
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState('');

    // Edit Organization Modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editOrg, setEditOrg] = useState<any>(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    // Delete Confirmation Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchOrganizations();
        }, [])
    );

    const fetchOrganizations = async (query = '') => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await axios.get(`${API_URL}/api/su/organizations?search=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrganizations(res.data.data || []);
            setTotal(res.data.pagination?.total || 0);
        } catch (error) {
            console.error("Error fetching organizations", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = useCallback((text: string) => {
        setSearchQuery(text);
        fetchOrganizations(text);
    }, []);

    const clearSearch = () => {
        setSearchQuery('');
        fetchOrganizations('');
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        // Optimistically update UI
        setOrganizations((prev) =>
            prev.map((org) => org._id === id ? { ...org, isEnabled: !currentStatus } : org)
        );
        try {
            const token = await getToken();
            await axios.patch(`${API_URL}/api/su/organizations/${id}/status`,
                { isEnabled: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error("Error toggling status", error);
            // Revert on error
            setOrganizations((prev) =>
                prev.map((org) => org._id === id ? { ...org, isEnabled: currentStatus } : org)
            );
        }
    };

    // --- Add Organization ---
    const handleAddOrganization = async () => {
        if (!newOrg.orgName || !newOrg.ownerName || !newOrg.email) {
            setAddError('Please fill in all required fields.');
            return;
        }
        setAddLoading(true);
        setAddError('');
        try {
            const token = await getToken();
            await axios.post(`${API_URL}/api/su/organizations`, newOrg, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAddModalOpen(false);
            setNewOrg({ orgName: '', ownerName: '', mobileNumber: '', email: '' });
            fetchOrganizations(searchQuery);
        } catch (error: any) {
            setAddError(error.response?.data?.message || 'Failed to create organization.');
        } finally {
            setAddLoading(false);
        }
    };

    // --- Edit Organization ---
    const openEditModal = (org: any) => {
        setEditOrg({ ...org });
        setEditError('');
        setEditModalOpen(true);
    };

    const handleEditOrganization = async () => {
        if (!editOrg.orgName || !editOrg.ownerName || !editOrg.email) {
            setEditError('Please fill in all required fields.');
            return;
        }
        setEditLoading(true);
        setEditError('');
        try {
            const token = await getToken();
            const res = await axios.put(`${API_URL}/api/su/organizations/${editOrg._id}`, {
                orgName: editOrg.orgName,
                ownerName: editOrg.ownerName,
                mobileNumber: editOrg.mobileNumber,
                email: editOrg.email,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state
            setOrganizations((prev) =>
                prev.map((org) => org._id === editOrg._id ? res.data : org)
            );
            setEditModalOpen(false);
            setEditOrg(null);
        } catch (error: any) {
            setEditError(error.response?.data?.message || 'Failed to update organization.');
        } finally {
            setEditLoading(false);
        }
    };

    // --- Delete Organization ---
    const openDeleteModal = (org: any) => {
        setDeleteTarget(org);
        setDeleteModalOpen(true);
    };

    const handleDeleteOrganization = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            const token = await getToken();
            await axios.delete(`${API_URL}/api/su/organizations/${deleteTarget._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrganizations((prev) => prev.filter((org) => org._id !== deleteTarget._id));
            setTotal((prev) => prev - 1);
            setDeleteModalOpen(false);
            setDeleteTarget(null);
        } catch (error) {
            console.error("Error deleting organization", error);
        } finally {
            setDeleteLoading(false);
        }
    };

    // --- Logout ---
    const handleLogout = async () => {
        setProfileOpen(false);
        try {
            await signOut();
            logout();
            if (navigation) navigation.replace('Login');
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    const userEmail = user?.primaryEmailAddress?.emailAddress || 'Unknown';
    const userInitials = userEmail.substring(0, 2).toUpperCase();

    // --- Reusable Form Field ---
    const FormField = ({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize }: any) => (
        <>
            <Text className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-2">{label}</Text>
            <View className="bg-[#0b101e] border border-gray-800 rounded-xl px-4 h-12 justify-center mb-4">
                <TextInput
                    className="text-white text-base"
                    placeholder={placeholder}
                    placeholderTextColor="#475569"
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType || 'default'}
                    autoCapitalize={autoCapitalize || 'sentences'}
                />
            </View>
        </>
    );

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

            {/* Add Organization Modal */}
            <Modal visible={addModalOpen} transparent animationType="slide">
                <View className="flex-1 justify-center items-center bg-black/60 px-6">
                    <View className="bg-[#131b2f] border border-gray-800 rounded-3xl p-6 w-full">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-white text-xl font-bold">Add Organization</Text>
                            <TouchableOpacity onPress={() => { setAddModalOpen(false); setAddError(''); }}>
                                <X color="#64748b" size={24} />
                            </TouchableOpacity>
                        </View>
                        {addError ? <Text className="text-red-400 text-sm mb-4">{addError}</Text> : null}
                        <FormField label="Organization Name *" value={newOrg.orgName} onChangeText={(t: string) => setNewOrg({ ...newOrg, orgName: t })} placeholder="e.g. ABC Academy" />
                        <FormField label="Owner Name *" value={newOrg.ownerName} onChangeText={(t: string) => setNewOrg({ ...newOrg, ownerName: t })} placeholder="e.g. John Doe" />
                        <FormField label="Mobile Number" value={newOrg.mobileNumber} onChangeText={(t: string) => setNewOrg({ ...newOrg, mobileNumber: t })} placeholder="e.g. 9876543210" keyboardType="phone-pad" />
                        <FormField label="Email *" value={newOrg.email} onChangeText={(t: string) => setNewOrg({ ...newOrg, email: t })} placeholder="e.g. org@company.com" keyboardType="email-address" autoCapitalize="none" />
                        <TouchableOpacity className="bg-blue-500 h-14 rounded-xl items-center justify-center mt-2" onPress={handleAddOrganization} disabled={addLoading}>
                            {addLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Add Organization</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Edit Organization Modal */}
            <Modal visible={editModalOpen} transparent animationType="slide">
                <View className="flex-1 justify-center items-center bg-black/60 px-6">
                    <View className="bg-[#131b2f] border border-gray-800 rounded-3xl p-6 w-full">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-white text-xl font-bold">Edit Organization</Text>
                            <TouchableOpacity onPress={() => { setEditModalOpen(false); setEditError(''); }}>
                                <X color="#64748b" size={24} />
                            </TouchableOpacity>
                        </View>
                        {editError ? <Text className="text-red-400 text-sm mb-4">{editError}</Text> : null}
                        {editOrg && (
                            <>
                                <FormField label="Organization Name *" value={editOrg.orgName} onChangeText={(t: string) => setEditOrg({ ...editOrg, orgName: t })} placeholder="Org name" />
                                <FormField label="Owner Name *" value={editOrg.ownerName} onChangeText={(t: string) => setEditOrg({ ...editOrg, ownerName: t })} placeholder="Owner name" />
                                <FormField label="Mobile Number" value={editOrg.mobileNumber || ''} onChangeText={(t: string) => setEditOrg({ ...editOrg, mobileNumber: t })} placeholder="Mobile" keyboardType="phone-pad" />
                                <FormField label="Email *" value={editOrg.email} onChangeText={(t: string) => setEditOrg({ ...editOrg, email: t })} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
                                <TouchableOpacity className="bg-blue-500 h-14 rounded-xl items-center justify-center mt-2" onPress={handleEditOrganization} disabled={editLoading}>
                                    {editLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Save Changes</Text>}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal visible={deleteModalOpen} transparent animationType="fade">
                <View className="flex-1 justify-center items-center bg-black/60 px-6">
                    <View className="bg-[#131b2f] border border-gray-800 rounded-3xl p-6 w-full items-center">
                        <View className="bg-red-500/10 p-4 rounded-full border border-red-500/20 mb-4">
                            <Trash2 color="#ef4444" size={32} />
                        </View>
                        <Text className="text-white text-xl font-bold mb-2">Delete Organization?</Text>
                        <Text className="text-gray-400 text-center mb-2">
                            Are you sure you want to delete{' '}
                            <Text className="text-white font-bold">{deleteTarget?.orgName}</Text>?
                        </Text>
                        <Text className="text-red-400 text-xs text-center mb-6">This action cannot be undone.</Text>

                        <View className="flex-row gap-4 w-full">
                            <TouchableOpacity
                                className="flex-1 h-12 rounded-xl border border-gray-700 items-center justify-center"
                                onPress={() => { setDeleteModalOpen(false); setDeleteTarget(null); }}
                            >
                                <Text className="text-gray-400 font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 h-12 rounded-xl bg-red-500 items-center justify-center"
                                onPress={handleDeleteOrganization}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Delete</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ===== MAIN CONTENT ===== */}
            <View className="flex-1 px-6 pt-6">
                {/* Search Bar */}
                <View className="bg-[#131b2f] border border-gray-800 rounded-xl px-4 h-14 flex-row items-center mb-4">
                    <Search color="#64748b" size={20} />
                    <TextInput
                        className="flex-1 text-white ml-3 text-base"
                        placeholder="Search by name, email or number..."
                        placeholderTextColor="#64748b"
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <X color="#64748b" size={18} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Add Button */}
                <TouchableOpacity
                    className="bg-blue-500 rounded-xl h-14 flex-row items-center justify-center mb-8"
                    onPress={() => setAddModalOpen(true)}
                >
                    <Plus color="white" size={20} />
                    <Text className="text-white font-bold ml-2 text-sm tracking-wide">ADD ORGANISATION</Text>
                </TouchableOpacity>

                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-slate-400 text-xs font-bold tracking-widest uppercase">Your Portfolio</Text>
                    <View className="bg-blue-500/10 px-3 py-1 rounded-full">
                        <Text className="text-blue-500 text-xs font-bold">{total} TOTAL</Text>
                    </View>
                </View>

                {/* Organizations List */}
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                    {loading ? <ActivityIndicator color="#3b82f6" style={{ marginTop: 20 }} /> : organizations.map((org: any, index: number) => (
                        <View key={org._id || index} className="bg-[#131b2f] border border-gray-800 rounded-2xl p-5 mb-4">
                            <View className="flex-row justify-between items-start mb-4">
                                <View className="flex-row items-center gap-4">
                                    <View className="bg-slate-800 p-3 rounded-xl">
                                        <Building2 color="#94a3b8" size={24} />
                                    </View>
                                    <View>
                                        <Text className="text-white text-lg font-medium">{org.orgName}</Text>
                                        <View className="flex-row items-center mt-1">
                                            <View className={`w-2 h-2 rounded-full mr-2 ${org.isEnabled ? 'bg-green-500' : 'bg-slate-500'}`} />
                                            <Text className={org.isEnabled ? "text-green-500 text-xs font-bold" : "text-slate-500 text-xs font-bold"}>
                                                {org.isEnabled ? 'ACTIVE' : 'INACTIVE'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <Switch
                                    value={org.isEnabled}
                                    onValueChange={() => toggleStatus(org._id, org.isEnabled)}
                                    trackColor={{ false: '#1e293b', true: '#3b82f6' }}
                                    thumbColor={org.isEnabled ? '#ffffff' : '#94a3b8'}
                                />
                            </View>

                            <View className="h-[1px] bg-gray-800 mb-4" />

                            <View className="flex-row justify-between items-center">
                                <View className="flex-row gap-4">
                                    <TouchableOpacity onPress={() => openEditModal(org)} className="bg-blue-500/10 p-2 rounded-lg">
                                        <Edit2 color="#3b82f6" size={18} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => openDeleteModal(org)} className="bg-red-500/10 p-2 rounded-lg">
                                        <Trash2 color="#ef4444" size={18} />
                                    </TouchableOpacity>
                                </View>
                                <Text className="text-slate-500 text-xs font-mono font-medium tracking-wider">
                                    ID: {org._id.substring(org._id.length - 6).toUpperCase()}-{org.orgName.substring(0, 2).toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    ))}
                    {organizations.length === 0 && !loading && (
                        <View className="bg-[#131b2f] rounded-2xl border border-gray-800 p-8 items-center">
                            <Text className="text-gray-500 text-center">
                                {searchQuery ? 'No organizations match your search.' : 'No organizations found.'}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}
