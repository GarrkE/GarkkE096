import React, { useState } from 'react';
import {
  Server,
  Database,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  HardDrive,
  Lock,
  Cloud,
  ChevronRight,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { Modal } from './Modal';

export const BackendIntegrationNotice: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Notice Banner */}
      <div className="bg-[#161619] border border-amber-500/30 border-l-4 border-l-amber-500 p-3.5 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 no-print shadow-lg">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300">Status Penyimpanan & Kebutuhan Integrasi Server Produksi:</span>
            <p className="text-white/60 text-[11px] mt-0.5">
              Aplikasi ini beroperasi menggunakan <strong>Web Storage Peramban (Client-Side)</strong> untuk evaluasi antarmuka CBT & bank soal. Untuk sinkronisasi live multi-sekolah, backend terpusat (API/Database) diperlukan.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg font-mono font-semibold text-[11px] shrink-0 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Server className="w-3.5 h-3.5" />
          Rincian Arsitektur
        </button>
      </div>

      {/* Modal Detail Kebutuhan Integrasi Backend */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Spesifikasi Arsitektur & Kebutuhan Integrasi Backend Produksi"
        subtitle="Analisis teknis transparansi sistem dari prototype antarmuka menuju tahap produksi multi-sekolah"
        maxWidth="4xl"
      >
        <div className="space-y-5 text-xs text-slate-700">
          
          {/* Comparison Status Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Status Sekarang */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <HardDrive className="w-4 h-4 text-amber-600" />
                Status Saat Ini (Client-Side State)
              </div>
              <ul className="space-y-1.5 text-[11px] text-amber-950">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Data disimpan di <strong>localStorage peramban</strong> lokal klien.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Pemrosesan Excel menggunakan engine SheetJS di browser klien.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>Penilaian CBT dan timer dihitung secara lokal di perangkat siswa.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span><strong>Keterbatasan:</strong> Data tidak tersinkronisasi antar perangkat berbeda jika berpindah gawai atau menghapus cache peramban.</span>
                </li>
              </ul>
            </div>

            {/* Target Produksi */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
                <Server className="w-4 h-4 text-blue-600" />
                Kebutuhan Menuju Produksi (Multi-Sekolah)
              </div>
              <ul className="space-y-1.5 text-[11px] text-blue-950">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Database Relasional Sentral (PostgreSQL / Cloud SQL / MySQL).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Server REST API / GraphQL (Node.js Express / NestJS / Go).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Autentikasi Server-Authoritative (JWT / HttpOnly Cookie & bcrypt).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>Penyimpanan Aset Gambar Soal (Google Cloud Storage / AWS S3).</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Rincian Skema Database Relasional */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              Rancangan Skema Entitas Relasional Server:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <p className="font-bold text-slate-800">1. Master Sekolah & User</p>
                <p className="text-slate-500 font-mono text-[10px] mt-1">
                  schools (id, npsn, name, status)<br />
                  users (id, username, password_hash, role, school_id)
                </p>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <p className="font-bold text-slate-800">2. Bank Soal & Kurikulum</p>
                <p className="text-slate-500 font-mono text-[10px] mt-1">
                  subjects (id, code, name)<br />
                  questions (id, type, text, options_json, key, image_url)
                </p>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <p className="font-bold text-slate-800">3. Jadwal CBT & Nilai</p>
                <p className="text-slate-500 font-mono text-[10px] mt-1">
                  exam_packages (id, duration, schedule)<br />
                  exam_sessions (id, student_id, answers, score)
                </p>
              </div>
            </div>
          </div>

          {/* Protokol Keamanan CBT */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-1">
            <h5 className="font-bold flex items-center gap-1.5 text-xs text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Keamanan Hak Akses (Role-Based Access Control):
            </h5>
            <p className="text-[11px] leading-relaxed">
              Pada arsitektur server produksi, seluruh permintaan API diverifikasi menggunakan middleware otorisasi: Guru dibatasi hanya dapat mengakses siswa dan laporan pada `school_id` masing-masing, sedangkan siswa tidak memiliki akses ke kunci jawaban maupun API pengelolaan soal.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs"
            >
              Saya Mengerti
            </button>
          </div>

        </div>
      </Modal>
    </>
  );
};
