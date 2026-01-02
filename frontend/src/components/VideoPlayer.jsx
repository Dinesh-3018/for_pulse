import React from 'react';
import { useSelector } from 'react-redux';
import { videoService } from '../services/api';
import { X, ShieldAlert, ShieldCheck } from 'lucide-react';

const VideoPlayer = ({ video, onClose }) => {
    // Get token from Redux state for authentication
    const { token } = useSelector((state) => state.auth);
    // Append token to stream URL to bypass partial auth header limitations in video tags
    const streamUrl = `${videoService.getStreamUrl(video._id)}?token=${token}`;
console.log(streamUrl,"adsfasfsafsa");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4 md:p-10 backdrop-blur-sm">
            <div className="relative w-full max-w-5xl bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2 bg-gray-800 bg-opacity-50 rounded-full transition-all"
                >
                    <X className="h-6 w-6" />
                </button>

                <div className="aspect-video w-full">
                    <video 
                        className="w-full h-full"
                        controls 
                        autoPlay
                        crossOrigin="anonymous"
                    >
                        <source src={streamUrl} type={video.format || 'video/mp4'} />
                        Your browser does not support the video tag.
                    </video>
                </div>

                <div className="p-6 bg-gray-800 text-white flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold">{video.title}</h2>
                        <p className="text-gray-400 mt-1 text-sm">{video.description}</p>
                    </div>
                    <div>
                        {video.sensitivityStatus === 'safe' ? (
                            <span className="flex items-center space-x-2 bg-green-900 bg-opacity-30 text-green-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-green-800">
                                <ShieldCheck className="h-4 w-4" />
                                <span>Content Verified: Safe</span>
                            </span>
                        ) : video.sensitivityStatus === 'flagged' ? (
                            <span className="flex items-center space-x-2 bg-red-900 bg-opacity-30 text-red-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-red-800">
                                <ShieldAlert className="h-4 w-4" />
                                <span>Warning: Sensitivity Flagged</span>
                            </span>
                        ) : (
                            <span className="bg-blue-900 bg-opacity-30 text-blue-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-blue-800">
                                Processing Analysis...
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
