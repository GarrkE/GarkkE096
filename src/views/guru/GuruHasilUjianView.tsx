import React, { useState } from 'react';
import {
  Award,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  Users,
  GraduationCap
} from 'lucide-react';
import { StudentExamSession, ExamPackage, User, School, SystemSettings } from '../../types';
import { ExcelService } from '../../services/excelService';
import { Modal } from '../../components/Modal';

interface GuruHasilUjianViewProps {
  currentUser: User;
  sessions: StudentExamSession[];
  packages: ExamPackage[];
  school: School;
  settings: SystemSettings;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const GuruHasilUjianView: React.FC<GuruHasilUjianViewProps> = ({
  currentUser,
  sessions,
  packages,
  school,
  settings,
  showToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pkgFilter, setPkgFilter] = useState('ALL');
  const [selectedSession, setSelectedSession] = useState<StudentExamSession | null>(null);

  // Filter sessions only for this teacher's school and class
  const teacherGrade = currentUser.grade || 6;
  const teacherRombel = (currentUser.rombel || 'A').toUpperCase();

  const mySchoolSessions = sessions.filter(
    s => s.schoolId === school.id &&
         s.grade === teacherGrade &&
         (s.rombel || 'A').toUpperCase() === teacherRombel &&
         (s.status === 'graded' || s.status === 'submitted')
  );

  const filtered = mySchoolSessions.filter(s => {
    const matchSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.participantNumber.includes(searchTerm);
    const matchPkg = pkgFilter === 'ALL' || s.examPackageId === pkgFilter;
    return matchSearch && matchPkg;
  });

  const total = mySchoolSessions.length;
  const avg = total > 0 ? Math.round(mySchoolSessions.reduce((sum, s) => sum + s.score, 0) / total) : 0;
  const passed = mySchoolSessions.filter(s => s.score >= settings.defaultKkm).length;
  const remedial = total - passed;

  const handleExport = () => {
    ExcelService.exportExamResults(
      filtered,
      `Hasil_Ujian_Kelas_${teacherGrade}${teacherRombel}_${school.name.replace(/\s+/g, '_')}`,
      school.name
    );
    showToast('success', 'Ekspor Berhasil', `Hasil nilai siswa Kelas ${teacherGrade}${teacherRombel} berhasil diunduh ke Excel.`);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            Hasil & Capaian Nilai Siswa Kelas {teacherGrade}{teacherRombel} ({school.name})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar perolehan skor CBT siswa kelas binaan Anda, status ketuntasan KKM ({settings.defaultKkm}), dan daftar siswa remedial
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition"
        >
          <Download className="w-4 h-4" />
          Ekspor Excel Nilai Siswa
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Siswa Selesai</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{total}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Telah Dinilai Otomatis</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-blue-600 uppercase">Rata-Rata Kelas</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{avg}</p>
          <p className="text-[10px] text-blue-500 mt-0.5">KKM Satuan: {settings.defaultKkm}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase">Tuntas Belajar</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{passed}</p>
          <p className="text-[10px] text-emerald-500 mt-0.5">Nilai &ge; {settings.defaultKkm}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase">Perlu Remedial</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{remedial}</p>
          <p className="text-[10px] text-rose-500 mt-0.5">Rekomendasi Bimbingan</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari siswa atau no peserta..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 shrink-0">Paket Ujian:</span>
          <select
            value={pkgFilter}
            onChange={e => setPkgFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="ALL">Semua Paket Ujian</option>
            {packages.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">No. Peserta</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4 text-center">Benar</th>
                <th className="py-3 px-4 text-center">Salah</th>
                <th className="py-3 px-4 text-center">Nilai Akhir</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 text-slate-400 font-medium">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">{s.participantNumber}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{s.studentName}</td>
                  <td className="py-3 px-4">Kelas {s.grade}{s.rombel}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-700">{s.totalCorrect}</td>
                  <td className="py-3 px-4 text-center font-bold text-rose-700">{s.totalIncorrect}</td>
                  <td className="py-3 px-4 text-center font-black text-sm text-blue-700">{s.score}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      s.score >= settings.defaultKkm ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {s.score >= settings.defaultKkm ? 'TUNTAS' : 'REMEDIAL'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedSession(s)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Lihat Lembar Jawaban Siswa"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Jawaban Siswa */}
      {selectedSession && (
        <Modal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          title={`Lembar Evaluasi CBT: ${selectedSession.studentName}`}
          subtitle={`Nilai Akhir: ${selectedSession.score} • Status: ${selectedSession.score >= settings.defaultKkm ? 'Tuntas KKM' : 'Perlu Remedial'}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Mulai Pengerjaan:</span>
                <span className="font-mono">{selectedSession.startedAt?.replace('T', ' ').slice(0, 19) || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Selesai Pengerjaan:</span>
                <span className="font-mono">{selectedSession.finishedAt?.replace('T', ' ').slice(0, 19) || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lama Durasi:</span>
                <span className="font-bold">{Math.round(selectedSession.durationSpentSeconds / 60)} Menit</span>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-3">
              <p className="font-bold text-slate-800">Daftar Pemeriksaan Soal:</p>
              {Object.entries(selectedSession.answers || {}).map(([qId, ans], idx) => (
                <div key={qId} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                  <span className="font-medium text-slate-700">Nomor {idx + 1} ({ans.type.toUpperCase()})</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    ans.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {ans.isCorrect ? 'Benar (+Poin Penuh)' : 'Salah'}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
