import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchVideos } from "../store/slices/videoSlice";
import { Play, Shield, ShieldAlert, Clock, Loader, AlertTriangle, CheckCircle2 } from "lucide-react";

const VideoList = React.memo(({ onSelectVideo }) => {
  const dispatch = useDispatch();
  const { videos, isLoading, error } = useSelector((state) => state.videos);

  if (isLoading && videos.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader className="h-10 w-10 text-primary-600 animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">Loading your library...</p>
      </div>
    );

  if (error && videos.length === 0)
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-red-800 mb-1">Failed to load videos</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => dispatch(fetchVideos())}
          className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all"
        >
          Try Again
        </button>
      </div>
    );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.length === 0 ? (
        <div className="col-span-full text-center py-20 text-gray-500">
          No videos found. 
        </div>
      ) : (
        videos.map((video) => (
          <div
            key={video._id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
            onClick={() => onSelectVideo(video)}
          >
            <div 
              className="aspect-video bg-gray-900 flex items-center justify-center relative bg-cover bg-center"
              style={{
                backgroundImage: video.thumbnail 
                  ? `url(http://localhost:5001/${video.thumbnail})` 
                  : 'none'
              }}
            >
              <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              {video.sensitivityStatus === "flagged" && (
                <div className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow-lg">
                  <ShieldAlert className="h-4 w-4" />
                </div>
              )}
              {video.sensitivityStatus === "safe" && (
                <div className="absolute top-2 right-2 bg-green-600 text-white p-1 rounded-full shadow-lg">
                  <Shield className="h-4 w-4" />
                </div>
              )}
              {(video.status === "processing" || video.status === "pending") && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 space-y-3">
                  <Loader className={`h-8 w-8 text-primary-400 ${video.status === 'processing' ? 'animate-spin' : 'animate-pulse'}`} />
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden shadow-inner">
                    <div
                      className={`h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)] ${
                        video.status === 'processing' ? 'bg-primary-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${video.processingProgress || 0}%` }}
                    />
                  </div>
                  <div className="flex flex-col items-center w-full">
                    <span className="text-xs text-white font-bold tracking-wider">
                      {video.processingProgress || 0}%
                    </span>
                    <span className="text-[10px] text-gray-300 uppercase font-medium animate-pulse">
                      {video.status === 'processing' ? 'Analyzing Content...' : 'Queued for Analysis...'}
                    </span>
                    
                    {/* Real-time Analysis Logs */}
                    {video.detectedLabels && video.detectedLabels.length > 0 && (
                      <div className="mt-2 w-full max-h-16 overflow-y-auto bg-black/50 rounded p-2 space-y-1">
                        <div className="text-[9px] text-gray-400 uppercase font-semibold mb-1">
                          🔍 Detected:
                        </div>
                        {video.detectedLabels.map((label, idx) => (
                          <div 
                            key={idx} 
                            className="text-[9px] text-yellow-300 font-mono animate-pulse"
                          >
                            • {label.replace('_', ' ')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {video.status === "failed" && (
                <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <AlertTriangle className="h-8 w-8 text-white" />
                  <span className="text-xs text-white font-bold uppercase">
                    Analysis Failed
                  </span>
                  <span className="text-[10px] text-red-100 line-clamp-2">
                    {video.analysisError || "An error occurred during processing"}
                  </span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 truncate">
                {video.title}
              </h3>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                </span>
                <div className="flex items-center space-x-2">
                  {/* Visibility Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium ${
                      video.visibility === "public"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                    title={video.visibility === "public" ? "Public - Everyone can view" : "Private - Only Admin/Editor can view"}
                  >
                    {video.visibility === "public" ? "🌍" : "🔒"}
                  </span>
                  {/* Status Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium ${
                      video.status === "completed"
                        ? "bg-green-50 text-green-700"
                        : video.status === "processing"
                        ? "bg-blue-50 text-blue-700"
                        : video.status === "failed"
                        ? "bg-red-50 text-red-700"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    {(video.status || "pending").toUpperCase()}
                  </span>
                </div>
              </div>
              {video.detectedLabels && video.detectedLabels.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {video.detectedLabels.map((label, idx) => (
                    <span 
                      key={idx} 
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        label.includes('BLOOD') || label.includes('WEAPON') || label.includes('VIOLENCE')
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {label.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
              
              {video.analysisConfidence && video.status === "completed" && (
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {video.sensitivityStatus === 'safe' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                      AI Confidence
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold ${
                    video.analysisConfidence > 80 ? "text-green-600" : 
                    video.analysisConfidence > 50 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {video.analysisConfidence}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
});

VideoList.displayName = 'VideoList';

export default VideoList;
