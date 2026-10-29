import React, { useState, useMemo, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Download,
  Upload,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  KeyRound,
  FileSpreadsheet,
  Printer,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { User, School, ClassItem, SystemSettings, StudentReligion } from '../../types';
import { AppStorage } from '../../services/storage';
import { ExcelService } from '../../services/excelService';
import { Modal } from '../../components/Modal';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';

interface DataSiswaProps {
  users: User[];
  schools: School[];
  classes: ClassItem[];
  settings: SystemSettings;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
  onNavigate?: (tab: string) => void;
}

export const DataSiswa: React.FC<DataSiswaProps> = ({
  users,
  schools,
  classes,
  settings,
  onRefresh,
  showToast,
  onNavigate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [religionFilter, setReligionFilter] = useState<'ALL' | StudentReligion>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  // Selection & Bulk Delete state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    student?: User;
    count: number;
  }>({
    isOpen: false,
    type: 'single',
    count: 1
  });

  // Import State
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Form State
  const [formState, setFormState] = useState<{
    fullName: string;
    participantNumber: string;
    nisn: string;
    schoolId: string;
    grade: number;
    rombel: string;
    religion: StudentReligion;
    username: string;
    password?: string;
    isActive: boolean;
  }>({
    fullName: '',
    participantNumber: '',
    nisn: '',
    schoolId: schools[0]?.id || '',
    grade: 6,
    rombel: 'A',
    religion: 'Islam',
    username: '',
    password: 'password123',
    isActive: true
  });

  // Valid schools set untuk memastikan hanya data siswa dari sekolah yang terdaftar yang ditampilkan
  const validSchoolIds = useMemo(() => new Set((schools || []).map(s => s.id)), [schools]);
  const validSchoolNames = useMemo(() => new Set((schools || []).map(s => (s.name || '').trim().toLowerCase())), [schools]);

  // Hanya tampilkan siswa yang ada di daftar sekolah yang ada
  const students = useMemo(() => {
    return (users || []).filter(u => {
      if (!u || u.role !== 'siswa') return false;
      const uSchoolId = String(u.schoolId || '').trim();
      const uSchoolName = String(u.schoolName || '').trim().toLowerCase();
      const hasValidId = Boolean(uSchoolId && validSchoolIds.has(uSchoolId));
      const hasValidName = Boolean(uSchoolName && validSchoolNames.has(uSchoolName));
      return hasValidId || hasValidName;
    });
  }, [users, validSchoolIds, validSchoolNames]);

  // Pembersihan otomatis jika ada siswa yang tidak ada di dalam daftar sekolah yang ada
  useEffect(() => {
    const orphanStudents = (users || []).filter(u => {
      if (!u || u.role !== 'siswa') return false;
      const uSchoolId = String(u.schoolId || '').trim();
      const uSchoolName = String(u.schoolName || '').trim().toLowerCase();
      const hasValidId = Boolean(uSchoolId && validSchoolIds.has(uSchoolId));
      const hasValidName = Boolean(uSchoolName && validSchoolNames.has(uSchoolName));
      return !hasValidId && !hasValidName;
    });

    if (orphanStudents.length > 0) {
      const res = AppStorage.cleanupOrphanUsers();
      if (res.removedStudents > 0 || res.removedTeachers > 0) {
        onRefresh();
        showToast(
          'info',
          'Pembersihan Data Otomatis',
          `Menghapus ${res.removedStudents} data siswa yang tidak terdaftar di daftar sekolah yang ada.`
        );
      }
    }
  }, [users, validSchoolIds, validSchoolNames, onRefresh, showToast]);

  const filteredStudents = students.filter(st => {
    const matchSearch =
      st.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.nisn && st.nisn.includes(searchTerm)) ||
      (st.participantNumber && st.participantNumber.includes(searchTerm)) ||
      st.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSchool = schoolFilter === 'ALL' || st.schoolId === schoolFilter;
    const matchClass = classFilter === 'ALL' || `Kelas ${st.grade}${st.rombel}` === classFilter;
    const matchReligion = religionFilter === 'ALL' || (st.religion || 'Islam') === religionFilter;
    return matchSearch && matchSchool && matchClass && matchReligion;
  });

  const handleOpenAdd = () => {
    setSelectedStudent(null);
    const nextNum = students.length + 1;
    const padded = nextNum.toString().padStart(3, '0');
    setFormState({
      fullName: '',
      participantNumber: `01-054-${padded}-8`,
      nisn: `01234567${padded}`,
      schoolId: schools[0]?.id || '',
      grade: 6,
      rombel: 'A',
      religion: 'Islam',
      username: `siswa_${padded}`,
      password: 'password123',
      isActive: true
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (student: User) => {
    setSelectedStudent(student);
    setFormState({
      fullName: student.fullName,
      participantNumber: student.participantNumber || '',
      nisn: student.nisn || '',
      schoolId: student.schoolId || schools[0]?.id || '',
      grade: student.grade || 6,
      rombel: student.rombel || 'A',
      religion: student.religion || 'Islam',
      username: student.username,
      password: '',
      isActive: student.isActive
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.fullName || !formState.username) {
      showToast('error', 'Validasi Gagal', 'Nama dan Username wajib diisi.');
      return;
    }

    // Check duplicate NISN
    if (formState.nisn) {
      const duplicateNisn = students.some(
        s => s.nisn === formState.nisn && s.id !== selectedStudent?.id
      );
      if (duplicateNisn) {
        showToast('error', 'NISN Duplikat', `NISN ${formState.nisn} sudah terdaftar pada siswa lain!`);
        return;
      }
    }

    // Check duplicate Nomor Peserta
    if (formState.participantNumber) {
      const duplicateNum = students.some(
        s => s.participantNumber === formState.participantNumber && s.id !== selectedStudent?.id
      );
      if (duplicateNum) {
        showToast('error', 'Nomor Peserta Duplikat', `Nomor Peserta ${formState.participantNumber} sudah terdaftar pada siswa lain!`);
        return;
      }
    }

    const schoolObj = schools.find(s => s.id === formState.schoolId);

    const studentToSave: User = {
      id: selectedStudent ? selectedStudent.id : 'usr-sis-' + Date.now(),
      username: formState.username.trim(),
      password: formState.password || selectedStudent?.password || 'password123',
      role: 'siswa',
      fullName: formState.fullName.trim(),
      participantNumber: formState.participantNumber.trim(),
      nisn: formState.nisn.trim(),
      schoolId: formState.schoolId,
      schoolName: schoolObj?.name || '',
      grade: formState.grade,
      rombel: formState.rombel,
      religion: formState.religion,
      isActive: formState.isActive,
      createdAt: selectedStudent?.createdAt || new Date().toISOString().slice(0, 10)
    };

    AppStorage.saveUser(studentToSave);
    AppStorage.logActivity('Admin Kecamatan', 'admin', selectedStudent ? 'Edit Siswa' : 'Tambah Siswa', `Menyimpan data siswa: ${studentToSave.fullName}`);
    setIsFormOpen(false);
    onRefresh();
    showToast('success', 'Berhasil Disimpan', `Data siswa ${studentToSave.fullName} berhasil disimpan.`);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredStudents.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePromptDeleteSingle = (student: User) => {
    setDeleteTarget({
      isOpen: true,
      type: 'single',
      student,
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
    if (deleteTarget.type === 'single' && deleteTarget.student) {
      const st = deleteTarget.student;
      AppStorage.deleteUser(st.id);
      AppStorage.logActivity('Admin Kecamatan', 'admin', 'Hapus Siswa', `Menghapus siswa: ${st.fullName}`);
      setSelectedIds(prev => prev.filter(id => id !== st.id));
      onRefresh();
      showToast('success', 'Siswa Dihapus', `Data siswa "${st.fullName}" berhasil dihapus.`);
    } else if (deleteTarget.type === 'bulk') {
      const count = selectedIds.length;
      AppStorage.deleteUsers(selectedIds);
      AppStorage.logActivity('Admin Kecamatan', 'admin', 'Hapus Siswa Massal', `Menghapus ${count} siswa sekaligus.`);
      setSelectedIds([]);
      onRefresh();
      showToast('success', 'Penghapusan Massal Berhasil', `Sebanyak ${count} siswa berhasil dihapus.`);
    }
  };

  const handleResetPassword = (student: User) => {
    const updated = { ...student, password: 'password123' };
    AppStorage.saveUser(updated);
    showToast('success', 'Password Direset', `Password untuk ${student.username} direset ke: password123`);
  };

  const handleToggleParticipant = (student: User) => {
    const updated = { ...student, isActive: !student.isActive };
    AppStorage.saveUser(updated);
    onRefresh();
    showToast('success', 'Status Peserta', `${student.fullName} sekarang ${updated.isActive ? 'Bisa Mengikuti Ujian' : 'Ditangguhkan Dari Ujian'}.`);
  };

  // ============= EXCEL IMPORT =============
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportFile(file);
      const parsed = await ExcelService.parseExcelFile(file);
      const errors: string[] = [];
      const seenNisn = new Set<string>();
      const seenNoPeserta = new Set<string>();

      // Validate rows
      parsed.forEach((row, idx) => {
        const rowNum = idx + 2; // header is row 1
        const nama = String(row['Nama_Lengkap'] || '').trim();
        const nisn = String(row['NISN'] || '').trim();
        const noPeserta = String(row['Nomor_Peserta'] || '').trim();

        if (!nama) errors.push(`Baris ${rowNum}: Kolom Nama_Lengkap kosong.`);
        
        if (!nisn) {
          errors.push(`Baris ${rowNum}: Kolom NISN kosong.`);
        } else if (seenNisn.has(nisn)) {
          errors.push(`Baris ${rowNum}: NISN "${nisn}" terduplikasi di dalam file ini.`);
        } else {
          seenNisn.add(nisn);
          if (students.some(s => s.nisn === nisn)) {
            errors.push(`Baris ${rowNum}: NISN "${nisn}" sudah terdaftar di sistem.`);
          }
        }

        if (!noPeserta) {
          errors.push(`Baris ${rowNum}: Kolom Nomor_Peserta kosong.`);
        } else if (seenNoPeserta.has(noPeserta)) {
          errors.push(`Baris ${rowNum}: Nomor_Peserta "${noPeserta}" duplikat di dalam file.`);
        } else {
          seenNoPeserta.add(noPeserta);
          if (students.some(s => s.participantNumber === noPeserta)) {
            errors.push(`Baris ${rowNum}: Nomor_Peserta "${noPeserta}" sudah ada di sistem.`);
          }
        }
      });

      setImportRows(parsed);
      setImportErrors(errors);
      showToast('info', 'File Terbaca', `Ditemukan ${parsed.length} baris data siswa pada file.`);
    } catch (err: any) {
      showToast('error', 'Gagal Membaca File', err.message || 'File Excel tidak valid.');
    }
  };

  const handleSaveImport = () => {
    if (importRows.length === 0) return;

    let successCount = 0;
    importRows.forEach(row => {
      const schoolObj = schools.find(s => s.npsn === String(row['NPSN_Sekolah'])) || schools[0];
      const rawAgama = String(row['Agama'] || '').trim().toLowerCase();
      let parsedRel: StudentReligion = 'Islam';
      if (rawAgama.includes('kristen')) parsedRel = 'Kristen';
      else if (rawAgama.includes('katolik') || rawAgama.includes('khatolik')) parsedRel = 'Katolik';
      else if (rawAgama.includes('hindu')) parsedRel = 'Hindu';
      else if (rawAgama.includes('buddha') || rawAgama.includes('budha')) parsedRel = 'Buddha';

      const newUser: User = {
        id: 'usr-sis-' + Date.now() + Math.random().toString(36).substring(2, 6),
        username: String(row['Username'] || `siswa_${Date.now()}`),
        password: String(row['Password_Awal'] || 'password123'),
        role: 'siswa',
        fullName: String(row['Nama_Lengkap']),
        participantNumber: String(row['Nomor_Peserta']),
        nisn: String(row['NISN']),
        schoolId: schoolObj.id,
        schoolName: schoolObj.name,
        grade: Number(row['Kelas']) || 6,
        rombel: String(row['Rombel'] || 'A'),
        religion: parsedRel,
        isActive: true,
        createdAt: new Date().toISOString().slice(0, 10)
      };
      AppStorage.saveUser(newUser);
      successCount++;
    });

    AppStorage.logActivity('Admin Kecamatan', 'admin', 'Impor Siswa Massal', `Berhasil mengimpor ${successCount} siswa dari file Excel.`);
    setIsImportModalOpen(false);
    setImportRows([]);
    setImportErrors([]);
    onRefresh();
    showToast('success', 'Impor Sukses', `Sebanyak ${successCount} siswa berhasil didaftarkan sebagai peserta ujian!`);
  };

  return (
    <div className="space-y-5">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            Pengelolaan Data Siswa & Peserta Ujian Semester
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh siswa terdaftar dan verifikasi status hak akses pengerjaan CBT
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('admin-spreadsheet-sync')}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Kelola & Sinkronkan Data Siswa via Google Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Sheets</span>
            </button>
          )}
          <button
            onClick={() => ExcelService.downloadStudentImportTemplate()}
            className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl flex items-center gap-1.5 transition"
            title="Unduh Template Excel untuk Impor Massal"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh Template
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition"
          >
            <Upload className="w-4 h-4" />
            Impor Excel
          </button>
          <button
            onClick={() => ExcelService.exportStudents(filteredStudents, schools, settings.academicYear)}
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
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Nama Siswa, NISN, No. Peserta..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={schoolFilter}
            onChange={e => setSchoolFilter(e.target.value)}
            aria-label="Filter sekolah siswa"
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">Semua Sekolah ({schools.length} SD)</option>
            {schools.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            aria-label="Filter kelas siswa"
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">Semua Kelas</option>
            <option value="Kelas 4A">Kelas 4A</option>
            <option value="Kelas 5A">Kelas 5A</option>
            <option value="Kelas 6A">Kelas 6A</option>
            <option value="Kelas 6B">Kelas 6B</option>
            <option value="Kelas 6C">Kelas 6C</option>
          </select>

          <select
            value={religionFilter}
            onChange={e => setReligionFilter(e.target.value as any)}
            aria-label="Filter agama siswa"
            className="text-xs border border-indigo-200 rounded-lg px-2.5 py-2 bg-indigo-50/50 text-indigo-900 font-medium focus:outline-hidden"
          >
            <option value="ALL">Semua Agama (5 Agama)</option>
            <option value="Islam">Agama Islam</option>
            <option value="Kristen">Agama Kristen</option>
            <option value="Katolik">Agama Katolik</option>
            <option value="Hindu">Agama Hindu</option>
            <option value="Buddha">Agama Buddha</option>
          </select>
        </div>
      </div>

      {/* Bulk Delete Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs text-rose-900 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
            <span>{selectedIds.length} dari {filteredStudents.length} siswa dipilih</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(filteredStudents.map(s => s.id))}
              className="px-2.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg transition"
            >
              Pilih Semua ({filteredStudents.length})
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
              Hapus {selectedIds.length} Siswa Terpilih
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Mobile Swipe Hint */}
        <div className="px-3.5 py-2 bg-indigo-50/60 border-b border-indigo-100 text-[11px] text-indigo-900 flex items-center justify-between sm:hidden">
          <span className="font-medium text-[10px] flex items-center gap-1">
            <span>👉</span> Geser tabel ke kanan untuk melihat rincian & aksi
          </span>
          <span className="font-bold text-[10px] font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
            {filteredStudents.length} Siswa
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua siswa"
                    checked={filteredStudents.length > 0 && selectedIds.length === filteredStudents.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 w-10">No</th>
                <th className="py-3 px-4">No. Peserta Ujian</th>
                <th className="py-3 px-4">NISN</th>
                <th className="py-3 px-4">Nama Lengkap Siswa</th>
                <th className="py-3 px-4">Agama</th>
                <th className="py-3 px-4">Asal Sekolah</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Username CBT</th>
                <th className="py-3 px-4 text-center">Status Peserta</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Tidak ada siswa yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, index) => {
                  const school = schools.find(s => s.id === st.schoolId);
                  const isChecked = selectedIds.includes(st.id);

                  const renderReligionBadge = (rel?: StudentReligion) => {
                    const r = rel || 'Islam';
                    if (r === 'Islam') {
                      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Islam</span>;
                    }
                    if (r === 'Kristen') {
                      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Kristen</span>;
                    }
                    if (r === 'Katolik') {
                      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Katolik</span>;
                    }
                    if (r === 'Hindu') {
                      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Hindu</span>;
                    }
                    if (r === 'Buddha') {
                      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Buddha</span>;
                    }
                    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Islam</span>;
                  };

                  return (
                    <tr key={st.id} className={`hover:bg-slate-50/70 transition ${isChecked ? 'bg-blue-50/40' : ''}`}>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Pilih siswa ${st.fullName}`}
                          checked={isChecked}
                          onChange={() => handleToggleSelect(st.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-medium">{index + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {st.participantNumber || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{st.nisn || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{st.fullName}</div>
                      </td>
                      <td className="py-3 px-4">
                        {renderReligionBadge(st.religion)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {school ? school.name : st.schoolName || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                          Kelas {st.grade || 6}{st.rombel || 'A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">{st.username}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleParticipant(st)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                            st.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                          title="Klik untuk ubah status kepesertaan ujian"
                        >
                          {st.isActive ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                          {st.isActive ? 'Peserta Ujian' : 'Ditangguhkan'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleResetPassword(st)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Reset Password ke password123"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(st)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Edit Siswa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePromptDeleteSingle(st)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Siswa"
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

      {/* Modal Tambah / Edit Siswa */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedStudent ? 'Edit Data Peserta Ujian' : 'Tambah Siswa Baru'}
        subtitle="Identitas peserta dan nomor ujian semester resmi"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Peserta Ujian *</label>
              <input
                type="text"
                required
                value={formState.participantNumber}
                onChange={e => setFormState({ ...formState, participantNumber: e.target.value })}
                placeholder="01-054-001-8"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">NISN (10 Digit) *</label>
              <input
                type="text"
                required
                maxLength={10}
                value={formState.nisn}
                onChange={e => setFormState({ ...formState, nisn: e.target.value })}
                placeholder="0123456789"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
              <input
                type="text"
                required
                value={formState.fullName}
                onChange={e => setFormState({ ...formState, fullName: e.target.value })}
                placeholder="Contoh: Aditya Pratama Putra"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Agama Siswa (Penyesuaian Mapel Ujian) *</label>
              <select
                value={formState.religion}
                onChange={e => setFormState({ ...formState, religion: e.target.value as StudentReligion })}
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg bg-indigo-50/40 font-semibold text-indigo-900"
              >
                <option value="Islam">Islam (Pendidikan Agama Islam)</option>
                <option value="Kristen">Kristen (Pendidikan Agama Kristen)</option>
                <option value="Katolik">Katolik (Pendidikan Agama Katolik)</option>
                <option value="Hindu">Hindu (Pendidikan Agama Hindu)</option>
                <option value="Buddha">Buddha (Pendidikan Agama Buddha)</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50/80 border border-blue-200/80 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-blue-800">
            <span className="font-bold shrink-0">ℹ️ Penyesuaian Mapel Agama:</span>
            <span>Ujian CBT agama siswa akan otomatis disesuaikan dengan pilihan agama yang dipilih di atas (PAI, PAK, PAKT, PAH, atau PAB). Siswa hanya akan melihat dan mengerjakan naskah ujian sesuai agamanya.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sekolah Asal *</label>
              <select
                value={formState.schoolId}
                onChange={e => setFormState({ ...formState, schoolId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {schools.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tingkat Kelas *</label>
              <select
                value={formState.grade}
                onChange={e => setFormState({ ...formState, grade: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {[1, 2, 3, 4, 5, 6].map(g => (
                  <option key={g} value={g}>Kelas {g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rombel *</label>
              <select
                value={formState.rombel}
                onChange={e => setFormState({ ...formState, rombel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {['A', 'B', 'C', 'D'].map(r => (
                  <option key={r} value={r}>Rombel {r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Username Login CBT *</label>
              <input
                type="text"
                required
                value={formState.username}
                onChange={e => setFormState({ ...formState, username: e.target.value })}
                placeholder="siswa_adit"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Kepesertaan Ujian</label>
              <select
                value={formState.isActive ? '1' : '0'}
                onChange={e => setFormState({ ...formState, isActive: e.target.value === '1' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
              >
                <option value="1">Peserta Ujian Aktif (Bisa Mengikuti Ujian)</option>
                <option value="0">Nonaktif / Tidak Mengikuti Ujian</option>
              </select>
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
              Simpan Data Siswa
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Impor Excel Siswa */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportRows([]);
          setImportErrors([]);
        }}
        title="Impor Data Siswa Massal dari Excel"
        subtitle="Unggah file .xlsx / .csv sesuai template untuk menambahkan siswa secara cepat"
        maxWidth="4xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 text-center hover:bg-slate-50 transition">
            <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <p className="font-bold text-slate-800">Pilih File Excel (.xlsx / .csv)</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Gunakan template resmi yang telah diunduh</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="mt-3 block mx-auto text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          {/* Error Inspector */}
          {importErrors.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Ditemukan {importErrors.length} Peringatan / Kesalahan Format:
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
                  Pratinjau Data Impor ({importRows.length} Siswa Terbaca)
                </p>
                <span className="text-[11px] text-emerald-600 font-medium">Siap Disimpan</span>
              </div>
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="p-2">No. Peserta</th>
                      <th className="p-2">NISN</th>
                      <th className="p-2">Nama Lengkap</th>
                      <th className="p-2">Sekolah</th>
                      <th className="p-2">Kelas</th>
                      <th className="p-2">Username</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-mono">{r['Nomor_Peserta'] || '-'}</td>
                        <td className="p-2 font-mono">{r['NISN'] || '-'}</td>
                        <td className="p-2 font-bold">{r['Nama_Lengkap'] || '-'}</td>
                        <td className="p-2">{r['Nama_Sekolah'] || r['NPSN_Sekolah'] || '-'}</td>
                        <td className="p-2">Kelas {r['Kelas']}{r['Rombel']}</td>
                        <td className="p-2 font-mono">{r['Username'] || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => ExcelService.downloadStudentImportTemplate()}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Unduh Template Excel Lagi
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={importRows.length === 0}
                onClick={handleSaveImport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-xs"
              >
                Konfirmasi & Simpan {importRows.length} Siswa
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Konfirmasi Hapus Siswa */}
      <ConfirmDeleteModal
        isOpen={deleteTarget.isOpen}
        onClose={() => setDeleteTarget(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDelete}
        title={deleteTarget.type === 'bulk' ? 'Hapus Siswa Terpilih' : 'Hapus Data Siswa'}
        count={deleteTarget.count}
        message={
          deleteTarget.type === 'bulk'
            ? `Apakah Anda yakin ingin menghapus ${deleteTarget.count} siswa yang dipilih? Seluruh nilai dan riwayat ujian siswa bersangkutan akan dihapus dari sistem.`
            : `Apakah Anda yakin ingin menghapus siswa "${deleteTarget.student?.fullName}"?`
        }
        detail={
          deleteTarget.type === 'single' && deleteTarget.student
            ? `No. Peserta: ${deleteTarget.student.participantNumber || '-'} • NISN: ${deleteTarget.student.nisn || '-'} • Asal Sekolah: ${deleteTarget.student.schoolName || '-'}`
            : undefined
        }
        confirmLabel={deleteTarget.type === 'bulk' ? `Hapus ${deleteTarget.count} Siswa` : 'Hapus Siswa'}
      />

    </div>
  );
};
