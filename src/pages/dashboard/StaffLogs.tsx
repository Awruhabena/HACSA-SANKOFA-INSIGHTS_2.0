import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { StaffLog } from '../../lib/types';
import { Card, Spinner } from '../../components/ui';
import { formatAuditAction } from '../../lib/constants';
import { ScrollText, ShieldCheck, Clock, User } from 'lucide-react';

function humanizeRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function StaffLogs() {
  const [logs, setLogs] = useState<StaffLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await api.getStaffLogs();
        setLogs(data);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-navy/15 text-navy border border-navy/30">
            <ScrollText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-navy tracking-tight">
              Audit & Activity Logs
            </h1>
            <p className="text-xs text-gray mt-0.5">
              Read-only immutable record of all administrative and event actions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream border border-border text-xs text-gray font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-teal" />
          <span>Tamper-evident audit trail</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 text-teal" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="text-center py-16">
          <ScrollText className="w-12 h-12 text-gray/40 mx-auto mb-3" />
          <h2 className="font-heading text-lg font-bold text-navy">No Audit Logs Recorded</h2>
          <p className="text-xs text-gray max-w-sm mx-auto mt-1">
            System and staff activities will appear here chronologically.
          </p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden divide-y divide-border/60 shadow-xs">
          <div className="px-6 py-3.5 bg-cream/50 flex items-center justify-between text-xs font-bold text-gray uppercase tracking-wider font-heading">
            <span>Action & Actor</span>
            <span>Timestamp</span>
          </div>

          <div className="divide-y divide-border/60">
            {logs.map((log) => {
              const formattedAction = formatAuditAction(log.action, log.target_label || log.target_name);

              return (
                <div
                  key={log.id}
                  className="p-4 sm:px-6 flex items-start justify-between gap-4 hover:bg-cream/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-border flex items-center justify-center text-navy shrink-0 shadow-2xs mt-0.5">
                      <User className="w-4 h-4 text-teal" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-ink leading-relaxed">
                        <strong className="font-heading font-bold text-navy">
                          {log.actor_name}
                        </strong>{' '}
                        <span>{formattedAction}</span>
                      </p>
                      <p className="text-[11px] text-gray mt-0.5 font-mono">
                        Event ref: {log.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray shrink-0 font-medium pt-0.5">
                    <Clock className="w-3.5 h-3.5 text-gray/60" />
                    <span title={new Date(log.created_at).toLocaleString('en-GB')}>
                      {humanizeRelativeTime(log.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
