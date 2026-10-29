import React, { useState } from 'react';
import {
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Eye,
  FileQuestion,
  Activity,
  Layers
} from 'lucide-react';
import { UserRole } from '../types';

interface MobilePageExplainerProps {
  currentTab: string;
  userRole?: UserRole;
  onNavigate?: (tab: string) => void;
  themeMode?: 'dark' | 'light';
  districtName?: string;
  totalQuestions?: number;
  totalStudents?: number;
  totalSchools?: number;
}

export const MobilePageExplainer: React.FC<MobilePageExplainerProps> = ({
  currentTab,
  userRole,
  onNavigate,
  themeMode = 'dark',
  districtName = 'Ampelgading',
  totalQuestions,
  totalStudents,
  totalSchools
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isDark = themeMode === 'dark';

  // Knowledge base of user-friendly descriptions for every menu
  const getPageInfo = (tab: string) => {
    switch (tab) {
      // Admin
      case 'admin-dashboard':
        return {
          title: 'Dashboard Kecamatan',
          desc: `Pusat statistik real-time capaian asesmen, rata-rata skor, KKM wilayah, dan sebaran partisipasi seluruh SD di Kec. ${districtName}.`,
          quickAction: {
            label: 'Cek Preview CBT',
            tab: 'admin-preview-soal',
            icon: Eye
          }
        };
      case 'admin-sekolah':
        return {
          title: 'Data Sekolah Dasar',
          desc: `Kelola data induk 8 SD binaan di Kec. ${districtName}, nomor NPSN, status akreditasi, dan jumlah peserta didik aktif.`,
          quickAction: {
            label: 'Lihat Guru',
            tab: 'admin-guru',
            icon: ArrowRight
          }
        };
      case 'admin-guru':
        return {
          title: 'Data Guru Pengampu',
          desc: 'Daftar guru kelas 1-6 dan guru mata pelajaran per sekolah lengkap dengan status penugasan dan akun akses.',
          quickAction: {
            label: 'Tim Pembuat Soal',
            tab: 'admin-pembuat-soal',
            icon: ArrowRight
          }
        };
      case 'admin-siswa':
        return {
          title: 'Data Siswa & Peserta Ujian',
          desc: 'Manajemen siswa per kelas, nomor NISN, verifikasi keaktifan, dan kesiapan mengikuti ujian semester CBT.',
          quickAction: {
            label: 'Monitoring Ujian',
            tab: 'admin-monitoring',
            icon: Activity
          }
        };
      case 'admin-kelas':
        return {
          title: 'Data Kelas & Rombel',
          desc: 'Struktur pembagian rombongan belajar (Kelas 1A s/d 6B) untuk penempatan ujian dan pelaporan nilai.',
          quickAction: null
        };
      case 'admin-mapel':
        return {
          title: 'Mata Pelajaran & KKM',
          desc: 'Daftar kurikulum mata pelajaran (Kurikulum Merdeka & K13) beserta batas KKM ketuntasan wilayah.',
          quickAction: null
        };
      case 'admin-bank-soal':
        return {
          title: 'Bank Soal Ujian Semester',
          desc: 'Kumpulan butir soal 4 format resmi: Pilihan Ganda, PG Kompleks, Benar/Salah 4-5 butir, dan Menjodohkan.',
          quickAction: {
            label: 'Simulasi CBT',
            tab: 'admin-preview-soal',
            icon: Eye
          }
        };
      case 'admin-impor-soal':
        return {
          title: 'Impor Soal Excel',
          desc: 'Unggah naskah soal dari template Excel (.xlsx) secara massal dengan deteksi otomatis tipe Benar/Salah 4-5 butir.',
          quickAction: {
            label: 'Preview Soal',
            tab: 'admin-preview-soal',
            icon: Eye
          }
        };
      case 'admin-pembuat-soal':
        return {
          title: 'Tim Pembuat & Penulis Naskah',
          desc: 'Kelola tim guru penyusun naskah ujian, pemetaan spesialis mapel, target soal, dan fitur impor data tim.',
          quickAction: {
            label: 'Lihat Bank Soal',
            tab: 'admin-bank-soal',
            icon: FileQuestion
          }
        };
      case 'admin-preview-soal':
        return {
          title: 'Preview Tampilan Soal CBT',
          desc: 'Simulasi layar ujian siswa (komputer/tablet/HP), uji coba menjawab, dan pratinjau lembar naskah cetak resmi.',
          quickAction: {
            label: 'Bank Soal',
            tab: 'admin-bank-soal',
            icon: FileQuestion
          }
        };
      case 'admin-paket-ujian':
        return {
          title: 'Paket Naskah Ujian',
          desc: 'Penyusunan naskah soal menjadi paket ujian terstruktur sesuai tingkat kelas dan semester.',
          quickAction: null
        };
      case 'admin-jadwal-ujian':
        return {
          title: 'Jadwal Asesmen Semester',
          desc: 'Atur tanggal, jam mulai, dan durasi pengerjaan ujian untuk tiap mata pelajaran se-kecamatan.',
          quickAction: null
        };
      case 'admin-peserta-ujian':
        return {
          title: 'Peserta & Ruang Ujian',
          desc: 'Pengaturan pembagian sesi ujian, ruang komputer, kartu login siswa, dan token keamanan asesmen.',
          quickAction: null
        };
      case 'admin-monitoring':
        return {
          title: 'Monitoring Ujian Live',
          desc: 'Pantau siswa yang sedang mengerjakan ujian secara langsung, waktu tersisa, status kirim, dan kendala koneksi.',
          quickAction: {
            label: 'Hasil Nilai',
            tab: 'admin-hasil-ujian',
            icon: ArrowRight
          }
        };
      case 'admin-hasil-ujian':
        return {
          title: 'Hasil & Rekapitulasi Nilai',
          desc: 'Daftar skor otomatis seluruh siswa, tingkat kelulusan KKM, dan distribusi capaian nilai per sekolah.',
          quickAction: {
            label: 'Cetak Laporan',
            tab: 'admin-laporan',
            icon: ArrowRight
          }
        };
      case 'admin-laporan':
        return {
          title: 'Laporan & Cetak Nilai Resmi',
          desc: 'Cetak lembar nilai resmi kedinasan berformat A4 dengan tanda tangan dan rekapitulasi peringkat.',
          quickAction: null
        };
      case 'admin-ekspor':
        return {
          title: 'Pusat Ekspor & Cadangan',
          desc: 'Unduh seluruh data bank soal, nilai siswa, dan master sekolah dalam format Excel (.xlsx) untuk arsip.',
          quickAction: null
        };
      case 'admin-manajemen-akun':
        return {
          title: 'Manajemen Akun Pengguna',
          desc: 'Kelola akun login admin, operator sekolah, dan guru pengampu serta reset kata sandi.',
          quickAction: null
        };
      case 'admin-pengaturan':
        return {
          title: 'Pengaturan Sistem CBT',
          desc: 'Atur nama aplikasi, tahun ajaran aktif, semester, dan konfigurasi nilai KKM standar kecamatan.',
          quickAction: null
        };
      case 'admin-riwayat':
        return {
          title: 'Riwayat Audit Aktivitas',
          desc: 'Log catatan transaksi penambahan soal, impor data, login, dan pengubahan nilai demi transparansi.',
          quickAction: null
        };
      case 'admin-spreadsheet-sync':
        return {
          title: 'Integrasi Google Spreadsheet',
          desc: 'Sinkronisasi 2 arah master data sekolah, guru, siswa, tim pembuat soal, dan bank soal dengan Google Drive & Google Sheets.',
          quickAction: {
            label: 'Impor Soal',
            tab: 'admin-impor-soal',
            icon: ArrowRight
          }
        };

      // Guru
      case 'guru-dashboard':
        return {
          title: 'Dashboard Guru Pengampu',
          desc: 'Ringkasan aktivitas kelas binaan Anda, jumlah siswa, jadwal ujian aktif, dan capaian rata-rata kelas.',
          quickAction: {
            label: 'Tulis Soal Baru',
            tab: 'guru-buat-soal',
            icon: ArrowRight
          }
        };
      case 'guru-impor-naskah':
        return {
          title: 'Impor Naskah Ujian Guru',
          desc: 'Unggah butir soal yang sudah Anda ketik di file Excel langsung ke bank soal tingkat kecamatan.',
          quickAction: {
            label: 'Preview Soal',
            tab: 'guru-preview-soal',
            icon: Eye
          }
        };
      case 'guru-bank-soal':
        return {
          title: 'Bank Soal Guru',
          desc: 'Koleksi butir soal ujian semester yang Anda ampu, siap ditugaskan ke dalam paket ujian.',
          quickAction: {
            label: 'Tulis Soal',
            tab: 'guru-buat-soal',
            icon: ArrowRight
          }
        };
      case 'guru-buat-soal':
        return {
          title: 'Buat & Edit Butir Soal',
          desc: 'Editor soal interaktif untuk membuat Pilihan Ganda, PG Kompleks, Menjodohkan, atau Benar/Salah 4-5 butir.',
          quickAction: {
            label: 'Lihat Preview',
            tab: 'guru-preview-soal',
            icon: Eye
          }
        };
      case 'guru-preview-soal':
        return {
          title: 'Preview Tampilan Soal',
          desc: 'Lihat dan coba langsung soal buatan Anda dalam bentuk simulasi CBT siswa atau naskah cetak kertas.',
          quickAction: {
            label: 'Edit Soal',
            tab: 'guru-buat-soal',
            icon: ArrowRight
          }
        };
      case 'guru-siswa':
        return {
          title: 'Data Siswa Kelas Binaan',
          desc: 'Daftar nama dan nomor induk siswa yang Anda bimbing di kelas.',
          quickAction: {
            label: 'Hasil Ujian',
            tab: 'guru-hasil-ujian',
            icon: ArrowRight
          }
        };
      case 'guru-monitoring':
        return {
          title: 'Pantau Ujian Kelas',
          desc: 'Monitoring langsung siswa kelas Anda yang sedang online mengerjakan soal ujian.',
          quickAction: null
        };
      case 'guru-hasil-ujian':
        return {
          title: 'Hasil Nilai Kelas Binaan',
          desc: 'Daftar perolehan nilai siswa Anda beserta status ketercapaian KKM dan jawaban yang perlu dibahas.',
          quickAction: {
            label: 'Cetak Nilai',
            tab: 'guru-laporan',
            icon: ArrowRight
          }
        };
      case 'guru-laporan':
        return {
          title: 'Laporan Nilai Siswa',
          desc: 'Format cetak daftar nilai kelas binaan untuk arsip rapor dan laporan kepada kepala sekolah.',
          quickAction: null
        };
      case 'guru-spreadsheet-sync':
        return {
          title: 'Integrasi Google Sheets Guru',
          desc: 'Kelola dan impor naskah soal langsung dari file Google Spreadsheet di Google Drive Anda.',
          quickAction: {
            label: 'Import Naskah',
            tab: 'guru-impor-naskah',
            icon: ArrowRight
          }
        };

      // Siswa
      case 'siswa-dashboard':
        return {
          title: 'Ruang Ujian Siswa',
          desc: 'Selamat datang! Pilih menu "Ujian Tersedia" untuk mulai mengerjakan asesmen semester.',
          quickAction: {
            label: 'Ujian Tersedia',
            tab: 'siswa-ujian-tersedia',
            icon: ArrowRight
          }
        };
      case 'siswa-ujian-tersedia':
        return {
          title: 'Ujian Aktif Siap Dikerjakan',
          desc: 'Daftar mata pelajaran yang saat ini dibuka untuk pengerjaan ujian. Pastikan token dan petunjuk sudah dibaca.',
          quickAction: null
        };
      case 'siswa-jadwal':
        return {
          title: 'Jadwal Ujian Saya',
          desc: 'Waktu dan tanggal pelaksanaan seluruh mata pelajaran asesmen semester.',
          quickAction: null
        };
      case 'siswa-hasil-ujian':
        return {
          title: 'Pengumuman Nilai Ujian',
          desc: 'Perolehan skor asesmen semester yang telah selesai dikerjakan dan diverifikasi guru.',
          quickAction: null
        };

      default:
        return {
          title: 'Sistem Ujian Semester CBT',
          desc: 'Portal asesmen terpadu tingkat sekolah dasar kecamatan.',
          quickAction: null
        };
    }
  };

  const info = getPageInfo(currentTab);

  return (
    <div
      className={`mb-4 rounded-xl border transition-all no-print lg:hidden overflow-hidden ${
        isDark
          ? 'bg-[#18181c] border-white/10 text-white shadow-md'
          : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
      }`}
    >
      {/* Top Header bar with title & collapse toggle */}
      <div className="p-3 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              isDark
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
            }`}
          >
            <Info className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs tracking-tight truncate leading-tight">
              {info.title}
            </h3>
            <span
              className={`text-[10px] font-mono block ${
                isDark ? 'text-white/40' : 'text-slate-400'
              }`}
            >
              Penjelasan Menu • {districtName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {info.quickAction && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate(info.quickAction.tab)}
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition shadow-2xs flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <span>{info.quickAction.label}</span>
              <info.quickAction.icon className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark
                ? 'text-white/60 hover:text-white hover:bg-white/5'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={isCollapsed ? 'Buka Penjelasan' : 'Tutup Penjelasan'}
            aria-label="Toggle Penjelasan Menu"
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Explanation Body */}
      {!isCollapsed && (
        <div
          className={`px-3 pb-3 pt-1 text-xs border-t transition-all ${
            isDark
              ? 'border-white/5 bg-[#141417]/60 text-white/70'
              : 'border-slate-100 bg-slate-50/70 text-slate-600'
          }`}
        >
          <p className="leading-relaxed text-[11px] font-sans">
            {info.desc}
          </p>

          {/* Quick Context Hints */}
          <div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-mono">
            <span
              className={isDark ? 'text-indigo-400' : 'text-indigo-700'}
            >
              • Mode Mobile Simpel & Cepat
            </span>
            <span className={isDark ? 'text-white/40' : 'text-slate-400'}>
              Ketuk tombol bawah untuk ganti menu
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
