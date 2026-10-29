import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  FileQuestion,
  Users,
  Edit2,
  Trash2,
  Layers,
  GraduationCap,
  Sparkles,
  Calculator,
  FlaskConical,
  ShieldCheck,
  Languages,
  Moon,
  Activity,
  Palette
} from 'lucide-react';
import { Subject, Question, User, StudentReligion } from '../../types';
import { AppStorage } from '../../services/storage';
import { Modal } from '../../components/Modal';

interface MataPelajaranViewProps {
  subjects: Subject[];
  questions: Question[];
  users: User[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const MataPelajaranView: React.FC<MataPelajaranViewProps> = ({
  subjects,
  questions,
  users,
  onRefresh,
  showToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subject | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [iconName, setIconName] = useState('BookOpen');
  const [religion, setReligion] = useState<StudentReligion | ''>('');

  const teachers = users.filter(u => u.role === 'guru');

  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingSub(null);
    setCode('');
    setName('');
    setIconName('BookOpen');
    setReligion('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Subject) => {
    setEditingSub(s);
    setCode(s.code);
    setName(s.name);
    setIconName(s.iconName || 'BookOpen');
    setReligion(s.religion || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;

    const newSub: Subject = {
      id: editingSub ? editingSub.id : 'sub-' + code.toLowerCase().trim(),
      code: code.toUpperCase().trim(),
      name: name.trim(),
      iconName,
      religion: religion ? religion : undefined
    };

    AppStorage.saveSubject(newSub);
    AppStorage.logActivity('Admin Kecamatan', 'admin', editingSub ? 'Edit Mapel' : 'Tambah Mapel', `Menyimpan mata pelajaran: ${newSub.name}`);
    setIsModalOpen(false);
    onRefresh();
    showToast('success', 'Mata Pelajaran Disimpan', `${newSub.name} berhasil disimpan.`);
  };

  const handleDelete = (s: Subject) => {
    if (window.confirm(`Yakin ingin menghapus mata pelajaran "${s.name}"?`)) {
      AppStorage.deleteSubject(s.id);
      AppStorage.logActivity('Admin Kecamatan', 'admin', 'Hapus Mapel', `Menghapus mata pelajaran: ${s.name}`);
      onRefresh();
      showToast('info', 'Mapel Dihapus', `Mata pelajaran ${s.name} telah dihapus.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Pengelolaan Kurikulum Mata Pelajaran Ujian SD
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar mata pelajaran pokok dan muatan lokal yang diujikan dalam Penilaian Akhir Semester tingkat kecamatan
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Mata Pelajaran
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode atau nama mata pelajaran..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 hidden sm:inline-block">
          Total: <strong className="text-slate-800">{subjects.length} Mata Pelajaran</strong>
        </span>
      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map(sub => {
          const qCount = questions.filter(q => q.subjectId === sub.id).length;
          const teacherCount = teachers.filter(t => (t.subjects || []).includes(sub.id)).length;

          return (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-200">
                    {sub.code}
                  </span>
                  {sub.religion ? (
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                      Khusus Siswa Agama {sub.religion}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Umum (Semua Siswa)
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug">{sub.name}</h3>
                <p className="text-xs text-slate-400 mt-1">Kurikulum Merdeka Belajar</p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <FileQuestion className="w-4 h-4 text-blue-600" />
                      Jumlah Soal di Bank Soal:
                    </span>
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {qCount} Butir
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-600" />
                      Guru Pengampu Terdaftar:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {teacherCount} Guru
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                <button
                  onClick={() => handleOpenEdit(sub)}
                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                  title="Edit Mapel"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(sub)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Hapus Mapel"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSub ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
        subtitle="Masukkan identitas kurikulum mata pelajaran ujian semester"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kode Singkatan (Maks 5 Karakter) *</label>
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Contoh: MTK, IPAS, BIND"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold uppercase"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Mata Pelajaran *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Pendidikan Agama Islam dan Budi Pekerti"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kategori Kepesertaan Agama Siswa *</label>
            <select
              value={religion}
              onChange={e => setReligion(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="">Umum (Seluruh Siswa Mengikuti Ujian)</option>
              <option value="Islam">Khusus Siswa Agama Islam (PAI)</option>
              <option value="Kristen">Khusus Siswa Agama Kristen (PAK)</option>
              <option value="Katolik">Khusus Siswa Agama Katolik (PAKT)</option>
              <option value="Hindu">Khusus Siswa Agama Hindu (PAH)</option>
              <option value="Buddha">Khusus Siswa Agama Buddha (PAB)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Jika dipilih khusus agama tertentu, ujian ini hanya otomatis dijadwalkan dan dikerjakan oleh siswa yang memeluk agama tersebut.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
            >
              Simpan Mata Pelajaran
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
