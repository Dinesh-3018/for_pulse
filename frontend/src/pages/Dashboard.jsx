import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchVideos } from "../store/slices/videoSlice";
import VideoList from "../components/VideoList";
import VideoPlayer from "../components/VideoPlayer";
import VideoFilters from "../components/VideoFilters";
import Navbar from "../components/Navbar";
import OnboardingModal from "../components/OnboardingModal";
import { Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import { initSocket, disconnectSocket, getSocket } from "../services/socket";

const Dashboard = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const { videos, pagination } = useSelector((state) => state.videos);

  // Initialize Socket for real-time updates on processing videos
  const socketInitialized = React.useRef(false);
  const userIdRef = React.useRef(null);
  
  useEffect(() => {
    const currentUserId = user?._id || user?.id;
    
    // Only initialize if user exists, token exists, and socket not already initialized for this user
    if (currentUserId && token && (!socketInitialized.current || userIdRef.current !== currentUserId)) {
      console.log("Dashboard: Initializing socket...");
      initSocket(currentUserId, dispatch);
      socketInitialized.current = true;
      userIdRef.current = currentUserId;
    }

    return () => {
      // Only disconnect when user logs out or component unmounts
      if (!user || !token) {
        console.log("Dashboard: Disconnecting socket...");
        disconnectSocket();
        socketInitialized.current = false;
        userIdRef.current = null;
      }
    };
  }, [user?._id, user?.id, token, dispatch]); // Only reconnect if user ID or token changes


  // Fetch videos on mount
  useEffect(() => {
    dispatch(fetchVideos({ page: 1, limit: 12 }));
  }, [dispatch]);

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5001/api/onboarding/status",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        // Show onboarding if not completed
        if (!response.data.onboardingCompleted) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      }
    };

    if (token) {
      checkOnboardingStatus();
    }
  }, [token]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to page 1 when filters change
    dispatch(fetchVideos({ ...newFilters, page: 1, limit: 12 }));
  };

  const handleResetFilters = () => {
    setFilters({});
    setCurrentPage(1);
    dispatch(fetchVideos({ page: 1, limit: 12 }));
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    dispatch(fetchVideos({ ...filters, page: newPage, limit: 12 }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Your Video Library
            </h1>
            <p className="text-gray-500 mt-1">
              Manage and watch your processed content.
            </p>
          </div>

          {user && (user.role === "Editor" || user.role === "Admin") && (
            <Link
              to="/upload"
              className="bg-gradient-to-r from-violet-600 to-indigo-600  text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-md active:scale-95 flex items-center space-x-2"
            >
              <Upload className="h-5 w-5" />
              <span>Upload New Video</span>
            </Link>
          )}
        </div>

        {/* Filters */}
        <VideoFilters
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Video List */}
        <VideoList onSelectVideo={setSelectedVideo} />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
            <div className="text-sm text-gray-700">
              Showing page <span className="font-medium">{pagination.currentPage}</span> of{" "}
              <span className="font-medium">{pagination.totalPages}</span>
              {" "}({pagination.totalVideos} total videos)
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center space-x-1 px-4 py-2 rounded-lg border transition-all ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>
              
              {/* Page numbers */}
              <div className="hidden sm:flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg transition-all ${
                        currentPage === pageNum
                          ? "bg-primary-600 text-white font-bold"
                          : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className={`flex items-center space-x-1 px-4 py-2 rounded-lg border transition-all ${
                  currentPage === pagination.totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                }`}
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Video Player Modal */}
        {selectedVideo && (
          <VideoPlayer
            video={selectedVideo}
            onClose={() => setSelectedVideo(null)}
          />
        )}

        {/* Onboarding Modal */}
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
        />
      </main>
    </div>
  );
};

export default Dashboard;
