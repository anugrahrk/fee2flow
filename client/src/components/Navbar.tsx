import { useState, type Dispatch, type SetStateAction, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser, useClerk } from "@clerk/clerk-react";
import { io } from 'socket.io-client';
import { useUserStore } from '../store/userStore';
import api from '../api/axios';
import { toast } from 'sonner';

interface NavbarProps {
    setIsMobileMenuOpen?: Dispatch<SetStateAction<boolean>>;
}

export default function Navbar({ setIsMobileMenuOpen }: NavbarProps) {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const notificationMenuRef = useRef<HTMLDivElement>(null);

    const location = useLocation();
    const { user } = useUser();
    const { signOut } = useClerk();
    const { user: dbUser, role } = useUserStore();

    const isStudentPage = location.pathname.startsWith('/c') || location.pathname.startsWith('/p');
    const isSuperAdmin = location.pathname.startsWith('/su');

    const [notifications, setNotifications] = useState<any[]>([]);
    const [hasUnread, setHasUnread] = useState(false);

    // Format time helper
    const formatTime = (timeStr: string) => {
        try {
            const date = new Date(timeStr);
            const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
            if (seconds < 60) return 'Just now';
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes}m ago`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours}h ago`;
            return date.toLocaleDateString();
        } catch {
            return 'Just now';
        }
    };

    // Fetch initial cached notifications on mount / when dbUser is available
    useEffect(() => {
        if (role === 'admin' && dbUser) {
            const fetchInitialNotifications = async () => {
                try {
                    const response = await api.get('/api/admin/notifications');
                    setNotifications(response.data || []);
                } catch (error) {
                    console.error("Error fetching notifications history:", error);
                }
            };
            fetchInitialNotifications();
        }
    }, [dbUser, role]);

    // WebSocket setup for real-time notifications
    useEffect(() => {
        if (role === 'admin' && dbUser) {
            const orgId = dbUser._id || dbUser.organizationId;
            if (!orgId) return;

            const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const socket = io(SOCKET_URL);

            socket.on('connect', () => {
                socket.emit('join_org', orgId.toString());
            });

            socket.on('payment_success', (newNotification: any) => {
                toast.success(newNotification.message, {
                    description: 'Keep track of all payments seamlessly',
                    duration: 5000,
                });
                setNotifications((prev) => [newNotification, ...prev].slice(0, 5));
                setHasUnread(true);
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [dbUser, role]);



    // Close profile and notification menus when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
            if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-[#e5e7eb] dark:border-gray-800 bg-white dark:bg-[#1a2230] px-4 md:px-8 py-4 shrink-0">
            <div className="flex items-center gap-3">
                {setIsMobileMenuOpen && (
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden p-1 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                )}

                <div className={`flex items-center gap-2 ${(!isStudentPage && !isSuperAdmin) ? 'md:hidden' : ''}`}>
                    <img src="/feeflow-logo.png" alt="Fee2Flow Logo" className="w-10 h-10 object-contain rounded-lg" />
                    <h2 className="text-[#111318] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                        Fee<span className="text-blue-500">2</span>Flow
                    </h2>
                </div>
            </div>
            <div className="flex items-center gap-6">

                {!isSuperAdmin && (
                    <div className="relative" ref={notificationMenuRef}>
                        <button
                            onClick={() => {
                                setIsNotificationsOpen(!isNotificationsOpen);
                                setIsProfileMenuOpen(false);
                                setHasUnread(false);
                            }}
                            className="flex items-center justify-center rounded-full size-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors relative"
                        >
                            <span className="material-symbols-outlined text-[20px]">notifications</span>
                            {hasUnread && (
                                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1a2230]"></span>
                            )}
                        </button>

                        {isNotificationsOpen && (
                            <div className="fixed top-16 right-4 left-4 sm:absolute sm:top-12 sm:-right-4 sm:left-auto w-auto sm:w-80 max-w-[400px] bg-white dark:bg-[#1a2230] rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 z-[100] overflow-hidden">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <h3 className="font-semibold text-[#111318] dark:text-white">Notifications</h3>
                                    <button className="text-xs text-primary hover:underline">Mark all read</button>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        notifications.map((notification) => (
                                            <div key={notification.id} className="p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-sm font-medium text-[#111318] dark:text-white">Payment Received</p>
                                                    <span className="text-xs text-slate-400">{formatTime(notification.time)}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {notification.message}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-sm text-slate-400">
                                            No recent notifications
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 text-center border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#1a2230]">
                                    <button className="text-sm text-primary font-medium hover:underline">See all notifications</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Profile Icon */}
                <div className={`relative pl-4 border-l border-slate-200 dark:border-slate-700 ${(!isSuperAdmin && !isStudentPage) ? 'md:hidden' : ''}`} ref={profileMenuRef}>
                    <button
                        onClick={() => {
                            setIsProfileMenuOpen(!isProfileMenuOpen);
                            setIsNotificationsOpen(false);
                        }}
                            className="flex items-center gap-3 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <div className="flex flex-col text-right hidden sm:block">
                                <p className="text-sm font-semibold text-[#111318] dark:text-white leading-tight">
                                    {user?.fullName || (isSuperAdmin ? 'Administrator' : 'Student')}
                                </p>
                                <p className="text-xs text-slate-500">{isSuperAdmin ? 'Super User' : 'Student'}</p>
                            </div>
                            <img
                                src={user?.imageUrl}
                                alt="Profile"
                                className="size-10 rounded-full border border-gray-200 dark:border-gray-700 object-cover ring-2 ring-transparent hover:ring-primary transition-all"
                            />
                        </button>

                        {/* Custom Popover Menu */}
                        {isProfileMenuOpen && (
                            <div className="absolute top-14 right-0 w-64 bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100]">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/50">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Signed in as</p>
                                    <p className="text-sm font-bold text-[#111318] dark:text-white truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                                </div>
                                {/* <div className="p-2">
                                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                                        <span className="material-symbols-outlined text-[20px]">person</span>
                                        <span className="text-sm font-medium">My Profile</span>
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                                        <span className="material-symbols-outlined text-[20px]">settings</span>
                                        <span className="text-sm font-medium">Settings</span>
                                    </button>
                                </div> */}
                                <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={() => signOut()}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">logout</span>
                                        <span className="text-sm font-medium">Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
            </div>
        </header>
    );
}
