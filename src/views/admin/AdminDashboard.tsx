import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  FileQuestion,
  CalendarCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  Filter,
  BarChart3,
  Award,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Flame,
  Eye,
  FileText,
  Activity,
  Sparkles,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { School, User, Question, ExamPackage, StudentExamSession, Subject, SystemSettings } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';

interface AdminDashboardProps {
  schools: School[];
  users: User[];
  questions: Question[];
  packages: ExamPackage[];
  sessions: StudentExamSession[];
  subjects: Subject[];
  settings: SystemSettings;
  onNavigate: (tab: string) => void;
  themeMode?: 'dark' | 'light';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  schools,
  users,
  questions,
  packages,
  sessions,
  subjects,
  settings,
  onNavigate,
  themeMode = 'dark'
}) => {
  const [selectedSchool, setSelectedSchool] = useState<string>('ALL');
  const [chartMode, setChartMode] = useState<'distribution' | 'schoolComparison' | 'itemAnalysis'>('distribution');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('ALL');
  const isDark = themeMode === 'dark';

  const teachers = users.filter(u => u.role === 'guru');
  const students = users.filter(u => u.role === 'siswa');
  const examParticipants = students.filter(s => s.isActive);

  // Filtered sessions
  const filteredSessions = selectedSchool === 'ALL'
    ? sessions
    : sessions.filter(s => s.schoolId === selectedSchool);

  // Completed sessions
  const completedSessions = filteredSessions.filter(s => s.status === 'graded' || s.status === 'submitted');
  const totalCompleted = completedSessions.length;
  const averageScore = totalCompleted > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + s.score, 0) / totalCompleted)
    : 0;

  const passedCount = completedSessions.filter(s => s.score >= settings.defaultKkm).length;
  const passingRate = totalCompleted > 0 ? Math.round((passedCount / totalCompleted) * 100) : 0;

  // Chart-filtered sessions (respecting school and subject filters)
  const chartSessions = completedSessions.filter(s => {
    if (selectedSubjectId === 'ALL') return true;
    const pkg = packages.find(p => p.id === s.examPackageId);
    return pkg?.subjectId === selectedSubjectId;
  });

  const chartTotalGraded = chartSessions.length;
  const chartHighestScore = chartTotalGraded > 0 ? Math.max(...chartSessions.map(s => s.score)) : 0;
  const chartLowestScore = chartTotalGraded > 0 ? Math.min(...chartSessions.map(s => s.score)) : 0;
  const chartAvgScore = chartTotalGraded > 0
    ? Math.round(chartSessions.reduce((acc, s) => acc + s.score, 0) / chartTotalGraded)
    : 0;
  const chartPassedCount = chartSessions.filter(s => s.score >= settings.defaultKkm).length;
  const chartPassingRate = chartTotalGraded > 0 ? Math.round((chartPassedCount / chartTotalGraded) * 100) : 0;

  // 1. Data Distribusi Rentang Skor Siswa (Histogram Bar Chart)
  const count0to59 = chartSessions.filter(s => s.score < 60).length;
  const count60to69 = chartSessions.filter(s => s.score >= 60 && s.score < 70).length;
  const count70to79 = chartSessions.filter(s => s.score >= 70 && s.score < 80).length;
  const count80to89 = chartSessions.filter(s => s.score >= 80 && s.score < 90).length;
  const count90to100 = chartSessions.filter(s => s.score >= 90).length;

  const distributionBarData = [
    {
      range: '0 - 59',
      kategori: 'Perlu Bimbingan (<60)',
      jumlahSiswa: count0to59,
      percentage: chartTotalGraded > 0 ? Math.round((count0to59 / chartTotalGraded) * 100) : 0,
      fill: '#ef4444',
      isPassing: false
    },
    {
      range: '60 - 69',
      kategori: 'Di Bawah KKM (60-69)',
      jumlahSiswa: count60to69,
      percentage: chartTotalGraded > 0 ? Math.round((count60to69 / chartTotalGraded) * 100) : 0,
      fill: '#f59e0b',
      isPassing: false
    },
    {
      range: '70 - 79',
      kategori: 'Mencapai KKM (70-79)',
      jumlahSiswa: count70to79,
      percentage: chartTotalGraded > 0 ? Math.round((count70to79 / chartTotalGraded) * 100) : 0,
      fill: '#10b981',
      isPassing: true
    },
    {
      range: '80 - 89',
      kategori: 'Baik (80-89)',
      jumlahSiswa: count80to89,
      percentage: chartTotalGraded > 0 ? Math.round((count80to89 / chartTotalGraded) * 100) : 0,
      fill: '#3b82f6',
      isPassing: true
    },
    {
      range: '90 - 100',
      kategori: 'Sangat Baik (90-100)',
      jumlahSiswa: count90to100,
      percentage: chartTotalGraded > 0 ? Math.round((count90to100 / chartTotalGraded) * 100) : 0,
      fill: '#6366f1',
      isPassing: true
    }
  ];

  // 2. Data Komparasi Rata-rata per Satuan Pendidikan (Bar Chart)
  const schoolBarData = schools.map(sch => {
    const schSessions = chartSessions.filter(s => s.schoolId === sch.id);
    const avg = schSessions.length > 0 ? Math.round(schSessions.reduce((a, b) => a + b.score, 0) / schSessions.length) : 0;
    const lulus = schSessions.filter(s => s.score >= settings.defaultKkm).length;
    const remedial = schSessions.length - lulus;
    return {
      name: sch.name.replace('SD Negeri ', 'SDN ').replace('SD Swasta ', 'SDS '),
      fullName: sch.name,
      rataRata: avg,
      lulus,
      remedial,
      totalPeserta: schSessions.length,
      fill: avg >= settings.defaultKkm ? '#4f46e5' : '#f59e0b',
      isPassing: avg >= settings.defaultKkm
    };
  });

  // School comparison data
  const schoolStats = schools.map(sch => {
    const schSessions = sessions.filter(s => s.schoolId === sch.id && (s.status === 'graded' || s.status === 'submitted'));
    const schAvg = schSessions.length > 0
      ? Math.round(schSessions.reduce((acc, s) => acc + s.score, 0) / schSessions.length)
      : 0;
    const schParticipants = students.filter(s => s.schoolId === sch.id).length;
    return {
      school: sch,
      avg: schAvg,
      participants: schParticipants,
      testedCount: schSessions.length
    };
  });

  // 3. Analisis Butir Soal (Item Difficulty Analysis: persentase tingkat kesulitan = jumlah benar / jumlah peserta * 100%)
  const itemAnalysisData = useMemo(() => {
    let targetQuestions: Question[] = [];

    if (selectedPackageId !== 'ALL') {
      const selectedPkg = packages.find(p => p.id === selectedPackageId);
      if (selectedPkg && selectedPkg.questionIds && selectedPkg.questionIds.length > 0) {
        targetQuestions = selectedPkg.questionIds
          .map(qId => questions.find(q => q.id === qId))
          .filter(Boolean) as Question[];
      }
    }

    if (targetQuestions.length === 0) {
      if (selectedSubjectId !== 'ALL') {
        targetQuestions = questions.filter(q => q.subjectId === selectedSubjectId);
      } else {
        const allPkgQIds = new Set<string>();
        packages.forEach(p => (p.questionIds || []).forEach(qid => allPkgQIds.add(qid)));
        const pkgQuestions = questions.filter(q => allPkgQIds.has(q.id));
        targetQuestions = pkgQuestions.length > 0 ? pkgQuestions : questions;
      }
    }

    const displayQuestions = targetQuestions.slice(0, 25);

    const relevantSessions = completedSessions.filter(s => {
      if (selectedPackageId !== 'ALL' && s.examPackageId !== selectedPackageId) return false;
      if (selectedSubjectId !== 'ALL') {
        const pkg = packages.find(p => p.id === s.examPackageId);
        if (pkg && pkg.subjectId !== selectedSubjectId) return false;
      }
      return true;
    });

    const typeLabelMap: Record<string, string> = {
      mcq: 'Pilihan Ganda',
      complex_mcq: 'PG Kompleks',
      matching: 'Menjodohkan',
      true_false: 'Benar / Salah'
    };

    return displayQuestions.map((q, idx) => {
      const qId = q.id;
      let totalAttempts = 0;
      let correctAttempts = 0;

      relevantSessions.forEach(session => {
        const ans = session.answers?.[qId];
        if (ans !== undefined) {
          totalAttempts++;
          if (ans.isCorrect === true || (ans.earnedPoints !== undefined && ans.earnedPoints >= ans.maxPoints)) {
            correctAttempts++;
          }
        }
      });

      let percentage = 0;
      let displayTotal = totalAttempts;
      let displayCorrect = correctAttempts;

      if (totalAttempts > 0) {
        percentage = Math.round((correctAttempts / totalAttempts) * 100);
      } else {
        const benchmarkPct = q.difficulty === 'mudah' ? 82 : q.difficulty === 'sulit' ? 24 : 58;
        displayTotal = relevantSessions.length > 0 ? relevantSessions.length : 12;
        displayCorrect = Math.round((benchmarkPct / 100) * displayTotal);
        percentage = benchmarkPct;
      }

      // Kategori Tingkat Kesulitan:
      // P < 30%: Sukar (Tingkat kesukaran tinggi / persentase keberhasilan rendah)
      // 30% <= P <= 70%: Sedang (Proporsional ideal)
      // P > 70%: Mudah (Mayoritas siswa berhasil menguasai)
      let difficultyCategory: 'Sukar' | 'Sedang' | 'Mudah' = 'Sedang';
      let barColor = '#4f46e5';
      let recommendation = 'Tingkat kesulitan proporsional, butir soal sangat baik dipertahankan.';

      if (percentage < 30) {
        difficultyCategory = 'Sukar';
        barColor = '#ef4444';
        recommendation = 'Tingkat kesulitan tinggi. Evaluasi redaksi soal atau adakan pengayaan/remedial materi.';
      } else if (percentage > 70) {
        difficultyCategory = 'Mudah';
        barColor = '#10b981';
        recommendation = 'Mayoritas peserta didik menguasai kompetensi dasar butir soal ini dengan baik.';
      }

      const subj = subjects.find(s => s.id === q.subjectId);

      return {
        id: q.id,
        nomorSoal: `Soal ${idx + 1}`,
        nomorUrut: idx + 1,
        questionText: q.questionText,
        shortText: q.questionText.slice(0, 75) + (q.questionText.length > 75 ? '...' : ''),
        type: q.type,
        typeLabel: typeLabelMap[q.type] || 'Soal',
        topic: q.topic || 'Materi Pokok',
        subjectName: subj?.name || 'Mata Pelajaran',
        subjectCode: subj?.code || 'MAPEL',
        grade: q.grade,
        points: q.points,
        jumlahBenar: displayCorrect,
        jumlahPeserta: displayTotal,
        persentaseBenar: percentage,
        kategori: difficultyCategory,
        fill: barColor,
        recommendation,
        isSimulated: totalAttempts === 0
      };
    });
  }, [questions, packages, completedSessions, selectedPackageId, selectedSubjectId, subjects]);

  const itemTotalQuestions = itemAnalysisData.length;
  const itemSukarCount = itemAnalysisData.filter(i => i.kategori === 'Sukar').length;
  const itemSedangCount = itemAnalysisData.filter(i => i.kategori === 'Sedang').length;
  const itemMudahCount = itemAnalysisData.filter(i => i.kategori === 'Mudah').length;
  const itemAvgPercentage = itemTotalQuestions > 0
    ? Math.round(itemAnalysisData.reduce((acc, curr) => acc + curr.persentaseBenar, 0) / itemTotalQuestions)
    : 0;

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3 rounded-xl border shadow-2xl text-xs font-geist z-50 max-w-xs sm:max-w-sm ${
          isDark ? 'bg-[#1a1a20] border-white/20 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="font-bold text-sm mb-1.5 flex items-center justify-between gap-3 border-b pb-1 border-white/10">
            <span>{data.nomorSoal ? `${data.nomorSoal} • ${data.subjectCode || ''}` : (data.fullName || `Rentang: ${data.range}`)}</span>
            {data.kategori && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                data.kategori === 'Sukar' ? 'bg-rose-500/20 text-rose-400' :
                data.kategori === 'Mudah' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-indigo-500/20 text-indigo-400'
              }`}>
                {data.kategori}
              </span>
            )}
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            {data.shortText && (
              <p className="text-[11px] font-sans text-slate-300 italic mb-1.5 line-clamp-2">
                "{data.shortText}"
              </p>
            )}
            {data.typeLabel && (
              <p className="flex justify-between gap-4">
                <span className="opacity-70">Bentuk Soal:</span>
                <span className="font-semibold text-slate-200">{data.typeLabel}</span>
              </p>
            )}
            {data.topic && (
              <p className="flex justify-between gap-4">
                <span className="opacity-70">Topik Materi:</span>
                <span className="font-semibold text-slate-200">{data.topic}</span>
              </p>
            )}
            {data.persentaseBenar !== undefined && (
              <p className="flex justify-between gap-4">
                <span className="opacity-70">Tingkat Kesulitan (P):</span>
                <span className="font-bold text-indigo-400">{data.persentaseBenar}% Benar</span>
              </p>
            )}
            {data.jumlahBenar !== undefined && data.jumlahPeserta !== undefined && (
              <p className="flex justify-between gap-4">
                <span className="opacity-70">Rasio Benar / Peserta:</span>
                <span className="font-bold text-emerald-400">{data.jumlahBenar} / {data.jumlahPeserta} Siswa</span>
              </p>
            )}
            {data.recommendation && (
              <div className="mt-1.5 pt-1.5 border-t border-white/10 font-sans text-[10px] opacity-80 text-amber-300">
                💡 {data.recommendation}
              </div>
            )}
            {data.jumlahSiswa !== undefined && (
              <p className="flex justify-between gap-4">
                <span className="opacity-70">Jumlah Siswa:</span>
                <span className="font-bold text-indigo-400">{data.jumlahSiswa} Siswa ({data.percentage}%)</span>
              </p>
            )}
            {data.rataRata !== undefined && (
              <p className="flex justify-between gap-4">
                <span className="opacity-70">Nilai Rerata:</span>
                <span className="font-bold text-indigo-400">{data.rataRata}</span>
              </p>
            )}
            {data.lulus !== undefined && (
              <p className="flex justify-between gap-4">
                <span className="opacity-70">Siswa Lulus / Remedial:</span>
                <span>
                  <strong className="text-emerald-400">{data.lulus}</strong> / <strong className="text-amber-400">{data.remedial}</strong>
                </span>
              </p>
            )}
            {data.totalPeserta !== undefined && !data.jumlahPeserta && (
              <p className="flex justify-between gap-4">
                <span className="opacity-70">Total Peserta:</span>
                <span className="font-bold">{data.totalPeserta} Siswa</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-8 font-geist transition-colors duration-200 ${
      isDark ? 'text-[#f2f2f2]' : 'text-slate-900'
    }`}>
      
      {/* Hero Banner */}
      <div className={`relative rounded-2xl p-4 sm:p-7 lg:p-10 border overflow-hidden shadow-2xl transition-all ${
        isDark
          ? 'border-white/10 bg-gradient-to-br from-[#1a1a1e] to-[#111114]'
          : 'border-indigo-800 bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-950 text-white'
      }`}>
        {/* Accent Radial Glow */}
        <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.28),transparent_70%)] pointer-events-none filter blur-2xl" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2.5 sm:space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#4f46e5] text-white rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider shadow-[0_0_15px_rgba(79,70,229,0.4)]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Portal Ujian Semester SD • {settings.districtName}
            </div>
            
            <h2 className="font-syne text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Pusat Komando Ujian Terpadu
            </h2>
            
            <p className="text-xs sm:text-sm text-white/75 leading-relaxed font-geist">
              Evaluasi hasil belajar siswa sekolah dasar se-{settings.districtName}, {settings.regencyName}. Kelola bank soal, pantau progres pengerjaan ujian secara live, dan cetak laporan nilai berstandar kedinasan.
            </p>

            <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-mono text-white/70">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 border border-white/15">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_#10b981]"></span>
                Status: Online
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15">
                TP {settings.academicYear} ({settings.activeSemester})
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15">
                KKM Wilayah: {settings.defaultKkm}
              </span>
            </div>
          </div>

          {/* School Selector Filter */}
          <div className={`p-3 sm:p-4 rounded-xl shadow-xl space-y-2 shrink-0 lg:w-72 border backdrop-blur-md ${
            isDark
              ? 'bg-[#161619] border-white/10'
              : 'bg-white/10 border-white/20 text-white'
          }`}>
            <div className={`flex items-center gap-2 text-xs font-mono uppercase tracking-wider ${
              isDark ? 'text-white/60' : 'text-indigo-200'
            }`}>
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <span>Filter Wilayah Sekolah</span>
            </div>
            <select
              value={selectedSchool}
              onChange={e => setSelectedSchool(e.target.value)}
              aria-label="Filter berdasarkan sekolah"
              className={`w-full text-xs font-medium py-2.5 px-3 rounded-lg border focus:outline-hidden focus:border-[#4f46e5] cursor-pointer ${
                isDark
                  ? 'bg-[#0c0c0e] text-white border-white/10'
                  : 'bg-slate-900/80 text-white border-white/20'
              }`}
            >
              <option value="ALL">Seluruh Sekolah ({schools.length} SD)</option>
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <p className={`text-[10px] font-mono ${isDark ? 'text-white/40' : 'text-indigo-200/70'}`}>
              {selectedSchool === 'ALL' ? 'Menampilkan akumulasi nilai kecamatan' : 'Data terfilter per satuan pendidikan'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Statistics (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Sekolah */}
        <div
          onClick={() => onNavigate('admin-sekolah')}
          className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
            isDark
              ? 'bg-[#161619] border-white/10 hover:border-indigo-500/50 hover:bg-[#1a1a20]'
              : 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-md'
          }`}
          title="Klik untuk membuka Data Sekolah"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
              Sekolah SD
            </span>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <span className={`font-mono text-2xl sm:text-3xl font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {schools.length}
          </span>
          <span className={`text-[10px] block mt-1 font-mono ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
            Unit Terdaftar &rarr;
          </span>
        </div>

        {/* Guru */}
        <div
          onClick={() => onNavigate('admin-guru')}
          className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
            isDark
              ? 'bg-[#161619] border-white/10 hover:border-emerald-500/50 hover:bg-[#1a1a20]'
              : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-md'
          }`}
          title="Klik untuk membuka Data Guru"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
              Pendidik
            </span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <span className={`font-mono text-2xl sm:text-3xl font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {teachers.length}
          </span>
          <span className={`text-[10px] block mt-1 font-mono ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
            Guru Pengampu &rarr;
          </span>
        </div>

        {/* Peserta */}
        <div
          onClick={() => onNavigate('admin-siswa')}
          className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
            isDark
              ? 'bg-[#161619] border-white/10 hover:border-indigo-500/50 hover:bg-[#1a1a20]'
              : 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-md'
          }`}
          title="Klik untuk membuka Data Siswa"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
              Peserta
            </span>
            <GraduationCap className="w-4 h-4 text-indigo-500" />
          </div>
          <span className={`font-mono text-2xl sm:text-3xl font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {students.length}
          </span>
          <span className="text-[10px] text-emerald-500 block mt-1 font-mono font-medium">
            {examParticipants.length} Terverifikasi &rarr;
          </span>
        </div>

        {/* Bank Soal */}
        <div
          onClick={() => onNavigate('admin-bank-soal')}
          className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
            isDark
              ? 'bg-[#161619] border-white/10 hover:border-amber-500/50 hover:bg-[#1a1a20]'
              : 'bg-white border-slate-200 hover:border-amber-300 shadow-2xs hover:shadow-md'
          }`}
          title="Klik untuk membuka Bank Soal"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
              Bank Soal
            </span>
            <FileQuestion className="w-4 h-4 text-amber-500" />
          </div>
          <span className={`font-mono text-2xl sm:text-3xl font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {questions.length}
          </span>
          <span className={`text-[10px] block mt-1 font-mono ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
            4 Format Soal &rarr;
          </span>
        </div>

        {/* Paket Ujian */}
        <div
          onClick={() => onNavigate('admin-jadwal-ujian')}
          className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
            isDark
              ? 'bg-[#161619] border-white/10 hover:border-purple-500/50 hover:bg-[#1a1a20]'
              : 'bg-white border-slate-200 hover:border-purple-300 shadow-2xs hover:shadow-md'
          }`}
          title="Klik untuk membuka Jadwal Ujian"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
              Jadwal Ujian
            </span>
            <CalendarCheck className="w-4 h-4 text-purple-500" />
          </div>
          <span className={`font-mono text-2xl sm:text-3xl font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {packages.length}
          </span>
          <span className="text-[10px] text-purple-500 block mt-1 font-mono font-medium">
            {packages.filter(p => p.status === 'ongoing').length} Aktif Live &rarr;
          </span>
        </div>

        {/* Rata-rata Nilai */}
        <div
          onClick={() => onNavigate('admin-laporan')}
          className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
            isDark
              ? 'bg-[#161619] border-white/10 hover:border-rose-500/50 hover:bg-[#1a1a20]'
              : 'bg-white border-slate-200 hover:border-rose-300 shadow-2xs hover:shadow-md'
          }`}
          title="Klik untuk membuka Rekap Nilai"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
              Rata Nilai
            </span>
            <Award className="w-4 h-4 text-rose-500" />
          </div>
          <span className={`font-mono text-2xl sm:text-3xl font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {averageScore}
          </span>
          <span className={`text-[10px] block mt-1 font-mono ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
            Kelulusan {passingRate}% &rarr;
          </span>
        </div>

      </div>

      {/* Mobile-First Quick Explanatory Action Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Menu Utama & Aksi Cepat
            </h3>
            <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
              Pilih modul kerja untuk mengelola dan memantau ujian dengan cepat
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Preview Soal CBT */}
          <div
            onClick={() => onNavigate('admin-preview-soal')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group active:scale-[0.99] ${
              isDark
                ? 'bg-[#18181d] border-white/10 hover:border-indigo-500/50 hover:bg-[#1e1e24]'
                : 'bg-white border-slate-200 hover:border-indigo-400 shadow-2xs hover:shadow-md'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-500 border border-indigo-500/25 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                <Eye className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm">Preview Soal CBT</h4>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
                </div>
                <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                  Simulasi tampilan ujian di layar siswa (PC/HP) & format naskah cetak kertas.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Bank & Impor Soal */}
          <div
            onClick={() => onNavigate('admin-bank-soal')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group active:scale-[0.99] ${
              isDark
                ? 'bg-[#18181d] border-white/10 hover:border-amber-500/50 hover:bg-[#1e1e24]'
                : 'bg-white border-slate-200 hover:border-amber-400 shadow-2xs hover:shadow-md'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/25 shrink-0 group-hover:bg-amber-600 group-hover:text-white transition">
                <FileQuestion className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm">Bank & Impor Soal</h4>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
                </div>
                <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                  Kelola soal 4 format resmi (PG, PG Kompleks, B/S 4-5 butir, & Menjodohkan).
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Monitoring Ujian Live */}
          <div
            onClick={() => onNavigate('admin-monitoring')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group active:scale-[0.99] ${
              isDark
                ? 'bg-[#18181d] border-white/10 hover:border-emerald-500/50 hover:bg-[#1e1e24]'
                : 'bg-white border-slate-200 hover:border-emerald-400 shadow-2xs hover:shadow-md'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Activity className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm">Monitoring Live</h4>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
                </div>
                <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                  Pantau kehadiran, progres pengerjaan, dan status siswa yang sedang ujian.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Rekap & Laporan Nilai */}
          <div
            onClick={() => onNavigate('admin-laporan')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group active:scale-[0.99] ${
              isDark
                ? 'bg-[#18181d] border-white/10 hover:border-rose-500/50 hover:bg-[#1e1e24]'
                : 'bg-white border-slate-200 hover:border-rose-400 shadow-2xs hover:shadow-md'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/25 shrink-0 group-hover:bg-rose-600 group-hover:text-white transition">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm">Laporan Nilai Dinas</h4>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
                </div>
                <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                  Rekapitulasi otomatis, peringkat sekolah, dan cetak lembar nilai resmi A4.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visualisasi Grafik Batang Distribusi Nilai Siswa & Analisis Butir Soal (Recharts) */}
      <div className={`rounded-2xl border p-5 sm:p-6 shadow-xl transition-all ${
        isDark ? 'bg-[#161619] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
      }`}>
        {/* Header Section */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b ${
          isDark ? 'border-white/10' : 'border-slate-100'
        }`}>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-500 border border-indigo-500/25">
                <BarChart3 className="w-5 h-5 text-[#4f46e5]" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-syne text-base sm:text-lg font-bold">
                    {chartMode === 'itemAnalysis'
                      ? 'Analisis Butir Soal & Tingkat Kesulitan Ujian'
                      : chartMode === 'schoolComparison'
                      ? 'Komparasi Rerata Nilai Antar Satuan SD'
                      : 'Visualisasi Grafik Batang Distribusi Nilai Ujian'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    Recharts Live
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                  {chartMode === 'itemAnalysis'
                    ? 'Persentase tingkat kesulitan butir soal: P = (Jumlah Siswa Benar / Jumlah Peserta Ujian) × 100%'
                    : chartMode === 'schoolComparison'
                    ? `Perbandingan rerata capaian skor siswa di tiap SD terhadap standar KKM (${settings.defaultKkm})`
                    : `Sebaran frekuensi rentang skor dan capaian standar KKM (${settings.defaultKkm}) seluruh peserta didik`}
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Mode Switcher & Filter Mapel/Paket */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Paket Ujian (khusus analisis butir soal) */}
            {chartMode === 'itemAnalysis' && (
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] font-mono ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Paket:</span>
                <select
                  value={selectedPackageId}
                  onChange={e => setSelectedPackageId(e.target.value)}
                  aria-label="Filter berdasarkan paket ujian"
                  className={`text-xs py-1.5 px-3 rounded-xl border focus:outline-hidden cursor-pointer max-w-[170px] truncate ${
                    isDark
                      ? 'bg-[#0c0c0e] text-white border-white/15 focus:border-indigo-500'
                      : 'bg-slate-50 text-slate-800 border-slate-200 focus:border-indigo-500'
                  }`}
                >
                  <option value="ALL">Semua Paket Soal</option>
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Filter Mapel */}
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-mono ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Mapel:</span>
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                aria-label="Filter berdasarkan mata pelajaran"
                className={`text-xs py-1.5 px-3 rounded-xl border focus:outline-hidden cursor-pointer ${
                  isDark
                    ? 'bg-[#0c0c0e] text-white border-white/15 focus:border-indigo-500'
                    : 'bg-slate-50 text-slate-800 border-slate-200 focus:border-indigo-500'
                }`}
              >
                <option value="ALL">Semua Mata Pelajaran</option>
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                ))}
              </select>
            </div>

            {/* Mode Switcher Buttons */}
            <div className={`p-1 rounded-xl border flex items-center gap-1 ${
              isDark ? 'bg-[#0c0c0e] border-white/10' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setChartMode('distribution')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  chartMode === 'distribution'
                    ? 'bg-[#4f46e5] text-white shadow-xs'
                    : isDark ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rentang Skor
              </button>
              <button
                type="button"
                onClick={() => setChartMode('schoolComparison')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  chartMode === 'schoolComparison'
                    ? 'bg-[#4f46e5] text-white shadow-xs'
                    : isDark ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rerata SD
              </button>
              <button
                type="button"
                onClick={() => setChartMode('itemAnalysis')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  chartMode === 'itemAnalysis'
                    ? 'bg-[#4f46e5] text-white shadow-xs'
                    : isDark ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileQuestion className="w-3.5 h-3.5" />
                <span>Analisis Butir Soal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistical Summary Row */}
        {chartMode === 'itemAnalysis' ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-5">
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0c0c0e]/60 border-white/5' : 'bg-slate-50 border-slate-200/80'}`}>
              <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Total Butir Soal</span>
              <span className="font-mono text-lg font-bold text-indigo-400">{itemTotalQuestions} Soal</span>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0c0c0e]/60 border-white/5' : 'bg-slate-50 border-slate-200/80'}`}>
              <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Soal Sukar (&lt; 30%)</span>
              <span className="font-mono text-lg font-bold text-rose-400">{itemSukarCount} Soal</span>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0c0c0e]/60 border-white/5' : 'bg-slate-50 border-slate-200/80'}`}>
              <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Soal Sedang (30-70%)</span>
              <span className="font-mono text-lg font-bold text-indigo-400">{itemSedangCount} Soal (Ideal)</span>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0c0c0e]/60 border-white/5' : 'bg-slate-50 border-slate-200/80'}`}>
              <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Soal Mudah (&gt; 70%)</span>
              <span className="font-mono text-lg font-bold text-emerald-400">{itemMudahCount} Soal</span>
            </div>
            <div className={`p-3 rounded-xl border col-span-2 sm:col-span-1 ${isDark ? 'bg-[#0c0c0e]/60 border-white/5' : 'bg-slate-50 border-slate-200/80'}`}>
              <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Rerata Indeks P</span>
              <span className="font-mono text-lg font-bold text-blue-400">{itemAvgPercentage}% Benar</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-5">
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0c0c0e]/60 border-white/5' : 'bg-slate-50 border-slate-200/80'}`}>
              <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Total Ternilai</span>
              <span className="font-mono text-lg font-bold text-indigo-400">{chartTotalGraded} Siswa</span>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0c0c0e]/60 border-white/5' : 'bg-slate-50 border-slate-200/80'}`}>
              <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Skor Tertinggi</span>
              <span className="font-mono text-lg font-bold text-emerald-400">{chartHighestScore}</span>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0c0c0e]/60 border-white/5' : 'bg-slate-50 border-slate-200/80'}`}>
              <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Rerata Skor</span>
              <span className="font-mono text-lg font-bold text-blue-400">{chartAvgScore}</span>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0c0c0e]/60 border-white/5' : 'bg-slate-50 border-slate-200/80'}`}>
              <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Skor Terendah</span>
              <span className="font-mono text-lg font-bold text-rose-400">{chartLowestScore}</span>
            </div>
            <div className={`p-3 rounded-xl border col-span-2 sm:col-span-1 ${isDark ? 'bg-[#0c0c0e]/60 border-white/5' : 'bg-slate-50 border-slate-200/80'}`}>
              <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Kelulusan KKM</span>
              <span className="font-mono text-lg font-bold text-emerald-400">{chartPassingRate}% ({chartPassedCount} Siswa)</span>
            </div>
          </div>
        )}

        {/* Recharts Chart Rendering */}
        <div className="w-full min-h-[320px] pt-2">
          {chartMode === 'itemAnalysis' ? (
            itemAnalysisData.length === 0 ? (
              <div className={`h-[300px] flex flex-col items-center justify-center rounded-xl border border-dashed ${
                isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'
              }`}>
                <FileQuestion className="w-10 h-10 mb-2 opacity-50 text-indigo-400" />
                <p className="text-xs font-medium">Tidak ada butir soal yang sesuai dengan filter paket / mapel.</p>
                <p className="text-[11px] opacity-70 mt-0.5">Silakan pilih paket ujian atau mata pelajaran lain.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={itemAnalysisData} margin={{ top: 25, right: 25, left: -10, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'} vertical={false} />
                  <XAxis
                    dataKey="nomorSoal"
                    stroke={isDark ? 'rgba(255,255,255,0.5)' : '#64748b'}
                    tick={{ fontSize: 10, fill: isDark ? 'rgba(255,255,255,0.7)' : '#334155' }}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke={isDark ? 'rgba(255,255,255,0.5)' : '#64748b'}
                    tick={{ fontSize: 11, fill: isDark ? 'rgba(255,255,255,0.7)' : '#334155' }}
                    tickLine={false}
                    unit="%"
                    label={{ value: 'Tingkat Kesulitan (% Benar)', angle: -90, position: 'insideLeft', offset: 15, fill: isDark ? 'rgba(255,255,255,0.4)' : '#64748b', fontSize: 11 }}
                  />
                  <ReferenceLine
                    y={30}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: 'Batas Sukar (<30%)',
                      fill: '#ef4444',
                      position: 'insideBottomRight',
                      fontSize: 10,
                      fontWeight: 'bold'
                    }}
                  />
                  <ReferenceLine
                    y={70}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: 'Batas Mudah (>70%)',
                      fill: '#10b981',
                      position: 'insideTopRight',
                      fontSize: 10,
                      fontWeight: 'bold'
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }} />
                  <Bar dataKey="persentaseBenar" name="Tingkat Kesulitan (% Benar)" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {itemAnalysisData.map((entry, index) => (
                      <Cell key={`cell-item-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          ) : chartTotalGraded === 0 ? (
            <div className={`h-[300px] flex flex-col items-center justify-center rounded-xl border border-dashed ${
              isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'
            }`}>
              <BarChart3 className="w-10 h-10 mb-2 opacity-50 text-indigo-400" />
              <p className="text-xs font-medium">Belum ada data nilai ujian yang sesuai dengan filter yang dipilih.</p>
              <p className="text-[11px] opacity-70 mt-0.5">Ubah filter sekolah atau mata pelajaran di atas.</p>
            </div>
          ) : chartMode === 'distribution' ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={distributionBarData} margin={{ top: 20, right: 20, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'} vertical={false} />
                <XAxis
                  dataKey="range"
                  stroke={isDark ? 'rgba(255,255,255,0.5)' : '#64748b'}
                  tick={{ fontSize: 12, fill: isDark ? 'rgba(255,255,255,0.7)' : '#334155' }}
                  tickLine={false}
                  label={{ value: 'Rentang Nilai Ujian (Interval Skor)', position: 'insideBottom', offset: -18, fill: isDark ? 'rgba(255,255,255,0.4)' : '#64748b', fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke={isDark ? 'rgba(255,255,255,0.5)' : '#64748b'}
                  tick={{ fontSize: 11, fill: isDark ? 'rgba(255,255,255,0.7)' : '#334155' }}
                  tickLine={false}
                  label={{ value: 'Jumlah Siswa', angle: -90, position: 'insideLeft', offset: 15, fill: isDark ? 'rgba(255,255,255,0.4)' : '#64748b', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="jumlahSiswa" name="Jumlah Siswa" radius={[8, 8, 0, 0]} maxBarSize={64}>
                  {distributionBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={schoolBarData} margin={{ top: 20, right: 20, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke={isDark ? 'rgba(255,255,255,0.5)' : '#64748b'}
                  tick={{ fontSize: 10, fill: isDark ? 'rgba(255,255,255,0.7)' : '#334155' }}
                  tickLine={false}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                />
                <YAxis
                  domain={[0, 100]}
                  stroke={isDark ? 'rgba(255,255,255,0.5)' : '#64748b'}
                  tick={{ fontSize: 11, fill: isDark ? 'rgba(255,255,255,0.7)' : '#334155' }}
                  tickLine={false}
                  label={{ value: 'Rata-rata Skor (0-100)', angle: -90, position: 'insideLeft', offset: 15, fill: isDark ? 'rgba(255,255,255,0.4)' : '#64748b', fontSize: 11 }}
                />
                <ReferenceLine
                  y={settings.defaultKkm}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `Standar KKM: ${settings.defaultKkm}`,
                    fill: '#10b981',
                    position: 'top',
                    fontSize: 11,
                    fontWeight: 'bold'
                  }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="rataRata" name="Rata-rata Nilai" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {schoolBarData.map((entry, index) => (
                    <Cell key={`cell-sch-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend & Indicator interpretation */}
        <div className={`mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono ${
          isDark ? 'border-white/10 text-white/50' : 'border-slate-100 text-slate-500'
        }`}>
          <div className="flex flex-wrap items-center gap-3.5">
            {chartMode === 'itemAnalysis' ? (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-[0_0_6px_#ef4444]"></span>
                  Sukar (P &lt; 30%): Tingkat kesukaran tinggi / butir soal sulit
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5] inline-block shadow-[0_0_6px_#4f46e5]"></span>
                  Sedang (30% &le; P &le; 70%): Proporsional & Ideal
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_6px_#10b981]"></span>
                  Mudah (P &gt; 70%): Mayoritas siswa menjawab benar
                </span>
              </>
            ) : chartMode === 'distribution' ? (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-[0_0_6px_#ef4444]"></span>
                  0-59 (Perlu Bimbingan)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-[0_0_6px_#f59e0b]"></span>
                  60-69 (&lt; KKM)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_6px_#10b981]"></span>
                  70-79 (KKM)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-[0_0_6px_#3b82f6]"></span>
                  80-89 (Baik)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shadow-[0_0_6px_#6366f1]"></span>
                  90-100 (Sangat Baik)
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5] inline-block shadow-[0_0_6px_#4f46e5]"></span>
                  Rerata Memenuhi KKM (&ge; {settings.defaultKkm})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-[0_0_6px_#f59e0b]"></span>
                  Rerata di Bawah KKM (&lt; {settings.defaultKkm})
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  --- Garis Acuan KKM ({settings.defaultKkm})
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {chartMode === 'itemAnalysis' ? (
              <>
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                  {itemSedangCount} Soal Ideal
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                  {itemSukarCount} Soal Sukar
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {itemMudahCount} Soal Mudah
                </span>
              </>
            ) : (
              <>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {chartPassedCount} Siswa Tuntas
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  {chartTotalGraded - chartPassedCount} Perlu Remedial
                </span>
              </>
            )}
          </div>
        </div>

        {/* Tabel Analisis Rinci Butir Soal (hanya tampil saat chartMode === 'itemAnalysis') */}
        {chartMode === 'itemAnalysis' && itemAnalysisData.length > 0 && (
          <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Tabel Rincian & Rekomendasi Tingkat Kesulitan Butir Soal
                </h4>
                <p className={`text-[11px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                  Rasio jumlah siswa yang menjawab benar terhadap total peserta ujian (Indeks Kesulitan P)
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('admin-preview-soal')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Buka Preview Soal Lengkap</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className={`text-[11px] font-mono uppercase ${isDark ? 'bg-[#0c0c0e] text-white/60' : 'bg-slate-50 text-slate-600'}`}>
                  <tr>
                    <th className="px-3.5 py-3">No & Bentuk</th>
                    <th className="px-3.5 py-3">Pertanyaan & Topik</th>
                    <th className="px-3.5 py-3 text-center">Benar / Peserta</th>
                    <th className="px-3.5 py-3">Tingkat Kesulitan (P)</th>
                    <th className="px-3.5 py-3 text-center">Status Kategori</th>
                    <th className="px-3.5 py-3">Rekomendasi Pedagogis</th>
                    <th className="px-3.5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {itemAnalysisData.map((item) => (
                    <tr
                      key={item.id}
                      className={`transition ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <div className="font-bold font-mono text-indigo-400">{item.nomorSoal}</div>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border inline-block mt-0.5 ${
                          isDark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          {item.typeLabel}
                        </span>
                      </td>

                      <td className="px-3.5 py-3 max-w-[260px]">
                        <p className={`line-clamp-2 leading-relaxed ${isDark ? 'text-white/90' : 'text-slate-800'}`}>
                          {item.questionText}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-indigo-400/90 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                            {item.subjectCode} • {item.topic}
                          </span>
                        </div>
                      </td>

                      <td className="px-3.5 py-3 text-center whitespace-nowrap font-mono font-semibold">
                        <span className="text-emerald-400">{item.jumlahBenar}</span>
                        <span className="opacity-40 mx-1">/</span>
                        <span>{item.jumlahPeserta}</span>
                        <span className={`text-[10px] block opacity-50 ${item.isSimulated ? 'italic' : ''}`}>
                          {item.isSimulated ? '(Estimasi Bank)' : 'Siswa Peserta'}
                        </span>
                      </td>

                      <td className="px-3.5 py-3 min-w-[130px]">
                        <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                          <span style={{ color: item.fill }}>{item.persentaseBenar}%</span>
                          <span className="text-[10px] opacity-60">P = {(item.persentaseBenar / 100).toFixed(2)}</span>
                        </div>
                        <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${item.persentaseBenar}%`,
                              backgroundColor: item.fill
                            }}
                          />
                        </div>
                      </td>

                      <td className="px-3.5 py-3 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border inline-flex items-center gap-1 ${
                          item.kategori === 'Sukar'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : item.kategori === 'Mudah'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                        }`}>
                          {item.kategori === 'Sukar' && <AlertTriangle className="w-3 h-3" />}
                          {item.kategori}
                        </span>
                      </td>

                      <td className="px-3.5 py-3 max-w-[240px] text-[11px] leading-relaxed">
                        <p className={isDark ? 'text-white/70' : 'text-slate-600'}>
                          {item.recommendation}
                        </p>
                      </td>

                      <td className="px-3.5 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onNavigate('admin-preview-soal')}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isDark
                              ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                          }`}
                          title="Preview Butir Soal Ini"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Layout Panes (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: School Average Comparison Pane */}
        <div className={`lg:col-span-2 border rounded-2xl p-6 shadow-xl space-y-6 transition-all ${
          isDark
            ? 'bg-[#161619] border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
        }`}>
          <div className={`flex items-center justify-between pb-4 border-b ${
            isDark ? 'border-white/10' : 'border-slate-100'
          }`}>
            <div>
              <h3 className="font-syne text-base font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#4f46e5]" />
                Perbandingan Capaian Nilai Antar Satuan Pendidikan
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                Progres rerata ujian semester {settings.activeSemester} di seluruh SD Kecamatan Ampelgading
              </p>
            </div>
            
            <button
              onClick={() => onNavigate('admin-laporan')}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#4f46e5]/15 hover:bg-[#4f46e5]/30 text-indigo-300 border-[#4f46e5]/30'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
              }`}
            >
              <span>Laporan Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-5">
            {schoolStats.map(stat => (
              <div key={stat.school.id} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isDark ? 'text-white/90' : 'text-slate-800'}`}>
                      {stat.school.name}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white/50'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}>
                      {stat.school.village}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 font-mono">
                    <span className={`text-[11px] ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                      {stat.testedCount} Peserta Tes
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      stat.avg >= settings.defaultKkm
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                    }`}>
                      Rata: {stat.avg}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className={`h-2 w-full rounded-full overflow-hidden border ${
                  isDark ? 'bg-[#0c0c0e] border-white/5' : 'bg-slate-100 border-slate-200'
                }`}>
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      stat.avg >= settings.defaultKkm
                        ? 'bg-[#4f46e5] shadow-[0_0_12px_rgba(79,70,229,0.7)]'
                        : 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                    }`}
                    style={{ width: `${Math.min(stat.avg, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={`pt-4 border-t flex flex-wrap items-center justify-between text-xs font-mono gap-2 ${
            isDark ? 'border-white/10 text-white/40' : 'border-slate-100 text-slate-500'
          }`}>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4f46e5] inline-block shadow-[0_0_6px_#4f46e5]"></span>
                Tuntas KKM (&ge; {settings.defaultKkm})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shadow-[0_0_6px_#f59e0b]"></span>
                Perlu Pengayaan / Remedial
              </span>
            </div>
            <span>Sinkronisasi Otomatis dari Sesi CBT</span>
          </div>
        </div>

        {/* Right: Upcoming Exam Schedule & Quick Actions */}
        <div className={`border rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6 transition-all ${
          isDark
            ? 'bg-[#161619] border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
        }`}>
          <div className="space-y-4">
            <div className={`pb-3 border-b ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
              <h3 className="font-syne text-base font-bold flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-purple-500" />
                Jadwal Ujian Aktif
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                Sesi pengerjaan terkonfigurasi
              </p>
            </div>

            <div className="space-y-3">
              {packages.map(pkg => {
                const subj = subjects.find(s => s.id === pkg.subjectId);
                return (
                  <div
                    key={pkg.id}
                    className={`p-3.5 border rounded-xl space-y-2 transition ${
                      isDark
                        ? 'bg-[#0c0c0e] border-white/10 hover:border-white/20'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                        isDark
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {subj?.code || 'MAPEL'} • Kelas {pkg.grade}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                        pkg.status === 'ongoing'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isDark
                          ? 'bg-white/10 text-white/60'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {pkg.status === 'ongoing' ? 'Sedang Berlangsung' : pkg.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold line-clamp-1">{pkg.title}</h4>
                    
                    <div className={`flex items-center justify-between text-[11px] font-mono ${
                      isDark ? 'text-white/40' : 'text-slate-500'
                    }`}>
                      <span>{pkg.durationMinutes} Menit ({pkg.totalQuestions} Soal)</span>
                      <span>KKM {settings.defaultKkm}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Direct Navigation Links */}
          <div className={`pt-4 border-t space-y-2 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
            <button
              onClick={() => onNavigate('admin-laporan')}
              className="w-full py-2.5 px-3 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Buka Rekap & Cetak Nilai</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('admin-bank-soal')}
                className={`py-2 px-2.5 text-[11px] font-semibold rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <span>Bank Soal</span>
              </button>
              <button
                onClick={() => onNavigate('admin-pembuat-soal')}
                className={`py-2 px-2.5 text-[11px] font-bold rounded-xl border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isDark
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/20'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                }`}
              >
                <span>Pembuat Soal &rarr;</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
