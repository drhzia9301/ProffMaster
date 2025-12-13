import React from 'react';
import { Download, AlertTriangle, Smartphone } from 'lucide-react';

interface VersionBlockedModalProps {
    requiredVersion?: string;
    message?: string;
}

const VersionBlockedModal: React.FC<VersionBlockedModalProps> = ({ 
    requiredVersion = '1.3.0',
    message 
}) => {
    const handleCallContact = () => {
        window.location.href = 'tel:03169694543';
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                            <AlertTriangle size={28} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Update Required</h2>
                            <p className="text-red-100 text-sm">Your app is outdated</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Message */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-sm text-amber-800">
                            {message || 'A new version of ProffMaster is available with important improvements and bug fixes. Please update to continue using the app.'}
                        </p>
                    </div>

                    {/* Version Info */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <Smartphone className="text-gray-500" size={20} />
                            <div>
                                <p className="text-xs text-gray-500">Minimum Required Version</p>
                                <p className="font-bold text-gray-900">v{requiredVersion}</p>
                            </div>
                        </div>
                    </div>

                    {/* What's New */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Why update?</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                New AI features and improvements
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                Bug fixes and performance enhancements
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                New preproff questions added
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-5 rounded-xl text-center">
                        <p className="text-sm mb-2 opacity-90">Contact for the new APK</p>
                        <button
                            onClick={handleCallContact}
                            className="text-2xl font-bold hover:scale-105 transition-transform"
                        >
                            📞 03169694543
                        </button>
                    </div>
                    <p className="text-xs text-center text-gray-400 mt-3">
                        Your progress and data will be preserved after updating
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VersionBlockedModal;
