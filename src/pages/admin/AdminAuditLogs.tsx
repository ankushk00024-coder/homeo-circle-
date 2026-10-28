import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/supabase';
import { AuditLog } from '../../types';
import { History, Shield, Clock, FileText, CheckCircle2 } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataService.getAuditLogs().then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-brand-navy">
          Administrative Audit Trail
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable log of practitioner verification determinations, status mutations, and moderation actions.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Officer / Actor</th>
                <th className="py-3 px-4">Administrative Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Audit Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-brand-navy block">{log.actor_name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">ID: {log.actor_id}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded font-mono text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="font-semibold block capitalize">{log.target_type}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{log.target_id}</span>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <pre className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 font-mono overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(log.metadata, null, 1)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
