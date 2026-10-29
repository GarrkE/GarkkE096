import React, { useState } from 'react';
import {
  GraduationCap,
  Printer,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  QrCode,
  Download,
  AlertCircle,
  Eye,
  Filter
} from 'lucide-react';
import { User, School, ClassItem, SystemSettings, StudentReligion } from '../../types';
import { ExcelService } from '../../services/excelService';
import { Modal } from '../../components/Modal';

interface PesertaUjianViewProps {
  users: User[];
  schools: School[];
  classes: ClassItem[];
  settings: SystemSettings;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const PesertaUjianView: React.FC<PesertaUjianViewProps> = ({
  users,
  schools,
  classes,
  settings,
  showToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [religionFilter, setReligionFilter] = useState<'ALL' | StudentReligion>('ALL');
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<User | null>(null);

  const students = users.filter(u => u.role === 'siswa');
  const verifiedParticipants = students.filter(s => s.isActive);

  const filtered = students.filter(st => {
    const matchSearch =
      st.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.participantNumber && st.participantNumber.includes(searchTerm)) ||
      (st.nisn && st.nisn.includes(searchTerm));
    const matchSchool = schoolFilter === 'ALL' || st.schoolId === schoolFilter;
    const matchReligion = religionFilter === 'ALL' || (st.religion || 'Islam') === religionFilter;
    return matchSearch && matchSchool && matchReligion;
  });

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            Daftar Nominasi Peserta Ujian Semester (DNT)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verifikasi resmi kelayakan siswa, pencetakan kartu tanda peserta CBT, dan validasi nomor ujian
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => ExcelService.exportStudents(verifiedParticipants, schools, settings.academicYear, true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition"
          >
            <Download className="w-4 h-4" />
            Ekspor DNT Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Siswa Terdata</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{students.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Siswa Kelas 6 SD</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase">Peserta Terverifikasi</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{verifiedParticipants.length}</p>
          <p className="text-[10px] text-emerald-500 mt-0.5">Memiliki Hak Akses CBT</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-blue-600 uppercase">Sekolah Terlibat</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{schools.length}</p>
          <p className="text-[10px] text-blue-500 mt-0.5">Seluruh SD Kecamatan</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-purple-600 uppercase">Tahun Ajaran</p>
          <p className="text-xl font-black text-purple-700 mt-1">{settings.academicYear}</p>
          <p className="text-[10px] text-purple-500 mt-0.5">Semester {settings.activeSemester}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 no-print">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama peserta, NISN, atau no ujian..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 shrink-0">Sekolah:</span>
          <select
            value={schoolFilter}
            onChange={e => setSchoolFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option value="ALL">Semua Sekolah SD</option>
            {schools.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={religionFilter}
            onChange={e => setReligionFilter(e.target.value as any)}
            className="text-xs border border-indigo-200 rounded-lg px-3 py-2 bg-indigo-50/50 text-indigo-900 font-medium"
          >
            <option value="ALL">Semua Agama</option>
            <option value="Islam">Islam</option>
            <option value="Kristen">Kristen</option>
            <option value="Katolik">Katolik</option>
            <option value="Hindu">Hindu</option>
            <option value="Buddha">Buddha</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nomor Peserta Ujian</th>
                <th className="py-3 px-4">NISN</th>
                <th className="py-3 px-4">Nama Lengkap Peserta</th>
                <th className="py-3 px-4">Agama</th>
                <th className="py-3 px-4">Asal Sekolah</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4 text-center">Status DNT</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((st, idx) => {
                const school = schools.find(s => s.id === st.schoolId);

                const getBadge = (rel?: StudentReligion) => {
                  const r = rel || 'Islam';
                  if (r === 'Islam') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Islam</span>;
                  if (r === 'Kristen') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Kristen</span>;
                  if (r === 'Katolik') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Katolik</span>;
                  if (r === 'Hindu') return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Hindu</span>;
                  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Buddha</span>;
                };

                return (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-black text-blue-700">
                      {st.participantNumber || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{st.nisn || '-'}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{st.fullName}</td>
                    <td className="py-3 px-4">{getBadge(st.religion)}</td>
                    <td className="py-3 px-4 text-slate-700">{school?.name || st.schoolName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                        Kelas {st.grade}{st.rombel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        st.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {st.isActive ? '✓ Terverifikasi DNT' : 'Ditangguhkan'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedStudentForCard(st)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] flex items-center gap-1 mx-auto transition"
                        title="Lihat & Cetak Kartu Peserta Ujian"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Kartu Peserta
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Kartu Peserta Ujian Cetak */}
      {selectedStudentForCard && (
        <Modal
          isOpen={!!selectedStudentForCard}
          onClose={() => setSelectedStudentForCard(null)}
          title="Kartu Tanda Peserta Ujian Semester SD"
          subtitle="Format cetak kartu ujian resmi berstandar Korwil Kecamatan"
          maxWidth="lg"
        >
          <div className="space-y-4">
            {/* Visual Card Document */}
            <div className="bg-white border-2 border-slate-800 rounded-2xl p-5 shadow-sm text-slate-900 font-sans space-y-4">
              
              {/* Header Kop Kartu */}
              <div className="flex items-center gap-3 border-b-2 border-slate-800 pb-3">
                <div className="w-12 h-12 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold text-base shrink-0">
                  <Building2 className="w-7 h-7" />
                </div>
                <div className="text-center flex-1">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    KORWIL BIDANG PENDIDIKAN {settings.districtName.toUpperCase()}
                  </h4>
                  <h3 className="text-xs font-black uppercase text-slate-900">
                    KARTU PESERTA PENILAIAN AKHIR SEMESTER (PAS)
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    TAHUN PELAJARAN {settings.academicYear} • SEMESTER {settings.activeSemester.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="grid grid-cols-3 gap-3 items-center">
                
                {/* Photo box & QR */}
                <div className="text-center space-y-2">
                  <div className="w-24 h-28 bg-slate-100 border border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 mx-auto text-[10px]">
                    <GraduationCap className="w-8 h-8 text-slate-400 mb-1" />
                    <span>Pasfoto 3x4</span>
                  </div>
                  <div className="inline-flex items-center gap-1 font-mono text-[9px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    <QrCode className="w-3 h-3 text-slate-700" /> CBT VERIFIED
                  </div>
                </div>

                {/* Identity Table */}
                <div className="col-span-2 space-y-1.5 text-xs">
                  <div className="flex">
                    <span className="w-28 text-slate-500">Nomor Peserta</span>
                    <span className="font-mono font-black text-blue-900">: {selectedStudentForCard.participantNumber}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">NISN</span>
                    <span className="font-mono font-bold">: {selectedStudentForCard.nisn}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Nama Lengkap</span>
                    <span className="font-bold">: {selectedStudentForCard.fullName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Asal Sekolah</span>
                    <span className="font-semibold">: {selectedStudentForCard.schoolName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Kelas / Rombel</span>
                    <span>: Kelas {selectedStudentForCard.grade}{selectedStudentForCard.rombel}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Agama Siswa</span>
                    <span className="font-semibold text-slate-900">: {selectedStudentForCard.religion || 'Islam'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-28 text-slate-500">Ruang Ujian</span>
                    <span className="font-bold text-emerald-700">: Lab Komputer / CBT</span>
                  </div>
                </div>

              </div>

              {/* Footer Tanda Tangan */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px]">
                <div className="text-slate-500 italic">
                  * Harap dibawa saat pelaksanaan ujian semester berlangsung.
                </div>
                <div className="text-right">
                  <p className="text-slate-600">Ketua Panitia Ujian,</p>
                  <div className="h-7"></div>
                  <p className="font-bold underline text-slate-900">
                    {settings.korwilHeadName}
                  </p>
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 no-print">
              <button
                type="button"
                onClick={() => setSelectedStudentForCard(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-xs font-medium"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handlePrintCard}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Cetak Kartu Peserta
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
