import {
  School,
  User,
  Subject,
  ClassItem,
  Question,
  ExamPackage,
  StudentExamSession,
  ActivityLog,
  SystemSettings
} from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'ampelgading_cbt_settings',
  SCHOOLS: 'ampelgading_cbt_schools',
  USERS: 'ampelgading_cbt_users',
  SUBJECTS: 'ampelgading_cbt_subjects',
  CLASSES: 'ampelgading_cbt_classes',
  QUESTIONS: 'ampelgading_cbt_questions',
  EXAM_PACKAGES: 'ampelgading_cbt_exam_packages',
  EXAM_SESSIONS: 'ampelgading_cbt_exam_sessions',
  ACTIVITY_LOGS: 'ampelgading_cbt_activity_logs',
  CURRENT_USER: 'ampelgading_cbt_current_user',
  DELETED_USER_IDS: 'ampelgading_cbt_deleted_user_ids',
  SEEDED: 'ampelgading_cbt_seeded_v1'
};

export const DEFAULT_SETTINGS: SystemSettings = {
  districtName: 'Kecamatan Ampelgading',
  regencyName: 'Kabupaten Malang',
  provinceName: 'Jawa Timur',
  academicYear: '2026/2027',
  activeSemester: 'Ganjil',
  defaultKkm: 75,
  korwilHeadName: 'Drs. H. Ahmad Fauzi, M.Pd.',
  korwilHeadNip: '19680712 199303 1 004',
  appTitle: 'SISTEM UJIAN SEMESTER TINGKAT KECAMATAN',
  phone: '(0341) 851234',
  email: 'korwil.pendidikan@ampelgading.malangkab.go.id',
  address: 'Jl. Raya Tirtomoyo No. 45, Kecamatan Ampelgading, Kabupaten Malang'
};

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-mtk', code: 'MTK', name: 'Matematika', iconName: 'Calculator' },
  { id: 'sub-ipas', code: 'IPAS', name: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', iconName: 'FlaskConical' },
  { id: 'sub-bind', code: 'BIND', name: 'Bahasa Indonesia', iconName: 'BookOpen' },
  { id: 'sub-ppkn', code: 'PPKN', name: 'Pendidikan Pancasila', iconName: 'ShieldCheck' },
  { id: 'sub-bing', code: 'BING', name: 'Bahasa Inggris', iconName: 'Languages' },
  { id: 'sub-pai', code: 'PAI', name: 'Pendidikan Agama Islam', iconName: 'Moon', religion: 'Islam' },
  { id: 'sub-pak', code: 'PAK', name: 'Pendidikan Agama Kristen', iconName: 'Cross', religion: 'Kristen' },
  { id: 'sub-pakt', code: 'PAKT', name: 'Pendidikan Agama Katolik', iconName: 'Church', religion: 'Katolik' },
  { id: 'sub-pah', code: 'PAH', name: 'Pendidikan Agama Hindu', iconName: 'Sun', religion: 'Hindu' },
  { id: 'sub-pab', code: 'PAB', name: 'Pendidikan Agama Buddha', iconName: 'Flame', religion: 'Buddha' },
  { id: 'sub-pjok', code: 'PJOK', name: 'PJOK', iconName: 'Activity' },
  { id: 'sub-sbdp', code: 'SBDP', name: 'Seni Budaya dan Prakarya', iconName: 'Palette' },
];

export const DEFAULT_CLASSES: ClassItem[] = [
  { id: 'cls-4a', grade: 4, rombel: 'A', name: 'Kelas 4A' },
  { id: 'cls-4b', grade: 4, rombel: 'B', name: 'Kelas 4B' },
  { id: 'cls-5a', grade: 5, rombel: 'A', name: 'Kelas 5A' },
  { id: 'cls-5b', grade: 5, rombel: 'B', name: 'Kelas 5B' },
  { id: 'cls-6a', grade: 6, rombel: 'A', name: 'Kelas 6A' },
  { id: 'cls-6b', grade: 6, rombel: 'B', name: 'Kelas 6B' },
  { id: 'cls-6c', grade: 6, rombel: 'C', name: 'Kelas 6C' },
];

export const DEFAULT_SCHOOLS: School[] = [
  {
    id: 'sch-01',
    npsn: '20214501',
    name: 'SD Negeri 1 Ampelgading',
    status: 'Negeri',
    address: 'Jl. Raya Tirtomoyo No. 12, Ampelgading',
    village: 'Tirtomoyo',
    district: 'Kecamatan Ampelgading',
    principalName: 'Dra. Hj. Sri Wahyuni, M.Pd.',
    principalNip: '19710315 199602 2 001',
    operatorName: 'Rian Pratama, S.Kom.',
    phone: '0812-3456-7890',
    email: 'sdn1ampelgading@gmail.com',
    isActive: true,
    studentCount: 185,
    teacherCount: 12
  },
  {
    id: 'sch-02',
    npsn: '20214502',
    name: 'SD Negeri 2 Ampelgading',
    status: 'Negeri',
    address: 'Jl. Raya Lebakharjo No. 45, Ampelgading',
    village: 'Lebakharjo',
    district: 'Kecamatan Ampelgading',
    principalName: 'H. Dedi Mulyadi, S.Pd., M.M.',
    principalNip: '19690520 199412 1 002',
    operatorName: 'Anita Dewi, S.Pd.',
    phone: '0813-9876-5432',
    email: 'sdn2ampelgading@sekolah.id',
    isActive: true,
    studentCount: 160,
    teacherCount: 10
  },
  {
    id: 'sch-03',
    npsn: '20214503',
    name: 'SD Negeri 3 Wirotaman',
    status: 'Negeri',
    address: 'Jl. Wirotaman No. 08, Wirotaman',
    village: 'Wirotaman',
    district: 'Kecamatan Ampelgading',
    principalName: 'Endang Suherman, S.Pd.',
    principalNip: '19740810 199803 1 003',
    operatorName: 'Fajar Nugraha',
    phone: '0857-1122-3344',
    email: 'sdn3wirotaman@gmail.com',
    isActive: true,
    studentCount: 142,
    teacherCount: 9
  },
  {
    id: 'sch-04',
    npsn: '20214504',
    name: 'SDIT Insan Cendekia Ampelgading',
    status: 'Swasta',
    address: 'Komplek Islamic Center No. 01, Ampelgading',
    village: 'Tirtomoyo',
    district: 'Kecamatan Ampelgading',
    principalName: 'Ust. Ridwan Kamil, Lc., M.A.',
    principalNip: '-',
    operatorName: 'M. Wildan Firdaus',
    phone: '0821-4455-6677',
    email: 'sdit.insancendekia@gmail.com',
    isActive: true,
    studentCount: 210,
    teacherCount: 14
  }
];

// Sample Educational SVG Illustrations for Questions
export const SVG_FRACTION_CIRCLE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23f1f5f9" stroke="%23334155" stroke-width="2"/><path d="M50 50 L50 5 A45 45 0 0 1 95 50 Z" fill="%233b82f6"/><path d="M50 50 L95 50 A45 45 0 0 1 50 95 Z" fill="%233b82f6"/><path d="M50 50 L50 95 A45 45 0 0 1 5 50 Z" fill="%2393c5fd"/><path d="M50 50 L5 50 A45 45 0 0 1 50 5 Z" fill="%23f8fafc"/><line x1="5" y1="50" x2="95" y2="50" stroke="%231e293b" stroke-width="2"/><line x1="50" y1="5" x2="50" y2="95" stroke="%231e293b" stroke-width="2"/></svg>`;

export const SVG_WATER_CYCLE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" fill="%23f0f9ff" rx="8"/><path d="M0 130 Q75 120 150 130 T300 130 L300 180 L0 180 Z" fill="%2338bdf8"/><path d="M40 50 Q55 35 75 45 Q90 30 110 45 Q125 55 115 70 Q70 75 40 50 Z" fill="%23e2e8f0" stroke="%2394a3b8"/><path d="M180 40 Q195 25 215 35 Q230 20 250 35 Q265 45 255 60 Q210 65 180 40 Z" fill="%23cbd5e1" stroke="%2364748b"/><text x="45" y="110" font-family="sans-serif" font-size="11" fill="%230284c7" font-weight="bold">Evaporasi (A)</text><text x="180" y="85" font-family="sans-serif" font-size="11" fill="%23475569" font-weight="bold">Kondensasi (B)</text><text x="195" y="150" font-family="sans-serif" font-size="11" fill="%230369a1" font-weight="bold">Presipitasi (C)</text><circle cx="270" cy="30" r="18" fill="%23f59e0b"/></svg>`;

export const SVG_LEAF_PHOTOSYNTHESIS = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" fill="%23f0fdf4" rx="8"/><path d="M50 150 Q150 20 250 150 Q150 120 50 150 Z" fill="%2322c55e" stroke="%2315803d" stroke-width="2"/><line x1="50" y1="150" x2="200" y2="70" stroke="%23166534" stroke-width="2"/><circle cx="50" cy="40" r="22" fill="%23facc15"/><text x="80" y="35" font-family="sans-serif" font-size="11" fill="%23b45309" font-weight="bold">Cahaya Matahari</text><text x="40" y="110" font-family="sans-serif" font-size="11" fill="%231e293b" font-weight="bold">CO₂ Masuk</text><text x="180" y="140" font-family="sans-serif" font-size="11" fill="%230284c7" font-weight="bold">O₂ Dihasilkan</text></svg>`;

export const DEFAULT_USERS: User[] = [
  {
    id: 'usr-admin-01',
    username: 'admin',
    password: 'Ampelgading2026!',
    role: 'admin',
    fullName: 'Administrator Korwil Kecamatan Ampelgading',
    email: 'admin.korwil@ampelgading.malangkab.go.id',
    phone: '0812-3456-7890',
    isActive: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'usr-admin-02',
    username: 'korwil_ampelgading',
    password: 'Ampelgading2026!',
    role: 'admin',
    fullName: 'Koordinator Wilayah Dinas Pendidikan Kec. Ampelgading',
    email: 'korwil.pendidikan@ampelgading.malangkab.go.id',
    phone: '(0341) 851234',
    isActive: true,
    createdAt: '2026-01-01'
  },
  // Guru Kelas SD (Hanya David dan Yuyut)
  {
    id: 'usr-guru-david',
    username: 'guru_david',
    password: 'password123',
    role: 'guru',
    fullName: 'David, S.Pd.',
    nip: '19850612 201001 1 012',
    schoolId: 'sch-01',
    schoolName: 'SD Negeri 1 Ampelgading',
    email: 'david@sekolah.id',
    phone: '0812-3456-7890',
    grade: 6,
    rombel: 'A',
    subjects: ['sub-mtk', 'sub-ipas', 'sub-bind', 'sub-ppkn'],
    classes: ['Kelas 6A'],
    isQuestionAuthor: true,
    isActive: true,
    createdAt: '2024-07-01'
  },
  {
    id: 'usr-guru-yuyut',
    username: 'guru_yuyut',
    password: 'password123',
    role: 'guru',
    fullName: 'Yuyut, S.Pd.',
    nip: '19880924 201201 2 008',
    schoolId: 'sch-01',
    schoolName: 'SD Negeri 1 Ampelgading',
    email: 'yuyut@sekolah.id',
    phone: '0813-9876-5432',
    grade: 6,
    rombel: 'B',
    subjects: ['sub-mtk', 'sub-ipas', 'sub-bind', 'sub-ppkn'],
    classes: ['Kelas 6B'],
    isQuestionAuthor: false,
    isActive: true,
    createdAt: '2024-07-01'
  },
  {
    id: 'usr-guru-wayan',
    username: 'guru_wayan',
    password: 'password123',
    role: 'guru',
    fullName: 'I Wayan Sutarman, S.Pd.H.',
    nip: '19870514 201101 1 007',
    schoolId: 'sch-02',
    schoolName: 'SD Negeri 2 Ampelgading',
    email: 'wayan@sekolah.id',
    phone: '0812-9988-7766',
    grade: 6,
    rombel: 'A',
    subjects: ['sub-mtk', 'sub-ipas', 'sub-pah'],
    classes: ['Kelas 6A'],
    isQuestionAuthor: true,
    isActive: true,
    createdAt: '2024-07-01'
  },
  {
    id: 'usr-guru-suherman',
    username: 'guru_suherman',
    password: 'password123',
    role: 'guru',
    fullName: 'Endang Suherman, S.Pd.',
    nip: '19740810 199803 1 003',
    schoolId: 'sch-03',
    schoolName: 'SD Negeri 3 Wirotaman',
    email: 'suherman@sekolah.id',
    phone: '0857-1122-3344',
    grade: 6,
    rombel: 'B',
    subjects: ['sub-mtk', 'sub-bind', 'sub-ipas'],
    classes: ['Kelas 6B'],
    isQuestionAuthor: true,
    isActive: true,
    createdAt: '2024-07-01'
  },
  {
    id: 'usr-guru-ridwan',
    username: 'guru_ridwan',
    password: 'password123',
    role: 'guru',
    fullName: 'Ust. Ridwan Kamil, Lc., M.A.',
    nip: '-',
    schoolId: 'sch-04',
    schoolName: 'SDIT Insan Cendekia Ampelgading',
    email: 'ridwan@sekolah.id',
    phone: '0821-4455-6677',
    grade: 6,
    rombel: 'A',
    subjects: ['sub-pai', 'sub-bind', 'sub-ppkn'],
    classes: ['Kelas 6A'],
    isQuestionAuthor: true,
    isActive: true,
    createdAt: '2024-07-01'
  },
  // Akun Spesialis Pembuat / Penulis Naskah Soal Kecamatan
  {
    id: 'usr-author-budi',
    username: 'pembuat_soal',
    password: 'password123',
    role: 'guru',
    fullName: 'Budi Santoso, S.Pd.',
    nip: '19820415 200801 1 015',
    schoolId: 'sch-01',
    schoolName: 'SD Negeri 1 Ampelgading',
    email: 'budi.santoso@sekolah.id',
    phone: '0812-7788-9900',
    grade: 6,
    rombel: 'A',
    subjects: ['sub-mtk', 'sub-ipas', 'sub-bind', 'sub-ppkn'],
    classes: ['Kelas 6A'],
    isQuestionAuthor: true,
    isActive: true,
    createdAt: '2024-07-01'
  },
  // Siswa Peserta Ujian - SDN 1 Ampelgading Kelas 6A (Diampu Guru David)
  {
    id: 'usr-sis-01',
    username: 'siswa_adit',
    password: 'password123',
    role: 'siswa',
    fullName: 'Aditya Pratama Putra',
    participantNumber: '01-054-001-8',
    nisn: '0123456781',
    schoolId: 'sch-01',
    schoolName: 'SD Negeri 1 Ampelgading',
    grade: 6,
    rombel: 'A',
    religion: 'Islam',
    isActive: true,
    createdAt: '2024-07-15'
  },
  {
    id: 'usr-sis-02',
    username: 'siswa_nayla',
    password: 'password123',
    role: 'siswa',
    fullName: 'Nayla Zahra Az-Zahra',
    participantNumber: '01-054-002-7',
    nisn: '0123456782',
    schoolId: 'sch-01',
    schoolName: 'SD Negeri 1 Ampelgading',
    grade: 6,
    rombel: 'A',
    religion: 'Islam',
    isActive: true,
    createdAt: '2024-07-15'
  },
  {
    id: 'usr-sis-03',
    username: 'siswa_samuel',
    password: 'password123',
    role: 'siswa',
    fullName: 'Samuel Christian Tambunan',
    participantNumber: '01-054-003-6',
    nisn: '0123456783',
    schoolId: 'sch-01',
    schoolName: 'SD Negeri 1 Ampelgading',
    grade: 6,
    rombel: 'A',
    religion: 'Kristen',
    isActive: true,
    createdAt: '2024-07-15'
  },
  {
    id: 'usr-sis-04',
    username: 'siswa_maria',
    password: 'password123',
    role: 'siswa',
    fullName: 'Maria Goretti Angela',
    participantNumber: '01-054-004-5',
    nisn: '0123456784',
    schoolId: 'sch-01',
    schoolName: 'SD Negeri 1 Ampelgading',
    grade: 6,
    rombel: 'A',
    religion: 'Katolik',
    isActive: true,
    createdAt: '2024-07-15'
  },
  // Siswa Peserta Ujian - SDN 1 Ampelgading Kelas 6B (Diampu Guru Siti)
  {
    id: 'usr-sis-01b',
    username: 'siswa_rian',
    password: 'password123',
    role: 'siswa',
    fullName: 'Rian Hidayat Saputra',
    participantNumber: '01-054-011-8',
    nisn: '0123456791',
    schoolId: 'sch-01',
    schoolName: 'SD Negeri 1 Ampelgading',
    grade: 6,
    rombel: 'B',
    religion: 'Islam',
    isActive: true,
    createdAt: '2024-07-15'
  },
  {
    id: 'usr-sis-02b',
    username: 'siswa_tiara',
    password: 'password123',
    role: 'siswa',
    fullName: 'Tiara Andini Kusuma',
    participantNumber: '01-054-012-7',
    nisn: '0123456792',
    schoolId: 'sch-01',
    schoolName: 'SD Negeri 1 Ampelgading',
    grade: 6,
    rombel: 'B',
    religion: 'Islam',
    isActive: true,
    createdAt: '2024-07-15'
  },
  {
    id: 'usr-sis-03b',
    username: 'siswa_bagus',
    password: 'password123',
    role: 'siswa',
    fullName: 'Bagus Pratama Putra',
    participantNumber: '01-054-013-6',
    nisn: '0123456793',
    schoolId: 'sch-01',
    schoolName: 'SD Negeri 1 Ampelgading',
    grade: 6,
    rombel: 'B',
    religion: 'Kristen',
    isActive: true,
    createdAt: '2024-07-15'
  },
  {
    id: 'usr-sis-05',
    username: 'siswa_putu',
    password: 'password123',
    role: 'siswa',
    fullName: 'I Putu Arya Wijaya',
    participantNumber: '01-054-005-4',
    nisn: '0123456785',
    schoolId: 'sch-02',
    schoolName: 'SD Negeri 2 Ampelgading',
    grade: 6,
    rombel: 'A',
    religion: 'Hindu',
    isActive: true,
    createdAt: '2024-07-15'
  },
  {
    id: 'usr-sis-06',
    username: 'siswa_siddhartha',
    password: 'password123',
    role: 'siswa',
    fullName: 'Siddhartha Gautama Jaya',
    participantNumber: '01-054-006-3',
    nisn: '0123456786',
    schoolId: 'sch-02',
    schoolName: 'SD Negeri 2 Ampelgading',
    grade: 6,
    rombel: 'A',
    religion: 'Buddha',
    isActive: true,
    createdAt: '2024-07-15'
  },
  {
    id: 'usr-sis-07',
    username: 'siswa_bilal',
    password: 'password123',
    role: 'siswa',
    fullName: 'Muhammad Bilal Al-Ghifari',
    participantNumber: '01-054-007-2',
    nisn: '0123456787',
    schoolId: 'sch-03',
    schoolName: 'SD Negeri 3 Wirotaman',
    grade: 6,
    rombel: 'B',
    religion: 'Islam',
    isActive: true,
    createdAt: '2024-07-15'
  },
  {
    id: 'usr-sis-08',
    username: 'siswa_aisha',
    password: 'password123',
    role: 'siswa',
    fullName: 'Aisha Humaira',
    participantNumber: '01-054-008-1',
    nisn: '0123456788',
    schoolId: 'sch-04',
    schoolName: 'SDIT Insan Cendekia Ampelgading',
    grade: 6,
    rombel: 'A',
    religion: 'Islam',
    isActive: true,
    createdAt: '2024-07-15'
  },
  {
    id: 'usr-sis-09',
    username: 'siswa_daniel',
    password: 'password123',
    role: 'siswa',
    fullName: 'Daniel Kristanto',
    participantNumber: '01-054-009-0',
    nisn: '0123456789',
    schoolId: 'sch-03',
    schoolName: 'SD Negeri 3 Wirotaman',
    grade: 6,
    rombel: 'B',
    religion: 'Kristen',
    isActive: true,
    createdAt: '2024-07-15'
  },
  {
    id: 'usr-sis-10',
    username: 'siswa_fransiskus',
    password: 'password123',
    role: 'siswa',
    fullName: 'Fransiskus Xaverius Yoga',
    participantNumber: '01-054-010-9',
    nisn: '0123456790',
    schoolId: 'sch-03',
    schoolName: 'SD Negeri 3 Wirotaman',
    grade: 6,
    rombel: 'B',
    religion: 'Katolik',
    isActive: true,
    createdAt: '2024-07-15'
  }
];

export const DEFAULT_QUESTIONS: Question[] = [
  // 1. MCQ - Matematika dengan Gambar
  {
    id: 'qst-mtk-01',
    subjectId: 'sub-mtk',
    grade: 6,
    semester: 'Ganjil',
    academicYear: '2024/2025',
    topic: 'Operasi Pecahan & Bangun Lingkaran',
    indicator: 'Disajikan gambar lingkaran yang dibagi ke beberapa juring, siswa dapat menentukan pecahan daerah yang diarsir.',
    difficulty: 'sedang',
    type: 'mcq',
    questionText: 'Perhatikan gambar lingkaran di bawah ini! Bagian yang diarsir biru tua menunjukkan pecahan dari keseluruhan lingkaran. Tentukan nilai pecahan yang tepat untuk bagian tersebut!',
    imageUrl: SVG_FRACTION_CIRCLE,
    imageCaption: 'Gambar 1: Juring lingkaran dengan arsiran biru',
    imagePosition: 'middle',
    imageWidth: 260,
    options: [
      { key: 'A', text: '1/4 bagian' },
      { key: 'B', text: '1/2 bagian (setengah lingkaran)' },
      { key: 'C', text: '3/4 bagian' },
      { key: 'D', text: '2/3 bagian' }
    ],
    correctAnswer: 'B',
    discussion: 'Lingkaran dibagi menjadi 4 bagian sama besar. Bagian yang diarsir biru tua terdiri atas 2 bagian juring, sehingga 2/4 = 1/2 bagian.',
    points: 10,
    status: 'ready',
    authorName: 'Budi Santoso, S.Pd.',
    authorRole: 'guru',
    schoolId: 'sch-01',
    createdAt: '2024-10-10',
    updatedAt: '2024-10-10'
  },

  // 2. Complex MCQ - Pilihan Ganda Kompleks (Pilih lebih dari 1) - Matematika
  {
    id: 'qst-mtk-02',
    subjectId: 'sub-mtk',
    grade: 6,
    semester: 'Ganjil',
    academicYear: '2024/2025',
    topic: 'Sifat-sifat Bangun Datar & Ruang',
    indicator: 'Siswa dapat menentukan sifat-sifat yang benar mengenai bangun kubus.',
    difficulty: 'sedang',
    type: 'complex_mcq',
    questionText: 'Manakah dari pernyataan-pernyataan di bawah ini yang merupakan sifat-sifat yang BENAR dari sebuah kubus? (Pilihlah semua jawaban yang benar)',
    imagePosition: 'top',
    complexOptions: [
      { id: 'opt-1', label: 'Memiliki 6 sisi yang berbentuk persegi kongruen', isCorrect: true },
      { id: 'opt-2', label: 'Memiliki 12 rusuk yang sama panjang', isCorrect: true },
      { id: 'opt-3', label: 'Memiliki 8 titik sudut', isCorrect: true },
      { id: 'opt-4', label: 'Memiliki alas berbentuk lingkaran', isCorrect: false },
      { id: 'opt-5', label: 'Memiliki 4 rusuk diagonal alas yang berbeda panjang', isCorrect: false }
    ],
    discussion: 'Kubus memiliki 6 sisi berbentuk persegi sama luas, 12 rusuk sama panjang, dan 8 titik sudut. Pilihan 1, 2, dan 3 adalah benar.',
    points: 15,
    status: 'ready',
    authorName: 'Budi Santoso, S.Pd.',
    authorRole: 'guru',
    schoolId: 'sch-01',
    createdAt: '2024-10-10',
    updatedAt: '2024-10-10'
  },

  // 3. Menjodohkan (Matching) - IPAS
  {
    id: 'qst-ipas-01',
    subjectId: 'sub-ipas',
    grade: 6,
    semester: 'Ganjil',
    academicYear: '2024/2025',
    topic: 'Siklus Air & Perubahan Wujud Benda',
    indicator: 'Disajikan konsep siklus hidrologi, siswa dapat menjodohkan istilah ilmiah dengan artinya.',
    difficulty: 'mudah',
    type: 'matching',
    questionText: 'Perhatikan gambar bagan siklus air di bawah. Pasangkanlah istilah tahapan siklus air di sebelah kiri dengan penjelasan yang sesuai di sebelah kanan!',
    imageUrl: SVG_WATER_CYCLE,
    imageCaption: 'Bagan Tahapan Siklus Hidrologi Bumi',
    imagePosition: 'top',
    imageWidth: 320,
    matchingPairs: [
      {
        id: 'mp-1',
        leftPrompt: 'Evaporasi',
        rightAnswer: 'Penguapan air dari permukaan bumi akibat panas matahari'
      },
      {
        id: 'mp-2',
        leftPrompt: 'Kondensasi',
        rightAnswer: 'Perubahan uap air menjadi titik-titik air pembentuk awan'
      },
      {
        id: 'mp-3',
        leftPrompt: 'Presipitasi',
        rightAnswer: 'Peristiwa jatuhnya air dari atmosfer ke bumi dalam bentuk hujan'
      },
      {
        id: 'mp-4',
        leftPrompt: 'Infiltrasi',
        rightAnswer: 'Penyerapan air hujan ke dalam pori-pori tanah'
      }
    ],
    discussion: 'Evaporasi adalah penguapan, kondensasi pembentukan awan, presipitasi curah hujan, infiltrasi peresapan air ke tanah.',
    points: 20,
    status: 'ready',
    authorName: 'Koordinator Ujian Kecamatan',
    authorRole: 'admin',
    createdAt: '2024-10-11',
    updatedAt: '2024-10-11'
  },

  // 4. Benar / Salah (True False) - Pendidikan Pancasila (4 Pernyataan)
  {
    id: 'qst-ppkn-01',
    subjectId: 'sub-ppkn',
    grade: 6,
    semester: 'Ganjil',
    academicYear: '2024/2025',
    topic: 'Penerapan Nilai-Nilai Sila Pancasila',
    indicator: 'Siswa dapat menganalisis kebenaran 4 pernyataan mengenai sikap pengamalan sila-sila Pancasila.',
    difficulty: 'sedang',
    type: 'true_false',
    questionText: 'Tentukan apakah masing-masing pernyataan mengenai penerapan nilai-nilai luhur Pancasila dalam kehidupan sehari-hari berikut BENAR atau SALAH!',
    imagePosition: 'top',
    trueFalseAnswer: true,
    trueFalseItems: [
      {
        id: 'tfi-ppkn-1',
        statement: 'Menghormati teman yang sedang beribadah sesuai agama dan kepercayaannya merupakan pengamalan Sila Pertama.',
        isCorrect: true
      },
      {
        id: 'tfi-ppkn-2',
        statement: 'Memaksakan suatu agama atau keyakinan kepada orang lain diperbolehkan selama demi kebaikan bersama.',
        isCorrect: false
      },
      {
        id: 'tfi-ppkn-3',
        statement: 'Membantu korban bencana alam tanpa membedakan suku maupun agama adalah wujud Sila Kemanusiaan yang Adil dan Beradab.',
        isCorrect: true
      },
      {
        id: 'tfi-ppkn-4',
        statement: 'Mengutamakan kepentingan pribadi di atas kepentingan umum dan negara merupakan cerminan cinta tanah air.',
        isCorrect: false
      }
    ],
    discussion: 'Pernyataan 1 Benar (Sila ke-1), Pernyataan 2 Salah (Tidak boleh memaksakan agama), Pernyataan 3 Benar (Sila ke-2), Pernyataan 4 Salah (Sila ke-3 mengutamakan persatuan dan kepentingan umum di atas pribadi).',
    points: 20,
    status: 'ready',
    authorName: 'Siti Rahmawati, S.Pd.SD.',
    authorRole: 'guru',
    schoolId: 'sch-01',
    createdAt: '2024-10-12',
    updatedAt: '2024-10-12'
  },

  // 5. MCQ - Bahasa Indonesia
  {
    id: 'qst-bind-01',
    subjectId: 'sub-bind',
    grade: 6,
    semester: 'Ganjil',
    academicYear: '2024/2025',
    topic: 'Ide Pokok dan Simpulan Paragraf',
    indicator: 'Disajikan kutipan teks, siswa dapat menentukan gagasan utama teks eksplanasi.',
    difficulty: 'sedang',
    type: 'mcq',
    questionText: 'Bacalah teks berikut dengan saksama!\n\n"Hutan mangrove memiliki peranan yang sangat penting bagi ekosistem pesisir pantai. Akar-akar pohon bakau yang kokoh mampu menahan gelombang pasang dan mencegah abrasi air laut. Selain itu, kawasan mangrove menjadi tempat berlindung dan berkembang biak bagi berbagai jenis ikan, kepiting, serta burung pantai."\n\nIde pokok paragraf di atas adalah ...',
    imagePosition: 'top',
    options: [
      { key: 'A', text: 'Jenis-jenis hewan yang hidup di sekitar akar bakau pesisir pantai' },
      { key: 'B', text: 'Peranan penting hutan mangrove bagi ekosistem pesisir pantai' },
      { key: 'C', text: 'Cara menanam pohon bakau yang efektif di tepi pantai' },
      { key: 'D', text: 'Penyebab terjadinya abrasi air laut akibat ombak besar' }
    ],
    correctAnswer: 'B',
    discussion: 'Kalimat utama terletak di awal paragraf: "Hutan mangrove memiliki peranan yang sangat penting bagi ekosistem pesisir pantai". Kalimat berikutnya merupakan penjelas.',
    points: 10,
    status: 'ready',
    authorName: 'Siti Rahmawati, S.Pd.SD.',
    authorRole: 'guru',
    schoolId: 'sch-01',
    createdAt: '2024-10-12',
    updatedAt: '2024-10-12'
  },

  // 6. Benar / Salah - Matematika (4 Pernyataan)
  {
    id: 'qst-mtk-03',
    subjectId: 'sub-mtk',
    grade: 6,
    semester: 'Ganjil',
    academicYear: '2024/2025',
    topic: 'Bilangan Bulat Negatif & Operasi Hitung',
    indicator: 'Siswa dapat menentukan kebenaran perbandingan dan operasi bilangan bulat negatif.',
    difficulty: 'sedang',
    type: 'true_false',
    questionText: 'Tentukan kebenaran dari masing-masing pernyataan perbandingan dan operasi hitung bilangan bulat di bawah ini!',
    imagePosition: 'top',
    trueFalseAnswer: false,
    trueFalseItems: [
      {
        id: 'tfi-mtk-1',
        statement: 'Bilangan -15 nilainya lebih besar daripada bilangan -8 pada garis bilangan.',
        isCorrect: false
      },
      {
        id: 'tfi-mtk-2',
        statement: 'Hasil perhitungan dari (-12) + 7 adalah sama dengan -5.',
        isCorrect: true
      },
      {
        id: 'tfi-mtk-3',
        statement: 'Lawan atau invers penjumlahan dari bilangan -25 adalah bilangan positif 25.',
        isCorrect: true
      },
      {
        id: 'tfi-mtk-4',
        statement: 'Pada garis bilangan, semakin ke kiri letak suatu bilangan bulat maka nilainya semakin besar.',
        isCorrect: false
      }
    ],
    discussion: '1. Salah (-15 < -8); 2. Benar ((-12) + 7 = -5); 3. Benar (lawan dari -25 adalah 25); 4. Salah (semakin ke kiri letaknya pada garis bilangan maka nilainya justru semakin kecil).',
    points: 20,
    status: 'ready',
    authorName: 'Budi Santoso, S.Pd.',
    authorRole: 'guru',
    schoolId: 'sch-01',
    createdAt: '2024-10-12',
    updatedAt: '2024-10-12'
  },

  // 7. Menjodohkan (Matching) - Matematika Bangun Ruang & Rumus Volume
  {
    id: 'qst-mtk-04',
    subjectId: 'sub-mtk',
    grade: 6,
    semester: 'Ganjil',
    academicYear: '2024/2025',
    topic: 'Volume Bangun Ruang',
    indicator: 'Siswa dapat memasangkan nama bangun ruang dengan rumus perhitungan volume yang tepat.',
    difficulty: 'sedang',
    type: 'matching',
    questionText: 'Pasangkanlah setiap nama bangun ruang di sebelah kiri dengan rumus volume yang tepat di sebelah kanan!',
    imagePosition: 'top',
    matchingPairs: [
      { id: 'mp-mtk-1', leftPrompt: 'Volume Kubus', rightAnswer: 's × s × s (s³)' },
      { id: 'mp-mtk-2', leftPrompt: 'Volume Balok', rightAnswer: 'p × l × t' },
      { id: 'mp-mtk-3', leftPrompt: 'Volume Tabung', rightAnswer: 'π × r² × t' },
      { id: 'mp-mtk-4', leftPrompt: 'Volume Kerucut', rightAnswer: '1/3 × π × r² × t' }
    ],
    discussion: 'Rumus volume: Kubus = s³, Balok = p × l × t, Tabung = π × r² × t, Kerucut = 1/3 × luas alas × tinggi.',
    points: 20,
    status: 'ready',
    authorName: 'Budi Santoso, S.Pd.',
    authorRole: 'guru',
    schoolId: 'sch-01',
    createdAt: '2024-10-14',
    updatedAt: '2024-10-14'
  },

  // 8. Soal PAI (Pendidikan Agama Islam)
  {
    id: 'qst-pai-01',
    subjectId: 'sub-pai',
    grade: 6,
    semester: 'Ganjil',
    academicYear: '2024/2025',
    topic: 'Asmaul Husna & Iman Kepada Hari Akhir',
    indicator: 'Siswa dapat menjelaskan makna Asmaul Husna Ash-Shamad dalam kehidupan sehari-hari.',
    difficulty: 'sedang',
    type: 'mcq',
    questionText: 'Allah SWT memiliki Asmaul Husna Ash-Shamad dan Al-Muqtadir. Makna Asmaul Husna Ash-Shamad yang paling tepat adalah...',
    imagePosition: 'top',
    options: [
      { key: 'A', text: 'Maha Dibutuhkan (Tempat Bergantung Segala Makhluk)' },
      { key: 'B', text: 'Maha Kuasa Menentukan Segalanya' },
      { key: 'C', text: 'Maha Mendahului Tanpa Awal' },
      { key: 'D', text: 'Maha Kekal Abadi Selamanya' }
    ],
    correctAnswer: 'A',
    discussion: 'Ash-Shamad artinya Yang Maha Dibutuhkan, tempat seluruh makhluk bersandar dan memohon pertolongan.',
    points: 20,
    status: 'ready',
    authorName: 'Ustadz Ridwan Kamil, Lc., M.A.',
    authorRole: 'guru',
    schoolId: 'sch-04',
    createdAt: '2024-10-15',
    updatedAt: '2024-10-15'
  },

  // 9. Soal PAK (Pendidikan Agama Kristen)
  {
    id: 'qst-pak-01',
    subjectId: 'sub-pak',
    grade: 6,
    semester: 'Ganjil',
    academicYear: '2024/2025',
    topic: 'Buah-Buah Roh & Kasih Kristus',
    indicator: 'Siswa dapat menyebutkan perwujudan buah Roh dalam interaksi sosial sesuai Galatia 5:22-23.',
    difficulty: 'sedang',
    type: 'mcq',
    questionText: 'Rasul Paulus dalam surat Galatia 5:22-23 mengajarkan buah-buah Roh yang harus berbuah dalam diri murid Kristus. Di bawah ini yang merupakan bagian dari buah Roh adalah...',
    imagePosition: 'top',
    options: [
      { key: 'A', text: 'Kasih, sukacita, damai sejahtera, kesabaran, kemurahan, kebaikan' },
      { key: 'B', text: 'Keserakahan, iri hati, dan kemarahan' },
      { key: 'C', text: 'Mementingkan diri sendiri dan keputusasaan' },
      { key: 'D', text: 'Kekhawatiran dan ketakutan duniawi' }
    ],
    correctAnswer: 'A',
    discussion: 'Buah Roh mencakup kasih, sukacita, damai sejahtera, kesabaran, kemurahan, kebaikan, kesetiaan, kelemahlembutan, penguasaan diri.',
    points: 20,
    status: 'ready',
    authorName: 'Yohanes Kristianto, S.Pd.K.',
    authorRole: 'guru',
    schoolId: 'sch-01',
    createdAt: '2024-10-15',
    updatedAt: '2024-10-15'
  },

  // 10. Soal PAKT (Pendidikan Agama Katolik)
  {
    id: 'qst-pakt-01',
    subjectId: 'sub-pakt',
    grade: 6,
    semester: 'Ganjil',
    academicYear: '2024/2025',
    topic: 'Sakramen-Sakramen Gereja Katolik',
    indicator: 'Siswa dapat mengidentifikasi tiga sakramen inisiasi dalam Gereja Katolik.',
    difficulty: 'sedang',
    type: 'mcq',
    questionText: 'Dalam Gereja Katolik terdapat tujuh sakramen kudus. Tiga sakramen yang menjadi dasar kehidupan kristiani dan disebut sebagai Sakramen Inisiasi adalah...',
    imagePosition: 'top',
    options: [
      { key: 'A', text: 'Sakramen Baptis, Sakramen Krisma (Penguatan), dan Sakramen Ekaristi' },
      { key: 'B', text: 'Sakramen Tobat, Imamat, dan Pernikahan' },
      { key: 'C', text: 'Sakramen Pengurapan Orang Sakit dan Tobat' },
      { key: 'D', text: 'Sakramen Imamat dan Perkawinan' }
    ],
    correctAnswer: 'A',
    discussion: 'Tiga Sakramen Inisiasi Katolik adalah Baptis, Krisma, dan Ekaristi.',
    points: 20,
    status: 'ready',
    authorName: 'Theresia Widya, S.Pd.',
    authorRole: 'guru',
    schoolId: 'sch-01',
    createdAt: '2024-10-15',
    updatedAt: '2024-10-15'
  },

  // 11. Soal PAH (Pendidikan Agama Hindu)
  {
    id: 'qst-pah-01',
    subjectId: 'sub-pah',
    grade: 6,
    semester: 'Ganjil',
    academicYear: '2024/2025',
    topic: 'Tri Hita Karana',
    indicator: 'Siswa dapat mengidentifikasi konsep keharmonisan Tri Hita Karana.',
    difficulty: 'sedang',
    type: 'mcq',
    questionText: 'Konsep ajaran luhur dalam Agama Hindu yang menuntun manusia hidup selaras melalui tiga hubungan harmonis: manusia dengan Ida Sang Hyang Widhi Wasa (Parahyangan), manusia dengan sesama (Pawongan), dan manusia dengan alam (Palemahan) disebut...',
    imagePosition: 'top',
    options: [
      { key: 'A', text: 'Tri Hita Karana' },
      { key: 'B', text: 'Catur Asrama' },
      { key: 'C', text: 'Tri Mala' },
      { key: 'D', text: 'Panca Sradha' }
    ],
    correctAnswer: 'A',
    discussion: 'Tri Hita Karana adalah tiga penyebab terciptanya kebahagiaan dan keharmonisan hidup.',
    points: 20,
    status: 'ready',
    authorName: 'I Wayan Sutarman, S.Pd.H.',
    authorRole: 'guru',
    schoolId: 'sch-02',
    createdAt: '2024-10-15',
    updatedAt: '2024-10-15'
  },

  // 12. Soal PAB (Pendidikan Agama Buddha)
  {
    id: 'qst-pab-01',
    subjectId: 'sub-pab',
    grade: 6,
    semester: 'Ganjil',
    academicYear: '2024/2025',
    topic: 'Pancasila Buddhis & Empat Kebenaran Mulia',
    indicator: 'Siswa dapat menjelaskan makna sila pertama dalam Pancasila Buddhis.',
    difficulty: 'sedang',
    type: 'mcq',
    questionText: 'Sila pertama dalam Pancasila Buddhis (Panatipata Veramani Sikkhapadam Samadiyami) merupakan tekad untuk melatih diri dalam...',
    imagePosition: 'top',
    options: [
      { key: 'A', text: 'Menghindari pembunuhan atau perbuatan menyakiti makhluk hidup' },
      { key: 'B', text: 'Menghindari mengambil barang yang tidak diberikan (mencuri)' },
      { key: 'C', text: 'Menghindari perbuatan asusila' },
      { key: 'D', text: 'Menghindari ucapan bohong atau dusta' }
    ],
    correctAnswer: 'A',
    discussion: 'Panatipata Veramani berarti bertekad untuk melatih diri menghindari pembunuhan dan kekejaman terhadap makhluk hidup.',
    points: 20,
    status: 'ready',
    authorName: 'Bhante Dharma, S.Pd.B.',
    authorRole: 'guru',
    schoolId: 'sch-02',
    createdAt: '2024-10-15',
    updatedAt: '2024-10-15'
  }
];

export const DEFAULT_EXAM_PACKAGES: ExamPackage[] = [
  {
    id: 'pkg-pas-mtk-6',
    title: 'Penilaian Akhir Semester (PAS) Matematika Kelas 6',
    academicYear: '2024/2025',
    semester: 'Ganjil',
    grade: 6,
    subjectId: 'sub-mtk',
    schoolIds: ['sch-01', 'sch-02', 'sch-03', 'sch-04'],
    classIds: ['cls-6a', 'cls-6b', 'cls-6c'],
    examDate: '2024-11-20',
    startTime: '08:00',
    endTime: '09:30',
    durationMinutes: 60,
    totalQuestions: 4,
    totalPoints: 55,
    status: 'ongoing',
    showScoreImmediately: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    questionIds: ['qst-mtk-01', 'qst-mtk-02', 'qst-mtk-04', 'qst-mtk-03'],
    createdAt: '2024-10-15'
  },
  {
    id: 'pkg-pas-ipas-6',
    title: 'Penilaian Akhir Semester (PAS) IPAS Terpadu Kelas 6',
    academicYear: '2024/2025',
    semester: 'Ganjil',
    grade: 6,
    subjectId: 'sub-ipas',
    schoolIds: ['sch-01', 'sch-02', 'sch-03', 'sch-04'],
    classIds: ['cls-6a', 'cls-6b'],
    examDate: '2024-11-21',
    startTime: '08:00',
    endTime: '09:30',
    durationMinutes: 60,
    totalQuestions: 1,
    totalPoints: 20,
    status: 'scheduled',
    showScoreImmediately: false,
    shuffleQuestions: true,
    shuffleOptions: true,
    questionIds: ['qst-ipas-01'],
    createdAt: '2024-10-16'
  },
  {
    id: 'pkg-pas-bind-6',
    title: 'Penilaian Akhir Semester (PAS) Bahasa Indonesia Kelas 6',
    academicYear: '2024/2025',
    semester: 'Ganjil',
    grade: 6,
    subjectId: 'sub-bind',
    schoolIds: ['sch-01', 'sch-02'],
    classIds: ['cls-6a'],
    examDate: '2024-11-22',
    startTime: '08:00',
    endTime: '09:30',
    durationMinutes: 60,
    totalQuestions: 1,
    totalPoints: 10,
    status: 'scheduled',
    showScoreImmediately: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    questionIds: ['qst-bind-01'],
    createdAt: '2024-10-16'
  },
  // Paket Ujian Agama Islam
  {
    id: 'pkg-pas-pai-6',
    title: 'Penilaian Akhir Semester (PAS) Pendidikan Agama Islam Kelas 6',
    academicYear: '2024/2025',
    semester: 'Ganjil',
    grade: 6,
    subjectId: 'sub-pai',
    schoolIds: ['sch-01', 'sch-02', 'sch-03', 'sch-04'],
    classIds: ['cls-6a', 'cls-6b'],
    examDate: '2024-11-25',
    startTime: '08:00',
    endTime: '09:30',
    durationMinutes: 60,
    totalQuestions: 1,
    totalPoints: 20,
    status: 'ongoing',
    showScoreImmediately: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    questionIds: ['qst-pai-01'],
    createdAt: '2024-10-17'
  },
  // Paket Ujian Agama Kristen
  {
    id: 'pkg-pas-pak-6',
    title: 'Penilaian Akhir Semester (PAS) Pendidikan Agama Kristen Kelas 6',
    academicYear: '2024/2025',
    semester: 'Ganjil',
    grade: 6,
    subjectId: 'sub-pak',
    schoolIds: ['sch-01', 'sch-02', 'sch-03', 'sch-04'],
    classIds: ['cls-6a', 'cls-6b'],
    examDate: '2024-11-25',
    startTime: '08:00',
    endTime: '09:30',
    durationMinutes: 60,
    totalQuestions: 1,
    totalPoints: 20,
    status: 'ongoing',
    showScoreImmediately: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    questionIds: ['qst-pak-01'],
    createdAt: '2024-10-17'
  },
  // Paket Ujian Agama Katolik
  {
    id: 'pkg-pas-pakt-6',
    title: 'Penilaian Akhir Semester (PAS) Pendidikan Agama Katolik Kelas 6',
    academicYear: '2024/2025',
    semester: 'Ganjil',
    grade: 6,
    subjectId: 'sub-pakt',
    schoolIds: ['sch-01', 'sch-02', 'sch-03', 'sch-04'],
    classIds: ['cls-6a', 'cls-6b'],
    examDate: '2024-11-25',
    startTime: '08:00',
    endTime: '09:30',
    durationMinutes: 60,
    totalQuestions: 1,
    totalPoints: 20,
    status: 'ongoing',
    showScoreImmediately: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    questionIds: ['qst-pakt-01'],
    createdAt: '2024-10-17'
  },
  // Paket Ujian Agama Hindu
  {
    id: 'pkg-pas-pah-6',
    title: 'Penilaian Akhir Semester (PAS) Pendidikan Agama Hindu Kelas 6',
    academicYear: '2024/2025',
    semester: 'Ganjil',
    grade: 6,
    subjectId: 'sub-pah',
    schoolIds: ['sch-01', 'sch-02', 'sch-03', 'sch-04'],
    classIds: ['cls-6a', 'cls-6b'],
    examDate: '2024-11-25',
    startTime: '08:00',
    endTime: '09:30',
    durationMinutes: 60,
    totalQuestions: 1,
    totalPoints: 20,
    status: 'ongoing',
    showScoreImmediately: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    questionIds: ['qst-pah-01'],
    createdAt: '2024-10-17'
  },
  // Paket Ujian Agama Buddha
  {
    id: 'pkg-pas-pab-6',
    title: 'Penilaian Akhir Semester (PAS) Pendidikan Agama Buddha Kelas 6',
    academicYear: '2024/2025',
    semester: 'Ganjil',
    grade: 6,
    subjectId: 'sub-pab',
    schoolIds: ['sch-01', 'sch-02', 'sch-03', 'sch-04'],
    classIds: ['cls-6a', 'cls-6b'],
    examDate: '2024-11-25',
    startTime: '08:00',
    endTime: '09:30',
    durationMinutes: 60,
    totalQuestions: 1,
    totalPoints: 20,
    status: 'ongoing',
    showScoreImmediately: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    questionIds: ['qst-pab-01'],
    createdAt: '2024-10-17'
  }
];

export const DEFAULT_EXAM_SESSIONS: StudentExamSession[] = [
  // Session completed by Nayla Zahra
  {
    id: 'sess-02',
    examPackageId: 'pkg-pas-mtk-6',
    studentId: 'usr-sis-02',
    studentName: 'Nayla Zahra Az-Zahra',
    participantNumber: '01-054-002-7',
    nisn: '0123456782',
    schoolId: 'sch-01',
    schoolName: 'SD Negeri 1 Ampelgading',
    grade: 6,
    rombel: 'A',
    startedAt: '2024-11-20T08:01:00',
    finishedAt: '2024-11-20T08:35:12',
    durationSpentSeconds: 2052,
    status: 'graded',
    answers: {
      'qst-mtk-01': {
        questionId: 'qst-mtk-01',
        type: 'mcq',
        answerMcq: 'B',
        isCorrect: true,
        earnedPoints: 10,
        maxPoints: 10,
        answeredAt: '2024-11-20T08:10:00'
      },
      'qst-mtk-02': {
        questionId: 'qst-mtk-02',
        type: 'complex_mcq',
        answerComplexMcq: ['opt-1', 'opt-2', 'opt-3'],
        isCorrect: true,
        earnedPoints: 15,
        maxPoints: 15,
        answeredAt: '2024-11-20T08:22:00'
      },
      'qst-mtk-03': {
        questionId: 'qst-mtk-03',
        type: 'true_false',
        answerTrueFalse: false,
        isCorrect: true,
        earnedPoints: 10,
        maxPoints: 10,
        answeredAt: '2024-11-20T08:30:00'
      }
    },
    reviewedQuestionIds: [],
    score: 100,
    totalCorrect: 3,
    totalIncorrect: 0,
    totalUnanswered: 0,
    isPassed: true,
    gradedAt: '2024-11-20T08:35:12',
    gradedBy: 'Sistem Penilaian Otomatis'
  },
  // Session completed by Reza Firmansyah
  {
    id: 'sess-03',
    examPackageId: 'pkg-pas-mtk-6',
    studentId: 'usr-sis-03',
    studentName: 'Reza Firmansyah',
    participantNumber: '01-054-003-6',
    nisn: '0123456783',
    schoolId: 'sch-01',
    schoolName: 'SD Negeri 1 Ampelgading',
    grade: 6,
    rombel: 'A',
    startedAt: '2024-11-20T08:02:00',
    finishedAt: '2024-11-20T08:44:00',
    durationSpentSeconds: 2520,
    status: 'graded',
    answers: {
      'qst-mtk-01': {
        questionId: 'qst-mtk-01',
        type: 'mcq',
        answerMcq: 'B',
        isCorrect: true,
        earnedPoints: 10,
        maxPoints: 10
      },
      'qst-mtk-02': {
        questionId: 'qst-mtk-02',
        type: 'complex_mcq',
        answerComplexMcq: ['opt-1', 'opt-2'], // Partial
        isCorrect: false,
        earnedPoints: 10,
        maxPoints: 15
      },
      'qst-mtk-03': {
        questionId: 'qst-mtk-03',
        type: 'true_false',
        answerTrueFalse: true, // wrong
        isCorrect: false,
        earnedPoints: 0,
        maxPoints: 10
      }
    },
    reviewedQuestionIds: ['qst-mtk-03'],
    score: 57,
    totalCorrect: 1,
    totalIncorrect: 2,
    totalUnanswered: 0,
    isPassed: false,
    gradedAt: '2024-11-20T08:44:00',
    gradedBy: 'Sistem Penilaian Otomatis'
  },
  // Session completed by Rian Hidayat Saputra (SDN 1 Ampelgading - Kelas 6B)
  {
    id: 'sess-01b',
    examPackageId: 'pkg-pas-mtk-6',
    studentId: 'usr-sis-01b',
    studentName: 'Rian Hidayat Saputra',
    participantNumber: '01-054-011-8',
    nisn: '0123456791',
    schoolId: 'sch-01',
    schoolName: 'SD Negeri 1 Ampelgading',
    grade: 6,
    rombel: 'B',
    startedAt: '2024-11-20T08:00:00',
    finishedAt: '2024-11-20T08:38:00',
    durationSpentSeconds: 2280,
    status: 'graded',
    answers: {
      'qst-mtk-01': {
        questionId: 'qst-mtk-01',
        type: 'mcq',
        answerMcq: 'B',
        isCorrect: true,
        earnedPoints: 10,
        maxPoints: 10
      },
      'qst-mtk-02': {
        questionId: 'qst-mtk-02',
        type: 'complex_mcq',
        answerComplexMcq: ['opt-1', 'opt-2', 'opt-3'],
        isCorrect: true,
        earnedPoints: 15,
        maxPoints: 15
      },
      'qst-mtk-03': {
        questionId: 'qst-mtk-03',
        type: 'true_false',
        answerTrueFalse: false,
        isCorrect: true,
        earnedPoints: 10,
        maxPoints: 10
      }
    },
    reviewedQuestionIds: [],
    score: 100,
    totalCorrect: 3,
    totalIncorrect: 0,
    totalUnanswered: 0,
    isPassed: true,
    gradedAt: '2024-11-20T08:38:00',
    gradedBy: 'Sistem Penilaian Otomatis'
  },
  // Session completed by Tiara Andini Kusuma (SDN 1 Ampelgading - Kelas 6B)
  {
    id: 'sess-02b',
    examPackageId: 'pkg-pas-mtk-6',
    studentId: 'usr-sis-02b',
    studentName: 'Tiara Andini Kusuma',
    participantNumber: '01-054-012-7',
    nisn: '0123456792',
    schoolId: 'sch-01',
    schoolName: 'SD Negeri 1 Ampelgading',
    grade: 6,
    rombel: 'B',
    startedAt: '2024-11-20T08:03:00',
    finishedAt: '2024-11-20T08:42:00',
    durationSpentSeconds: 2340,
    status: 'graded',
    answers: {
      'qst-mtk-01': {
        questionId: 'qst-mtk-01',
        type: 'mcq',
        answerMcq: 'B',
        isCorrect: true,
        earnedPoints: 10,
        maxPoints: 10
      },
      'qst-mtk-02': {
        questionId: 'qst-mtk-02',
        type: 'complex_mcq',
        answerComplexMcq: ['opt-1', 'opt-2'],
        isCorrect: false,
        earnedPoints: 10,
        maxPoints: 15
      },
      'qst-mtk-03': {
        questionId: 'qst-mtk-03',
        type: 'true_false',
        answerTrueFalse: false,
        isCorrect: true,
        earnedPoints: 10,
        maxPoints: 10
      }
    },
    reviewedQuestionIds: [],
    score: 85,
    totalCorrect: 2,
    totalIncorrect: 1,
    totalUnanswered: 0,
    isPassed: true,
    gradedAt: '2024-11-20T08:42:00',
    gradedBy: 'Sistem Penilaian Otomatis'
  },
  // Session completed by Dimas Setiawan (SDN 2 Ampelgading)
  {
    id: 'sess-05',
    examPackageId: 'pkg-pas-mtk-6',
    studentId: 'usr-sis-05',
    studentName: 'Dimas Setiawan',
    participantNumber: '01-054-005-4',
    nisn: '0123456785',
    schoolId: 'sch-02',
    schoolName: 'SD Negeri 2 Ampelgading',
    grade: 6,
    rombel: 'A',
    startedAt: '2024-11-20T08:05:00',
    finishedAt: '2024-11-20T08:40:00',
    durationSpentSeconds: 2100,
    status: 'graded',
    answers: {
      'qst-mtk-01': { questionId: 'qst-mtk-01', type: 'mcq', answerMcq: 'B', isCorrect: true, earnedPoints: 10, maxPoints: 10 },
      'qst-mtk-02': { questionId: 'qst-mtk-02', type: 'complex_mcq', answerComplexMcq: ['opt-1', 'opt-2', 'opt-3'], isCorrect: true, earnedPoints: 15, maxPoints: 15 },
      'qst-mtk-03': { questionId: 'qst-mtk-03', type: 'true_false', answerTrueFalse: false, isCorrect: true, earnedPoints: 10, maxPoints: 10 }
    },
    reviewedQuestionIds: [],
    score: 100,
    totalCorrect: 3,
    totalIncorrect: 0,
    totalUnanswered: 0,
    isPassed: true,
    gradedAt: '2024-11-20T08:40:00'
  },
  // Session completed by Zahra Nurul Fadilah (SDN 2 Ampelgading)
  {
    id: 'sess-06',
    examPackageId: 'pkg-pas-mtk-6',
    studentId: 'usr-sis-06',
    studentName: 'Zahra Nurul Fadilah',
    participantNumber: '01-054-006-3',
    nisn: '0123456786',
    schoolId: 'sch-02',
    schoolName: 'SD Negeri 2 Ampelgading',
    grade: 6,
    rombel: 'A',
    startedAt: '2024-11-20T08:06:00',
    finishedAt: '2024-11-20T08:48:00',
    durationSpentSeconds: 2520,
    status: 'graded',
    answers: {
      'qst-mtk-01': { questionId: 'qst-mtk-01', type: 'mcq', answerMcq: 'B', isCorrect: true, earnedPoints: 10, maxPoints: 10 },
      'qst-mtk-02': { questionId: 'qst-mtk-02', type: 'complex_mcq', answerComplexMcq: ['opt-1', 'opt-2', 'opt-3'], isCorrect: true, earnedPoints: 15, maxPoints: 15 },
      'qst-mtk-03': { questionId: 'qst-mtk-03', type: 'true_false', answerTrueFalse: false, isCorrect: true, earnedPoints: 10, maxPoints: 10 }
    },
    reviewedQuestionIds: [],
    score: 100,
    totalCorrect: 3,
    totalIncorrect: 0,
    totalUnanswered: 0,
    isPassed: true,
    gradedAt: '2024-11-20T08:48:00'
  }
];

export const DEFAULT_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-01',
    timestamp: '2024-11-20 08:48:12',
    userName: 'Zahra Nurul Fadilah',
    role: 'siswa',
    action: 'Menyelesaikan Ujian',
    details: 'Siswa menyelesaikan paket soal PAS Matematika Kelas 6 dengan nilai 100.'
  },
  {
    id: 'log-02',
    timestamp: '2024-11-20 08:35:15',
    userName: 'Nayla Zahra Az-Zahra',
    role: 'siswa',
    action: 'Menyelesaikan Ujian',
    details: 'Siswa menyelesaikan paket soal PAS Matematika Kelas 6 dengan nilai 100.'
  },
  {
    id: 'log-03',
    timestamp: '2024-11-20 08:00:00',
    userName: 'Koordinator Ujian Kecamatan',
    role: 'admin',
    action: 'Membuka Sesi Ujian',
    details: 'Paket Ujian PAS Matematika Kelas 6 telah diaktifkan untuk seluruh SD di Kecamatan Ampelgading.'
  },
  {
    id: 'log-04',
    timestamp: '2024-11-19 14:20:00',
    userName: 'Budi Santoso, S.Pd.',
    role: 'guru',
    action: 'Menambahkan Soal',
    details: 'Menambahkan soal jenis Pilihan Ganda Kompleks ke Bank Soal Matematika.'
  }
];

// In-memory / localStorage Storage Engine
export class AppStorage {
  private static listeners: Array<() => void> = [];

  static subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private static notify() {
    this.listeners.forEach(fn => fn());
  }

  static initialize() {
    const isSeeded = localStorage.getItem(STORAGE_KEYS.SEEDED);
    if (!isSeeded) {
      this.resetToDefaults();
      return;
    }

    // Pembersihan otomatis: Hapus semua guru dan siswa yang tidak ada di daftar sekolah yang ada
    this.cleanupOrphanUsers();

    // Pastikan pembuat_soal awal ada jika belum pernah dihapus permanen oleh pengguna
    try {
      const deletedIds = this.getDeletedUserIds();
      const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      if (rawUsers) {
        const parsed: User[] = JSON.parse(rawUsers);
        const isAuthorDeleted = deletedIds.has('usr-author-budi') || deletedIds.has('pembuat_soal');
        if (!isAuthorDeleted && !parsed.some(u => u.username === 'pembuat_soal')) {
          const author = DEFAULT_USERS.find(u => u.username === 'pembuat_soal');
          if (author) {
            parsed.push(author);
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed));
          }
        }
      }
    } catch {
      // fallback
    }
  }

  static resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(DEFAULT_SCHOOLS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(DEFAULT_SUBJECTS));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(DEFAULT_QUESTIONS));
    localStorage.setItem(STORAGE_KEYS.EXAM_PACKAGES, JSON.stringify(DEFAULT_EXAM_PACKAGES));
    localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(DEFAULT_EXAM_SESSIONS));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(DEFAULT_ACTIVITY_LOGS));
    localStorage.setItem(STORAGE_KEYS.SEEDED, 'ampelgading_malang_v7_author_schools');
    this.notify();
  }

  // --- Settings ---
  static getSettings(): SystemSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.districtName?.includes('Sukamaju')) {
        parsed.districtName = 'Kecamatan Ampelgading';
        parsed.regencyName = 'Kabupaten Malang';
        parsed.provinceName = 'Jawa Timur';
        parsed.address = 'Jl. Raya Tirtomoyo No. 45, Kecamatan Ampelgading, Kabupaten Malang';
        parsed.phone = '(0341) 851234';
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  static saveSettings(settings: SystemSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.logActivity('Admin Kecamatan', 'admin', 'Memperbarui Pengaturan', 'Pengaturan identitas kecamatan dan kop surat diperbarui.');
    this.notify();
  }

  // --- Auth Session ---
  static getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      const u: User = JSON.parse(raw);
      // Sinkronkan akun jika ada pembaruan di database lokal
      if (u) {
        const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        if (rawUsers) {
          const allUsers: User[] = JSON.parse(rawUsers);
          const found = allUsers.find(
            user => user.id === u.id || user.username.toLowerCase() === u.username.toLowerCase()
          );
          if (found) {
            return found;
          }
        }
      }
      return u;
    } catch {
      return null;
    }
  }
  static setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.notify();
  }

  // --- Schools ---
  static getSchools(): School[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHOOLS);
    if (!raw) return DEFAULT_SCHOOLS;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SCHOOLS;
    } catch {
      return DEFAULT_SCHOOLS;
    }
  }
  static saveSchool(school: School) {
    const schools = this.getSchools();
    const idx = schools.findIndex(s => s.id === school.id);
    if (idx >= 0) {
      schools[idx] = school;
    } else {
      schools.push(school);
    }
    localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
    this.notify();
  }
  static deleteSchool(id: string) {
    const schools = this.getSchools().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
    // Hapus semua guru dan siswa yang terhubung ke sekolah yang dihapus
    this.cleanupOrphanUsers();
    this.notify();
  }
  static deleteSchools(ids: string[]) {
    const idSet = new Set(ids);
    const schools = this.getSchools().filter(s => !idSet.has(s.id));
    localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
    // Hapus semua guru dan siswa yang terhubung ke sekolah yang dihapus
    this.cleanupOrphanUsers();
    this.notify();
  }

  // --- Deleted Users Tracking ---
  static getDeletedUserIds(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DELETED_USER_IDS);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }

  static addDeletedUserId(id: string) {
    if (!id) return;
    const deleted = this.getDeletedUserIds();
    deleted.add(id);
    localStorage.setItem(STORAGE_KEYS.DELETED_USER_IDS, JSON.stringify(Array.from(deleted)));
  }

  static removeDeletedUserId(id: string) {
    if (!id) return;
    const deleted = this.getDeletedUserIds();
    if (deleted.has(id)) {
      deleted.delete(id);
      localStorage.setItem(STORAGE_KEYS.DELETED_USER_IDS, JSON.stringify(Array.from(deleted)));
    }
  }

  // --- Orphan Users Cleanup (Hapus Guru & Siswa yang tidak ada di daftar sekolah yang ada) ---
  static cleanupOrphanUsers(): { removedTeachers: number; removedStudents: number } {
    const schools = this.getSchools();
    const validSchoolIds = new Set(schools.map(s => s.id));
    const validSchoolNames = new Set(schools.map(s => (s.name || '').trim().toLowerCase()));

    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) return { removedTeachers: 0, removedStudents: 0 };

    let users: User[] = [];
    try {
      users = JSON.parse(raw);
    } catch {
      return { removedTeachers: 0, removedStudents: 0 };
    }

    let removedTeachers = 0;
    let removedStudents = 0;
    let changed = false;

    const filteredUsers = users.filter(u => {
      if (!u) return false;
      // Admin tidak terikat ke satuan pendidikan tertentu
      if (u.role === 'admin') return true;

      const userSchoolId = String(u.schoolId || '').trim();
      const userSchoolName = String(u.schoolName || '').trim().toLowerCase();

      const hasValidId = Boolean(userSchoolId && validSchoolIds.has(userSchoolId));
      const hasValidName = Boolean(userSchoolName && validSchoolNames.has(userSchoolName));

      if (u.role === 'guru') {
        if (!hasValidId && !hasValidName) {
          removedTeachers++;
          this.addDeletedUserId(u.id);
          changed = true;
          return false;
        }
        // Sinkronisasi schoolId jika nama sekolah cocok namun ID belum terhubung
        if (!hasValidId && hasValidName) {
          const matched = schools.find(s => (s.name || '').trim().toLowerCase() === userSchoolName);
          if (matched) {
            u.schoolId = matched.id;
            u.schoolName = matched.name;
            changed = true;
          }
        }
        return true;
      }

      if (u.role === 'siswa') {
        if (!hasValidId && !hasValidName) {
          removedStudents++;
          this.addDeletedUserId(u.id);
          changed = true;
          return false;
        }
        // Sinkronisasi schoolId jika nama sekolah cocok namun ID belum terhubung
        if (!hasValidId && hasValidName) {
          const matched = schools.find(s => (s.name || '').trim().toLowerCase() === userSchoolName);
          if (matched) {
            u.schoolId = matched.id;
            u.schoolName = matched.name;
            changed = true;
          }
        }
        return true;
      }

      return true;
    });

    if (changed || removedTeachers > 0 || removedStudents > 0) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));
      if (removedTeachers > 0 || removedStudents > 0) {
        this.logActivity(
          'Sistem Korwil',
          'admin',
          'Pembersihan Data Sekolah',
          `Menghapus ${removedTeachers} guru dan ${removedStudents} siswa yang tidak terdaftar di daftar sekolah yang ada.`
        );
      }
      this.notify();
    }

    return { removedTeachers, removedStudents };
  }

  // --- Users (Admin, Teachers, Students, Pembuat Soal) ---
  static getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    const schools = this.getSchools();
    const validSchoolIds = new Set(schools.map(s => s.id));
    const validSchoolNames = new Set(schools.map(s => (s.name || '').trim().toLowerCase()));
    const deletedIds = this.getDeletedUserIds();

    if (!raw) {
      const initialUsers = DEFAULT_USERS.filter(u => {
        if (deletedIds.has(u.id)) return false;
        if (u.role === 'admin') return true;
        const validId = Boolean(u.schoolId && validSchoolIds.has(u.schoolId));
        const validName = Boolean(u.schoolName && validSchoolNames.has(u.schoolName.trim().toLowerCase()));
        return validId || validName;
      });
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
      return initialUsers;
    }

    try {
      let users: User[] = JSON.parse(raw);
      let changed = false;

      // Filter keluar user yang telah dihapus secara permanen
      if (deletedIds.size > 0) {
        const prevCount = users.length;
        users = users.filter(u => u && !deletedIds.has(u.id));
        if (users.length !== prevCount) changed = true;
      }

      // Hapus semua data guru dan siswa yang tidak ada di dalam daftar sekolah yang ada
      const prevCount = users.length;
      users = users.filter(u => {
        if (!u) return false;
        if (u.role === 'admin') return true;
        const validId = Boolean(u.schoolId && validSchoolIds.has(u.schoolId));
        const validName = Boolean(u.schoolName && validSchoolNames.has(u.schoolName.trim().toLowerCase()));
        return validId || validName;
      });
      if (users.length !== prevCount) changed = true;

      // Migrasi username guru ke format guru_nama jika belum
      users.forEach(u => {
        if (u && u.role === 'guru') {
          const uname = String(u.username || '').toLowerCase();
          if (uname === 'david') {
            u.username = 'guru_david';
            changed = true;
          } else if (uname === 'yuyut') {
            u.username = 'guru_yuyut';
            changed = true;
          } else if (uname && !uname.startsWith('guru_') && !u.isQuestionAuthor && uname !== 'pembuat_soal') {
            u.username = `guru_${uname.replace(/[^a-z0-9_]/g, '')}`;
            changed = true;
          }
        }
      });

      // Ensure admin has Ampelgading2026!
      const adminIdx = users.findIndex(u => u.username === 'admin');
      if (adminIdx >= 0) {
        if (users[adminIdx].password !== 'Ampelgading2026!') {
          users[adminIdx].password = 'Ampelgading2026!';
          changed = true;
        }
      } else {
        users.unshift(DEFAULT_USERS[0]);
        changed = true;
      }

      // Ensure korwil_ampelgading exists
      if (!users.some(u => u.username === 'korwil_ampelgading') && !deletedIds.has('usr-admin-02')) {
        users.splice(1, 0, DEFAULT_USERS[1]);
        changed = true;
      }

      // Ensure students have a default religion if missing
      users.forEach(u => {
        if (u.role === 'siswa' && !u.religion) {
          const matchDefault = DEFAULT_USERS.find(d => d.id === u.id);
          u.religion = matchDefault?.religion || 'Islam';
          changed = true;
        }
      });

      if (changed) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
      return users;
    } catch {
      return DEFAULT_USERS.filter(u => {
        if (u.role === 'admin') return true;
        return Boolean(u.schoolId && validSchoolIds.has(u.schoolId));
      });
    }
  }

  static saveUser(user: User) {
    this.removeDeletedUserId(user.id);
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    try {
      const curr = this.getCurrentUser();
      if (curr && (curr.id === user.id || curr.username.toLowerCase() === user.username.toLowerCase())) {
        this.setCurrentUser(user);
      }
    } catch {
      // fallback
    }
    this.notify();
  }

  static saveUsers(newUsers: User[]) {
    if (!newUsers || newUsers.length === 0) return;
    const users = this.getUsers();
    newUsers.forEach(u => {
      this.removeDeletedUserId(u.id);
      const idx = users.findIndex(existing => existing.id === u.id || existing.username.toLowerCase() === u.username.toLowerCase());
      if (idx >= 0) {
        users[idx] = u;
      } else {
        users.push(u);
      }
    });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.notify();
  }

  static deleteUser(id: string) {
    this.addDeletedUserId(id);
    const users = this.getUsers().filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    try {
      const curr = this.getCurrentUser();
      if (curr && curr.id === id) {
        this.setCurrentUser(null);
      }
    } catch {
      // fallback
    }
    this.notify();
  }

  static deleteUsers(ids: string[]) {
    const idSet = new Set(ids);
    ids.forEach(id => this.addDeletedUserId(id));
    const users = this.getUsers().filter(u => !(idSet.has(u.id) && u.username === 'admin'));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    try {
      const curr = this.getCurrentUser();
      if (curr && idSet.has(curr.id)) {
        this.setCurrentUser(null);
      }
    } catch {
      // fallback
    }
    this.notify();
  }

  static restoreDefaultTeachers() {
    const schools = this.getSchools();
    const validSchoolIds = new Set(schools.map(s => s.id));
    const deletedIds = this.getDeletedUserIds();

    const defaultTeachers = DEFAULT_USERS.filter(
      u => u.role === 'guru' && !deletedIds.has(u.id) && u.schoolId && validSchoolIds.has(u.schoolId)
    );
    const existing = this.getUsers();
    let changed = false;

    defaultTeachers.forEach(guru => {
      const idx = existing.findIndex(
        u => u.id === guru.id ||
             (u.username && u.username.toLowerCase() === guru.username.toLowerCase())
      );
      if (idx === -1) {
        existing.push(guru);
        changed = true;
      }
    });

    if (changed) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(existing));
      this.notify();
    }
  }

  // --- Subjects & Classes ---
  static getSubjects(): Subject[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (!raw) return DEFAULT_SUBJECTS;
    try {
      const subjects: Subject[] = JSON.parse(raw);
      let changed = false;
      // Ensure all 5 religious subjects are registered
      DEFAULT_SUBJECTS.forEach(defSub => {
        const found = subjects.find(s => s.id === defSub.id);
        if (!found) {
          subjects.push(defSub);
          changed = true;
        } else if (defSub.religion && found.religion !== defSub.religion) {
          found.religion = defSub.religion;
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
      }
      return subjects;
    } catch {
      return DEFAULT_SUBJECTS;
    }
  }
  static saveSubject(subj: Subject) {
    const subjects = this.getSubjects();
    const idx = subjects.findIndex(s => s.id === subj.id);
    if (idx >= 0) subjects[idx] = subj;
    else subjects.push(subj);
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    this.notify();
  }
  static deleteSubject(id: string) {
    const subjects = this.getSubjects().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    this.notify();
  }
  static getClasses(): ClassItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (!raw) return DEFAULT_CLASSES;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CLASSES;
    } catch {
      return DEFAULT_CLASSES;
    }
  }
  static saveClass(item: ClassItem) {
    const classes = this.getClasses();
    const idx = classes.findIndex(c => c.id === item.id);
    if (idx >= 0) classes[idx] = item;
    else classes.push(item);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    this.notify();
  }

  // --- Questions (Bank Soal) ---
  static getQuestions(): Question[] {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (!raw) return DEFAULT_QUESTIONS;
    try {
      const questions: Question[] = JSON.parse(raw);
      let changed = false;
      DEFAULT_QUESTIONS.forEach(defQ => {
        const existingIdx = questions.findIndex(q => q.id === defQ.id);
        if (existingIdx === -1) {
          questions.push(defQ);
          changed = true;
        } else if (defQ.trueFalseItems && (!questions[existingIdx].trueFalseItems || questions[existingIdx].trueFalseItems?.length === 0)) {
          questions[existingIdx].trueFalseItems = defQ.trueFalseItems;
          questions[existingIdx].questionText = defQ.questionText;
          questions[existingIdx].points = defQ.points;
          questions[existingIdx].discussion = defQ.discussion;
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
      }
      return questions;
    } catch {
      return DEFAULT_QUESTIONS;
    }
  }
  static saveQuestion(question: Question) {
    const questions = this.getQuestions();
    const idx = questions.findIndex(q => q.id === question.id);
    if (idx >= 0) {
      questions[idx] = question;
    } else {
      questions.unshift(question);
    }
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    this.notify();
  }
  static saveQuestions(newQuestions: Question[]) {
    const questions = this.getQuestions();
    newQuestions.forEach(question => {
      const idx = questions.findIndex(q => q.id === question.id);
      if (idx >= 0) {
        questions[idx] = question;
      } else {
        questions.push(question);
      }
    });
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    this.notify();
  }
  static deleteQuestion(id: string) {
    const questions = this.getQuestions().filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    this.notify();
  }
  static deleteQuestions(ids: string[]) {
    const idSet = new Set(ids);
    const questions = this.getQuestions().filter(q => !idSet.has(q.id));
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    this.notify();
  }

  // --- Exam Packages ---
  static getExamPackages(): ExamPackage[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAM_PACKAGES);
    if (!raw) return DEFAULT_EXAM_PACKAGES;
    try {
      const packages: ExamPackage[] = JSON.parse(raw);
      let changed = false;
      DEFAULT_EXAM_PACKAGES.forEach(defPkg => {
        if (!packages.some(p => p.id === defPkg.id)) {
          packages.push(defPkg);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(STORAGE_KEYS.EXAM_PACKAGES, JSON.stringify(packages));
      }
      return packages;
    } catch {
      return DEFAULT_EXAM_PACKAGES;
    }
  }
  static saveExamPackage(pkg: ExamPackage) {
    const packages = this.getExamPackages();
    const idx = packages.findIndex(p => p.id === pkg.id);
    if (idx >= 0) {
      packages[idx] = pkg;
    } else {
      packages.unshift(pkg);
    }
    localStorage.setItem(STORAGE_KEYS.EXAM_PACKAGES, JSON.stringify(packages));
    this.notify();
  }
  static deleteExamPackage(id: string) {
    const packages = this.getExamPackages().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXAM_PACKAGES, JSON.stringify(packages));
    this.notify();
  }

  static getExamSessions(): StudentExamSession[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAM_SESSIONS);
    let sessions: StudentExamSession[] = raw ? JSON.parse(raw) : DEFAULT_EXAM_SESSIONS;
    let changed = false;

    // Pastikan sesi default minimal selalu ada
    DEFAULT_EXAM_SESSIONS.forEach(defS => {
      if (!sessions.some(s => s.id === defS.id)) {
        sessions.push(defS);
        changed = true;
      }
    });

    // Sinkronkan grade dan rombel sesuai data siswa aktif
    try {
      const users = this.getUsers();
      sessions.forEach(s => {
        const student = users.find(u => u.id === s.studentId);
        if (student) {
          if (student.grade && s.grade !== student.grade) {
            s.grade = student.grade;
            changed = true;
          }
          if (student.rombel && s.rombel !== student.rombel) {
            s.rombel = student.rombel;
            changed = true;
          }
          if (student.schoolId && s.schoolId !== student.schoolId) {
            s.schoolId = student.schoolId;
            changed = true;
          }
        }
      });
    } catch {
      // fallback
    }

    if (changed || !raw) {
      localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(sessions));
    }
    return sessions;
  }
  static saveExamSession(session: StudentExamSession) {
    const sessions = this.getExamSessions();
    const idx = sessions.findIndex(
      s => s.id === session.id || (s.studentId === session.studentId && s.examPackageId === session.examPackageId)
    );
    if (idx >= 0) {
      sessions[idx] = session;
    } else {
      sessions.push(session);
    }
    localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(sessions));
    this.notify();
  }

  // --- Activity Logs ---
  static getActivityLogs(): ActivityLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    return raw ? JSON.parse(raw) : [];
  }
  static logActivity(userName: string, role: any, action: string, details: string) {
    const logs = this.getActivityLogs();
    const newLog: ActivityLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userName,
      role,
      action,
      details
    };
    logs.unshift(newLog);
    if (logs.length > 200) logs.pop();
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
    this.notify();
  }
}
