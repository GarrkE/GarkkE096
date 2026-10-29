import React from 'react';
import { History, ShieldCheck, GraduationCap, User as UserIcon, Clock } from 'lucide-react';
import { ActivityLog } from '../../types';

interface RiwayatAktivitasProps {
  logs: ActivityLog[];
}

export const RiwayatAktivitas: React.FC<RiwayatAktivitasProps> = ({ logs }) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      case 'guru':
        return <GraduationCap className="w-4 h-4 text-emerald-600" />;
      case 'siswa':
        return <UserIcon className="w-4 h-4 text-amber-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600" />
          Riwayat Aktivitas & Audit Trail Sistem
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Catatan kronologis aktivitas login, manajemen naskah, monitoring, dan pengerjaan ujian
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="space-y-4">
          {logs.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">Belum ada catatan aktivitas.</p>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/70 transition text-xs"
              >
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                  {getRoleIcon(log.role)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="font-mono text-[11px] text-slate-400">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{log.details}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Dilakukan oleh: <strong className="text-slate-700">{log.userName}</strong> ({log.role.toUpperCase()})
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
