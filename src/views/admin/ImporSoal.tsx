import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Trash2,
  LayoutGrid,
  List,
  Sparkles,
  Check,
  X,
  ArrowRight,
  ArrowDown10,
  ArrowUpDown,
  Hash,
  Eye,
  Link as LinkIcon,
  RefreshCw,
  ExternalLink,
  Cloud,
  FileUp,
  Globe
} from 'lucide-react';
import { Subject, Question, UserRole, QuestionType, TrueFalseItem } from '../../types';
import { AppStorage } from '../../services/storage';
import { ExcelService } from '../../services/excelService';
import { GoogleSheetsService, SpreadsheetMetadata } from '../../services/googleSheetsService';
import { isGoogleConnected, googleSignIn, getCachedGoogleUser } from '../../services/authGoogle';

interface ImporSoalProps {
  subjects: Subject[];
  authorName: string;
  authorRole: UserRole;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
  onNavigate?: (tab: string) => void;
}

export const ImporSoal: React.FC<ImporSoalProps> = ({
  subjects,
  authorName,
  authorRole,
  onRefresh,
  showToast,
  onNavigate
}) => {
  const [, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [successLogs, setSuccessLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState<'card' | 'table'>('card');
  const [hasExcelNumberColumn, setHasExcelNumberColumn] = useState<boolean>(false);
  const [sortByExcelNumber, setSortByExcelNumber] = useState<boolean>(true);

  // Google Sheets Integration State
  const [sourceType, setSourceType] = useState<'excel' | 'sheets'>('excel');
  const [sheetsUrl, setSheetsUrl] = useState<string>('');
  const [isInspectingSheet, setIsInspectingSheet] = useState(false);
  const [sheetMetadata, setSheetMetadata] = useState<SpreadsheetMetadata | null>(null);
  const [selectedSheetTab, setSelectedSheetTab] = useState<string>('');
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState(() => isGoogleConnected());
  const [googleUser, setGoogleUser] = useState<any>(() => getCachedGoogleUser());

  useEffect(() => {
    setIsGoogleLoggedIn(isGoogleConnected());
    setGoogleUser(getCachedGoogleUser());
  }, []);

  // Parser helper function converting raw spreadsheet rows into structured Question models
  const parseRowsToQuestions = (
    rows: any[],
    shouldSort = true
  ): { questions: Question[]; valErrors: string[]; hasExcelNumbers: boolean } => {
    const valErrors: string[] = [];
    const questions: Question[] = [];

    // Deteksi apakah ada kolom nomor urut pada naskah Excel
    const numberColAliases = [
      'No', 'No.', 'Nomor', 'Nomor_Soal', 'Nomor Soal', 'No_Soal', 'No Soal',
      'No_Urut', 'No Urut', 'Nomor_Urut', 'Nomor Urut', 'Urutan', 'Number', 'Urut'
    ];
    let detectedExcelNumbers = false;

    rows.forEach((r, idx) => {
      const rowNum = idx + 2;

      // Helper to retrieve field value using multiple potential alias names
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

      // 0. Ekstraksi Nomor Urut Soal dari Kolom Excel jika ada
      const rawNo = getField(numberColAliases);
      let parsedOrder: number | undefined = undefined;
      if (rawNo) {
        const cleanDigits = rawNo.replace(/[^\d]/g, '');
        const num = parseInt(cleanDigits, 10);
        if (!isNaN(num) && num > 0) {
          parsedOrder = num;
          detectedExcelNumbers = true;
        }
      }
      const orderNumber = parsedOrder !== undefined ? parsedOrder : idx + 1;

      const qText = getField(['Pertanyaan', 'Soal', 'Teks_Soal', 'Teks Soal', 'Question', 'Isi_Pertanyaan', 'Isi Pertanyaan']);
      const rawSub = getField(['Mata_Pelajaran', 'Mata Pelajaran', 'Mapel', 'Subject']);
      const rawKey = getField(['Kunci_Jawaban', 'Kunci Jawaban', 'Kunci', 'Jawaban', 'Key']);

      if (!qText) {
        valErrors.push(`Baris ${rowNum}: Kolom 'Pertanyaan' tidak boleh kosong.`);
      }
      if (!rawSub) {
        valErrors.push(`Baris ${rowNum}: Kolom 'Mata_Pelajaran' belum ditentukan.`);
      }

      const matchedSub = subjects.find(
        s => s.name.toLowerCase().includes(rawSub.toLowerCase()) || s.code.toLowerCase().includes(rawSub.toLowerCase())
      ) || subjects[0];

      const rawType = getField(['Jenis_Soal', 'Jenis Soal', 'Jenis', 'Tipe_Soal', 'Tipe Soal', 'Type']).toLowerCase();
      let type: QuestionType = 'mcq';
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
      const points = Number(getField(['Bobot_Nilai', 'Bobot Nilai', 'Bobot', 'Poin', 'Nilai'])) || (type === 'true_false' ? 20 : 10);
      const rawDiff = getField(['Tingkat_Kesulitan', 'Tingkat Kesulitan', 'Kesulitan', 'Difficulty']).toLowerCase();
      const difficulty: 'mudah' | 'sedang' | 'sulit' = rawDiff === 'mudah' || rawDiff === 'sulit' ? rawDiff : 'sedang';
      const topic = getField(['Topik', 'Topic', 'Materi', 'Bab']) || 'Materi Pokok';
      const discussion = getField(['Pembahasan', 'Penjelasan', 'Discussion', 'Keterangan']) || undefined;

      const newQ: Question = {
        id: 'qst-imp-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substring(2, 6),
        subjectId: matchedSub.id,
        grade,
        semester: 'Ganjil',
        academicYear: '2024/2025',
        topic,
        difficulty,
        type,
        questionText: qText || `Pertanyaan nomor ${orderNumber}`,
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

      // 1. Pilihan Ganda (MCQ)
      if (type === 'mcq') {
        const optA = getField(['Opsi_A', 'Opsi A', 'Pilihan_A', 'A']);
        const optB = getField(['Opsi_B', 'Opsi B', 'Pilihan_B', 'B']);
        const optC = getField(['Opsi_C', 'Opsi C', 'Pilihan_C', 'C']);
        const optD = getField(['Opsi_D', 'Opsi D', 'Pilihan_D', 'D']);
        newQ.options = [
          { key: 'A', text: optA || 'Pilihan A' },
          { key: 'B', text: optB || 'Pilihan B' },
          { key: 'C', text: optC || 'Pilihan C' },
          { key: 'D', text: optD || 'Pilihan D' }
        ];
        const kUpper = rawKey.toUpperCase();
        newQ.correctAnswer = (['A', 'B', 'C', 'D'].includes(kUpper) ? kUpper : 'A') as any;
      }
      // 2. Pilihan Ganda Kompleks
      else if (type === 'complex_mcq') {
        const kUpper = rawKey.toUpperCase();
        const optA = getField(['Opsi_A', 'Opsi A', 'Pernyataan_1', 'Pernyataan 1']);
        const optB = getField(['Opsi_B', 'Opsi B', 'Pernyataan_2', 'Pernyataan 2']);
        const optC = getField(['Opsi_C', 'Opsi C', 'Pernyataan_3', 'Pernyataan 3']);
        const optD = getField(['Opsi_D', 'Opsi D', 'Pernyataan_4', 'Pernyataan 4']);
        const opts = [
          { id: 'opt-1', label: optA || 'Pernyataan 1', isCorrect: kUpper.includes('A') || kUpper.includes('1') },
          { id: 'opt-2', label: optB || 'Pernyataan 2', isCorrect: kUpper.includes('B') || kUpper.includes('2') },
          { id: 'opt-3', label: optC || 'Pernyataan 3', isCorrect: kUpper.includes('C') || kUpper.includes('3') },
          { id: 'opt-4', label: optD || 'Pernyataan 4', isCorrect: kUpper.includes('D') || kUpper.includes('4') }
        ].filter(o => o.label.trim() !== '');
        newQ.complexOptions = opts.length > 0 ? opts : [
          { id: 'opt-1', label: 'Pernyataan 1', isCorrect: true },
          { id: 'opt-2', label: 'Pernyataan 2', isCorrect: false }
        ];
      }
      // 3. Menjodohkan
      else if (type === 'matching') {
        const pairs: Array<{ id: string; leftPrompt: string; rightAnswer: string }> = [];
        ['Opsi_A', 'Opsi_B', 'Opsi_C', 'Opsi_D', 'Pasangan_1', 'Pasangan_2', 'Pasangan_3', 'Pasangan_4'].forEach((col, cIdx) => {
          const val = getField([col, col.replace('_', ' ')]);
          if (val && (val.includes(':') || val.includes('->') || val.includes('='))) {
            const sep = val.includes(':') ? ':' : val.includes('->') ? '->' : '=';
            const [left, right] = val.split(sep);
            if (left && right) {
              pairs.push({ id: `mp-${cIdx + 1}`, leftPrompt: left.trim(), rightAnswer: right.trim() });
            }
          }
        });
        newQ.matchingPairs = pairs.length > 0 ? pairs : [
          { id: 'mp-1', leftPrompt: 'Konsep A', rightAnswer: 'Pasangan Jawaban A' },
          { id: 'mp-2', leftPrompt: 'Konsep B', rightAnswer: 'Pasangan Jawaban B' }
        ];
      }
      // 4. Benar / Salah (4 sampai 5 Butir Pernyataan)
      else if (type === 'true_false') {
        // Cek Format A: Kolom khusus 'Pernyataan_1' .. 'Pernyataan_5' dengan 'Kunci_1' .. 'Kunci_5'
        const dedicatedItems: TrueFalseItem[] = [];
        for (let i = 1; i <= 5; i++) {
          const stmt = getField([`Pernyataan_${i}`, `Pernyataan ${i}`, `Butir_${i}`, `Butir ${i}`, `Pernyataan${i}`]);
          const kVal = getField([`Kunci_${i}`, `Kunci ${i}`, `Kunci${i}`, `Jawaban_${i}`, `Jawaban ${i}`]).toUpperCase();
          if (stmt) {
            const isB = kVal.startsWith('B') || kVal.startsWith('T') || kVal === '1' || kVal.includes('BENAR') || kVal.includes('TRUE');
            dedicatedItems.push({
              id: `tfi-${Date.now()}-${idx}-${i}`,
              statement: stmt,
              isCorrect: isB
            });
          }
        }

        if (dedicatedItems.length >= 2) {
          newQ.trueFalseItems = dedicatedItems;
          newQ.trueFalseAnswer = dedicatedItems[0].isCorrect;
        } else {
          // Cek Format B: Kolom Opsi_A .. Opsi_E dengan Kunci_Jawaban terpisah (contoh: BENAR, SALAH, BENAR, SALAH)
          const statementCols = [
            ['Opsi_A', 'Opsi A', 'Pernyataan_1', 'Pernyataan 1'],
            ['Opsi_B', 'Opsi B', 'Pernyataan_2', 'Pernyataan 2'],
            ['Opsi_C', 'Opsi C', 'Pernyataan_3', 'Pernyataan 3'],
            ['Opsi_D', 'Opsi D', 'Pernyataan_4', 'Pernyataan 4'],
            ['Opsi_E', 'Opsi E', 'Pernyataan_5', 'Pernyataan 5']
          ];
          const validStmts = statementCols
            .map(aliases => getField(aliases))
            .filter(val => val.length > 0);

          const rawKeyUpper = rawKey.toUpperCase();

          if (validStmts.length >= 2) {
            const keyTokens = rawKeyUpper.split(/[,;/|\s-]+/).map(t => t.trim()).filter(Boolean);
            newQ.trueFalseItems = validStmts.map((stmt, sIdx) => {
              const token = keyTokens[sIdx] || '';
              const isCorrect = token.startsWith('B') || token.startsWith('T') || token === '1' || token.includes('BENAR');
              return {
                id: `tfi-${Date.now()}-${idx}-${sIdx}`,
                statement: stmt,
                isCorrect
              };
            });
            newQ.trueFalseAnswer = newQ.trueFalseItems[0]?.isCorrect ?? true;
          } else {
            // Fallback: Soal Benar/Salah 1 pernyataan tunggal
            newQ.trueFalseAnswer = rawKeyUpper.includes('BENAR') || rawKeyUpper.includes('TRUE') || rawKeyUpper.startsWith('B');
            if (validStmts.length === 1) {
              newQ.trueFalseItems = [
                {
                  id: `tfi-${Date.now()}-${idx}-0`,
                  statement: validStmts[0],
                  isCorrect: newQ.trueFalseAnswer
                }
              ];
            }
          }
        }
      }

      questions.push(newQ);
    });

    if (shouldSort && detectedExcelNumbers) {
      questions.sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0));
    }

    return { questions, valErrors, hasExcelNumbers: detectedExcelNumbers };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    try {
      setFile(selected);
      const rows = await ExcelService.parseExcelFile(selected);
      const { questions, valErrors, hasExcelNumbers } = parseRowsToQuestions(rows, sortByExcelNumber);

      setParsedRows(rows);
      setPreviewQuestions(questions);
      setErrors(valErrors);
      setHasExcelNumberColumn(hasExcelNumbers);
      setSuccessLogs([]);

      const tfCount = questions.filter(q => q.type === 'true_false').length;
      showToast(
        'info',
        'File Berhasil Dimuat',
        `Memuat ${questions.length} soal (${hasExcelNumbers ? 'Nomor urut Excel disinkronkan & diurutkan' : 'Sesuai urutan baris'}).`
      );
    } catch (err: any) {
      showToast('error', 'Format File Salah', err.message || 'File spreadsheet tidak dapat dibaca.');
    }
  };

  // Google Sheets Action Handlers
  const handleConnectGoogle = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setIsGoogleLoggedIn(true);
        setGoogleUser(res.user);
        showToast('success', 'Google Terhubung', `Masuk sebagai ${res.user.displayName || res.user.email}`);
      }
    } catch (err: any) {
      showToast('error', 'Gagal Menghubungkan Google', err.message);
    }
  };

  const handleInspectGoogleSheet = async () => {
    const id = GoogleSheetsService.extractSpreadsheetId(sheetsUrl);
    if (!id) {
      showToast('error', 'Link Spreadsheet Tidak Valid', 'Masukkan URL Google Spreadsheet yang valid atau ID spreadsheet.');
      return;
    }

    if (!isGoogleLoggedIn) {
      showToast('error', 'Perlu Terhubung Google', 'Silakan klik tombol "Hubungkan Akun Google" terlebih dahulu.');
      return;
    }

    setIsInspectingSheet(true);
    setSheetMetadata(null);
    try {
      const meta = await GoogleSheetsService.getSpreadsheetMetadata(id);
      setSheetMetadata(meta);
      if (meta.sheets && meta.sheets.length > 0) {
        // Prioritize a sheet tab named 'Bank_Soal' or containing 'soal'
        const matched = meta.sheets.find(s => /soal|bank/i.test(s.title));
        setSelectedSheetTab(matched ? matched.title : meta.sheets[0].title);
      }
      showToast(
        'success',
        'Spreadsheet Ditemukan',
        `"${meta.title}" berhasil diperiksa. Pilih lembar kerja/sheet untuk menarik butir soal.`
      );
    } catch (err: any) {
      showToast('error', 'Gagal Membaca Spreadsheet', err.message);
    } finally {
      setIsInspectingSheet(false);
    }
  };

  const handleFetchFromGoogleSheets = async () => {
    if (!sheetMetadata || !selectedSheetTab) {
      showToast('error', 'Pilih Sheet Tab', 'Pilih sheet tab yang berisi data naskah soal.');
      return;
    }

    setIsFetchingSheet(true);
    setErrors([]);
    setSuccessLogs([]);

    try {
      const rows = await GoogleSheetsService.fetchSheetRows(sheetMetadata.spreadsheetId, selectedSheetTab);
      if (!Array.isArray(rows) || rows.length === 0) {
        showToast('error', 'Sheet Kosong', `Tab "${selectedSheetTab}" tidak memiliki baris data soal.`);
        setIsFetchingSheet(false);
        return;
      }

      setParsedRows(rows);
      const { questions, valErrors, hasExcelNumbers } = parseRowsToQuestions(rows, sortByExcelNumber);
      setPreviewQuestions(questions);
      setErrors(valErrors);
      setHasExcelNumberColumn(hasExcelNumbers);

      showToast(
        'success',
        'Soal Berhasil Ditarik!',
        `Memuat ${questions.length} butir soal dari Google Sheets tab "${selectedSheetTab}".`
      );
    } catch (err: any) {
      showToast('error', 'Gagal Mengambil Soal', err.message);
    } finally {
      setIsFetchingSheet(false);
    }
  };

  // Pre-load demo sample with 4-5 statements and serial numbers for immediate testing
  const handleLoadDemoData = () => {
    const demoRows = [
      {
        'No': 1,
        'Jenis_Soal': 'Benar Salah',
        'Mata_Pelajaran': 'Pendidikan Pancasila',
        'Kelas': 6,
        'Pertanyaan': 'Tentukan apakah masing-masing pernyataan mengenai pengamalan nilai-nilai luhur Pancasila berikut BENAR atau SALAH!',
        'Pernyataan_1': 'Menghormati teman yang sedang beribadah sesuai agama dan kepercayaannya merupakan pengamalan Sila Pertama.',
        'Kunci_1': 'BENAR',
        'Pernyataan_2': 'Memaksakan suatu agama atau keyakinan kepada orang lain diperbolehkan selama demi kebaikan bersama.',
        'Kunci_2': 'SALAH',
        'Pernyataan_3': 'Membantu korban bencana alam tanpa membedakan suku maupun agama adalah wujud Sila Kemanusiaan yang Adil dan Beradab.',
        'Kunci_3': 'BENAR',
        'Pernyataan_4': 'Mengutamakan kepentingan pribadi di atas kepentingan umum dan persatuan bangsa merupakan cerminan cinta tanah air.',
        'Kunci_4': 'SALAH',
        'Bobot_Nilai': 20,
        'Topik': 'Nilai-Nilai Pancasila',
        'Pembahasan': 'Pernyataan 1 Benar (Sila 1), 2 Salah (toleransi beragama), 3 Benar (Sila 2), 4 Salah (Sila 3 utamakan kepentingan umum).'
      },
      {
        'No': 2,
        'Jenis_Soal': 'Benar Salah',
        'Mata_Pelajaran': 'Matematika',
        'Kelas': 6,
        'Pertanyaan': 'Perhatikan konsep perbandingan dan operasi hitung bilangan bulat di bawah ini, tentukan BENAR atau SALAH tiap pernyataan!',
        'Pernyataan_1': 'Bilangan bulat negatif semakin ke kiri letaknya pada garis bilangan maka nilainya justru semakin kecil.',
        'Kunci_1': 'BENAR',
        'Pernyataan_2': 'Hasil dari operasi hitung (-15) + 8 adalah sama dengan 7.',
        'Kunci_2': 'SALAH',
        'Pernyataan_3': 'Lawan atau invers penjumlahan dari bilangan bulat -50 adalah 50.',
        'Kunci_3': 'BENAR',
        'Pernyataan_4': 'Bilangan -18 nilainya lebih besar daripada bilangan -6.',
        'Kunci_4': 'SALAH',
        'Bobot_Nilai': 20,
        'Topik': 'Bilangan Bulat Negatif',
        'Pembahasan': '1. Benar; 2. Salah (hasilnya -7); 3. Benar; 4. Salah (-18 < -6).'
      },
      {
        'No': 3,
        'Jenis_Soal': 'Benar Salah (5 Butir)',
        'Mata_Pelajaran': 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
        'Kelas': 6,
        'Pertanyaan': 'Analisis pernyataan mengenai peran komponen rantai makanan dan ekosistem berikut apakah BENAR atau SALAH!',
        'Pernyataan_1': 'Tumbuhan hijau bertindak sebagai produsen utama karena mampu menghasilkan makanan sendiri melalui fotosintesis.',
        'Kunci_1': 'BENAR',
        'Pernyataan_2': 'Hewan herbivora menempati tingkat trofik konsumen primer atau konsumen tingkat pertama.',
        'Kunci_2': 'BENAR',
        'Pernyataan_3': 'Hewan karnivora mendapatkan energi utama secara langsung dari memakan rerumputan dan dedaunan.',
        'Kunci_3': 'SALAH',
        'Pernyataan_4': 'Bakteri dan jamur berperan vital sebagai dekomposer (pengurai) zat organik dalam tanah.',
        'Kunci_4': 'BENAR',
        'Pernyataan_5': 'Kepunahan salah satu populasi predator puncak tidak akan berdampak bagi keseimbangan rantai makanan.',
        'Kunci_5': 'SALAH',
        'Bobot_Nilai': 25,
        'Topik': 'Ekosistem & Rantai Makanan',
        'Pembahasan': '1. Benar; 2. Benar; 3. Salah (karnivora makan daging); 4. Benar; 5. Salah (keseimbangan ekosistem terganggu).'
      },
      {
        'No': 4,
        'Jenis_Soal': 'Pilihan Ganda',
        'Mata_Pelajaran': 'Matematika',
        'Kelas': 6,
        'Pertanyaan': 'Berapakah hasil dari 250 - 45 x 4 + 70?',
        'Opsi_A': '140',
        'Opsi_B': '135',
        'Opsi_C': '145',
        'Opsi_D': '150',
        'Kunci_Jawaban': 'A',
        'Bobot_Nilai': 10,
        'Topik': 'Operasi Hitung Campuran'
      }
    ];

    const { questions, valErrors, hasExcelNumbers } = parseRowsToQuestions(demoRows, true);
    setParsedRows(demoRows);
    setPreviewQuestions(questions);
    setErrors(valErrors);
    setHasExcelNumberColumn(hasExcelNumbers);
    setSortByExcelNumber(true);
    setSuccessLogs([]);
    showToast('info', 'Contoh Soal Dimuat', 'Berhasil memuat 4 contoh soal berurutan No. 1 s/d 4 sesuai naskah Excel.');
  };

  // Toggle sorting between Excel sequential order and raw row order
  const handleToggleSort = () => {
    const nextSort = !sortByExcelNumber;
    setSortByExcelNumber(nextSort);
    if (nextSort) {
      setPreviewQuestions(prev => [...prev].sort((a, b) => (a.orderNumber ?? 0) - (b.orderNumber ?? 0)));
      showToast('info', 'Diurutkan Sesuai No. Excel', 'Soal diurutkan sekuensial mengikuti kolom nomor urut Excel.');
    } else {
      if (parsedRows.length > 0) {
        const { questions } = parseRowsToQuestions(parsedRows, false);
        setPreviewQuestions(questions);
        showToast('info', 'Urutan Baris Naskah', 'Daftar soal dikembalikan mengikuti urutan baris mentah spreadsheet.');
      }
    }
  };

  // Toggle Benar / Salah of a statement directly inside the preview card
  const handleToggleTrueFalseKey = (questionId: string, itemId: string) => {
    setPreviewQuestions(prev =>
      prev.map(q => {
        if (q.id !== questionId || !q.trueFalseItems) return q;
        const updatedItems = q.trueFalseItems.map(item =>
          item.id === itemId ? { ...item, isCorrect: !item.isCorrect } : item
        );
        return {
          ...q,
          trueFalseItems: updatedItems,
          trueFalseAnswer: updatedItems[0]?.isCorrect ?? true
        };
      })
    );
  };

  // Remove a question from preview
  const handleRemovePreviewItem = (index: number) => {
    setPreviewQuestions(prev => prev.filter((_, i) => i !== index));
    setParsedRows(prev => prev.filter((_, i) => i !== index));
    showToast('info', 'Soal Dihapus', 'Soal dihapus dari daftar pratinjau impor.');
  };

  // Save all preview questions to Bank Soal
  const handleSaveImport = () => {
    if (previewQuestions.length === 0) return;

    setIsProcessing(true);
    let countSuccess = 0;
    const logs: string[] = [];

    // Gunakan AppStorage.saveQuestions agar urutan sekuensial terjaga sempurna
    AppStorage.saveQuestions(previewQuestions);
    countSuccess = previewQuestions.length;

    previewQuestions.forEach((q, idx) => {
      const sub = subjects.find(s => s.id === q.subjectId);
      const subName = sub ? sub.name : q.subjectId;
      const detail =
        q.type === 'true_false' && q.trueFalseItems
          ? `(${q.trueFalseItems.length} Butir Pernyataan)`
          : `(${q.type})`;
      logs.push(`Soal No. ${q.orderNumber || idx + 1} [${subName}] ${detail} berhasil disimpan ke Bank Soal.`);
    });

    AppStorage.logActivity(
      authorName,
      authorRole,
      'Impor Bank Soal',
      `Berhasil mengimpor massal ${countSuccess} butir soal ke bank soal dengan nomor urut sesuai data naskah Excel.`
    );

    setIsProcessing(false);
    setSuccessLogs(logs);
    setPreviewQuestions([]);
    setParsedRows([]);
    setFile(null);
    onRefresh();
    showToast(
      'success',
      'Impor Soal Sukses!',
      `Sebanyak ${countSuccess} butir soal telah berhasil disimpan berurutan ke Bank Soal sesuai data Excel!`
    );
  };

  const trueFalseCount = previewQuestions.filter(q => q.type === 'true_false').length;
  const mcqCount = previewQuestions.filter(q => q.type === 'mcq').length;
  const complexCount = previewQuestions.filter(q => q.type === 'complex_mcq').length;
  const matchingCount = previewQuestions.filter(q => q.type === 'matching').length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Impor Bank Soal Massal Sesuai Bentuk Naskah
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mendukung otomatis soal <strong>Benar/Salah 4 sampai 5 butir pernyataan</strong>, Pilihan Ganda, PG Kompleks, dan Menjodohkan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onNavigate && (
            <button
              onClick={() => onNavigate(authorRole === 'guru' ? 'guru-preview-soal' : 'admin-preview-soal')}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Tampilan CBT
            </button>
          )}
          <button
            onClick={handleLoadDemoData}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Coba Contoh Naskah 4-5 Butir
          </button>
        </div>
      </div>

      {/* Template Download Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Template Khusus Benar Salah 4-5 Butir */}
        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-emerald-600 text-white font-extrabold text-[10px] rounded-md tracking-wider uppercase">
                Format Khusus 4-5 Butir
              </span>
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
            </div>
            <h4 className="font-bold text-emerald-950 text-sm">Template Khusus Benar / Salah (4-5 Butir)</h4>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Disediakan kolom terpisah: <code>Pernyataan_1</code> & <code>Kunci_1</code> hingga <code>Pernyataan_5</code> & <code>Kunci_5</code> untuk kemudahan pengetikan soal Benar/Salah standar ANBK.
            </p>
          </div>
          <button
            onClick={() => ExcelService.downloadTrueFalseSpecialTemplate()}
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" /> Unduh Template Benar-Salah (.xlsx)
          </button>
        </div>

        {/* Template Semua Model Soal */}
        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-blue-600 text-white font-extrabold text-[10px] rounded-md tracking-wider uppercase">
                Lengkap Semua Tipe
              </span>
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-bold text-blue-950 text-sm">Template Lengkap Semua Tipe Soal</h4>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Mencakup contoh baris Pilihan Ganda (A-D), PG Kompleks, Menjodohkan, serta Benar/Salah 4 butir menggunakan kolom Opsi A-D.
            </p>
          </div>
          <button
            onClick={() => ExcelService.downloadQuestionImportTemplate()}
            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" /> Unduh Template Lengkap (.xlsx)
          </button>
        </div>
      </div>

      {/* Import Source Selector (Excel File vs Google Spreadsheet) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setSourceType('excel')}
            className={`py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              sourceType === 'excel'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileUp className="w-4 h-4 text-emerald-600" />
            <span>Unggah Berkas Excel (.xlsx, .csv)</span>
          </button>
          <button
            type="button"
            onClick={() => setSourceType('sheets')}
            className={`py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              sourceType === 'sheets'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Tarik dari Google Spreadsheet (Cloud)</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 rounded">
              Terintegrasi
            </span>
          </button>
        </div>

        {/* Option A: Excel Dropzone */}
        {sourceType === 'excel' && (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl mt-2 hover:border-emerald-400 transition">
            <FileSpreadsheet className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">Pilih File Naskah Soal (.xlsx atau .csv)</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Unggah file Excel yang telah diisi. Sistem akan langsung mengenali bentuk soal dan menyajikan pratinjau kartu asli sebelum disimpan.
            </p>

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="mt-4 block mx-auto text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
            />
          </div>
        )}

        {/* Option B: Google Sheets Live Sync */}
        {sourceType === 'sheets' && (
          <div className="p-4 sm:p-5 border border-emerald-200 bg-emerald-50/30 rounded-xl mt-2 space-y-4">
            {/* Account Status Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {googleUser?.photoURL ? (
                    <img src={googleUser.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>G</span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{isGoogleLoggedIn ? (googleUser?.displayName || googleUser?.email || 'Google Terhubung') : 'Akun Google Belum Terhubung'}</span>
                    {isGoogleLoggedIn && (
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded font-semibold">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isGoogleLoggedIn ? 'Siap membaca naskah soal langsung dari Google Drive Anda.' : 'Masuk untuk mengizinkan sistem membaca spreadsheet secara aman.'}
                  </p>
                </div>
              </div>

              {!isGoogleLoggedIn ? (
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Hubungkan Google
                </button>
              ) : (
                onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate(authorRole === 'guru' ? 'guru-spreadsheet-sync' : 'admin-spreadsheet-sync')}
                    className="px-3 py-1.5 text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200/70 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                  >
                    <span>Buka Pusat Sinkronisasi</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )
              )}
            </div>

            {/* URL Input Form */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Tautan / ID Google Spreadsheet Naskah Soal:
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={sheetsUrl}
                    onChange={e => setSheetsUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleInspectGoogleSheet}
                  disabled={isInspectingSheet || !sheetsUrl.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  {isInspectingSheet ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Memeriksa...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5" />
                      <span>Periksa Spreadsheet</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Tips: Masukkan URL lengkap berkas spreadsheet Anda. Pastikan sheet berisi kolom standar seperti <code>Nomor_Soal</code>, <code>Jenis_Soal</code>, <code>Mata_Pelajaran</code>, <code>Pertanyaan</code>, dan <code>Kunci_Jawaban</code>.
              </p>
            </div>

            {/* Sheet Tabs & Fetch Trigger */}
            {sheetMetadata && (
              <div className="p-3.5 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Spreadsheet Ditemukan:</span>
                    <span className="text-emerald-700 font-extrabold">{sheetMetadata.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                    {sheetMetadata.sheets.length} Lembar Kerja
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                      Pilih Tab Soal:
                    </label>
                    <select
                      value={selectedSheetTab}
                      onChange={e => setSelectedSheetTab(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none flex-1 max-w-xs"
                    >
                      {sheetMetadata.sheets.map(sheet => (
                        <option key={sheet.sheetId} value={sheet.title}>
                          {sheet.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleFetchFromGoogleSheets}
                    disabled={isFetchingSheet || !selectedSheetTab}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isFetchingSheet ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengambil Data...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Tarik Soal dari Google Sheets</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error inspector */}
      {errors.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
          <div className="flex items-center gap-2 font-bold mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Daftar Catatan Validasi File ({errors.length} Temuan):
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px]">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Pratinjau Sesuai Bentuk Asli Soal */}
      {previewQuestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          {/* Header Summary & View Mode Toggles */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  Pratinjau Hasil Impor ({previewQuestions.length} Soal Terbaca)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                  Siap Disimpan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-2 items-center">
                <span>Rincian jenis:</span>
                {trueFalseCount > 0 && (
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {trueFalseCount} Benar/Salah (4-5 Butir)
                  </span>
                )}
                {mcqCount > 0 && (
                  <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    {mcqCount} Pilihan Ganda
                  </span>
                )}
                {complexCount > 0 && (
                  <span className="font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                    {complexCount} PG Kompleks
                  </span>
                )}
                {matchingCount > 0 && (
                  <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {matchingCount} Menjodohkan
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Card vs Table View */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPreviewMode('card')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    previewMode === 'card'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Bentuk Asli Soal
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    previewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  Tabel Data
                </button>
              </div>

              {/* Save All Button */}
              <button
                type="button"
                onClick={handleSaveImport}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Simpan Semua ({previewQuestions.length}) ke Bank Soal
              </button>
            </div>
          </div>

          {/* Sequential Excel Order Banner & Sorting Controls */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-600 text-white rounded-lg shadow-2xs shrink-0">
                <ArrowDown10 className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-emerald-950 text-xs">
                    {hasExcelNumberColumn
                      ? 'Nomor Urut Terbaca Otomatis dari Excel'
                      : 'Penomoran Urut Sekuensial Naskah'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-2xs">
                    Berurutan No. 1 s/d {previewQuestions.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {hasExcelNumberColumn
                    ? 'Soal telah disesuaikan dan diurutkan secara sekuensial mengikuti data nomor urut pada naskah Excel Anda.'
                    : 'Disusun berurutan berdasarkan nomor baris data pada naskah yang diimpor.'}
                </p>
              </div>
            </div>

            {hasExcelNumberColumn && (
              <button
                type="button"
                onClick={handleToggleSort}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-lg shadow-2xs text-[11px] flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {sortByExcelNumber ? 'Urutkan Sesuai No. Excel (Aktif)' : 'Kembalikan ke Urutan Baris Mentah'}
                </span>
              </button>
            )}
          </div>

          {/* 1. Mode Bentuk Asli Soal (Authentic Question Cards) */}
          {previewMode === 'card' && (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {previewQuestions.map((q, idx) => {
                const sub = subjects.find(s => s.id === q.subjectId);
                const subName = sub ? sub.name : q.subjectId;

                return (
                  <div
                    key={q.id || idx}
                    className="border border-slate-200 rounded-2xl p-4 bg-slate-50/40 hover:border-slate-300 transition text-xs space-y-3"
                  >
                    {/* Card Header */}
                    <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-200/80 gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1 font-mono">
                          <span className="font-black text-white bg-slate-900 px-2.5 py-0.5 rounded-md text-xs shadow-2xs flex items-center gap-1">
                            <Hash className="w-3 h-3 text-amber-400" />
                            No. {q.orderNumber || idx + 1}
                          </span>
                          {q.orderNumber && (
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded">
                              Excel #{q.orderNumber}
                            </span>
                          )}
                        </div>

                        {q.type === 'true_false' && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                            Benar / Salah ({q.trueFalseItems?.length || 4} Pernyataan)
                          </span>
                        )}
                        {q.type === 'mcq' && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]">
                            Pilihan Ganda
                          </span>
                        )}
                        {q.type === 'complex_mcq' && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px]">
                            PG Kompleks
                          </span>
                        )}
                        {q.type === 'matching' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                            Menjodohkan
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold text-[10px]">
                          {subName} • Kelas {q.grade}
                        </span>

                        <span className="text-[10px] text-slate-500 font-medium">
                          Topik: <strong className="text-slate-700">{q.topic}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                          {q.points} Poin
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePreviewItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus dari daftar impor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Statement */}
                    <div>
                      <p className="font-semibold text-slate-900 leading-relaxed text-xs sm:text-sm">
                        {q.questionText}
                      </p>
                    </div>

                    {/* Specific Shape Render */}

                    {/* A. True / False: Table with 4-5 Statements & Interactive BENAR/SALAH badges */}
                    {q.type === 'true_false' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">
                            Tabel Butir Pernyataan (Klik tombol untuk merubah kunci jika diperlukan):
                          </span>
                          <span className="text-emerald-700 font-bold">
                            {q.trueFalseItems?.length || 0} Butir Terbaca
                          </span>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                              <tr>
                                <th scope="col" className="w-10 px-3 py-2 text-center">No</th>
                                <th scope="col" className="px-3 py-2">Pernyataan</th>
                                <th scope="col" className="w-44 px-3 py-2 text-center">Kunci Terpilih</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(q.trueFalseItems || []).map((item, sIdx) => (
                                <tr key={item.id || sIdx} className="hover:bg-slate-50/70">
                                  <td className="px-3 py-2.5 text-center font-bold text-slate-400 align-middle">
                                    {sIdx + 1}
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-900 font-medium align-middle">
                                    {item.statement}
                                  </td>
                                  <td className="px-3 py-2.5 align-middle">
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleTrueFalseKey(q.id, item.id)}
                                        className={`py-1 px-2 rounded-lg font-black text-[11px] transition flex items-center justify-center gap-1 ${
                                          item.isCorrect
                                            ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400'
                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                        }`}
                                      >
                                        <Check className="w-3 h-3" />
                                        BENAR
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleTrueFalseKey(q.id, item.id)}
                                        className={`py-1 px-2 rounded-lg font-black text-[11px] transition flex items-center justify-center gap-1 ${
                                          !item.isCorrect
                                            ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-400'
                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                        }`}
                                      >
                                        <X className="w-3 h-3" />
                                        SALAH
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* B. Multiple Choice (MCQ) */}
                    {q.type === 'mcq' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {(q.options || []).map(opt => {
                          const isCorrect = q.correctAnswer === opt.key;
                          return (
                            <div
                              key={opt.key}
                              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {opt.key}
                              </span>
                              <span className="flex-1 truncate">{opt.text}</span>
                              {isCorrect && (
                                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                                  Kunci
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* C. Complex MCQ */}
                    {q.type === 'complex_mcq' && (
                      <div className="space-y-1.5 pt-1">
                        {(q.complexOptions || []).map((opt, oIdx) => (
                          <div
                            key={opt.id || oIdx}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              opt.isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                                opt.isCorrect ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                              }`}
                            >
                              {opt.isCorrect ? '✓' : ''}
                            </span>
                            <span className="flex-1">{opt.label}</span>
                            {opt.isCorrect && (
                              <span className="text-[10px] text-emerald-700 font-bold">Benar</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* D. Matching */}
                    {q.type === 'matching' && (
                      <div className="space-y-1.5 pt-1">
                        {(q.matchingPairs || []).map((pair, pIdx) => (
                          <div
                            key={pair.id || pIdx}
                            className="p-2.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-700"
                          >
                            <span className="font-semibold text-slate-900">{pair.leftPrompt}</span>
                            <div className="flex items-center gap-1.5 text-blue-700 font-bold bg-blue-50 px-2 py-1 rounded-lg">
                              <ArrowRight className="w-3.5 h-3.5" />
                              <span>{pair.rightAnswer}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Discussion if available */}
                    {q.discussion && (
                      <div className="p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                        <strong className="text-amber-950">Pembahasan:</strong> {q.discussion}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. Mode Tabel Data Excel (Grid) */}
          {previewMode === 'table' && (
            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 sticky top-0 font-semibold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-center w-28">No. Excel</th>
                    <th className="p-3">Jenis Soal</th>
                    <th className="p-3">Mapel</th>
                    <th className="p-3">Pertanyaan</th>
                    <th className="p-3">Kunci / Butir</th>
                    <th className="p-3">Bobot</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewQuestions.map((q, i) => {
                    const sub = subjects.find(s => s.id === q.subjectId);
                    return (
                      <tr key={q.id || i} className="hover:bg-slate-50">
                        <td className="p-3 text-center">
                          <span className="font-mono font-black text-white bg-slate-900 px-2.5 py-1 rounded-md text-xs inline-flex items-center gap-0.5 shadow-2xs">
                            <Hash className="w-3 h-3 text-amber-400" />
                            No. {q.orderNumber || i + 1}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-emerald-700">
                          {q.type === 'true_false' ? `Benar/Salah (${q.trueFalseItems?.length || 4} Butir)` : q.type}
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          {sub ? sub.name : q.subjectId} (Kls {q.grade})
                        </td>
                        <td className="p-3 text-slate-900 max-w-xs truncate">{q.questionText}</td>
                        <td className="p-3 font-mono font-bold text-slate-700">
                          {q.type === 'true_false' && q.trueFalseItems
                            ? q.trueFalseItems.map(item => (item.isCorrect ? 'B' : 'S')).join(', ')
                            : q.correctAnswer || '-'}
                        </td>
                        <td className="p-3 text-slate-600 font-semibold">{q.points}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemovePreviewItem(i)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Success logs */}
      {successLogs.length > 0 && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs">
          <p className="font-bold flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Laporan Keberhasilan Impor ({successLogs.length} Soal Berhasil Disimpan):
          </p>
          <div className="max-h-40 overflow-y-auto space-y-1 text-[11px] font-mono text-emerald-800">
            {successLogs.map((log, idx) => (
              <div key={idx}>✓ {log}</div>
            ))}
          </div>
          {onNavigate && (
            <div className="mt-3 pt-3 border-t border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-emerald-900 font-semibold text-xs">
                Ingin melihat simulasi tampilan CBT siswa atau format naskah cetak soal yang baru saja diimpor?
              </span>
              <button
                type="button"
                onClick={() => onNavigate(authorRole === 'guru' ? 'guru-preview-soal' : 'admin-preview-soal')}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Eye className="w-3.5 h-3.5" />
                Buka Preview Tampilan Soal
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
