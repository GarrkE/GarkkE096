import React, { useState, useMemo } from 'react';
import {
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  Printer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Sparkles,
  Filter,
  Search,
  RotateCcw,
  FileText,
  Check,
  Layers,
  Clock,
  BookOpen,
  School as SchoolIcon,
  PenTool,
  Award,
  ZoomIn,
  ChevronRight,
  Maximize2,
  FileCheck2,
  GraduationCap,
  FileQuestion
} from 'lucide-react';
import { Question, Subject, School, User, SystemSettings } from '../../types';
import { DEFAULT_SETTINGS } from '../../services/storage';

interface PreviewSoalViewProps {
  questions: Question[];
  subjects: Subject[];
  schools?: School[];
  users?: User[];
  settings?: SystemSettings;
  currentUser?: User | null;
  onNavigate?: (tab: string) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
  themeMode?: 'dark' | 'light';
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type ViewMode = 'cbt_simulation' | 'paper_exam' | 'key_discussion';

export const PreviewSoalView: React.FC<PreviewSoalViewProps> = ({
  questions = [],
  subjects = [],
  schools = [],
  users = [],
  settings = DEFAULT_SETTINGS,
  currentUser,
  onNavigate,
  showToast = () => {}
}) => {
  // Mode Tampilan & Perangkat
  const [viewMode, setViewMode] = useState<ViewMode>('cbt_simulation');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [authorFilter, setAuthorFilter] = useState('ALL');

  // Active Question Navigation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [showKeyInSimulation, setShowKeyInSimulation] = useState(true);
  const [imageZoom, setImageZoom] = useState(false);

  // Simulated Student Responses (Interactive tryout state)
  const [simulatedAnswers, setSimulatedAnswers] = useState<Record<string, any>>({});
  const [doubtStatus, setDoubtStatus] = useState<Record<string, boolean>>({});

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return questions.filter(item => {
      if (!item) return false;
      const textMatch =
        !q ||
        item.questionText.toLowerCase().includes(q) ||
        (item.topic && item.topic.toLowerCase().includes(q)) ||
        (item.authorName && item.authorName.toLowerCase().includes(q)) ||
        (item.indicator && item.indicator.toLowerCase().includes(q));

      const subjectMatch = subjectFilter === 'ALL' || item.subjectId === subjectFilter;
      const gradeMatch = gradeFilter === 'ALL' || String(item.grade) === gradeFilter;
      const typeMatch = typeFilter === 'ALL' || item.type === typeFilter;
      const authorMatch =
        authorFilter === 'ALL' ||
        (item.authorName && item.authorName.toLowerCase() === authorFilter.toLowerCase());

      return textMatch && subjectMatch && gradeMatch && typeMatch && authorMatch;
    });
  }, [questions, searchTerm, subjectFilter, gradeFilter, typeFilter, authorFilter]);

  // Current active question
  const currentQ = filteredQuestions[currentIndex] || filteredQuestions[0];

  // Map of unique authors
  const authorsList = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => {
      if (q.authorName && q.authorName.trim()) set.add(q.authorName.trim());
    });
    return Array.from(set);
  }, [questions]);

  // Current question's subject & school
  const currentSubject = subjects.find(s => s.id === currentQ?.subjectId);
  const currentSchool = schools.find(s => s.id === currentQ?.schoolId);

  // Handle simulation answers
  const handleSelectMcq = (optKey: string) => {
    if (!currentQ) return;
    setSimulatedAnswers(prev => ({ ...prev, [currentQ.id]: optKey }));
  };

  const handleToggleComplexMcq = (optKey: string) => {
    if (!currentQ) return;
    const currentList: string[] = Array.isArray(simulatedAnswers[currentQ.id])
      ? simulatedAnswers[currentQ.id]
      : [];
    const nextList = currentList.includes(optKey)
      ? currentList.filter(k => k !== optKey)
      : [...currentList, optKey];
    setSimulatedAnswers(prev => ({ ...prev, [currentQ.id]: nextList }));
  };

  const handleSelectTrueFalseItem = (itemIdx: number, val: boolean) => {
    if (!currentQ) return;
    const currentTF: Record<number, boolean> = simulatedAnswers[currentQ.id] || {};
    setSimulatedAnswers(prev => ({
      ...prev,
      [currentQ.id]: { ...currentTF, [itemIdx]: val }
    }));
  };

  const handleToggleDoubt = () => {
    if (!currentQ) return;
    setDoubtStatus(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const handleResetSimulation = () => {
    setSimulatedAnswers({});
    setDoubtStatus({});
    showToast('info', 'Simulasi Direset', 'Jawaban simulasi telah dikosongkan.');
  };

  const handlePrintPaper = () => {
    window.print();
  };

  // Helper text size class
  const getTextSizeClass = () => {
    if (fontSize === 'large') return 'text-base leading-relaxed';
    if (fontSize === 'xlarge') return 'text-lg leading-loose';
    return 'text-sm leading-relaxed';
  };

  return (
    <div className="space-y-6 font-geist pb-12">
      {/* 1. TOP HEADER & NAVIGATION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl shadow-xs">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Pratinjau & Simulasi Tampilan Soal CBT
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {filteredQuestions.length} Soal Tersedia
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Verifikasi bentuk tampilan naskah soal yang telah di-upload saat tampil di layar komputer & gawai siswa
              </p>
            </div>
          </div>

          {/* Mode Tampilan & Tombol Aksi */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Tabs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setViewMode('cbt_simulation')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                  viewMode === 'cbt_simulation'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Simulasi CBT Siswa</span>
                <span className="sm:hidden">Simulasi CBT</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('paper_exam')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                  viewMode === 'paper_exam'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Naskah Cetak (Kertas)</span>
                <span className="sm:hidden">Naskah Cetak</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('key_discussion')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                  viewMode === 'key_discussion'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kunci & Rubrik</span>
                <span className="sm:hidden">Kunci Jawaban</span>
              </button>
            </div>

            {/* Quick Print Button */}
            {viewMode === 'paper_exam' && (
              <button
                type="button"
                onClick={handlePrintPaper}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar Soal</span>
              </button>
            )}

            {/* Reset Simulation Answers */}
            {viewMode === 'cbt_simulation' && (
              <button
                type="button"
                onClick={handleResetSimulation}
                className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                title="Kosongkan jawaban simulasi"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2. FILTER & SEARCH TOOLBAR */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari teks soal, topik, indikator..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentIndex(0);
              }}
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Mapel Filter */}
          <div>
            <select
              value={subjectFilter}
              onChange={e => {
                setSubjectFilter(e.target.value);
                setCurrentIndex(0);
              }}
              aria-label="Filter Mata Pelajaran"
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Semua Mata Pelajaran ({subjects.length})</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Kelas Filter */}
          <div>
            <select
              value={gradeFilter}
              onChange={e => {
                setGradeFilter(e.target.value);
                setCurrentIndex(0);
              }}
              aria-label="Filter Tingkat Kelas"
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Semua Tingkat Kelas</option>
              {[1, 2, 3, 4, 5, 6].map(g => (
                <option key={g} value={String(g)}>
                  Kelas {g} SD
                </option>
              ))}
            </select>
          </div>

          {/* Jenis Soal Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={e => {
                setTypeFilter(e.target.value);
                setCurrentIndex(0);
              }}
              aria-label="Filter Tipe Soal"
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Semua Tipe Soal</option>
              <option value="mcq">Pilihan Ganda (Tunggal)</option>
              <option value="complex_mcq">Pilihan Ganda Kompleks</option>
              <option value="matching">Menjodohkan</option>
              <option value="true_false">Benar / Salah (Matriks)</option>
              <option value="short_answer">Isian Singkat</option>
              <option value="essay">Uraian / Esai</option>
            </select>
          </div>

          {/* Penulis Soal Filter */}
          <div>
            <select
              value={authorFilter}
              onChange={e => {
                setAuthorFilter(e.target.value);
                setCurrentIndex(0);
              }}
              aria-label="Filter Penulis Soal"
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer truncate"
            >
              <option value="ALL">Semua Penulis Naskah</option>
              {authorsList.map((author, idx) => (
                <option key={idx} value={author}>
                  {author}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* JIKA TIDAK ADA SOAL YANG SESUAI FILTER */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <FileQuestion className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-700">Tidak ada butir soal yang sesuai filter</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Silakan sesuaikan kata kunci pencarian, filter mata pelajaran, atau unggah naskah soal melalui menu Bank Soal / Impor Soal.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSubjectFilter('ALL');
              setGradeFilter('ALL');
              setTypeFilter('ALL');
              setAuthorFilter('ALL');
            }}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <>
          {/* ============================================================== */}
          {/* MODE 1: SIMULASI CBT SISWA (BENTUK TAMPILAN DI KOMPUTER & GAWAI) */}
          {/* ============================================================== */}
          {viewMode === 'cbt_simulation' && (
            <div className="space-y-4">
              {/* Device Selector & CBT Top Controls Bar */}
              <div className="bg-slate-900 text-white rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md no-print">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Simulasi Gawai:
                  </span>
                  <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 overflow-x-auto max-w-full">
                    <button
                      type="button"
                      onClick={() => setDeviceMode('desktop')}
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                        deviceMode === 'desktop'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">PC / Laptop Lab</span>
                      <span className="sm:hidden">PC</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeviceMode('tablet')}
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                        deviceMode === 'tablet'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Tablet className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Tablet Siswa</span>
                      <span className="sm:hidden">Tablet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeviceMode('mobile')}
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                        deviceMode === 'mobile'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Smartphone</span>
                      <span className="sm:hidden">HP</span>
                    </button>
                  </div>
                </div>

                {/* Right controls: Font Size & Toggle Key View */}
                <div className="flex items-center gap-3">
                  {/* Font Size Selector */}
                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                    <span className="text-[10px] text-slate-400 px-1 font-bold">Ukuran Font:</span>
                    <button
                      type="button"
                      onClick={() => setFontSize('normal')}
                      className={`px-2 py-0.5 rounded text-xs font-bold cursor-pointer ${
                        fontSize === 'normal' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      A
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSize('large')}
                      className={`px-2 py-0.5 rounded text-sm font-bold cursor-pointer ${
                        fontSize === 'large' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      A+
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSize('xlarge')}
                      className={`px-2 py-0.5 rounded text-base font-bold cursor-pointer ${
                        fontSize === 'xlarge' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      A++
                    </button>
                  </div>

                  {/* Toggle Key Hint */}
                  <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showKeyInSimulation}
                      onChange={e => setShowKeyInSimulation(e.target.checked)}
                      className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Tampilkan Kunci Validasi</span>
                  </label>
                </div>
              </div>

              {/* SCREEN CONTAINER WITH RESPONSIVE DEVICE FRAME */}
              <div
                className={`mx-auto transition-all duration-300 ${
                  deviceMode === 'desktop'
                    ? 'w-full'
                    : deviceMode === 'tablet'
                    ? 'max-w-3xl'
                    : 'max-w-md'
                }`}
              >
                <div className="bg-slate-50 border-4 border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
                  
                  {/* SIMULATED CBT APP HEADER */}
                  <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-5 py-3.5 flex items-center justify-between border-b border-indigo-900 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold font-mono text-sm">
                        CBT
                      </div>
                      <div>
                        <div className="text-xs font-bold tracking-wide flex items-center gap-2">
                          <span>{settings.appTitle || 'ASESMEN SEMESTER KECAMATAN'}</span>
                          <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded text-[9px] font-mono">
                            ONLINE
                          </span>
                        </div>
                        <div className="text-[10px] text-blue-200">
                          {currentSubject?.name || 'Mata Pelajaran'} • Kelas {currentQ?.grade || 6}
                        </div>
                      </div>
                    </div>

                    {/* Simulated Clock */}
                    <div className="flex items-center gap-2 bg-black/30 border border-white/10 px-3 py-1 rounded-xl">
                      <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      <span className="font-mono text-xs font-bold text-amber-300">
                        01:45:20
                      </span>
                    </div>
                  </div>

                  {/* CBT BODY: QUESTION CANVAS & RIGHT NUMBER PALETTE */}
                  <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white min-h-[520px]">
                    
                    {/* LEFT CANVAS: QUESTION & OPTIONS (Col-span 3) */}
                    <div className="lg:col-span-3 space-y-5">
                      
                      {/* Question Top Info Bar */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-bold font-mono text-xs shadow-2xs">
                            SOAL NO. {currentIndex + 1}
                          </span>
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-semibold text-[11px]">
                            Bobot: {currentQ?.points} Poin
                          </span>
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-semibold text-[11px] capitalize">
                            Tipe: {currentQ?.type.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Ragu-ragu checkbox button */}
                        <button
                          type="button"
                          onClick={handleToggleDoubt}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            doubtStatus[currentQ.id]
                              ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-xs'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${doubtStatus[currentQ.id] ? 'fill-current' : ''}`} />
                          <span>{doubtStatus[currentQ.id] ? 'Ragu-Ragu (Ditandai)' : 'Ragu-Ragu'}</span>
                        </button>
                      </div>

                      {/* STIMULUS & QUESTION TEXT */}
                      <div className="space-y-4">
                        {/* Stimulus Gambar / Diagram jika ada */}
                        {currentQ?.imageUrl && (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center space-y-2">
                            <div className="relative group max-w-full">
                              <img
                                src={currentQ.imageUrl}
                                alt="Stimulus Ilustrasi Soal"
                                className={`rounded-xl object-contain border border-slate-200 bg-white shadow-2xs transition-all ${
                                  imageZoom ? 'w-full max-h-96' : 'max-h-56'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => setImageZoom(!imageZoom)}
                                className="absolute bottom-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-lg text-xs shadow-md transition cursor-pointer"
                                title="Perbesar / Perkecil Gambar"
                              >
                                <ZoomIn className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {currentQ.imageCaption && (
                              <p className="text-[11px] text-slate-500 italic text-center">
                                {currentQ.imageCaption}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Pertanyaan / Soal Teks */}
                        <div className={`text-slate-800 font-medium whitespace-pre-line ${getTextSizeClass()}`}>
                          {currentQ?.questionText}
                        </div>
                      </div>

                      {/* ========================================= */}
                      {/* BENTUK TAMPILAN OPSI JAWABAN INTERAKTIF   */}
                      {/* ========================================= */}
                      <div className="pt-2">
                        {/* 1. Tipe MCQ (Pilihan Ganda Biasa Tunggal) */}
                        {currentQ?.type === 'mcq' && (
                          <div className="space-y-2.5">
                            {(currentQ.options || []).map(opt => {
                              const isSelected = simulatedAnswers[currentQ.id] === opt.key;
                              const isCorrectAnswer = currentQ.correctAnswer === opt.key;

                              return (
                                <label
                                  key={opt.key}
                                  onClick={() => handleSelectMcq(opt.key)}
                                  className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition cursor-pointer ${
                                    isSelected
                                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                                  }`}
                                >
                                  {/* Radio Round Button */}
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border transition ${
                                      isSelected
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-slate-100 text-slate-700 border-slate-300'
                                    }`}
                                  >
                                    {opt.key}
                                  </div>

                                  <div className="flex-1 text-xs text-slate-800 leading-relaxed font-normal pt-0.5">
                                    {opt.text}
                                  </div>

                                  {/* Indikator Kunci Jawaban Validasi jika diaktifkan */}
                                  {showKeyInSimulation && isCorrectAnswer && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                      Kunci Jawaban
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* 2. Tipe Complex MCQ (Pilihan Ganda Kompleks - Checkboxes) */}
                        {currentQ?.type === 'complex_mcq' && (
                          <div className="space-y-2.5">
                            <p className="text-[11px] text-slate-500 italic mb-2 font-medium">
                              (Pilihlah satu atau lebih dari satu jawaban yang benar)
                            </p>
                            {(currentQ.complexOptions || []).map(opt => {
                              const selectedList: string[] = simulatedAnswers[currentQ.id] || [];
                              const isChecked = selectedList.includes(opt.id);

                              return (
                                <label
                                  key={opt.id}
                                  onClick={() => handleToggleComplexMcq(opt.id)}
                                  className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition cursor-pointer ${
                                    isChecked
                                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleComplexMcq(opt.id)}
                                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <div className="flex-1 text-xs text-slate-800 leading-relaxed">
                                    {opt.label}
                                  </div>

                                  {showKeyInSimulation && opt.isCorrect && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                                      Kunci Benar
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* 3. Tipe Benar / Salah (True/False Matrix) */}
                        {currentQ?.type === 'true_false' && (
                          <div className="space-y-3">
                            <p className="text-[11px] text-slate-500 italic font-medium">
                              (Tentukan pilihan BENAR atau SALAH pada masing-masing butir pernyataan di bawah ini)
                            </p>

                            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                  <tr>
                                    <th className="py-2.5 px-3 w-8 text-center">No</th>
                                    <th className="py-2.5 px-4">Pernyataan Analisis</th>
                                    <th className="py-2.5 px-3 w-24 text-center">Pilihan Siswa</th>
                                    {showKeyInSimulation && (
                                      <th className="py-2.5 px-3 w-20 text-center bg-indigo-50 text-indigo-900">
                                        Kunci
                                      </th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {(currentQ.trueFalseItems || []).map((tfItem, tfIdx) => {
                                    const currentChoice = simulatedAnswers[currentQ.id]?.[tfIdx];

                                    return (
                                      <tr key={tfItem.id || tfIdx} className="hover:bg-slate-50/70 transition">
                                        <td className="py-3 px-3 text-center text-slate-400 font-mono font-bold">
                                          {tfIdx + 1}
                                        </td>
                                        <td className="py-3 px-4 font-medium text-slate-800 leading-relaxed">
                                          {tfItem.statement}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                          <div className="flex items-center justify-center gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => handleSelectTrueFalseItem(tfIdx, true)}
                                              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer border ${
                                                currentChoice === true
                                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                              }`}
                                            >
                                              BENAR
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleSelectTrueFalseItem(tfIdx, false)}
                                              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer border ${
                                                currentChoice === false
                                                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                              }`}
                                            >
                                              SALAH
                                            </button>
                                          </div>
                                        </td>
                                        {showKeyInSimulation && (
                                          <td className="py-3 px-3 text-center bg-indigo-50/40">
                                            <span
                                              className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                                tfItem.isCorrect
                                                  ? 'bg-emerald-100 text-emerald-800'
                                                  : 'bg-rose-100 text-rose-800'
                                              }`}
                                            >
                                              {tfItem.isCorrect ? 'BENAR' : 'SALAH'}
                                            </span>
                                          </td>
                                        )}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* 4. Tipe Menjodohkan (Matching) */}
                        {currentQ?.type === 'matching' && (
                          <div className="space-y-3">
                            <p className="text-[11px] text-slate-500 italic font-medium">
                              (Pasangkan pernyataan di kolom sebelah kiri dengan jawaban yang sesuai di kolom sebelah kanan)
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {(currentQ.matchingPairs || []).map((pair, pIdx) => (
                                <div
                                  key={pair.id || pIdx}
                                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:border-indigo-300 transition"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                                      {pIdx + 1}
                                    </span>
                                    <span className="font-semibold text-slate-800 text-xs">
                                      {pair.leftPrompt}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 pl-7 text-xs text-indigo-900 bg-white p-2 rounded-lg border border-slate-200 font-medium">
                                    <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                    <span>Pasangan: <strong>{pair.rightAnswer}</strong></span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 5. Tipe Isian Singkat & Uraian (Optional) */}
                        {((currentQ?.type as string) === 'short_answer' || (currentQ?.type as string) === 'essay') && (
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-700 block">
                              Kotak Teks Lembar Jawaban Siswa:
                            </label>
                            {(currentQ.type as string) === 'short_answer' ? (
                              <input
                                type="text"
                                placeholder="Ketikkan jawaban singkat Anda di sini..."
                                value={simulatedAnswers[currentQ.id] || ''}
                                onChange={e =>
                                  setSimulatedAnswers(prev => ({
                                    ...prev,
                                    [currentQ.id]: e.target.value
                                  }))
                                }
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                              />
                            ) : (
                              <textarea
                                rows={4}
                                placeholder="Tuliskan uraian dan penjelasan jawaban Anda secara lengkap di sini..."
                                value={simulatedAnswers[currentQ.id] || ''}
                                onChange={e =>
                                  setSimulatedAnswers(prev => ({
                                    ...prev,
                                    [currentQ.id]: e.target.value
                                  }))
                                }
                                className="w-full p-4 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                              />
                            )}

                            {showKeyInSimulation && (
                              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                                <span className="font-bold flex items-center gap-1.5 text-emerald-950">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  Kunci / Pedoman Penilaian Uraian:
                                </span>
                                <p className="leading-relaxed">
                                  {currentQ.correctAnswer || currentQ.discussion || 'Jawaban fleksibel sesuai rubrik penilaian guru.'}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* CBT FOOTER BUTTONS: PREV / NEXT */}
                      <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentIndex === 0}
                          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                            currentIndex === 0
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-2xs'
                          }`}
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span className="hidden sm:inline">Soal Sebelumnya</span>
                          <span className="sm:hidden">Sebelumnya</span>
                        </button>

                        <span className="text-[11px] sm:text-xs text-slate-500 font-mono font-semibold px-2 text-center">
                          {currentIndex + 1} / {filteredQuestions.length}
                        </span>

                        <button
                          type="button"
                          onClick={() => setCurrentIndex(prev => Math.min(filteredQuestions.length - 1, prev + 1))}
                          disabled={currentIndex === filteredQuestions.length - 1}
                          className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                            currentIndex === filteredQuestions.length - 1
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                          }`}
                        >
                          <span className="hidden sm:inline">Soal Berikutnya</span>
                          <span className="sm:hidden">Berikutnya</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                    {/* RIGHT SIDEBAR: QUESTION NUMBER PALETTE GRID */}
                    <div className="border-t lg:border-t-0 lg:border-l border-slate-200 lg:pl-5 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Daftar Nomor Soal
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Klik nomor untuk beralih langsung
                        </p>
                      </div>

                      {/* Number Grid */}
                      <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
                        {filteredQuestions.map((qItem, idx) => {
                          const isActive = currentIndex === idx;
                          const isAnswered = simulatedAnswers[qItem.id] !== undefined;
                          const isDoubt = doubtStatus[qItem.id];

                          let btnColor = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100';
                          if (isDoubt) {
                            btnColor = 'bg-amber-400 text-slate-900 border-amber-500 font-bold';
                          } else if (isAnswered) {
                            btnColor = 'bg-indigo-600 text-white border-indigo-600 font-bold';
                          }

                          if (isActive) {
                            btnColor += ' ring-2 ring-blue-500 ring-offset-2';
                          }

                          return (
                            <button
                              key={qItem.id}
                              type="button"
                              onClick={() => setCurrentIndex(idx)}
                              className={`h-9 rounded-xl border text-xs flex items-center justify-center transition cursor-pointer font-mono ${btnColor}`}
                              title={`Soal #${idx + 1}`}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="pt-3 border-t border-slate-200 space-y-1.5 text-[11px] text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded bg-indigo-600 shrink-0"></span>
                          <span>Sudah Dijawab</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded bg-amber-400 shrink-0"></span>
                          <span>Ragu-Ragu</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300 shrink-0"></span>
                          <span>Belum Dijawab</span>
                        </div>
                      </div>

                      {/* Info Penulis Soal */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Identitas Penulis Soal:
                        </span>
                        <p className="font-bold text-slate-800">
                          {currentQ?.authorName || 'Penyusun Naskah Kecamatan'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {currentSchool ? currentSchool.name : 'Satuan Pendidikan Kecamatan'}
                        </p>
                        {currentQ?.indicator && (
                          <p className="text-[10px] text-slate-400 mt-1 italic">
                            Indikator: {currentQ.indicator}
                          </p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODE 2: LEMBAR NASKAH SOAL CETAK (PRINTABLE EXAM PAPER VIEW)  */}
          {/* ============================================================== */}
          {viewMode === 'paper_exam' && (
            <div className="bg-white rounded-2xl border border-slate-300 p-8 shadow-md max-w-4xl mx-auto printable-exam-paper">
              
              {/* Kop Surat Naskah Ujian Resmi */}
              <div className="text-center border-b-2 border-black pb-4 mb-6 space-y-1">
                <h3 className="font-bold text-sm uppercase tracking-wider text-black">
                  PEMERINTAH KABUPATEN MALANG • DINAS PENDIDIKAN
                </h3>
                <h2 className="font-extrabold text-base uppercase text-black">
                  KORWIL BIDANG PENDIDIKAN {settings.districtName?.toUpperCase() || 'KECAMATAN AMPELGADING'}
                </h2>
                <h1 className="font-extrabold text-lg uppercase tracking-wide text-black">
                  LEMBAR NASKAH SOAL ASESMEN SUMATIF TINGKAT KECAMATAN
                </h1>
                <p className="text-xs text-black italic">
                  Tahun Pelajaran: {settings.academicYear || '2026/2027'} • Semester: {settings.activeSemester || 'Ganjil'}
                </p>
              </div>

              {/* Header Kolom Identitas Ujian */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-300 text-xs text-black mb-6">
                <div className="space-y-1">
                  <div>Mata Pelajaran : <strong>{currentSubject?.name || 'Semua Mata Pelajaran'}</strong></div>
                  <div>Tingkat Kelas : <strong>{gradeFilter !== 'ALL' ? `Kelas ${gradeFilter}` : 'Semua Kelas'}</strong></div>
                  <div>Jumlah Soal : <strong>{filteredQuestions.length} Butir</strong></div>
                </div>
                <div className="space-y-1">
                  <div>Hari / Tanggal : <strong>................................................</strong></div>
                  <div>Waktu Pengerjaan : <strong>90 Menit</strong></div>
                  <div>Nama Peserta : <strong>................................................</strong></div>
                </div>
              </div>

              {/* Petunjuk Umum */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1 mb-6">
                <p className="font-bold">PETUNJUK PENGERJAAN:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-600">
                  <li>Tulislah nama dan nomor peserta Anda pada lembar jawaban yang telah disediakan.</li>
                  <li>Periksa dan bacalah setiap butir soal dengan saksama sebelum Anda menjawabnya.</li>
                  <li>Untuk soal pilihan ganda, berilah tanda silang (X) pada salah satu huruf opsi jawaban yang Anda anggap paling benar.</li>
                  <li>Laporkan kepada pengawas ujian apabila terdapat lembar soal yang kurang jelas, rusak, atau tidak lengkap.</li>
                </ol>
              </div>

              {/* Daftar Butir Soal Terformat */}
              <div className="space-y-6 text-xs text-black">
                {filteredQuestions.map((q, idx) => (
                  <div key={q.id} className="space-y-2.5 pb-4 border-b border-slate-200 last:border-b-0 break-inside-avoid">
                    <div className="flex items-start gap-2.5">
                      <span className="font-bold font-mono text-sm shrink-0">{idx + 1}.</span>
                      <div className="flex-1 space-y-2">
                        {/* Stimulus Gambar Cetak */}
                        {q.imageUrl && (
                          <div className="py-1">
                            <img
                              src={q.imageUrl}
                              alt="Gambar Soal"
                              className="max-h-48 object-contain border border-slate-300 rounded p-1 bg-white"
                            />
                            {q.imageCaption && (
                              <p className="text-[10px] text-slate-500 italic mt-0.5">{q.imageCaption}</p>
                            )}
                          </div>
                        )}

                        <p className="font-semibold text-slate-900 leading-relaxed text-xs">
                          {q.questionText}
                        </p>

                        {/* Opsi Jawaban MCQ */}
                        {q.type === 'mcq' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pt-1 pl-2">
                            {(q.options || []).map(opt => (
                              <div key={opt.key} className="flex items-start gap-2 text-slate-800">
                                <span className="font-bold">{opt.key}.</span>
                                <span>{opt.text}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Opsi PG Kompleks */}
                        {q.type === 'complex_mcq' && (
                          <div className="space-y-1.5 pt-1 pl-2">
                            <p className="text-[10px] italic text-slate-500">[ Berikan tanda centang pada opsi yang benar ]</p>
                            {(q.complexOptions || []).map(opt => (
                              <div key={opt.id} className="flex items-start gap-2 text-slate-800">
                                <span className="font-mono">[  ]</span>
                                <span>{opt.label}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Matriks Benar Salah */}
                        {q.type === 'true_false' && (
                          <div className="pt-1">
                            <table className="w-full text-left text-xs border border-slate-300">
                              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                                <tr>
                                  <th className="py-1 px-2 w-6 text-center">No</th>
                                  <th className="py-1 px-3">Pernyataan</th>
                                  <th className="py-1 px-3 w-16 text-center border-l border-slate-300">BENAR</th>
                                  <th className="py-1 px-3 w-16 text-center border-l border-slate-300">SALAH</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {(q.trueFalseItems || []).map((tf, i) => (
                                  <tr key={i}>
                                    <td className="py-1 px-2 text-center font-mono">{i + 1}</td>
                                    <td className="py-1 px-3">{tf.statement}</td>
                                    <td className="py-1 px-3 text-center border-l border-slate-300">[  ]</td>
                                    <td className="py-1 px-3 text-center border-l border-slate-300">[  ]</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Menjodohkan */}
                        {q.type === 'matching' && (
                          <div className="grid grid-cols-2 gap-4 pt-1">
                            <div className="space-y-1">
                              <span className="font-bold block text-[11px]">Kolom A (Premis):</span>
                              {(q.matchingPairs || []).map((p, i) => (
                                <div key={i} className="pl-2">
                                  {i + 1}. {p.leftPrompt}
                                </div>
                              ))}
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold block text-[11px]">Kolom B (Pilihan):</span>
                              {(q.matchingPairs || []).map((p, i) => (
                                <div key={i} className="pl-2">
                                  ({String.fromCharCode(65 + i)}) {p.rightAnswer}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODE 3: KUNCI JAWABAN & RUBRIK PEMBAHASAN                     */}
          {/* ============================================================== */}
          {viewMode === 'key_discussion' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">
                      Rubrik Kunci Jawaban & Bobot Penilaian Naskah Soal
                    </h3>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Digunakan oleh tim penilai, pengawas asesmen, dan admin untuk verifikasi keabsahan butir naskah
                    </p>
                  </div>
                </div>
                <div className="font-mono text-xs font-bold text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-300 shadow-2xs">
                  Total Butir: {filteredQuestions.length} | Nilai Maksimal: {filteredQuestions.reduce((a, b) => a + (b.points || 0), 0)} Poin
                </div>
              </div>

              {/* Table of Answer Keys */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">No</th>
                        <th className="py-3 px-4">Teks Pertanyaan & Stimulus</th>
                        <th className="py-3 px-3 w-28">Tipe Soal</th>
                        <th className="py-3 px-3 w-36">Kunci Jawaban Sah</th>
                        <th className="py-3 px-3 w-20 text-center">Bobot</th>
                        <th className="py-3 px-4">Indikator & Pembahasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredQuestions.map((q, idx) => (
                        <tr key={q.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900 line-clamp-2">
                              {q.questionText}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              Penulis: {q.authorName || 'Kecamatan'} • Kelas {q.grade}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                              {q.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {q.type === 'mcq' && (
                              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold font-mono">
                                Opsi {q.correctAnswer}
                              </span>
                            )}
                            {q.type === 'complex_mcq' && (
                              <div className="flex flex-wrap gap-1">
                                {(q.complexOptions || []).filter(o => o.isCorrect).map(o => (
                                  <span key={o.id} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                    {o.label}
                                  </span>
                                ))}
                              </div>
                            )}
                            {q.type === 'true_false' && (
                              <div className="space-y-0.5 font-mono text-[10px]">
                                {(q.trueFalseItems || []).map((tf, i) => (
                                  <span
                                    key={i}
                                    className={`inline-block mr-1 px-1 rounded font-bold ${
                                      tf.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {i + 1}:{tf.isCorrect ? 'B' : 'S'}
                                  </span>
                                ))}
                              </div>
                            )}
                            {q.type === 'matching' && (
                              <span className="text-[10px] text-purple-700 font-semibold">
                                {q.matchingPairs?.length} Pasangan Terhubung
                              </span>
                            )}
                            {((q.type as string) === 'short_answer' || (q.type as string) === 'essay') && (
                              <span className="font-semibold text-slate-700 text-[11px]">
                                {q.correctAnswer || 'Sesuai Rubrik'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                            {q.points} Poin
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              {q.discussion || q.indicator || 'Belum ada catatan pembahasan khusus.'}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
