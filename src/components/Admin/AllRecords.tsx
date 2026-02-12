import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Trash2, Edit2, Plus, Download } from 'lucide-react';
import { RecordForm } from '../User/RecordForm';
import { exportRecordsToExcel } from '../../lib/excelUtils';

interface Record {
  id: string;
  user_id: string;
  record_number: number;
  category: string;
  created_at: string;
  custom_field_values?: Record<string, string>;
  profiles: {
    username: string;
  };
}

interface CustomField {
  id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'date';
  position: number;
}

export function AllRecords() {
  const [records, setRecords] = useState<Record[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);

  useEffect(() => {
    loadCustomFields();
    loadRecords();
  }, []);

  const loadCustomFields = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setCustomFields(data || []);
    } catch (error) {
      console.error('Error loading custom fields:', error);
    }
  };

  const loadRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('records')
        .select(`
          *,
          profiles(username),
          custom_field_values (
            field_id,
            value
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const recordsWithValues = (data || []).map((record: any) => ({
        ...record,
        custom_field_values: record.custom_field_values.reduce((acc: Record<string, string>, item: any) => {
          acc[item.field_id] = item.value || '';
          return acc;
        }, {}),
      }));

      setRecords(recordsWithValues);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: Record) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingRecord(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const { error } = await supabase.from('records').delete().eq('id', id);

      if (error) throw error;
      await loadRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRecord(null);
    loadRecords();
  };

  const handleExportAll = async () => {
    try {
      const exportData = records.map(record => ({
        'User': record.profiles.username,
        'Record #': record.record_number,
        ...Object.fromEntries(
          customFields.map(field => [field.field_name, record.custom_field_values?.[field.id] || ''])
        ),
      }));

      const timestamp = new Date().toISOString().split('T')[0];
      await exportRecordsToExcel(exportData, `all_records_${timestamp}.xlsx`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const caseOBRecords = records.filter(r => r.category === 'CASE OB');
  const phqRecords = records.filter(r => r.category === 'PHQ');

  const getUserStats = (category: string) => {
    const categoryRecords = records.filter(r => r.category === category);
    const stats: { [userId: string]: { username: string; count: number } } = {};

    categoryRecords.forEach(record => {
      if (!stats[record.user_id]) {
        stats[record.user_id] = { username: record.profiles.username, count: 0 };
      }
      stats[record.user_id].count += 1;
    });

    return Object.values(stats).sort((a, b) => b.count - a.count);
  };

  return (
    <>
      {showForm && (
        <RecordForm
          record={editingRecord}
          onClose={handleFormClose}
          isAdmin={true}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">All Office Records</h2>
              <p className="text-sm text-slate-600">Total: {records.length} records</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportAll}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={20} />
                Export All
              </button>
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Add Record
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-sm font-medium text-slate-600">Total CASE OB</p>
              <p className="text-2xl font-bold text-blue-600">{caseOBRecords.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <p className="text-sm font-medium text-slate-600">Total PHQ</p>
              <p className="text-2xl font-bold text-green-600">{phqRecords.length}</p>
            </div>
          </div>
        </div>

      {records.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-slate-500">No records found.</p>
        </div>
      ) : (
        <div className="p-6 space-y-8">
          {['CASE OB', 'PHQ'].map((categoryName) => {
            const categoryRecords = records.filter(r => r.category === categoryName);
            if (categoryRecords.length === 0) return null;

            const userStats = getUserStats(categoryName);

            return (
              <div key={categoryName}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 pb-2">
                      {categoryName}
                    </h3>
                  </div>
                  <div className="bg-slate-100 px-4 py-2 rounded-lg">
                    <p className="text-sm font-medium text-slate-600">Total {categoryName}: <span className="text-lg font-bold text-slate-800">{categoryRecords.length}</span></p>
                  </div>
                </div>

                {userStats.length > 0 && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-3">Per User Breakdown:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {userStats.map((stat) => (
                        <div key={stat.username} className="flex justify-between items-center p-2 bg-white rounded border border-slate-200">
                          <span className="text-sm font-medium text-slate-700">{stat.username}</span>
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">{stat.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-4">
                  <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Record #
                        </th>
                        {customFields.map((field) => (
                          <th key={field.id} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            {field.field_name}
                          </th>
                        ))}
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {categoryRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {record.profiles.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                            {record.record_number}
                          </td>
                          {customFields.map((field) => (
                            <td key={field.id} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                              {record.custom_field_values?.[field.id] || '-'}
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </>
  );
}
