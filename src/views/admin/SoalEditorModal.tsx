import React, { useState } from 'react';
import {
  FileQuestion,
  Image as ImageIcon,
  Trash2,
  Plus,
  Eye,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Upload,
  AlignLeft,
  AlertCircle
} from 'lucide-react';
import { Question, QuestionType, Subject, UserRole, TrueFalseItem } from '../../types';
import { Modal } from '../../components/Modal';
import {
  SVG_FRACTION_CIRCLE,
  SVG_WATER_CYCLE,
  SVG_LEAF_PHOTOSYNTHESIS
} from '../../services/storage';

interface SoalEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionToEdit?: Question | null;
  subjects: Subject[];
  authorName: string;
  authorRole: UserRole;
  schoolId?: string;
  onSave: (question: Question) => void;
}

export const SoalEditorModal: React.FC<SoalEditorModalProps> = ({
  isOpen,
  onClose,
  questionToEdit,
  subjects,
  authorName,
  authorRole,
  schoolId,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Form State
  const [type, setType] = useState<QuestionType>(questionToEdit?.type || 'mcq');
  const [subjectId, setSubjectId] = useState<string>(questionToEdit?.subjectId || subjects[0]?.id || 'sub-mtk');
  const [grade, setGrade] = useState<number>(questionToEdit?.grade || 6);
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(questionToEdit?.semester || 'Ganjil');
  const [academicYear, setAcademicYear] = useState<string>(questionToEdit?.academicYear || '2024/2025');
  const [topic, setTopic] = useState<string>(questionToEdit?.topic || '');
  const [indicator, setIndicator] = useState<string>(questionToEdit?.indicator || '');
  const [difficulty, setDifficulty] = useState<'mudah' | 'sedang' | 'sulit'>(questionToEdit?.difficulty || 'sedang');
  const [questionText, setQuestionText] = useState<string>(questionToEdit?.questionText || '');
  const [points, setPoints] = useState<number>(questionToEdit?.points || 10);
  const [discussion, setDiscussion] = useState<string>(questionToEdit?.discussion || '');
  const [status, setStatus] = useState<'draft' | 'ready' | 'archived'>(questionToEdit?.status || 'ready');

  // Gambar State
  const [imageUrl, setImageUrl] = useState<string>(questionToEdit?.imageUrl || '');
  const [imageCaption, setImageCaption] = useState<string>(questionToEdit?.imageCaption || '');
  const [imagePosition, setImagePosition] = useState<'top' | 'middle' | 'bottom'>(questionToEdit?.imagePosition || 'top');
  const [imageWidth, setImageWidth] = useState<number>(questionToEdit?.imageWidth || 320);

  // MCQ Options
  const [mcqOptions, setMcqOptions] = useState<Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }>>(
    questionToEdit?.options || [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' }
    ]
  );
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>(questionToEdit?.correctAnswer || 'A');

  // Complex MCQ Options (Multi-select)
  const [complexOptions, setComplexOptions] = useState<Array<{ id: string; label: string; isCorrect: boolean }>>(
    questionToEdit?.complexOptions || [
      { id: 'opt-1', label: '', isCorrect: true },
      { id: 'opt-2', label: '', isCorrect: false },
      { id: 'opt-3', label: '', isCorrect: true },
      { id: 'opt-4', label: '', isCorrect: false }
    ]
  );

  // Matching Pairs
  const [matchingPairs, setMatchingPairs] = useState<Array<{ id: string; leftPrompt: string; rightAnswer: string }>>(
    questionToEdit?.matchingPairs || [
      { id: 'mp-1', leftPrompt: '', rightAnswer: '' },
      { id: 'mp-2', leftPrompt: '', rightAnswer: '' },
      { id: 'mp-3', leftPrompt: '', rightAnswer: '' }
    ]
  );

  // True/False Multi-Items (4 sampai 5 soal salah benar per nomor)
  const [trueFalseItems, setTrueFalseItems] = useState<TrueFalseItem[]>(() => {
    if (questionToEdit?.trueFalseItems && questionToEdit.trueFalseItems.length > 0) {
      return questionToEdit.trueFalseItems;
    }
    // Default 4 butir pernyataan terstandar (bisa ditambah hingga 5)
    return [
      { id: 'tf-1', statement: '', isCorrect: true },
      { id: 'tf-2', statement: '', isCorrect: false },
      { id: 'tf-3', statement: '', isCorrect: true },
      { id: 'tf-4', statement: '', isCorrect: false }
    ];
  });
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<boolean>(
    questionToEdit?.trueFalseAnswer !== undefined ? questionToEdit.trueFalseAnswer : true
  );

  // Handle local image upload via FileReader
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran gambar maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionText.trim()) {
      alert('Teks pertanyaan wajib diisi.');
      return;
    }

    const newQuestion: Question = {
      id: questionToEdit ? questionToEdit.id : 'qst-' + Date.now(),
      subjectId,
      grade,
      semester,
      academicYear,
      topic: topic.trim() || 'Umum',
      indicator: indicator.trim(),
      difficulty,
      type,
      questionText: questionText.trim(),
      imageUrl: imageUrl.trim() || undefined,
      imageCaption: imageCaption.trim() || undefined,
      imagePosition,
      imageWidth,
      points: Number(points) || 10,
      orderNumber: questionToEdit?.orderNumber,
      discussion: discussion.trim() || undefined,
      status,
      authorName,
      authorRole,
      schoolId,
      createdAt: questionToEdit?.createdAt || new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    if (type === 'mcq') {
      newQuestion.options = mcqOptions;
      newQuestion.correctAnswer = correctAnswer;
    } else if (type === 'complex_mcq') {
      newQuestion.complexOptions = complexOptions;
    } else if (type === 'matching') {
      newQuestion.matchingPairs = matchingPairs;
    } else if (type === 'true_false') {
      newQuestion.trueFalseItems = trueFalseItems;
      newQuestion.trueFalseAnswer = trueFalseItems[0]?.isCorrect ?? true;
    }

    onSave(newQuestion);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={questionToEdit ? 'Edit Soal Ujian' : 'Tambah Soal Baru'}
      subtitle="Buat soal terstandarisasi dengan 4 pilihan model soal dan gambar ilustrasi"
      maxWidth="4xl"
    >
      {/* Tab Header (Editor vs Live Siswa Preview) */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'editor'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            Editor Soal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Pratinjau Tampilan Siswa
          </button>
        </div>

        <span className="text-[11px] font-semibold text-slate-500">
          Bobot: <strong className="text-blue-600">{points} Poin</strong>
        </span>
      </div>

      {activeTab === 'editor' ? (
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          
          {/* Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran *</label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tingkat Kelas</label>
              <select
                value={grade}
                onChange={e => setGrade(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                {[1, 2, 3, 4, 5, 6].map(g => (
                  <option key={g} value={g}>Kelas {g} SD</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tingkat Kesulitan</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="mudah">Mudah</option>
                <option value="sedang">Sedang</option>
                <option value="sulit">Sulit</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bobot Nilai (Poin)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={points}
                onChange={e => setPoints(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Model Soal Selector */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">Pilih Format / Model Soal *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'mcq', label: '1. Pilihan Ganda (A-D)' },
                { id: 'complex_mcq', label: '2. PG Kompleks (>1 Jawaban)' },
                { id: 'matching', label: '3. Menjodohkan' },
                { id: 'true_false', label: '4. Benar / Salah' }
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(item.id as QuestionType)}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition ${
                    type === item.id
                      ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Teks Pertanyaan */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">Pertanyaan / Narasi Soal *</label>
            <textarea
              rows={4}
              required
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              placeholder="Tuliskan pertanyaan atau bacaan soal di sini secara jelas..."
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-sans"
            />
          </div>

          {/* Section Upload & Pengaturan Gambar Soal */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Gambar Pendukung Soal (Opsional)
              </span>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('');
                    setImageCaption('');
                  }}
                  className="text-[11px] text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Hapus Gambar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Unggah Gambar (JPG/PNG/WebP, Maks 2MB)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">Atau masukkan URL gambar langsung di bawah:</p>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://... atau data:image/..."
                  className="w-full px-2.5 py-1.5 mt-1 border border-slate-200 rounded-lg text-xs"
                />

                {/* Preset educational diagrams */}
                <div className="mt-2 pt-2 border-t border-slate-200/70">
                  <p className="text-[10px] font-semibold text-slate-500 mb-1">Gunakan Diagram Edukasi Siap Pakai:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl(SVG_FRACTION_CIRCLE);
                        setImageCaption('Gambar: Juring pecahan lingkaran');
                      }}
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md transition"
                    >
                      + Pecahan Lingkaran
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl(SVG_WATER_CYCLE);
                        setImageCaption('Bagan: Tahapan siklus air');
                      }}
                      className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-bold rounded-md transition"
                    >
                      + Siklus Air
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl(SVG_LEAF_PHOTOSYNTHESIS);
                        setImageCaption('Bagan: Proses fotosintesis tumbuhan');
                      }}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md transition"
                    >
                      + Fotosintesis
                    </button>
                  </div>
                </div>
              </div>

              {imageUrl && (
                <div className="space-y-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-semibold text-slate-600">Posisi Gambar</label>
                      <select
                        value={imagePosition}
                        onChange={e => setImagePosition(e.target.value as any)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md bg-white mt-0.5"
                      >
                        <option value="top">Di Atas Pertanyaan</option>
                        <option value="middle">Di Bawah / Tengah Pertanyaan</option>
                        <option value="bottom">Di Bawah Pilihan</option>
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] font-semibold text-slate-600">Lebar (px)</label>
                      <input
                        type="number"
                        min={100}
                        max={600}
                        step={20}
                        value={imageWidth}
                        onChange={e => setImageWidth(Number(e.target.value))}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md mt-0.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600">Keterangan / Caption Gambar</label>
                    <input
                      type="text"
                      value={imageCaption}
                      onChange={e => setImageCaption(e.target.value)}
                      placeholder="Contoh: Gambar 1: Organ pernapasan manusia"
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md mt-0.5"
                    />
                  </div>

                  <div className="text-center p-1 bg-slate-50 rounded-md">
                    <img
                      src={imageUrl}
                      alt={imageCaption || 'Ilustrasi Soal'}
                      className="max-h-28 mx-auto object-contain rounded-md border border-slate-200"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DYNAMIC FORM PER QUESTION TYPE */}

          {/* 1. MCQ Form */}
          {type === 'mcq' && (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <label className="block font-bold text-slate-800">
                Pilihan Jawaban A, B, C, D dan Kunci Jawaban
              </label>
              <div className="space-y-2">
                {mcqOptions.map((opt, idx) => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={correctAnswer === opt.key}
                      onChange={() => setCorrectAnswer(opt.key)}
                      className="w-4 h-4 text-blue-600 cursor-pointer"
                      title={`Tandai ${opt.key} sebagai kunci`}
                    />
                    <span className="w-6 font-bold text-slate-700">{opt.key}.</span>
                    <input
                      type="text"
                      required
                      value={opt.text}
                      onChange={e => {
                        const copy = [...mcqOptions];
                        copy[idx].text = e.target.value;
                        setMcqOptions(copy);
                      }}
                      placeholder={`Pilihan jawaban ${opt.key}...`}
                      className={`flex-1 px-3 py-1.5 border rounded-lg ${
                        correctAnswer === opt.key ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200'
                      }`}
                    />
                    {correctAnswer === opt.key && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-md shrink-0">
                        Kunci Jawaban
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Complex MCQ Form */}
          {type === 'complex_mcq' && (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block font-bold text-slate-800">
                    Daftar Pernyataan Pilihan Ganda Kompleks
                  </label>
                  <p className="text-[11px] text-slate-500">Centang kotak untuk opsi yang merupakan jawaban benar</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newId = 'opt-' + (complexOptions.length + 1);
                    setComplexOptions([...complexOptions, { id: newId, label: '', isCorrect: false }]);
                  }}
                  className="px-2.5 py-1 text-[11px] bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Tambah Opsi
                </button>
              </div>

              <div className="space-y-2">
                {complexOptions.map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={opt.isCorrect}
                      onChange={e => {
                        const copy = [...complexOptions];
                        copy[idx].isCorrect = e.target.checked;
                        setComplexOptions(copy);
                      }}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      title="Tandai benar"
                    />
                    <input
                      type="text"
                      required
                      value={opt.label}
                      onChange={e => {
                        const copy = [...complexOptions];
                        copy[idx].label = e.target.value;
                        setComplexOptions(copy);
                      }}
                      placeholder={`Pernyataan / Opsi ${idx + 1}...`}
                      className={`flex-1 px-3 py-1.5 border rounded-lg ${
                        opt.isCorrect ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200'
                      }`}
                    />
                    {opt.isCorrect && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-md shrink-0">
                        Benar
                      </span>
                    )}
                    {complexOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          setComplexOptions(complexOptions.filter((_, i) => i !== idx));
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Matching Form */}
          {type === 'matching' && (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block font-bold text-slate-800">
                    Pasangan Menjodohkan (Kiri & Kanan)
                  </label>
                  <p className="text-[11px] text-slate-500">Tentukan pernyataan di sebelah kiri dan pasangan jawaban yang benar di kanan</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newId = 'mp-' + (matchingPairs.length + 1);
                    setMatchingPairs([...matchingPairs, { id: newId, leftPrompt: '', rightAnswer: '' }]);
                  }}
                  className="px-2.5 py-1 text-[11px] bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Tambah Pasangan
                </button>
              </div>

              <div className="space-y-2">
                {matchingPairs.map((pair, idx) => (
                  <div key={pair.id} className="flex items-center gap-2">
                    <span className="w-5 font-bold text-slate-500 text-center">{idx + 1}.</span>
                    <input
                      type="text"
                      required
                      value={pair.leftPrompt}
                      onChange={e => {
                        const copy = [...matchingPairs];
                        copy[idx].leftPrompt = e.target.value;
                        setMatchingPairs(copy);
                      }}
                      placeholder="Pernyataan sebelah kiri..."
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg"
                    />
                    <span className="text-slate-400 font-bold">&rarr;</span>
                    <input
                      type="text"
                      required
                      value={pair.rightAnswer}
                      onChange={e => {
                        const copy = [...matchingPairs];
                        copy[idx].rightAnswer = e.target.value;
                        setMatchingPairs(copy);
                      }}
                      placeholder="Pasangan jawaban kanan..."
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-blue-50/20"
                    />
                    {matchingPairs.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          setMatchingPairs(matchingPairs.filter((_, i) => i !== idx));
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. True/False Form (Multi 4 sampai 5 Pernyataan per nomor) */}
          {type === 'true_false' && (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <label className="block font-bold text-slate-800 text-xs sm:text-sm">
                    Daftar Butir Pernyataan Benar / Salah (4 sampai 5 Pernyataan)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Satu nomor soal ini memuat 4 hingga 5 butir pernyataan. Tentukan kunci BENAR atau SALAH pada setiap pernyataan.
                  </p>
                </div>
                {trueFalseItems.length < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextNum = trueFalseItems.length + 1;
                      setTrueFalseItems([
                        ...trueFalseItems,
                        { id: `tf-${nextNum}-${Date.now().toString(36)}`, statement: '', isCorrect: true }
                      ]);
                    }}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg flex items-center gap-1 transition self-start sm:self-auto cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Pernyataan ({trueFalseItems.length}/5)
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {trueFalseItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black">
                          {idx + 1}
                        </span>
                        Pernyataan ke-{idx + 1}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Radio options: Benar / Salah */}
                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...trueFalseItems];
                              copy[idx].isCorrect = true;
                              setTrueFalseItems(copy);
                            }}
                            className={`px-3 py-1 rounded-md font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                              item.isCorrect === true
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            BENAR
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...trueFalseItems];
                              copy[idx].isCorrect = false;
                              setTrueFalseItems(copy);
                            }}
                            className={`px-3 py-1 rounded-md font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                              item.isCorrect === false
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <AlertCircle className="w-3 h-3" />
                            SALAH
                          </button>
                        </div>

                        {trueFalseItems.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              setTrueFalseItems(trueFalseItems.filter((_, i) => i !== idx));
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus butir pernyataan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      required
                      value={item.statement}
                      onChange={e => {
                        const copy = [...trueFalseItems];
                        copy[idx].statement = e.target.value;
                        setTrueFalseItems(copy);
                      }}
                      placeholder={`Tuliskan teks butir pernyataan ${idx + 1}...`}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pembahasan & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pembahasan / Penjelasan Jawaban</label>
              <textarea
                rows={2}
                value={discussion}
                onChange={e => setDiscussion(e.target.value)}
                placeholder="Penjelasan langkah penyelesaian untuk bahan evaluasi..."
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Publikasi Soal</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
              >
                <option value="ready">Siap Digunakan untuk Ujian</option>
                <option value="draft">Draf (Masih Diedit)</option>
                <option value="archived">Arsip</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
            >
              Simpan Soal ke Bank Soal
            </button>
          </div>
        </form>
      ) : (
        /* LIVE SISWA PREVIEW TAB */
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
            <span className="font-bold text-slate-700">Simulasi Tampilan Soal di Layar Siswa CBT</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
              Soal No. 1 • Bobot {points} Poin
            </span>
          </div>

          {/* Image on top */}
          {imageUrl && imagePosition === 'top' && (
            <div className="text-center my-3">
              <img
                src={imageUrl}
                alt={imageCaption}
                style={{ maxWidth: `${imageWidth}px` }}
                className="mx-auto rounded-xl shadow-xs border border-slate-200"
              />
              {imageCaption && (
                <p className="text-[11px] text-slate-500 italic mt-1">{imageCaption}</p>
              )}
            </div>
          )}

          {/* Question Text */}
          <div className="text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-line">
            {questionText || 'Pertanyaan belum ditulis...'}
          </div>

          {/* Image in middle */}
          {imageUrl && imagePosition === 'middle' && (
            <div className="text-center my-3">
              <img
                src={imageUrl}
                alt={imageCaption}
                style={{ maxWidth: `${imageWidth}px` }}
                className="mx-auto rounded-xl shadow-xs border border-slate-200"
              />
              {imageCaption && (
                <p className="text-[11px] text-slate-500 italic mt-1">{imageCaption}</p>
              )}
            </div>
          )}

          {/* Options Preview */}
          {type === 'mcq' && (
            <div className="space-y-2 pt-2">
              {mcqOptions.map(opt => (
                <div
                  key={opt.key}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-300 flex items-center gap-3 text-xs"
                >
                  <span className="w-7 h-7 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center">
                    {opt.key}
                  </span>
                  <span className="font-medium text-slate-800">{opt.text || `(Pilihan ${opt.key})`}</span>
                </div>
              ))}
            </div>
          )}

          {type === 'complex_mcq' && (
            <div className="space-y-2 pt-2">
              <p className="text-xs text-blue-700 font-semibold italic">
                * Pilihlah semua jawaban yang kamu anggap benar!
              </p>
              {complexOptions.map((opt, i) => (
                <div
                  key={opt.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-center gap-3 text-xs"
                >
                  <input type="checkbox" readOnly className="w-4 h-4 rounded text-blue-600" />
                  <span className="font-medium text-slate-800">{opt.label || `(Pernyataan ${i + 1})`}</span>
                </div>
              ))}
            </div>
          )}

          {type === 'matching' && (
            <div className="space-y-2 pt-2">
              <p className="text-xs text-blue-700 font-semibold italic">
                * Pasangkan setiap pernyataan di kiri dengan jawaban yang sesuai di kanan:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  {matchingPairs.map((p, i) => (
                    <div key={p.id} className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold">
                      {i + 1}. {p.leftPrompt || '(Pernyataan)'}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {matchingPairs.map(p => (
                    <div key={p.id} className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/50 text-xs font-semibold text-blue-900">
                      &rarr; {p.rightAnswer || '(Jawaban)'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {type === 'true_false' && (
            <div className="space-y-2 pt-2">
              <p className="text-xs text-blue-700 font-semibold italic">
                * Tentukan apakah setiap butir pernyataan di bawah ini BENAR atau SALAH:
              </p>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3">Butir Pernyataan</th>
                      <th className="py-2.5 px-3 w-40 text-center">Pilihan Jawaban</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trueFalseItems.map((item, i) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400">{i + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {item.statement || `(Teks butir pernyataan ke-${i + 1})`}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.isCorrect ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500'
                            }`}>
                              BENAR
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              !item.isCorrect ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-500'
                            }`}>
                              SALAH
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Image on bottom */}
          {imageUrl && imagePosition === 'bottom' && (
            <div className="text-center my-3">
              <img
                src={imageUrl}
                alt={imageCaption}
                style={{ maxWidth: `${imageWidth}px` }}
                className="mx-auto rounded-xl shadow-xs border border-slate-200"
              />
              {imageCaption && (
                <p className="text-[11px] text-slate-500 italic mt-1">{imageCaption}</p>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 text-right">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
            >
              Kembali ke Editor
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
