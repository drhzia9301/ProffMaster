import React, { useRef, useEffect } from 'react';
import { X, Play, Pause, Maximize2, Volume2, VolumeX } from 'lucide-react';

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
    title = "Tutorial"
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [isMuted, setIsMuted] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [showControls, setShowControls] = React.useState(true);

    useEffect(() => {
        if (!isOpen && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    }, [isOpen]);

    useEffect(() => {
        // Hide controls after 3 seconds of inactivity
        let timeout: NodeJS.Timeout;
        if (isPlaying) {
            timeout = setTimeout(() => setShowControls(false), 3000);
        }
        return () => clearTimeout(timeout);
    }, [isPlaying, showControls]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(progress);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const time = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
            videoRef.current.currentTime = time;
            setProgress(parseFloat(e.target.value));
        }
    };

    const handleFullscreen = () => {
        if (videoRef.current) {
            if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen();
            } else if ((videoRef.current as any).webkitRequestFullscreen) {
                (videoRef.current as any).webkitRequestFullscreen();
            }
        }
    };

    const handleVideoEnd = () => {
        setIsPlaying(false);
        setProgress(0);
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Play size={18} className="text-purple-400" />
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Video Container */}
                <div 
                    className="relative bg-black aspect-video"
                    onMouseMove={() => setShowControls(true)}
                    onClick={togglePlay}
                >
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        className="w-full h-full object-contain"
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleVideoEnd}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        playsInline
                    />

                    {/* Play/Pause Overlay */}
                    {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <button 
                                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                                className="w-20 h-20 bg-purple-600/90 hover:bg-purple-600 rounded-full flex items-center justify-center transition-all transform hover:scale-110 shadow-xl"
                            >
                                <Play size={36} className="text-white ml-1" fill="white" />
                            </button>
                        </div>
                    )}

                    {/* Controls */}
                    <div 
                        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Progress Bar */}
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={handleSeek}
                            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer mb-3 accent-purple-500"
                        />

                        {/* Control Buttons */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={togglePlay}
                                    className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                                </button>
                                <button
                                    onClick={toggleMute}
                                    className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                </button>
                            </div>
                            <button
                                onClick={handleFullscreen}
                                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <Maximize2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-800 border-t border-slate-700">
                    <p className="text-sm text-gray-400 text-center">
                        Learn how to get your free Gemini API key from Google AI Studio
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayerModal;
