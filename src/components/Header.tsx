import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Bell, 
  LogOut, 
  Clock, 
  Menu, 
  ShieldCheck, 
  GraduationCap, 
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  PenTool
} from 'lucide-react';
import { User, SystemSettings } from '../types';

interface HeaderProps {
  currentUser: User | null;
  settings: SystemSettings;
  themeMode?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
  onSwitchUser?: (user: User) => void;
  allUsers?: User[];
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  settings,
  themeMode = 'dark',
  onToggleTheme,
  onLogout,
  onToggleSidebar
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const isDark = themeMode === 'dark';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleBadge = (role?: string) => {
    if (currentUser?.isQuestionAuthor || currentUser?.username === 'pembuat_soal') {
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-extrabold ${
          isDark
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            : 'bg-amber-100 text-amber-900 border border-amber-300'
        }`}>
          <PenTool className="w-3 h-3 text-amber-500" />
          Pembuat Naskah Ujian
        </span>
      );
    }

    switch (role) {
      case 'admin':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold ${
            isDark
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
          }`}>
            <ShieldCheck className="w-3 h-3 text-indigo-500" />
            Admin Kecamatan
          </span>
        );
      case 'guru':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold ${
            isDark
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}>
            <GraduationCap className="w-3 h-3 text-emerald-500" />
            Guru Pengampu
          </span>
        );
      case 'siswa':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-semibold ${
            isDark
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            <UserIcon className="w-3 h-3 text-amber-500" />
            Peserta Ujian
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className={`sticky top-0 z-30 border-b transition-colors duration-200 no-print ${
      isDark
        ? 'bg-[#161619] border-white/10 text-[#f2f2f2] shadow-lg'
        : 'bg-white border-slate-200 text-slate-900 shadow-xs'
    }`}>
      <div className="flex items-center justify-between px-4 lg:px-6 py-2.5">
        
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className={`p-2 rounded-lg lg:hidden focus:outline-hidden cursor-pointer transition ${
              isDark
                ? 'text-white/70 hover:text-white hover:bg-white/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Buka Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#4f46e5] flex items-center justify-center text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] border border-indigo-400/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`font-syne text-xs sm:text-sm font-bold tracking-tight leading-snug ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  <span className="inline sm:hidden font-extrabold tracking-normal">CBT SD • {settings.districtName}</span>
                  <span className="hidden sm:inline">{settings.appTitle || 'SISTEM UJIAN SEMESTER TINGKAT KECAMATAN'}</span>
                </h1>
                <span className={`hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                  isDark
                    ? 'bg-white/5 text-indigo-300 border-white/10'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  {settings.districtName}
                </span>
              </div>
              <p className={`text-[10px] sm:text-[11px] font-mono truncate max-w-[200px] sm:max-w-none ${
                isDark ? 'text-white/50' : 'text-slate-500'
              }`}>
                <span className="sm:hidden">TP {settings.academicYear} • Sem {settings.activeSemester}</span>
                <span className="hidden sm:inline">TP {settings.academicYear} • Semester {settings.activeSemester} • Kab. Malang</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Theme Toggle, Clock, Notification, User profile */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          
          {/* Mode Siang & Mode Malam Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-[#0c0c0e] border-white/10 text-amber-300 hover:border-amber-400/40 hover:bg-white/5'
                  : 'bg-slate-100 border-slate-200 text-indigo-700 hover:border-indigo-300 hover:bg-slate-200/80'
              }`}
              title={isDark ? 'Ganti ke Mode Siang' : 'Ganti ke Mode Malam'}
              aria-label="Toggle Mode Siang Malam"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="hidden md:inline font-semibold">Mode Siang</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="hidden md:inline font-semibold">Mode Malam</span>
                </>
              )}
            </button>
          )}

          {/* Live Clock */}
          <div className={`hidden xl:flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border ${
            isDark
              ? 'text-white/60 bg-[#0c0c0e] border-white/10'
              : 'text-slate-600 bg-slate-50 border-slate-200'
          }`}>
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>{currentTime}</span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-lg relative transition cursor-pointer ${
                isDark
                  ? 'text-white/70 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Notifikasi Sistem"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-indigo-500/20"></span>
            </button>

            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl border p-3 z-50 text-xs ${
                isDark
                  ? 'bg-[#161619] border-white/10 text-white'
                  : 'bg-white border-slate-200 text-slate-900 shadow-xl'
              }`}>
                <div className={`flex items-center justify-between pb-2 border-b ${
                  isDark ? 'border-white/10' : 'border-slate-100'
                }`}>
                  <h4 className="font-syne text-xs font-bold">Pemberitahuan Sistem</h4>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    isDark
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>Terbaru</span>
                </div>
                <div className="py-2 space-y-2">
                  <div className={`flex items-start gap-2 p-2 rounded-lg border ${
                    isDark
                      ? 'bg-[#0c0c0e] border-white/5 text-white/80'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Sistem CBT Aktif</p>
                      <p className={`text-[11px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                        Jadwal dan bank soal semester aktif siap diakses oleh sekolah.
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-start gap-2 p-2 rounded-lg border ${
                    isDark
                      ? 'bg-[#0c0c0e] border-white/5 text-white/80'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Laporan Nilai Real-Time</p>
                      <p className={`text-[11px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                        Nilai terhitung otomatis dan dapat langsung diekspor XLSX atau dicetak A4.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User profile & Logout */}
          <div className={`relative flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}>
            <div className="text-right hidden sm:block">
              <p className={`text-xs font-bold leading-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {currentUser?.fullName || 'Pengguna'}
              </p>
              <div className="mt-0.5">
                {getRoleBadge(currentUser?.role)}
              </div>
            </div>

            {/* Avatar button */}
            <button
              type="button"
              onClick={() => setShowUserModal(!showUserModal)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase font-mono border transition cursor-pointer select-none ${
                isDark
                  ? 'bg-indigo-600/30 border-indigo-400/40 text-indigo-200 hover:border-indigo-400'
                  : 'bg-indigo-100 border-indigo-200 text-indigo-700 hover:border-indigo-300'
              }`}
              title="Informasi Akun"
              aria-label="Profil Pengguna"
            >
              {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'A'}
            </button>

            {/* Desktop Direct Logout */}
            <button
              onClick={onLogout}
              className="hidden sm:flex p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
              title="Keluar / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile User Dropdown Modal */}
            {showUserModal && (
              <div
                className={`absolute right-0 top-11 w-64 rounded-2xl shadow-2xl border p-3.5 z-50 text-xs sm:hidden ${
                  isDark
                    ? 'bg-[#1a1a1f] border-white/10 text-white shadow-black/60'
                    : 'bg-white border-slate-200 text-slate-800 shadow-xl'
                }`}
              >
                <div className="pb-2.5 border-b border-slate-200 dark:border-white/10 space-y-1">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {currentUser?.fullName || 'Pengguna'}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-white/50">
                    @{currentUser?.username || 'user'}
                  </p>
                  <div className="pt-1">
                    {getRoleBadge(currentUser?.role)}
                  </div>
                </div>

                <div className="py-2.5 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-600 dark:text-white/60">
                    <span>Wilayah:</span>
                    <span className="font-semibold text-slate-800 dark:text-white/90">
                      Kec. {settings.districtName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-white/60">
                    <span>Semester:</span>
                    <span className="font-semibold text-slate-800 dark:text-white/90">
                      {settings.activeSemester} ({settings.academicYear})
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserModal(false);
                      onLogout();
                    }}
                    className="w-full py-2 px-3 bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar dari Akun</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
