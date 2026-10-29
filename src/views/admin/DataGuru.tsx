import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Download,
  Upload,
  FileSpreadsheet,
  Edit2,
  Trash2,
  KeyRound,
  CheckCircle2,
  XCircle,
  GraduationCap,
  School as SchoolIcon,
  Sparkles,
  Eye,
  EyeOff,
  Save,
  Lock,
  BookOpen,
  Check,
  Copy,
  BadgeCheck,
  RotateCcw
} from 'lucide-react';
import { User, School, Subject, ClassItem, SystemSettings } from '../../types';
import { AppStorage, DEFAULT_SETTINGS } from '../../services/storage';
import { ExcelService } from '../../services/excelService';
import { Modal } from '../../components/Modal';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';

export const formatGuruUsername = (fullName: string): string => {
  if (!fullName || typeof fullName !== 'string') return 'guru_';
  // Bersihkan gelar akademik umum (S.Pd, M.Pd, Drs, Dra, S.Ag, S.Kom, H, Hj, Ust, dll)
  const clean = fullName
    .replace(/\b(dr|dra|drs|s\.pd|s\.kom|s\.ag|m\.pd|m\.m|m\.si|s\.si|h|hj|ust|sp\.d|lc|m\.a|s\.pd\.k|s\.pd\.h|s\.pd\.b)\b\.?/gi, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);
  const namePart = words.length > 0 ? words[0] : 'guru';
  return `guru_${namePart}`;
};

interface DataGuruProps {
  users?: User[];
  schools?: School[];
  subjects?: Subject[];
  classes?: ClassItem[];
  settings?: SystemSettings;
  onRefresh?: () => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
  themeMode?: 'dark' | 'light';
  onNavigate?: (tab: string) => void;
}

export const DataGuru: React.FC<DataGuruProps> = ({
  users = [],
  schools = [],
  subjects = [],
  classes = [],
  settings = DEFAULT_SETTINGS,
  onRefresh = () => {},
  showToast = () => {},
  themeMode = 'dark',
  onNavigate
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [recentlySavedId, setRecentlySavedId] = useState<string | null>(null);

  // Modal Siswa yang Diampu
  const [viewStudentsModal, setViewStudentsModal] = useState<{
    isOpen: boolean;
    teacher: User | null;
  }>({
    isOpen: false,
    teacher: null
  });
  const [studentModalSearch, setStudentModalSearch] = useState('');
  const [copiedUsernameId, setCopiedUsernameId] = useState<string | null>(null);

  // Selection & Bulk Delete state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    teacher?: User;
    count: number;
  }>({
    isOpen: false,
    type: 'single',
    count: 1
  });

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Form State
  const [formState, setFormState] = useState<{
    fullName: string;
    nip: string;
    schoolId: string;
    username: string;
    password?: string;
    phone: string;
    email: string;
    grade: number;
    rombel: string;
    subjects: string[];
    classes: string[];
    isQuestionAuthor: boolean;
    isActive: boolean;
  }>({
    fullName: '',
    nip: '',
    schoolId: (schools && schools.length > 0 ? schools[0]?.id : '') || '',
    username: '',
    password: 'password123',
    phone: '',
    email: '',
    grade: 6,
    rombel: 'A',
    subjects: ['sub-mtk', 'sub-ipas', 'sub-bind', 'sub-ppkn'],
    classes: ['Kelas 6A'],
    isQuestionAuthor: false,
    isActive: true
  });

  // Valid schools set untuk memastikan hanya data guru dan siswa dari sekolah yang terdaftar yang ditampilkan
  const validSchoolIds = useMemo(() => new Set((schools || []).map(s => s.id)), [schools]);
  const validSchoolNames = useMemo(() => new Set((schools || []).map(s => (s.name || '').trim().toLowerCase())), [schools]);

  // Hanya tampilkan guru yang ada di daftar sekolah yang ada
  const teachers = useMemo(() => {
    return (users || []).filter(u => {
      if (!u || String(u.role || '').toLowerCase() !== 'guru') return false;
      const uSchoolId = String(u.schoolId || '').trim();
      const uSchoolName = String(u.schoolName || '').trim().toLowerCase();
      const hasValidId = Boolean(uSchoolId && validSchoolIds.has(uSchoolId));
      const hasValidName = Boolean(uSchoolName && validSchoolNames.has(uSchoolName));
      return hasValidId || hasValidName;
    });
  }, [users, validSchoolIds, validSchoolNames]);

  // Hanya tampilkan siswa yang ada di daftar sekolah yang ada
  const students = useMemo(() => {
    return (users || []).filter(u => {
      if (!u || String(u.role || '').toLowerCase() !== 'siswa') return false;
      const uSchoolId = String(u.schoolId || '').trim();
      const uSchoolName = String(u.schoolName || '').trim().toLowerCase();
      const hasValidId = Boolean(uSchoolId && validSchoolIds.has(uSchoolId));
      const hasValidName = Boolean(uSchoolName && validSchoolNames.has(uSchoolName));
      return hasValidId || hasValidName;
    });
  }, [users, validSchoolIds, validSchoolNames]);

  // Pembersihan otomatis jika terdeteksi data guru yang tidak ada di daftar sekolah yang ada
  useEffect(() => {
    const orphanTeachers = (users || []).filter(u => {
      if (!u || String(u.role || '').toLowerCase() !== 'guru') return false;
      const uSchoolId = String(u.schoolId || '').trim();
      const uSchoolName = String(u.schoolName || '').trim().toLowerCase();
      const hasValidId = Boolean(uSchoolId && validSchoolIds.has(uSchoolId));
      const hasValidName = Boolean(uSchoolName && validSchoolNames.has(uSchoolName));
      return !hasValidId && !hasValidName;
    });

    if (orphanTeachers.length > 0) {
      const res = AppStorage.cleanupOrphanUsers();
      if (res.removedTeachers > 0 || res.removedStudents > 0) {
        onRefresh();
        showToast(
          'info',
          'Pembersihan Data Otomatis',
          `Menghapus ${res.removedTeachers} data guru yang sekolahnya tidak terdaftar di daftar sekolah.`
        );
      }
    }
  }, [users, validSchoolIds, validSchoolNames, onRefresh, showToast]);

  // Helper: Ambil siswa yang diampu oleh seorang guru
  const getAssignedStudents = (teacher: User): User[] => {
    if (!teacher) return [];
    const tSchoolId = teacher.schoolId;
    const tGrade = Number(teacher.grade) || 6;
    const tRombel = String(teacher.rombel || 'A').trim().toUpperCase();
    const tClasses = Array.isArray(teacher.classes) && teacher.classes.length > 0
      ? teacher.classes
      : [`Kelas ${tGrade}${tRombel}`];

    return (students || []).filter(st => {
      if (!st) return false;
      // Wajib cocok sekolah jika guru punya schoolId
      if (tSchoolId && st.schoolId !== tSchoolId) return false;
      const stGrade = Number(st.grade) || 6;
      const stRombel = String(st.rombel || 'A').trim().toUpperCase();
      const stClass = `Kelas ${stGrade}${stRombel}`;
      const matchesExplicit = tClasses.includes(stClass);
      const matchesGradeRombel = stGrade === tGrade && stRombel === tRombel;
      return matchesExplicit || matchesGradeRombel;
    });
  };

  // Helper: Hitung siswa untuk pratinjau di dalam Form Tambah/Edit
  const previewAssignedCount = useMemo(() => {
    const curRombel = String(formState.rombel || 'A').trim().toUpperCase();
    const curGrade = Number(formState.grade) || 6;
    return (students || []).filter(
      st => st &&
            st.schoolId === formState.schoolId &&
            (Number(st.grade) || 6) === curGrade &&
            String(st.rombel || 'A').trim().toUpperCase() === curRombel
    ).length;
  }, [students, formState.schoolId, formState.grade, formState.rombel]);

  // Counts for filters
  const activeCount = teachers.filter(t => t && t.isActive).length;
  const inactiveCount = teachers.filter(t => t && !t.isActive).length;

  // Filtered teachers list with safe null/undefined and flexible school matching (id, npsn, name)
  const filteredTeachers = useMemo(() => {
    const q = String(searchTerm || '').trim().toLowerCase();
    return (teachers || []).filter(t => {
      if (!t) return false;
      const fullName = String(t.fullName || '').toLowerCase();
      const nip = String(t.nip || '');
      const username = String(t.username || '').toLowerCase();
      const schoolName = String(t.schoolName || '').toLowerCase();

      const matchSearch =
        !q ||
        fullName.includes(q) ||
        nip.includes(q) ||
        username.includes(q) ||
        schoolName.includes(q);
      
      let matchSchool = schoolFilter === 'ALL';
      if (!matchSchool) {
        const cleanFilter = String(schoolFilter || '').trim();
        const tSchoolId = String(t.schoolId || '').trim();
        const tSchoolName = String(t.schoolName || '').trim().toLowerCase();

        // Cari objek sekolah yang sesuai dengan filter
        const targetSchool = (schools || []).find(
          s => s && (s.id === cleanFilter || s.npsn === cleanFilter || s.name.toLowerCase() === cleanFilter.toLowerCase())
        );

        matchSchool =
          tSchoolId === cleanFilter ||
          (Boolean(targetSchool) && (
            tSchoolId === targetSchool?.id ||
            tSchoolId === targetSchool?.npsn ||
            (Boolean(tSchoolName) && tSchoolName === targetSchool?.name.toLowerCase()) ||
            (Boolean(targetSchool?.npsn) && tSchoolId === targetSchool?.npsn)
          ));
      }

      let matchStatus = true;
      if (statusFilter === 'active') matchStatus = Boolean(t.isActive);
      if (statusFilter === 'inactive') matchStatus = !t.isActive;

      return matchSearch && matchSchool && matchStatus;
    });
  }, [teachers, schools, searchTerm, schoolFilter, statusFilter]);

  // Summary statistics
  const totalStudentsUnderTeachers = useMemo(() => {
    const assignedStudentIds = new Set<string>();
    teachers.forEach(t => {
      if (t) {
        getAssignedStudents(t).forEach(st => {
          if (st && st.id) assignedStudentIds.add(st.id);
        });
      }
    });
    return assignedStudentIds.size;
  }, [teachers, students]);

  const uniqueSchoolsWithTeachers = useMemo(() => {
    return new Set(teachers.map(t => t?.schoolId).filter(Boolean)).size;
  }, [teachers]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredTeachers.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePromptDeleteSingle = (teacher: User) => {
    setDeleteTarget({
      isOpen: true,
      type: 'single',
      teacher,
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
    if (deleteTarget.type === 'single' && deleteTarget.teacher) {
      const t = deleteTarget.teacher;
      AppStorage.deleteUser(t.id);
      AppStorage.logActivity('Admin Kecamatan', 'admin', 'Hapus Guru', `Menghapus data guru: ${t.fullName}`);
      setSelectedIds(prev => prev.filter(id => id !== t.id));
      onRefresh();
      showToast('success', 'Guru Dihapus', `Data guru "${t.fullName}" berhasil dihapus.`);
    } else if (deleteTarget.type === 'bulk') {
      const count = selectedIds.length;
      AppStorage.deleteUsers(selectedIds);
      AppStorage.logActivity('Admin Kecamatan', 'admin', 'Hapus Guru Massal', `Menghapus ${count} guru sekaligus.`);
      setSelectedIds([]);
      onRefresh();
      showToast('success', 'Penghapusan Massal Berhasil', `Sebanyak ${count} guru berhasil dihapus.`);
    }
    setDeleteTarget(prev => ({ ...prev, isOpen: false }));
  };

  const handleRestoreDefaultTeachers = () => {
    AppStorage.restoreDefaultTeachers();
    onRefresh();
    showToast('success', 'Data Guru Dipulihkan', 'Akun guru SD se-Kecamatan Ampelgading berhasil dipulihkan ke sistem.');
  };

  const handleAutoFillUsername = () => {
    if (!formState.fullName || !formState.fullName.trim()) return;
    const generated = formatGuruUsername(formState.fullName);
    setFormState(prev => ({ ...prev, username: generated }));
  };

  const handleOpenAdd = () => {
    setSelectedTeacher(null);
    setShowFormPassword(false);
    const selectedSchoolObj = schoolFilter !== 'ALL'
      ? (schools || []).find(s => s && (s.id === schoolFilter || s.npsn === schoolFilter))
      : null;
    const defaultSchool = selectedSchoolObj || ((schools && schools.length > 0) ? schools[0] : null);
    setFormState({
      fullName: '',
      nip: '',
      schoolId: defaultSchool?.id || '',
      username: '',
      password: 'password123',
      phone: '',
      email: '',
      grade: 6,
      rombel: 'A',
      subjects: ['sub-mtk', 'sub-ipas', 'sub-bind', 'sub-ppkn'],
      classes: ['Kelas 6A'],
      isQuestionAuthor: false,
      isActive: true
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (teacher: User) => {
    if (!teacher) return;
    setSelectedTeacher(teacher);
    setShowFormPassword(false);
    const assignedGrade = Number(teacher.grade) || 6;
    const assignedRombel = String(teacher.rombel || 'A').trim().toUpperCase();

    setFormState({
      fullName: teacher.fullName || '',
      nip: teacher.nip ? String(teacher.nip) : '',
      schoolId: teacher.schoolId || (schools && schools[0]?.id) || '',
      username: teacher.username || '',
      password: '',
      phone: teacher.phone ? String(teacher.phone) : '',
      email: teacher.email ? String(teacher.email) : '',
      grade: assignedGrade,
      rombel: ['A', 'B', 'C', 'D'].includes(assignedRombel) ? assignedRombel : 'A',
      subjects: Array.isArray(teacher.subjects) ? teacher.subjects : [],
      classes: [`Kelas ${assignedGrade}${assignedRombel}`],
      isQuestionAuthor: Boolean(teacher.isQuestionAuthor),
      isActive: Boolean(teacher.isActive)
    });
    setIsFormOpen(true);
  };

  // Penyimpanan Guru & Langsung Muncul di Layar
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.fullName.trim() || !formState.username.trim()) {
      showToast('error', 'Validasi Gagal', 'Nama Lengkap dan Username login wajib diisi.');
      return;
    }

    const schoolObj = (schools || []).find(s => s && s.id === formState.schoolId);
    const singleClassStr = `Kelas ${formState.grade}${formState.rombel}`;
    const cleanUsername = formState.username.trim().toLowerCase();

    // Pastikan username unik (kecuali milik guru yang sedang diedit)
    const isDuplicate = (users || []).some(
      u => u && u.username && u.username.toLowerCase() === cleanUsername && u.id !== selectedTeacher?.id
    );
    if (isDuplicate) {
      showToast('error', 'Username Sudah Dipakai', `Username "${cleanUsername}" sudah digunakan oleh akun lain. Silakan ubah username.`);
      return;
    }

    const teacherToSave: User = {
      id: selectedTeacher ? selectedTeacher.id : 'usr-guru-' + Date.now(),
      username: cleanUsername,
      password: formState.password ? formState.password.trim() : (selectedTeacher?.password || 'password123'),
      role: 'guru',
      fullName: formState.fullName.trim(),
      nip: formState.nip.trim() || undefined,
      schoolId: formState.schoolId,
      schoolName: schoolObj?.name || '',
      phone: formState.phone.trim() || undefined,
      email: formState.email.trim() || undefined,
      grade: formState.grade,
      rombel: formState.rombel,
      subjects: formState.subjects,
      classes: [singleClassStr],
      isQuestionAuthor: formState.isQuestionAuthor,
      isActive: formState.isActive,
      createdAt: selectedTeacher?.createdAt || new Date().toISOString().slice(0, 10)
    };

    // Simpan ke database terpusat
    AppStorage.saveUser(teacherToSave);
    AppStorage.logActivity(
      'Admin Kecamatan',
      'admin',
      selectedTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru',
      `Menyimpan data guru: ${teacherToSave.fullName} (${teacherToSave.schoolName} - ${singleClassStr})`
    );

    // Langsung hilangkan filter penghalang agar data guru baru langsung muncul di tabel!
    setSearchTerm('');
    if (schoolFilter !== 'ALL' && schoolFilter !== teacherToSave.schoolId) {
      setSchoolFilter('ALL');
    }
    if (statusFilter === 'inactive' && teacherToSave.isActive) {
      setStatusFilter('ALL');
    } else if (statusFilter === 'active' && !teacherToSave.isActive) {
      setStatusFilter('ALL');
    }

    // Sorot baris guru yang baru disimpan secara visual
    setRecentlySavedId(teacherToSave.id);
    setTimeout(() => {
      setRecentlySavedId(null);
    }, 4500);

    setIsFormOpen(false);
    onRefresh();
    showToast(
      'success',
      selectedTeacher ? 'Data Guru Diperbarui' : 'Guru Baru Berhasil Disimpan',
      `Guru ${teacherToSave.fullName} (${teacherToSave.schoolName} - ${singleClassStr}) langsung terdaftar di sistem.`
    );
  };

  const handleResetPassword = (teacher: User) => {
    if (!teacher) return;
    const updated = { ...teacher, password: 'password123' };
    AppStorage.saveUser(updated);
    showToast('success', 'Password Direset', `Password untuk ${teacher.username} telah direset menjadi: password123`);
  };

  const handleToggleActive = (teacher: User) => {
    if (!teacher) return;
    const updated = { ...teacher, isActive: !teacher.isActive };
    AppStorage.saveUser(updated);
    onRefresh();
    showToast(
      'success',
      'Status Guru Berubah',
      `Akun guru ${teacher.fullName} sekarang ${updated.isActive ? 'Aktif' : 'Nonaktif'}.`
    );
  };

  const handleCopyUsername = (teacherId: string, username: string) => {
    navigator.clipboard.writeText(username);
    setCopiedUsernameId(teacherId);
    showToast('info', 'Username Disalin', `Username "${username}" disalin ke clipboard.`);
    setTimeout(() => setCopiedUsernameId(null), 2500);
  };

  const handleExport = () => {
    ExcelService.exportTeachers(filteredTeachers, schools, subjects);
    showToast('success', 'Ekspor Berhasil', `Data ${filteredTeachers.length} guru berhasil diekspor ke Excel.`);
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await ExcelService.parseExcelFile(file);
      const errors: string[] = [];
      const seenUsernames = new Set<string>();

      parsed.forEach((row, idx) => {
        const rowNum = idx + 2;
        const fullName = String(row['Nama_Lengkap'] || row['Nama Lengkap Guru'] || '').trim();
        const username = String(row['Username'] || '').trim();

        if (!fullName) {
          errors.push(`Baris ${rowNum}: Nama guru tidak boleh kosong.`);
        }
        if (!username) {
          errors.push(`Baris ${rowNum}: Username login tidak boleh kosong.`);
        } else if (seenUsernames.has(username.toLowerCase())) {
          errors.push(`Baris ${rowNum}: Username "${username}" duplikat dalam file.`);
        } else {
          seenUsernames.add(username.toLowerCase());
          if ((users || []).some(u => u && u.username && u.username.toLowerCase() === username.toLowerCase())) {
            errors.push(`Baris ${rowNum}: Username "${username}" sudah digunakan di sistem.`);
          }
        }
      });

      setImportRows(parsed);
      setImportErrors(errors);
      showToast('info', 'File Terbaca', `Ditemukan ${parsed.length} baris data guru.`);
    } catch (err: any) {
      showToast('error', 'Gagal Membaca File', err.message || 'File Excel tidak valid.');
    }
  };

  const handleSaveImport = () => {
    if (importRows.length === 0) return;

    let successCount = 0;
    importRows.forEach(row => {
      const npsn = String(row['NPSN_Sekolah'] || row['NPSN'] || '');
      const schoolObj = (schools || []).find(s => s && s.npsn === npsn) || schools[0];
      const rawFullName = String(row['Nama_Lengkap'] || row['Nama Lengkap Guru'] || '').trim();
      const rawUsername = String(row['Username'] || formatGuruUsername(rawFullName)).trim().toLowerCase();
      
      const newTeacher: User = {
        id: 'usr-guru-' + Date.now() + Math.random().toString(36).substring(2, 6),
        username: rawUsername,
        password: String(row['Password_Awal'] || row['Password'] || 'password123'),
        role: 'guru',
        fullName: rawFullName,
        nip: row['NIP'] ? String(row['NIP']).trim() : undefined,
        schoolId: schoolObj?.id || '',
        schoolName: schoolObj?.name || '',
        phone: row['Nomor_Telepon'] || row['Nomor Kontak'] ? String(row['Nomor_Telepon'] || row['Nomor Kontak']) : undefined,
        email: row['Email'] ? String(row['Email']) : undefined,
        grade: Number(row['Kelas']) || 6,
        rombel: String(row['Rombel'] || 'A').toUpperCase(),
        classes: [`Kelas ${Number(row['Kelas']) || 6}${String(row['Rombel'] || 'A').toUpperCase()}`],
        subjects: ['sub-mtk', 'sub-ipas', 'sub-bind', 'sub-ppkn'],
        isActive: true,
        createdAt: new Date().toISOString().slice(0, 10)
      };

      AppStorage.saveUser(newTeacher);
      successCount++;
    });

    AppStorage.logActivity('Admin Kecamatan', 'admin', 'Impor Guru Massal', `Berhasil mengimpor ${successCount} guru dari file Excel.`);
    setIsImportModalOpen(false);
    setImportRows([]);
    setImportErrors([]);
    onRefresh();
    showToast('success', 'Impor Sukses', `${successCount} guru berhasil didaftarkan dan langsung muncul di sistem.`);
  };

  // Selected teacher's assigned students for the detail modal
  const modalAssignedStudents = useMemo(() => {
    if (!viewStudentsModal.teacher) return [];
    const list = getAssignedStudents(viewStudentsModal.teacher);
    const q = String(studentModalSearch || '').trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      st => {
        if (!st) return false;
        const fullName = String(st.fullName || '').toLowerCase();
        const nisn = String(st.nisn || '');
        const participantNumber = String(st.participantNumber || '');
        const username = String(st.username || '').toLowerCase();
        return fullName.includes(q) || nisn.includes(q) || participantNumber.includes(q) || username.includes(q);
      }
    );
  }, [viewStudentsModal.teacher, students, studentModalSearch]);

  const districtName = settings?.districtName || 'Kecamatan Ampelgading';

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Pengelolaan Data Guru & Wali Kelas
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola profil guru, penugasan sekolah, kelas binaan, dan pantau siswa yang diampu di {districtName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('admin-spreadsheet-sync')}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Kelola & Tarik Data Guru via Google Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Sheets</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleRestoreDefaultTeachers}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            title="Pulihkan dan Sinkronkan Data Guru Default (David & Yuyut)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>Sinkronkan Guru</span>
          </button>
          <button
            type="button"
            onClick={() => ExcelService.downloadTeacherImportTemplate(schools)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            title="Unduh Format Spreadsheet Guru"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Format Excel</span>
          </button>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor Excel</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Data</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Cards: Guru, Sekolah, Siswa yang Diampu */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Guru</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{teachers.length}</span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {activeCount} Aktif
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pendidik di {districtName}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Sekolah Terlayani</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <SchoolIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{uniqueSchoolsWithTeachers}</span>
            <span className="text-xs text-slate-400">dari {(schools || []).length} SD</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sekolah memiliki guru bertugas</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Siswa yang Diampu</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <GraduationCap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-600">{totalStudentsUnderTeachers}</span>
            <span className="text-xs text-slate-400">dari {(students || []).length} Siswa</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Terhubung langsung ke guru kelas</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Status Akun Guru</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <BadgeCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{activeCount}</span>
            <span className="text-xs text-rose-500 font-semibold">{inactiveCount} Nonaktif</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Username format: <code className="text-blue-600 font-semibold">guru_nama</code></p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Guru, NIP, Username, Sekolah..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-[10px] text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 bg-slate-200 rounded-full px-1.5 py-0.5 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 shrink-0 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              aria-label="Filter status guru"
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Status ({teachers.length})</option>
              <option value="active">Aktif Saja ({activeCount})</option>
              <option value="inactive">Nonaktif Saja ({inactiveCount})</option>
            </select>
          </div>

          {/* School Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 shrink-0 font-medium">Sekolah:</span>
            <select
              value={schoolFilter}
              onChange={e => setSchoolFilter(e.target.value)}
              aria-label="Filter sekolah guru"
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500 max-w-xs truncate cursor-pointer"
            >
              <option value="ALL">Semua Sekolah ({(schools || []).length} SD)</option>
              {(schools || []).map(s => {
                if (!s) return null;
                const countAtSchool = teachers.filter(t => t && t.schoolId === s.id).length;
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({countAtSchool} Guru)
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Bulk Delete Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs text-rose-900 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
            <span>{selectedIds.length} dari {filteredTeachers.length} guru dipilih</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(filteredTeachers.map(t => t.id))}
              className="px-2.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Pilih Semua ({filteredTeachers.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition cursor-pointer"
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={handlePromptDeleteBulk}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus {selectedIds.length} Guru
            </button>
          </div>
        </div>
      )}

      {/* 5. Main Table: Guru, Sekolah, dan Siswa yang Diampu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Mobile Swipe Hint */}
        <div className="px-3.5 py-2 bg-indigo-50/60 border-b border-indigo-100 text-[11px] text-indigo-900 flex items-center justify-between sm:hidden">
          <span className="font-medium text-[10px] flex items-center gap-1">
            <span>👉</span> Geser tabel ke kanan untuk melihat akun & aksi
          </span>
          <span className="font-bold text-[10px] font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
            {filteredTeachers.length} Guru
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua guru"
                    checked={filteredTeachers.length > 0 && selectedIds.length === filteredTeachers.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-3 w-10 text-center">No</th>
                <th className="py-3.5 px-4">Nama Lengkap & NIP</th>
                <th className="py-3.5 px-4">Sekolah Tempat Tugas</th>
                <th className="py-3.5 px-4">Kelas Binaan</th>
                <th className="py-3.5 px-4 text-center">Siswa yang Diampu</th>
                <th className="py-3.5 px-4">Mata Pelajaran</th>
                <th className="py-3.5 px-4">Username Login</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-3">
                      <Users className="w-10 h-10 text-slate-300 mx-auto" />
                      <div>
                        <p className="font-semibold text-slate-700 text-sm">
                          {schoolFilter !== 'ALL'
                            ? `Belum ada data guru terdaftar untuk sekolah ini.`
                            : `Tidak ada data guru yang cocok.`}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {schoolFilter !== 'ALL'
                            ? 'Anda dapat menugaskan guru baru di sekolah ini, atau klik tombol di bawah untuk menampilkan seluruh sekolah.'
                            : searchTerm || statusFilter !== 'ALL'
                            ? 'Coba ubah kata kunci pencarian atau ganti filter status.'
                            : 'Belum ada data guru pengampu di sistem. Anda dapat memulihkan akun default atau menambah guru baru.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        {schoolFilter !== 'ALL' && (
                          <button
                            type="button"
                            onClick={() => setSchoolFilter('ALL')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                          >
                            <span>Tampilkan Semua Sekolah</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleRestoreDefaultTeachers}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-xs transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Pulihkan Data Guru Default</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenAdd}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xs transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Guru Baru</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher, index) => {
                  if (!teacher) return null;
                  const school = (schools || []).find(s => s && s.id === teacher.schoolId);
                  const assignedStudents = getAssignedStudents(teacher);
                  const subNames = (teacher.subjects || [])
                    .map(subId => (subjects || []).find(s => s && s.id === subId)?.code || (subjects || []).find(s => s && s.id === subId)?.name)
                    .filter(Boolean)
                    .join(', ');
                  const isChecked = selectedIds.includes(teacher.id);
                  const isRecentlySaved = recentlySavedId === teacher.id;

                  return (
                    <tr
                      key={teacher.id}
                      className={`hover:bg-slate-50/70 transition duration-150 ${
                        isChecked ? 'bg-blue-50/40' : ''
                      } ${isRecentlySaved ? 'bg-emerald-50/70 ring-2 ring-emerald-400 ring-inset' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Pilih guru ${teacher.fullName}`}
                          checked={isChecked}
                          onChange={() => handleToggleSelect(teacher.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Number */}
                      <td className="py-3 px-3 text-center text-slate-400 font-semibold">{index + 1}</td>

                      {/* Name & NIP */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-slate-900">{teacher.fullName || 'Nama Guru'}</div>
                          {isRecentlySaved && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white animate-pulse">
                              Baru Disimpan
                            </span>
                          )}
                          {teacher.isQuestionAuthor && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200" title="Penyusun Naskah Soal Ujian">
                              Penulis Soal
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span>NIP: {teacher.nip || '-'}</span>
                          {teacher.phone && (
                            <>
                              <span>•</span>
                              <span>WA: {teacher.phone}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* School Name & NPSN */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <SchoolIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{school ? school.name : teacher.schoolName || 'SD Belum Ditentukan'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>NPSN: {school?.npsn || '-'}</span>
                          <span>•</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            school?.status === 'Negeri' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {school?.status || 'SD'}
                          </span>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                          Kelas {teacher.grade || 6}{teacher.rombel || 'A'}
                        </span>
                      </td>

                      {/* SISWA YANG DIAMPU (Interactive) */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setViewStudentsModal({ isOpen: true, teacher })}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold text-xs border transition cursor-pointer shadow-2xs ${
                            assignedStudents.length > 0
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                              : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                          }`}
                          title={`Klik untuk melihat rincian ${assignedStudents.length} siswa yang diampu`}
                        >
                          <GraduationCap className={`w-3.5 h-3.5 ${assignedStudents.length > 0 ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span>{assignedStudents.length} Siswa</span>
                          <Eye className="w-3 h-3 text-indigo-400 ml-0.5" />
                        </button>
                      </td>

                      {/* Subjects */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px]">
                          {subNames || 'Guru Kelas'}
                        </span>
                      </td>

                      {/* Username (guru_nama format) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 font-mono font-bold text-blue-900 text-xs">
                            {teacher.username || '-'}
                          </span>
                          {teacher.username && (
                            <button
                              type="button"
                              onClick={() => handleCopyUsername(teacher.id, teacher.username)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded-md transition cursor-pointer"
                              title="Salin Username"
                            >
                              {copiedUsernameId === teacher.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status (Aktif / Nonaktif) */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(teacher)}
                          title={`Klik untuk mengubah status menjadi ${teacher.isActive ? 'Nonaktif' : 'Aktif'}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer shadow-2xs ${
                            teacher.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {teacher.isActive ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          <span>{teacher.isActive ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewStudentsModal({ isOpen: true, teacher })}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Lihat Siswa Binaan"
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetPassword(teacher)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Reset Password ke password123"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(teacher)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="Edit Data Guru"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePromptDeleteSingle(teacher)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus Guru"
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

      {/* 6. MODAL DAFTAR SISWA YANG DIAMPU */}
      {viewStudentsModal.teacher && (
        <Modal
          isOpen={viewStudentsModal.isOpen}
          onClose={() => {
            setViewStudentsModal({ isOpen: false, teacher: null });
            setStudentModalSearch('');
          }}
          title={`Daftar Siswa yang Diampu - ${viewStudentsModal.teacher.fullName || 'Guru'}`}
          subtitle={`${viewStudentsModal.teacher.schoolName || 'Sekolah'} • Kelas ${viewStudentsModal.teacher.grade || 6}${viewStudentsModal.teacher.rombel || 'A'}`}
          maxWidth="4xl"
        >
          <div className="space-y-4 text-xs">
            {/* Header info badge */}
            <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    {viewStudentsModal.teacher.fullName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                    Guru Kelas {viewStudentsModal.teacher.grade || 6}{viewStudentsModal.teacher.rombel || 'A'}
                  </span>
                </div>
                <p className="text-slate-600 text-xs mt-0.5">
                  Sekolah: <span className="font-semibold text-slate-800">{viewStudentsModal.teacher.schoolName || '-'}</span> • NIP: {viewStudentsModal.teacher.nip || '-'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-center shadow-2xs">
                  <span className="block text-[10px] text-slate-500">Total Diampu</span>
                  <span className="block text-base font-extrabold text-indigo-700">
                    {getAssignedStudents(viewStudentsModal.teacher).length} Siswa
                  </span>
                </div>
              </div>
            </div>

            {/* Search inside student modal */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari siswa dalam kelas ini (Nama, NISN, No Peserta)..."
                  value={studentModalSearch}
                  onChange={e => setStudentModalSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-[11px] text-slate-500 font-semibold shrink-0">
                Menampilkan {modalAssignedStudents.length} siswa
              </span>
            </div>

            {/* Students Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 text-[11px]">
                  <tr>
                    <th className="p-2.5 text-center w-10">No</th>
                    <th className="p-2.5">No. Peserta Ujian</th>
                    <th className="p-2.5">NISN</th>
                    <th className="p-2.5">Nama Lengkap Siswa</th>
                    <th className="p-2.5">Agama</th>
                    <th className="p-2.5">Username Login</th>
                    <th className="p-2.5 text-center">Status Akun</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modalAssignedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                        <p className="font-semibold text-slate-700">Belum ada siswa terdaftar di kelas ini.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Siswa untuk sekolah ini dapat ditambahkan pada menu <strong>Data Siswa</strong> dengan memilih 
                          Kelas {viewStudentsModal.teacher?.grade || 6}{viewStudentsModal.teacher?.rombel || 'A'}.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    modalAssignedStudents.map((st, i) => (
                      <tr key={st.id} className="hover:bg-slate-50 transition">
                        <td className="p-2.5 text-center text-slate-400 font-semibold">{i + 1}</td>
                        <td className="p-2.5 font-mono font-bold text-blue-900">{st.participantNumber || '-'}</td>
                        <td className="p-2.5 font-mono text-slate-600">{st.nisn || '-'}</td>
                        <td className="p-2.5 font-bold text-slate-900">{st.fullName}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            {st.religion || 'Islam'}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-700 font-semibold">{st.username}</td>
                        <td className="p-2.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            st.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {st.isActive ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-rose-600" />}
                            <span>{st.isActive ? 'Aktif' : 'Nonaktif'}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Data terhubung secara real-time dengan Data Siswa dan Hasil Ujian CBT
              </span>
              <button
                type="button"
                onClick={() => {
                  setViewStudentsModal({ isOpen: false, teacher: null });
                  setStudentModalSearch('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. MODAL TAMBAH / EDIT GURU */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedTeacher ? 'Edit Data Diri & Penugasan Guru' : 'Tambah Guru Baru'}
        subtitle="Kelola profil guru, username login (guru_nama), penugasan sekolah, kelas binaan, dan status keaktifan"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          
          {/* Section 1: Data Diri & Identitas */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                1. Identitas Guru
              </span>
              <span className="text-[10px] text-slate-400 font-medium">* Wajib diisi</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={formState.fullName}
                  onChange={e => {
                    const newName = e.target.value;
                    if (!selectedTeacher && (!formState.username || formState.username.startsWith('guru_'))) {
                      setFormState({
                        ...formState,
                        fullName: newName,
                        username: formatGuruUsername(newName)
                      });
                    } else {
                      setFormState({ ...formState, fullName: newName });
                    }
                  }}
                  placeholder="Contoh: David, S.Pd. atau Yuyut, S.Pd."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  NIP (Nomor Induk Pegawai)
                </label>
                <input
                  type="text"
                  value={formState.nip}
                  onChange={e => setFormState({ ...formState, nip: e.target.value })}
                  placeholder="19850612 201001 1 012"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Kontak / WhatsApp
                </label>
                <input
                  type="text"
                  value={formState.phone}
                  onChange={e => setFormState({ ...formState, phone: e.target.value })}
                  placeholder="0812-3456-7890"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Guru
                </label>
                <input
                  type="email"
                  value={formState.email}
                  onChange={e => setFormState({ ...formState, email: e.target.value })}
                  placeholder="nama.guru@sekolah.id"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Kredensial Login & Status Akun */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-600" />
                2. Kredensial Login & Status Akun
              </span>
              <span className="text-[10px] text-blue-700 font-semibold bg-blue-100 px-2 py-0.5 rounded-full">
                Format: guru_nama guru
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Username Input dengan format guru_nama */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    Username Login *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoFillUsername}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Buat username otomatis dari nama guru"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Auto (guru_nama)
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formState.username}
                    onChange={e => setFormState({ ...formState, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="Contoh: guru_david atau guru_yuyut"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs bg-white font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Format baku: <code className="font-bold text-blue-700">guru_nama</code> (misal: <span className="font-semibold text-slate-700">guru_david</span>)
                </p>
              </div>

              {/* Password Input dengan show/hide */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    {selectedTeacher ? 'Ganti Password (Opsional)' : 'Password Akun *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    {showFormPassword ? <EyeOff className="w-3 h-3 text-rose-500" /> : <Eye className="w-3 h-3 text-slate-400" />}
                    <span>{showFormPassword ? 'Tutup' : 'Lihat'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showFormPassword ? 'text' : 'password'}
                    value={formState.password || ''}
                    onChange={e => setFormState({ ...formState, password: e.target.value })}
                    placeholder={selectedTeacher ? 'Kosongkan jika tidak ingin diubah' : 'password123'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {selectedTeacher ? 'Kosongkan jika tetap password lama' : 'Password default: password123'}
                </p>
              </div>
            </div>

            {/* Status Akun Radio Cards */}
            <div className="pt-2">
              <label className="block font-bold text-slate-800 text-xs mb-1.5">
                Status Keaktifan Akun Guru *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormState({ ...formState, isActive: true })}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer ${
                    formState.isActive
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 opacity-80'
                  }`}
                >
                  <div className={`p-1 rounded-full shrink-0 mt-0.5 ${formState.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block font-bold text-xs text-emerald-900">Aktif (Dapat Login)</span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                      Guru dapat masuk ke portal CBT dan mengawasi ujian.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormState({ ...formState, isActive: false })}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer ${
                    !formState.isActive
                      ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-xs ring-2 ring-rose-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 opacity-80'
                  }`}
                >
                  <div className={`p-1 rounded-full shrink-0 mt-0.5 ${!formState.isActive ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    <XCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block font-bold text-xs text-rose-900">Nonaktif (Dibekukan)</span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                      Akses login ditangguhkan sementara waktu.
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Penyesuaian Data Sekolah & Siswa yang Diampu */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <SchoolIcon className="w-4 h-4 text-emerald-600" />
                3. Penugasan Sekolah & Kelas Binaan
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Terpilih: Kelas {formState.grade}{formState.rombel}
              </span>
            </div>

            {/* Dropdown Sekolah */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Sekolah Tempat Tugas *
              </label>
              <select
                value={formState.schoolId}
                onChange={e => setFormState({ ...formState, schoolId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {(schools || []).map(s => {
                  if (!s) return null;
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} (NPSN: {s.npsn} - {s.status})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Tingkat Kelas & Rombel */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-800 text-xs">
                  Pilih Kelas yang Diampu
                </label>
                <span className="text-[11px] text-slate-500">
                  Guru mengawasi dan membina siswa pada kelas ini
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tingkat Kelas *</label>
                  <select
                    value={formState.grade}
                    onChange={e => {
                      const newGrade = Number(e.target.value) || 6;
                      setFormState({
                        ...formState,
                        grade: newGrade,
                        classes: [`Kelas ${newGrade}${formState.rombel}`]
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6].map(g => (
                      <option key={g} value={g}>Kelas {g} SD</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Rombel *</label>
                  <select
                    value={formState.rombel}
                    onChange={e => {
                      const newRombel = e.target.value;
                      setFormState({
                        ...formState,
                        rombel: newRombel,
                        classes: [`Kelas ${formState.grade}${newRombel}`]
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {['A', 'B', 'C', 'D'].map(r => (
                      <option key={r} value={r}>Rombel {r} (Kelas {formState.grade}{r})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LIVE PREVIEW: Siswa yang Akan Diampu */}
              <div className="mt-2 p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="text-[11px] text-indigo-950">
                  {previewAssignedCount > 0 ? (
                    <span>
                      Terdapat <strong className="text-indigo-700 font-bold">{previewAssignedCount} siswa</strong> terdaftar di Kelas {formState.grade}{formState.rombel} pada sekolah ini yang akan langsung diampu oleh guru.
                    </span>
                  ) : (
                    <span className="text-slate-600">
                      Belum ada siswa terdaftar di Kelas {formState.grade}{formState.rombel} pada sekolah ini. Siswa dapat didaftarkan di menu <em>Data Siswa</em>.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Mata Pelajaran & Hak Khusus */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                4. Mata Pelajaran & Peran Khusus
              </span>
              <button
                type="button"
                onClick={() => {
                  const commonMapel = ['sub-mtk', 'sub-ipas', 'sub-bind', 'sub-ppkn', 'sub-bing'];
                  setFormState({ ...formState, subjects: commonMapel });
                }}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                Pilih Mapel Pokok (MTK, IPAS, B.Ind, PPKn)
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(subjects || []).map(sub => {
                if (!sub) return null;
                const checked = formState.subjects.includes(sub.id);
                return (
                  <label
                    key={sub.id}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                      checked ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold' : 'bg-white border-slate-200 hover:bg-slate-100/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => {
                        if (e.target.checked) {
                          setFormState({ ...formState, subjects: [...formState.subjects, sub.id] });
                        } else {
                          setFormState({ ...formState, subjects: formState.subjects.filter(s => s !== sub.id) });
                        }
                      }}
                      className="rounded text-blue-600"
                    />
                    <span className="truncate">{sub.name}</span>
                  </label>
                );
              })}
            </div>

            {/* Checkbox Guru Pembuat Naskah Ujian */}
            <div className="pt-2 border-t border-slate-200">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-300 bg-amber-50/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.isQuestionAuthor}
                  onChange={e => setFormState({ ...formState, isQuestionAuthor: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-bold text-amber-900 text-xs block">
                    Penulis Naskah Soal Ujian Kecamatan
                  </span>
                  <span className="text-[10px] text-slate-600 block">
                    Beri hak akses khusus untuk menyusun dan mengunggah soal ke Bank Soal CBT Kecamatan.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            <div className="text-[11px] text-slate-500">
              Username: <code className="font-bold text-blue-700">{formState.username || 'guru_...'}</code>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{selectedTeacher ? 'Simpan Perubahan Data Guru' : 'Daftarkan Guru Baru'}</span>
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* 8. MODAL IMPOR EXCEL GURU */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportRows([]);
          setImportErrors([]);
        }}
        title="Impor Data Guru Massal dari Excel"
        subtitle="Unggah spreadsheet untuk menambahkan guru kelas dan guru mapel se-kecamatan secara serentak"
        maxWidth="4xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 text-center hover:bg-slate-50 transition">
            <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <p className="font-bold text-slate-800">Pilih File Excel Data Guru (.xlsx / .csv)</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Gunakan format resmi yang memuat Nama_Lengkap, Username, NPSN_Sekolah, dan Kelas
            </p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportFileChange}
              className="mt-3 block mx-auto text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
            />
          </div>

          {/* Error List */}
          {importErrors.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
              <div className="flex items-center gap-2 font-bold mb-1">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                Ditemukan {importErrors.length} Kesalahan Data:
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
                  Pratinjau Data Guru ({importRows.length} Terbaca)
                </p>
                <span className="text-[11px] text-emerald-600 font-semibold">Siap Disimpan</span>
              </div>
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-slate-100 sticky top-0 font-bold text-slate-700">
                    <tr>
                      <th className="p-2">Nama Lengkap</th>
                      <th className="p-2">NIP</th>
                      <th className="p-2">NPSN / Sekolah</th>
                      <th className="p-2">Username</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-900">{r['Nama_Lengkap'] || r['Nama Lengkap Guru'] || '-'}</td>
                        <td className="p-2 font-mono">{r['NIP'] || '-'}</td>
                        <td className="p-2">{r['NPSN_Sekolah'] || r['Nama_Sekolah'] || '-'}</td>
                        <td className="p-2 font-mono font-bold text-emerald-700">{r['Username'] || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => ExcelService.downloadTeacherImportTemplate(schools)}
              className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              Unduh Template Guru Lagi (.xlsx)
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={importRows.length === 0}
                onClick={handleSaveImport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
              >
                Simpan {importRows.length} Data Guru
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* 9. MODAL KONFIRMASI HAPUS GURU */}
      <ConfirmDeleteModal
        isOpen={deleteTarget.isOpen}
        onClose={() => setDeleteTarget(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDelete}
        title={deleteTarget.type === 'bulk' ? 'Hapus Guru Terpilih' : 'Hapus Data Guru'}
        count={deleteTarget.count}
        message={
          deleteTarget.type === 'bulk'
            ? `Apakah Anda yakin ingin menghapus ${deleteTarget.count} akun guru yang dipilih? Semua penugasan guru ini akan dihapus dari sistem.`
            : `Apakah Anda yakin ingin menghapus akun guru "${deleteTarget.teacher?.fullName}"?`
        }
        detail={
          deleteTarget.type === 'single' && deleteTarget.teacher
            ? `Username: ${deleteTarget.teacher.username} • NIP: ${deleteTarget.teacher.nip || '-'} • Sekolah: ${deleteTarget.teacher.schoolName || '-'}`
            : undefined
        }
        confirmLabel={deleteTarget.type === 'bulk' ? `Hapus ${deleteTarget.count} Guru` : 'Hapus Guru'}
      />

    </div>
  );
};
