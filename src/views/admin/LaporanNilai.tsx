import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  Filter,
  Building2,
  Award,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Users,
  School as SchoolIcon,
  HelpCircle,
  Lock,
  ChevronRight,
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import { School, ExamPackage, StudentExamSession, Subject, SystemSettings, User } from '../../types';
import { ExcelService } from '../../services/excelService';

interface LaporanNilaiProps {
  schools: School[];
  packages: ExamPackage[];
  sessions: StudentExamSession[];
  subjects: Subject[];
  users: User[];
  settings: SystemSettings;
  currentRole: 'admin' | 'guru' | 'siswa';
  currentUserSchoolId?: string;
  currentUserGrade?: number;
  currentUserRombel?: string;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const LaporanNilai: React.FC<LaporanNilaiProps> = ({
  schools,
  packages,
  sessions,
  subjects,
  users,
  settings,
  currentRole,
  currentUserSchoolId,
  currentUserGrade,
  currentUserRombel,
  showToast
}) => {
  // If user is a teacher, lock to their assigned school and class
  const isTeacher = currentRole === 'guru';
  const defaultSchoolId = isTeacher && currentUserSchoolId ? currentUserSchoolId : schools[0]?.id || 'sch-01';

  // Active Report View Mode
  const [reportType, setReportType] = useState<'siswa' | 'sekolah' | 'mapel'>('siswa');

  // Filters State
  const [academicYearFilter, setAcademicYearFilter] = useState<string>(settings.academicYear || '2024/2025');
  const [semesterFilter, setSemesterFilter] = useState<'ALL' | 'Ganjil' | 'Genap'>(settings.activeSemester || 'Ganjil');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(defaultSchoolId);
  const [gradeFilter, setGradeFilter] = useState<string>(isTeacher && currentUserGrade ? String(currentUserGrade) : 'ALL');
  const [rombelFilter, setRombelFilter] = useState<string>(isTeacher && currentUserRombel ? currentUserRombel : 'ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [packageFilter, setPackageFilter] = useState<string>('ALL');

  // School locked for teacher
  const effectiveSchoolId = isTeacher ? defaultSchoolId : selectedSchoolId;
  const selectedSchool = schools.find(s => s.id === effectiveSchoolId) || schools[0];

  // Filtered Sessions from real exam results
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      // Must be completed / graded
      if (s.status !== 'graded' && s.status !== 'submitted') return false;

      // School filter
      if (effectiveSchoolId !== 'ALL' && s.schoolId !== effectiveSchoolId) {
        return false;
      }

      // Exam package lookup
      const pkg = packages.find(p => p.id === s.examPackageId);

      // Academic Year & Semester filter
      if (academicYearFilter !== 'ALL' && pkg && pkg.academicYear !== academicYearFilter) {
        return false;
      }
      if (semesterFilter !== 'ALL' && pkg && pkg.semester !== semesterFilter) {
        return false;
      }

      // Grade & Rombel filter
      if (gradeFilter !== 'ALL' && String(s.grade) !== gradeFilter) {
        return false;
      }
      if (rombelFilter !== 'ALL' && s.rombel !== rombelFilter) {
        return false;
      }

      // Subject filter
      if (subjectFilter !== 'ALL' && pkg && pkg.subjectId !== subjectFilter) {
        return false;
      }

      // Package filter
      if (packageFilter !== 'ALL' && s.examPackageId !== packageFilter) {
        return false;
      }

      return true;
    });
  }, [
    sessions,
    packages,
    effectiveSchoolId,
    academicYearFilter,
    semesterFilter,
    gradeFilter,
    rombelFilter,
    subjectFilter,
    packageFilter
  ]);

  // Statistics for Siswa Report
  const totalCount = filteredSessions.length;
  const avgScore = totalCount > 0 ? Math.round(filteredSessions.reduce((acc, s) => acc + s.score, 0) / totalCount) : 0;
  const maxScore = totalCount > 0 ? Math.max(...filteredSessions.map(s => s.score)) : 0;
  const minScore = totalCount > 0 ? Math.min(...filteredSessions.map(s => s.score)) : 0;
  const passedCount = filteredSessions.filter(s => s.score >= settings.defaultKkm).length;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const remedialCount = totalCount - passedCount;

  // Selected Exam and Subject info
  const selectedPkg = packages.find(p => p.id === packageFilter);
  const selectedSub = subjects.find(s => s.id === (selectedPkg ? selectedPkg.subjectId : subjectFilter));

  // 2. Data Rekap Per Sekolah
  const schoolSummaryData = useMemo(() => {
    return schools.map((sch, idx) => {
      // Find all graded sessions for this school
      const schSessions = sessions.filter(s => {
        if (s.status !== 'graded' && s.status !== 'submitted') return false;
        if (s.schoolId !== sch.id) return false;
        const pkg = packages.find(p => p.id === s.examPackageId);
        if (academicYearFilter !== 'ALL' && pkg && pkg.academicYear !== academicYearFilter) return false;
        if (semesterFilter !== 'ALL' && pkg && pkg.semester !== semesterFilter) return false;
        if (subjectFilter !== 'ALL' && pkg && pkg.subjectId !== subjectFilter) return false;
        if (packageFilter !== 'ALL' && s.examPackageId !== packageFilter) return false;
        if (gradeFilter !== 'ALL' && String(s.grade) !== gradeFilter) return false;
        return true;
      });

      const totalSt = schSessions.length;
      const avg = totalSt > 0 ? Math.round(schSessions.reduce((a, b) => a + b.score, 0) / totalSt) : 0;
      const max = totalSt > 0 ? Math.max(...schSessions.map(s => s.score)) : 0;
      const min = totalSt > 0 ? Math.min(...schSessions.map(s => s.score)) : 0;
      const passed = schSessions.filter(s => s.score >= settings.defaultKkm).length;
      const rate = totalSt > 0 ? `${Math.round((passed / totalSt) * 100)}%` : '0%';
      const remedial = totalSt - passed;

      return {
        no: idx + 1,
        schoolId: sch.id,
        npsn: sch.npsn,
        schoolName: sch.name,
        status: sch.status,
        totalStudents: totalSt,
        averageScore: avg,
        maxScore: max,
        minScore: min,
        passedCount: passed,
        passRate: rate,
        remedialCount: remedial
      };
    });
  }, [schools, sessions, packages, academicYearFilter, semesterFilter, subjectFilter, packageFilter, gradeFilter, settings.defaultKkm]);

  // 3. Data Rekap Per Mata Pelajaran
  const subjectSummaryData = useMemo(() => {
    return subjects.map((sub, idx) => {
      // Find all graded sessions for exams of this subject
      const subSessions = sessions.filter(s => {
        if (s.status !== 'graded' && s.status !== 'submitted') return false;
        if (effectiveSchoolId !== 'ALL' && s.schoolId !== effectiveSchoolId) return false;
        const pkg = packages.find(p => p.id === s.examPackageId);
        if (!pkg || pkg.subjectId !== sub.id) return false;
        if (academicYearFilter !== 'ALL' && pkg.academicYear !== academicYearFilter) return false;
        if (semesterFilter !== 'ALL' && pkg.semester !== semesterFilter) return false;
        if (gradeFilter !== 'ALL' && String(s.grade) !== gradeFilter) return false;
        return true;
      });

      const totalSt = subSessions.length;
      const avg = totalSt > 0 ? Math.round(subSessions.reduce((a, b) => a + b.score, 0) / totalSt) : 0;
      const max = totalSt > 0 ? Math.max(...subSessions.map(s => s.score)) : 0;
      const min = totalSt > 0 ? Math.min(...subSessions.map(s => s.score)) : 0;
      const passed = subSessions.filter(s => s.score >= settings.defaultKkm).length;
      const rate = totalSt > 0 ? `${Math.round((passed / totalSt) * 100)}%` : '0%';

      return {
        no: idx + 1,
        code: sub.code,
        subjectName: sub.name,
        totalParticipants: totalSt,
        averageScore: avg,
        maxScore: max,
        minScore: min,
        passedCount: passed,
        passRate: rate
      };
    });
  }, [subjects, sessions, packages, effectiveSchoolId, academicYearFilter, semesterFilter, gradeFilter, settings.defaultKkm]);

  // Handle Print and PDF Download
  const handlePrint = () => {
    window.print();
  };

  // Handle Excel Export based on active report mode
  const handleExportExcel = () => {
    if (reportType === 'siswa') {
      const examTitle = selectedPkg ? selectedPkg.title : 'Rekap_Ujian_Semester';
      const schName = selectedSchool ? selectedSchool.name : 'Sekolah';
      ExcelService.exportExamResults(filteredSessions, examTitle, schName, users);
      showToast('success', 'Ekspor Berhasil', 'Rekap nilai per siswa berhasil diunduh dalam format Excel XLSX.');
    } else if (reportType === 'sekolah') {
      ExcelService.exportSchoolSummary(
        schoolSummaryData,
        `Rekap_Nilai_Per_Sekolah_${settings.districtName.replace(/\s+/g, '_')}_${academicYearFilter.replace('/', '-')}`
      );
      showToast('success', 'Ekspor Berhasil', 'Rekapitulasi nilai per sekolah berhasil diunduh dalam format Excel XLSX.');
    } else if (reportType === 'mapel') {
      ExcelService.exportSubjectSummary(
        subjectSummaryData,
        `Rekap_Nilai_Per_Mata_Pelajaran_${academicYearFilter.replace('/', '-')}`
      );
      showToast('success', 'Ekspor Berhasil', 'Rekapitulasi capaian mata pelajaran berhasil diunduh dalam format Excel XLSX.');
    }
  };

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      
      {/* ================= CONTROLS & FILTERS BAR (HIDDEN IN PRINT) ================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 no-print">
        
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600 font-bold">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Laporan & Cetak Nilai Resmi Ujian Semester
                </h2>
                <p className="text-xs text-slate-500">
                  Daftar nilai riil, rekapitulasi sekolah, dan capaian mata pelajaran berstandar cetak A4
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition"
              title="Unduh data dalam format lembar kerja Excel .xlsx"
            >
              <Download className="w-4 h-4" />
              Ekspor XLSX
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
              title="Cetak langsung atau simpan sebagai PDF berukuran A4"
            >
              <Printer className="w-4 h-4" />
              Cetak / Unduh PDF
            </button>
          </div>
        </div>

        {/* Report Mode Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs font-bold overflow-x-auto max-w-full pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setReportType('siswa')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              reportType === 'siswa'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">1. Daftar Nilai Siswa (Format Cetak A4)</span>
            <span className="sm:hidden">1. Nilai Siswa</span>
          </button>

          <button
            type="button"
            onClick={() => setReportType('sekolah')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              reportType === 'sekolah'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <SchoolIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2. Rekapitulasi Per Sekolah</span>
            <span className="sm:hidden">2. Rekap Sekolah</span>
          </button>

          <button
            type="button"
            onClick={() => setReportType('mapel')}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
              reportType === 'mapel'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3. Rekapitulasi Per Mata Pelajaran</span>
            <span className="sm:hidden">3. Rekap Mapel</span>
          </button>
        </div>

        {/* Multi-Dimensional Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 border-t border-slate-100 text-xs">
          
          {/* 1. Tahun Pelajaran */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tahun Pelajaran</label>
            <select
              value={academicYearFilter}
              onChange={e => setAcademicYearFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Semua Tahun</option>
              <option value="2024/2025">2024/2025</option>
              <option value="2023/2024">2023/2024</option>
            </select>
          </div>

          {/* 2. Semester */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Semester</label>
            <select
              value={semesterFilter}
              onChange={e => setSemesterFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Semua Semester</option>
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>

          {/* 3. Sekolah (Terkunci jika peran Guru) */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">Satuan Pendidikan (Sekolah)</label>
              {isTeacher && (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Terkunci (Guru)
                </span>
              )}
            </div>
            <select
              value={effectiveSchoolId}
              disabled={isTeacher}
              onChange={e => setSelectedSchoolId(e.target.value)}
              className={`w-full px-2.5 py-1.5 border rounded-lg font-medium ${
                isTeacher ? 'bg-slate-100 text-slate-600 border-slate-300 cursor-not-allowed' : 'bg-white border-slate-200'
              }`}
            >
              {reportType !== 'siswa' && <option value="ALL">Semua Sekolah se-Kecamatan</option>}
              {schools.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Tingkat Kelas */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">Tingkat Kelas</label>
              {isTeacher && currentUserGrade && (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded font-bold flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Kelas {currentUserGrade}
                </span>
              )}
            </div>
            <select
              value={gradeFilter}
              disabled={isTeacher && !!currentUserGrade}
              onChange={e => setGradeFilter(e.target.value)}
              className={`w-full px-2.5 py-1.5 border rounded-lg font-medium ${
                isTeacher && currentUserGrade ? 'bg-slate-100 text-slate-600 border-slate-300 cursor-not-allowed' : 'bg-white border-slate-200'
              }`}
            >
              <option value="ALL">Semua Kelas</option>
              {[1, 2, 3, 4, 5, 6].map(g => (
                <option key={g} value={String(g)}>Kelas {g} SD</option>
              ))}
            </select>
          </div>

          {/* 5. Rombel */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">Rombel</label>
              {isTeacher && currentUserRombel && (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded font-bold flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Rombel {currentUserRombel}
                </span>
              )}
            </div>
            <select
              value={rombelFilter}
              disabled={isTeacher && !!currentUserRombel}
              onChange={e => setRombelFilter(e.target.value)}
              className={`w-full px-2.5 py-1.5 border rounded-lg font-medium ${
                isTeacher && currentUserRombel ? 'bg-slate-100 text-slate-600 border-slate-300 cursor-not-allowed' : 'bg-white border-slate-200'
              }`}
            >
              <option value="ALL">Semua Rombel</option>
              <option value="A">Rombel A</option>
              <option value="B">Rombel B</option>
              <option value="C">Rombel C</option>
              <option value="D">Rombel D</option>
            </select>
          </div>

          {/* 6. Mata Pelajaran */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-3">
            <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Semua Mata Pelajaran</option>
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code})
                </option>
              ))}
            </select>
          </div>

          {/* 7. Paket Ujian */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-3">
            <label className="block font-semibold text-slate-700 mb-1">Paket Naskah Ujian</label>
            <select
              value={packageFilter}
              onChange={e => setPackageFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Semua Naskah Ujian</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title} (Kelas {p.grade} SD)
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* PDF Download Hint */}
        <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-950 text-[11px] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <strong>Petunjuk Unduh PDF Resmi:</strong> Klik tombol <strong>Cetak / Unduh PDF</strong> di atas, lalu pilih opsi tujuan <em>"Simpan sebagai PDF / Save as PDF"</em> dengan ukuran kertas <strong>A4</strong>.
          </span>
          <span className="font-semibold text-blue-800 shrink-0">
            {filteredSessions.length} Data Nilai Terverifikasi
          </span>
        </div>

      </div>

      {/* ==================== 1. TAB: DAFTAR NILAI SISWA (FORMAT RESMI A4) ==================== */}
      {reportType === 'siswa' && (
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md max-w-4xl mx-auto print:p-0 print:border-none print:shadow-none text-slate-900 font-sans print-area">
          
          {/* KOP SURAT RESMI KECAMATAN & DINAS PENDIDIKAN */}
          <div className="border-b-4 border-double border-slate-900 pb-4 mb-6 text-center relative">
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-900 flex items-center justify-center text-white shrink-0 font-bold text-xl print:text-black print:bg-transparent print:border-2 print:border-black">
                <Building2 className="w-9 h-9" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-700 print:text-black">
                  PEMERINTAH {settings.regencyName.toUpperCase()}
                </h4>
                <h3 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-slate-900 print:text-black">
                  DINAS PENDIDIKAN DAN KEBUDAYAAN
                </h3>
                <h2 className="text-base sm:text-lg font-black tracking-tight uppercase text-blue-900 print:text-black">
                  KOORDINATOR WILAYAH BIDANG PENDIDIKAN {settings.districtName.toUpperCase()}
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-600 print:text-black">
                  {settings.address} • Telp: {settings.phone} • Email: {settings.email}
                </p>
              </div>
            </div>
          </div>

          {/* JUDUL LAPORAN RESMI */}
          <div className="text-center mb-6">
            <h3 className="text-sm sm:text-base font-extrabold uppercase underline tracking-wide">
              DAFTAR HASIL NILAI UJIAN SEMESTER SEKOLAH DASAR
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Tahun Pelajaran: <strong>{academicYearFilter === 'ALL' ? settings.academicYear : academicYearFilter}</strong> • Semester: <strong>{semesterFilter === 'ALL' ? settings.activeSemester : semesterFilter}</strong>
            </p>
          </div>

          {/* IDENTITAS PENDIDIKAN & KELAS */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-5 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200 print:bg-transparent print:border-none print:p-0">
            <div className="space-y-1">
              <div className="flex">
                <span className="w-36 font-semibold text-slate-600">Satuan Pendidikan</span>
                <span className="font-bold">: {selectedSchool?.name}</span>
              </div>
              <div className="flex">
                <span className="w-36 font-semibold text-slate-600">NPSN Sekolah</span>
                <span className="font-mono">: {selectedSchool?.npsn}</span>
              </div>
              <div className="flex">
                <span className="w-36 font-semibold text-slate-600">Status Akreditasi</span>
                <span>: {selectedSchool?.status}</span>
              </div>
              <div className="flex">
                <span className="w-36 font-semibold text-slate-600">Kecamatan / Kab.</span>
                <span>: {settings.districtName} / {settings.regencyName}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex">
                <span className="w-36 font-semibold text-slate-600">Mata Pelajaran</span>
                <span className="font-bold">: {selectedSub ? selectedSub.name : 'Semua Mata Pelajaran'}</span>
              </div>
              <div className="flex">
                <span className="w-36 font-semibold text-slate-600">Tingkat Kelas / Rombel</span>
                <span>: {gradeFilter === 'ALL' ? 'Semua Kelas' : `Kelas ${gradeFilter}`} ({rombelFilter === 'ALL' ? 'Semua Rombel' : `Rombel ${rombelFilter}`})</span>
              </div>
              <div className="flex">
                <span className="w-36 font-semibold text-slate-600">Paket Naskah Ujian</span>
                <span>: {selectedPkg ? selectedPkg.title : 'Seluruh Paket Ujian'}</span>
              </div>
              <div className="flex">
                <span className="w-36 font-semibold text-slate-600">Kriteria Ketuntasan (KKM)</span>
                <span className="font-bold text-blue-900 print:text-black">: {settings.defaultKkm}</span>
              </div>
            </div>
          </div>

          {/* TABEL NILAI PER SISWA */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                  <th className="border border-slate-300 p-2 w-8">No</th>
                  <th className="border border-slate-300 p-2">Nomor Peserta</th>
                  <th className="border border-slate-300 p-2">NISN</th>
                  <th className="border border-slate-300 p-2 text-left">Nama Peserta Didik</th>
                  <th className="border border-slate-300 p-2">Agama</th>
                  <th className="border border-slate-300 p-2">Kelas</th>
                  <th className="border border-slate-300 p-2">Benar</th>
                  <th className="border border-slate-300 p-2">Salah</th>
                  <th className="border border-slate-300 p-2">Kosong</th>
                  <th className="border border-slate-300 p-2">Nilai CBT</th>
                  <th className="border border-slate-300 p-2">Ketuntasan</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="border border-slate-300 p-8 text-center text-slate-400 italic">
                      Belum ada data nilai riil untuk filter yang dipilih. Silakan kerjakan ujian CBT atau pilih filter lain.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((item, idx) => {
                    const stUser = users.find(u => u.id === item.studentId || u.participantNumber === item.participantNumber);
                    return (
                      <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="border border-slate-300 p-2 text-center text-slate-500">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-medium">{item.participantNumber}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono">{item.nisn}</td>
                        <td className="border border-slate-300 p-2 font-bold text-slate-900">{item.studentName}</td>
                        <td className="border border-slate-300 p-2 text-center font-medium text-slate-700">
                          {stUser?.religion || 'Islam'}
                        </td>
                        <td className="border border-slate-300 p-2 text-center">Kelas {item.grade}{item.rombel}</td>
                        <td className="border border-slate-300 p-2 text-center text-emerald-700 font-bold">{item.totalCorrect}</td>
                        <td className="border border-slate-300 p-2 text-center text-rose-700">{item.totalIncorrect}</td>
                        <td className="border border-slate-300 p-2 text-center text-slate-400">{item.totalUnanswered}</td>
                        <td className="border border-slate-300 p-2 text-center font-extrabold text-sm text-blue-900 print:text-black">
                          {item.score}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-bold text-[11px]">
                          {item.score >= settings.defaultKkm ? (
                            <span className="text-emerald-700">TUNTAS</span>
                          ) : (
                            <span className="text-rose-700">REMEDIAL</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* RINGKASAN REKAPITULASI STATISTIK NILAI */}
          <div className="mt-4 p-3.5 border border-slate-300 bg-slate-50 rounded-xl text-xs space-y-2 print:bg-transparent">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>Rekapitulasi Analisis Statistik Ujian:</span>
              <span className="text-[11px] text-slate-500">Standar Kelulusan KKM: {settings.defaultKkm}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-500">Jumlah Peserta Ujian:</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{totalCount} Siswa</p>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-500">Nilai Rata-Rata:</span>
                <p className="font-extrabold text-blue-900 text-sm mt-0.5">{avgScore}</p>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-500">Nilai Tertinggi / Terendah:</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{maxScore} / {minScore}</p>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-500">Ketuntasan Belajar:</span>
                <p className="font-extrabold text-emerald-700 text-sm mt-0.5">
                  {passRate}% ({passedCount} Tuntas, {remedialCount} Remedial)
                </p>
              </div>
            </div>
          </div>

          {/* TANDA TANGAN PENGESAHAN DOKUMEN RESMI A4 */}
          <div className="mt-10 pt-4 grid grid-cols-2 gap-8 text-xs text-center break-inside-avoid">
            {/* Tanda Tangan Guru / Wali Kelas */}
            <div>
              <p className="text-slate-600 mb-16">
                Guru Pengampu / Wali Kelas,
              </p>
              <p className="font-bold text-slate-900 underline uppercase tracking-wide">
                {users.find(u => u.schoolId === selectedSchool?.id && u.role === 'guru')?.fullName || 'Budi Santoso, S.Pd.'}
              </p>
              <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                NIP. {users.find(u => u.schoolId === selectedSchool?.id && u.role === 'guru')?.nip || '19820415 200801 1 009'}
              </p>
            </div>

            {/* Tanda Tangan Kepala Sekolah */}
            <div>
              <p className="text-slate-600 mb-1">
                {settings.districtName}, {todayStr}
              </p>
              <p className="text-slate-600 mb-14">
                Kepala {selectedSchool?.name},
              </p>
              <p className="font-bold text-slate-900 underline uppercase tracking-wide">
                {selectedSchool?.principalName || 'Nama Kepala Sekolah'}
              </p>
              <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                NIP. {selectedSchool?.principalNip || '19750512 200003 1 002'}
              </p>
            </div>
          </div>

          {/* Pengesahan Korwil Kecamatan untuk Laporan Final */}
          {!isTeacher && (
            <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-center break-inside-avoid">
              <p className="text-slate-600 mb-14">
                Mengetahui,<br />
                Koordinator Wilayah Bidang Pendidikan {settings.districtName},
              </p>
              <p className="font-bold text-slate-900 underline uppercase tracking-wide">
                {settings.korwilHeadName || 'Drs. H. Ahmad Fauzi, M.Pd.'}
              </p>
              <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                NIP. {settings.korwilHeadNip || '19680712 199303 1 004'}
              </p>
            </div>
          )}

          {/* Footer Notice */}
          <div className="mt-6 text-center text-[10px] text-slate-400 border-t border-slate-200 pt-2">
            Dokumen resmi ini digenerate secara otomatis melalui {settings.appTitle} • Korwil {settings.districtName}
          </div>

        </div>
      )}

      {/* ==================== 2. TAB: REKAPITULASI NILAI PER SEKOLAH ==================== */}
      {reportType === 'sekolah' && (
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md max-w-4xl mx-auto print:p-0 print:border-none print:shadow-none text-slate-900 font-sans print-area space-y-6">
          
          {/* KOP RESMI */}
          <div className="border-b-4 border-double border-slate-900 pb-4 text-center">
            <h4 className="text-xs sm:text-sm font-bold uppercase text-slate-700">PEMERINTAH {settings.regencyName.toUpperCase()}</h4>
            <h3 className="text-sm sm:text-base font-extrabold uppercase text-slate-900">DINAS PENDIDIKAN DAN KEBUDAYAAN</h3>
            <h2 className="text-base sm:text-lg font-black uppercase text-blue-900 print:text-black">
              KOORDINATOR WILAYAH BIDANG PENDIDIKAN {settings.districtName.toUpperCase()}
            </h2>
            <p className="text-[11px] text-slate-600 mt-1">
              Rekapitulasi Perolehan Nilai dan Ketuntasan Ujian Semester Antar-Sekolah Dasar
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-sm sm:text-base font-extrabold uppercase underline">
              REKAPITULASI NILAI UJIAN SEMESTER PER SEKOLAH
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Tahun Ajaran: {academicYearFilter === 'ALL' ? settings.academicYear : academicYearFilter} • Semester: {semesterFilter === 'ALL' ? settings.activeSemester : semesterFilter}
            </p>
          </div>

          {/* TABEL REKAP SEKOLAH */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                  <th className="border border-slate-300 p-2 w-8">No</th>
                  <th className="border border-slate-300 p-2">NPSN</th>
                  <th className="border border-slate-300 p-2 text-left">Nama Sekolah Dasar</th>
                  <th className="border border-slate-300 p-2">Status</th>
                  <th className="border border-slate-300 p-2">Jumlah Peserta</th>
                  <th className="border border-slate-300 p-2">Rata-Rata</th>
                  <th className="border border-slate-300 p-2">Tertinggi</th>
                  <th className="border border-slate-300 p-2">Terendah</th>
                  <th className="border border-slate-300 p-2">Tuntas</th>
                  <th className="border border-slate-300 p-2">Ketuntasan (%)</th>
                  <th className="border border-slate-300 p-2">Remedial</th>
                </tr>
              </thead>
              <tbody>
                {schoolSummaryData.map((sch, idx) => (
                  <tr key={sch.schoolId} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 text-center text-slate-500">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono">{sch.npsn}</td>
                    <td className="border border-slate-300 p-2 font-bold text-slate-900">{sch.schoolName}</td>
                    <td className="border border-slate-300 p-2 text-center">{sch.status}</td>
                    <td className="border border-slate-300 p-2 text-center font-semibold">{sch.totalStudents} Siswa</td>
                    <td className="border border-slate-300 p-2 text-center font-black text-sm text-blue-900 print:text-black">
                      {sch.averageScore}
                    </td>
                    <td className="border border-slate-300 p-2 text-center text-emerald-700 font-bold">{sch.maxScore}</td>
                    <td className="border border-slate-300 p-2 text-center text-rose-700 font-bold">{sch.minScore}</td>
                    <td className="border border-slate-300 p-2 text-center text-emerald-700 font-semibold">{sch.passedCount}</td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-slate-900">{sch.passRate}</td>
                    <td className="border border-slate-300 p-2 text-center text-rose-700 font-semibold">{sch.remedialCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tanda Tangan Pengesahan Korwil */}
          <div className="mt-12 pt-4 grid grid-cols-2 gap-8 text-xs text-center break-inside-avoid">
            <div>
              <p className="text-slate-600 mb-16">
                Ketua Panitia Ujian Kecamatan,
              </p>
              <p className="font-bold text-slate-900 underline uppercase">
                {users.find(u => u.role === 'admin')?.fullName || 'Koordinator Ujian Kecamatan'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                NIP. 19780412 200212 1 003
              </p>
            </div>

            <div>
              <p className="text-slate-600 mb-1">{settings.districtName}, {todayStr}</p>
              <p className="text-slate-600 mb-14">
                Koordinator Wilayah Bidang Pendidikan,
              </p>
              <p className="font-bold text-slate-900 underline uppercase">
                {settings.korwilHeadName || 'Drs. H. Ahmad Fauzi, M.Pd.'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                NIP. {settings.korwilHeadNip || '19680712 199303 1 004'}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* ==================== 3. TAB: REKAPITULASI NILAI PER MATA PELAJARAN ==================== */}
      {reportType === 'mapel' && (
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-md max-w-4xl mx-auto print:p-0 print:border-none print:shadow-none text-slate-900 font-sans print-area space-y-6">
          
          {/* KOP RESMI */}
          <div className="border-b-4 border-double border-slate-900 pb-4 text-center">
            <h4 className="text-xs sm:text-sm font-bold uppercase text-slate-700">PEMERINTAH {settings.regencyName.toUpperCase()}</h4>
            <h3 className="text-sm sm:text-base font-extrabold uppercase text-slate-900">DINAS PENDIDIKAN DAN KEBUDAYAAN</h3>
            <h2 className="text-base sm:text-lg font-black uppercase text-blue-900 print:text-black">
              KOORDINATOR WILAYAH BIDANG PENDIDIKAN {settings.districtName.toUpperCase()}
            </h2>
            <p className="text-[11px] text-slate-600 mt-1">
              Rekapitulasi Capaian Standar Kompetensi Mata Pelajaran Ujian Semester
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-sm sm:text-base font-extrabold uppercase underline">
              REKAPITULASI CAPAIAN NILAI PER MATA PELAJARAN
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Tahun Ajaran: {academicYearFilter === 'ALL' ? settings.academicYear : academicYearFilter} • Semester: {semesterFilter === 'ALL' ? settings.activeSemester : semesterFilter}
            </p>
          </div>

          {/* TABEL REKAP MAPEL */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                  <th className="border border-slate-300 p-2 w-8">No</th>
                  <th className="border border-slate-300 p-2">Kode</th>
                  <th className="border border-slate-300 p-2 text-left">Mata Pelajaran</th>
                  <th className="border border-slate-300 p-2">Jumlah Lembar Jawaban</th>
                  <th className="border border-slate-300 p-2">Rata-Rata Nilai</th>
                  <th className="border border-slate-300 p-2">Nilai Tertinggi</th>
                  <th className="border border-slate-300 p-2">Nilai Terendah</th>
                  <th className="border border-slate-300 p-2">Jumlah Tuntas</th>
                  <th className="border border-slate-300 p-2">Ketuntasan (%)</th>
                </tr>
              </thead>
              <tbody>
                {subjectSummaryData.map((sub, idx) => (
                  <tr key={sub.code} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 text-center text-slate-500">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono font-bold text-blue-900">{sub.code}</td>
                    <td className="border border-slate-300 p-2 font-bold text-slate-900">{sub.subjectName}</td>
                    <td className="border border-slate-300 p-2 text-center font-semibold">{sub.totalParticipants} Peserta</td>
                    <td className="border border-slate-300 p-2 text-center font-black text-sm text-blue-900 print:text-black">
                      {sub.averageScore}
                    </td>
                    <td className="border border-slate-300 p-2 text-center text-emerald-700 font-bold">{sub.maxScore}</td>
                    <td className="border border-slate-300 p-2 text-center text-rose-700 font-bold">{sub.minScore}</td>
                    <td className="border border-slate-300 p-2 text-center text-emerald-700 font-semibold">{sub.passedCount}</td>
                    <td className="border border-slate-300 p-2 text-center font-bold text-slate-900">{sub.passRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tanda Tangan Pengesahan Korwil */}
          <div className="mt-12 pt-4 grid grid-cols-2 gap-8 text-xs text-center break-inside-avoid">
            <div>
              <p className="text-slate-600 mb-16">
                Ketua Tim Pengembang Kurikulum Kecamatan,
              </p>
              <p className="font-bold text-slate-900 underline uppercase">
                {users.find(u => u.role === 'guru')?.fullName || 'Budi Santoso, S.Pd.'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                NIP. 19820415 200801 1 009
              </p>
            </div>

            <div>
              <p className="text-slate-600 mb-1">{settings.districtName}, {todayStr}</p>
              <p className="text-slate-600 mb-14">
                Koordinator Wilayah Bidang Pendidikan,
              </p>
              <p className="font-bold text-slate-900 underline uppercase">
                {settings.korwilHeadName || 'Drs. H. Ahmad Fauzi, M.Pd.'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                NIP. {settings.korwilHeadNip || '19680712 199303 1 004'}
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
