import React, { useState } from 'react';
import {
  FileQuestion,
  Plus,
  Search,
  Download,
  Upload,
  Edit2,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Eye,
  Sparkles,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Question, Subject, User } from '../../types';
import { AppStorage } from '../../services/storage';
import { ExcelService } from '../../services/excelService';
import { SoalEditorModal } from '../admin/SoalEditorModal';

interface GuruBuatSoalViewProps {
  currentUser: User;
  questions: Question[];
  subjects: Subject[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const GuruBuatSoalView: React.FC<GuruBuatSoalViewProps> = ({
  currentUser,
  questions,
  subjects,
  onRefresh,
  showToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Filter teacher's own authored questions
  const myQuestions = questions.filter(
    q => q.authorName === currentUser.fullName || q.schoolId === currentUser.schoolId
  );

  const filtered = myQuestions.filter(q => {
    const matchSearch =
      q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'ALL' || q.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(q);
    setIsEditorOpen(true);
  };

  const handleSaveQuestion = (q: Question) => {
    AppStorage.saveQuestion(q);
    AppStorage.logActivity(currentUser.fullName, 'guru', 'Tulis Soal Guru', `Menyimpan soal model ${q.type} pada mapel: ${q.subjectId}`);
    setIsEditorOpen(false);
    onRefresh();
    showToast('success', 'Soal Berhasil Disimpan', `Soal topik "${q.topic}" telah tersimpan di bank soal.`);
  };

  const handleDelete = (q: Question) => {
    if (window.confirm('Yakin ingin menghapus butir soal ini?')) {
      AppStorage.deleteQuestion(q.id);
      AppStorage.logActivity(currentUser.fullName, 'guru', 'Hapus Soal Guru', `Menghapus soal: ${q.topic}`);
      onRefresh();
      showToast('info', 'Soal Dihapus', 'Soal berhasil dihapus.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-emerald-600" />
            Lembar Pembuatan & Editor Soal Ujian (Guru)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Susun naskah soal penilaian semester berbasis 4 model soal standar dan sematkan gambar ilustrasi
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition"
        >
          <Plus className="w-4 h-4" />
          Tulis Soal Baru
        </button>
      </div>

      {/* Quick Guide Card for Guru */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 text-xs text-emerald-950 space-y-2">
        <h4 className="font-bold flex items-center gap-2 text-emerald-900">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Ketentuan Penyusunan Butir Soal Ujian Semester SD:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-200">
            <span className="font-bold text-emerald-900 block">1. Pilihan Ganda</span>
            <span className="text-[11px] text-slate-600">4 Opsi (A-D), 1 kunci benar</span>
          </div>
          <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-200">
            <span className="font-bold text-emerald-900 block">2. PG Kompleks</span>
            <span className="text-[11px] text-slate-600">Dapat memilih &gt;1 jawaban benar</span>
          </div>
          <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-200">
            <span className="font-bold text-emerald-900 block">3. Menjodohkan</span>
            <span className="text-[11px] text-slate-600">Pasangan kiri & kanan</span>
          </div>
          <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-200">
            <span className="font-bold text-emerald-900 block">4. Benar / Salah</span>
            <span className="text-[11px] text-slate-600">Pernyataan evaluasi</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari naskah soal saya..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 shrink-0">Model Soal:</span>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="ALL">Semua Jenis Soal</option>
            <option value="mcq">Pilihan Ganda</option>
            <option value="complex_mcq">PG Kompleks</option>
            <option value="matching">Menjodohkan</option>
            <option value="true_false">Benar / Salah</option>
          </select>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
            <FileQuestion className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">Belum Ada Soal yang Dibuat</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan tombol "Tulis Soal Baru" di atas untuk mulai menyusun naskah soal.</p>
          </div>
        ) : (
          filtered.map((q, idx) => {
            const sub = subjects.find(s => s.id === q.subjectId);

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {q.type.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                      {sub?.name || q.subjectId} • Kelas {q.grade}
                    </span>
                    {q.imageUrl && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                        <ImageIcon className="w-3 h-3" /> Ada Gambar
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
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
                      onClick={() => handleDelete(q)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-3">
                  <p className="font-semibold text-slate-900 leading-relaxed line-clamp-2">
                    {q.questionText}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Topik: <strong className="text-slate-600">{q.topic}</strong> • Tingkat: {q.difficulty} • Status: {q.status}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Question Editor Modal */}
      <SoalEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        questionToEdit={editingQuestion}
        subjects={subjects}
        authorName={currentUser.fullName}
        authorRole={currentUser.role}
        schoolId={currentUser.schoolId}
        onSave={handleSaveQuestion}
      />
    </div>
  );
};
