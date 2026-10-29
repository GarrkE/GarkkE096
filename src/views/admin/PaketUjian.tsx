import React, { useState } from 'react';
import {
  CalendarCheck,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  FileQuestion,
  Shuffle,
  Eye,
  School as SchoolIcon,
  PlayCircle,
  AlertCircle
} from 'lucide-react';
import { ExamPackage, Subject, School, Question, SystemSettings, ExamStatus } from '../../types';
import { AppStorage } from '../../services/storage';
import { Modal } from '../../components/Modal';

interface PaketUjianProps {
  packages: ExamPackage[];
  subjects: Subject[];
  schools: School[];
  questions: Question[];
  settings: SystemSettings;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const PaketUjian: React.FC<PaketUjianProps> = ({
  packages,
  subjects,
  schools,
  questions,
  settings,
  onRefresh,
  showToast
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ExamPackage | null>(null);

  // Form State
  const [formState, setFormState] = useState<{
    title: string;
    academicYear: string;
    semester: 'Ganjil' | 'Genap';
    grade: number;
    subjectId: string;
    schoolIds: string[];
    classIds: string[];
    examDate: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    status: ExamStatus;
    showScoreImmediately: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    questionIds: string[];
  }>({
    title: '',
    academicYear: settings.academicYear,
    semester: settings.activeSemester,
    grade: 6,
    subjectId: subjects[0]?.id || 'sub-mtk',
    schoolIds: schools.map(s => s.id),
    classIds: ['cls-6a', 'cls-6b'],
    examDate: new Date().toISOString().slice(0, 10),
    startTime: '08:00',
    endTime: '09:30',
    durationMinutes: 60,
    status: 'scheduled',
    showScoreImmediately: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    questionIds: []
  });

  const handleOpenAdd = () => {
    setSelectedPackage(null);
    setFormState({
      title: 'Penilaian Akhir Semester (PAS) Baru',
      academicYear: settings.academicYear,
      semester: settings.activeSemester,
      grade: 6,
      subjectId: subjects[0]?.id || 'sub-mtk',
      schoolIds: schools.map(s => s.id),
      classIds: ['cls-6a'],
      examDate: new Date().toISOString().slice(0, 10),
      startTime: '08:00',
      endTime: '09:30',
      durationMinutes: 60,
      status: 'scheduled',
      showScoreImmediately: true,
      shuffleQuestions: false,
      shuffleOptions: false,
      questionIds: questions.filter(q => q.subjectId === subjects[0]?.id).map(q => q.id)
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (pkg: ExamPackage) => {
    setSelectedPackage(pkg);
    setFormState({
      title: pkg.title,
      academicYear: pkg.academicYear,
      semester: pkg.semester,
      grade: pkg.grade,
      subjectId: pkg.subjectId,
      schoolIds: pkg.schoolIds,
      classIds: pkg.classIds,
      examDate: pkg.examDate,
      startTime: pkg.startTime,
      endTime: pkg.endTime,
      durationMinutes: pkg.durationMinutes,
      status: pkg.status,
      showScoreImmediately: pkg.showScoreImmediately,
      shuffleQuestions: pkg.shuffleQuestions,
      shuffleOptions: pkg.shuffleOptions,
      questionIds: pkg.questionIds
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.title) {
      showToast('error', 'Validasi Gagal', 'Nama ujian wajib diisi.');
      return;
    }
    if (formState.questionIds.length === 0) {
      showToast('error', 'Validasi Gagal', 'Pilih minimal 1 soal dari Bank Soal untuk paket ini.');
      return;
    }

    const selectedQuestions = questions.filter(q => formState.questionIds.includes(q.id));
    const totalPoints = selectedQuestions.reduce((sum, q) => sum + (q.points || 10), 0);

    const pkgToSave: ExamPackage = {
      id: selectedPackage ? selectedPackage.id : 'pkg-' + Date.now(),
      title: formState.title.trim(),
      academicYear: formState.academicYear,
      semester: formState.semester,
      grade: formState.grade,
      subjectId: formState.subjectId,
      schoolIds: formState.schoolIds,
      classIds: formState.classIds,
      examDate: formState.examDate,
      startTime: formState.startTime,
      endTime: formState.endTime,
      durationMinutes: Number(formState.durationMinutes) || 60,
      totalQuestions: formState.questionIds.length,
      totalPoints,
      status: formState.status,
      showScoreImmediately: formState.showScoreImmediately,
      shuffleQuestions: formState.shuffleQuestions,
      shuffleOptions: formState.shuffleOptions,
      questionIds: formState.questionIds,
      createdAt: selectedPackage?.createdAt || new Date().toISOString().slice(0, 10)
    };

    AppStorage.saveExamPackage(pkgToSave);
    AppStorage.logActivity('Admin Kecamatan', 'admin', selectedPackage ? 'Edit Paket Ujian' : 'Tambah Paket Ujian', `Menyimpan jadwal ujian: ${pkgToSave.title}`);
    setIsFormOpen(false);
    onRefresh();
    showToast('success', 'Paket Ujian Disimpan', `Jadwal dan naskah paket "${pkgToSave.title}" berhasil diperbarui.`);
  };

  const handleDelete = (pkg: ExamPackage) => {
    if (window.confirm(`Yakin ingin menghapus paket ujian "${pkg.title}"?`)) {
      AppStorage.deleteExamPackage(pkg.id);
      AppStorage.logActivity('Admin Kecamatan', 'admin', 'Hapus Paket Ujian', `Menghapus paket ujian: ${pkg.title}`);
      onRefresh();
      showToast('info', 'Paket Dihapus', 'Paket ujian telah dihapus.');
    }
  };

  const handleToggleStatus = (pkg: ExamPackage) => {
    const nextStatus: ExamStatus =
      pkg.status === 'scheduled' ? 'ongoing' : pkg.status === 'ongoing' ? 'completed' : 'scheduled';
    const updated = { ...pkg, status: nextStatus };
    AppStorage.saveExamPackage(updated);
    AppStorage.logActivity('Admin Kecamatan', 'admin', 'Ubah Status Ujian', `Status paket "${pkg.title}" diubah menjadi: ${nextStatus}`);
    onRefresh();
    showToast('success', 'Status Berubah', `Status paket sekarang: ${nextStatus.toUpperCase()}`);
  };

  // Available questions for selected subject and grade in form
  const availableQuestions = questions.filter(
    q => q.subjectId === formState.subjectId && q.grade === formState.grade
  );

  return (
    <div className="space-y-5">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-purple-600" />
            Paket Soal & Jadwal Ujian Semester
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengaturan naskah ujian, waktu pengerjaan, durasi, dan hak akses peserta sekolah
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition"
        >
          <Plus className="w-4 h-4" />
          Buat Paket & Jadwal Baru
        </button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map(pkg => {
          const sub = subjects.find(s => s.id === pkg.subjectId);

          return (
            <div
              key={pkg.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    onClick={() => handleToggleStatus(pkg)}
                    className={`cursor-pointer px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 ${
                      pkg.status === 'ongoing'
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                        : pkg.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        : pkg.status === 'completed'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                    title="Klik untuk ubah status secara cepat"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {pkg.status === 'ongoing'
                      ? 'Sedang Berlangsung'
                      : pkg.status === 'scheduled'
                      ? 'Terjadwal'
                      : pkg.status === 'completed'
                      ? 'Selesai'
                      : 'Dibatalkan'}
                  </span>

                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    {pkg.durationMinutes} Menit
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">{pkg.title}</h3>
                <p className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>{sub ? sub.name : pkg.subjectId} • Kelas {pkg.grade} SD</span>
                  {sub?.religion && (
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                      Khusus Agama {sub.religion}
                    </span>
                  )}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Tanggal Pelaksanaan:</span>
                    <span className="font-semibold text-slate-800">{pkg.examDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Waktu Ujian:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {pkg.startTime} - {pkg.endTime} WIB
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Jumlah Soal:</span>
                    <span className="font-bold text-blue-700">{pkg.questionIds.length} Butir Soal</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Nilai Langsung Siswa:</span>
                    <span className="font-semibold">{pkg.showScoreImmediately ? 'Diizinkan' : 'Disembunyikan'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">
                  {pkg.schoolIds.length} Sekolah Mengikuti
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(pkg)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                    title="Edit Jadwal & Paket"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(pkg)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Hapus Paket"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Buat / Edit Paket */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedPackage ? 'Edit Paket & Jadwal Ujian' : 'Buat Paket Ujian Semester Baru'}
        subtitle="Rancang naskah ujian dengan memilih butir soal dari Bank Soal"
        maxWidth="4xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama / Judul Ujian *</label>
            <input
              type="text"
              required
              value={formState.title}
              onChange={e => setFormState({ ...formState, title: e.target.value })}
              placeholder="Contoh: Penilaian Akhir Semester (PAS) Ganjil Matematika Kelas 6"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran *</label>
              <select
                value={formState.subjectId}
                onChange={e => setFormState({ ...formState, subjectId: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tingkat Kelas *</label>
              <select
                value={formState.grade}
                onChange={e => setFormState({ ...formState, grade: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                {[1, 2, 3, 4, 5, 6].map(g => (
                  <option key={g} value={g}>Kelas {g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Ujian *</label>
              <input
                type="date"
                required
                value={formState.examDate}
                onChange={e => setFormState({ ...formState, examDate: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Durasi (Menit) *</label>
              <input
                type="number"
                min={15}
                max={180}
                value={formState.durationMinutes}
                onChange={e => setFormState({ ...formState, durationMinutes: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jam Mulai (WIB)</label>
              <input
                type="time"
                value={formState.startTime}
                onChange={e => setFormState({ ...formState, startTime: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jam Selesai (WIB)</label>
              <input
                type="time"
                value={formState.endTime}
                onChange={e => setFormState({ ...formState, endTime: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Ujian</label>
              <select
                value={formState.status}
                onChange={e => setFormState({ ...formState, status: e.target.value as ExamStatus })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="scheduled">Terjadwal</option>
                <option value="ongoing">Sedang Berlangsung (CBT Dibuka)</option>
                <option value="completed">Selesai</option>
                <option value="draft">Draf</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formState.showScoreImmediately}
                onChange={e => setFormState({ ...formState, showScoreImmediately: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-semibold text-slate-800">Tampilkan Nilai ke Siswa</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formState.shuffleQuestions}
                onChange={e => setFormState({ ...formState, shuffleQuestions: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-semibold text-slate-800">Acak Urutan Soal</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formState.shuffleOptions}
                onChange={e => setFormState({ ...formState, shuffleOptions: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-semibold text-slate-800">Acak Opsi Pilihan</span>
            </label>
          </div>

          {/* Question Selector from Question Bank */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800 flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-blue-600" />
                Pilih Soal dari Bank Soal ({formState.questionIds.length} Dipilih)
              </label>
              <button
                type="button"
                onClick={() => {
                  const allAvailIds = availableQuestions.map(q => q.id);
                  if (formState.questionIds.length === allAvailIds.length) {
                    setFormState({ ...formState, questionIds: [] });
                  } else {
                    setFormState({ ...formState, questionIds: allAvailIds });
                  }
                }}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                {formState.questionIds.length === availableQuestions.length
                  ? 'Batalkan Semua'
                  : 'Pilih Semua Soal'}
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
              {availableQuestions.length === 0 ? (
                <div className="p-4 text-center text-slate-400">
                  Belum ada soal di Bank Soal untuk Mapel dan Kelas ini. Silakan tambahkan di Bank Soal terlebih dahulu.
                </div>
              ) : (
                availableQuestions.map((q, idx) => {
                  const isChecked = formState.questionIds.includes(q.id);

                  return (
                    <label
                      key={q.id}
                      className={`flex items-start gap-3 p-2.5 cursor-pointer transition ${
                        isChecked ? 'bg-blue-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          if (e.target.checked) {
                            setFormState({
                              ...formState,
                              questionIds: [...formState.questionIds, q.id]
                            });
                          } else {
                            setFormState({
                              ...formState,
                              questionIds: formState.questionIds.filter(id => id !== q.id)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded mt-0.5 shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-slate-700">Soal #{idx + 1}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                            {q.type.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-blue-600 font-bold">{q.points} Poin</span>
                        </div>
                        <p className="text-slate-800 line-clamp-2">{q.questionText}</p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* School participation selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sekolah Penyelenggara</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {schools.map(s => {
                const checked = formState.schoolIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] cursor-pointer ${
                      checked ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold' : 'border-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => {
                        if (e.target.checked) {
                          setFormState({ ...formState, schoolIds: [...formState.schoolIds, s.id] });
                        } else {
                          setFormState({ ...formState, schoolIds: formState.schoolIds.filter(id => id !== s.id) });
                        }
                      }}
                      className="rounded text-blue-600"
                    />
                    <span className="truncate">{s.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
            >
              Simpan Paket Ujian
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
