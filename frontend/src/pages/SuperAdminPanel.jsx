import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { superAdminService } from "../services/api";
import { logout } from "../store/slices/authSlice";
import { Trash2, Users, Video as VideoIcon, BarChart, LogOut } from "lucide-react";

const SuperAdminPanel = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Redirect if not SuperAdmin
  if (!user || user.role !== "SuperAdmin") {
    return <Navigate to="/dashboard" />;
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, usersRes, videosRes] = await Promise.all([
        superAdminService.getDashboard(),
        superAdminService.getAllUsers(),
        superAdminService.getAllVideos()
      ]);
      setDashboardStats(dashboardRes.data);
      setUsers(usersRes.data.users);
      setVideos(videosRes.data.videos);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!confirm(`Delete user "${email}" and all their videos?`)) return;
    
    try {
      await superAdminService.deleteUser(userId);
      alert("User deleted successfully");
      fetchData();
    } catch (error) {
      alert("Failed to delete user: " + error.message);
    }
  };

  const handleDeleteVideo = async (videoId, title) => {
    if (!confirm(`Delete video "${title}"?`)) return;
    
    try {
      await superAdminService.deleteVideo(videoId);
      alert("Video deleted successfully");
      fetchData();
    } catch (error) {
      alert("Failed to delete video: " + error.message);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Logout */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SuperAdmin Panel</h1>
            <p className="text-sm text-gray-600 mt-1">Logged in as: {user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b">
          {["dashboard", "users", "videos"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && dashboardStats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold">{dashboardStats.totalUsers}</p>
                  </div>
                  <Users className="h-12 w-12 text-blue-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Videos</p>
                    <p className="text-3xl font-bold">{dashboardStats.totalVideos}</p>
                  </div>
                  <VideoIcon className="h-12 w-12 text-purple-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Google Quota</p>
                    <p className="text-3xl font-bold">
                      {dashboardStats.quotaStatus.google.current}/5
                    </p>
                  </div>
                  <BarChart className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Available Slots</p>
                    <p className="text-3xl font-bold">
                      {dashboardStats.quotaStatus.google.available}
                    </p>
                  </div>
                  <BarChart className="h-12 w-12 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Quota Status */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Analyzer Quota Status</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Google Video Intelligence:</span>
                  <span className={dashboardStats.quotaStatus.google.isFull ? "text-red-600" : "text-green-600"}>
                    {dashboardStats.quotaStatus.google.current}/5 users
                    {dashboardStats.quotaStatus.google.isFull && " (FULL)"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">TensorFlow.js:</span>
                  <span className="text-green-600">Unlimited</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Analyzer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Videos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Upload Limit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        u.role === "SuperAdmin" ? "bg-red-100 text-red-800" :
                        u.role === "Admin" ? "bg-purple-100 text-purple-800" :
                        u.role === "Editor" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{u.analyzerPreference || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{u.videoCount || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{u.uploadCount}/{u.uploadLimit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {u.role !== "SuperAdmin" ? (
                        <button
                          onClick={() => handleDeleteUser(u._id, u.email)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      ) : (
                        <span className="text-gray-400">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === "videos" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visibility</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sensitivity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {videos.map((v) => (
                  <tr key={v._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{v.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{v.userId?.email || "Unknown"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        v.status === "completed" ? "bg-green-100 text-green-800" :
                        v.status === "processing" ? "bg-blue-100 text-blue-800" :
                        v.status === "failed" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {v.visibility === "public" ? "🌍 Public" : "🔒 Private"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        v.sensitivityStatus === "safe" ? "bg-green-100 text-green-800" :
                        v.sensitivityStatus === "flagged" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {v.sensitivityStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteVideo(v._id, v.title)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPanel;
