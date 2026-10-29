import React, { useState } from 'react';
import {
  Award,
  Search,
  Filter,
  Download,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  BarChart3,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { StudentExamSession, ExamPackage, School, SystemSettings } from '../../types';
import { ExcelService } from '../../services/excelService';
import { Modal } from '../../components/Modal';

interface HasilUjianViewProps {
  sessions: StudentExamSession[];
  packages: ExamPackage[];
  schools: School[];
  settings: SystemSettings;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const HasilUjianView: React.FC<HasilUjianViewProps> = ({
  sessions,
  packages,
  schools,
  settings,
  showToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [packageFilter, setPackageFilter] = useState('ALL');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedSessionDetail, setSelectedSessionDetail] = useState<StudentExamSession | null>(null);

  const completedSessions = sessions.filter(
    s => s.status === 'graded' || s.status === 'submitted'
  );

  const filteredSessions = completedSessions.filter(s => {
    const matchSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.participantNumber.includes(searchTerm) ||
      s.nisn.includes(searchTerm);
    const matchPkg = packageFilter === 'ALL' || s.examPackageId === packageFilter;
    const matchSchool = schoolFilter === 'ALL' || s.schoolId === schoolFilter;
    const matchStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'PASS'
        ? s.score >= settings.defaultKkm
        : s.score < settings.defaultKkm;

    return matchSearch && matchPkg && matchSchool && matchStatus;
  });

  // Analytics Metrics
  const totalSubmissions = completedSessions.length;
  const avgScore = totalSubmissions > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + s.score, 0) / totalSubmissions)
    : 0;
  const passedCount = completedSessions.filter(s => s.score >= settings.defaultKkm).length;
  const passRate = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;
  const remedialCount = totalSubmissions - passedCount;

  // Score distribution breakdown
  const range90_100 = completedSessions.filter(s => s.score >= 90).length;
  const range75_89 = completedSessions.filter(s => s.score >= 75 && s.score < 90).length;
  const range50_74 = completedSessions.filter(s => s.score >= 50 && s.score < 75).length;
  const range0_49 = completedSessions.filter(s => s.score < 50).length;

  const handleExport = () => {
    ExcelService.exportExamResults(filteredSessions, 'Hasil_Ujian_Kecamatan');
    showToast('success', 'Ekspor Berhasil', 'Hasil ujian berhasil diunduh ke Excel.');
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-rose-600" />
            Analisis & Hasil Ujian Semester SD se-Kecamatan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar perolehan nilai, ketuntasan belajar siswa (KKM {settings.defaultKkm}), dan rekomendasi remedial
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Ekspor Hasil Ujian (.xlsx)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Total Selesai Dinilai</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalSubmissions}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Lembar Jawaban Masuk</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-blue-600 uppercase">Rata-Rata Nilai</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{avgScore}</p>
          <p className="text-[10px] text-blue-500 mt-0.5">Standar KKM: {settings.defaultKkm}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase">Tuntas KKM</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{passedCount}</p>
          <p className="text-[10px] text-emerald-500 mt-0.5">{passRate}% Siswa Lulus</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase">Perlu Remedial</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{remedialCount}</p>
          <p className="text-[10px] text-rose-500 mt-0.5">Nilai di bawah {settings.defaultKkm}</p>
        </div>
      </div>

      {/* Distribution Chart Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          Distribusi Rentang Nilai CBT Siswa
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-800">Sangat Baik (90 - 100)</span>
            <p className="text-xl font-extrabold text-emerald-950 mt-1">{range90_100} Siswa</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <span className="text-[11px] font-bold text-blue-800">Baik (75 - 89)</span>
            <p className="text-xl font-extrabold text-blue-950 mt-1">{range75_89} Siswa</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <span className="text-[11px] font-bold text-amber-800">Cukup (50 - 74)</span>
            <p className="text-xl font-extrabold text-amber-950 mt-1">{range50_74} Siswa</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
            <span className="text-[11px] font-bold text-rose-800">Perlu Bimbingan (&lt; 50)</span>
            <p className="text-xl font-extrabold text-rose-950 mt-1">{range0_49} Siswa</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari siswa, no peserta, NISN..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={packageFilter}
            onChange={e => setPackageFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700"
          >
            <option value="ALL">Semua Paket Ujian</option>
            {packages.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>

          <select
            value={schoolFilter}
            onChange={e => setSchoolFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700"
          >
            <option value="ALL">Semua Sekolah SD</option>
            {schools.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 font-medium"
          >
            <option value="ALL">Semua Status</option>
            <option value="PASS">Tuntas KKM (&ge; {settings.defaultKkm})</option>
            <option value="FAIL">Remedial (&lt; {settings.defaultKkm})</option>
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
                <th className="py-3 px-4">Sekolah</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4 text-center">Benar</th>
                <th className="py-3 px-4 text-center">Salah</th>
                <th className="py-3 px-4 text-center">Nilai Akhir</th>
                <th className="py-3 px-4 text-center">Keterangan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada hasil ujian yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{s.participantNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{s.studentName}</td>
                    <td className="py-3 px-4 text-slate-700">{s.schoolName}</td>
                    <td className="py-3 px-4">Kelas {s.grade}{s.rombel}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">{s.totalCorrect}</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-700">{s.totalIncorrect}</td>
                    <td className="py-3 px-4 text-center font-black text-sm text-blue-700">{s.score}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.score >= settings.defaultKkm
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {s.score >= settings.defaultKkm ? 'Tuntas' : 'Remedial'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedSessionDetail(s)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Lihat Rincian Jawaban Siswa"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Lembar Jawaban Siswa */}
      {selectedSessionDetail && (
        <Modal
          isOpen={!!selectedSessionDetail}
          onClose={() => setSelectedSessionDetail(null)}
          title={`Rincian Hasil CBT: ${selectedSessionDetail.studentName}`}
          subtitle={`No. Peserta: ${selectedSessionDetail.participantNumber} • Nilai Akhir: ${selectedSessionDetail.score}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <div>
                <p className="text-slate-400">Skor Total</p>
                <p className="text-2xl font-black text-blue-700">{selectedSessionDetail.score}</p>
              </div>
              <div>
                <p className="text-slate-400">Jawaban Benar</p>
                <p className="text-xl font-bold text-emerald-700">{selectedSessionDetail.totalCorrect}</p>
              </div>
              <div>
                <p className="text-slate-400">Jawaban Salah</p>
                <p className="text-xl font-bold text-rose-700">{selectedSessionDetail.totalIncorrect}</p>
              </div>
              <div>
                <p className="text-slate-400">Durasi</p>
                <p className="text-xl font-bold text-slate-800">
                  {Math.round(selectedSessionDetail.durationSpentSeconds / 60)} Mnt
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 rounded-xl p-3">
              <p className="font-bold text-slate-800 mb-2">Pemeriksaan Soal Per Butir:</p>
              {Object.entries(selectedSessionDetail.answers || {}).map(([qId, ans], idx) => (
                <div key={qId} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                  <span className="font-semibold text-slate-700">Soal #{idx + 1} ({ans.type.toUpperCase()})</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono">Poin: {ans.earnedPoints}/{ans.maxPoints}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ans.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {ans.isCorrect ? 'Benar' : 'Salah / Kurang Tepat'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSessionDetail(null)}
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
