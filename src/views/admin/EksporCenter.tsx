import React from 'react';
import {
  DownloadCloud,
  Building2,
  Users,
  GraduationCap,
  FileQuestion,
  CalendarCheck,
  Award,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { School, User, Question, ExamPackage, StudentExamSession, Subject, SystemSettings } from '../../types';
import { ExcelService } from '../../services/excelService';

interface EksporCenterProps {
  schools: School[];
  users: User[];
  questions: Question[];
  packages: ExamPackage[];
  sessions: StudentExamSession[];
  subjects: Subject[];
  settings: SystemSettings;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const EksporCenter: React.FC<EksporCenterProps> = ({
  schools,
  users,
  questions,
  packages,
  sessions,
  subjects,
  settings,
  showToast
}) => {
  const teachers = users.filter(u => u.role === 'guru');
  const students = users.filter(u => u.role === 'siswa');
  const examParticipants = students.filter(s => s.isActive);

  const exportActions = [
    {
      title: '1. Data Sekolah Dasar (SD)',
      desc: 'Daftar seluruh SD negeri & swasta, NPSN, kepala sekolah, dan kontak operator',
      count: `${schools.length} Sekolah`,
      icon: Building2,
      color: 'blue',
      action: () => {
        ExcelService.exportSchools(schools, settings.districtName, settings.academicYear);
        showToast('success', 'Ekspor Berhasil', 'Data Sekolah telah diunduh ke Excel.');
      }
    },
    {
      title: '2. Data Tenaga Pendidik / Guru',
      desc: 'Daftar guru kelas dan guru mapel beserta penugasan sekolah dan mata pelajaran',
      count: `${teachers.length} Guru`,
      icon: Users,
      color: 'emerald',
      action: () => {
        ExcelService.exportTeachers(teachers, schools, subjects);
        showToast('success', 'Ekspor Berhasil', 'Data Guru telah diunduh ke Excel.');
      }
    },
    {
      title: '3. Seluruh Data Siswa Terdaftar',
      desc: 'Master data siswa SD dengan NISN, nama lengkap, sekolah, dan kelas',
      count: `${students.length} Siswa`,
      icon: GraduationCap,
      color: 'indigo',
      action: () => {
        ExcelService.exportStudents(students, schools, settings.academicYear, false);
        showToast('success', 'Ekspor Berhasil', 'Data Siswa telah diunduh ke Excel.');
      }
    },
    {
      title: '4. Daftar Peserta Ujian Terverifikasi',
      desc: 'Khusus siswa yang memiliki status aktif mengikuti ujian semester dan nomor peserta resmi',
      count: `${examParticipants.length} Peserta`,
      icon: GraduationCap,
      color: 'purple',
      action: () => {
        ExcelService.exportStudents(examParticipants, schools, settings.academicYear, true);
        showToast('success', 'Ekspor Berhasil', 'Daftar Peserta Ujian telah diunduh.');
      }
    },
    {
      title: '5. Bank Soal Ujian (4 Model Soal)',
      desc: 'Naskah soal pilihan ganda, PG kompleks, menjodohkan, benar/salah beserta kunci dan bobot',
      count: `${questions.length} Butir Soal`,
      icon: FileQuestion,
      color: 'amber',
      action: () => {
        ExcelService.exportQuestions(questions, subjects);
        showToast('success', 'Ekspor Berhasil', 'Bank Soal telah diunduh ke Excel.');
      }
    },
    {
      title: '6. Hasil & Rekap Nilai Siswa (Semua SD)',
      desc: 'Nilai akhir CBT, jumlah jawaban benar, salah, kosong, dan status ketuntasan KKM',
      count: `${sessions.length} Hasil Ujian`,
      icon: Award,
      color: 'rose',
      action: () => {
        ExcelService.exportExamResults(sessions, 'Kecamatan_Semua_Mapel');
        showToast('success', 'Ekspor Berhasil', 'Rekap Hasil Ujian telah diunduh.');
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <DownloadCloud className="w-5 h-5 text-emerald-600" />
          Pusat Ekspor Data ke Format Excel (.xlsx)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Unduh database resmi dan rekap ujian semester ke file spreadsheet Microsoft Excel yang valid
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exportActions.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-blue-600">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {item.count}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <button
                  onClick={item.action}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Unduh File .xlsx
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Templates Section */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
          <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          Template Kosong untuk Impor Data Excel
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Gunakan file template ini jika Anda ingin mengumpulkan data dari operator sekolah atau guru sebelum diimpor kembali ke sistem.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              ExcelService.downloadStudentImportTemplate();
              showToast('success', 'Template Diunduh', 'Template siswa siap digunakan.');
            }}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 shadow-2xs transition flex items-center gap-2"
          >
            <DownloadCloud className="w-4 h-4 text-emerald-600" />
            Template Impor Data Siswa (.xlsx)
          </button>
          <button
            onClick={() => {
              ExcelService.downloadQuestionImportTemplate();
              showToast('success', 'Template Diunduh', 'Template soal siap digunakan.');
            }}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 shadow-2xs transition flex items-center gap-2"
          >
            <DownloadCloud className="w-4 h-4 text-blue-600" />
            Template Impor Bank Soal (.xlsx)
          </button>
        </div>
      </div>
    </div>
  );
};
