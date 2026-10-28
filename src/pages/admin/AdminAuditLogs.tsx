import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { AuditLog } from '../../types';
import { 
  History, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Eye, 
  X,
  Code
} from 'lucide-react';

const ITEMS_PER_PAGE = 15;

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await dataService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (targetTypeFilter !== 'all' && log.target_type !== targetTypeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchAction = (log.action || '').toLowerCase().includes(q);
      const matchActor = (log.actor_name || '').toLowerCase().includes(q);
      const matchTarget = (log.target_id || '').toLowerCase().includes(q);
      const matchMeta = JSON.stringify(log.metadata || {}).toLowerCase().includes(q);
      if (!matchAction && !matchActor && !matchTarget && !matchMeta) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-brand-navy">
              Administrative Audit Logs
            </h1>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Immutable Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time compliance record of practitioner approvals, moderation events, security role modifications, and system dispatches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
          <span className="text-xs text-slate-500">
            Total Records: <strong className="text-brand-navy">{filteredLogs.length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by action name, actor, target ID, or metadata values..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 outline-none"
          />
        </div>

        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs overflow-x-auto">
          {[
            { id: 'all', label: 'All Targets' },
            { id: 'practitioner_application', label: 'Applications' },
            { id: 'member', label: 'Members' },
            { id: 'post', label: 'Posts' },
            { id: 'report', label: 'Reports' },
            { id: 'app_notifications', label: 'Notifications' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setTargetTypeFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                targetTypeFilter === tab.id
                  ? 'bg-white text-brand-navy shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading audit records...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No audit records found</p>
            <p className="text-xs text-slate-500">Historical records appear as actions occur.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Officer / Actor</th>
                  <th className="py-3 px-4">Action Recorded</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Metadata Payload</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-brand-navy block">{log.actor_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {log.actor_id.slice(0, 10)}...</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded font-mono text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold block capitalize text-slate-700">{log.target_type.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.target_id}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-[11px] text-slate-500 font-mono">
                      {JSON.stringify(log.metadata)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>JSON</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredLogs.length > ITEMS_PER_PAGE && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length} logs
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-brand-navy">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log JSON Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-teal-700" />
                <h3 className="text-base font-bold text-brand-navy">Audit Record Inspection</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Action</span>
                  <span className="font-mono font-bold text-teal-900">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Actor</span>
                  <span className="font-medium text-slate-800">{selectedLog.actor_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Target Type</span>
                  <span className="font-medium text-slate-800 capitalize">{selectedLog.target_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase">Recorded At</span>
                  <span className="font-mono text-slate-600">{new Date(selectedLog.created_at).toISOString()}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Raw Metadata JSON</span>
                <pre className="p-3 bg-slate-900 text-teal-300 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-72">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
