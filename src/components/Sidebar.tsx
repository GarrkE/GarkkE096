import React from 'react';
import {
  LayoutDashboard,
  School as SchoolIcon,
  Users,
  GraduationCap,
  Layers,
  BookOpen,
  FileQuestion,
  FileSpreadsheet,
  Package,
  CalendarCheck,
  UserCheck,
  Activity,
  Award,
  FileText,
  DownloadCloud,
  ShieldCheck,
  Settings,
  History,
  LogOut,
  PlayCircle,
  FileCheck,
  PenTool,
  Eye
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  themeMode?: 'dark' | 'light';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  isOpen,
  onClose,
  onLogout,
  themeMode = 'dark'
}) => {
  const isDark = themeMode === 'dark';

  // Menu Admin Kecamatan (20 menus)
  const adminMenuItems = [
    { id: 'admin-dashboard', label: '1. Dashboard', icon: LayoutDashboard },
    { id: 'admin-sekolah', label: '2. Data Sekolah', icon: SchoolIcon },
    { id: 'admin-guru', label: '3. Data Guru', icon: Users },
    { id: 'admin-siswa', label: '4. Data Siswa', icon: GraduationCap },
    { id: 'admin-kelas', label: '5. Data Kelas', icon: Layers },
    { id: 'admin-mapel', label: '6. Mata Pelajaran', icon: BookOpen },
    { id: 'admin-bank-soal', label: '7. Bank Soal', icon: FileQuestion },
    { id: 'admin-impor-soal', label: '8. Impor Soal', icon: FileSpreadsheet },
    { id: 'admin-pembuat-soal', label: '9. Pembuat Soal', icon: PenTool },
    { id: 'admin-preview-soal', label: '10. Preview Soal CBT', icon: Eye },
    { id: 'admin-paket-ujian', label: '11. Paket Ujian', icon: Package },
    { id: 'admin-jadwal-ujian', label: '12. Jadwal Ujian', icon: CalendarCheck },
    { id: 'admin-peserta-ujian', label: '13. Peserta Ujian', icon: UserCheck },
    { id: 'admin-monitoring', label: '14. Monitoring Ujian', icon: Activity },
    { id: 'admin-hasil-ujian', label: '15. Hasil Ujian', icon: Award },
    { id: 'admin-laporan', label: '16. Laporan dan Cetak Nilai', icon: FileText },
    { id: 'admin-ekspor', label: '17. Ekspor Data', icon: DownloadCloud },
    { id: 'admin-manajemen-akun', label: '18. Manajemen Akun', icon: ShieldCheck },
    { id: 'admin-pengaturan', label: '19. Pengaturan Sistem', icon: Settings },
    { id: 'admin-riwayat', label: '20. Riwayat Aktivitas', icon: History },
    { id: 'admin-spreadsheet-sync', label: '21. Integrasi Google Sheets', icon: FileSpreadsheet }
  ];

  // Menu Guru (13 menus termasuk Import Naskah Ujian, Preview Soal & Integrasi Google Sheets)
  const guruMenuItems = [
    { id: 'guru-dashboard', label: '1. Dashboard', icon: LayoutDashboard },
    { id: 'guru-impor-naskah', label: '2. Import Naskah Ujian', icon: FileSpreadsheet },
    { id: 'guru-bank-soal', label: '3. Bank Soal', icon: FileQuestion },
    { id: 'guru-buat-soal', label: '4. Buat dan Edit Soal', icon: PenTool },
    { id: 'guru-preview-soal', label: '5. Preview Tampilan Soal', icon: Eye },
    { id: 'guru-paket-soal', label: '6. Paket Soal', icon: Package },
    { id: 'guru-jadwal-ujian', label: '7. Jadwal Ujian', icon: CalendarCheck },
    { id: 'guru-siswa', label: '8. Data Siswa', icon: GraduationCap },
    { id: 'guru-monitoring', label: '9. Monitoring Siswa', icon: Activity },
    { id: 'guru-hasil-ujian', label: '10. Hasil Ujian', icon: Award },
    { id: 'guru-laporan', label: '11. Laporan Nilai', icon: FileText },
    { id: 'guru-profil', label: '12. Profil', icon: UserCheck },
    { id: 'guru-spreadsheet-sync', label: '13. Integrasi Google Sheets', icon: FileSpreadsheet }
  ];

  // Menu Siswa (6 menus)
  const siswaMenuItems = [
    { id: 'siswa-dashboard', label: '1. Dashboard', icon: LayoutDashboard },
    { id: 'siswa-profil', label: '2. Profil Saya', icon: UserCheck },
    { id: 'siswa-jadwal', label: '3. Jadwal Ujian', icon: CalendarCheck },
    { id: 'siswa-ujian-tersedia', label: '4. Ujian Tersedia', icon: PlayCircle },
    { id: 'siswa-riwayat', label: '5. Riwayat Ujian', icon: FileCheck },
    { id: 'siswa-hasil-ujian', label: '6. Hasil Ujian (Jika Diizinkan)', icon: Award }
  ];

  let menuItems = adminMenuItems;
  if (userRole === 'guru') menuItems = guruMenuItems;
  if (userRole === 'siswa') menuItems = siswaMenuItems;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[61px] left-0 h-full lg:h-[calc(100vh-61px)] w-64 border-r z-50 lg:z-20 flex flex-col transition-all duration-200 font-geist ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } no-print shadow-xl ${
          isDark
            ? 'bg-[#161619] text-[#f2f2f2] border-white/10'
            : 'bg-white text-slate-700 border-slate-200'
        }`}
      >
        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className={`px-3 pb-2 text-[10px] font-mono uppercase tracking-wider ${
            isDark ? 'text-white/40' : 'text-slate-400'
          }`}>
            {userRole === 'admin'
              ? 'Menu Admin Kecamatan'
              : userRole === 'guru'
              ? 'Menu Guru Pengampu'
              : 'Menu Peserta Ujian'}
          </div>

          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#4f46e5] text-white font-bold shadow-[0_0_15px_rgba(79,70,229,0.35)]'
                    : isDark
                    ? 'text-white/60 hover:bg-white/5 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : isDark ? 'text-white/40' : 'text-slate-400'}`} />
                <span className="truncate text-left">{item.label}</span>
              </button>
            );
          })}

          {/* Quick Logout Button in Sidebar */}
          <div className={`pt-3 mt-2 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
              <span>Keluar (Logout)</span>
            </button>
          </div>
        </div>

        {/* Footer info in sidebar */}
        <div className={`p-3 border-t text-[11px] font-mono transition-colors ${
          isDark
            ? 'bg-[#0c0c0e] border-white/10 text-white/50'
            : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`font-semibold ${isDark ? 'text-white/70' : 'text-slate-700'}`}>
              Kec. Ampelgading
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_#10b981]"></span>
          </div>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
            Kab. Malang • Portal CBT
          </p>
        </div>
      </aside>
    </>
  );
};
