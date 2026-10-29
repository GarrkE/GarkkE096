import React, { useState, useMemo } from 'react';
import {
  PenTool,
  Plus,
  Search,
  Download,
  Users,
  School as SchoolIcon,
  BookOpen,
  FileQuestion,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Edit2,
  Trash2,
  KeyRound,
  Eye,
  Sparkles,
  Save,
  Lock,
  UserCheck,
  HelpCircle,
  Award,
  AlertTriangle,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { User, School, Subject, Question, SystemSettings } from '../../types';
import { AppStorage, DEFAULT_SETTINGS } from '../../services/storage';
import { ExcelService } from '../../services/excelService';
import { Modal } from '../../components/Modal';

interface PembuatSoalViewProps {
  users?: User[];
  schools?: School[];
  subjects?: Subject[];
  questions?: Question[];
  settings?: SystemSettings;
  onRefresh?: () => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
  themeMode?: 'dark' | 'light';
  onNavigate?: (tab: string) => void;
}

export const formatAuthorUsername = (fullName: string): string => {
  if (!fullName || typeof fullName !== 'string') return 'penulis_soal';
  const clean = fullName
    .replace(/\b(dr|dra|drs|s\.pd|s\.kom|s\.ag|m\.pd|m\.m|m\.si|s\.si|h|hj|ust|sp\.d|lc|m\.a|s\.pd\.k|s\.pd\.h|s\.pd\.b)\b\.?/gi, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);
  const namePart = words.length > 0 ? words[0] : 'penulis';
  return `penulis_${namePart}`;
};

export const PembuatSoalView: React.FC<PembuatSoalViewProps> = ({
  users = [],
  schools = [],
  subjects = [],
  questions = [],
  settings = DEFAULT_SETTINGS,
  onRefresh = () => {},
  showToast = () => {},
  onNavigate
}) => {
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'select_existing' | 'create_new'>('select_existing');
  const [selectedExistingUserId, setSelectedExistingUserId] = useState('');

  // Import Excel State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [parsedAuthors, setParsedAuthors] = useState<{
    no: number;
    fullName: string;
    nip: string;
    schoolId: string;
    schoolName: string;
    subjects: string[];
    subjectNames: string[];
    targetQuestions: number;
    username: string;
    password?: string;
    phone?: string;
    email?: string;
    isActive: boolean;
    notes?: string;
    statusBadge: 'valid' | 'warning' | 'error';
    validationMessage?: string;
  }[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [isParsingFile, setIsParsingFile] = useState(false);

  const [editingAuthor, setEditingAuthor] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [previewAuthorQuestions, setPreviewAuthorQuestions] = useState<User | null>(null);
  const [copiedUsernameId, setCopiedUsernameId] = useState<string | null>(null);

  // Form State for creating/editing author
  const [formState, setFormState] = useState<{
    fullName: string;
    nip: string;
    schoolId: string;
    username: string;
    password?: string;
    phone: string;
    email: string;
    subjects: string[];
    isActive: boolean;
  }>({
    fullName: '',
    nip: '',
    schoolId: schools?.[0]?.id || '',
    username: '',
    password: 'password123',
    phone: '',
    email: '',
    subjects: ['sub-mtk', 'sub-ipas'],
    isActive: true
  });

  // Selection & Bulk Delete state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{
    isOpen: boolean;
    author?: User;
    mode: 'single' | 'bulk';
    count?: number;
    selectedAction: 'permanent' | 'revoke';
  }>({
    isOpen: false,
    mode: 'single',
    selectedAction: 'permanent'
  });

  // Valid schools set untuk memastikan hanya pembuat soal dari sekolah yang terdaftar yang ditampilkan
  const validSchoolIds = useMemo(() => new Set((schools || []).map(s => s.id)), [schools]);
  const validSchoolNames = useMemo(() => new Set((schools || []).map(s => (s.name || '').trim().toLowerCase())), [schools]);

  // Ambil semua pengguna yang bertindak sebagai pembuat soal yang sekolahnya terdaftar:
  // - Guru/user dengan isQuestionAuthor: true ATAU username: 'pembuat_soal'
  const authors = useMemo(() => {
    return (users || []).filter(u => {
      if (!u) return false;
      const isAuthor = Boolean(u.isQuestionAuthor) || u.username === 'pembuat_soal';
      if (!isAuthor) return false;
      if (u.role === 'guru') {
        const uSchoolId = String(u.schoolId || '').trim();
        const uSchoolName = String(u.schoolName || '').trim().toLowerCase();
        const hasValidSchool = (uSchoolId && validSchoolIds.has(uSchoolId)) || (uSchoolName && validSchoolNames.has(uSchoolName));
        return hasValidSchool;
      }
      return true;
    });
  }, [users, validSchoolIds, validSchoolNames]);

  // Guru yang belum berstatus pembuat soal (untuk opsi tambah dari guru yang sudah ada di sekolah terdaftar)
  const nonAuthorTeachers = useMemo(() => {
    return (users || []).filter(u => {
      if (!u) return false;
      const isGuru = String(u.role || '').toLowerCase() === 'guru';
      const isAlreadyAuthor = Boolean(u.isQuestionAuthor) || u.username === 'pembuat_soal';
      if (!isGuru || isAlreadyAuthor) return false;
      const uSchoolId = String(u.schoolId || '').trim();
      const uSchoolName = String(u.schoolName || '').trim().toLowerCase();
      return (uSchoolId && validSchoolIds.has(uSchoolId)) || (uSchoolName && validSchoolNames.has(uSchoolName));
    });
  }, [users, validSchoolIds, validSchoolNames]);

  // Helper untuk menghitung jumlah soal yang ditulis oleh seorang pembuat soal
  const getAuthorQuestionCount = (author: User): number => {
    if (!author) return 0;
    const authorName = String(author.fullName || '').toLowerCase().trim();
    const isSpecialPembuatSoal = author.username === 'pembuat_soal';

    return (questions || []).filter(q => {
      if (!q) return false;
      const qAuthor = String(q.authorName || '').toLowerCase().trim();
      if (!qAuthor) return false;

      // Pencocokan nama langsung
      if (qAuthor === authorName) return true;
      if (isSpecialPembuatSoal && (qAuthor.includes('budi santoso') || qAuthor.includes('pembuat'))) return true;

      return false;
    }).length;
  };

  // Helper untuk mengambil butir soal yang ditulis oleh seorang pembuat soal
  const getAuthorQuestions = (author: User): Question[] => {
    if (!author) return [];
    const authorName = String(author.fullName || '').toLowerCase().trim();
    const isSpecialPembuatSoal = author.username === 'pembuat_soal';

    return (questions || []).filter(q => {
      if (!q) return false;
      const qAuthor = String(q.authorName || '').toLowerCase().trim();
      if (!qAuthor) return false;

      if (qAuthor === authorName) return true;
      if (isSpecialPembuatSoal && (qAuthor.includes('budi santoso') || qAuthor.includes('pembuat'))) return true;

      return false;
    });
  };

  // Filtered authors
  const filteredAuthors = useMemo(() => {
    const q = String(searchTerm || '').trim().toLowerCase();
    return authors.filter(author => {
      const name = String(author.fullName || '').toLowerCase();
      const nip = String(author.nip || '');
      const username = String(author.username || '').toLowerCase();
      const schoolName = String(author.schoolName || '').toLowerCase();

      const matchSearch =
        !q ||
        name.includes(q) ||
        nip.includes(q) ||
        username.includes(q) ||
        schoolName.includes(q);

      let matchSchool = schoolFilter === 'ALL';
      if (!matchSchool) {
        const targetSchool = (schools || []).find(s => s && s.id === schoolFilter);
        matchSchool =
          author.schoolId === schoolFilter ||
          (Boolean(targetSchool) && author.schoolName?.toLowerCase() === targetSchool?.name.toLowerCase());
      }

      let matchSubject = subjectFilter === 'ALL';
      if (!matchSubject) {
        matchSubject = Array.isArray(author.subjects) && author.subjects.includes(subjectFilter);
      }

      let matchStatus = true;
      if (statusFilter === 'active') matchStatus = Boolean(author.isActive);
      if (statusFilter === 'inactive') matchStatus = !author.isActive;

      return matchSearch && matchSchool && matchSubject && matchStatus;
    });
  }, [authors, schools, searchTerm, schoolFilter, subjectFilter, statusFilter]);

  // Statistik ringkasan
  const totalQuestionsByAuthors = useMemo(() => {
    return authors.reduce((sum, a) => sum + getAuthorQuestionCount(a), 0);
  }, [authors, questions]);

  const uniqueSchoolsCount = useMemo(() => {
    return new Set(authors.map(a => a.schoolId).filter(Boolean)).size;
  }, [authors]);

  // Handler: Buka modal tambah pembuat soal
  const handleOpenAddModal = () => {
    setAddMode('select_existing');
    setSelectedExistingUserId(nonAuthorTeachers[0]?.id || '');
    setFormState({
      fullName: '',
      nip: '',
      schoolId: schools?.[0]?.id || '',
      username: '',
      password: 'password123',
      phone: '',
      email: '',
      subjects: ['sub-mtk', 'sub-ipas'],
      isActive: true
    });
    setIsAddModalOpen(true);
  };

  // Handler: Tambahkan pembuat soal dari guru yang sudah ada
  const handleAssignExistingTeacher = () => {
    if (!selectedExistingUserId) {
      showToast('error', 'Pilih Guru', 'Silakan pilih guru yang akan ditugaskan sebagai pembuat naskah soal.');
      return;
    }

    const teacher = (users || []).find(u => u.id === selectedExistingUserId);
    if (!teacher) return;

    const updated: User = {
      ...teacher,
      isQuestionAuthor: true,
      isActive: true
    };

    AppStorage.saveUser(updated);
    AppStorage.logActivity(
      'Admin Kecamatan',
      'admin',
      'Penugasan Pembuat Soal',
      `Menetapkan ${teacher.fullName} (${teacher.schoolName}) sebagai Penulis Naskah Soal Kecamatan.`
    );

    setIsAddModalOpen(false);
    onRefresh();
    showToast('success', 'Penugasan Berhasil', `${teacher.fullName} kini resmi terdaftar sebagai Pembuat Soal Kecamatan.`);
  };

  // Handler: Buat pembuat soal baru
  const handleSaveNewAuthor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.fullName.trim() || !formState.username.trim()) {
      showToast('error', 'Validasi Gagal', 'Nama Lengkap dan Username login wajib diisi.');
      return;
    }

    const cleanUsername = formState.username.trim().toLowerCase();
    const isDuplicate = (users || []).some(
      u => u && u.username && u.username.toLowerCase() === cleanUsername && u.id !== editingAuthor?.id
    );

    if (isDuplicate) {
      showToast('error', 'Username Terpakai', `Username "${cleanUsername}" sudah digunakan oleh akun lain.`);
      return;
    }

    const schoolObj = (schools || []).find(s => s && s.id === formState.schoolId);

    const authorToSave: User = {
      id: editingAuthor ? editingAuthor.id : 'usr-author-' + Date.now(),
      username: cleanUsername,
      password: formState.password ? formState.password.trim() : (editingAuthor?.password || 'password123'),
      role: 'guru',
      fullName: formState.fullName.trim(),
      nip: formState.nip.trim() || undefined,
      schoolId: formState.schoolId,
      schoolName: schoolObj?.name || '',
      phone: formState.phone.trim() || undefined,
      email: formState.email.trim() || undefined,
      grade: 6,
      rombel: 'A',
      subjects: formState.subjects,
      classes: ['Kelas 6A'],
      isQuestionAuthor: true,
      isActive: formState.isActive,
      createdAt: editingAuthor?.createdAt || new Date().toISOString().slice(0, 10)
    };

    AppStorage.saveUser(authorToSave);
    AppStorage.logActivity(
      'Admin Kecamatan',
      'admin',
      editingAuthor ? 'Edit Pembuat Soal' : 'Tambah Pembuat Soal Baru',
      `Menyimpan profil pembuat soal: ${authorToSave.fullName} (${authorToSave.schoolName})`
    );

    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingAuthor(null);
    onRefresh();
    showToast(
      'success',
      editingAuthor ? 'Profil Pembuat Soal Diperbarui' : 'Pembuat Soal Baru Berhasil Didaftarkan',
      `${authorToSave.fullName} dapat langsung login menyusun soal ujian.`
    );
  };

  // Handler: Buka modal edit
  const handleOpenEdit = (author: User) => {
    setEditingAuthor(author);
    setFormState({
      fullName: author.fullName || '',
      nip: author.nip ? String(author.nip) : '',
      schoolId: author.schoolId || schools?.[0]?.id || '',
      username: author.username || '',
      password: '',
      phone: author.phone ? String(author.phone) : '',
      email: author.email ? String(author.email) : '',
      subjects: Array.isArray(author.subjects) ? author.subjects : [],
      isActive: Boolean(author.isActive)
    });
    setIsEditModalOpen(true);
  };

  // Handler: Toggle status aktif/nonaktif
  const handleToggleActive = (author: User) => {
    const updated = { ...author, isActive: !author.isActive };
    AppStorage.saveUser(updated);
    onRefresh();
    showToast(
      'success',
      'Status Akses Berubah',
      `Akses pembuat soal ${author.fullName} sekarang ${updated.isActive ? 'Aktif' : 'Nonaktif'}.`
    );
  };

  // Handler: Reset Password
  const handleResetPassword = (author: User) => {
    const updated = { ...author, password: 'password123' };
    AppStorage.saveUser(updated);
    showToast('success', 'Password Direset', `Password untuk ${author.username} telah direset menjadi: password123`);
  };

  // Handler: Seleksi Baris Tabel
  const handleToggleSelectRow = (authorId: string) => {
    setSelectedIds(prev =>
      prev.includes(authorId) ? prev.filter(id => id !== authorId) : [...prev, authorId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredAuthors.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAuthors.map(a => a.id));
    }
  };

  // Handler: Buka modal hapus pembuat soal tunggal
  const handlePromptDeleteSingle = (author: User) => {
    setDeleteTarget({
      isOpen: true,
      author,
      mode: 'single',
      selectedAction: 'permanent'
    });
  };

  // Handler: Buka modal hapus massal
  const handlePromptDeleteBulk = () => {
    if (selectedIds.length === 0) return;
    setDeleteTarget({
      isOpen: true,
      mode: 'bulk',
      count: selectedIds.length,
      selectedAction: 'permanent'
    });
  };

  // Handler Eksekusi Hapus: Permanen atau Cabut Status
  const handleExecuteDelete = () => {
    if (deleteTarget.mode === 'bulk') {
      if (selectedIds.length === 0) return;
      const count = selectedIds.length;
      AppStorage.deleteUsers(selectedIds);
      AppStorage.logActivity(
        'Admin Kecamatan',
        'admin',
        'Hapus Massal Pembuat Soal',
        `Menghapus ${count} akun pembuat soal secara permanen dari pangkalan data.`
      );
      setSelectedIds([]);
      setDeleteTarget({ isOpen: false, mode: 'single', selectedAction: 'permanent' });
      onRefresh();
      showToast(
        'success',
        'Penghapusan Massal Berhasil',
        `Sebanyak ${count} akun pembuat soal telah dihapus secara permanen dari sistem.`
      );
      return;
    }

    if (!deleteTarget.author) return;
    const author = deleteTarget.author;

    if (deleteTarget.selectedAction === 'permanent') {
      // Hapus akun pembuat soal secara PERMANEN dari sistem
      AppStorage.deleteUser(author.id);
      AppStorage.logActivity(
        'Admin Kecamatan',
        'admin',
        'Hapus Permanen Pembuat Soal',
        `Menghapus permanen akun pembuat soal: ${author.fullName} (${author.username}) dari pangkalan data sistem.`
      );
      setSelectedIds(prev => prev.filter(id => id !== author.id));
      showToast(
        'success',
        'Pembuat Soal Dihapus Permanen',
        `Akun "${author.fullName}" (${author.username}) telah berhasil dihapus secara permanen dari sistem.`
      );
    } else {
      // Hanya cabut status pembuat soal, akun guru kelas tetap dipertahankan
      const updated: User = { ...author, isQuestionAuthor: false };
      AppStorage.saveUser(updated);
      AppStorage.logActivity(
        'Admin Kecamatan',
        'admin',
        'Cabut Hak Pembuat Soal',
        `Mencabut hak penulis naskah soal untuk ${author.fullName}`
      );
      showToast(
        'success',
        'Hak Pembuat Soal Dicabut',
        `Hak penyusun soal untuk "${author.fullName}" dicabut. Akun pendidik tetap tersimpan di Data Guru.`
      );
    }

    setDeleteTarget({ isOpen: false, mode: 'single', selectedAction: 'permanent' });
    onRefresh();
  };

  // Handler: Salin username
  const handleCopyUsername = (authorId: string, username: string) => {
    navigator.clipboard.writeText(username);
    setCopiedUsernameId(authorId);
    showToast('info', 'Username Disalin', `Username "${username}" disalin ke clipboard.`);
    setTimeout(() => setCopiedUsernameId(null), 2500);
  };

  // Handler: Ekspor Excel
  const handleExport = () => {
    ExcelService.exportQuestionAuthors(filteredAuthors, schools, subjects, questions);
    showToast('success', 'Ekspor Berhasil', `Data ${filteredAuthors.length} pembuat soal berhasil diekspor.`);
  };

  // Handler: Unduh Template Excel Pembuat Soal
  const handleDownloadTemplate = () => {
    ExcelService.downloadQuestionAuthorsTemplate(schools, subjects);
    showToast('info', 'Mengunduh Template', 'Template Excel tim pembuat soal berhasil diunduh.');
  };

  // Handler: Baca dan Validasi Berkas Impor Excel
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    try {
      const rawJson = await ExcelService.parseExcelFile(file);
      if (!Array.isArray(rawJson) || rawJson.length === 0) {
        showToast('error', 'File Kosong', 'File Excel tidak memuat data pembuat soal pada sheet pertama.');
        setIsParsingFile(false);
        return;
      }

      const errors: string[] = [];
      const warnings: string[] = [];
      const seenUsernames = new Set<string>();

      const processed = rawJson.map((row, idx) => {
        const rowNum = idx + 2;
        const rawFullName = String(
          row['Nama_Lengkap'] || row['Nama Lengkap'] || row['Nama Lengkap & Gelar'] || row['Nama'] || ''
        ).trim();
        const rawNip = String(row['NIP'] || '').trim();
        const rawSchool = String(
          row['Asal_Sekolah'] || row['Asal Sekolah'] || row['Satuan Pendidikan'] || row['Sekolah'] || ''
        ).trim();
        const rawNpsn = String(row['NPSN_Sekolah'] || row['NPSN'] || '').trim();
        const rawMapel = String(
          row['Spesialis_Mapel'] || row['Spesialis Mapel'] || row['Mata Pelajaran'] || row['Mata Pelajaran Spesialisasi'] || ''
        ).trim();
        const rawTargetCount = Number(
          row['Jumlah_Soal_Target'] || row['Jumlah_Soal'] || row['Jumlah Soal'] || row['Jumlah Soal Disusun'] || 0
        );
        let rawUsername = String(row['Username'] || row['Username Akun'] || '').trim().toLowerCase();
        const rawPassword = String(row['Password'] || row['Password_Awal'] || 'password123').trim();
        const rawPhone = String(row['Nomor_WhatsApp'] || row['Nomor Kontak WA'] || row['No WA'] || row['No HP'] || '').trim();
        const rawEmail = String(row['Email'] || '').trim();
        const rawStatus = String(row['Status'] || row['Status Penugasan'] || 'Aktif').trim();
        const rawNotes = String(row['Catatan'] || '').trim();

        let statusBadge: 'valid' | 'warning' | 'error' = 'valid';
        let validationMsg = '';

        // 1. Validasi Nama Lengkap
        if (!rawFullName) {
          statusBadge = 'error';
          validationMsg = 'Nama Lengkap wajib diisi.';
          errors.push(`Baris ${rowNum}: Nama pembuat soal kosong.`);
        }

        // 2. Pencocokan Asal Satuan Pendidikan
        let matchedSchool = (schools || []).find(s => {
          if (!s) return false;
          if (rawNpsn && s.npsn === rawNpsn) return true;
          if (rawSchool && s.name.toLowerCase() === rawSchool.toLowerCase()) return true;
          if (rawSchool && s.name.toLowerCase().includes(rawSchool.toLowerCase())) return true;
          return false;
        });

        if (!matchedSchool) {
          if (schools && schools.length > 0) {
            matchedSchool = schools[0];
            if (statusBadge !== 'error') {
              statusBadge = 'warning';
              validationMsg = `Sekolah "${rawSchool || '-'}" tidak cocok. Dialihkan ke "${schools[0].name}".`;
              warnings.push(`Baris ${rowNum}: Sekolah "${rawSchool}" dialihkan ke ${schools[0].name}`);
            }
          } else {
            statusBadge = 'error';
            validationMsg = 'Tidak ada daftar sekolah yang aktif di sistem.';
            errors.push(`Baris ${rowNum}: Sekolah tidak valid.`);
          }
        }

        // 3. Pencocokan Spesialisasi Mapel
        const resolvedSubjectIds: string[] = [];
        const resolvedSubjectNames: string[] = [];

        if (rawMapel) {
          const mapelTokens = rawMapel.split(/[,;/+]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
          mapelTokens.forEach(token => {
            const foundSub = (subjects || []).find(sub => {
              if (!sub) return false;
              if (sub.code.toLowerCase() === token) return true;
              if (sub.name.toLowerCase() === token) return true;
              if (sub.name.toLowerCase().includes(token) || token.includes(sub.code.toLowerCase())) return true;
              return false;
            });
            if (foundSub && !resolvedSubjectIds.includes(foundSub.id)) {
              resolvedSubjectIds.push(foundSub.id);
              resolvedSubjectNames.push(foundSub.name);
            }
          });
        }

        // Default jika mapel kosong atau tidak cocok
        if (resolvedSubjectIds.length === 0) {
          if (subjects && subjects.length > 0) {
            resolvedSubjectIds.push(subjects[0].id);
            resolvedSubjectNames.push(subjects[0].name);
            if (subjects[1]) {
              resolvedSubjectIds.push(subjects[1].id);
              resolvedSubjectNames.push(subjects[1].name);
            }
          }
        }

        // 4. Resolusi Username
        if (!rawUsername) {
          rawUsername = formatAuthorUsername(rawFullName);
        }

        if (seenUsernames.has(rawUsername)) {
          const suffix = Math.floor(Math.random() * 89 + 10);
          rawUsername = `${rawUsername}_${suffix}`;
          if (statusBadge !== 'error') {
            statusBadge = 'warning';
            validationMsg = validationMsg ? `${validationMsg} Username disesuaikan: ${rawUsername}` : `Username disesuaikan: ${rawUsername}`;
          }
        }
        seenUsernames.add(rawUsername);

        // Cek apakah username sudah ada di pengguna sistem
        const existsInSystem = (users || []).some(
          u => u && u.username && u.username.toLowerCase() === rawUsername
        );
        if (existsInSystem) {
          const suffix = Math.floor(Math.random() * 89 + 10);
          rawUsername = `${rawUsername}_${suffix}`;
          if (statusBadge !== 'error') {
            statusBadge = 'warning';
            validationMsg = validationMsg ? `${validationMsg} Username sistem kembar, dialihkan ke: ${rawUsername}` : `Username sistem kembar, dialihkan ke: ${rawUsername}`;
          }
        }

        // 5. Resolusi Status
        const isActive = !(
          rawStatus.toLowerCase().includes('non') ||
          rawStatus.toLowerCase().includes('tidak') ||
          rawStatus.toLowerCase().includes('pasif') ||
          rawStatus.toLowerCase() === 'false' ||
          rawStatus.toLowerCase() === '0'
        );

        return {
          no: idx + 1,
          fullName: rawFullName,
          nip: rawNip !== '-' ? rawNip : '',
          schoolId: matchedSchool?.id || '',
          schoolName: matchedSchool?.name || rawSchool,
          subjects: resolvedSubjectIds,
          subjectNames: resolvedSubjectNames,
          targetQuestions: isNaN(rawTargetCount) ? 0 : rawTargetCount,
          username: rawUsername,
          password: rawPassword || 'password123',
          phone: rawPhone !== '-' ? rawPhone : '',
          email: rawEmail !== '-' ? rawEmail : '',
          isActive,
          notes: rawNotes,
          statusBadge,
          validationMessage: validationMsg
        };
      });

      setImportRows(rawJson);
      setParsedAuthors(processed);
      setImportErrors(errors);
      setImportWarnings(warnings);
      showToast('info', 'File Terbaca', `Ditemukan ${processed.length} baris data pembuat naskah soal.`);
    } catch (err: any) {
      showToast('error', 'Gagal Membaca File', err.message || 'Format file Excel tidak dapat dibaca.');
    } finally {
      setIsParsingFile(false);
    }
  };

  // Handler: Simpan Hasil Impor ke Pangkalan Data
  const handleSaveImport = () => {
    if (parsedAuthors.length === 0) return;

    const validItems = parsedAuthors.filter(p => p.statusBadge !== 'error');
    if (validItems.length === 0) {
      showToast('error', 'Tidak Ada Data Valid', 'Silakan periksa kembali file Excel Anda, tidak ada baris data yang valid.');
      return;
    }

    let successCount = 0;
    validItems.forEach((item, i) => {
      const newAuthor: User = {
        id: 'usr-author-' + Date.now() + '-' + i + '-' + Math.random().toString(36).substring(2, 6),
        username: item.username,
        password: item.password || 'password123',
        role: 'guru',
        fullName: item.fullName,
        nip: item.nip || undefined,
        schoolId: item.schoolId,
        schoolName: item.schoolName,
        phone: item.phone || undefined,
        email: item.email || undefined,
        grade: 6,
        rombel: 'A',
        subjects: item.subjects,
        classes: ['Kelas 6A'],
        isQuestionAuthor: true,
        isActive: item.isActive,
        createdAt: new Date().toISOString().slice(0, 10)
      };

      AppStorage.saveUser(newAuthor);
      successCount++;
    });

    AppStorage.logActivity(
      'Admin Kecamatan',
      'admin',
      'Impor Excel Pembuat Soal',
      `Berhasil mengimpor ${successCount} akun tim pembuat & penulis naskah soal dari file Excel.`
    );

    setIsImportModalOpen(false);
    setImportRows([]);
    setParsedAuthors([]);
    setImportErrors([]);
    setImportWarnings([]);
    onRefresh();

    showToast(
      'success',
      'Impor Excel Berhasil',
      `Sebanyak ${successCount} data pembuat & penulis naskah soal berhasil disimpan dan aktif di pangkalan data.`
    );
  };

  const districtName = settings?.districtName || 'Kecamatan Ampelgading';

  return (
    <div className="space-y-6 font-geist">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Tim Pembuat & Penulis Naskah Soal
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar tenaga pendidik dan penyusun butir soal asesmen tingkat {districtName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('admin-preview-soal')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Lihat simulasi CBT tampilan siswa dan naskah cetak"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Soal CBT</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Data Tim</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setImportRows([]);
              setParsedAuthors([]);
              setImportErrors([]);
              setImportWarnings([]);
              setIsImportModalOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor Excel</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pembuat Soal</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Pembuat Soal</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <PenTool className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{authors.length}</span>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {authors.filter(a => a.isActive).length} Aktif
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Penulis naskah se-{districtName}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Soal Disusun</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileQuestion className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">{totalQuestionsByAuthors}</span>
            <span className="text-xs text-slate-400">Butir di Bank Soal</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">4 tipe soal ujian CBT</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Satuan Pendidikan Asal</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <SchoolIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{uniqueSchoolsCount}</span>
            <span className="text-xs text-slate-400">dari {(schools || []).length} SD</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sekolah yang menugaskan tim</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Portal Login Khusus</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-lg">
              pembuat_soal
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Password: <code>password123</code></p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Penulis, NIP, Username, Sekolah..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition"
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
          {/* Mapel Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 shrink-0 font-medium">Mapel:</span>
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              aria-label="Filter mata pelajaran penulis"
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">Semua Mapel</option>
              {(subjects || []).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* School Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 shrink-0 font-medium">Sekolah:</span>
            <select
              value={schoolFilter}
              onChange={e => setSchoolFilter(e.target.value)}
              aria-label="Filter sekolah penulis"
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500 max-w-xs truncate cursor-pointer"
            >
              <option value="ALL">Semua Sekolah ({(schools || []).length} SD)</option>
              {(schools || []).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 shrink-0 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              aria-label="Filter status penulis"
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-rose-900 font-medium text-xs">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
            <span><strong>{selectedIds.length}</strong> akun pembuat soal terpilih</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={handlePromptDeleteBulk}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Permanen Terpilih ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Mobile Swipe Hint */}
        <div className="px-3.5 py-2 bg-amber-50/70 border-b border-amber-100 text-[11px] text-amber-950 flex items-center justify-between sm:hidden">
          <span className="font-medium text-[10px] flex items-center gap-1">
            <span>👉</span> Geser tabel ke kanan untuk melihat akun & aksi
          </span>
          <span className="font-bold text-[10px] font-mono text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200">
            {filteredAuthors.length} Penulis
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredAuthors.length > 0 && selectedIds.length === filteredAuthors.length}
                    onChange={handleToggleSelectAll}
                    aria-label="Pilih semua pembuat soal"
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-3 w-10 text-center">No</th>
                <th className="py-3.5 px-4">Nama Lengkap & NIP</th>
                <th className="py-3.5 px-4">Asal Satuan Pendidikan</th>
                <th className="py-3.5 px-4">Spesialisasi Mapel</th>
                <th className="py-3.5 px-4 text-center">Soal yang Disusun</th>
                <th className="py-3.5 px-4">Username Login</th>
                <th className="py-3.5 px-4 text-center">Status Hak Akses</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAuthors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-3">
                      <PenTool className="w-10 h-10 text-slate-300 mx-auto" />
                      <div>
                        <p className="font-semibold text-slate-700 text-sm">Tidak ada data pembuat soal yang cocok.</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {searchTerm || schoolFilter !== 'ALL' || subjectFilter !== 'ALL' || statusFilter !== 'ALL'
                            ? 'Coba ubah kata kunci pencarian atau reset filter di atas.'
                            : 'Belum ada guru yang ditugaskan sebagai pembuat soal ujian kecamatan.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tugaskan Pembuat Soal Sekarang</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAuthors.map((author, index) => {
                  const school = (schools || []).find(s => s && s.id === author.schoolId);
                  const qCount = getAuthorQuestionCount(author);
                  const subBadges = (author.subjects || [])
                    .map(subId => (subjects || []).find(s => s && s.id === subId))
                    .filter(Boolean);

                  return (
                    <tr
                      key={author.id}
                      className={`hover:bg-slate-50/70 transition duration-150 ${
                        selectedIds.includes(author.id) ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(author.id)}
                          onChange={() => handleToggleSelectRow(author.id)}
                          aria-label={`Pilih ${author.fullName}`}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                        />
                      </td>

                      {/* Number */}
                      <td className="py-3 px-3 text-center text-slate-400 font-semibold">{index + 1}</td>

                      {/* Name & NIP */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{author.fullName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            Penyusun Soal
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <span>NIP: {author.nip || '-'}</span>
                          {author.phone && (
                            <>
                              <span>•</span>
                              <span>WA: {author.phone}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* School */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <SchoolIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{school ? school.name : author.schoolName || 'SD Belum Ditentukan'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          NPSN: {school?.npsn || '-'} • {school?.village || 'Ampelgading'}
                        </div>
                      </td>

                      {/* Subjects */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {subBadges.length > 0 ? (
                            subBadges.map(sub => (
                              <span
                                key={sub?.id}
                                className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-semibold"
                              >
                                {sub?.code} - {sub?.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400">Seluruh Mata Pelajaran</span>
                          )}
                        </div>
                      </td>

                      {/* Question Count (Clickable preview) */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setPreviewAuthorQuestions(author)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold text-xs border transition cursor-pointer shadow-2xs ${
                            qCount > 0
                              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                          }`}
                          title="Klik untuk melihat rincian butir soal yang telah disusun"
                        >
                          <FileQuestion className="w-3.5 h-3.5 text-amber-600" />
                          <span>{qCount} Soal</span>
                          <Eye className="w-3 h-3 text-amber-500 ml-0.5" />
                        </button>
                      </td>

                      {/* Username Login */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 font-mono font-bold text-blue-900 text-xs">
                            {author.username}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyUsername(author.id, author.username)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded-md transition cursor-pointer"
                            title="Salin Username"
                          >
                            {copiedUsernameId === author.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(author)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer shadow-2xs ${
                            author.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                          title={`Klik untuk mengubah status menjadi ${author.isActive ? 'Nonaktif' : 'Aktif'}`}
                        >
                          {author.isActive ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          <span>{author.isActive ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewAuthorQuestions(author)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="Pratinjau Butir Soal"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetPassword(author)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Reset Password ke password123"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(author)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="Edit Data Pembuat Soal"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePromptDeleteSingle(author)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus Permanen Pembuat Soal"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
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

      {/* 5. MODAL TAMBAH PEMBUAT SOAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Penugasan Pembuat Soal Kecamatan"
        subtitle="Tetapkan guru dari satuan pendidikan atau daftarkan tim penyusun naskah soal asesmen baru"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setAddMode('select_existing')}
              className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                addMode === 'select_existing'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Pilih Dari Guru Terdaftar ({nonAuthorTeachers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setAddMode('create_new')}
              className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                addMode === 'create_new'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Daftarkan Penulis Baru</span>
            </button>
          </div>

          {/* Opsi A: Pilih Guru yang Sudah Ada */}
          {addMode === 'select_existing' ? (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                <p className="font-semibold text-amber-900">
                  Tetapkan Hak Penulis Naskah Soal kepada Guru yang Ada:
                </p>
                <p className="text-[11px] text-amber-800/80 mt-0.5">
                  Guru yang dipilih akan langsung mendapatkan hak akses untuk menyusun, mengedit, dan mengimpor butir soal ke Bank Soal CBT Kecamatan.
                </p>
              </div>

              {nonAuthorTeachers.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-semibold text-slate-700">Semua guru sudah terdaftar sebagai pembuat soal.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Silakan gunakan opsi "Daftarkan Penulis Baru" untuk menambahkan penulis dari luar.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Pilih Guru SD *
                    </label>
                    <select
                      value={selectedExistingUserId}
                      onChange={e => setSelectedExistingUserId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      {nonAuthorTeachers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({t.schoolName} - NIP: {t.nip || '-'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleAssignExistingTeacher}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Berikan Hak Pembuat Soal</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Opsi B: Buat Penulis Soal Baru */
            <form onSubmit={handleSaveNewAuthor} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Lengkap & Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.fullName}
                    onChange={e => setFormState({ ...formState, fullName: e.target.value })}
                    placeholder="Contoh: Budi Santoso, S.Pd."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-amber-500 font-medium"
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
                    placeholder="19820415 200801 1 015"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Satuan Pendidikan Asal *
                </label>
                <select
                  value={formState.schoolId}
                  onChange={e => setFormState({ ...formState, schoolId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  {(schools || []).map(s => (
                    <option key={s.id} value={s.id}>{s.name} (NPSN: {s.npsn})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.username}
                    onChange={e => setFormState({ ...formState, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="Contoh: pembuat_budi atau guru_budi"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs bg-white font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Password Akun *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.password}
                    onChange={e => setFormState({ ...formState, password: e.target.value })}
                    placeholder="password123"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Mapel Keahlian */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Spesialisasi Mata Pelajaran Penulis *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(subjects || []).map(sub => {
                    const checked = formState.subjects.includes(sub.id);
                    return (
                      <label
                        key={sub.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                          checked ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold' : 'bg-white border-slate-200 hover:bg-slate-50'
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
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="truncate">{sub.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Daftarkan Pembuat Soal</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* 6. MODAL EDIT PEMBUAT SOAL */}
      {editingAuthor && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingAuthor(null);
          }}
          title={`Edit Profil Pembuat Soal - ${editingAuthor.fullName}`}
          subtitle="Sesuaikan spesialisasi mata pelajaran, penugasan sekolah, dan kredensial login"
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveNewAuthor} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={formState.fullName}
                  onChange={e => setFormState({ ...formState, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  NIP
                </label>
                <input
                  type="text"
                  value={formState.nip}
                  onChange={e => setFormState({ ...formState, nip: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Satuan Pendidikan Asal *
              </label>
              <select
                value={formState.schoolId}
                onChange={e => setFormState({ ...formState, schoolId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                {(schools || []).map(s => (
                  <option key={s.id} value={s.id}>{s.name} (NPSN: {s.npsn})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Username Login *
                </label>
                <input
                  type="text"
                  required
                  value={formState.username}
                  onChange={e => setFormState({ ...formState, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs bg-white font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ganti Password (Opsional)
                </label>
                <input
                  type="text"
                  value={formState.password || ''}
                  onChange={e => setFormState({ ...formState, password: e.target.value })}
                  placeholder="Kosongkan jika tidak diubah"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Mapel Keahlian */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Spesialisasi Mata Pelajaran Penulis
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(subjects || []).map(sub => {
                  const checked = formState.subjects.includes(sub.id);
                  return (
                    <label
                      key={sub.id}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                        checked ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold' : 'bg-white border-slate-200 hover:bg-slate-50'
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
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="truncate">{sub.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingAuthor(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 7. MODAL PRATINJAU SOAL-SOAL YANG DISUSUN */}
      {previewAuthorQuestions && (
        <Modal
          isOpen={Boolean(previewAuthorQuestions)}
          onClose={() => setPreviewAuthorQuestions(null)}
          title={`Koleksi Butir Soal - ${previewAuthorQuestions.fullName}`}
          subtitle={`Penulis Naskah Soal • ${previewAuthorQuestions.schoolName || 'Kecamatan Ampelgading'}`}
          maxWidth="4xl"
        >
          <div className="space-y-4 text-xs">
            {/* Header Info */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-amber-950 text-sm">{previewAuthorQuestions.fullName}</p>
                <p className="text-slate-600 text-xs">
                  {previewAuthorQuestions.schoolName} • Username: <code className="font-bold text-blue-700">{previewAuthorQuestions.username}</code>
                </p>
              </div>
              <div className="px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-center shadow-2xs">
                <span className="block text-[10px] text-slate-500">Soal Disusun</span>
                <span className="block text-base font-extrabold text-amber-800">
                  {getAuthorQuestionCount(previewAuthorQuestions)} Butir
                </span>
              </div>
            </div>

            {/* List of Questions */}
            <div className="max-h-96 overflow-y-auto space-y-3">
              {getAuthorQuestions(previewAuthorQuestions).length === 0 ? (
                <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  <FileQuestion className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-700">Belum ada butir soal di Bank Soal yang tercatat atas nama penulis ini.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Penulis dapat membuat soal baru melalui menu <em>Bank Soal</em> atau menu <em>Buat & Edit Soal</em>.
                  </p>
                </div>
              ) : (
                getAuthorQuestions(previewAuthorQuestions).map((q, idx) => {
                  const subObj = (subjects || []).find(s => s && s.id === q.subjectId);
                  let typeLabel = 'Pilihan Ganda Biasa';
                  if (q.type === 'complex_mcq') typeLabel = 'Pilihan Ganda Kompleks';
                  else if (q.type === 'matching') typeLabel = 'Menjodohkan';
                  else if (q.type === 'true_false') typeLabel = 'Benar / Salah';

                  return (
                    <div key={q.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-amber-300 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-bold font-mono text-[10px]">
                            #{idx + 1}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold">
                            {subObj?.name || 'Mata Pelajaran'} • Kelas {q.grade}
                          </span>
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded text-[10px] font-semibold">
                            {typeLabel}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-emerald-700">
                          {q.points} Poin
                        </span>
                      </div>

                      <p className="font-medium text-slate-800 text-xs leading-relaxed">
                        {q.questionText}
                      </p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Indikator: {q.indicator || '-'}</span>
                        <span>Tingkat: <strong className="capitalize text-slate-600">{q.difficulty}</strong></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewAuthorQuestions(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 8. MODAL KONFIRMASI HAPUS PEMBUAT SOAL (PERMANEN / CABUT STATUS) */}
      <Modal
        isOpen={deleteTarget.isOpen}
        onClose={() => setDeleteTarget(prev => ({ ...prev, isOpen: false }))}
        title={deleteTarget.mode === 'bulk' ? 'Hapus Permanen Pembuat Soal Terpilih' : 'Hapus Pembuat Soal Secara Permanen'}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {deleteTarget.mode === 'bulk' ? (
            <div className="space-y-3">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-rose-900">
                  <p className="font-bold text-sm text-rose-950">
                    Konfirmasi Hapus {deleteTarget.count} Akun Pembuat Soal
                  </p>
                  <p>
                    Apakah Anda yakin ingin menghapus <strong>{deleteTarget.count}</strong> akun pembuat soal yang dipilih secara <strong>PERMANEN</strong>?
                  </p>
                  <p className="text-rose-700 font-medium">
                    Semua akun yang dipilih akan dihapus total dari pangkalan data sistem CBT dan tidak dapat dipulihkan.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    {deleteTarget.author?.fullName}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] font-mono">
                    {deleteTarget.author?.username}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Sekolah: <strong>{deleteTarget.author?.schoolName || '-'}</strong></span>
                  <span>NIP: <strong>{deleteTarget.author?.nip || '-'}</strong></span>
                  <span>
                    Soal Disusun: <strong>{deleteTarget.author ? getAuthorQuestionCount(deleteTarget.author) : 0} Butir</strong>
                  </span>
                </div>
              </div>

              {/* Pilihan Aksi: Hapus Permanen vs Cabut Hak */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Pilih Tindakan Penghapusan:
                </label>
                
                <div className="space-y-2">
                  <label
                    onClick={() => setDeleteTarget(prev => ({ ...prev, selectedAction: 'permanent' }))}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      deleteTarget.selectedAction === 'permanent'
                        ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deleteAuthorAction"
                      checked={deleteTarget.selectedAction === 'permanent'}
                      onChange={() => setDeleteTarget(prev => ({ ...prev, selectedAction: 'permanent' }))}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-rose-950 flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Hapus Permanen Akun dari Sistem</span>
                      </p>
                      <p className="text-slate-500 mt-0.5 leading-relaxed">
                        Akun pembuat soal ini akan <strong>dihapus total secara permanen</strong> dari pangkalan data sistem CBT. Pengguna tidak akan dapat login kembali.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setDeleteTarget(prev => ({ ...prev, selectedAction: 'revoke' }))}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      deleteTarget.selectedAction === 'revoke'
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deleteAuthorAction"
                      checked={deleteTarget.selectedAction === 'revoke'}
                      onChange={() => setDeleteTarget(prev => ({ ...prev, selectedAction: 'revoke' }))}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-amber-950 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Hanya Cabut Status Pembuat Soal</span>
                      </p>
                      <p className="text-slate-500 mt-0.5 leading-relaxed">
                        Hanya mencabut status penugasan pembuat soal. Akun pendidik tetap tersimpan di Data Guru untuk keperluan mengajar.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {deleteTarget.selectedAction === 'permanent' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    Peringatan: Penghapusan permanen <strong>tidak dapat dibatalkan</strong>. Soal yang telah disusun tetap tersimpan di bank soal.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setDeleteTarget(prev => ({ ...prev, isOpen: false }))}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteDelete}
              className={`inline-flex items-center gap-2 px-4 py-2 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer ${
                deleteTarget.selectedAction === 'permanent' || deleteTarget.mode === 'bulk'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {deleteTarget.mode === 'bulk'
                  ? `Hapus Permanen ${deleteTarget.count} Akun`
                  : deleteTarget.selectedAction === 'permanent'
                  ? 'Ya, Hapus Permanen'
                  : 'Cabut Hak Pembuat Soal'}
              </span>
            </button>
          </div>
        </div>
      </Modal>

      {/* 9. MODAL IMPOR EXCEL TIM PEMBUAT & PENULIS NASKAH SOAL */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportRows([]);
          setParsedAuthors([]);
          setImportErrors([]);
          setImportWarnings([]);
        }}
        title="Impor Tim Pembuat & Penulis Naskah Soal dari Excel"
        maxWidth="4xl"
      >
        <div className="space-y-5">
          {/* Petunjuk Penggunaan & Download Template */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl shrink-0 mt-0.5">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-blue-955">
                  Panduan Impor Format Excel (.xlsx)
                </h4>
                <p className="text-xs text-blue-800 leading-relaxed max-w-xl">
                  Pastikan berkas Excel memuat kolom: <strong>No</strong>, <strong>Nama Lengkap</strong>, <strong>NIP</strong>, <strong>Asal Sekolah</strong>, <strong>Spesialis Mapel</strong>, <strong>Jumlah Soal</strong>, <strong>Username</strong>, <strong>Password</strong>, <strong>WhatsApp</strong>, dan <strong>Status</strong>.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    onNavigate('admin-spreadsheet-sync');
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shrink-0 shadow-2xs transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Tarik dari Google Sheets</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 font-bold text-xs rounded-xl flex items-center gap-2 shrink-0 shadow-2xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template Excel</span>
              </button>
            </div>
          </div>

          {/* Area Upload File */}
          <div className="p-5 border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-2xl text-center transition">
            <input
              type="file"
              id="file-upload-authors"
              accept=".xlsx, .xls, .csv"
              onChange={handleImportFileChange}
              className="hidden"
            />
            <label
              htmlFor="file-upload-authors"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="p-3 bg-white text-blue-600 rounded-full shadow-2xs border border-slate-200">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                {isParsingFile ? 'Sedang membaca berkas...' : 'Klik di sini untuk memilih berkas Excel (.xlsx / .xls)'}
              </span>
              <span className="text-[11px] text-slate-400">
                Sistem akan memvalidasi nama guru, asal satuan pendidikan, mapel, dan username secara otomatis
              </span>
            </label>
          </div>

          {/* Pesan Kesalahan Validasi Global */}
          {importErrors.length > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Ditemukan {importErrors.length} Kesalahan Format:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5 max-h-24 overflow-y-auto pl-1">
                {importErrors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {importErrors.length > 5 && (
                  <li className="italic">...dan {importErrors.length - 5} baris lainnya</li>
                )}
              </ul>
            </div>
          )}

          {/* Pratinjau Tabel Baris Data */}
          {parsedAuthors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span>Pratinjau Hasil Pembacaan</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                    Total {parsedAuthors.length} Baris
                  </span>
                </h4>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    {parsedAuthors.filter(p => p.statusBadge === 'valid').length} Siap
                  </span>
                  {parsedAuthors.filter(p => p.statusBadge === 'warning').length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                      {parsedAuthors.filter(p => p.statusBadge === 'warning').length} Disesuaikan
                    </span>
                  )}
                  {parsedAuthors.filter(p => p.statusBadge === 'error').length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold">
                      {parsedAuthors.filter(p => p.statusBadge === 'error').length} Gagal
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-8">No</th>
                      <th className="py-2.5 px-3">Nama & NIP</th>
                      <th className="py-2.5 px-3">Asal Sekolah</th>
                      <th className="py-2.5 px-3">Spesialis Mapel</th>
                      <th className="py-2.5 px-3 text-center">Jml Soal</th>
                      <th className="py-2.5 px-3">Username Login</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedAuthors.map((item, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50 transition ${
                          item.statusBadge === 'error'
                            ? 'bg-rose-50/40'
                            : item.statusBadge === 'warning'
                            ? 'bg-amber-50/30'
                            : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-center text-slate-400 font-semibold">{item.no}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">{item.fullName || '-'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">NIP: {item.nip || '-'}</div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <SchoolIcon className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.schoolName}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {item.subjectNames.slice(0, 2).map((sName, sIdx) => (
                              <span key={sIdx} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium text-[9px]">
                                {sName}
                              </span>
                            ))}
                            {item.subjectNames.length > 2 && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px]">
                                +{item.subjectNames.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-amber-900">
                          {item.targetQuestions}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[11px] font-bold text-blue-900">
                            {item.username}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {item.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {item.statusBadge === 'valid' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Valid</span>
                            </span>
                          )}
                          {item.statusBadge === 'warning' && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full text-[10px] font-bold"
                              title={item.validationMessage}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>Disesuaikan</span>
                            </span>
                          )}
                          {item.statusBadge === 'error' && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold"
                              title={item.validationMessage}
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Error</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              {parsedAuthors.length > 0
                ? `${parsedAuthors.filter(p => p.statusBadge !== 'error').length} dari ${parsedAuthors.length} akun siap disimpan`
                : 'Silakan pilih file Excel terlebih dahulu'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportRows([]);
                  setParsedAuthors([]);
                  setImportErrors([]);
                  setImportWarnings([]);
                }}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveImport}
                disabled={parsedAuthors.filter(p => p.statusBadge !== 'error').length === 0}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer ${
                  parsedAuthors.filter(p => p.statusBadge !== 'error').length > 0
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                    : 'bg-slate-300 cursor-not-allowed opacity-60'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  Simpan & Daftarkan (
                  {parsedAuthors.filter(p => p.statusBadge !== 'error').length} Pembuat Soal)
                </span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
};
