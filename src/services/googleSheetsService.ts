import { getAccessToken } from './authGoogle';
import { School, User, Question, Subject, SystemSettings } from '../types';

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: {
    sheetId: number;
    title: string;
    rowCount?: number;
    columnCount?: number;
  }[];
}

export class GoogleSheetsService {
  /**
   * Helper to extract a spreadsheet ID from a full Google Sheets URL or raw ID string.
   */
  static extractSpreadsheetId(input: string): string | null {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();
    // Matches https://docs.google.com/spreadsheets/d/{ID}/edit...
    const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }
    // If it's already an ID (typically 30-60 alphanumeric characters with hyphens/underscores)
    if (/^[a-zA-Z0-9-_]{20,80}$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  }

  /**
   * Get spreadsheet metadata including sheet tabs
   */
  static async getSpreadsheetMetadata(spreadsheetId: string): Promise<SpreadsheetMetadata> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Belum terhubung dengan akun Google. Silakan klik tombol "Hubungkan Akun Google" terlebih dahulu.');
    }

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const msg = errJson?.error?.message || `Gagal mengakses spreadsheet (${res.status} ${res.statusText})`;
      if (res.status === 404) {
        throw new Error('Spreadsheet tidak ditemukan. Pastikan link atau ID Google Spreadsheet benar.');
      }
      if (res.status === 403) {
        throw new Error('Akses ditolak. Pastikan akun Google Anda memiliki hak akses melihat/mengedit spreadsheet ini.');
      }
      throw new Error(msg);
    }

    const data = await res.json();
    return {
      spreadsheetId: data.spreadsheetId,
      title: data.properties?.title || 'Google Spreadsheet',
      sheets: (data.sheets || []).map((s: any) => ({
        sheetId: s.properties?.sheetId,
        title: s.properties?.title || 'Sheet1',
        rowCount: s.properties?.gridProperties?.rowCount,
        columnCount: s.properties?.gridProperties?.columnCount
      }))
    };
  }

  /**
   * Fetch rows from a specific sheet/tab name
   */
  static async fetchSheetRows(spreadsheetId: string, sheetTitle: string): Promise<any[]> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Belum terhubung dengan akun Google.');
    }

    const encodedRange = encodeURIComponent(`${sheetTitle}!A1:ZZ1000`);
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueRenderOption=FORMATTED_VALUE`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.error?.message || 'Gagal mengambil baris data dari Google Spreadsheet');
    }

    const data = await res.json();
    const values: any[][] = data.values || [];
    if (values.length < 2) {
      return []; // empty or only header row
    }

    const headers = values[0].map(h => String(h || '').trim());
    const rows: any[] = [];

    for (let r = 1; r < values.length; r++) {
      const rowArr = values[r];
      // Skip empty row
      if (!rowArr || rowArr.length === 0 || rowArr.every(cell => cell === '' || cell === null || cell === undefined)) {
        continue;
      }

      const rowObj: Record<string, any> = {};
      headers.forEach((header, colIdx) => {
        if (header) {
          rowObj[header] = rowArr[colIdx] !== undefined ? rowArr[colIdx] : '';
        }
      });
      rows.push(rowObj);
    }

    return rows;
  }

  /**
   * Create a new Master Google Spreadsheet in the user's Google Drive with all 5 core tabs.
   */
  static async createMasterSpreadsheet(
    districtName: string,
    schools: School[],
    users: User[],
    questions: Question[],
    subjects: Subject[],
    settings: SystemSettings
  ): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Belum terhubung dengan akun Google. Silakan hubungkan akun Google terlebih dahulu.');
    }

    const title = `CBT Semester SD - Master Data Kec. ${districtName} (${settings.academicYear})`;

    // 1. Create spreadsheet with 5 tabs
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title,
          locale: 'id_ID',
          timeZone: 'Asia/Jakarta'
        },
        sheets: [
          { properties: { title: 'Data_Sekolah', gridProperties: { rowCount: Math.max(schools.length + 10, 50), columnCount: 15 } } },
          { properties: { title: 'Data_Guru', gridProperties: { rowCount: 100, columnCount: 16 } } },
          { properties: { title: 'Data_Siswa', gridProperties: { rowCount: 500, columnCount: 18 } } },
          { properties: { title: 'Pembuat_Soal', gridProperties: { rowCount: 50, columnCount: 15 } } },
          { properties: { title: 'Bank_Soal', gridProperties: { rowCount: Math.max(questions.length + 20, 100), columnCount: 25 } } }
        ]
      })
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => null);
      throw new Error(err?.error?.message || 'Gagal membuat Google Spreadsheet baru');
    }

    const created = await createRes.json();
    const spreadsheetId = created.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // 2. Prepare tabular data for each tab
    const teachers = users.filter(u => u.role === 'guru');
    const students = users.filter(u => u.role === 'siswa');
    const authors = users.filter(u => u.isQuestionAuthor || u.username === 'pembuat_soal');

    // Tab 1: Data_Sekolah
    const schoolRows: any[][] = [
      ['No', 'Nama_Sekolah', 'NPSN', 'Status', 'Akreditasi', 'Alamat', 'Nama_Kepala_Sekolah', 'NIP_Kepsek', 'Kontak_WA', 'Email_Sekolah']
    ];
    schools.forEach((s, idx) => {
      schoolRows.push([
        idx + 1,
        s.name,
        s.npsn,
        s.status || 'Negeri',
        (s as any).accreditation || 'A',
        s.address || `Kec. ${districtName}`,
        s.principalName || '-',
        s.principalNip || '-',
        s.phone || '-',
        s.email || '-'
      ]);
    });

    // Tab 2: Data_Guru
    const teacherRows: any[][] = [
      ['No', 'Nama_Lengkap', 'NIP', 'Asal_Sekolah', 'NPSN_Sekolah', 'Kelas', 'Rombel', 'Mata_Pelajaran', 'Username', 'Password_Awal', 'Nomor_WA', 'Email', 'Status']
    ];
    teachers.forEach((t, idx) => {
      const sch = schools.find(s => s.id === t.schoolId);
      const subList = (t.subjects || []).map(sid => subjects.find(sub => sub.id === sid)?.name || sid).join(', ');
      teacherRows.push([
        idx + 1,
        t.fullName,
        t.nip || '-',
        sch?.name || t.schoolName || '-',
        sch?.npsn || '-',
        t.grade || 6,
        t.rombel || 'A',
        subList || 'Guru Kelas',
        t.username,
        t.password || 'password123',
        t.phone || '-',
        t.email || '-',
        t.isActive ? 'Aktif' : 'Nonaktif'
      ]);
    });

    // Tab 3: Data_Siswa
    const studentRows: any[][] = [
      ['No', 'Nomor_Peserta', 'NISN', 'Nama_Siswa', 'Jenis_Kelamin', 'Asal_Sekolah', 'NPSN_Sekolah', 'Kelas', 'Rombel', 'Agama', 'Username', 'Password_Awal', 'Status']
    ];
    students.forEach((st, idx) => {
      const sch = schools.find(s => s.id === st.schoolId);
      studentRows.push([
        idx + 1,
        st.participantNumber || `02-${st.grade || 6}-${String(idx + 1).padStart(3, '0')}`,
        st.nisn || `00${idx + 1}23456`,
        st.fullName,
        (st as any).gender === 'P' ? 'Perempuan' : 'Laki-laki',
        sch?.name || st.schoolName || '-',
        sch?.npsn || '-',
        st.grade || 6,
        st.rombel || 'A',
        st.religion || 'Islam',
        st.username,
        st.password || 'siswa123',
        st.isActive ? 'Aktif' : 'Nonaktif'
      ]);
    });

    // Tab 4: Pembuat_Soal
    const authorRows: any[][] = [
      ['No', 'Nama_Lengkap', 'NIP', 'Asal_Sekolah', 'NPSN_Sekolah', 'Spesialis_Mapel', 'Jumlah_Soal_Target', 'Username', 'Password_Awal', 'Nomor_WA', 'Email', 'Status', 'Catatan']
    ];
    authors.forEach((a, idx) => {
      const sch = schools.find(s => s.id === a.schoolId);
      const authorMapel = (a.subjects || []).map(sid => subjects.find(sub => sub.id === sid)?.name || sid).join(', ');
      authorRows.push([
        idx + 1,
        a.fullName,
        a.nip || '-',
        sch?.name || a.schoolName || '-',
        sch?.npsn || '-',
        authorMapel || 'Matematika, IPAS',
        questions.filter(q => q.authorName === a.fullName).length || 20,
        a.username,
        a.password || 'password123',
        a.phone || '-',
        a.email || '-',
        a.isActive ? 'Aktif' : 'Nonaktif',
        'Penulis naskah ujian semester kecamatan'
      ]);
    });

    // Tab 5: Bank_Soal
    const questionRows: any[][] = [
      [
        'Nomor_Soal',
        'Mata_Pelajaran',
        'Kelas',
        'Tipe_Soal',
        'Teks_Pertanyaan',
        'Opsi_A',
        'Opsi_B',
        'Opsi_C',
        'Opsi_D',
        'Kunci_Jawaban',
        'Pernyataan_1',
        'Kunci_1',
        'Pernyataan_2',
        'Kunci_2',
        'Pernyataan_3',
        'Kunci_3',
        'Pernyataan_4',
        'Kunci_4',
        'Pernyataan_5',
        'Kunci_5',
        'Bobot_Poin',
        'Topik_Materi',
        'Pembahasan',
        'Nama_Penulis'
      ]
    ];
    questions.forEach((q, idx) => {
      const sub = subjects.find(s => s.id === q.subjectId);
      const tf1 = q.trueFalseItems?.[0];
      const tf2 = q.trueFalseItems?.[1];
      const tf3 = q.trueFalseItems?.[2];
      const tf4 = q.trueFalseItems?.[3];
      const tf5 = q.trueFalseItems?.[4];

      questionRows.push([
        q.orderNumber || idx + 1,
        sub ? sub.name : q.subjectId,
        q.grade,
        q.type,
        q.questionText,
        q.options?.find(o => o.key === 'A')?.text || '',
        q.options?.find(o => o.key === 'B')?.text || '',
        q.options?.find(o => o.key === 'C')?.text || '',
        q.options?.find(o => o.key === 'D')?.text || '',
        q.correctAnswer || (q.trueFalseAnswer !== undefined ? (q.trueFalseAnswer ? 'BENAR' : 'SALAH') : ''),
        tf1?.statement || '',
        tf1 ? (tf1.isCorrect ? 'BENAR' : 'SALAH') : '',
        tf2?.statement || '',
        tf2 ? (tf2.isCorrect ? 'BENAR' : 'SALAH') : '',
        tf3?.statement || '',
        tf3 ? (tf3.isCorrect ? 'BENAR' : 'SALAH') : '',
        tf4?.statement || '',
        tf4 ? (tf4.isCorrect ? 'BENAR' : 'SALAH') : '',
        tf5?.statement || '',
        tf5 ? (tf5.isCorrect ? 'BENAR' : 'SALAH') : '',
        q.points,
        q.topic,
        q.discussion || '',
        q.authorName || 'Tim Penulis Kecamatan'
      ]);
    });

    // 3. Batch Update Values to Google Sheets
    const batchUpdateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: 'Data_Sekolah!A1', values: schoolRows },
          { range: 'Data_Guru!A1', values: teacherRows },
          { range: 'Data_Siswa!A1', values: studentRows },
          { range: 'Pembuat_Soal!A1', values: authorRows },
          { range: 'Bank_Soal!A1', values: questionRows }
        ]
      })
    });

    if (!batchUpdateRes.ok) {
      console.warn('Batch update values warning:', await batchUpdateRes.text());
    }

    return {
      spreadsheetId,
      spreadsheetUrl
    };
  }

  /**
   * Parse rows from Google Sheets into School objects
   */
  static parseSchoolsFromRows(rows: any[]): { schools: School[]; errors: string[] } {
    const schools: School[] = [];
    const errors: string[] = [];

    rows.forEach((row, i) => {
      const rowNum = i + 2;
      const name = String(row['Nama_Sekolah'] || row['Nama Sekolah'] || row['Sekolah'] || '').trim();
      const npsn = String(row['NPSN'] || row['NPSN_Sekolah'] || '').trim();

      if (!name) {
        errors.push(`Baris ${rowNum}: Nama sekolah wajib diisi.`);
        return;
      }

      schools.push({
        id: `sch-${npsn || Date.now() + i}`,
        name,
        npsn: npsn || String(20500000 + i),
        status: (row['Status'] || 'Negeri') as 'Negeri' | 'Swasta',
        address: row['Alamat'] || 'Kec. Ampelgading, Kab. Malang',
        village: row['Desa'] || row['Kelurahan'] || 'Ampelgading',
        district: row['Kecamatan'] || 'Ampelgading',
        principalName: row['Nama_Kepala_Sekolah'] || row['Kepala Sekolah'] || 'Kepala Sekolah',
        principalNip: row['NIP_Kepsek'] || row['NIP'] || '-',
        operatorName: row['Operator'] || 'Operator Sekolah',
        phone: row['Kontak_WA'] || row['No_Telepon'] || '-',
        email: row['Email_Sekolah'] || row['Email'] || '-',
        isActive: true
      });
    });

    return { schools, errors };
  }

  /**
   * Parse rows from Google Sheets into Teacher (User) objects
   */
  static parseTeachersFromRows(
    rows: any[],
    availableSchools: School[]
  ): { teachers: User[]; errors: string[] } {
    const teachers: User[] = [];
    const errors: string[] = [];
    const seenUsernames = new Set<string>();

    rows.forEach((row, i) => {
      const rowNum = i + 2;
      const fullName = String(row['Nama_Lengkap'] || row['Nama Lengkap'] || row['Nama Guru'] || '').trim();
      const rawSchool = String(row['Asal_Sekolah'] || row['Sekolah'] || '').trim();
      const npsn = String(row['NPSN_Sekolah'] || row['NPSN'] || '').trim();

      if (!fullName) {
        errors.push(`Baris ${rowNum}: Nama lengkap guru kosong.`);
        return;
      }

      // Match school
      const matchedSchool =
        availableSchools.find(s => s.npsn === npsn) ||
        availableSchools.find(s => s.name.toLowerCase().includes(rawSchool.toLowerCase())) ||
        availableSchools[0];

      let username = String(row['Username'] || '').trim().toLowerCase();
      if (!username) {
        const cleanName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15);
        username = `guru_${cleanName}`;
      }

      if (seenUsernames.has(username)) {
        username = `${username}_${i + 1}`;
      }
      seenUsernames.add(username);

      const grade = Number(row['Kelas']) || 6;
      const rombel = String(row['Rombel'] || 'A').toUpperCase();

      teachers.push({
        id: `usr-guru-${Date.now()}-${i}`,
        username,
        password: String(row['Password_Awal'] || row['Password'] || 'password123').trim(),
        role: 'guru',
        fullName,
        nip: row['NIP'] ? String(row['NIP']).trim() : undefined,
        schoolId: matchedSchool?.id || '',
        schoolName: matchedSchool?.name || rawSchool,
        phone: row['Nomor_WA'] || row['No WA'] || row['Telepon'] || '',
        email: row['Email'] || '',
        grade,
        rombel,
        classes: [`Kelas ${grade}${rombel}`],
        subjects: ['sub-mtk', 'sub-ipas', 'sub-bind', 'sub-ppkn'],
        isActive: String(row['Status'] || 'Aktif').toLowerCase() !== 'nonaktif',
        createdAt: new Date().toISOString().slice(0, 10)
      });
    });

    return { teachers, errors };
  }

  /**
   * Parse rows from Google Sheets into Student (User) objects
   */
  static parseStudentsFromRows(
    rows: any[],
    availableSchools: School[]
  ): { students: User[]; errors: string[] } {
    const students: User[] = [];
    const errors: string[] = [];
    const seenNisn = new Set<string>();

    rows.forEach((row, i) => {
      const rowNum = i + 2;
      const fullName = String(row['Nama_Siswa'] || row['Nama Lengkap'] || row['Nama'] || '').trim();
      const nisn = String(row['NISN'] || '').trim();
      const npsn = String(row['NPSN_Sekolah'] || row['NPSN'] || '').trim();
      const rawSchool = String(row['Asal_Sekolah'] || row['Sekolah'] || '').trim();

      if (!fullName) {
        errors.push(`Baris ${rowNum}: Nama siswa kosong.`);
        return;
      }

      const matchedSchool =
        availableSchools.find(s => s.npsn === npsn) ||
        availableSchools.find(s => s.name.toLowerCase().includes(rawSchool.toLowerCase())) ||
        availableSchools[0];

      const cleanNisn = nisn || `00${Date.now().toString().slice(-6)}${i}`;
      if (seenNisn.has(cleanNisn)) {
        errors.push(`Baris ${rowNum}: NISN "${cleanNisn}" duplikat.`);
      }
      seenNisn.add(cleanNisn);

      const grade = Number(row['Kelas']) || 6;
      const rombel = String(row['Rombel'] || 'A').toUpperCase();

      students.push({
        id: `usr-siswa-${Date.now()}-${i}`,
        username: String(row['Username'] || cleanNisn).trim().toLowerCase(),
        password: String(row['Password_Awal'] || row['Password'] || 'siswa123').trim(),
        role: 'siswa',
        fullName,
        nisn: cleanNisn,
        participantNumber: String(row['Nomor_Peserta'] || row['No Peserta'] || `02-${grade}-${String(i + 1).padStart(3, '0')}`).trim(),
        schoolId: matchedSchool?.id || '',
        schoolName: matchedSchool?.name || rawSchool,
        grade,
        rombel,
        religion: (row['Agama'] || 'Islam') as any,
        isActive: String(row['Status'] || 'Aktif').toLowerCase() !== 'nonaktif',
        createdAt: new Date().toISOString().slice(0, 10)
      });
    });

    return { students, errors };
  }

  /**
   * Parse rows from Google Sheets into Question Author (User) objects
   */
  static parseAuthorsFromRows(
    rows: any[],
    availableSchools: School[]
  ): { authors: User[]; errors: string[] } {
    const authors: User[] = [];
    const errors: string[] = [];

    rows.forEach((row, i) => {
      const rowNum = i + 2;
      const fullName = String(row['Nama_Lengkap'] || row['Nama'] || row['Nama Penulis'] || '').trim();
      const npsn = String(row['NPSN_Sekolah'] || row['NPSN'] || '').trim();
      const rawSchool = String(row['Asal_Sekolah'] || row['Sekolah'] || '').trim();

      if (!fullName) {
        errors.push(`Baris ${rowNum}: Nama pembuat soal kosong.`);
        return;
      }

      const matchedSchool =
        availableSchools.find(s => s.npsn === npsn) ||
        availableSchools.find(s => s.name.toLowerCase().includes(rawSchool.toLowerCase())) ||
        availableSchools[0];

      let username = String(row['Username'] || '').trim().toLowerCase();
      if (!username) {
        const cleanName = fullName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15);
        username = `penulis_${cleanName}`;
      }

      authors.push({
        id: `usr-author-${Date.now()}-${i}`,
        username,
        password: String(row['Password_Awal'] || row['Password'] || 'password123').trim(),
        role: 'guru',
        isQuestionAuthor: true,
        fullName,
        nip: row['NIP'] ? String(row['NIP']).trim() : undefined,
        schoolId: matchedSchool?.id || '',
        schoolName: matchedSchool?.name || rawSchool,
        phone: row['Nomor_WA'] || row['No WA'] || '',
        email: row['Email'] || '',
        grade: 6,
        rombel: 'A',
        subjects: ['sub-mtk', 'sub-ipas'],
        isActive: String(row['Status'] || 'Aktif').toLowerCase() !== 'nonaktif',
        createdAt: new Date().toISOString().slice(0, 10)
      });
    });

    return { authors, errors };
  }

  /**
   * Parse rows from Google Sheets into Question objects with support for 4 official formats
   */
  static parseQuestionsFromRows(
    rows: any[],
    subjects: Subject[],
    authorName = 'Admin Kecamatan',
    authorRole: 'admin' | 'guru' = 'admin'
  ): { questions: Question[]; errors: string[] } {
    const questions: Question[] = [];
    const errors: string[] = [];

    const numberColAliases = [
      'No', 'No.', 'Nomor', 'Nomor_Soal', 'Nomor Soal', 'No_Soal', 'No Soal',
      'No_Urut', 'No Urut', 'Nomor_Urut', 'Nomor Urut', 'Urutan', 'Number'
    ];

    rows.forEach((r, idx) => {
      const rowNum = idx + 2;

      const getField = (aliases: string[]): string => {
        for (const key of aliases) {
          if (r[key] !== undefined && r[key] !== null && String(r[key]).trim() !== '') {
            return String(r[key]).trim();
          }
        }
        const rKeys = Object.keys(r);
        for (const alias of aliases) {
          const matchKey = rKeys.find(
            k => k.toLowerCase().replace(/[\s_.-]+/g, '') === alias.toLowerCase().replace(/[\s_.-]+/g, '')
          );
          if (matchKey && r[matchKey] !== undefined && r[matchKey] !== null && String(r[matchKey]).trim() !== '') {
            return String(r[matchKey]).trim();
          }
        }
        return '';
      };

      const rawNo = getField(numberColAliases);
      let parsedOrder: number | undefined = undefined;
      if (rawNo) {
        const cleanDigits = rawNo.replace(/[^\d]/g, '');
        const num = parseInt(cleanDigits, 10);
        if (!isNaN(num) && num > 0) {
          parsedOrder = num;
        }
      }
      const orderNumber = parsedOrder !== undefined ? parsedOrder : idx + 1;

      const qText = getField(['Pertanyaan', 'Soal', 'Teks_Soal', 'Teks Soal', 'Question', 'Isi_Pertanyaan']);
      const rawSub = getField(['Mata_Pelajaran', 'Mata Pelajaran', 'Mapel', 'Subject']);
      const rawKey = getField(['Kunci_Jawaban', 'Kunci Jawaban', 'Kunci', 'Jawaban', 'Key']);

      if (!qText) {
        errors.push(`Baris ${rowNum}: Kolom Pertanyaan tidak boleh kosong.`);
        return;
      }

      const matchedSub = subjects.find(
        s => s.name.toLowerCase().includes(rawSub.toLowerCase()) || s.code.toLowerCase().includes(rawSub.toLowerCase())
      ) || subjects[0] || { id: 'sub-mtk', name: 'Matematika' };

      const rawType = getField(['Jenis_Soal', 'Jenis Soal', 'Jenis', 'Tipe_Soal', 'Tipe Soal', 'Type']).toLowerCase();
      let type: 'mcq' | 'complex_mcq' | 'matching' | 'true_false' = 'mcq';
      if (rawType.includes('kompleks') || rawType.includes('complex')) {
        type = 'complex_mcq';
      } else if (rawType.includes('jodoh') || rawType.includes('matching') || rawType.includes('pasang')) {
        type = 'matching';
      } else if (
        rawType.includes('benar') ||
        rawType.includes('salah') ||
        rawType.includes('true') ||
        rawType.includes('false')
      ) {
        type = 'true_false';
      }

      const grade = Number(getField(['Kelas', 'Grade'])) || 6;
      const points = Number(getField(['Bobot_Nilai', 'Bobot Nilai', 'Bobot', 'Poin'])) || (type === 'true_false' ? 20 : 10);
      const rawDiff = getField(['Tingkat_Kesulitan', 'Kesulitan', 'Difficulty']).toLowerCase();
      const difficulty: 'mudah' | 'sedang' | 'sulit' = rawDiff === 'mudah' || rawDiff === 'sulit' ? rawDiff : 'sedang';
      const topic = getField(['Topik', 'Topic', 'Materi', 'Bab']) || 'Materi Pokok';
      const discussion = getField(['Pembahasan', 'Penjelasan', 'Keterangan']) || undefined;

      const newQ: Question = {
        id: 'qst-gsheet-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substring(2, 6),
        subjectId: matchedSub.id,
        grade,
        semester: 'Ganjil',
        academicYear: '2024/2025',
        topic,
        difficulty,
        type,
        questionText: qText,
        imagePosition: 'top',
        points,
        orderNumber,
        discussion,
        status: 'ready',
        authorName,
        authorRole,
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10)
      };

      if (type === 'mcq') {
        const optA = getField(['Pilihan_A', 'Pilihan A', 'Opsi_A', 'Opsi A', 'A']);
        const optB = getField(['Pilihan_B', 'Pilihan B', 'Opsi_B', 'Opsi B', 'B']);
        const optC = getField(['Pilihan_C', 'Pilihan C', 'Opsi_C', 'Opsi C', 'C']);
        const optD = getField(['Pilihan_D', 'Pilihan D', 'Opsi_D', 'Opsi D', 'D']);
        newQ.options = [
          { key: 'A', text: optA || 'Pilihan A' },
          { key: 'B', text: optB || 'Pilihan B' },
          { key: 'C', text: optC || 'Pilihan C' },
          { key: 'D', text: optD || 'Pilihan D' }
        ];
        const cleanKey = rawKey.toUpperCase().replace(/[^A-D]/g, '') as 'A' | 'B' | 'C' | 'D';
        newQ.correctAnswer = ['A', 'B', 'C', 'D'].includes(cleanKey) ? cleanKey : 'A';
      } else if (type === 'complex_mcq') {
        const optA = getField(['Pilihan_A', 'Opsi_A', 'A']);
        const optB = getField(['Pilihan_B', 'Opsi_B', 'B']);
        const optC = getField(['Pilihan_C', 'Opsi_C', 'C']);
        const optD = getField(['Pilihan_D', 'Opsi_D', 'D']);
        const cleanKeys = rawKey.toUpperCase().split(/[,;\s/]+/);
        newQ.complexOptions = [
          { id: 'opt-a', label: optA || 'Pernyataan A', isCorrect: cleanKeys.includes('A') || cleanKeys.includes('1') },
          { id: 'opt-b', label: optB || 'Pernyataan B', isCorrect: cleanKeys.includes('B') || cleanKeys.includes('2') },
          { id: 'opt-c', label: optC || 'Pernyataan C', isCorrect: cleanKeys.includes('C') || cleanKeys.includes('3') },
          { id: 'opt-d', label: optD || 'Pernyataan D', isCorrect: cleanKeys.includes('D') || cleanKeys.includes('4') }
        ];
      } else if (type === 'matching') {
        const p1 = getField(['Premis_1', 'Premis 1', 'Pernyataan_1']) || 'Pernyataan 1';
        const r1 = getField(['Respon_1', 'Respon 1', 'Jawaban_1']) || 'Pasangan 1';
        const p2 = getField(['Premis_2', 'Premis 2', 'Pernyataan_2']) || 'Pernyataan 2';
        const r2 = getField(['Respon_2', 'Respon 2', 'Jawaban_2']) || 'Pasangan 2';
        const p3 = getField(['Premis_3', 'Premis 3', 'Pernyataan_3']) || 'Pernyataan 3';
        const r3 = getField(['Respon_3', 'Respon 3', 'Jawaban_3']) || 'Pasangan 3';
        newQ.matchingPairs = [
          { id: `mp-${Date.now()}-${idx}-1`, leftPrompt: p1, rightAnswer: r1 },
          { id: `mp-${Date.now()}-${idx}-2`, leftPrompt: p2, rightAnswer: r2 },
          { id: `mp-${Date.now()}-${idx}-3`, leftPrompt: p3, rightAnswer: r3 }
        ];
      } else if (type === 'true_false') {
        const tfItems: { id: string; statement: string; isCorrect: boolean }[] = [];
        for (let sIdx = 1; sIdx <= 5; sIdx++) {
          const stmtText = getField([
            `Pernyataan_${sIdx}`,
            `Pernyataan ${sIdx}`,
            `Butir_${sIdx}`,
            `Butir ${sIdx}`,
            `Pernyataan_${String.fromCharCode(64 + sIdx)}`
          ]);
          const stmtKey = getField([
            `Kunci_${sIdx}`,
            `Kunci ${sIdx}`,
            `Jawaban_${sIdx}`,
            `Nilai_${sIdx}`,
            `Kunci_${String.fromCharCode(64 + sIdx)}`
          ]).toUpperCase();

          if (stmtText) {
            const isBenar =
              stmtKey === 'B' ||
              stmtKey === 'BENAR' ||
              stmtKey === 'TRUE' ||
              stmtKey === 'T' ||
              stmtKey === '1';
            tfItems.push({
              id: `tf-gs-${Date.now()}-${idx}-${sIdx}`,
              statement: stmtText,
              isCorrect: isBenar
            });
          }
        }

        if (tfItems.length === 0) {
          tfItems.push(
            { id: `tf-gs-${Date.now()}-${idx}-1`, statement: 'Pernyataan 1', isCorrect: true },
            { id: `tf-gs-${Date.now()}-${idx}-2`, statement: 'Pernyataan 2', isCorrect: false },
            { id: `tf-gs-${Date.now()}-${idx}-3`, statement: 'Pernyataan 3', isCorrect: true },
            { id: `tf-gs-${Date.now()}-${idx}-4`, statement: 'Pernyataan 4', isCorrect: false }
          );
        }
        newQ.trueFalseItems = tfItems;
      }

      questions.push(newQ);
    });

    return { questions, errors };
  }
}
