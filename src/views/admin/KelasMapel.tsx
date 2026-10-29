import React, { useState } from 'react';
import {
  Layers,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  GraduationCap
} from 'lucide-react';
import { Subject, ClassItem } from '../../types';
import { AppStorage } from '../../services/storage';
import { Modal } from '../../components/Modal';

interface KelasMapelProps {
  subjects: Subject[];
  classes: ClassItem[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const KelasMapel: React.FC<KelasMapelProps> = ({
  subjects,
  classes,
  onRefresh,
  showToast
}) => {
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);

  // Subject Form State
  const [subForm, setSubForm] = useState({ code: '', name: '', iconName: 'BookOpen' });
  // Class Form State
  const [classForm, setClassForm] = useState({ grade: 6, rombel: 'A' });

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.name || !subForm.code) return;

    const newSub: Subject = {
      id: 'sub-' + subForm.code.toLowerCase(),
      code: subForm.code.toUpperCase().trim(),
      name: subForm.name.trim(),
      iconName: subForm.iconName
    };

    AppStorage.saveSubject(newSub);
    setIsSubModalOpen(false);
    setSubForm({ code: '', name: '', iconName: 'BookOpen' });
    onRefresh();
    showToast('success', 'Mata Pelajaran Disimpan', `Mapel ${newSub.name} berhasil ditambahkan.`);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    const name = `Kelas ${classForm.grade}${classForm.rombel}`;
    const newClass: ClassItem = {
      id: `cls-${classForm.grade}${classForm.rombel.toLowerCase()}`,
      grade: classForm.grade,
      rombel: classForm.rombel,
      name
    };

    AppStorage.saveClass(newClass);
    setIsClassModalOpen(false);
    onRefresh();
    showToast('success', 'Kelas Disimpan', `${name} berhasil ditambahkan.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          Pengelolaan Kelas & Mata Pelajaran Ujian
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Daftar jenjang rombongan belajar dan kurikulum mata pelajaran SD dalam kecamatan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Mata Pelajaran Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Mata Pelajaran ({subjects.length})
              </h3>
              <p className="text-xs text-slate-500">Mata pelajaran yang diujikan dalam semester</p>
            </div>
            <button
              onClick={() => setIsSubModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Mapel
            </button>
          </div>

          <div className="space-y-2">
            {subjects.map(s => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-12 text-center py-1 rounded-md bg-blue-50 text-blue-800 font-mono font-bold text-[11px]">
                    {s.code}
                  </span>
                  <span className="font-bold text-slate-800">{s.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kelas & Rombel Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                Jenjang Kelas & Rombel ({classes.length})
              </h3>
              <p className="text-xs text-slate-500">Tingkat kelas SD (Kelas 1 - Kelas 6)</p>
            </div>
            <button
              onClick={() => setIsClassModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Kelas
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {classes.map(c => (
              <div
                key={c.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{c.name}</p>
                  <p className="text-[10px] text-slate-500">Rombel {c.rombel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal Add Subject */}
      <Modal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        title="Tambah Mata Pelajaran Ujian"
        subtitle="Masukkan nama resmi dan kode singkatan mata pelajaran"
      >
        <form onSubmit={handleSaveSubject} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kode Mapel (Singkatan)</label>
            <input
              type="text"
              required
              value={subForm.code}
              onChange={e => setSubForm({ ...subForm, code: e.target.value })}
              placeholder="Contoh: MTK, IPAS, BIND"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase font-mono font-bold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Mata Pelajaran</label>
            <input
              type="text"
              required
              value={subForm.name}
              onChange={e => setSubForm({ ...subForm, name: e.target.value })}
              placeholder="Contoh: Matematika"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
            />
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSubModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold"
            >
              Simpan Mapel
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Add Class */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title="Tambah Rombel Kelas"
        subtitle="Tentukan tingkat jenjang dan rombongan belajar"
      >
        <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tingkat Kelas</label>
              <select
                value={classForm.grade}
                onChange={e => setClassForm({ ...classForm, grade: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {[1, 2, 3, 4, 5, 6].map(g => (
                  <option key={g} value={g}>Kelas {g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Huruf Rombel</label>
              <select
                value={classForm.rombel}
                onChange={e => setClassForm({ ...classForm, rombel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {['A', 'B', 'C', 'D', 'E'].map(r => (
                  <option key={r} value={r}>Rombel {r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsClassModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold"
            >
              Simpan Kelas
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
