import React from 'react';
import {
  CalendarCheck,
  Clock,
  BookOpen,
  Building2,
  PlayCircle,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { ExamPackage, Subject, User, School } from '../../types';

interface SiswaJadwalViewProps {
  currentUser: User;
  packages: ExamPackage[];
  subjects: Subject[];
  school: School;
  onStartExam: (pkg: ExamPackage) => void;
}

export const SiswaJadwalView: React.FC<SiswaJadwalViewProps> = ({
  currentUser,
  packages,
  subjects,
  school,
  onStartExam
}) => {
  // Packages for student's grade, school, and religion
  const myPackages = packages.filter(pkg => {
    const matchGrade = pkg.grade === (currentUser.grade || 6);
    const matchSchool = pkg.schoolIds.includes(currentUser.schoolId || '') || pkg.schoolIds.includes('ALL');
    if (!matchGrade || !matchSchool) return false;

    // Religion matching
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
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-blue-600" />
          Kalender & Jadwal Pelaksanaan Ujian Semester
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Jadwal resmi penilaian akhir semester sekolah dasar untuk {school.name} (Kelas {currentUser.grade || 6}{currentUser.rombel || 'A'} • Agama: {currentUser.religion || 'Islam'})
        </p>
      </div>

      {/* Grid of Schedules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myPackages.map(pkg => {
          const sub = subjects.find(s => s.id === pkg.subjectId);
          const isOngoing = pkg.status === 'ongoing';

          return (
            <div
              key={pkg.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between ${
                isOngoing ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isOngoing ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isOngoing ? '● Sedang Berlangsung' : 'Terjadwal'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    {pkg.durationMinutes} Menit
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">{pkg.title}</h3>
                <p className="text-xs text-blue-600 font-semibold mt-1">
                  {sub ? sub.name : pkg.subjectId}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tanggal:</span>
                    <span className="font-semibold text-slate-800">{pkg.examDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jam:</span>
                    <span className="font-mono text-slate-800 font-bold">{pkg.startTime} - {pkg.endTime} WIB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jumlah Soal:</span>
                    <span className="font-bold text-blue-700">{pkg.questionIds.length} Soal CBT</span>
                  </div>
                </div>
              </div>

                <button
                  onClick={() => onStartExam(pkg)}
                  className={`w-full py-2.5 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 ${
                    isOngoing
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  <PlayCircle className="w-4 h-4" />
                  {isOngoing ? 'Masuk ke Ruang Ujian CBT' : 'Uji Coba CBT (Simulasi)'}
                </button>
            </div>
          );
        })}
      </div>

      {/* Rules Notice */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 text-xs text-blue-950 space-y-1.5">
        <h4 className="font-bold flex items-center gap-1.5 text-blue-900">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          Tata Tertib Pelaksanaan Ujian Semester SD:
        </h4>
        <ul className="list-disc list-inside space-y-0.5 text-slate-700">
          <li>Siswa hadir di ruang komputer atau siap di depan gawai 15 menit sebelum ujian dimulai.</li>
          <li>Login menggunakan nomor peserta atau username resmi yang tertera pada kartu peserta.</li>
          <li>Dilarang membuka tab lain atau berkomunikasi dengan peserta lain selama ujian berlangsung.</li>
        </ul>
      </div>
    </div>
  );
};
