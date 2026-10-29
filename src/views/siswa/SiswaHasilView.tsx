import React from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Printer,
  FileCheck,
  AlertCircle,
  Building2,
  GraduationCap
} from 'lucide-react';
import { StudentExamSession, ExamPackage, User, School, SystemSettings } from '../../types';

interface SiswaHasilViewProps {
  currentUser: User;
  sessions: StudentExamSession[];
  packages: ExamPackage[];
  school: School;
  settings: SystemSettings;
}

export const SiswaHasilView: React.FC<SiswaHasilViewProps> = ({
  currentUser,
  sessions,
  packages,
  school,
  settings
}) => {
  const mySessions = sessions.filter(s => s.studentId === currentUser.id);

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Hasil & Capaian Nilai Ujian Semester Saya
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Nilai resmi CBT hasil pengerjaan mandiri pada Penilaian Akhir Semester (PAS)
          </p>
        </div>

        {mySessions.length > 0 && (
          <button
            onClick={handlePrintSlip}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition"
          >
            <Printer className="w-4 h-4" />
            Cetak Slip Nilai Saya
          </button>
        )}
      </div>

      {/* Grid of Results */}
      <div className="space-y-4">
        {mySessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 no-print">
            <FileCheck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">Belum Ada Hasil Ujian yang Tersimpan</p>
            <p className="text-xs text-slate-400 mt-1">
              Setelah kamu menyelesaikan ujian di Ruang Ujian CBT, hasil nilai akan langsung muncul di halaman ini.
            </p>
          </div>
        ) : (
          mySessions.map(s => {
            const pkg = packages.find(p => p.id === s.examPackageId);
            const isAllowed = pkg ? pkg.showScoreImmediately : true;
            const isPassed = s.score >= settings.defaultKkm;

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      Telah Dinilai Sistem CBT
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{pkg?.title || 'Ujian Semester'}</h3>
                    <p className="text-xs text-slate-500">
                      Diselesaikan pada: {s.finishedAt ? s.finishedAt.replace('T', ' ').slice(0, 16) : '-'} WIB
                    </p>
                  </div>

                  <div className="text-right">
                    {isAllowed ? (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Nilai Capaian</span>
                        <span className={`text-3xl font-black ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {s.score}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic bg-slate-100 px-3 py-1 rounded-lg">
                        Nilai diproses guru
                      </span>
                    )}
                  </div>
                </div>

                {isAllowed && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block">Jumlah Soal Benar:</span>
                      <strong className="text-emerald-700 text-sm">{s.totalCorrect} Soal</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Jumlah Soal Salah:</span>
                      <strong className="text-rose-700 text-sm">{s.totalIncorrect} Soal</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Standar Kelulusan (KKM):</span>
                      <strong className="text-slate-700 text-sm">{settings.defaultKkm}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Status Ketuntasan:</span>
                      <strong className={isPassed ? 'text-emerald-700 text-sm' : 'text-rose-700 text-sm'}>
                        {isPassed ? 'TUNTAS' : 'REMEDIAL'}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Slip Cetak Resmi Siswa */}
      {mySessions.length > 0 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm max-w-2xl mx-auto print:border-none print:shadow-none text-slate-900 font-sans text-xs space-y-4">
          <div className="border-b-2 border-slate-800 pb-3 text-center">
            <h4 className="font-bold uppercase text-[11px] text-slate-600">
              KORWIL BIDANG PENDIDIKAN {settings.districtName.toUpperCase()}
            </h4>
            <h3 className="font-black text-sm uppercase">SLIP HASIL PENILAIAN AKHIR SEMESTER</h3>
            <p className="text-[10px] text-slate-500">Tahun Pelajaran {settings.academicYear} ({settings.activeSemester})</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Nama Siswa: <strong>{currentUser.fullName}</strong></div>
            <div>No. Peserta: <strong className="font-mono">{currentUser.participantNumber}</strong></div>
            <div>Sekolah: <strong>{school.name}</strong></div>
            <div>Kelas: <strong>Kelas {currentUser.grade}{currentUser.rombel}</strong></div>
          </div>

          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-center font-bold">
                <th className="border border-slate-300 p-2">Mata Pelajaran</th>
                <th className="border border-slate-300 p-2">Nilai Akhir</th>
                <th className="border border-slate-300 p-2">KKM</th>
                <th className="border border-slate-300 p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {mySessions.map((s, idx) => {
                const pkg = packages.find(p => p.id === s.examPackageId);
                return (
                  <tr key={idx} className="border-b border-slate-200 text-center">
                    <td className="border border-slate-300 p-2 text-left font-bold">{pkg?.title || 'Ujian'}</td>
                    <td className="border border-slate-300 p-2 font-black text-blue-900">{s.score}</td>
                    <td className="border border-slate-300 p-2">{settings.defaultKkm}</td>
                    <td className="border border-slate-300 p-2 font-bold">
                      {s.score >= settings.defaultKkm ? 'TUNTAS' : 'REMEDIAL'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="pt-4 flex justify-between text-[11px] text-center">
            <div>
              <p>Mengetahui Orang Tua / Wali,</p>
              <div className="h-10"></div>
              <p>( ................................................. )</p>
            </div>
            <div>
              <p>{settings.districtName}, {new Date().toLocaleDateString('id-ID')}</p>
              <p>Wali Kelas,</p>
              <div className="h-8"></div>
              <p className="font-bold underline">Guru Kelas {currentUser.grade}{currentUser.rombel}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
