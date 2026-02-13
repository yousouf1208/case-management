import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';

interface CustomField {
  id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'date';
}

interface RecordFormProps {
  record: {
    id: string;
    user_id?: string;
    category?: string;
  } | null;
  onClose: () => void;
  isAdmin?: boolean;
  userId?: string;
}

export function RecordForm({ record, onClose, isAdmin = false, userId }: RecordFormProps) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(record?.user_id || effectiveUserId || '');
  const [category, setCategory] = useState(record?.category || 'CASE OB');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    loadCustomFields();
    if (isAdmin) loadUsers();
  }, []);

  useEffect(() => {
    if (record) {
      setSelectedUserId(record.user_id || '');
      setCategory(record.category || 'CASE OB');
    }
  }, [record]);

  useEffect(() => {
    if (customFields.length > 0) {
      initializeValues();
    }
  }, [customFields, record]);

  const loadCustomFields = async () => {
    const { data, error } = await supabase
      .from('custom_fields')
      .select('*')
      .order('position', { ascending: true });

    if (!error) setCustomFields(data || []);
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('role', 'user')
      .order('username', { ascending: true });

    setUsers(data || []);
  };

  const initializeValues = async () => {
    const initial: Record<string, string> = {};
    customFields.forEach(field => {
      initial[field.id] = '';
    });

    if (record) {
      const { data } = await supabase
        .from('custom_field_values')
        .select('field_id, value')
        .eq('record_id', record.id);

      data?.forEach(item => {
        initial[item.field_id] = item.value || '';
      });
    }

    setCustomValues(initial);
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let recordId = record?.id;

      /* -------- UPDATE -------- */
      if (record) {
        const updateData: any = { category };

        if (isAdmin && selectedUserId !== record.user_id) {
          updateData.user_id = selectedUserId;

          const { data: lastRecord } = await supabase
            .from('records')
            .select('record_number')
            .eq('user_id', selectedUserId)
            .order('record_number', { ascending: false })
            .limit(1)
            .single();

          updateData.record_number = lastRecord
            ? lastRecord.record_number + 1
            : 1;
        }

        const { error } = await supabase
          .from('records')
          .update(updateData)
          .eq('id', record.id);

        if (error) throw error;
      }

      /* -------- CREATE -------- */
      else {
        const { data, error } = await supabase
          .from('records')
          .insert({
            user_id: selectedUserId || effectiveUserId!,
            category
          })
          .select()
          .single();

        if (error) throw error;

        recordId = data.id;
      }

      /* -------- UPSERT CUSTOM VALUES -------- */

      if (recordId) {
        const payload = Object.entries(customValues).map(
          ([fieldId, value]) => ({
            record_id: recordId,
            field_id: fieldId,
            value: value || null,
          })
        );

        if (payload.length > 0) {
          const { error } = await supabase
            .from('custom_field_values')
            .upsert(payload, {
              onConflict: 'record_id,field_id',
            });

          if (error) throw error;
        }
      }

      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-800">
            {record ? 'Edit Record' : 'Add New Record'}
          </h3>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Record Type
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="CASE OB">CASE OB</option>
              <option value="PHQ">PHQ</option>
            </select>
          </div>

          {/* Assign User */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Assign to User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Fields */}
          {customFields.map(field => (
            <div key={field.id}>
              <label className="block text-sm font-medium mb-1">
                {field.field_name}
              </label>
              <input
                type={field.field_type}
                value={customValues[field.id] || ''}
                onChange={(e) =>
                  setCustomValues(prev => ({
                    ...prev,
                    [field.id]: e.target.value
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg"
          >
            {loading ? 'Saving...' : 'Save Record'}
          </button>

        </form>
      </div>
    </div>
  );
}
