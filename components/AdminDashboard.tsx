import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, 
    ArrowLeft, 
    Users, 
    CreditCard, 
    Ban, 
    CheckCircle, 
    XCircle, 
    Loader2, 
    Shield,
    UserCheck,
    UserX,
    AlertTriangle,
    RefreshCw,
    Target,
    BarChart3
} from 'lucide-react';
import { subscriptionService, UserProfile } from '../services/subscriptionService';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    
    // State
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [searching, setSearching] = useState(false);
    const [usersWithAccess, setUsersWithAccess] = useState<UserProfile[]>([]);
    const [bannedUsers, setBannedUsers] = useState<UserProfile[]>([]);
    const [stats, setStats] = useState({ totalUsers: 0, usersWithAccess: 0, bannedUsers: 0 });
    const [activeTab, setActiveTab] = useState<'search' | 'subscribers' | 'banned'>('search');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Check admin status on mount
    useEffect(() => {
        const checkAdmin = async () => {
            setLoading(true);
            const admin = await subscriptionService.isAdmin();
            setIsAdmin(admin);
            
            if (admin) {
                // Load initial data
                const [statsData, subscribers, banned] = await Promise.all([
                    subscriptionService.getStats(),
                    subscriptionService.getUsersWithAccess(),
                    subscriptionService.getBannedUsers()
                ]);
                setStats(statsData);
                setUsersWithAccess(subscribers);
                setBannedUsers(banned);
            }
            setLoading(false);
        };
        checkAdmin();
    }, []);

    // Search users
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        
        setSearching(true);
        const results = await subscriptionService.searchUsers(searchQuery.trim());
        setSearchResults(results);
        setSearching(false);
    };

    // Handle Enter key in search
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Grant access
    const handleGrantAccess = async (userId: string, email: string) => {
        setActionLoading(userId);
        setMessage(null);
        
        const result = await subscriptionService.grantPreproffAccess(userId, `Granted via admin panel`);
        
        if (result.success) {
            setMessage({ type: 'success', text: `Access granted to ${email}` });
            // Refresh the list
            if (searchResults.length > 0) {
                const updated = searchResults.map(u => 
                    u.id === userId ? { ...u, has_preproff_access: true } : u
                );
                setSearchResults(updated);
            }
            // Refresh subscribers
            const subscribers = await subscriptionService.getUsersWithAccess();
            setUsersWithAccess(subscribers);
            // Update stats
            const newStats = await subscriptionService.getStats();
            setStats(newStats);
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to grant access' });
        }
        
        setActionLoading(null);
    };

    // Revoke access
    const handleRevokeAccess = async (userId: string, email: string) => {
        if (!confirm(`Are you sure you want to revoke access for ${email}?`)) return;
        
        setActionLoading(userId);
        setMessage(null);
        
        const result = await subscriptionService.revokePreproffAccess(userId);
        
        if (result.success) {
            setMessage({ type: 'success', text: `Access revoked from ${email}` });
            // Refresh the lists
            if (searchResults.length > 0) {
                const updated = searchResults.map(u => 
                    u.id === userId ? { ...u, has_preproff_access: false } : u
                );
                setSearchResults(updated);
            }
            setUsersWithAccess(prev => prev.filter(u => u.id !== userId));
            // Update stats
            const newStats = await subscriptionService.getStats();
            setStats(newStats);
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to revoke access' });
        }
        
        setActionLoading(null);
    };

    // Ban user
    const handleBanUser = async (userId: string, email: string) => {
        const reason = prompt(`Enter ban reason for ${email}:`, 'Violation of terms');
        if (reason === null) return; // User cancelled
        
        setActionLoading(userId);
        setMessage(null);
        
        const result = await subscriptionService.banUser(userId, reason);
        
        if (result.success) {
            setMessage({ type: 'success', text: `${email} has been banned` });
            // Refresh the lists
            if (searchResults.length > 0) {
                const updated = searchResults.map(u => 
                    u.id === userId ? { ...u, is_banned: true, ban_reason: reason } : u
                );
                setSearchResults(updated);
            }
            // Refresh banned users and stats
            const [newStats, banned] = await Promise.all([
                subscriptionService.getStats(),
                subscriptionService.getBannedUsers()
            ]);
            setStats(newStats);
            setBannedUsers(banned);
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to ban user' });
        }
        
        setActionLoading(null);
    };

    // Unban user
    const handleUnbanUser = async (userId: string, email: string) => {
        if (!confirm(`Are you sure you want to unban ${email}? Their violation count will be reset.`)) return;
        
        setActionLoading(userId);
        setMessage(null);
        
        const result = await subscriptionService.unbanUser(userId);
        
        if (result.success) {
            setMessage({ type: 'success', text: `${email} has been unbanned` });
            // Refresh the lists
            if (searchResults.length > 0) {
                const updated = searchResults.map(u => 
                    u.id === userId ? { ...u, is_banned: false, violation_count: 0, ban_reason: undefined } : u
                );
                setSearchResults(updated);
            }
            // Remove from banned list
            setBannedUsers(prev => prev.filter(u => u.id !== userId));
            // Update stats
            const newStats = await subscriptionService.getStats();
            setStats(newStats);
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to unban user' });
        }
        
        setActionLoading(null);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <Loader2 className="animate-spin text-medical-600" size={40} />
            </div>
        );
    }

    // Not an admin
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Ban size={40} className="text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Access Denied</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        You don't have admin privileges to access this page.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-medical-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-medical-700 transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center text-slate-300 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} className="mr-2" />
                        Back to App
                    </button>
                    <div className="flex items-center gap-3">
                        <Shield size={32} />
                        <div>
                            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                            <p className="text-slate-300 text-sm">Manage users and subscriptions</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="max-w-4xl mx-auto px-4 -mt-4">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-lg border border-gray-100 dark:border-slate-700">
                        <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center mb-1 sm:mb-0">
                                <Users size={16} className="sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</div>
                                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Total Users</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-lg border border-gray-100 dark:border-slate-700">
                        <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 dark:bg-green-500/10 flex items-center justify-center mb-1 sm:mb-0">
                                <CreditCard size={16} className="sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.usersWithAccess}</div>
                                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Subscribers</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-lg border border-gray-100 dark:border-slate-700">
                        <div className="flex flex-col sm:flex-row items-center sm:gap-3 text-center sm:text-left">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-1 sm:mb-0">
                                <Ban size={16} className="sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.bannedUsers}</div>
                                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Banned</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className="max-w-4xl mx-auto px-4 mt-4">
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${
                        message.type === 'success' 
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                    }`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                        {message.text}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="max-w-4xl mx-auto px-4 mt-6">
                <div className="flex gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
                            activeTab === 'search'
                                ? 'bg-medical-600 text-white'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <Search size={16} className="inline mr-2" />
                        Search
                    </button>
                    <button
                        onClick={() => setActiveTab('subscribers')}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
                            activeTab === 'subscribers'
                                ? 'bg-medical-600 text-white'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <UserCheck size={16} className="inline mr-2" />
                        Paid ({usersWithAccess.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('banned')}
                        className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${
                            activeTab === 'banned'
                                ? 'bg-red-600 text-white'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <Ban size={16} className="inline mr-2" />
                        Banned ({bannedUsers.length})
                    </button>
                </div>
            </div>

            {/* Search Tab */}
            {activeTab === 'search' && (
                <div className="max-w-4xl mx-auto px-4 mt-6 space-y-4">
                    {/* Search Input */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    placeholder="Search by email address..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:border-medical-500 focus:ring-2 focus:ring-medical-100 dark:focus:ring-medical-900/30 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={searching || !searchQuery.trim()}
                                className="px-6 py-3 bg-medical-600 text-white rounded-xl font-bold hover:bg-medical-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {searching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                                Search
                            </button>
                        </div>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    Search Results ({searchResults.length})
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                {searchResults.map((user) => (
                                    <UserRow 
                                        key={user.id} 
                                        user={user}
                                        actionLoading={actionLoading}
                                        onGrant={handleGrantAccess}
                                        onRevoke={handleRevokeAccess}
                                        onBan={handleBanUser}
                                        onUnban={handleUnbanUser}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {searchResults.length === 0 && searchQuery && !searching && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center shadow-sm border border-gray-100 dark:border-slate-700">
                            <Search size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No users found matching "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            )}

            {/* Subscribers Tab */}
            {activeTab === 'subscribers' && (
                <div className="max-w-4xl mx-auto px-4 mt-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 dark:text-white">
                                Users with Preproff Access
                            </h3>
                            <button
                                onClick={async () => {
                                    const subscribers = await subscriptionService.getUsersWithAccess();
                                    setUsersWithAccess(subscribers);
                                }}
                                className="text-medical-600 hover:text-medical-700 transition-colors"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                        {usersWithAccess.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                {usersWithAccess.map((user) => (
                                    <UserRow 
                                        key={user.id} 
                                        user={user}
                                        actionLoading={actionLoading}
                                        onGrant={handleGrantAccess}
                                        onRevoke={handleRevokeAccess}
                                        onBan={handleBanUser}
                                        onUnban={handleUnbanUser}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <UserX size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-500 dark:text-gray-400">No subscribers yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Banned Users Tab */}
            {activeTab === 'banned' && (
                <div className="max-w-4xl mx-auto px-4 mt-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Ban size={18} className="text-red-500" />
                                Banned Users
                            </h3>
                            <button
                                onClick={async () => {
                                    const banned = await subscriptionService.getBannedUsers();
                                    setBannedUsers(banned);
                                }}
                                className="text-medical-600 hover:text-medical-700 transition-colors"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                        {bannedUsers.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                {bannedUsers.map((user) => (
                                    <UserRow 
                                        key={user.id} 
                                        user={user}
                                        actionLoading={actionLoading}
                                        onGrant={handleGrantAccess}
                                        onRevoke={handleRevokeAccess}
                                        onBan={handleBanUser}
                                        onUnban={handleUnbanUser}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center">
                                <CheckCircle size={40} className="text-green-300 dark:text-green-600 mx-auto mb-3" />
                                <p className="text-gray-500 dark:text-gray-400">No banned users</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// User Row Component
interface UserRowProps {
    user: UserProfile;
    actionLoading: string | null;
    onGrant: (userId: string, email: string) => void;
    onRevoke: (userId: string, email: string) => void;
    onBan: (userId: string, email: string) => void;
    onUnban: (userId: string, email: string) => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, actionLoading, onGrant, onRevoke, onBan, onUnban }) => {
    const [stats, setStats] = useState<{ totalAttempts: number; correctAnswers: number; accuracy: number } | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [showStats, setShowStats] = useState(false);

    const fetchStats = async () => {
        if (stats !== null) {
            setShowStats(!showStats);
            return;
        }
        setLoadingStats(true);
        try {
            const userStats = await subscriptionService.getUserStats(user.id);
            console.log('Fetched stats for user:', user.id, userStats);
            setStats(userStats || { totalAttempts: 0, correctAnswers: 0, accuracy: 0 });
            setShowStats(true);
        } catch (e) {
            console.error('Failed to fetch stats:', e);
            setStats({ totalAttempts: 0, correctAnswers: 0, accuracy: 0 });
            setShowStats(true);
        }
        setLoadingStats(false);
    };

    return (
        <div className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        user.is_banned 
                            ? 'bg-red-100 dark:bg-red-900/20' 
                            : user.has_preproff_access 
                                ? 'bg-green-100 dark:bg-green-900/20' 
                                : 'bg-gray-100 dark:bg-slate-700'
                    }`}>
                        {user.is_banned ? (
                            <Ban size={18} className="text-red-600 dark:text-red-400" />
                        ) : user.has_preproff_access ? (
                            <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                        ) : (
                            <Users size={18} className="text-gray-500 dark:text-gray-400" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {user.email}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            {user.is_banned && (
                                <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <AlertTriangle size={12} />
                                    Banned{user.ban_reason ? `: ${user.ban_reason}` : ''}
                                </span>
                            )}
                            {user.has_preproff_access && !user.is_banned && (
                                <span className="text-green-600 dark:text-green-400">
                                    ✓ Has Access
                                </span>
                            )}
                            {user.violation_count > 0 && !user.is_banned && (
                                <span className="text-amber-600 dark:text-amber-400">
                                    ⚠ {user.violation_count} violations
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {/* Stats Button */}
                    <button
                        onClick={fetchStats}
                        disabled={loadingStats}
                        className="px-2 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/40 disabled:opacity-50 transition-colors flex items-center gap-1"
                        title="View user stats"
                    >
                        {loadingStats ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <BarChart3 size={14} />
                        )}
                    </button>
                    {/* Ban/Unban Button */}
                    {user.is_banned ? (
                        <button
                            onClick={() => onUnban(user.id, user.email)}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/40 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                            title="Unban user"
                        >
                            {actionLoading === user.id ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <UserCheck size={14} />
                            )}
                            Unban
                        </button>
                    ) : (
                        <>
                            {/* Access Grant/Revoke */}
                            {user.has_preproff_access ? (
                                <button
                                    onClick={() => onRevoke(user.id, user.email)}
                                    disabled={actionLoading === user.id}
                                    className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900/40 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                                >
                                    {actionLoading === user.id ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <XCircle size={14} />
                                    )}
                                    Revoke
                                </button>
                            ) : (
                                <button
                                    onClick={() => onGrant(user.id, user.email)}
                                    disabled={actionLoading === user.id}
                                    className="px-3 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/40 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                                >
                                    {actionLoading === user.id ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <CheckCircle size={14} />
                                    )}
                                    Grant
                                </button>
                            )}
                            {/* Ban Button */}
                            <button
                                onClick={() => onBan(user.id, user.email)}
                                disabled={actionLoading === user.id}
                                className="px-3 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/40 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                                title="Ban user"
                            >
                                <Ban size={14} />
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            {/* Stats Panel */}
            {showStats && stats !== null && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.totalAttempts}</div>
                            <div className="text-xs text-blue-500 dark:text-blue-300">Questions</div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats.correctAnswers}</div>
                            <div className="text-xs text-green-500 dark:text-green-300">Correct</div>
                        </div>
                        <div className={`rounded-lg p-2 text-center ${
                            stats.accuracy >= 70 
                                ? 'bg-green-50 dark:bg-green-900/20' 
                                : stats.accuracy >= 50 
                                    ? 'bg-amber-50 dark:bg-amber-900/20' 
                                    : 'bg-red-50 dark:bg-red-900/20'
                        }`}>
                            <div className={`text-lg font-bold flex items-center justify-center gap-1 ${
                                stats.accuracy >= 70 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : stats.accuracy >= 50 
                                        ? 'text-amber-600 dark:text-amber-400' 
                                        : 'text-red-600 dark:text-red-400'
                            }`}>
                                <Target size={14} />
                                {stats.accuracy}%
                            </div>
                            <div className={`text-xs ${
                                stats.accuracy >= 70 
                                    ? 'text-green-500 dark:text-green-300' 
                                    : stats.accuracy >= 50 
                                        ? 'text-amber-500 dark:text-amber-300' 
                                        : 'text-red-500 dark:text-red-300'
                            }`}>Accuracy</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
