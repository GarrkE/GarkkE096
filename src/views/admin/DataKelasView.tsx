import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Users,
  Search,
  School as SchoolIcon,
  Edit2,
  Trash2,
  GraduationCap,
  Building2,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { ClassItem, School, User } from '../../types';
import { AppStorage } from '../../services/storage';
import { Modal } from '../../components/Modal';

interface DataKelasViewProps {
  classes: ClassItem[];
  schools: School[];
  users: User[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const DataKelasView: React.FC<DataKelasViewProps> = ({
  classes,
  schools,
  users,
  onRefresh,
  showToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  // Form State
  const [grade, setGrade] = useState<number>(6);
  const [rombel, setRombel] = useState<string>('A');

  const students = users.filter(u => u.role === 'siswa');
  const teachers = users.filter(u => u.role === 'guru');

  const filteredClasses = classes.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGrade = gradeFilter === 'ALL' || String(c.grade) === gradeFilter;
    return matchSearch && matchGrade;
  });

  const handleOpenAdd = () => {
    setEditingClass(null);
    setGrade(6);
    setRombel('A');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: ClassItem) => {
    setEditingClass(c);
    setGrade(c.grade);
    setRombel(c.rombel);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const name = `Kelas ${grade}${rombel}`;
    const id = editingClass ? editingClass.id : `cls-${grade}${rombel.toLowerCase()}-${Date.now().toString().slice(-4)}`;

    const newClass: ClassItem = {
      id,
      grade,
      rombel,
      name
    };

    AppStorage.saveClass(newClass);
    AppStorage.logActivity('Admin Kecamatan', 'admin', editingClass ? 'Edit Rombel Kelas' : 'Tambah Rombel Kelas', `Menyimpan data ${name}`);
    setIsModalOpen(false);
    onRefresh();
    showToast('success', 'Rombel Berhasil Disimpan', `${name} telah diperbarui di sistem.`);
  };

  const handleDelete = (c: ClassItem) => {
    if (window.confirm(`Yakin ingin menghapus ${c.name}?`)) {
      const current = AppStorage.getClasses().filter(item => item.id !== c.id);
      localStorage.setItem('sukamaju_cbt_classes', JSON.stringify(current));
      AppStorage.logActivity('Admin Kecamatan', 'admin', 'Hapus Rombel Kelas', `Menghapus ${c.name}`);
      onRefresh();
      showToast('info', 'Kelas Dihapus', `${c.name} telah dihapus.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Pengelolaan Data Kelas & Rombongan Belajar (SD)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh tingkat jenjang kelas 1 s/d 6 dan pembagian rombel sekolah dasar se-kecamatan
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Rombel Kelas
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Total Rombel</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{classes.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Rombongan Belajar</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-blue-600 uppercase">Siswa Terdaftar</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{students.length}</p>
          <p className="text-[10px] text-blue-500 mt-0.5">Terbagi di semua kelas</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase">Wali Kelas / Guru</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{teachers.length}</p>
          <p className="text-[10px] text-emerald-500 mt-0.5">Pendidik SD</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-purple-600 uppercase">Tingkat Prioritas CBT</p>
          <p className="text-2xl font-black text-purple-700 mt-1">Kelas 6</p>
          <p className="text-[10px] text-purple-500 mt-0.5">Penilaian Akhir Semester</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kelas, rombel..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 shrink-0">Filter Tingkat:</span>
          <select
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="ALL">Semua Tingkat (1-6)</option>
            {[1, 2, 3, 4, 5, 6].map(g => (
              <option key={g} value={String(g)}>Kelas {g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Classes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map(c => {
          const studentCountInClass = students.filter(
            s => s.grade === c.grade && (s.rombel === c.rombel || !s.rombel)
          ).length;

          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                    Jenjang SD
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Tingkat {c.grade}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-lg">{c.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Rombongan Belajar {c.rombel}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      Jumlah Siswa:
                    </span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      {studentCountInClass} Siswa
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Cakupan:
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700">
                      Seluruh SD Kecamatan
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                  title="Edit Rombel"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Hapus Rombel"
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
        title={editingClass ? 'Edit Rombel Kelas' : 'Tambah Rombel Kelas SD Baru'}
        subtitle="Konfigurasi jenjang kelas dan rombongan belajar"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tingkat Kelas *</label>
              <select
                value={grade}
                onChange={e => setGrade(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {[1, 2, 3, 4, 5, 6].map(g => (
                  <option key={g} value={g}>Kelas {g} SD</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Huruf Rombel *</label>
              <select
                value={rombel}
                onChange={e => setRombel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-bold"
              >
                {['A', 'B', 'C', 'D', 'E', 'F'].map(r => (
                  <option key={r} value={r}>Rombel {r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-blue-900 text-xs">
            Format nama kelas yang akan dibuat: <strong className="text-blue-700">Kelas {grade}{rombel}</strong>
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
              Simpan Rombel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
