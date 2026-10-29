import React from 'react';
import {
  GraduationCap,
  FileQuestion,
  CalendarCheck,
  Award,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  School as SchoolIcon,
  Plus,
  FileSpreadsheet
} from 'lucide-react';
import { User, School, Question, ExamPackage, StudentExamSession, Subject, SystemSettings } from '../../types';

interface GuruDashboardProps {
  currentUser: User;
  schools: School[];
  users: User[];
  questions: Question[];
  packages: ExamPackage[];
  sessions: StudentExamSession[];
  subjects: Subject[];
  settings: SystemSettings;
  onNavigate: (tab: string) => void;
}

export const GuruDashboard: React.FC<GuruDashboardProps> = ({
  currentUser,
  schools,
  users,
  questions,
  packages,
  sessions,
  subjects,
  settings,
  onNavigate
}) => {
  const teacherSchool = schools.find(s => s.id === currentUser.schoolId) || schools[0];
  const teacherGrade = currentUser.grade || 6;
  const teacherRombel = (currentUser.rombel || 'A').toUpperCase();
  
  // Hanya fokus ke 1 kelas yang diampu saja
  const schoolStudents = users.filter(
    u => u.role === 'siswa' &&
         u.schoolId === teacherSchool.id &&
         u.grade === teacherGrade &&
         (u.rombel || 'A').toUpperCase() === teacherRombel
  );
  const teacherQuestions = questions.filter(q => q.authorName === currentUser.fullName || q.schoolId === teacherSchool.id);
  
  // Sessions for this teacher's class
  const schoolSessions = sessions.filter(
    s => s.schoolId === teacherSchool.id &&
         s.grade === teacherGrade &&
         (s.rombel || 'A').toUpperCase() === teacherRombel
  );
  const completedSessions = schoolSessions.filter(s => s.status === 'graded' || s.status === 'submitted');
  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + s.score, 0) / completedSessions.length)
    : 0;

  const teacherSubNames = (currentUser.subjects || [])
    .map(subId => subjects.find(s => s.id === subId)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-emerald-100 mb-2">
              <SchoolIcon className="w-3.5 h-3.5" />
              {teacherSchool.name} • Wali / Guru Kelas {teacherGrade}{teacherRombel}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Selamat Datang, {currentUser.fullName}
            </h2>
            <p className="text-xs text-emerald-100 mt-1 max-w-xl">
              NIP: {currentUser.nip || '-'} • Pengampu: Guru Kelas {teacherGrade}{teacherRombel} (Fokus {schoolStudents.length} Siswa Diampu)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('guru-impor-naskah')}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-900" />
              Import Naskah Ujian
            </button>
            <button
              onClick={() => onNavigate('guru-bank-soal')}
              className="px-3.5 py-2 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              Tulis Soal Baru
            </button>
          </div>
        </div>
      </div>

      {/* Special Banner for Guru Pembuat Naskah Ujian */}
      {(currentUser.isQuestionAuthor || currentUser.username === 'pembuat_soal') && (
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-orange-500/10 border-2 border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl shrink-0 mt-0.5">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Hak Akses Khusus: Guru Pembuat Naskah Ujian
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950">
                  Terintegrasi Bank Soal
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                Anda memiliki akses naskah ujian se-kecamatan. Cukup unggah file naskah format Excel, sistem akan otomatis mengonversi butir soal pilihan ganda, kompleks, dan menjodohkan ke bank soal CBT.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('guru-impor-naskah')}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition shrink-0 flex items-center gap-2"
          >
            <span>Tinggal Import Naskah Ujian</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards for Guru */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Siswa Diampu</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{schoolStudents.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Kelas {teacherGrade}{teacherRombel} • {teacherSchool.name}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Soal Saya</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileQuestion className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{teacherQuestions.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Di Bank Soal Kecamatan</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Paket Ujian</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{packages.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Terjadwal Semester Ini</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Rata Nilai</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{avgScore}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Standar KKM: {settings.defaultKkm}</p>
        </div>
      </div>

      {/* Quick Action Tables for Guru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Siswa Bimbingan Sekolah */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Daftar Siswa Kelas {teacherGrade}{teacherRombel}</h3>
              <p className="text-xs text-slate-500">{teacherSchool.name} • Fokus 1 Kelas Binaan</p>
            </div>
            <button
              onClick={() => onNavigate('guru-siswa')}
              className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
            >
              Lihat Roster <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {schoolStudents.slice(0, 5).map((st, i) => (
              <div key={st.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{st.fullName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">No. Peserta: {st.participantNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[10px]">
                    Kelas {st.grade}{st.rombel}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    st.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {st.isActive ? 'Siap Ujian' : 'Nonaktif'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Jadwal Pelaksanaan Ujian */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Jadwal Ujian Semester</h3>
              <p className="text-xs text-slate-500">Mata pelajaran dan waktu pelaksanaan</p>
            </div>
            <button
              onClick={() => onNavigate('guru-laporan')}
              className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
            >
              Rekap Nilai <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {packages.slice(0, 4).map(pkg => (
              <div key={pkg.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{pkg.title}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    pkg.status === 'ongoing' ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {pkg.status === 'ongoing' ? '● Sedang Berlangsung' : 'Terjadwal'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Tanggal: {pkg.examDate} • Pukul: {pkg.startTime} - {pkg.endTime} WIB ({pkg.durationMinutes} Menit)
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
