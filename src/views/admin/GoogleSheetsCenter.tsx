import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Link,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  Users,
  School as SchoolIcon,
  GraduationCap,
  PenTool,
  FileQuestion,
  HelpCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Check,
  RotateCcw
} from 'lucide-react';
import { School, User, Question, Subject, SystemSettings } from '../../types';
import { AppStorage } from '../../services/storage';
import {
  googleSignIn,
  googleSignOut,
  initAuth,
  isGoogleConnected,
  getCachedGoogleUser
} from '../../services/authGoogle';
import { GoogleSheetsService, SpreadsheetMetadata } from '../../services/googleSheetsService';
import { Modal } from '../../components/Modal';

interface GoogleSheetsCenterProps {
  schools: School[];
  users: User[];
  questions: Question[];
  subjects: Subject[];
  settings: SystemSettings;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
  themeMode?: 'dark' | 'light';
  onNavigate?: (tab: string) => void;
}

export const GoogleSheetsCenter: React.FC<GoogleSheetsCenterProps> = ({
  schools,
  users,
  questions,
  subjects,
  settings,
  onRefresh,
  showToast,
  themeMode = 'dark',
  onNavigate
}) => {
  const isDark = themeMode === 'dark';

  // Auth state
  const [isConnected, setIsConnected] = useState<boolean>(() => isGoogleConnected());
  const [googleUser, setGoogleUser] = useState<any>(() => getCachedGoogleUser());
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Sync state
  const [isExporting, setIsExporting] = useState(false);
  const [lastCreatedUrl, setLastCreatedUrl] = useState<string | null>(() => {
    return localStorage.getItem('last_cbt_master_sheets_url');
  });

  // Import state
  const [sheetUrlInput, setSheetUrlInput] = useState<string>('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [metadata, setMetadata] = useState<SpreadsheetMetadata | null>(null);
  const [selectedSheetTab, setSelectedSheetTab] = useState<string>('');
  const [importTarget, setImportTarget] = useState<'all' | 'schools' | 'teachers' | 'students' | 'authors' | 'questions'>('all');
  const [isImporting, setIsImporting] = useState(false);

  // Confirm Mutation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'import_all' | 'import_specific' | 'sync_export';
    details?: string[];
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionType: 'import_all'
  });

  useEffect(() => {
    initAuth(
      user => {
        setIsConnected(true);
        setGoogleUser(user);
      },
      () => {
        setIsConnected(false);
        setGoogleUser(null);
      }
    );
  }, []);

  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setIsConnected(true);
        setGoogleUser(res.user);
        showToast('success', 'Google Terhubung!', `Berhasil masuk sebagai ${res.user.displayName || res.user.email}`);
      }
    } catch (err: any) {
      showToast('error', 'Gagal Menghubungkan Google', err.message || 'Proses otentikasi dibatalkan.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await googleSignOut();
      setIsConnected(false);
      setGoogleUser(null);
      showToast('info', 'Google Terputus', 'Sesi koneksi Google Sheets telah diakhiri.');
    } catch (err: any) {
      showToast('error', 'Gagal Keluar', err.message);
    }
  };

  // 1-Click Sync Master Spreadsheet creation
  const handlePromptCreateMaster = () => {
    if (!isConnected) {
      showToast('error', 'Belum Terhubung', 'Silakan hubungkan akun Google Anda terlebih dahulu.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Buat Master Spreadsheet di Google Drive?',
      description: `Sistem akan membuat berkas Google Spreadsheet baru di Google Drive Anda dengan 5 lembar kerja: Data_Sekolah, Data_Guru, Data_Siswa, Pembuat_Soal, dan Bank_Soal. Data saat ini akan langsung disalin ke dalamnya.`,
      actionType: 'sync_export',
      details: [
        `${schools.length} Data Satuan Pendidikan (SD)`,
        `${users.filter(u => u.role === 'guru').length} Data Guru Pengampu`,
        `${users.filter(u => u.role === 'siswa').length} Data Peserta Ujian`,
        `${users.filter(u => u.isQuestionAuthor || u.username === 'pembuat_soal').length} Data Tim Penulis Soal`,
        `${questions.length} Butir Naskah Bank Soal (4 Format)`
      ]
    });
  };

  const handleExecuteExportMaster = async () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    setIsExporting(true);

    try {
      const res = await GoogleSheetsService.createMasterSpreadsheet(
        settings.districtName || 'Ampelgading',
        schools,
        users,
        questions,
        subjects,
        settings
      );

      setLastCreatedUrl(res.spreadsheetUrl);
      localStorage.setItem('last_cbt_master_sheets_url', res.spreadsheetUrl);

      AppStorage.logActivity(
        'Admin Kecamatan',
        'admin',
        'Ekspor Master Google Sheets',
        `Membuat Google Spreadsheet master terintegrasi ID: ${res.spreadsheetId}`
      );

      showToast(
        'success',
        'Spreadsheet Berhasil Dibuat!',
        'Master data telah siap di Google Drive. Klik tombol untuk membuka spreadsheet.'
      );
    } catch (err: any) {
      showToast('error', 'Gagal Membuat Spreadsheet', err.message || 'Pastikan izin Google Sheets telah diberikan.');
    } finally {
      setIsExporting(false);
    }
  };

  // Inspect Google Spreadsheet URL
  const handleInspectSpreadsheet = async () => {
    const id = GoogleSheetsService.extractSpreadsheetId(sheetUrlInput);
    if (!id) {
      showToast('error', 'Format Link Tidak Valid', 'Pastikan Anda memasukkan link Google Spreadsheet lengkap atau ID spreadsheet yang benar.');
      return;
    }

    if (!isConnected) {
      showToast('error', 'Koneksi Diperlukan', 'Silakan masuk dengan akun Google terlebih dahulu untuk membaca spreadsheet.');
      return;
    }

    setIsInspecting(true);
    setMetadata(null);

    try {
      const meta = await GoogleSheetsService.getSpreadsheetMetadata(id);
      setMetadata(meta);
      if (meta.sheets.length > 0) {
        setSelectedSheetTab(meta.sheets[0].title);
      }
      showToast('success', 'Spreadsheet Terbaca', `Berhasil menemukan "${meta.title}" dengan ${meta.sheets.length} tab.`);
    } catch (err: any) {
      showToast('error', 'Gagal Memeriksa Spreadsheet', err.message);
    } finally {
      setIsInspecting(false);
    }
  };

  // Prompt Import from Google Sheets
  const handlePromptImport = () => {
    if (!metadata) return;

    let targetTitle = '';
    if (importTarget === 'all') targetTitle = 'Seluruh Data Master (Sekolah, Guru, Siswa, Pembuat Soal, Bank Soal)';
    else if (importTarget === 'schools') targetTitle = 'Data Satuan Pendidikan (Sekolah)';
    else if (importTarget === 'teachers') targetTitle = 'Data Guru Pengampu';
    else if (importTarget === 'students') targetTitle = 'Data Siswa & Peserta Ujian';
    else if (importTarget === 'authors') targetTitle = 'Data Tim Pembuat Soal';
    else if (importTarget === 'questions') targetTitle = 'Naskah Bank Soal';

    setConfirmModal({
      isOpen: true,
      title: `Konfirmasi Tarik Data dari Google Spreadsheet?`,
      description: `Apakah Anda yakin ingin memperbarui data aplikasi dengan mengimpor "${targetTitle}" dari Google Spreadsheet "${metadata.title}"? Data di sistem lokal akan diperbarui sesuai baris yang valid.`,
      actionType: importTarget === 'all' ? 'import_all' : 'import_specific',
      details: [
        `Spreadsheet: ${metadata.title}`,
        `Tab Terpilih: ${importTarget === 'all' ? 'Otomatis mengikuti nama tab standar' : selectedSheetTab}`,
        `Target Modul: ${targetTitle}`
      ]
    });
  };

  // Execute Import from Google Sheets
  const handleExecuteImport = async () => {
    if (!metadata) return;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    setIsImporting(true);

    try {
      const id = metadata.spreadsheetId;
      let totalImported = 0;

      if (importTarget === 'all') {
        // Find tabs
        const schoolTab = metadata.sheets.find(s => /sekolah/i.test(s.title))?.title || 'Data_Sekolah';
        const teacherTab = metadata.sheets.find(s => /guru/i.test(s.title))?.title || 'Data_Guru';
        const studentTab = metadata.sheets.find(s => /siswa/i.test(s.title))?.title || 'Data_Siswa';
        const authorTab = metadata.sheets.find(s => /penulis|pembuat/i.test(s.title))?.title || 'Pembuat_Soal';

        // 1. Schools
        const schoolRows = await GoogleSheetsService.fetchSheetRows(id, schoolTab).catch(() => []);
        if (schoolRows.length > 0) {
          const { schools: parsedSchools } = GoogleSheetsService.parseSchoolsFromRows(schoolRows);
          if (parsedSchools.length > 0) {
            parsedSchools.forEach(s => AppStorage.saveSchool(s));
            totalImported += parsedSchools.length;
          }
        }

        const currentSchools = AppStorage.getSchools();

        // 2. Teachers
        const teacherRows = await GoogleSheetsService.fetchSheetRows(id, teacherTab).catch(() => []);
        if (teacherRows.length > 0) {
          const { teachers: parsedTeachers } = GoogleSheetsService.parseTeachersFromRows(teacherRows, currentSchools);
          if (parsedTeachers.length > 0) {
            AppStorage.saveUsers(parsedTeachers);
            totalImported += parsedTeachers.length;
          }
        }

        // 3. Students
        const studentRows = await GoogleSheetsService.fetchSheetRows(id, studentTab).catch(() => []);
        if (studentRows.length > 0) {
          const { students: parsedStudents } = GoogleSheetsService.parseStudentsFromRows(studentRows, currentSchools);
          if (parsedStudents.length > 0) {
            AppStorage.saveUsers(parsedStudents);
            totalImported += parsedStudents.length;
          }
        }

        // 4. Authors
        const authorRows = await GoogleSheetsService.fetchSheetRows(id, authorTab).catch(() => []);
        if (authorRows.length > 0) {
          const { authors: parsedAuthors } = GoogleSheetsService.parseAuthorsFromRows(authorRows, currentSchools);
          if (parsedAuthors.length > 0) {
            AppStorage.saveUsers(parsedAuthors);
            totalImported += parsedAuthors.length;
          }
        }

        // 5. Questions (Bank Soal)
        const questionTab = metadata.sheets.find(s => /soal|bank/i.test(s.title))?.title || 'Bank_Soal';
        const questionRows = await GoogleSheetsService.fetchSheetRows(id, questionTab).catch(() => []);
        if (questionRows.length > 0) {
          const { questions: parsedQ } = GoogleSheetsService.parseQuestionsFromRows(questionRows, subjects);
          if (parsedQ.length > 0) {
            AppStorage.saveQuestions(parsedQ);
            totalImported += parsedQ.length;
          }
        }

        onRefresh();
        showToast('success', 'Impor Master Selesai!', `Berhasil memperbarui ${totalImported} entitas data dari Google Spreadsheet.`);
      } else if (importTarget === 'schools') {
        const rows = await GoogleSheetsService.fetchSheetRows(id, selectedSheetTab);
        const { schools: parsedSchools } = GoogleSheetsService.parseSchoolsFromRows(rows);
        if (parsedSchools.length === 0) {
          throw new Error('Tidak ada baris data sekolah yang valid ditemukan pada tab tersebut.');
        }
        parsedSchools.forEach(s => AppStorage.saveSchool(s));
        onRefresh();
        showToast('success', 'Data Sekolah Diperbarui', `Berhasil mengimpor ${parsedSchools.length} sekolah.`);
      } else if (importTarget === 'teachers') {
        const rows = await GoogleSheetsService.fetchSheetRows(id, selectedSheetTab);
        const { teachers: parsedTeachers } = GoogleSheetsService.parseTeachersFromRows(rows, schools);
        if (parsedTeachers.length === 0) {
          throw new Error('Tidak ada baris data guru yang valid ditemukan pada tab tersebut.');
        }
        AppStorage.saveUsers(parsedTeachers);
        onRefresh();
        showToast('success', 'Data Guru Diperbarui', `Berhasil mengimpor ${parsedTeachers.length} guru pengampu.`);
      } else if (importTarget === 'students') {
        const rows = await GoogleSheetsService.fetchSheetRows(id, selectedSheetTab);
        const { students: parsedStudents } = GoogleSheetsService.parseStudentsFromRows(rows, schools);
        if (parsedStudents.length === 0) {
          throw new Error('Tidak ada baris data siswa yang valid ditemukan pada tab tersebut.');
        }
        AppStorage.saveUsers(parsedStudents);
        onRefresh();
        showToast('success', 'Data Siswa Diperbarui', `Berhasil mengimpor ${parsedStudents.length} siswa.`);
      } else if (importTarget === 'authors') {
        const rows = await GoogleSheetsService.fetchSheetRows(id, selectedSheetTab);
        const { authors: parsedAuthors } = GoogleSheetsService.parseAuthorsFromRows(rows, schools);
        if (parsedAuthors.length === 0) {
          throw new Error('Tidak ada baris data pembuat soal yang valid ditemukan pada tab tersebut.');
        }
        AppStorage.saveUsers(parsedAuthors);
        onRefresh();
        showToast('success', 'Tim Pembuat Soal Diperbarui', `Berhasil mengimpor ${parsedAuthors.length} pembuat soal.`);
      } else if (importTarget === 'questions') {
        const rows = await GoogleSheetsService.fetchSheetRows(id, selectedSheetTab);
        const { questions: parsedQ, errors } = GoogleSheetsService.parseQuestionsFromRows(rows, subjects);
        if (parsedQ.length === 0) {
          throw new Error('Tidak ada baris soal yang valid ditemukan pada tab tersebut.');
        }
        AppStorage.saveQuestions(parsedQ);
        onRefresh();
        showToast(
          'success',
          'Bank Soal Diperbarui',
          `Berhasil mengimpor ${parsedQ.length} butir soal dari Google Spreadsheet.`
        );
      }
    } catch (err: any) {
      showToast('error', 'Gagal Mengimpor dari Google Sheets', err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Integrasi Google Spreadsheet
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sinkronisasi data sekolah, guru, siswa, tim pembuat soal, dan naskah bank soal dengan Google Drive
              </p>
            </div>
          </div>
        </div>

        {/* Google Account Status Badge / Login Button */}
        <div>
          {isConnected && googleUser ? (
            <div className="flex items-center gap-2 p-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                {googleUser.photoURL ? (
                  <img src={googleUser.photoURL} alt="Google Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>G</span>
                )}
              </div>
              <div className="text-left pr-2">
                <p className="text-xs font-bold text-emerald-950 leading-tight">
                  {googleUser.displayName || 'Akun Google'}
                </p>
                <p className="text-[10px] text-emerald-700 truncate max-w-[150px]">
                  {googleUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogout}
                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 hover:text-rose-600 text-[10px] font-bold rounded-lg border border-slate-200 transition cursor-pointer"
                title="Putuskan koneksi Google"
              >
                Putuskan
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isAuthLoading}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-2 transition cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isAuthLoading ? 'Menghubungkan...' : 'Hubungkan Akun Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Overview Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-emerald-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
              Google Workspace Cloud Sync
            </span>
            <h3 className="text-lg font-bold text-white">
              Pusat Kolaborasi Data Ujian Berbasis Cloud Spreadsheet
            </h3>
            <p className="text-xs text-white/75 leading-relaxed">
              Kini pengisian data sekolah, guru kelas, peserta didik, penulis naskah, dan bank soal tidak hanya terbatas pada file Excel lokal, tetapi dapat langsung terhubung secara live dengan Google Sheets.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            {lastCreatedUrl && (
              <a
                href={lastCreatedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Master Sheets</span>
              </a>
            )}

            <button
              type="button"
              onClick={handlePromptCreateMaster}
              disabled={isExporting}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isExporting ? 'Membuat Spreadsheet...' : 'Buat Master Spreadsheet Baru'}</span>
            </button>
          </div>
        </div>

        {/* 5 Dataset Badges */}
        <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] text-white/60 block">Satuan Pendidikan</span>
            <span className="text-sm font-bold font-mono">{schools.length} SD</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] text-white/60 block">Guru Pengampu</span>
            <span className="text-sm font-bold font-mono">{users.filter(u => u.role === 'guru').length} Guru</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] text-white/60 block">Peserta Ujian</span>
            <span className="text-sm font-bold font-mono">{users.filter(u => u.role === 'siswa').length} Siswa</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] text-white/60 block">Tim Penulis</span>
            <span className="text-sm font-bold font-mono">{users.filter(u => u.isQuestionAuthor || u.username === 'pembuat_soal').length} Penulis</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-white/60 block">Naskah Soal</span>
            <span className="text-sm font-bold font-mono">{questions.length} Butir</span>
          </div>
        </div>
      </div>

      {/* 3. Tarik & Impor dari Google Spreadsheet */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-600" />
            Tarik & Perbarui Data dari Google Spreadsheet
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Masukkan tautan (link) atau ID Google Spreadsheet yang berisi data sekolah, guru, siswa, atau bank soal untuk diimpor ke sistem.
          </p>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full">
            <Link className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tempel link Google Spreadsheet (https://docs.google.com/spreadsheets/d/...)"
              value={sheetUrlInput}
              onChange={e => setSheetUrlInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          <button
            type="button"
            onClick={handleInspectSpreadsheet}
            disabled={isInspecting || !sheetUrlInput.trim()}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isInspecting ? 'animate-spin' : ''}`} />
            <span>{isInspecting ? 'Memeriksa...' : 'Periksa Spreadsheet'}</span>
          </button>
        </div>

        {/* Inspection Result Card */}
        {metadata && (
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in duration-200 text-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Spreadsheet Teridentifikasi:
                </span>
                <h4 className="font-bold text-emerald-950 text-sm mt-0.5 flex items-center gap-2">
                  <span>{metadata.title}</span>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${metadata.spreadsheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-0.5 text-xs font-normal"
                    title="Buka Spreadsheet di tab baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </h4>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                {metadata.sheets.length} Lembar Kerja
              </span>
            </div>

            {/* Target Modul & Tab Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-emerald-200/80">
              <div>
                <label className="block text-[11px] font-bold text-emerald-950 mb-1">
                  Pilih Data yang Ingin Diimpor:
                </label>
                <select
                  value={importTarget}
                  onChange={e => setImportTarget(e.target.value as any)}
                  className="w-full text-xs font-semibold py-2 px-3 rounded-xl border border-emerald-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">⭐ Seluruh Data Master (Sekolah, Guru, Siswa, Penulis)</option>
                  <option value="schools">Data Satuan Pendidikan (Sekolah SD)</option>
                  <option value="teachers">Data Guru Pengampu</option>
                  <option value="students">Data Siswa & Peserta Ujian</option>
                  <option value="authors">Data Tim Pembuat Soal</option>
                </select>
              </div>

              {importTarget !== 'all' && (
                <div>
                  <label className="block text-[11px] font-bold text-emerald-950 mb-1">
                    Pilih Lembar Kerja (Tab) Sumber:
                  </label>
                  <select
                    value={selectedSheetTab}
                    onChange={e => setSelectedSheetTab(e.target.value)}
                    className="w-full text-xs font-semibold py-2 px-3 rounded-xl border border-emerald-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    {metadata.sheets.map(s => (
                      <option key={s.sheetId} value={s.title}>
                        Tab: {s.title} ({s.rowCount || 0} baris)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Action Import Button */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={handlePromptImport}
                disabled={isImporting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isImporting ? 'Mengimpor Data...' : 'Mulai Tarik & Simpan ke Sistem'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Petunjuk Penggunaan & Format Header Standar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs text-slate-600">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          Panduan Nama Kolom Standar Google Spreadsheet
        </h4>
        <p className="leading-relaxed">
          Agar data terbaca otomatis tanpa kendala, pastikan baris pertama lembar kerja Anda menggunakan nama-nama kolom standar di bawah ini:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 text-xs block">1. Tab Data_Sekolah</span>
            <code className="text-[11px] text-indigo-700 block bg-slate-50 p-1.5 rounded border border-slate-100">
              No, Nama_Sekolah, NPSN, Status, Akreditasi, Alamat, Nama_Kepala_Sekolah, NIP_Kepsek, Kontak_WA, Email_Sekolah
            </code>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 text-xs block">2. Tab Data_Guru</span>
            <code className="text-[11px] text-indigo-700 block bg-slate-50 p-1.5 rounded border border-slate-100">
              No, Nama_Lengkap, NIP, Asal_Sekolah, NPSN_Sekolah, Kelas, Rombel, Mata_Pelajaran, Username, Password_Awal, Nomor_WA, Email, Status
            </code>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 text-xs block">3. Tab Data_Siswa</span>
            <code className="text-[11px] text-indigo-700 block bg-slate-50 p-1.5 rounded border border-slate-100">
              No, Nomor_Peserta, NISN, Nama_Siswa, Jenis_Kelamin, Asal_Sekolah, NPSN_Sekolah, Kelas, Rombel, Agama, Username, Password_Awal, Status
            </code>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 text-xs block">4. Tab Pembuat_Soal</span>
            <code className="text-[11px] text-indigo-700 block bg-slate-50 p-1.5 rounded border border-slate-100">
              No, Nama_Lengkap, NIP, Asal_Sekolah, NPSN_Sekolah, Spesialis_Mapel, Jumlah_Soal_Target, Username, Password_Awal, Nomor_WA, Email, Status
            </code>
          </div>
        </div>
      </div>

      {/* Confirmation Modal (Required for destructive/mutating Workspace Operations) */}
      {confirmModal.isOpen && (
        <Modal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          title={confirmModal.title}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3 p-3 bg-amber-50 text-amber-950 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Konfirmasi Izin Tindakan Data</p>
                <p className="leading-relaxed">{confirmModal.description}</p>
              </div>
            </div>

            {confirmModal.details && confirmModal.details.length > 0 && (
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block text-[11px]">Rincian Data:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                  {confirmModal.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={
                  confirmModal.actionType === 'sync_export'
                    ? handleExecuteExportMaster
                    : handleExecuteImport
                }
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Setuju & Lanjutkan</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
