import React from 'react';
import {
  LayoutDashboard,
  FileQuestion,
  Eye,
  Activity,
  Menu,
  PenTool,
  GraduationCap,
  PlayCircle,
  CalendarCheck,
  Award,
  UserCheck
} from 'lucide-react';
import { UserRole } from '../types';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole: UserRole;
  onOpenFullMenu: () => void;
  themeMode?: 'dark' | 'light';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  onOpenFullMenu,
  themeMode = 'dark'
}) => {
  const isDark = themeMode === 'dark';

  // Role-specific bottom navigation tabs
  const getNavItems = () => {
    if (userRole === 'admin') {
      return [
        {
          id: 'admin-dashboard',
          label: 'Beranda',
          icon: LayoutDashboard,
          isAction: false
        },
        {
          id: 'admin-bank-soal',
          label: 'Bank Soal',
          icon: FileQuestion,
          isAction: false
        },
        {
          id: 'admin-preview-soal',
          label: 'Preview CBT',
          icon: Eye,
          isAction: false
        },
        {
          id: 'admin-monitoring',
          label: 'Pantau Live',
          icon: Activity,
          isAction: false
        },
        {
          id: '__menu__',
          label: 'Semua Menu',
          icon: Menu,
          isAction: true,
          badge: '20'
        }
      ];
    }

    if (userRole === 'guru') {
      return [
        {
          id: 'guru-dashboard',
          label: 'Beranda',
          icon: LayoutDashboard,
          isAction: false
        },
        {
          id: 'guru-buat-soal',
          label: 'Tulis Soal',
          icon: PenTool,
          isAction: false
        },
        {
          id: 'guru-preview-soal',
          label: 'Preview CBT',
          icon: Eye,
          isAction: false
        },
        {
          id: 'guru-siswa',
          label: 'Siswa & Nilai',
          icon: GraduationCap,
          isAction: false
        },
        {
          id: '__menu__',
          label: 'Semua Menu',
          icon: Menu,
          isAction: true,
          badge: '12'
        }
      ];
    }

    // Siswa
    return [
      {
        id: 'siswa-dashboard',
        label: 'Beranda',
        icon: LayoutDashboard,
        isAction: false
      },
      {
        id: 'siswa-ujian-tersedia',
        label: 'Mulai Ujian',
        icon: PlayCircle,
        isAction: false
      },
      {
        id: 'siswa-jadwal',
        label: 'Jadwal',
        icon: CalendarCheck,
        isAction: false
      },
      {
        id: 'siswa-hasil-ujian',
        label: 'Nilai Saya',
        icon: Award,
        isAction: false
      },
      {
        id: 'siswa-profil',
        label: 'Profil',
        icon: UserCheck,
        isAction: false
      }
    ];
  };

  const navItems = getNavItems();

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t transition-colors duration-200 no-print safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.15)] ${
        isDark
          ? 'bg-[#161619]/95 border-white/10 text-white backdrop-blur-md'
          : 'bg-white/95 border-slate-200 text-slate-800 backdrop-blur-md'
      }`}
    >
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-stretch px-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = !item.isAction && currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.isAction) {
                  onOpenFullMenu();
                } else {
                  onSelectTab(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 relative py-1 px-0.5 transition-all cursor-pointer select-none active:scale-95 ${
                isActive
                  ? isDark
                    ? 'text-indigo-400 font-bold'
                    : 'text-indigo-600 font-bold'
                  : isDark
                  ? 'text-white/60 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {/* Active Pill Indicator on top */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]" />
              )}

              <div className="relative">
                <div
                  className={`p-1 rounded-xl transition ${
                    isActive
                      ? isDark
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'bg-indigo-50 text-indigo-600'
                      : ''
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                </div>

                {/* Badge for Menu Drawer */}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] tracking-tight leading-none text-center truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
