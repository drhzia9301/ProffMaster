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
    RefreshCw
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
    const [stats, setStats] = useState({ totalUsers: 0, usersWithAccess: 0, bannedUsers: 0 });
    const [activeTab, setActiveTab] = useState<'search' | 'subscribers'>('search');
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
                const [statsData, subscribers] = await Promise.all([
                    subscriptionService.getStats(),
                    subscriptionService.getUsersWithAccess()
                ]);
                setStats(statsData);
                setUsersWithAccess(subscribers);
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
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                                <Users size={20} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Total Users</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
                                <CreditCard size={20} className="text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.usersWithAccess}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Subscribers</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                                <Ban size={20} className="text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.bannedUsers}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Banned</div>
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
                        Search Users
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
                        Subscribers ({usersWithAccess.length})
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
        </div>
    );
};

// User Row Component
interface UserRowProps {
    user: UserProfile;
    actionLoading: string | null;
    onGrant: (userId: string, email: string) => void;
    onRevoke: (userId: string, email: string) => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, actionLoading, onGrant, onRevoke }) => {
    return (
        <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
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
                <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {user.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        {user.is_banned && (
                            <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                                <AlertTriangle size={12} />
                                Banned
                            </span>
                        )}
                        {user.has_preproff_access && (
                            <span className="text-green-600 dark:text-green-400">
                                ✓ Has Access
                            </span>
                        )}
                        {user.violation_count > 0 && (
                            <span className="text-amber-600 dark:text-amber-400">
                                {user.violation_count} violations
                            </span>
                        )}
                        {user.preproff_access_granted_at && (
                            <span className="text-gray-400">
                                Since {new Date(user.preproff_access_granted_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {user.has_preproff_access ? (
                    <button
                        onClick={() => onRevoke(user.id, user.email)}
                        disabled={actionLoading === user.id}
                        className="px-3 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/40 disabled:opacity-50 transition-colors flex items-center gap-1.5"
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
                        disabled={actionLoading === user.id || user.is_banned}
                        className="px-3 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/40 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                        {actionLoading === user.id ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <CheckCircle size={14} />
                        )}
                        Grant Access
                    </button>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
