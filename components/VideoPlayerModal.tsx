import React from 'react';
import { X } from 'lucide-react';

interface VideoPlayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoSrc: string;
    title?: string;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ 
    isOpen, 
    onClose, 
    videoSrc,
    title = 'Tutorial Video'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="relative w-full max-w-2xl">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg"
                >
                    <X size={20} />
                    <span className="text-sm font-medium">Close</span>
                </button>

                {/* Title */}
                <h3 className="text-white font-semibold mb-3 text-center">{title}</h3>

                {/* Video container */}
                <div className="bg-black rounded-xl overflow-hidden shadow-2xl">
                    <video
                        src={videoSrc}
                        controls
                        autoPlay
                        className="w-full max-h-[70vh]"
                        controlsList="nodownload"
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>

                {/* Hint */}
                <p className="text-white/60 text-xs text-center mt-3">
                    Tap anywhere outside the video or press Close to exit
                </p>
            </div>

            {/* Click outside to close */}
            <div 
                className="absolute inset-0 -z-10"
                onClick={onClose}
            />
        </div>
    );
};

export default VideoPlayerModal;
