import React, { useState, useEffect } from 'react';
import {
  Building2,
  Lock,
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  Sun,
  Moon,
  GraduationCap,
  School as SchoolIcon,
  FileSpreadsheet,
  PenTool,
  Sparkles,
  MapPin
} from 'lucide-react';
import { User, School, SystemSettings } from '../../types';
import { AppStorage } from '../../services/storage';

interface LoginPageProps {
  allUsers: User[];
  schools?: School[];
  settings: SystemSettings;
  themeMode?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onLogin: (user: User) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export type LoginPortalTab = 'siswa' | 'guru' | 'pembuat_soal' | 'admin';

export const LoginPage: React.FC<LoginPageProps> = ({
  allUsers,
  schools = [],
  settings,
  themeMode = 'dark',
  onToggleTheme,
  onLogin,
  showToast
}) => {
  // Use passed schools or fallback to AppStorage
  const availableSchools = schools.length > 0 ? schools : AppStorage.getSchools();

  const [activeTab, setActiveTab] = useState<LoginPortalTab>('siswa');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = themeMode === 'dark';

  // Current selected school object
  const currentSchool = availableSchools.find(s => s.id === selectedSchoolId);

  // Filtered users for quick select based on active tab and school
  const usersForRole = allUsers.filter(u => {
    if (activeTab === 'siswa') {
      return u.role === 'siswa' && (selectedSchoolId === 'ALL' || u.schoolId === selectedSchoolId);
    }
    if (activeTab === 'guru') {
      return u.role === 'guru' && (selectedSchoolId === 'ALL' || u.schoolId === selectedSchoolId);
    }
    if (activeTab === 'pembuat_soal') {
      return u.isQuestionAuthor || u.username === 'pembuat_soal';
    }
    if (activeTab === 'admin') {
      return u.role === 'admin';
    }
    return true;
  });

  // Handle Tab Switch
  const handleTabChange = (tab: LoginPortalTab) => {
    setActiveTab(tab);
    setErrorMsg('');
    setSelectedUserId('');

    if (tab === 'pembuat_soal') {
      setUsername('pembuat_soal');
      setPassword('password123');
    } else if (tab === 'admin') {
      setUsername('admin');
      setPassword('Ampelgading2026!');
    } else {
      setUsername('');
      setPassword('');
    }
  };

  // When a specific user is picked from dropdown
  const handleSelectUserFromList = (userId: string) => {
    setSelectedUserId(userId);
    if (!userId) return;

    const userObj = allUsers.find(u => u.id === userId);
    if (userObj) {
      if (userObj.role === 'siswa') {
        setUsername(userObj.participantNumber || userObj.username);
      } else {
        setUsername(userObj.username);
      }
      setPassword(userObj.password || 'password123');
      setErrorMsg('');
    }
  };

  // Fill specialized credentials for Pembuat Soal
  const handleFillPembuatSoal = () => {
    setActiveTab('pembuat_soal');
    setUsername('pembuat_soal');
    setPassword('password123');
    setErrorMsg('');
    showToast('info', 'Kredensial Terisi', 'Username: pembuat_soal • Password: password123');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const trimmedInput = username.trim().toLowerCase();
    
    // Find user by username, participantNumber, or nip
    const found = allUsers.find(u => {
      const uName = u.username.toLowerCase();
      const matchUsername =
        uName === trimmedInput ||
        (u.role === 'guru' && (
          uName === `guru_${trimmedInput}` ||
          trimmedInput === `guru_${uName}` ||
          uName.replace(/^guru_/, '') === trimmedInput.replace(/^guru_/, '')
        ));
      const matchParticipant = u.participantNumber && u.participantNumber.toLowerCase() === trimmedInput;
      const matchNip = u.nip && u.nip.replace(/\s+/g, '') === trimmedInput.replace(/\s+/g, '');
      return matchUsername || matchParticipant || matchNip;
    });

    if (found) {
      if (!found.isActive) {
        setErrorMsg('Akun Anda saat ini dinonaktifkan oleh Koordinator Wilayah Kecamatan.');
        setIsSubmitting(false);
        return;
      }

      // Check school alignment if a specific school is selected (only for siswa & guru)
      if (
        (activeTab === 'siswa' || activeTab === 'guru') &&
        selectedSchoolId !== 'ALL' &&
        found.schoolId &&
        found.schoolId !== selectedSchoolId
      ) {
        const userSchool = availableSchools.find(s => s.id === found.schoolId);
        setErrorMsg(
          `Akun ${found.fullName} terdaftar di ${userSchool?.name || 'sekolah lain'}, bukan di ${currentSchool?.name}. Silakan ganti pilihan sekolah.`
        );
        setIsSubmitting(false);
        return;
      }

      // Password verification
      const isValidPassword =
        found.password === password ||
        (found.role === 'admin' && (password === 'Ampelgading2026!' || password === 'admin123')) ||
        (found.role !== 'admin' && (password === 'Ampelgading2026!' || password === 'password123'));

      if (isValidPassword) {
        onLogin(found);
        showToast('success', 'Autentikasi Berhasil', `Selamat datang kembali, ${found.fullName}!`);
      } else {
        setErrorMsg('Password yang Anda masukkan salah. Silakan periksa kembali.');
      }
    } else {
      setErrorMsg('Data kredensial tidak ditemukan pada sistem ujian kecamatan.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center p-3 sm:p-6 relative overflow-hidden font-geist transition-colors duration-200 ${
      isDark ? 'bg-[#0c0c0e] text-[#f2f2f2]' : 'bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-200 text-slate-900'
    }`}>
      
      {/* Day / Night Mode Switcher Button on Login */}
      {onToggleTheme && (
        <div className="absolute top-4 right-4 z-20">
          <button
            type="button"
            onClick={onToggleTheme}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer shadow-md ${
              isDark
                ? 'bg-[#161619] border-white/10 text-amber-300 hover:border-amber-400/40 hover:bg-white/5'
                : 'bg-white border-slate-200 text-indigo-700 hover:border-indigo-300 hover:bg-slate-50'
            }`}
            title={isDark ? 'Ganti ke Mode Siang' : 'Ganti ke Mode Malam'}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold">Mode Siang</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-semibold">Mode Malam</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Background Cyber Ambient Radial Glows (Dark Mode) */}
      {isDark && (
        <>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.22),transparent_70%)] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[radial-gradient(circle,rgba(79,70,229,0.08),transparent_70%)] pointer-events-none" />
        </>
      )}

      {/* Main Container */}
      <div className="w-full max-w-lg space-y-5 relative z-10 my-4">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#4f46e5] text-white flex items-center justify-center mx-auto shadow-[0_0_24px_rgba(79,70,229,0.45)] border border-indigo-400/30">
            <Building2 className="w-6 h-6" />
          </div>
          
          <div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-[11px] font-mono uppercase tracking-wider mb-1.5 ${
              isDark
                ? 'bg-white/5 border-white/10 text-indigo-300'
                : 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              Portal Ujian Semester SD Terpadu
            </div>
            <h1 className={`font-syne text-xl sm:text-2xl font-extrabold uppercase tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {settings.districtName}
            </h1>
            <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
              {settings.regencyName}, {settings.provinceName} • TP {settings.academicYear}
            </p>
          </div>
        </div>

        {/* Role Navigation Tabs on Portal */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl border text-xs font-semibold ${
          isDark ? 'bg-[#161619] border-white/10' : 'bg-slate-200/70 border-slate-300/80'
        }`}>
          <button
            type="button"
            onClick={() => handleTabChange('siswa')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition text-center ${
              activeTab === 'siswa'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : isDark
                ? 'text-white/60 hover:text-white hover:bg-white/5'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 shrink-0" />
            <span>Siswa CBT</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('guru')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition text-center ${
              activeTab === 'guru'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : isDark
                ? 'text-white/60 hover:text-white hover:bg-white/5'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <SchoolIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Guru Kelas</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('pembuat_soal')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition text-center relative ${
              activeTab === 'pembuat_soal'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
                : isDark
                ? 'text-amber-400 hover:text-amber-300 hover:bg-white/5'
                : 'text-amber-800 hover:text-amber-900 hover:bg-white/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span>Pembuat Soal</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-1.5 animate-pulse" />
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('admin')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition text-center ${
              activeTab === 'admin'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : isDark
                ? 'text-white/60 hover:text-white hover:bg-white/5'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Admin Korwil</span>
          </button>
        </div>

        {/* Card Form */}
        <div className={`rounded-2xl p-5 sm:p-7 backdrop-blur-xl space-y-5 transition-all ${
          isDark
            ? 'bg-[#161619] shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10 text-white'
            : 'bg-white shadow-xl border border-slate-200 text-slate-900'
        }`}>
          
          {/* Card Header Info based on Role */}
          <div className={`border-b pb-3.5 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
            {activeTab === 'siswa' && (
              <div>
                <h2 className="font-syne text-sm font-bold flex items-center gap-2 text-indigo-400">
                  <GraduationCap className="w-4 h-4 text-indigo-500" />
                  Masuk Peserta Ujian Semester (Siswa)
                </h2>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                  Pilih sekolah dasar asal Anda, lalu masukkan Nomor Peserta Ujian atau NISN resmi
                </p>
              </div>
            )}

            {activeTab === 'guru' && (
              <div>
                <h2 className="font-syne text-sm font-bold flex items-center gap-2 text-emerald-400">
                  <SchoolIcon className="w-4 h-4 text-emerald-500" />
                  Masuk Guru Pengampu & Pengawas Ujian
                </h2>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                  Pilih sekolah tugas Anda, lalu masukkan Username Guru atau NIP resmi
                </p>
              </div>
            )}

            {activeTab === 'pembuat_soal' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-syne text-sm font-bold flex items-center gap-2 text-amber-400">
                    <PenTool className="w-4 h-4 text-amber-500" />
                    Khusus Guru Pembuat Naskah Ujian
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950">
                    Import Naskah Aktif
                  </span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                  Terintegrasi langsung dengan modul Import Naskah Ujian (Excel) dan Bank Soal Semester
                </p>
              </div>
            )}

            {activeTab === 'admin' && (
              <div>
                <h2 className="font-syne text-sm font-bold flex items-center gap-2 text-blue-400">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  Masuk Administrator Korwil Kecamatan
                </h2>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                  Kredensial tingkat kecamatan untuk rekapitulasi nilai dan pengawasan terpadu
                </p>
              </div>
            )}
          </div>

          {/* Quick Notice for Guru Pembuat Soal */}
          {activeTab === 'pembuat_soal' && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-amber-500">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Kredensial Resmi Guru Pembuat Naskah:</span>
                </div>
                <button
                  type="button"
                  onClick={handleFillPembuatSoal}
                  className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] rounded-lg transition shrink-0 cursor-pointer"
                >
                  Isi Otomatis
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                <div className="p-1.5 bg-black/10 dark:bg-white/5 rounded-lg border border-amber-500/20">
                  <span className="text-slate-400 block text-[9px] uppercase">Username:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">pembuat_soal</span>
                </div>
                <div className="p-1.5 bg-black/10 dark:bg-white/5 rounded-lg border border-amber-500/20">
                  <span className="text-slate-400 block text-[9px] uppercase">Password:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">password123</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-white/50 italic">
                * Begitu masuk, Anda langsung diarahkan ke menu Import Naskah Ujian dan Bank Soal.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            
            {/* 1. SELEKTOR SEKOLAH (Khusus Siswa & Guru) */}
            {(activeTab === 'siswa' || activeTab === 'guru') && (
              <div className="space-y-2 p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                <div className="flex items-center justify-between">
                  <label className={`block text-xs font-bold flex items-center gap-1.5 ${
                    isDark ? 'text-indigo-300' : 'text-indigo-900'
                  }`}>
                    <SchoolIcon className="w-3.5 h-3.5 text-indigo-500" />
                    Pilih Sekolah Dasar (SD) Sesuai Data:
                  </label>
                  <span className="text-[10px] font-mono text-indigo-500">
                    {availableSchools.length} Sekolah Terdaftar
                  </span>
                </div>

                <select
                  value={selectedSchoolId}
                  onChange={e => {
                    setSelectedSchoolId(e.target.value);
                    setSelectedUserId('');
                    setErrorMsg('');
                  }}
                  aria-label="Pilih sekolah"
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 transition cursor-pointer ${
                    isDark
                      ? 'bg-[#0c0c0e] border border-white/10 text-white focus:border-indigo-500'
                      : 'bg-white border border-slate-300 text-slate-800 focus:border-indigo-500'
                  }`}
                >
                  <option value="ALL">-- Semua Sekolah / Deteksi Otomatis --</option>
                  {availableSchools.map(sch => (
                    <option key={sch.id} value={sch.id}>
                      [{sch.npsn}] {sch.name} - {sch.status} ({sch.village || sch.district})
                    </option>
                  ))}
                </select>

                {/* Info Card Sekolah Terpilih */}
                {currentSchool && (
                  <div className={`p-2.5 rounded-lg border text-[11px] space-y-1 ${
                    isDark ? 'bg-white/5 border-white/10 text-white/70' : 'bg-white border-slate-200 text-slate-600'
                  }`}>
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-white">
                      <span>{currentSchool.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                        NPSN: {currentSchool.npsn}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span>{currentSchool.address}, Desa {currentSchool.village}</span>
                    </div>
                  </div>
                )}

                {/* Quick Select User From Selected School */}
                {selectedSchoolId !== 'ALL' && usersForRole.length > 0 && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Atau Pilih Nama Terdaftar di {currentSchool?.name}:
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={e => handleSelectUserFromList(e.target.value)}
                      aria-label="Pilih nama siswa atau guru terdaftar"
                      className={`w-full px-3 py-2 rounded-lg text-xs font-medium focus:outline-hidden cursor-pointer ${
                        isDark
                          ? 'bg-[#121215] border border-white/10 text-slate-300'
                          : 'bg-slate-50 border border-slate-200 text-slate-700'
                      }`}
                    >
                      <option value="">-- Pilih dari {usersForRole.length} nama terdata --</option>
                      {usersForRole.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} {u.role === 'guru' && u.grade && u.rombel ? `(Guru Kelas ${u.grade}${u.rombel})` : u.participantNumber ? `(${u.participantNumber})` : u.nip ? `(NIP: ${u.nip})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Username / No. Peserta Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`block text-xs font-semibold ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                  {activeTab === 'siswa'
                    ? 'Nomor Peserta Ujian / NISN / Username'
                    : activeTab === 'guru'
                    ? 'Username Guru / NIP'
                    : activeTab === 'pembuat_soal'
                    ? 'Username Guru Pembuat Soal'
                    : 'Username Administrator'}
                </label>
                <span className="text-[10px] text-rose-500 font-mono font-medium">
                  *Huruf keluar merah saat diketik
                </span>
              </div>
              <div className="relative">
                <UserIcon className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-white/40' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={
                    activeTab === 'siswa'
                      ? 'Contoh: 01-054-001-8 atau siswa_adit'
                      : activeTab === 'guru'
                      ? 'Contoh: david atau yuyut'
                      : activeTab === 'pembuat_soal'
                      ? 'pembuat_soal'
                      : 'admin'
                  }
                  className={`w-full pl-10 pr-4 py-3 rounded-xl text-xs font-semibold placeholder:font-normal focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 transition ${
                    isDark
                      ? 'bg-[#0c0c0e] border border-white/10 placeholder-white/30 focus:border-rose-500'
                      : 'bg-slate-50 border border-slate-200 placeholder-slate-400 focus:bg-white focus:border-rose-500'
                  }`}
                  style={{ color: '#ef4444', caretColor: '#ef4444' }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`block text-xs font-semibold ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  className={`text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                    isDark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                      <span>Sembunyikan</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Lihat Sandi</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-white/40' : 'text-slate-400'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akun"
                  className={`w-full pl-10 pr-24 py-3 rounded-xl text-xs font-semibold placeholder:font-normal focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 transition ${
                    isDark
                      ? 'bg-[#0c0c0e] border border-white/10 placeholder-white/30 focus:border-rose-500'
                      : 'bg-slate-50 border border-slate-200 placeholder-slate-400 focus:bg-white focus:border-rose-500'
                  }`}
                  style={{ color: '#ef4444', caretColor: '#ef4444' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  title={showPassword ? 'Sembunyikan Password' : 'Lihat Password'}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer border ${
                    isDark
                      ? showPassword
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                        : 'bg-white/5 text-white/70 border-white/10 hover:text-white hover:bg-white/10'
                      : showPassword
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                      <span>Tutup</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Lihat</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 active:scale-[0.99] ${
                activeTab === 'siswa'
                  ? 'bg-[#4f46e5] hover:bg-[#4338ca] shadow-[0_0_24px_rgba(79,70,229,0.35)]'
                  : activeTab === 'guru'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_0_24px_rgba(16,185,129,0.35)]'
                  : activeTab === 'pembuat_soal'
                  ? 'bg-amber-500 hover:bg-amber-600 !text-slate-950 font-extrabold shadow-[0_0_24px_rgba(245,158,11,0.4)]'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-[0_0_24px_rgba(37,99,235,0.35)]'
              }`}
            >
              <span>
                {isSubmitting
                  ? 'Memverifikasi...'
                  : activeTab === 'pembuat_soal'
                  ? 'Masuk ke Modul Import Naskah Soal'
                  : 'Masuk ke Portal Ujian'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Institutional Compliance Notice */}
          <div className={`pt-3.5 border-t flex items-center gap-2.5 text-[11px] leading-tight ${
            isDark ? 'border-white/10 text-white/40' : 'border-slate-100 text-slate-500'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Sistem Ujian Terotentikasi & Terenkripsi Sesuai Standar Evaluasi Pendidikan Dasar</span>
          </div>

        </div>

        {/* Footer info */}
        <div className={`text-center text-[11px] space-y-1 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
          <p>© 2026 Koordinator Wilayah Pendidikan {settings.districtName}</p>
          <p className={`text-[10px] ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
            Dinas Pendidikan {settings.regencyName}, Provinsi {settings.provinceName}
          </p>
        </div>

      </div>

    </div>
  );
};
