import React, { useState, useEffect } from 'react';
import {
  User,
  School,
  Question,
  ExamPackage,
  StudentExamSession,
  Subject,
  ClassItem,
  SystemSettings,
  ActivityLog
} from './types';
import { AppStorage } from './services/storage';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ToastContainer, ToastMessage } from './components/Toast';
import { BackendIntegrationNotice } from './components/BackendIntegrationNotice';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobilePageExplainer } from './components/MobilePageExplainer';

// Views
import { LoginPage } from './views/auth/LoginPage';
import { AdminDashboard } from './views/admin/AdminDashboard';
import { DataSekolah } from './views/admin/DataSekolah';
import { DataGuru } from './views/admin/DataGuru';
import { DataSiswa } from './views/admin/DataSiswa';
import { DataKelasView } from './views/admin/DataKelasView';
import { MataPelajaranView } from './views/admin/MataPelajaranView';
import { BankSoal } from './views/admin/BankSoal';
import { ImporSoal } from './views/admin/ImporSoal';
import { PembuatSoalView } from './views/admin/PembuatSoalView';
import { PreviewSoalView } from './views/admin/PreviewSoalView';
import { PaketUjian } from './views/admin/PaketUjian';
import { PesertaUjianView } from './views/admin/PesertaUjianView';
import { MonitoringUjian } from './views/admin/MonitoringUjian';
import { HasilUjianView } from './views/admin/HasilUjianView';
import { LaporanNilai } from './views/admin/LaporanNilai';
import { EksporCenter } from './views/admin/EksporCenter';
import { ManajemenAkunView } from './views/admin/ManajemenAkunView';
import { PengaturanSistem } from './views/admin/PengaturanSistem';
import { RiwayatAktivitas } from './views/admin/RiwayatAktivitas';
import { GoogleSheetsCenter } from './views/admin/GoogleSheetsCenter';

// Teacher Views
import { GuruDashboard } from './views/guru/GuruDashboard';
import { GuruBuatSoalView } from './views/guru/GuruBuatSoalView';
import { GuruHasilUjianView } from './views/guru/GuruHasilUjianView';

// Student Views
import { SiswaDashboard } from './views/siswa/SiswaDashboard';
import { SiswaJadwalView } from './views/siswa/SiswaJadwalView';
import { SiswaHasilView } from './views/siswa/SiswaHasilView';
import { UjianCBT } from './views/siswa/UjianCBT';

export default function App() {
  // Central Reactive State from AppStorage
  const [settings, setSettings] = useState<SystemSettings>(() => AppStorage.getSettings());
  const [schools, setSchools] = useState<School[]>(() => AppStorage.getSchools());
  const [users, setUsers] = useState<User[]>(() => AppStorage.getUsers());
  const [subjects, setSubjects] = useState<Subject[]>(() => AppStorage.getSubjects());
  const [classes, setClasses] = useState<ClassItem[]>(() => AppStorage.getClasses());
  const [questions, setQuestions] = useState<Question[]>(() => AppStorage.getQuestions());
  const [packages, setPackages] = useState<ExamPackage[]>(() => AppStorage.getExamPackages());
  const [sessions, setSessions] = useState<StudentExamSession[]>(() => AppStorage.getExamSessions());
  const [logs, setLogs] = useState<ActivityLog[]>(() => AppStorage.getActivityLogs());
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return AppStorage.getCurrentUser();
  });

  // UI Navigation State
  const [currentTab, setCurrentTab] = useState<string>('admin-dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Theme Mode State: 'dark' (Mode Malam) | 'light' (Mode Siang)
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('ampelgading_theme_mode');
    return stored === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('ampelgading_theme_mode', themeMode);
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
  }, [themeMode]);

  const handleToggleTheme = () => {
    setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Active CBT Exam session state for Student
  const [activeExamPackage, setActiveExamPackage] = useState<ExamPackage | null>(null);

  // Initialize storage seed & reactive subscription
  useEffect(() => {
    AppStorage.initialize();

    // Sync state immediately upon mount
    setSettings(AppStorage.getSettings());
    setSchools(AppStorage.getSchools());
    setUsers(AppStorage.getUsers());
    setSubjects(AppStorage.getSubjects());
    setClasses(AppStorage.getClasses());
    setQuestions(AppStorage.getQuestions());
    setPackages(AppStorage.getExamPackages());
    setSessions(AppStorage.getExamSessions());
    setLogs(AppStorage.getActivityLogs());

    const unsubscribe = AppStorage.subscribe(() => {
      setSettings(AppStorage.getSettings());
      setSchools(AppStorage.getSchools());
      setUsers(AppStorage.getUsers());
      setSubjects(AppStorage.getSubjects());
      setClasses(AppStorage.getClasses());
      setQuestions(AppStorage.getQuestions());
      setPackages(AppStorage.getExamPackages());
      setSessions(AppStorage.getExamSessions());
      setLogs(AppStorage.getActivityLogs());
    });
    return unsubscribe;
  }, []);

  // Update default tab when role changes
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'admin' && !currentTab.startsWith('admin-')) {
      setCurrentTab('admin-dashboard');
    } else if (currentUser.role === 'guru' && !currentTab.startsWith('guru-')) {
      setCurrentTab('guru-dashboard');
    } else if (currentUser.role === 'siswa' && !currentTab.startsWith('siswa-')) {
      setCurrentTab('siswa-dashboard');
    }
  }, [currentUser]);

  // Toast Notification Trigger
  const showToast = (type: 'success' | 'error' | 'info', title: string, desc?: string) => {
    const id = 'toast-' + Date.now();
    setToasts(prev => [...prev, { id, type, title, description: desc }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleLogin = (user: User) => {
    AppStorage.setCurrentUser(user);
    setCurrentUser(user);
    if (user.role === 'admin') setCurrentTab('admin-dashboard');
    else if (user.role === 'guru') setCurrentTab('guru-dashboard');
    else if (user.role === 'siswa') setCurrentTab('siswa-dashboard');
    setActiveExamPackage(null);
  };

  const handleLogout = () => {
    AppStorage.setCurrentUser(null);
    setCurrentUser(null);
    setActiveExamPackage(null);
    showToast('info', 'Telah Keluar', 'Sesi login Anda telah diakhiri.');
  };

  const handleSwitchUser = (user: User) => {
    handleLogin(user);
  };

  const handleStartExam = (pkg: ExamPackage) => {
    setActiveExamPackage(pkg);
  };

  const handleFinishExam = () => {
    setActiveExamPackage(null);
    setCurrentTab('siswa-dashboard');
  };

  // If not logged in, render the login page
  if (!currentUser) {
    return (
      <>
        <LoginPage
          allUsers={users}
          schools={schools}
          settings={settings}
          themeMode={themeMode}
          onToggleTheme={handleToggleTheme}
          onLogin={handleLogin}
          showToast={showToast}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // If student is currently taking a CBT exam, render distraction-free CBT Engine
  if (currentUser.role === 'siswa' && activeExamPackage) {
    const studentSchool = schools.find(s => s.id === currentUser.schoolId) || schools[0];
    const examSubject = subjects.find(s => s.id === activeExamPackage.subjectId);

    return (
      <div className={`min-h-screen p-3 sm:p-6 font-sans transition-colors duration-200 ${
        themeMode === 'dark' ? 'bg-[#0c0c0e] text-[#f2f2f2]' : 'bg-slate-100 text-slate-900'
      }`}>
        <UjianCBT
          examPackage={activeExamPackage}
          currentUser={currentUser}
          school={studentSchool}
          questions={questions}
          subject={examSubject}
          onFinishExam={handleFinishExam}
          showToast={showToast}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  const studentSchool = schools.find(s => s.id === currentUser.schoolId) || schools[0];
  const teacherSchool = schools.find(s => s.id === currentUser.schoolId) || schools[0];

  // Main Authenticated Dashboard Shell
  return (
    <div className={`min-h-screen flex flex-col font-geist selection:bg-indigo-600 selection:text-white transition-colors duration-200 ${
      themeMode === 'dark' ? 'bg-[#0c0c0e] text-[#f2f2f2]' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Top Navbar Header */}
      <Header
        currentUser={currentUser}
        settings={settings}
        themeMode={themeMode}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onSwitchUser={handleSwitchUser}
        allUsers={users}
      />

      <div className="flex-1 flex">
        {/* Left Sidebar with role-based navigation */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          userRole={currentUser.role}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onLogout={handleLogout}
          themeMode={themeMode}
        />

        {/* Content Area */}
        <main className={`flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 sm:pb-28 lg:pb-8 overflow-y-auto max-w-7xl mx-auto w-full transition-colors duration-200 ${
          themeMode === 'dark' ? 'text-[#f2f2f2]' : 'text-slate-900'
        }`}>
          {/* Mobile-Friendly Explainer & Quick Action Banner (Shown on mobile screens) */}
          <MobilePageExplainer
            currentTab={currentTab}
            userRole={currentUser.role}
            onNavigate={setCurrentTab}
            themeMode={themeMode}
            districtName={settings.districtName}
            totalQuestions={questions.length}
            totalStudents={users.filter(u => u.role === 'siswa').length}
            totalSchools={schools.length}
          />

          {/* Transparent Storage & Backend Architecture Notice */}
          <BackendIntegrationNotice />
          
          {/* ==================== 1. ADMIN KECAMATAN VIEWS (18 MENUS) ==================== */}
          {currentUser.role === 'admin' && (
            <>
              {/* 1. Dashboard */}
              {currentTab === 'admin-dashboard' && (
                <AdminDashboard
                  schools={schools}
                  users={users}
                  questions={questions}
                  packages={packages}
                  sessions={sessions}
                  subjects={subjects}
                  settings={settings}
                  onNavigate={setCurrentTab}
                  themeMode={themeMode}
                />
              )}

              {/* 2. Data Sekolah */}
              {currentTab === 'admin-sekolah' && (
                <DataSekolah
                  schools={schools}
                  settings={settings}
                  onRefresh={() => setSchools(AppStorage.getSchools())}
                  showToast={showToast}
                  onNavigate={setCurrentTab}
                />
              )}

              {/* 3. Data Guru */}
              {currentTab === 'admin-guru' && (
                <ErrorBoundary fallbackTitle="Kendala Memuat Halaman Data Guru" onReset={() => setUsers(AppStorage.getUsers())}>
                  <DataGuru
                    users={users}
                    schools={schools}
                    subjects={subjects}
                    classes={classes}
                    settings={settings}
                    onRefresh={() => setUsers(AppStorage.getUsers())}
                    showToast={showToast}
                    themeMode={themeMode}
                    onNavigate={setCurrentTab}
                  />
                </ErrorBoundary>
              )}

              {/* 4. Data Siswa */}
              {currentTab === 'admin-siswa' && (
                <DataSiswa
                  users={users}
                  schools={schools}
                  classes={classes}
                  settings={settings}
                  onRefresh={() => setUsers(AppStorage.getUsers())}
                  showToast={showToast}
                  onNavigate={setCurrentTab}
                />
              )}

              {/* 5. Data Kelas */}
              {currentTab === 'admin-kelas' && (
                <DataKelasView
                  classes={classes}
                  schools={schools}
                  users={users}
                  onRefresh={() => setClasses(AppStorage.getClasses())}
                  showToast={showToast}
                />
              )}

              {/* 6. Mata Pelajaran */}
              {currentTab === 'admin-mapel' && (
                <MataPelajaranView
                  subjects={subjects}
                  questions={questions}
                  users={users}
                  onRefresh={() => setSubjects(AppStorage.getSubjects())}
                  showToast={showToast}
                />
              )}

              {/* 7. Bank Soal */}
              {currentTab === 'admin-bank-soal' && (
                <BankSoal
                  questions={questions}
                  subjects={subjects}
                  authorName={currentUser.fullName}
                  authorRole={currentUser.role}
                  schoolId={currentUser.schoolId}
                  onRefresh={() => setQuestions(AppStorage.getQuestions())}
                  showToast={showToast}
                  onNavigate={setCurrentTab}
                />
              )}

              {/* 8. Impor Soal */}
              {currentTab === 'admin-impor-soal' && (
                <ImporSoal
                  subjects={subjects}
                  authorName={currentUser.fullName}
                  authorRole={currentUser.role}
                  onRefresh={() => setQuestions(AppStorage.getQuestions())}
                  showToast={showToast}
                  onNavigate={setCurrentTab}
                />
              )}

              {/* 9. Pembuat Soal */}
              {currentTab === 'admin-pembuat-soal' && (
                <ErrorBoundary fallbackTitle="Kendala Memuat Halaman Pembuat Soal" onReset={() => setUsers(AppStorage.getUsers())}>
                  <PembuatSoalView
                    users={users}
                    schools={schools}
                    subjects={subjects}
                    questions={questions}
                    settings={settings}
                    onRefresh={() => {
                      setUsers(AppStorage.getUsers());
                      setQuestions(AppStorage.getQuestions());
                    }}
                    showToast={showToast}
                    themeMode={themeMode}
                    onNavigate={setCurrentTab}
                  />
                </ErrorBoundary>
              )}

              {/* 10. Preview Soal CBT */}
              {currentTab === 'admin-preview-soal' && (
                <ErrorBoundary fallbackTitle="Kendala Memuat Preview Soal" onReset={() => setQuestions(AppStorage.getQuestions())}>
                  <PreviewSoalView
                    questions={questions}
                    subjects={subjects}
                    schools={schools}
                    users={users}
                    settings={settings}
                    currentUser={currentUser}
                    onNavigate={setCurrentTab}
                    showToast={showToast}
                    themeMode={themeMode}
                  />
                </ErrorBoundary>
              )}

              {/* 11. Paket Ujian */}
              {currentTab === 'admin-paket-ujian' && (
                <PaketUjian
                  packages={packages}
                  subjects={subjects}
                  schools={schools}
                  questions={questions}
                  settings={settings}
                  onRefresh={() => setPackages(AppStorage.getExamPackages())}
                  showToast={showToast}
                />
              )}

              {/* 10. Jadwal Ujian */}
              {currentTab === 'admin-jadwal-ujian' && (
                <PaketUjian
                  packages={packages}
                  subjects={subjects}
                  schools={schools}
                  questions={questions}
                  settings={settings}
                  onRefresh={() => setPackages(AppStorage.getExamPackages())}
                  showToast={showToast}
                />
              )}

              {/* 11. Peserta Ujian */}
              {currentTab === 'admin-peserta-ujian' && (
                <PesertaUjianView
                  users={users}
                  schools={schools}
                  classes={classes}
                  settings={settings}
                  showToast={showToast}
                />
              )}

              {/* 12. Monitoring Ujian */}
              {currentTab === 'admin-monitoring' && (
                <MonitoringUjian
                  packages={packages}
                  sessions={sessions}
                  schools={schools}
                  users={users}
                  onRefresh={() => setSessions(AppStorage.getExamSessions())}
                  showToast={showToast}
                />
              )}

              {/* 13. Hasil Ujian */}
              {currentTab === 'admin-hasil-ujian' && (
                <HasilUjianView
                  sessions={sessions}
                  packages={packages}
                  schools={schools}
                  settings={settings}
                  showToast={showToast}
                />
              )}

              {/* 14. Laporan dan Cetak Nilai */}
              {currentTab === 'admin-laporan' && (
                <LaporanNilai
                  schools={schools}
                  packages={packages}
                  sessions={sessions}
                  subjects={subjects}
                  users={users}
                  settings={settings}
                  currentRole={currentUser.role}
                  currentUserSchoolId={currentUser.schoolId}
                  showToast={showToast}
                />
              )}

              {/* 15. Ekspor Data */}
              {currentTab === 'admin-ekspor' && (
                <EksporCenter
                  schools={schools}
                  users={users}
                  questions={questions}
                  packages={packages}
                  sessions={sessions}
                  subjects={subjects}
                  settings={settings}
                  showToast={showToast}
                />
              )}

              {/* 16. Manajemen Akun */}
              {currentTab === 'admin-manajemen-akun' && (
                <ManajemenAkunView
                  users={users}
                  schools={schools}
                  onRefresh={() => setUsers(AppStorage.getUsers())}
                  showToast={showToast}
                />
              )}

              {/* 17. Pengaturan Sistem */}
              {currentTab === 'admin-pengaturan' && (
                <PengaturanSistem
                  settings={settings}
                  onRefresh={() => setSettings(AppStorage.getSettings())}
                  showToast={showToast}
                />
              )}

              {/* 18. Riwayat Aktivitas */}
              {currentTab === 'admin-riwayat' && (
                <RiwayatAktivitas logs={logs} />
              )}

              {/* 21. Integrasi Google Sheets Master */}
              {currentTab === 'admin-spreadsheet-sync' && (
                <GoogleSheetsCenter
                  schools={schools}
                  users={users}
                  questions={questions}
                  subjects={subjects}
                  settings={settings}
                  onRefresh={() => {
                    setSchools(AppStorage.getSchools());
                    setUsers(AppStorage.getUsers());
                    setQuestions(AppStorage.getQuestions());
                  }}
                  showToast={showToast}
                  themeMode={themeMode}
                  onNavigate={setCurrentTab}
                />
              )}
            </>
          )}

          {/* ==================== 2. GURU VIEWS (10 MENUS) ==================== */}
          {currentUser.role === 'guru' && (() => {
            const teacherGrade = currentUser.grade || 6;
            const teacherRombel = (currentUser.rombel || 'A').toUpperCase();
            const taughtStudents = users.filter(
              u => u.role === 'siswa' &&
                   u.schoolId === currentUser.schoolId &&
                   u.grade === teacherGrade &&
                   (u.rombel || 'A').toUpperCase() === teacherRombel
            );
            const taughtClasses = classes.filter(
              c => c.grade === teacherGrade && (c.rombel || 'A').toUpperCase() === teacherRombel
            );
            const classSessions = sessions.filter(
              s => s.schoolId === currentUser.schoolId &&
                   s.grade === teacherGrade &&
                   (s.rombel || 'A').toUpperCase() === teacherRombel
            );

            return (
              <>
                {/* 1. Dashboard */}
                {currentTab === 'guru-dashboard' && (
                  <GuruDashboard
                    currentUser={currentUser}
                    schools={schools}
                    users={users}
                    questions={questions}
                    packages={packages}
                    sessions={sessions}
                    subjects={subjects}
                    settings={settings}
                    onNavigate={setCurrentTab}
                  />
                )}

                {/* 2. Data Siswa (Hanya Siswa di Kelas yang Diampu) */}
                {currentTab === 'guru-siswa' && (
                  <DataSiswa
                    users={taughtStudents}
                    schools={schools.filter(s => s.id === currentUser.schoolId)}
                    classes={
                      taughtClasses.length > 0
                        ? taughtClasses
                        : [
                            {
                              id: `cls-${teacherGrade}${teacherRombel.toLowerCase()}`,
                              grade: teacherGrade,
                              rombel: teacherRombel,
                              name: `Kelas ${teacherGrade}${teacherRombel}`
                            }
                          ]
                    }
                    settings={settings}
                    onRefresh={() => setUsers(AppStorage.getUsers())}
                    showToast={showToast}
                  />
                )}

                {/* 2. Import Naskah Ujian (Khusus Guru / Pembuat Soal) */}
                {(currentTab === 'guru-impor-naskah' || currentTab === 'guru-impor-soal') && (
                  <ImporSoal
                    subjects={subjects}
                    authorName={currentUser.fullName}
                    authorRole={currentUser.role}
                    onRefresh={() => setQuestions(AppStorage.getQuestions())}
                    showToast={showToast}
                    onNavigate={setCurrentTab}
                  />
                )}

                {/* 3. Bank Soal */}
                {currentTab === 'guru-bank-soal' && (
                  <BankSoal
                    questions={questions}
                    subjects={subjects}
                    authorName={currentUser.fullName}
                    authorRole={currentUser.role}
                    schoolId={currentUser.schoolId}
                    onRefresh={() => setQuestions(AppStorage.getQuestions())}
                    showToast={showToast}
                    onNavigate={setCurrentTab}
                  />
                )}

                {/* 4. Buat dan Edit Soal */}
                {currentTab === 'guru-buat-soal' && (
                  <GuruBuatSoalView
                    currentUser={currentUser}
                    questions={questions}
                    subjects={subjects}
                    onRefresh={() => setQuestions(AppStorage.getQuestions())}
                    showToast={showToast}
                  />
                )}

                {/* 5. Preview Tampilan Soal */}
                {currentTab === 'guru-preview-soal' && (
                  <ErrorBoundary fallbackTitle="Kendala Memuat Preview Soal" onReset={() => setQuestions(AppStorage.getQuestions())}>
                    <PreviewSoalView
                      questions={questions}
                      subjects={subjects}
                      schools={schools}
                      users={users}
                      settings={settings}
                      currentUser={currentUser}
                      onNavigate={setCurrentTab}
                      showToast={showToast}
                      themeMode={themeMode}
                    />
                  </ErrorBoundary>
                )}

                {/* 6. Paket Soal */}
                {currentTab === 'guru-paket-soal' && (
                  <PaketUjian
                    packages={packages}
                    subjects={subjects}
                    schools={schools}
                    questions={questions}
                    settings={settings}
                    onRefresh={() => setPackages(AppStorage.getExamPackages())}
                    showToast={showToast}
                  />
                )}

                {/* 6. Jadwal Ujian */}
                {currentTab === 'guru-jadwal-ujian' && (
                  <PaketUjian
                    packages={packages}
                    subjects={subjects}
                    schools={schools}
                    questions={questions}
                    settings={settings}
                    onRefresh={() => setPackages(AppStorage.getExamPackages())}
                    showToast={showToast}
                  />
                )}

                {/* 7. Monitoring Siswa (Khusus Kelas Binaan) */}
                {currentTab === 'guru-monitoring' && (
                  <MonitoringUjian
                    packages={packages}
                    sessions={classSessions}
                    schools={schools.filter(s => s.id === currentUser.schoolId)}
                    users={taughtStudents}
                    onRefresh={() => setSessions(AppStorage.getExamSessions())}
                    showToast={showToast}
                  />
                )}

                {/* 8. Hasil Ujian (Khusus Kelas Binaan) */}
                {currentTab === 'guru-hasil-ujian' && (
                  <GuruHasilUjianView
                    currentUser={currentUser}
                    sessions={classSessions}
                    packages={packages}
                    school={teacherSchool}
                    settings={settings}
                    showToast={showToast}
                  />
                )}

                {/* 9. Laporan Nilai (Khusus Kelas Binaan) */}
                {currentTab === 'guru-laporan' && (
                  <LaporanNilai
                    schools={schools.filter(s => s.id === currentUser.schoolId)}
                    packages={packages}
                    sessions={classSessions}
                    subjects={subjects}
                    users={taughtStudents}
                    settings={settings}
                    currentRole={currentUser.role}
                    currentUserSchoolId={currentUser.schoolId}
                    currentUserGrade={teacherGrade}
                    currentUserRombel={teacherRombel}
                    showToast={showToast}
                  />
                )}

                {/* 10. Profil */}
                {currentTab === 'guru-profil' && (
                  <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-2xl shadow-sm space-y-5">
                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                          Profil Tenaga Pendidik
                        </span>
                        <h3 className="font-black text-slate-900 text-lg mt-1">{currentUser.fullName}</h3>
                      </div>
                      <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-xs">
                        Guru Kelas {teacherGrade}{teacherRombel}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-slate-400 font-medium">NIP Guru</p>
                        <p className="font-mono text-slate-800 font-bold mt-0.5">{currentUser.nip || '-'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-slate-400 font-medium">Sekolah Tugas</p>
                        <p className="font-bold text-slate-800 mt-0.5">{teacherSchool.name}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-slate-400 font-medium">Kelas yang Diampu (Fokus 1 Kelas)</p>
                        <p className="font-bold text-emerald-700 mt-0.5">Kelas {teacherGrade}{teacherRombel}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-slate-400 font-medium">Siswa Terdaftar di Roster</p>
                        <p className="font-bold text-slate-800 mt-0.5">{taughtStudents.length} Siswa</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-slate-400 font-medium">Username Login</p>
                        <p className="font-mono text-slate-800 font-bold mt-0.5">{currentUser.username}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-slate-400 font-medium">Kontak / Telepon</p>
                        <p className="font-medium text-slate-800 mt-0.5">{currentUser.phone || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 13. Integrasi Google Sheets Soal Guru */}
                {currentTab === 'guru-spreadsheet-sync' && (
                  <GoogleSheetsCenter
                    schools={schools}
                    users={users}
                    questions={questions}
                    subjects={subjects}
                    settings={settings}
                    onRefresh={() => {
                      setQuestions(AppStorage.getQuestions());
                    }}
                    showToast={showToast}
                    themeMode={themeMode}
                    onNavigate={setCurrentTab}
                  />
                )}
              </>
            );
          })()}

          {/* ==================== 3. SISWA VIEWS (6 MENUS) ==================== */}
          {currentUser.role === 'siswa' && (
            <>
              {/* 1. Dashboard */}
              {currentTab === 'siswa-dashboard' && (
                <SiswaDashboard
                  currentUser={currentUser}
                  schools={schools}
                  packages={packages}
                  sessions={sessions}
                  subjects={subjects}
                  settings={settings}
                  onStartExam={handleStartExam}
                  onNavigate={setCurrentTab}
                />
              )}

              {/* 2. Profil Saya */}
              {currentTab === 'siswa-profil' && (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-xl shadow-lg space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      Kartu Peserta Ujian Semester SD
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">{currentUser.fullName}</h3>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-400">Nomor Peserta Ujian:</span>
                      <span className="font-mono font-black text-blue-700">{currentUser.participantNumber}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-400">NISN Siswa:</span>
                      <span className="font-mono font-bold text-slate-700">{currentUser.nisn}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-400">Asal Sekolah:</span>
                      <span className="font-bold text-slate-800">{studentSchool.name}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-400">Kelas / Rombel:</span>
                      <span className="font-semibold text-slate-800">Kelas {currentUser.grade}{currentUser.rombel}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">Status CBT:</span>
                      <span className="font-bold text-emerald-600">Peserta Ujian Terverifikasi DNT</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Jadwal Ujian */}
              {currentTab === 'siswa-jadwal' && (
                <SiswaJadwalView
                  currentUser={currentUser}
                  packages={packages}
                  subjects={subjects}
                  school={studentSchool}
                  onStartExam={handleStartExam}
                />
              )}

              {/* 4. Ujian Tersedia */}
              {currentTab === 'siswa-ujian-tersedia' && (
                <SiswaDashboard
                  currentUser={currentUser}
                  schools={schools}
                  packages={packages}
                  sessions={sessions}
                  subjects={subjects}
                  settings={settings}
                  onStartExam={handleStartExam}
                  onNavigate={setCurrentTab}
                />
              )}

              {/* 5. Riwayat Ujian */}
              {currentTab === 'siswa-riwayat' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Riwayat Pengerjaan Ujian Semester</h3>
                  <div className="space-y-3">
                    {sessions.filter(s => s.studentId === currentUser.id).length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center">Belum ada riwayat pengerjaan ujian.</p>
                    ) : (
                      sessions
                        .filter(s => s.studentId === currentUser.id)
                        .map(s => {
                          const pkg = packages.find(p => p.id === s.examPackageId);
                          return (
                            <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-slate-900">{pkg?.title || 'Ujian Semester'}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Waktu: {s.finishedAt ? s.finishedAt.replace('T', ' ').slice(0, 16) : '-'} • {s.totalCorrect} Benar, {s.totalIncorrect} Salah
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Nilai CBT</span>
                                <span className="text-xl font-black text-blue-700">{s.score}</span>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              )}

              {/* 6. Hasil Ujian jika diizinkan */}
              {currentTab === 'siswa-hasil-ujian' && (
                <SiswaHasilView
                  currentUser={currentUser}
                  sessions={sessions}
                  packages={packages}
                  school={studentSchool}
                  settings={settings}
                />
              )}
            </>
          )}

        </main>
      </div>

      {/* Mobile Floating Bottom Dock Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        userRole={currentUser.role}
        onOpenFullMenu={() => setIsSidebarOpen(true)}
        themeMode={themeMode}
      />

      {/* Global Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

    </div>
  );
}
