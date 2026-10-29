import React, { useState } from 'react';
import {
  FileQuestion,
  Plus,
  Search,
  Download,
  Filter,
  Edit2,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Eye,
  Layers,
  Sparkles
} from 'lucide-react';
import { Question, Subject, UserRole } from '../../types';
import { AppStorage } from '../../services/storage';
import { ExcelService } from '../../services/excelService';
import { SoalEditorModal } from './SoalEditorModal';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';

interface BankSoalProps {
  questions: Question[];
  subjects: Subject[];
  authorName: string;
  authorRole: UserRole;
  schoolId?: string;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
  onNavigate?: (tab: string) => void;
}

export const BankSoal: React.FC<BankSoalProps> = ({
  questions,
  subjects,
  authorName,
  authorRole,
  schoolId,
  onRefresh,
  showToast,
  onNavigate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Selection & Bulk Delete state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    question?: Question;
    count: number;
  }>({
    isOpen: false,
    type: 'single',
    count: 1
  });

  const filteredQuestions = questions.filter(q => {
    const matchSearch =
      q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = subjectFilter === 'ALL' || q.subjectId === subjectFilter;
    const matchGrade = gradeFilter === 'ALL' || String(q.grade) === gradeFilter;
    const matchType = typeFilter === 'ALL' || q.type === typeFilter;
    return matchSearch && matchSubject && matchGrade && matchType;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredQuestions.map(q => q.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePromptDeleteSingle = (question: Question) => {
    setDeleteTarget({
      isOpen: true,
      type: 'single',
      question,
      count: 1
    });
  };

  const handlePromptDeleteBulk = () => {
    if (selectedIds.length === 0) return;
    setDeleteTarget({
      isOpen: true,
      type: 'bulk',
      count: selectedIds.length
    });
  };

  const handleExecuteDelete = () => {
    if (deleteTarget.type === 'single' && deleteTarget.question) {
      const q = deleteTarget.question;
      AppStorage.deleteQuestion(q.id);
      AppStorage.logActivity(authorName, authorRole, 'Hapus Soal', `Menghapus butir soal ID: ${q.id} (Topik: ${q.topic})`);
      setSelectedIds(prev => prev.filter(id => id !== q.id));
      onRefresh();
      showToast('success', 'Soal Dihapus', `Butir soal "${q.topic}" berhasil dihapus.`);
    } else if (deleteTarget.type === 'bulk') {
      const count = selectedIds.length;
      AppStorage.deleteQuestions(selectedIds);
      AppStorage.logActivity(authorName, authorRole, 'Hapus Soal Massal', `Menghapus ${count} butir soal sekaligus.`);
      setSelectedIds([]);
      onRefresh();
      showToast('success', 'Penghapusan Massal Berhasil', `Sebanyak ${count} butir soal berhasil dihapus dari bank soal.`);
    }
  };

  const handleOpenAdd = () => {
    setSelectedQuestion(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setSelectedQuestion(q);
    setIsEditorOpen(true);
  };

  const handleSaveQuestion = (question: Question) => {
    AppStorage.saveQuestion(question);
    AppStorage.logActivity(authorName, authorRole, selectedQuestion ? 'Edit Soal' : 'Tambah Soal', `Menyimpan soal model ${question.type} pada mapel: ${question.subjectId}`);
    setIsEditorOpen(false);
    onRefresh();
    showToast('success', 'Soal Berhasil Disimpan', `Soal "${question.topic}" telah tersimpan di bank soal.`);
  };

  const handleExport = () => {
    ExcelService.exportQuestions(filteredQuestions, subjects);
    showToast('success', 'Ekspor Berhasil', 'Bank soal berhasil diekspor ke file Excel.');
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'mcq':
        return <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]">Pilihan Ganda</span>;
      case 'complex_mcq':
        return <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold text-[10px]">PG Kompleks</span>;
      case 'matching':
        return <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px]">Menjodohkan</span>;
      case 'true_false':
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">Benar / Salah</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-blue-600" />
            Bank Soal Ujian Semester (4 Format Standar)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kumpulan soal Pilihan Ganda, PG Kompleks, Menjodohkan, dan Benar/Salah lengkap dengan gambar
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate(authorRole === 'guru' ? 'guru-preview-soal' : 'admin-preview-soal')}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Lihat simulasi CBT tampilan siswa dan naskah cetak"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Preview Tampilan CBT</span>
              <span className="sm:hidden">Preview CBT</span>
            </button>
          )}
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Ekspor Soal Excel</span>
            <span className="sm:hidden">Ekspor Excel</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tulis Soal Baru</span>
            <span className="sm:hidden">Tulis Soal</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari pertanyaan, topik materi, kata kunci..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Mapel Filter */}
          <select
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            aria-label="Filter mata pelajaran"
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">Semua Mapel</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Grade Filter */}
          <select
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value)}
            aria-label="Filter tingkat kelas"
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">Semua Kelas</option>
            {[1, 2, 3, 4, 5, 6].map(g => (
              <option key={g} value={String(g)}>Kelas {g}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            aria-label="Filter jenis model soal"
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">Semua Jenis Soal</option>
            <option value="mcq">Pilihan Ganda Biasa</option>
            <option value="complex_mcq">PG Kompleks</option>
            <option value="matching">Menjodohkan</option>
            <option value="true_false">Benar / Salah</option>
          </select>
        </div>
      </div>

      {/* Bulk Delete Toolbar for Bank Soal */}
      {selectedIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs text-rose-900 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
            <span>{selectedIds.length} dari {filteredQuestions.length} butir soal dipilih</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(filteredQuestions.map(q => q.id))}
              className="px-2.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg transition"
            >
              Pilih Semua ({filteredQuestions.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition"
            >
              Batalkan Pilihan
            </button>
            <button
              type="button"
              onClick={handlePromptDeleteBulk}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus {selectedIds.length} Soal Terpilih
            </button>
          </div>
        </div>
      )}

      {/* Questions List Cards */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            <FileQuestion className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">Belum Ada Soal yang Sesuai</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau tambah soal baru.</p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const sub = subjects.find(s => s.id === q.subjectId);
            const isChecked = selectedIds.includes(q.id);

            return (
              <div
                key={q.id}
                className={`bg-white rounded-xl border p-4 shadow-2xs hover:shadow-md transition text-xs ${
                  isChecked ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="checkbox"
                      aria-label={`Pilih soal nomor ${idx + 1}`}
                      checked={isChecked}
                      onChange={() => handleToggleSelect(q.id)}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer mr-1"
                    />
                    <span
                      className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]"
                      title={q.orderNumber ? `Nomor Urut Naskah Excel: ${q.orderNumber}` : `Soal #${idx + 1}`}
                    >
                      {q.orderNumber ? `No. ${q.orderNumber}` : `#${idx + 1}`}
                    </span>
                    {getTypeBadge(q.type)}
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                      {sub ? sub.name : q.subjectId} • Kelas {q.grade}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Tingkat: <strong className="capitalize text-slate-600">{q.difficulty}</strong>
                    </span>
                    {q.imageUrl && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                        <ImageIcon className="w-3 h-3" /> Ada Gambar
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {q.points} Poin
                    </span>
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      title="Edit / Pratinjau Soal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handlePromptDeleteSingle(q)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body Preview */}
                <div className="pt-3 space-y-2">
                  <div className="flex items-start gap-4">
                    {q.imageUrl && (
                      <img
                        src={q.imageUrl}
                        alt="Ilustrasi"
                        className="w-20 h-20 object-contain rounded-lg border border-slate-200 bg-slate-50 shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 leading-relaxed line-clamp-3">
                        {q.questionText}
                      </p>
                      
                      {/* Answer Key hint */}
                      <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap gap-2 items-center">
                        <span className="font-semibold text-slate-700">Kunci:</span>
                        {q.type === 'mcq' && (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                            Pilihan {q.correctAnswer}
                          </span>
                        )}
                        {q.type === 'complex_mcq' && (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm font-medium">
                            {q.complexOptions?.filter(o => o.isCorrect).map(o => o.label).join('; ')}
                          </span>
                        )}
                        {q.type === 'matching' && (
                          <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-sm font-medium">
                            {q.matchingPairs?.length} Pasangan Terpasang
                          </span>
                        )}
                        {q.type === 'true_false' && (
                          q.trueFalseItems && q.trueFalseItems.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-sm">
                                {q.trueFalseItems.length} Pernyataan:
                              </span>
                              {q.trueFalseItems.map((item, i) => (
                                <span
                                  key={item.id || i}
                                  className={`px-1.5 py-0.5 rounded-sm font-bold text-[10px] ${
                                    item.isCorrect
                                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                      : 'text-rose-700 bg-rose-50 border border-rose-200'
                                  }`}
                                  title={item.statement}
                                >
                                  {i + 1}. {item.isCorrect ? 'BENAR' : 'SALAH'}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                              {q.trueFalseAnswer ? 'BENAR' : 'SALAH'}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400 border-t border-slate-100">
                    <span>Penulis: {q.authorName} ({q.authorRole.toUpperCase()})</span>
                    <span>Status: <strong className="uppercase text-emerald-600">{q.status}</strong></span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Soal Editor Modal */}
      <SoalEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        questionToEdit={selectedQuestion}
        subjects={subjects}
        authorName={authorName}
        authorRole={authorRole}
        schoolId={schoolId}
        onSave={handleSaveQuestion}
      />

      {/* Modal Konfirmasi Hapus Soal */}
      <ConfirmDeleteModal
        isOpen={deleteTarget.isOpen}
        onClose={() => setDeleteTarget(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDelete}
        title={deleteTarget.type === 'bulk' ? 'Hapus Butir Soal Terpilih' : 'Hapus Butir Soal'}
        count={deleteTarget.count}
        message={
          deleteTarget.type === 'bulk'
            ? `Apakah Anda yakin ingin menghapus ${deleteTarget.count} butir soal yang dipilih dari Bank Soal?`
            : `Apakah Anda yakin ingin menghapus butir soal topik "${deleteTarget.question?.topic}"?`
        }
        detail={
          deleteTarget.type === 'single' && deleteTarget.question
            ? `ID: ${deleteTarget.question.id} • Tipe: ${deleteTarget.question.type.toUpperCase()} • Kelas: ${deleteTarget.question.grade}`
            : undefined
        }
        confirmLabel={deleteTarget.type === 'bulk' ? `Hapus ${deleteTarget.count} Soal` : 'Hapus Soal'}
      />
    </div>
  );
};
