import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Save,
  RotateCcw,
  ShieldCheck,
  Award,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { SystemSettings } from '../../types';
import { AppStorage } from '../../services/storage';

interface PengaturanSistemProps {
  settings: SystemSettings;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const PengaturanSistem: React.FC<PengaturanSistemProps> = ({
  settings,
  onRefresh,
  showToast
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    AppStorage.saveSettings(formData);
    onRefresh();
    showToast('success', 'Pengaturan Disimpan', 'Identitas kecamatan dan kop surat resmi berhasil diperbarui.');
  };

  const handleResetDemo = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset seluruh data ke DEMO awal? Seluruh perubahan lokal akan dikembalikan.')) {
      AppStorage.resetToDefaults();
      onRefresh();
      showToast('info', 'Reset Berhasil', 'Data aplikasi telah dikembalikan ke kondisi demo awal.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Pengaturan Sistem & Identitas Kecamatan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi nama kecamatan, periode tahun pelajaran, KKM standar, dan kop pengesahan laporan
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 flex items-center gap-1.5 transition cursor-pointer"
          title="Kembalikan semua data ke setelan awal sistem"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          Reset Data Awal Sistem
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 text-xs">
        
        {/* Section 1: Identitas Kecamatan & Wilayah */}
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-blue-600" />
            Identitas Wilayah Pendidikan
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Kecamatan *</label>
              <input
                type="text"
                required
                value={formData.districtName}
                onChange={e => setFormData({ ...formData, districtName: e.target.value })}
                placeholder="Kecamatan Sukamaju"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Kabupaten / Kota *</label>
              <input
                type="text"
                required
                value={formData.regencyName}
                onChange={e => setFormData({ ...formData, regencyName: e.target.value })}
                placeholder="Kabupaten Sukabumi"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Provinsi</label>
              <input
                type="text"
                value={formData.provinceName}
                onChange={e => setFormData({ ...formData, provinceName: e.target.value })}
                placeholder="Jawa Barat"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Periode Ujian Aktif & Standar Penilaian */}
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
            <Award className="w-4 h-4 text-emerald-600" />
            Tahun Pelajaran & Standar KKM
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tahun Pelajaran Aktif *</label>
              <input
                type="text"
                required
                value={formData.academicYear}
                onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="2024/2025"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Semester Aktif *</label>
              <select
                value={formData.activeSemester}
                onChange={e => setFormData({ ...formData, activeSemester: e.target.value as 'Ganjil' | 'Genap' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batas Kriteria Ketuntasan (KKM)</label>
              <input
                type="number"
                min={50}
                max={100}
                value={formData.defaultKkm}
                onChange={e => setFormData({ ...formData, defaultKkm: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-blue-700"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Pejabat Pengesah & Kop Surat */}
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            Pejabat Koordinator Wilayah (Pengesah Nilai)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Kepala Korwil Pendidikan *</label>
              <input
                type="text"
                required
                value={formData.korwilHeadName}
                onChange={e => setFormData({ ...formData, korwilHeadName: e.target.value })}
                placeholder="Drs. H. Ahmad Fauzi, M.Pd."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">NIP Kepala Korwil *</label>
              <input
                type="text"
                required
                value={formData.korwilHeadNip}
                onChange={e => setFormData({ ...formData, korwilHeadNip: e.target.value })}
                placeholder="19680712 199303 1 004"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon Kantor Korwil</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(0266) 531234"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Resmi Korwil</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="korwil@sukamaju.go.id"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alamat Kantor Korwil</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Jl. Raya Pendidikan No. 45"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Simpan Seluruh Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
};
