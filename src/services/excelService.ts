import * as XLSX from 'xlsx';
import { School, User, Question, ExamPackage, StudentExamSession, Subject } from '../types';

export class ExcelService {
  /**
   * Helper to write a workbook and trigger browser download
   */
  private static downloadWorkbook(wb: XLSX.WorkBook, fileName: string) {
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  // ================= 1. EXPORT SEKOLAH =================
  static exportSchools(schools: School[], districtName: string, academicYear: string) {
    const data = schools.map((s, idx) => ({
      'No': idx + 1,
      'NPSN': s.npsn,
      'Nama Sekolah': s.name,
      'Status': s.status,
      'Kecamatan': s.district,
      'Desa / Kelurahan': s.village,
      'Alamat': s.address,
      'Kepala Sekolah': s.principalName,
      'NIP Kepala Sekolah': s.principalNip || '-',
      'Nama Operator': s.operatorName,
      'Nomor Kontak': s.phone,
      'Email Sekolah': s.email,
      'Status Akun': s.isActive ? 'Aktif' : 'Nonaktif'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Sekolah');
    this.downloadWorkbook(wb, `Data_Sekolah_${districtName.replace(/\s+/g, '_')}_${academicYear.replace('/', '-')}`);
  }

  // ================= 2. EXPORT GURU =================
  static exportTeachers(teachers: User[], schools: School[], subjects: Subject[]) {
    const data = teachers.map((t, idx) => {
      const school = schools.find(s => s.id === t.schoolId);
      const subNames = (t.subjects || [])
        .map(subId => subjects.find(s => s.id === subId)?.name)
        .filter(Boolean)
        .join(', ');

      return {
        'No': idx + 1,
        'Nama Lengkap Guru': t.fullName,
        'NIP': t.nip || '-',
        'Sekolah Tugas': school ? school.name : t.schoolName || '-',
        'Mata Pelajaran': subNames || 'Guru Kelas',
        'Kelas Diajar': (t.classes || []).join(', ') || '-',
        'Username': t.username,
        'Nomor Kontak': t.phone || '-',
        'Email': t.email || '-',
        'Status Akun': t.isActive ? 'Aktif' : 'Nonaktif'
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Guru');
    this.downloadWorkbook(wb, `Data_Guru_Kecamatan_${new Date().toISOString().slice(0, 10)}`);
  }

  // ================= 2B. EXPORT PEMBUAT SOAL =================
  static exportQuestionAuthors(authors: User[], schools: School[], subjects: Subject[], questions: Question[]) {
    const data = authors.map((a, idx) => {
      const school = schools.find(s => s.id === a.schoolId);
      const subNames = (a.subjects || [])
        .map(subId => subjects.find(s => s.id === subId)?.name)
        .filter(Boolean)
        .join(', ');
      
      const qCount = questions.filter(
        q => (q.authorName && (q.authorName.toLowerCase() === a.fullName.toLowerCase() || (a.username === 'pembuat_soal' && q.authorName.includes('Budi Santoso')))) ||
             (q.schoolId && q.schoolId === a.schoolId && a.isQuestionAuthor)
      ).length;

      return {
        'No': idx + 1,
        'Nama Lengkap & Gelar': a.fullName,
        'NIP': a.nip || '-',
        'Satuan Pendidikan': school ? school.name : a.schoolName || '-',
        'Mata Pelajaran Spesialisasi': subNames || 'Seluruh Mapel',
        'Jumlah Soal Disusun': qCount,
        'Username Akun': a.username,
        'Nomor Kontak WA': a.phone || '-',
        'Email': a.email || '-',
        'Status Penugasan': a.isActive ? 'Aktif (Diberi Hak)' : 'Nonaktif'
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Pembuat Soal');
    this.downloadWorkbook(wb, `Tim_Penyusun_Soal_Kecamatan_${new Date().toISOString().slice(0, 10)}`);
  }

  // ================= 2C. DOWNLOAD TEMPLATE PEMBUAT & PENULIS NASKAH SOAL =================
  static downloadQuestionAuthorsTemplate(schools: School[] = [], subjects: Subject[] = []) {
    const sample = [
      {
        'No': 1,
        'Nama_Lengkap': 'Drs. Bambang Sudarsono, M.Pd.',
        'NIP': '19820514 200801 1 012',
        'Asal_Sekolah': schools[0]?.name || 'SD Negeri 1 Ampelgading',
        'NPSN_Sekolah': schools[0]?.npsn || '20214501',
        'Spesialis_Mapel': 'Matematika, Ilmu Pengetahuan Alam dan Sosial (IPAS)',
        'Jumlah_Soal_Target': 25,
        'Username': 'penulis_bambang',
        'Password': 'password123',
        'Nomor_WhatsApp': '081234567890',
        'Email': 'bambang.cbt@gmail.com',
        'Status': 'Aktif',
        'Catatan': 'Penyusun Naskah Soal Ujian Matematika Kelas 6'
      },
      {
        'No': 2,
        'Nama_Lengkap': 'Siti Nurhaliza, S.Pd.',
        'NIP': '19890322 201402 2 004',
        'Asal_Sekolah': schools[1]?.name || 'SD Negeri 2 Ampelgading',
        'NPSN_Sekolah': schools[1]?.npsn || '20214502',
        'Spesialis_Mapel': 'Bahasa Indonesia, Pendidikan Pancasila',
        'Jumlah_Soal_Target': 20,
        'Username': 'penulis_siti',
        'Password': 'password123',
        'Nomor_WhatsApp': '081398765432',
        'Email': 'siti.nurhaliza@sekolah.id',
        'Status': 'Aktif',
        'Catatan': 'Penyusun Soal Literasi & Bahasa Indonesia'
      },
      {
        'No': 3,
        'Nama_Lengkap': 'Ust. Ahmad Dahlan, S.Pd.I.',
        'NIP': '-',
        'Asal_Sekolah': schools[3]?.name || 'SDIT Insan Cendekia Ampelgading',
        'NPSN_Sekolah': schools[3]?.npsn || '20214504',
        'Spesialis_Mapel': 'Pendidikan Agama Islam',
        'Jumlah_Soal_Target': 15,
        'Username': 'penulis_dahlan',
        'Password': 'password123',
        'Nomor_WhatsApp': '085711223344',
        'Email': 'ahmad.dahlan@insancendekia.sch.id',
        'Status': 'Aktif',
        'Catatan': 'Penyusun Soal PAI Tingkat Kecamatan'
      }
    ];

    const wsData = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsData, 'Data Pembuat Soal');

    // Sheet 2: Referensi Sekolah Resmi
    const refSchools = schools.map((s, idx) => ({
      'No': idx + 1,
      'Nama Satuan Pendidikan': s.name,
      'NPSN': s.npsn,
      'Status': s.status,
      'Desa': s.village
    }));
    const wsSchools = XLSX.utils.json_to_sheet(refSchools);
    XLSX.utils.book_append_sheet(wb, wsSchools, 'Ref Satuan Pendidikan');

    // Sheet 3: Referensi Mata Pelajaran Resmi
    const refSubjects = subjects.map((sub, idx) => ({
      'No': idx + 1,
      'Kode Mapel': sub.code,
      'Nama Mata Pelajaran': sub.name,
      'Agama (Khusus)': sub.religion || '-'
    }));
    const wsSubjects = XLSX.utils.json_to_sheet(refSubjects);
    XLSX.utils.book_append_sheet(wb, wsSubjects, 'Ref Mata Pelajaran');

    this.downloadWorkbook(wb, 'Template_Impor_Tim_Pembuat_Soal_Kecamatan');
  }

  // ================= 3. EXPORT SISWA / PESERTA =================
  static exportStudents(students: User[], schools: School[], academicYear: string, onlyParticipants = false) {
    const list = onlyParticipants ? students.filter(s => s.isActive) : students;
    const data = list.map((st, idx) => {
      const school = schools.find(s => s.id === st.schoolId);
      return {
        'No': idx + 1,
        'No Peserta Ujian': st.participantNumber || '-',
        'NISN': st.nisn || '-',
        'Nama Lengkap Siswa': st.fullName,
        'Agama': st.religion || 'Islam',
        'Nama Sekolah': school ? school.name : st.schoolName || '-',
        'Kelas': `Kelas ${st.grade || 6}${st.rombel || 'A'}`,
        'Tahun Pelajaran': academicYear,
        'Status Peserta': st.isActive ? 'Peserta Terdaftar' : 'Belum Aktif',
        'Username': st.username
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, onlyParticipants ? 'Peserta Ujian' : 'Data Siswa');
    this.downloadWorkbook(wb, `${onlyParticipants ? 'Daftar_Peserta_Ujian' : 'Data_Siswa'}_${academicYear.replace('/', '-')}`);
  }

  // ================= 4. EXPORT BANK SOAL =================
  static exportQuestions(questions: Question[], subjects: Subject[]) {
    const data = questions.map((q, idx) => {
      const sub = subjects.find(s => s.id === q.subjectId);
      let typeLabel = 'Pilihan Ganda';
      if (q.type === 'complex_mcq') typeLabel = 'Pilihan Ganda Kompleks';
      else if (q.type === 'matching') typeLabel = 'Menjodohkan';
      else if (q.type === 'true_false') typeLabel = 'Benar / Salah';

      let answersStr = '';
      if (q.type === 'mcq') {
        answersStr = `Kunci: ${q.correctAnswer || '-'}`;
      } else if (q.type === 'complex_mcq') {
        answersStr = (q.complexOptions || [])
          .filter(o => o.isCorrect)
          .map(o => o.label)
          .join('; ');
      } else if (q.type === 'matching') {
        answersStr = (q.matchingPairs || [])
          .map(p => `${p.leftPrompt} -> ${p.rightAnswer}`)
          .join(' | ');
      } else if (q.type === 'true_false') {
        if (q.trueFalseItems && q.trueFalseItems.length > 0) {
          answersStr = q.trueFalseItems
            .map((item, i) => `${i + 1}. [${item.isCorrect ? 'BENAR' : 'SALAH'}] ${item.statement}`)
            .join(' | ');
        } else {
          answersStr = q.trueFalseAnswer ? 'BENAR' : 'SALAH';
        }
      }

      return {
        'No': idx + 1,
        'Mata Pelajaran': sub ? sub.name : q.subjectId,
        'Kelas': q.grade,
        'Semester': q.semester,
        'Tahun Ajaran': q.academicYear,
        'Tingkat Kesulitan': q.difficulty,
        'Jenis Soal': typeLabel,
        'Isi Pertanyaan': q.questionText,
        'Kunci Jawaban': answersStr,
        'Bobot Poin': q.points,
        'Ada Gambar': q.imageUrl ? 'Ya' : 'Tidak',
        'Keterangan Gambar': q.imageCaption || '-',
        'Pembahasan': q.discussion || '-',
        'Status': q.status,
        'Pembuat': q.authorName
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bank Soal');
    this.downloadWorkbook(wb, `Bank_Soal_Kecamatan_${new Date().toISOString().slice(0, 10)}`);
  }

  // ================= 5. EXPORT HASIL UJIAN & REKAP NILAI =================
  static exportExamResults(
    sessions: StudentExamSession[],
    examTitle: string,
    schoolNameFilter = 'Semua_Sekolah',
    users?: User[]
  ) {
    const data = sessions.map((s, idx) => {
      const matchedUser = users?.find(u => u.id === s.studentId || u.participantNumber === s.participantNumber);
      return {
        'No': idx + 1,
        'No Peserta': s.participantNumber,
        'NISN': s.nisn,
        'Nama Siswa': s.studentName,
        'Agama': matchedUser?.religion || 'Islam',
        'Sekolah': s.schoolName,
        'Kelas': `Kelas ${s.grade}${s.rombel}`,
        'Nilai Akhir': s.score,
        'Jumlah Benar': s.totalCorrect,
        'Jumlah Salah': s.totalIncorrect,
        'Tidak Dijawab': s.totalUnanswered,
        'Status': s.isPassed ? 'TUNTAS' : 'REMEDIAL',
        'Waktu Mulai': s.startedAt ? s.startedAt.replace('T', ' ').slice(0, 19) : '-',
        'Waktu Selesai': s.finishedAt ? s.finishedAt.replace('T', ' ').slice(0, 19) : '-',
        'Durasi (Menit)': s.durationSpentSeconds ? Math.round(s.durationSpentSeconds / 60) : '-'
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hasil Ujian');
    this.downloadWorkbook(wb, `Hasil_Ujian_${examTitle.replace(/\s+/g, '_')}_${schoolNameFilter.replace(/\s+/g, '_')}`);
  }

  static exportSchoolSummary(
    data: Array<{
      no: number;
      npsn: string;
      schoolName: string;
      status: string;
      totalStudents: number;
      averageScore: number;
      maxScore: number;
      minScore: number;
      passedCount: number;
      passRate: string;
      remedialCount: number;
    }>,
    filename = 'Rekap_Nilai_Per_Sekolah'
  ) {
    const formatted = data.map(d => ({
      'No': d.no,
      'NPSN': d.npsn,
      'Nama Sekolah': d.schoolName,
      'Status': d.status,
      'Jumlah Peserta': d.totalStudents,
      'Rata-Rata Nilai': d.averageScore,
      'Nilai Tertinggi': d.maxScore,
      'Nilai Terendah': d.minScore,
      'Jumlah Tuntas': d.passedCount,
      'Persentase Kelulusan': d.passRate,
      'Jumlah Remedial': d.remedialCount
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Sekolah');
    this.downloadWorkbook(wb, filename);
  }

  static exportSubjectSummary(
    data: Array<{
      no: number;
      code: string;
      subjectName: string;
      totalParticipants: number;
      averageScore: number;
      maxScore: number;
      minScore: number;
      passedCount: number;
      passRate: string;
    }>,
    filename = 'Rekap_Nilai_Per_Mata_Pelajaran'
  ) {
    const formatted = data.map(d => ({
      'No': d.no,
      'Kode Mapel': d.code,
      'Mata Pelajaran': d.subjectName,
      'Jumlah Peserta': d.totalParticipants,
      'Rata-Rata Nilai': d.averageScore,
      'Nilai Tertinggi': d.maxScore,
      'Nilai Terendah': d.minScore,
      'Jumlah Tuntas': d.passedCount,
      'Persentase Ketuntasan': d.passRate
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Mata Pelajaran');
    this.downloadWorkbook(wb, filename);
  }

  // ================= 6. DOWNLOAD TEMPLATES =================
  static downloadSchoolImportTemplate() {
    const sample = [
      {
        'NPSN': '20214505',
        'Nama_Sekolah': 'SD Negeri 4 Ampelgading',
        'Status': 'Negeri',
        'Alamat': 'Jl. Kenanga No. 04',
        'Desa_Kelurahan': 'Tirtomoyo',
        'Kepala_Sekolah': 'Drs. Supriyadi, M.Pd.',
        'NIP_Kepala_Sekolah': '19750512 200003 1 002',
        'Nama_Operator': 'Hendra Wijaya',
        'Nomor_Telepon': '0812-3344-5566',
        'Email_Sekolah': 'sdn4ampelgading@gmail.com'
      },
      {
        'NPSN': '20214506',
        'Nama_Sekolah': 'SD Swasta Teladan',
        'Status': 'Swasta',
        'Alamat': 'Jl. Melati No. 18',
        'Desa_Kelurahan': 'Lebakharjo',
        'Kepala_Sekolah': 'Hj. Ratna Sari, S.Pd.',
        'NIP_Kepala_Sekolah': '-',
        'Nama_Operator': 'Gilang Ramadhan',
        'Nomor_Telepon': '0813-7788-9900',
        'Email_Sekolah': 'sdteladan@gmail.com'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Sekolah');
    this.downloadWorkbook(wb, 'Template_Impor_Sekolah_SD');
  }

  static downloadTeacherImportTemplate(schools: School[]) {
    const sample = [
      {
        'NIP': '19870312 201101 1 005',
        'Nama_Lengkap': 'Ahmad Zulkarnain, S.Pd.',
        'Jenis_Kelamin': 'L',
        'NPSN_Sekolah': schools[0]?.npsn || '20214501',
        'Nama_Sekolah': schools[0]?.name || 'SD Negeri 1 Ampelgading',
        'Mata_Pelajaran': 'Matematika',
        'Kelas_Diajar': 'Kelas 6A, Kelas 6B',
        'Username': 'guru_ahmad',
        'Password_Awal': 'password123',
        'Nomor_Telepon': '0812-9988-1122',
        'Email': 'ahmad@sekolah.id'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Guru');
    this.downloadWorkbook(wb, 'Template_Impor_Guru_SD');
  }

  static downloadStudentImportTemplate() {
    const sample = [
      {
        'Nomor_Peserta': '01-054-009-0',
        'NISN': '0123456789',
        'Nama_Lengkap': 'Fathir Ahmad Pratama',
        'Agama': 'Islam',
        'Jenis_Kelamin': 'L',
        'NPSN_Sekolah': '20214501',
        'Nama_Sekolah': 'SD Negeri 1 Ampelgading',
        'Kelas': 6,
        'Rombel': 'A',
        'Username': 'siswa_fathir',
        'Password_Awal': 'password123'
      },
      {
        'Nomor_Peserta': '01-054-010-9',
        'NISN': '0123456790',
        'Nama_Lengkap': 'Citra Kirana',
        'Agama': 'Kristen',
        'Jenis_Kelamin': 'P',
        'NPSN_Sekolah': '20214501',
        'Nama_Sekolah': 'SD Negeri 1 Ampelgading',
        'Kelas': 6,
        'Rombel': 'A',
        'Username': 'siswa_citra',
        'Password_Awal': 'password123'
      },
      {
        'Nomor_Peserta': '01-054-011-8',
        'NISN': '0123456791',
        'Nama_Lengkap': 'Ignatius Kevin',
        'Agama': 'Katolik',
        'Jenis_Kelamin': 'L',
        'NPSN_Sekolah': '20214501',
        'Nama_Sekolah': 'SD Negeri 1 Ampelgading',
        'Kelas': 6,
        'Rombel': 'A',
        'Username': 'siswa_kevin',
        'Password_Awal': 'password123'
      },
      {
        'Nomor_Peserta': '01-054-012-7',
        'NISN': '0123456792',
        'Nama_Lengkap': 'Ni Made Suwartini',
        'Agama': 'Hindu',
        'Jenis_Kelamin': 'P',
        'NPSN_Sekolah': '20214502',
        'Nama_Sekolah': 'SD Negeri 2 Ampelgading',
        'Kelas': 6,
        'Rombel': 'A',
        'Username': 'siswa_suwartini',
        'Password_Awal': 'password123'
      },
      {
        'Nomor_Peserta': '01-054-013-6',
        'NISN': '0123456793',
        'Nama_Lengkap': 'Venerable Metta',
        'Agama': 'Buddha',
        'Jenis_Kelamin': 'P',
        'NPSN_Sekolah': '20214502',
        'Nama_Sekolah': 'SD Negeri 2 Ampelgading',
        'Kelas': 6,
        'Rombel': 'A',
        'Username': 'siswa_metta',
        'Password_Awal': 'password123'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
    this.downloadWorkbook(wb, 'Template_Impor_Siswa_SD');
  }

  static downloadQuestionImportTemplate() {
    const sample = [
      {
        'No': 1,
        'Jenis_Soal': 'Pilihan Ganda',
        'Mata_Pelajaran': 'Matematika',
        'Kelas': 6,
        'Pertanyaan': 'Berapakah hasil dari 25 x 4 + 15?',
        'Opsi_A': '115',
        'Opsi_B': '125',
        'Opsi_C': '105',
        'Opsi_D': '95',
        'Kunci_Jawaban': 'A',
        'Bobot_Nilai': 10,
        'Tingkat_Kesulitan': 'mudah',
        'Topik': 'Operasi Hitung Campuran',
        'Pembahasan': '25 x 4 = 100, ditambah 15 menjadi 115'
      },
      {
        'No': 2,
        'Jenis_Soal': 'Pilihan Ganda Kompleks',
        'Mata_Pelajaran': 'Matematika',
        'Kelas': 6,
        'Pertanyaan': 'Manakah yang merupakan sifat-sifat bangun kubus? (Pilih semua yang benar)',
        'Opsi_A': 'Memiliki 6 sisi persegi yang kongruen',
        'Opsi_B': 'Memiliki 12 rusuk sama panjang',
        'Opsi_C': 'Memiliki 8 titik sudut',
        'Opsi_D': 'Alasnya selalu berbentuk lingkaran',
        'Kunci_Jawaban': 'A, B, C',
        'Bobot_Nilai': 15,
        'Tingkat_Kesulitan': 'sedang',
        'Topik': 'Bangun Ruang',
        'Pembahasan': 'Kubus memiliki 6 sisi persegi, 12 rusuk sama panjang, dan 8 titik sudut.'
      },
      {
        'No': 3,
        'Jenis_Soal': 'Menjodohkan',
        'Mata_Pelajaran': 'Matematika',
        'Kelas': 6,
        'Pertanyaan': 'Pasangkan nama bangun ruang dengan rumus volumenya!',
        'Opsi_A': 'Volume Kubus : s x s x s',
        'Opsi_B': 'Volume Balok : p x l x t',
        'Opsi_C': 'Volume Tabung : pi x r2 x t',
        'Opsi_D': 'Volume Kerucut : 1/3 x pi x r2 x t',
        'Kunci_Jawaban': 'A, B, C, D',
        'Bobot_Nilai': 20,
        'Tingkat_Kesulitan': 'sedang',
        'Topik': 'Volume Bangun Ruang',
        'Pembahasan': 'Pasangan rumus volume bangun ruang terstandar.'
      },
      {
        'No': 4,
        'Jenis_Soal': 'Benar Salah',
        'Mata_Pelajaran': 'Pendidikan Pancasila',
        'Kelas': 6,
        'Pertanyaan': 'Tentukan apakah masing-masing pernyataan tentang Hak dan Kewajiban WNI berikut BENAR atau SALAH!',
        'Opsi_A': 'Mendapatkan pendidikan layak adalah hak setiap warga negara',
        'Opsi_B': 'Membayar pajak tepat waktu adalah hak setiap warga negara',
        'Opsi_C': 'Menjaga keamanan dan ketertiban adalah kewajiban warga negara',
        'Opsi_D': 'Mematuhi hukum dan peraturan hanya berlaku untuk orang dewasa',
        'Kunci_Jawaban': 'BENAR, SALAH, BENAR, SALAH',
        'Bobot_Nilai': 20,
        'Tingkat_Kesulitan': 'sedang',
        'Topik': 'Hak dan Kewajiban WNI',
        'Pembahasan': 'Pernyataan 1 Benar (Hak), Pernyataan 2 Salah (Kewajiban), Pernyataan 3 Benar (Kewajiban), Pernyataan 4 Salah (Berlaku untuk semua warga negara).'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Soal');
    this.downloadWorkbook(wb, 'Template_Impor_Bank_Soal_Semua_Tipe');
  }

  // ================= 6B. DOWNLOAD TEMPLATE KHUSUS BENAR / SALAH (4-5 BUTIR) =================
  static downloadTrueFalseSpecialTemplate() {
    const sample = [
      {
        'No': 1,
        'Jenis_Soal': 'Benar Salah',
        'Mata_Pelajaran': 'Pendidikan Pancasila',
        'Kelas': 6,
        'Pertanyaan': 'Tentukan apakah masing-masing pernyataan mengenai nilai-nilai Pancasila berikut BENAR atau SALAH!',
        'Pernyataan_1': 'Menghormati hak orang lain beribadah merupakan pengamalan Sila Pertama.',
        'Kunci_1': 'BENAR',
        'Pernyataan_2': 'Memaksakan kehendak kepada orang lain diperbolehkan selama demi kebaikan bersama.',
        'Kunci_2': 'SALAH',
        'Pernyataan_3': 'Membantu korban musibah tanpa membedakan suku/agama adalah wujud Sila Kedua.',
        'Kunci_3': 'BENAR',
        'Pernyataan_4': 'Mementingkan kepentingan pribadi di atas kepentingan umum merupakan sikap terpuji.',
        'Kunci_4': 'SALAH',
        'Pernyataan_5': '',
        'Kunci_5': '',
        'Bobot_Nilai': 20,
        'Tingkat_Kesulitan': 'sedang',
        'Topik': 'Nilai-Nilai Pancasila',
        'Pembahasan': 'Pernyataan 1 Benar (Sila 1), Pernyataan 2 Salah (Tidak boleh memaksakan), Pernyataan 3 Benar (Sila 2), Pernyataan 4 Salah (Harus utamakan kepentingan umum).'
      },
      {
        'No': 2,
        'Jenis_Soal': 'Benar Salah',
        'Mata_Pelajaran': 'Matematika',
        'Kelas': 6,
        'Pertanyaan': 'Perhatikan konsep bilangan bulat berikut, tentukan BENAR atau SALAH untuk tiap butir pernyataan!',
        'Pernyataan_1': 'Bilangan negatif semakin ke kiri pada garis bilangan nilainya semakin kecil.',
        'Kunci_1': 'BENAR',
        'Pernyataan_2': 'Hasil dari (-8) + 15 bernilai negatif.',
        'Kunci_2': 'SALAH',
        'Pernyataan_3': 'Lawan dari bilangan bulat -40 adalah 40.',
        'Kunci_3': 'BENAR',
        'Pernyataan_4': 'Bilangan -12 nilainya lebih besar daripada -5.',
        'Kunci_4': 'SALAH',
        'Pernyataan_5': '',
        'Kunci_5': '',
        'Bobot_Nilai': 20,
        'Tingkat_Kesulitan': 'sedang',
        'Topik': 'Bilangan Bulat',
        'Pembahasan': '1. Benar; 2. Salah ((-8)+15 = +7); 3. Benar; 4. Salah (-12 < -5).'
      },
      {
        'No': 3,
        'Jenis_Soal': 'Benar Salah',
        'Mata_Pelajaran': 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
        'Kelas': 6,
        'Pertanyaan': 'Analisis pernyataan mengenai rantai makanan dan ekosistem berikut apakah BENAR atau SALAH!',
        'Pernyataan_1': 'Tumbuhan hijau bertindak sebagai produsen utama karena mampu berfotosintesis.',
        'Kunci_1': 'BENAR',
        'Pernyataan_2': 'Herbivora merupakan konsumen tingkat pertama pemakan tumbuhan.',
        'Kunci_2': 'BENAR',
        'Pernyataan_3': 'Karnivora mendapatkan energi langsung dari memakan rumput dan dedaunan.',
        'Kunci_3': 'SALAH',
        'Pernyataan_4': 'Bakteri dan jamur berperan sebagai dekomposer / pengurai dalam ekosistem.',
        'Kunci_4': 'BENAR',
        'Pernyataan_5': 'Kepunahan satu populasi tidak akan mempengaruhi keseimbangan rantai makanan.',
        'Kunci_5': 'SALAH',
        'Bobot_Nilai': 25,
        'Tingkat_Kesulitan': 'sedang',
        'Topik': 'Ekosistem & Rantai Makanan',
        'Pembahasan': '1. Benar; 2. Benar; 3. Salah (karnivora pemakan daging); 4. Benar; 5. Salah (rantai makanan saling terkait erat).'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Benar-Salah');
    this.downloadWorkbook(wb, 'Template_Impor_Benar_Salah_4_5_Butir');
  }

  // ================= 7. PARSE FILE & ROW-BY-ROW VALIDATION =================
  static async parseExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }
}
