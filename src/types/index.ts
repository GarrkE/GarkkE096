export type UserRole = 'admin' | 'guru' | 'siswa';

export type StudentReligion = 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  fullName: string;
  email?: string;
  phone?: string;
  schoolId?: string; // For teachers & students
  schoolName?: string;
  avatar?: string;
  grade?: number; // For students (1-6)
  rombel?: string; // e.g. "A", "B"
  participantNumber?: string; // For students: "01-054-001-8"
  nisn?: string;
  nip?: string;
  religion?: StudentReligion; // Agama siswa (Islam, Kristen, Katolik, Hindu, Buddha)
  subjects?: string[]; // For teachers: subject IDs
  classes?: string[]; // For teachers: e.g. ["Kelas 4A", "Kelas 5A", "Kelas 6A"]
  isQuestionAuthor?: boolean; // Khusus Guru Pembuat Naskah Ujian (penyusun soal terintegrasi impor naskah)
  isActive: boolean;
  createdAt: string;
}

export interface School {
  id: string;
  npsn: string;
  name: string;
  status: 'Negeri' | 'Swasta';
  address: string;
  village: string;
  district: string;
  principalName: string;
  principalNip?: string;
  operatorName: string;
  phone: string;
  email: string;
  isActive: boolean;
  studentCount?: number;
  teacherCount?: number;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  iconName: string;
  religion?: StudentReligion; // Jika diset, hanya siswa beragama ini yang mengikuti ujiannya
}

export interface ClassItem {
  id: string;
  grade: number; // 1-6
  rombel: string; // "A", "B", "C"
  name: string; // "Kelas 6A"
}

export type QuestionType = 'mcq' | 'complex_mcq' | 'matching' | 'true_false';

export interface MCQOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
  imageUrl?: string;
}

export interface MatchingPair {
  id: string;
  leftPrompt: string; // Pernyataan di sebelah kiri
  rightAnswer: string; // Pasangan jawaban di sebelah kanan
}

export interface TrueFalseItem {
  id: string;
  statement: string; // Butir pernyataan (1 nomor soal memuat 4 sampai 5 butir pernyataan)
  isCorrect: boolean; // Kunci jawaban: true = BENAR, false = SALAH
}

export interface Question {
  id: string;
  subjectId: string;
  grade: number; // 1 - 6
  semester: 'Ganjil' | 'Genap';
  academicYear: string;
  topic: string;
  indicator?: string;
  difficulty: 'mudah' | 'sedang' | 'sulit';
  type: QuestionType;
  questionText: string;
  
  // Fitur Gambar Soal
  imageUrl?: string;
  imageCaption?: string;
  imagePosition: 'top' | 'middle' | 'bottom';
  imageWidth?: number; // e.g., 300, 450, 600
  
  // Opsi & Kunci untuk MCQ (Pilihan Ganda Biasa)
  options?: MCQOption[];
  correctAnswer?: 'A' | 'B' | 'C' | 'D';

  // Opsi & Kunci untuk Complex MCQ (Pilihan Ganda Kompleks - multi correct)
  complexOptions?: { id: string; label: string; isCorrect: boolean }[];

  // Data untuk Menjodohkan
  matchingPairs?: MatchingPair[];

  // Data untuk Benar / Salah (Multi 4 sampai 5 Pernyataan per nomor soal)
  trueFalseItems?: TrueFalseItem[];
  trueFalseStatement?: string;
  trueFalseAnswer?: boolean; // fallback single boolean

  discussion?: string;
  points: number; // Bobot nilai
  orderNumber?: number; // Nomor urut soal sesuai naskah Excel (1, 2, 3...)
  status: 'draft' | 'ready' | 'archived';
  authorName: string;
  authorRole: UserRole;
  schoolId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExamStatus = 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export interface ExamPackage {
  id: string;
  title: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  grade: number; // 1-6
  subjectId: string;
  schoolIds: string[]; // ['ALL'] or specific school IDs
  classIds: string[];
  examDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  totalQuestions: number;
  totalPoints: number;
  status: ExamStatus;
  showScoreImmediately: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questionIds: string[];
  createdAt: string;
}

export interface StudentAnswer {
  questionId: string;
  type: QuestionType;
  answerMcq?: 'A' | 'B' | 'C' | 'D';
  answerComplexMcq?: string[]; // array of selected option IDs
  answerMatching?: Record<string, string>; // leftPrompt -> selected rightAnswer
  answerTrueFalse?: boolean;
  answerTrueFalseMulti?: Record<string, boolean>; // itemId -> boolean (true = BENAR, false = SALAH)
  isReviewed?: boolean;
  isCorrect?: boolean;
  earnedPoints?: number;
  maxPoints: number;
  answeredAt?: string;
}

export interface StudentExamSession {
  id: string;
  examPackageId: string;
  studentId: string;
  studentName: string;
  participantNumber: string;
  nisn: string;
  schoolId: string;
  schoolName: string;
  grade: number;
  rombel: string;
  startedAt?: string;
  finishedAt?: string;
  durationSpentSeconds: number;
  status: 'not_started' | 'ongoing' | 'submitted' | 'graded';
  answers: Record<string, StudentAnswer>;
  reviewedQuestionIds: string[];
  score: number; // Scaled to 0 - 100
  totalCorrect: number;
  totalIncorrect: number;
  totalUnanswered: number;
  isPassed: boolean; // >= KKM
  gradedAt?: string;
  gradedBy?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userName: string;
  role: UserRole;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface SystemSettings {
  districtName: string; // e.g. "Kecamatan Sukamaju"
  regencyName: string; // e.g. "Kabupaten Bandung"
  provinceName: string; // e.g. "Jawa Barat"
  academicYear: string; // e.g. "2024/2025"
  activeSemester: 'Ganjil' | 'Genap';
  defaultKkm: number; // e.g. 75
  korwilHeadName: string; // e.g. "Drs. H. Ahmad Fauzi, M.Pd."
  korwilHeadNip: string; // e.g. "19680712 199303 1 004"
  appTitle: string;
  phone: string;
  email: string;
  address: string;
}
