import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uploadVideo, resetUploadState } from "../store/slices/videoSlice";
import { initSocket, disconnectSocket } from "../services/socket";
import { Upload, CheckCircle, AlertCircle, Loader, XCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";

// Helper function to format error messages
const getErrorMessage = (error) => {
  if (!error) return null;
  
  const errorStr = typeof error === 'string' ? error : error.message || JSON.stringify(error);
  
  // Disk space error
  if (errorStr.includes('ENOSPC') || errorStr.includes('no space left')) {
    return {
      title: 'Storage Full',
      message: 'The server has run out of storage space. Please contact the administrator or try again later.',
      icon: 'disk'
    };
  }

  // Database timeout
  if (errorStr.includes('buffering timed out') || errorStr.includes('selection timeout')) {
    return {
      title: 'Database Unavailable',
      message: 'The database connection timed out. This usually happens when the MongoDB service is down. Please try again later or contact support.',
      icon: 'database'
    };
  }
  
  // File too large
  if (errorStr.includes('File too large') || errorStr.includes('LIMIT_FILE_SIZE')) {
    return {
      title: 'File Too Large',
      message: 'Your video file exceeds the maximum allowed size of 100MB. Please compress your video and try again.',
      icon: 'size'
    };
  }
  
  // Network error
  if (errorStr.includes('Network') || errorStr.includes('ECONNREFUSED') || errorStr.includes('fetch')) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection and try again.',
      icon: 'network'
    };
  }
  
  // Upload limit reached
  if (errorStr.includes('Upload limit') || errorStr.includes('limit reached')) {
    return {
      title: 'Upload Limit Reached',
      message: 'You have reached your upload limit of 10 videos. Please delete some videos to upload more.',
      icon: 'limit'
    };
  }
  
  // Generic error
  return {
    title: 'Upload Failed',
    message: errorStr.length > 100 ? 'An error occurred during upload. Please try again.' : errorStr,
    icon: 'error'
  };
};

const UploadForm = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private"); // Add visibility state
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { uploading, uploadProgress, uploadSuccess, error } = useSelector(
    (state) => state.videos
  );

  console.log(`UploadForm: ID=${currentVideoId}, Upload Progress=${uploadProgress}%`);

  useEffect(() => {
    // Redirect only after file is fully uploaded and saved to DB
    if (uploadSuccess) {
      // Show celebration
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      const timer = setTimeout(() => {
        dispatch(resetUploadState());
        if (onUploadSuccess) onUploadSuccess();
        navigate("/dashboard");
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [uploadSuccess, onUploadSuccess, dispatch, navigate]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("visibility", visibility); // Add visibility to form data

    const resultAction = await dispatch(uploadVideo(formData));
    if (uploadVideo.fulfilled.match(resultAction)) {
      // Corrected structure: payload.data.video._id
      // The API returns { status: 'success', data: { video: {...} } }
      setCurrentVideoId(resultAction.payload.data.video._id);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
        <Upload className="h-6 w-6 text-primary-600" />
        <span>Upload New Video</span>
      </h2>

      {!uploading && !uploadSuccess ? (
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-primary-500 transition-colors cursor-pointer bg-gray-50">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
              id="file-upload"
              required
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-900">
                {file ? file.name : "Click to select a video"}
              </p>
              <p className="mt-1 text-xs text-gray-500">MP4, MOV up to 100MB</p>
            </label>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Video Title"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="Description"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all h-24"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            
            {/* Visibility Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Video Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              >
                <option value="private">🔒 Private (Only Admin/Editor can view)</option>
                <option value="public">🌍 Public (Everyone can view)</option>
              </select>
              <p className="text-xs text-gray-500">
                {visibility === "private" 
                  ? "Only you and users with Admin/Editor roles can view this video" 
                  : "All users can view this video"}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 mb-1">
                    {getErrorMessage(error).title}
                  </h3>
                  <p className="text-sm text-red-700">
                    {getErrorMessage(error).message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dispatch(resetUploadState())}
                className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium underline"
              >
                Try Again
              </button>
            </div>
          )}

         <button
              onClick={handleUpload}
              disabled={!file}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-violet-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg active:scale-[0.98]"
            >
              Start Upload
            </button>
        </form>
      ) : (
        <div className="space-y-8 py-10 text-center">
          {/* Progress Bar */}
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-sm font-bold text-violet-700 uppercase">
                  {uploadSuccess ? "✅ Upload Complete!" : "⏫ Uploading..."}
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-violet-600">
                  {uploadProgress}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-4 mb-6 text-xs flex rounded-full bg-gray-200 shadow-inner">
              <div
                style={{ width: `${uploadProgress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500 ease-out"
              ></div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            {uploadSuccess ? (
              <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
            ) : (
              <Loader className="animate-spin h-8 w-8 text-primary-600 mb-2" />
            )}
            <p className="text-sm text-gray-600">
              {uploadSuccess
                ? "File uploaded successfully! Redirecting to library..."
                : "Please wait while we upload your video to our secure storage..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
