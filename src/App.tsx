import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { UserDashboard } from './components/User/UserDashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard';

function App() {
  const { user, profile, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  // 🔄 Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // 🔐 Not Logged In
  if (!user) {
    return showLogin ? (
      <Login onToggleForm={() => setShowLogin(false)} />
    ) : (
      <Register onToggleForm={() => setShowLogin(true)} />
    );
  }

  // ⚠️ Logged in but profile not ready
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Setting up your profile...</p>
      </div>
    );
  }

  // 🎯 Role-Based Routing
  return profile.role === 'admin'
    ? <AdminDashboard />
    : <UserDashboard />;
}

export default App;