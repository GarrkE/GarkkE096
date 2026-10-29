import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Download,
  Upload,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  User,
  MapPin,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { School, SystemSettings } from '../../types';
import { AppStorage } from '../../services/storage';
import { ExcelService } from '../../services/excelService';
import { Modal } from '../../components/Modal';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';

interface DataSekolahProps {
  schools: School[];
  settings: SystemSettings;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
  onNavigate?: (tab: string) => void;
}

export const DataSekolah: React.FC<DataSekolahProps> = ({
  schools,
  settings,
  onRefresh,
  showToast,
  onNavigate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Selection & Bulk Delete State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    school?: School;
    count: number;
  }>({
    isOpen: false,
    type: 'single',
    count: 0
  });

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<School>>({
    npsn: '',
    name: '',
    status: 'Negeri',
    address: '',
    village: '',
    district: settings.districtName,
    principalName: '',
    principalNip: '',
    operatorName: '',
    phone: '',
    email: '',
    isActive: true
  });

  const filteredSchools = schools.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.npsn.includes(searchTerm) ||
      s.principalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredSchools.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenAdd = () => {
    setSelectedSchool(null);
    setFormState({
      npsn: '',
      name: '',
      status: 'Negeri',
      address: '',
      village: '',
      district: settings.districtName,
      principalName: '',
      principalNip: '',
      operatorName: '',
      phone: '',
      email: '',
      isActive: true
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (school: School) => {
    setSelectedSchool(school);
    setFormState({ ...school });
    setIsFormOpen(true);
  };

  const handleOpenDetail = (school: School) => {
    setSelectedSchool(school);
    setIsDetailOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.npsn || !formState.name) {
      showToast('error', 'Validasi Gagal', 'NPSN dan Nama Sekolah wajib diisi.');
      return;
    }

    // Validasi NPSN unik jika menambah atau mengubah NPSN
    const npsnExists = schools.some(s => s.npsn === formState.npsn && s.id !== selectedSchool?.id);
    if (npsnExists) {
      showToast('error', 'NPSN Duplikat', `NPSN ${formState.npsn} telah terdaftar pada sekolah lain.`);
      return;
    }

    const schoolToSave: School = {
      id: selectedSchool ? selectedSchool.id : 'sch-' + Date.now(),
      npsn: formState.npsn.trim(),
      name: formState.name.trim(),
      status: (formState.status as 'Negeri' | 'Swasta') || 'Negeri',
      address: formState.address || '',
      village: formState.village || '',
      district: formState.district || settings.districtName,
      principalName: formState.principalName || '',
      principalNip: formState.principalNip || '',
      operatorName: formState.operatorName || '',
      phone: formState.phone || '',
      email: formState.email || '',
      isActive: formState.isActive ?? true
    };

    AppStorage.saveSchool(schoolToSave);
    AppStorage.logActivity('Admin Kecamatan', 'admin', selectedSchool ? 'Edit Sekolah' : 'Tambah Sekolah', `Menyimpan data sekolah: ${schoolToSave.name}`);
    setIsFormOpen(false);
    onRefresh();
    showToast('success', 'Berhasil Disimpan', `Data sekolah ${schoolToSave.name} berhasil disimpan.`);
  };

  const handlePromptDeleteSingle = (school: School) => {
    setDeleteTarget({
      isOpen: true,
      type: 'single',
      school,
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
    if (deleteTarget.type === 'single' && deleteTarget.school) {
      const sch = deleteTarget.school;
      AppStorage.deleteSchool(sch.id);
      AppStorage.logActivity('Admin Kecamatan', 'admin', 'Hapus Sekolah', `Menghapus sekolah: ${sch.name}`);
      setSelectedIds(prev => prev.filter(id => id !== sch.id));
      onRefresh();
      showToast('success', 'Sekolah Dihapus', `Data sekolah "${sch.name}" berhasil dihapus.`);
    } else if (deleteTarget.type === 'bulk') {
      const count = selectedIds.length;
      AppStorage.deleteSchools(selectedIds);
      AppStorage.logActivity('Admin Kecamatan', 'admin', 'Hapus Sekolah Massal', `Menghapus ${count} sekolah sekaligus.`);
      setSelectedIds([]);
      onRefresh();
      showToast('success', 'Penghapusan Massal Berhasil', `Sebanyak ${count} sekolah berhasil dihapus.`);
    }
  };

  const handleToggleActive = (school: School) => {
    const updated = { ...school, isActive: !school.isActive };
    AppStorage.saveSchool(updated);
    onRefresh();
    showToast('success', 'Status Diperbarui', `Akun sekolah ${school.name} sekarang ${updated.isActive ? 'Aktif' : 'Nonaktif'}.`);
  };

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const handleExportExcel = () => {
    ExcelService.exportSchools(filteredSchools, settings.districtName, settings.academicYear);
    showToast('success', 'Ekspor Berhasil', `File Excel data sekolah berhasil diunduh.`);
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await ExcelService.parseExcelFile(file);
      const errors: string[] = [];
      const seenNpsn = new Set<string>();

      parsed.forEach((row, idx) => {
        const rowNum = idx + 2;
        const npsn = String(row['NPSN'] || '').trim();
        const name = String(row['Nama_Sekolah'] || '').trim();

        if (!npsn) {
          errors.push(`Baris ${rowNum}: NPSN tidak boleh kosong.`);
        } else if (npsn.length !== 8) {
          errors.push(`Baris ${rowNum}: NPSN "${npsn}" harus tepat 8 digit.`);
        } else if (seenNpsn.has(npsn)) {
          errors.push(`Baris ${rowNum}: NPSN "${npsn}" duplikat di dalam file ini.`);
        } else {
          seenNpsn.add(npsn);
          // Check against existing schools
          if (schools.some(s => s.npsn === npsn)) {
            errors.push(`Baris ${rowNum}: NPSN "${npsn}" sudah terdaftar di sistem.`);
          }
        }

        if (!name) {
          errors.push(`Baris ${rowNum}: Nama Sekolah tidak boleh kosong.`);
        }
      });

      setImportRows(parsed);
      setImportErrors(errors);
      showToast('info', 'File Terbaca', `Ditemukan ${parsed.length} baris data sekolah.`);
    } catch (err: any) {
      showToast('error', 'Gagal Membaca File', err.message || 'File Excel tidak valid.');
    }
  };

  const handleSaveImport = () => {
    if (importRows.length === 0) return;

    let successCount = 0;
    importRows.forEach(row => {
      const npsn = String(row['NPSN']).trim();
      const name = String(row['Nama_Sekolah']).trim();

      const newSchool: School = {
        id: 'sch-' + Date.now() + Math.random().toString(36).substring(2, 6),
        npsn,
        name,
        status: (String(row['Status'] || 'Negeri') as any) || 'Negeri',
        address: String(row['Alamat'] || '-'),
        village: String(row['Desa_Kelurahan'] || '-'),
        district: settings.districtName,
        principalName: String(row['Kepala_Sekolah'] || '-'),
        principalNip: row['NIP_Kepala_Sekolah'] ? String(row['NIP_Kepala_Sekolah']) : undefined,
        operatorName: String(row['Nama_Operator'] || '-'),
        phone: String(row['Nomor_Telepon'] || '-'),
        email: String(row['Email_Sekolah'] || '-'),
        isActive: true
      };

      AppStorage.saveSchool(newSchool);
      successCount++;
    });

    AppStorage.logActivity('Admin Kecamatan', 'admin', 'Impor Sekolah Massal', `Berhasil mengimpor ${successCount} sekolah dari file Excel.`);
    setIsImportModalOpen(false);
    setImportRows([]);
    setImportErrors([]);
    onRefresh();
    showToast('success', 'Impor Sekolah Sukses', `${successCount} sekolah berhasil ditambahkan ke database.`);
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Pengelolaan Data Sekolah Dasar (SD)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh sekolah penyelenggara ujian semester di {settings.districtName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('admin-spreadsheet-sync')}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Kelola & Sinkronkan Data Sekolah via Google Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Sheets</span>
            </button>
          )}
          <button
            onClick={() => ExcelService.downloadSchoolImportTemplate()}
            className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl flex items-center gap-1.5 transition"
            title="Unduh Template Excel Sekolah"
          >
            <Download className="w-3.5 h-3.5" />
            Template Excel
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition"
          >
            <Upload className="w-4 h-4" />
            Impor Excel
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition"
          >
            <Plus className="w-4 h-4" />
            Tambah Sekolah
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari NPSN, Nama Sekolah, Kepala Sekolah..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 shrink-0">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            aria-label="Filter status sekolah"
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">Semua Status</option>
            <option value="Negeri">SD Negeri</option>
            <option value="Swasta">SD Swasta</option>
          </select>
        </div>
      </div>

      {/* Bulk Delete Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs text-rose-900 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
            <span>{selectedIds.length} dari {filteredSchools.length} sekolah dipilih</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(filteredSchools.map(s => s.id))}
              className="px-2.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg transition"
            >
              Pilih Semua ({filteredSchools.length})
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
              Hapus {selectedIds.length} Sekolah Terpilih
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua sekolah"
                    checked={filteredSchools.length > 0 && selectedIds.length === filteredSchools.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 w-10">No</th>
                <th className="py-3 px-4">NPSN</th>
                <th className="py-3 px-4">Nama Sekolah</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Kepala Sekolah</th>
                <th className="py-3 px-4">Kontak / Operator</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchools.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data sekolah yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredSchools.map((school, index) => {
                  const isChecked = selectedIds.includes(school.id);
                  return (
                    <tr key={school.id} className={`hover:bg-slate-50/70 transition ${isChecked ? 'bg-blue-50/40' : ''}`}>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Pilih sekolah ${school.name}`}
                          checked={isChecked}
                          onChange={() => handleToggleSelect(school.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-medium">{index + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{school.npsn}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{school.name}</div>
                        <div className="text-[11px] text-slate-500">{school.address}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          school.status === 'Negeri'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {school.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{school.principalName}</div>
                        {school.principalNip && (
                          <div className="text-[10px] text-slate-400">NIP: {school.principalNip}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700">{school.operatorName || '-'}</div>
                        <div className="text-[10px] text-slate-400">{school.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(school)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                            school.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                          title="Klik untuk ubah status akun"
                        >
                          {school.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {school.isActive ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(school)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Lihat Detail Sekolah"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(school)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit Data"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePromptDeleteSingle(school)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Data Sekolah"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah / Edit */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedSchool ? 'Edit Data Sekolah' : 'Tambah Sekolah Baru'}
        subtitle="Masukkan identitas resmi sekolah dasar penyelenggara ujian"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">NPSN (8 Digit) *</label>
              <input
                type="text"
                required
                maxLength={8}
                value={formState.npsn || ''}
                onChange={e => setFormState({ ...formState, npsn: e.target.value })}
                placeholder="Contoh: 20214501"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Sekolah *</label>
              <select
                value={formState.status || 'Negeri'}
                onChange={e => setFormState({ ...formState, status: e.target.value as 'Negeri' | 'Swasta' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Negeri">Negeri</option>
                <option value="Swasta">Swasta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Sekolah *</label>
            <input
              type="text"
              required
              value={formState.name || ''}
              onChange={e => setFormState({ ...formState, name: e.target.value })}
              placeholder="Contoh: SD Negeri 1 Sukamaju"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Kepala Sekolah</label>
              <input
                type="text"
                value={formState.principalName || ''}
                onChange={e => setFormState({ ...formState, principalName: e.target.value })}
                placeholder="Contoh: Dra. Hj. Sri Wahyuni, M.Pd."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={formState.principalNip || ''}
                onChange={e => setFormState({ ...formState, principalNip: e.target.value })}
                placeholder="19710315 199602 2 001"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Operator Sekolah</label>
              <input
                type="text"
                value={formState.operatorName || ''}
                onChange={e => setFormState({ ...formState, operatorName: e.target.value })}
                placeholder="Nama Operator"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / Kontak</label>
              <input
                type="text"
                value={formState.phone || ''}
                onChange={e => setFormState({ ...formState, phone: e.target.value })}
                placeholder="0812-xxxx-xxxx"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Sekolah</label>
              <input
                type="email"
                value={formState.email || ''}
                onChange={e => setFormState({ ...formState, email: e.target.value })}
                placeholder="sdn@sekolah.id"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alamat Jalan</label>
              <input
                type="text"
                value={formState.address || ''}
                onChange={e => setFormState({ ...formState, address: e.target.value })}
                placeholder="Jl. Raya Sukamaju No. 12"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Desa / Kelurahan</label>
              <input
                type="text"
                value={formState.village || ''}
                onChange={e => setFormState({ ...formState, village: e.target.value })}
                placeholder="Nama Desa"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
            >
              Simpan Data Sekolah
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Sekolah */}
      {selectedSchool && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detail ${selectedSchool.name}`}
          subtitle={`NPSN: ${selectedSchool.npsn} • Status: ${selectedSchool.status}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p className="text-slate-400 font-medium">Kepala Sekolah</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedSchool.principalName}</p>
                <p className="text-slate-500 font-mono text-[11px]">NIP: {selectedSchool.principalNip || '-'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Operator CBT</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedSchool.operatorName || '-'}</p>
                <p className="text-slate-500 text-[11px]">{selectedSchool.phone}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Alamat: {selectedSchool.address}, Desa {selectedSchool.village}, {selectedSchool.district}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Email: {selectedSchool.email || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Telepon: {selectedSchool.phone || '-'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Impor Excel Data Sekolah */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportRows([]);
          setImportErrors([]);
        }}
        title="Impor Data Sekolah Massal dari Excel"
        subtitle="Unggah spreadsheet untuk menambahkan sekolah penyelenggara ujian secara otomatis"
        maxWidth="4xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 text-center hover:bg-slate-50 transition">
            <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <p className="font-bold text-slate-800">Pilih File Excel Data Sekolah (.xlsx / .csv)</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Pastikan NPSN 8 digit dan belum terdaftar di sistem</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportFileChange}
              className="mt-3 block mx-auto text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          {/* Error Inspector */}
          {importErrors.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
              <div className="flex items-center gap-2 font-bold mb-1">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                Ditemukan {importErrors.length} Kesalahan / Duplikasi Data:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {importErrors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Table Preview */}
          {importRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-800">
                  Pratinjau Data Sekolah ({importRows.length} Terbaca)
                </p>
                <span className="text-[11px] text-emerald-600 font-semibold">Siap Disimpan</span>
              </div>
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-slate-100 sticky top-0 font-bold text-slate-700">
                    <tr>
                      <th className="p-2">NPSN</th>
                      <th className="p-2">Nama Sekolah</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Kepala Sekolah</th>
                      <th className="p-2">Desa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-bold text-blue-700">{r['NPSN'] || '-'}</td>
                        <td className="p-2 font-bold text-slate-900">{r['Nama_Sekolah'] || '-'}</td>
                        <td className="p-2">{r['Status'] || 'Negeri'}</td>
                        <td className="p-2">{r['Kepala_Sekolah'] || '-'}</td>
                        <td className="p-2">{r['Desa_Kelurahan'] || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => ExcelService.downloadSchoolImportTemplate()}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Unduh Template Sekolah Lagi (.xlsx)
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={importRows.length === 0}
                onClick={handleSaveImport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-xs"
              >
                Simpan {importRows.length} Data Sekolah
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Konfirmasi Hapus Sekolah */}
      <ConfirmDeleteModal
        isOpen={deleteTarget.isOpen}
        onClose={() => setDeleteTarget(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDelete}
        title={deleteTarget.type === 'bulk' ? 'Hapus Sekolah Terpilih' : 'Hapus Data Sekolah'}
        count={deleteTarget.count}
        message={
          deleteTarget.type === 'bulk'
            ? `Apakah Anda yakin ingin menghapus ${deleteTarget.count} sekolah yang dipilih? Semua data terkait sekolah ini akan dihapus dari daftar.`
            : `Apakah Anda yakin ingin menghapus sekolah "${deleteTarget.school?.name}"?`
        }
        detail={
          deleteTarget.type === 'single' && deleteTarget.school
            ? `NPSN: ${deleteTarget.school.npsn} • Status: ${deleteTarget.school.status} • Kepala Sekolah: ${deleteTarget.school.principalName}`
            : undefined
        }
        confirmLabel={deleteTarget.type === 'bulk' ? `Hapus ${deleteTarget.count} Sekolah` : 'Hapus Sekolah'}
      />

    </div>
  );
};
