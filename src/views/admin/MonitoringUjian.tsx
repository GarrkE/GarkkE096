import React, { useState } from 'react';
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  UserCheck,
  Building2
} from 'lucide-react';
import { ExamPackage, StudentExamSession, School, User } from '../../types';
import { AppStorage } from '../../services/storage';

interface MonitoringUjianProps {
  packages: ExamPackage[];
  sessions: StudentExamSession[];
  schools: School[];
  users: User[];
  onRefresh: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const MonitoringUjian: React.FC<MonitoringUjianProps> = ({
  packages,
  sessions,
  schools,
  users,
  onRefresh,
  showToast
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>(packages[0]?.id || '');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const currentPkg = packages.find(p => p.id === selectedPkgId) || packages[0];
  const students = users.filter(u => u.role === 'siswa' && u.isActive);

  // Eligible students for this exam package
  const eligibleStudents = students.filter(st => {
    if (!currentPkg) return false;
    const matchSchool = currentPkg.schoolIds.includes(st.schoolId || '');
    const matchGrade = st.grade === currentPkg.grade;
    return matchSchool && matchGrade;
  });

  // Merge sessions with student list
  const monitoringData = eligibleStudents.map(st => {
    const session = sessions.find(s => s.studentId === st.id && s.examPackageId === currentPkg?.id);
    const school = schools.find(sch => sch.id === st.schoolId);

    return {
      student: st,
      schoolName: school ? school.name : st.schoolName || '-',
      session
    };
  });

  const filteredData = monitoringData.filter(item => {
    const matchSearch =
      item.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.student.participantNumber && item.student.participantNumber.includes(searchTerm));
    const matchSchool = selectedSchoolId === 'ALL' || item.student.schoolId === selectedSchoolId;
    return matchSearch && matchSchool;
  });

  // Metrics
  const totalEligible = eligibleStudents.length;
  const ongoingCount = sessions.filter(s => s.examPackageId === currentPkg?.id && s.status === 'ongoing').length;
  const completedCount = sessions.filter(s => s.examPackageId === currentPkg?.id && (s.status === 'submitted' || s.status === 'graded')).length;
  const notStartedCount = Math.max(0, totalEligible - ongoingCount - completedCount);

  const handleResetSession = (sessionId: string, studentName: string) => {
    if (window.confirm(`Yakin ingin mereset sesi ujian untuk "${studentName}"? Siswa dapat mengulang kembali pengerjaan.`)) {
      const allSessions = AppStorage.getExamSessions().filter(s => s.id !== sessionId);
      localStorage.setItem('sukamaju_cbt_exam_sessions', JSON.stringify(allSessions));
      AppStorage.logActivity('Admin Kecamatan', 'admin', 'Reset Sesi Ujian Siswa', `Mereset sesi ujian siswa: ${studentName}`);
      onRefresh();
      showToast('info', 'Sesi Direset', `Siswa ${studentName} dapat memulai kembali ujian CBT.`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-600 animate-pulse" />
            Monitoring Ujian Online CBT (Real-Time)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau kehadiran, progres pengerjaan, dan status koneksi siswa saat ujian berlangsung
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Segarkan Data
        </button>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-700 shrink-0">Paket Ujian:</span>
          <select
            value={selectedPkgId}
            onChange={e => setSelectedPkgId(e.target.value)}
            aria-label="Pilih paket ujian"
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-900 font-semibold focus:outline-hidden"
          >
            {packages.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>

          <select
            value={selectedSchoolId}
            onChange={e => setSelectedSchoolId(e.target.value)}
            aria-label="Filter berdasarkan sekolah"
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">Semua Sekolah ({schools.length} SD)</option>
            {schools.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari siswa atau nomor ujian..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      {/* KPI Cards for Monitoring */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Total Peserta Terdaftar</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalEligible}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Siswa Kelas {currentPkg?.grade} SD</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-blue-600 uppercase">Sedang Mengerjakan</p>
          <p className="text-2xl font-extrabold text-blue-700 mt-1">{ongoingCount}</p>
          <p className="text-[10px] text-blue-500 mt-0.5">Koneksi CBT Aktif</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase">Sudah Selesai</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{completedCount}</p>
          <p className="text-[10px] text-emerald-500 mt-0.5">Jawaban Tersimpan & Dinilai</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase">Belum Membuka Ujian</p>
          <p className="text-2xl font-extrabold text-slate-600 mt-1">{notStartedCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Menunggu Siswa Login</p>
        </div>
      </div>

      {/* Live Monitoring Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Mobile Swipe Hint */}
        <div className="px-3.5 py-2 bg-indigo-50/60 border-b border-indigo-100 text-[11px] text-indigo-900 flex items-center justify-between sm:hidden">
          <span className="font-medium text-[10px] flex items-center gap-1">
            <span>👉</span> Geser tabel ke kanan untuk melihat rincian & aksi pengawas
          </span>
          <span className="font-bold text-[10px] font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
            {filteredData.length} Siswa
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">No. Peserta</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Sekolah & Kelas</th>
                <th className="py-3 px-4 text-center">Status CBT</th>
                <th className="py-3 px-4">Waktu Pengerjaan</th>
                <th className="py-3 px-4 text-center">Jawaban Masuk</th>
                <th className="py-3 px-4 text-center">Nilai CBT</th>
                <th className="py-3 px-4 text-center">Aksi Pengawas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada siswa terdaftar pada paket ujian ini.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const s = item.session;
                  const isFinished = s && (s.status === 'graded' || s.status === 'submitted');
                  const isOngoing = s && s.status === 'ongoing';

                  const totalQuestions = currentPkg?.questionIds?.length || 0;
                  const answeredCount = s ? Object.keys(s.answers || {}).length : 0;

                  return (
                    <tr key={item.student.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-slate-400 font-medium">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {item.student.participantNumber || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.student.fullName}</div>
                        <div className="text-[10px] text-slate-400">NISN: {item.student.nisn}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{item.schoolName}</div>
                        <div className="text-[10px] text-slate-500">Kelas {item.student.grade}{item.student.rombel}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isFinished ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai
                          </span>
                        ) : isOngoing ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 inline-flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3 text-blue-600" /> Mengerjakan
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            Belum Masuk
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {s?.startedAt ? (
                          <div>
                            <div>Mulai: {s.startedAt.slice(11, 16)}</div>
                            {s.finishedAt && (
                              <div className="text-[10px] text-slate-400">
                                Selesai: {s.finishedAt.slice(11, 16)} ({Math.round(s.durationSpentSeconds / 60)} mnt)
                              </div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">
                        {s ? (
                          <span className={`${answeredCount === totalQuestions ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {answeredCount} / {totalQuestions} Soal
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-extrabold text-sm">
                        {isFinished ? (
                          <span className={s.score >= 75 ? 'text-emerald-600' : 'text-amber-600'}>
                            {s.score}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s && (
                          <button
                            onClick={() => handleResetSession(s.id, item.student.fullName)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold border border-amber-200 transition flex items-center gap-1 mx-auto"
                            title="Reset sesi jika terjadi kendala teknis / izin pengawas"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset Sesi
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
