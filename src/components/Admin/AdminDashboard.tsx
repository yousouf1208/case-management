import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { UserRecords } from './UserRecords';
import { AllRecords } from './AllRecords';
import { FieldManagement } from './FieldManagement';
import { AdminManagement } from './AdminManagement';
import { DeleteRequests } from './DeleteRequests';
import { LogOut, Users, Database, Settings, Shield } from 'lucide-react';

type View =
  | 'users'
  | 'all-records'
  | 'fields'
  | 'admin-management'
  | 'delete-requests';

export function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<View>('users');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user')
        .order('username', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user: any) => {
    setSelectedUser(user);
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-600">
              Welcome, {profile?.username}
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2"
          >
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Navigation Buttons */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <button
            onClick={() => { setCurrentView('users'); setSelectedUser(null); }}
            className={currentView === 'users' ? 'bg-blue-600 text-white px-4 py-2 rounded' : 'bg-white px-4 py-2 rounded border'}
          >
            <Users size={20} /> Users
          </button>

          <button
            onClick={() => { setCurrentView('all-records'); setSelectedUser(null); }}
            className={currentView === 'all-records' ? 'bg-blue-600 text-white px-4 py-2 rounded' : 'bg-white px-4 py-2 rounded border'}
          >
            <Database size={20} /> All Records
          </button>

          <button
            onClick={() => { setCurrentView('fields'); setSelectedUser(null); }}
            className={currentView === 'fields' ? 'bg-blue-600 text-white px-4 py-2 rounded' : 'bg-white px-4 py-2 rounded border'}
          >
            <Settings size={20} /> Manage Fields
          </button>

          <button
            onClick={() => { setCurrentView('admin-management'); setSelectedUser(null); }}
            className={currentView === 'admin-management' ? 'bg-blue-600 text-white px-4 py-2 rounded' : 'bg-white px-4 py-2 rounded border'}
          >
            <Shield size={20} /> Admin Management
          </button>

          <button
            onClick={() => { setCurrentView('delete-requests'); setSelectedUser(null); }}
            className={currentView === 'delete-requests' ? 'bg-blue-600 text-white px-4 py-2 rounded' : 'bg-white px-4 py-2 rounded border'}
          >
            🗑 Delete Requests
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            {currentView === 'users' && !selectedUser && (
              <div className="bg-white rounded shadow">
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className="block w-full text-left px-6 py-4 border-b hover:bg-slate-50"
                  >
                    {user.username}
                  </button>
                ))}
              </div>
            )}

            {currentView === 'users' && selectedUser && (
              <UserRecords user={selectedUser} onBack={handleBackToUsers} />
            )}

            {currentView === 'all-records' && <AllRecords />}
            {currentView === 'fields' && <FieldManagement />}
            {currentView === 'admin-management' && <AdminManagement />}
            {currentView === 'delete-requests' && <DeleteRequests />}
          </>
        )}
      </div>
    </div>
  );
}