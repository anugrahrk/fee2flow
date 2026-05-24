import { type Dispatch, type SetStateAction, useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser, useClerk } from "@clerk/clerk-react";

interface SidebarProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
}

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
    const location = useLocation();
    const { user } = useUser();
    const { signOut } = useClerk();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const isActive = (path: string) => {
        return location.pathname === path ? "bg-primary/10 text-primary" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white";
    };

    // Close profile menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <>
            {/* Mobile Menu Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                flex w-64 flex-col border-r border-[#e5e7eb] dark:border-gray-800 bg-white dark:bg-[#1a2230] h-full shrink-0
                transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <img src="/feeflow-logo.png" alt="FeeFlow Logo" className="w-10 h-10 object-contain rounded-lg" />
                        <h2 className="text-[#111318] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                            Fee<span className="text-blue-500">2</span>Flow
                        </h2>
                    </div>
                </div>
                <div className="flex flex-col flex-1 gap-2 p-4 overflow-y-auto">
                    {/* Student View Links */}
                    {(location.pathname.startsWith('/c') || location.pathname.startsWith('/p')) ? (
                        <>
                            <Link
                                to="/c"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive("/c")}`}
                            >
                                <span className="material-symbols-outlined">home</span>
                                <p className="text-sm font-medium leading-normal">Home</p>
                            </Link>
                            <Link
                                to="/p"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive("/p")}`}
                            >
                                <span className="material-symbols-outlined">payments</span>
                                <p className="text-sm font-medium leading-normal">Payment</p>
                            </Link>
                        </>
                    ) : (
                        /* Admin View Links */
                        <>
                            <Link
                                to="/"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive("/")}`}
                            >
                                <span className="material-symbols-outlined">dashboard</span>
                                <p className="text-sm font-medium leading-normal">Dashboard</p>
                            </Link>
                            <Link
                                to="/s"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive("/s")}`}
                            >
                                <span className="material-symbols-outlined">school</span>
                                <p className="text-sm font-medium leading-normal">Students</p>
                            </Link>
                        </>
                    )}
                </div>

                {/* Custom User Profile Section */}
                <div className="hidden md:block p-4 mt-auto border-t border-gray-100 dark:border-gray-800 relative" ref={profileMenuRef}>

                    {/* Popover Menu */}
                    {isProfileMenuOpen && (
                        <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account</p>
                                <p className="text-sm font-medium text-[#111318] dark:text-white truncate mt-1">{user?.primaryEmailAddress?.emailAddress}</p>
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">logout</span>
                                <span className="text-sm font-medium">Sign Out</span>
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <img
                            src={user?.imageUrl}
                            alt="Profile"
                            className="size-10 rounded-full border border-gray-200 dark:border-gray-700 object-cover"
                        />
                        <div className="flex flex-col items-start overflow-hidden">
                            <p className="text-sm font-medium text-[#111318] dark:text-white truncate w-full text-left">
                                {user?.fullName || 'User'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate w-full text-left">
                                {user?.primaryEmailAddress?.emailAddress}
                            </p>
                        </div>
                        <span className="material-symbols-outlined text-slate-400 ml-auto">unfold_more</span>
                    </button>
                </div>
            </aside>
        </>
    )
}
