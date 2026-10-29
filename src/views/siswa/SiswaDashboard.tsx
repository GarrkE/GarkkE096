import React from 'react';
import {
  GraduationCap,
  PlayCircle,
  FileCheck,
  CalendarCheck,
  Building2,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Award
} from 'lucide-react';
import { User, School, ExamPackage, StudentExamSession, Subject, SystemSettings } from '../../types';

interface SiswaDashboardProps {
  currentUser: User;
  schools: School[];
  packages: ExamPackage[];
  sessions: StudentExamSession[];
  subjects: Subject[];
  settings: SystemSettings;
  onStartExam: (pkg: ExamPackage) => void;
  onNavigate: (tab: string) => void;
}

export const SiswaDashboard: React.FC<SiswaDashboardProps> = ({
  currentUser,
  schools,
  packages,
  sessions,
  subjects,
  settings,
  onStartExam,
  onNavigate
}) => {
  const school = schools.find(s => s.id === currentUser.schoolId) || schools[0];

  // Eligible exam packages for this student (based on grade, school, and religion)
  const myPackages = packages.filter(pkg => {
    const matchGrade = pkg.grade === (currentUser.grade || 6);
    const matchSchool = pkg.schoolIds.includes(currentUser.schoolId || '') || pkg.schoolIds.includes('ALL');
    if (!matchGrade || !matchSchool) return false;

    // Religion matching: if subject is religious, only students with that religion receive it
    const sub = subjects.find(s => s.id === pkg.subjectId);
    if (sub?.religion) {
      const studentRel = currentUser.religion || 'Islam';
      if (sub.religion !== studentRel) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Official Exam Participant Card (Kartu Peserta Ujian Semester) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <GraduationCap className="w-10 h-10 text-blue-200" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Peserta Ujian Semester Terverifikasi
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{currentUser.fullName}</h2>
              <p className="text-xs sm:text-sm text-blue-200 mt-0.5 flex flex-wrap items-center gap-2">
                <span>{school?.name}</span>
                <span>•</span>
                <span>Kelas {currentUser.grade || 6}{currentUser.rombel || 'A'}</span>
                <span>•</span>
                <span className="bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-400/30 text-[11px]">
                  Agama: {currentUser.religion || 'Islam'}
                </span>
              </p>
            </div>
          </div>

          {/* Participant Number Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-right">
            <span className="text-[10px] uppercase font-bold text-blue-200 block">Nomor Peserta Ujian Resmi</span>
            <span className="font-mono text-lg sm:text-xl font-extrabold text-white tracking-wider block">
              {currentUser.participantNumber || '01-054-001-8'}
            </span>
            <span className="text-[11px] text-blue-300 font-mono block mt-0.5">
              NISN: {currentUser.nisn || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Available Exams Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-blue-600" />
              Naskah Ujian Semester Tersedia
            </h3>
            <p className="text-xs text-slate-500">Klik tombol Mulai Ujian apabila jadwal ujian sudah dibuka</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myPackages.map(pkg => {
            const sub = subjects.find(s => s.id === pkg.subjectId);
            const mySession = sessions.find(s => s.studentId === currentUser.id && s.examPackageId === pkg.id);
            const isCompleted = mySession && (mySession.status === 'submitted' || mySession.status === 'graded');
            const isOngoing = pkg.status === 'ongoing';

            return (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isCompleted
                        ? 'bg-slate-100 text-slate-700'
                        : isOngoing
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isCompleted
                        ? '✓ Sudah Dikerjakan'
                        : isOngoing
                        ? '● Ujian Sedang Dibuka'
                        : 'Belum Dimulai'}
                    </span>

                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {pkg.durationMinutes} Menit
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{pkg.title}</h4>
                  <p className="text-xs text-blue-600 font-semibold mt-1">
                    {sub ? sub.name : pkg.subjectId}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tanggal:</span>
                      <span className="font-semibold text-slate-800">{pkg.examDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Waktu:</span>
                      <span className="font-mono text-slate-800">{pkg.startTime} - {pkg.endTime} WIB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Jumlah Soal:</span>
                      <span className="font-bold text-blue-700">{pkg.questionIds.length} Soal</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  {isCompleted ? (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <p className="text-xs font-bold text-slate-700">Ujian Selesai</p>
                      {pkg.showScoreImmediately && mySession ? (
                        <p className="text-sm font-extrabold text-blue-700 mt-0.5">
                          Nilai Kamu: {mySession.score}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-500 mt-0.5">Nilai sedang diproses oleh guru.</p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => onStartExam(pkg)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 ${
                        isOngoing
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      <PlayCircle className="w-4 h-4" />
                      {isOngoing ? 'Mulai Kerjakan Ujian Sekarang' : 'Buka CBT (Uji Coba / Simulasi)'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Petunjuk Pengerjaan untuk Siswa SD */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 text-xs text-amber-950 space-y-2">
        <h4 className="font-bold flex items-center gap-2 text-sm text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          Petunjuk Penting Pengerjaan Ujian CBT Sekolah Dasar:
        </h4>
        <ul className="list-disc list-inside space-y-1 text-slate-700 leading-relaxed">
          <li>Pastikan perangkat kamu (laptop/komputer/HP/tablet) terhubung ke jaringan internet yang stabil.</li>
          <li>Perhatikan waktu mundur di sudut atas layar. Ujian akan tersimpan otomatis saat waktu habis.</li>
          <li>Setiap jawaban yang kamu pilih akan tersimpan secara otomatis setiap kali kamu berpindah soal.</li>
          <li>Jika masih ragu dengan jawabanmu, gunakan tombol warna kuning <strong>"Tandai Ragu-ragu"</strong>.</li>
          <li>Sebelum menekan tombol <strong>"Selesaikan Ujian"</strong>, pastikan seluruh soal telah dijawab lengkap.</li>
        </ul>
      </div>

    </div>
  );
};
