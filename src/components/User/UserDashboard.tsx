import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { RecordForm } from './RecordForm';
import { RecordsList } from './RecordsList';
import { importRecordsFromExcel } from '../../lib/excelUtils';
import { LogOut, Plus, Upload } from 'lucide-react';

export function UserDashboard() {
  const { profile, signOut } = useAuth();
  const isAdmin = profile?.is_admin === true;

  const [records, setRecords] = useState<any[]>([]);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  /* ---------------- LOAD RECORDS ---------------- */
  useEffect(() => {
    if (profile?.id) loadRecords();
  }, [profile?.id]);

  const loadRecords = async () => {
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('user_id', profile?.id)
      .order('created_at', { ascending: false });

    if (!error) setRecords(data || []);
  };

  /* ---------------- EDIT RECORD ---------------- */
  const handleEditRecord = (record: any) => {
    setEditingRecord(record);
    setShowRecordForm(true);
  };

  /* ---------------- DELETE RECORD (SEND REQUEST) ---------------- */
  const handleDeleteRecord = async (record: any) => {
    if (!profile?.id) return;

    const { error } = await supabase
      .from('delete_requests')
      .insert([
        {
          record_id: record.id,
          requested_by: profile.id,
        },
      ]);

    if (error) {
      alert('Failed to send delete request.');
      console.error(error);
    } else {
      alert('Delete request sent to admin for approval.');
    }
  };

  /* ---------------- SAVE RECORD ---------------- */
  const handleSaveRecord = async (record: any) => {
    if (record.id) {
      await supabase
        .from('records')
        .update({
          category: record.category,
          custom_field_values: record.custom_field_values,
          user_id: isAdmin ? record.user_id : profile?.id,
        })
        .eq('id', record.id);
    } else {
      await supabase
        .from('records')
        .insert([
          {
            category: record.category,
            custom_field_values: record.custom_field_values,
            user_id: isAdmin ? record.user_id : profile?.id,
          },
        ]);
    }

    setShowRecordForm(false);
    setEditingRecord(null);
    loadRecords();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p>Welcome, {profile?.username}</p>
          </div>
          <button onClick={signOut} className="flex gap-2 items-center">
            <LogOut size={18}/> Sign Out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-semibold">My Records</h2>
          <div className="flex gap-2">
            <button
              onClick={() => { setEditingRecord(null); setShowRecordForm(true); }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded"
            >
              <Plus size={18}/> Add Record
            </button>

            <button
              onClick={() => importRecordsFromExcel(profile?.id)}
              className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded"
            >
              <Upload size={18}/> Import
            </button>
          </div>
        </div>

        {showRecordForm && (
          <RecordForm
            record={editingRecord}
            isAdmin={isAdmin}
            userId={profile?.id}
            onClose={() => {
              setShowRecordForm(false);
              setEditingRecord(null);
              loadRecords();
            }}
          />
        )}

        <RecordsList
          records={records}
          onEdit={handleEditRecord}
          onDelete={handleDeleteRecord}
        />
      </main>
    </div>
  );
}