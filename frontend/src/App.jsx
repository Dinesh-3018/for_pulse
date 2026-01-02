import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getMe } from './store/slices/authSlice';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import SuperAdminPanel from './pages/SuperAdminPanel';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, token } = useSelector((state) => state.auth);

  if (isLoading && token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return isAuthenticated || token ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, token, user } = useSelector((state) => state.auth);

  if (isLoading && token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Redirect authenticated users based on role
  if (isAuthenticated || token) {
    return user?.role === "SuperAdmin" ? <Navigate to="/superadmin" /> : <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
    const dispatch = useDispatch();
    const { token } = useSelector((state) => state.auth);

    useEffect(() => {
        if (token) {
            dispatch(getMe());
        }
    }, [dispatch, token]);

    return (
        <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/upload" 
                    element={
                        <ProtectedRoute>
                            <UploadPage />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/superadmin" 
                    element={
                        <ProtectedRoute>
                            <SuperAdminPanel />
                        </ProtectedRoute>
                    } 
                />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;
