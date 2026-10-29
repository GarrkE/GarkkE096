import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Flag,
  Check,
  Award,
  Sparkles,
  Wifi,
  ShieldAlert,
  ZoomIn
} from 'lucide-react';
import {
  ExamPackage,
  Question,
  User,
  School,
  StudentExamSession,
  StudentAnswer,
  Subject
} from '../../types';
import { AppStorage } from '../../services/storage';
import { Modal } from '../../components/Modal';

interface UjianCBTProps {
  examPackage: ExamPackage;
  currentUser: User;
  school: School;
  questions: Question[];
  subject?: Subject;
  onFinishExam: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, desc?: string) => void;
}

export const UjianCBT: React.FC<UjianCBTProps> = ({
  examPackage,
  currentUser,
  school,
  questions,
  subject,
  onFinishExam,
  showToast
}) => {
  // Ordered questions in this exam package
  const examQuestions = examPackage.questionIds
    .map(id => questions.find(q => q.id === id))
    .filter(Boolean) as Question[];

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentQ = examQuestions[currentIndex];

  // Answers State: questionId -> StudentAnswer
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({});
  const [reviewedQuestionIds, setReviewedQuestionIds] = useState<string[]>([]);

  // Timer State (in seconds)
  const initialSeconds = examPackage.durationMinutes * 60;
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds);
  const [autosaveStatus, setAutosaveStatus] = useState<string>('Jawaban tersimpan otomatis');

  // Finish confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);

  // Countdown timer effect
  useEffect(() => {
    if (isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam(true); // Auto-submit when time is up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Helper to update current question's answer and show autosave indicator
  const updateAnswer = (newAnswer: Partial<StudentAnswer>) => {
    if (!currentQ) return;

    setAnswers(prev => {
      const existing = prev[currentQ.id] || {
        questionId: currentQ.id,
        type: currentQ.type,
        maxPoints: currentQ.points || 10
      };

      return {
        ...prev,
        [currentQ.id]: {
          ...existing,
          ...newAnswer,
          answeredAt: new Date().toISOString()
        }
      };
    });

    setAutosaveStatus('Menyimpan...');
    setTimeout(() => {
      const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setAutosaveStatus(`Jawaban tersimpan otomatis (${nowStr})`);
    }, 300);
  };

  // Toggle Review / Ragu-ragu
  const toggleReview = () => {
    if (!currentQ) return;
    setReviewedQuestionIds(prev =>
      prev.includes(currentQ.id)
        ? prev.filter(id => id !== currentQ.id)
        : [...prev, currentQ.id]
    );
  };

  // Automated Scoring Engine
  const calculateResults = () => {
    let earnedTotal = 0;
    let maxTotal = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const gradedAnswers: Record<string, StudentAnswer> = {};

    examQuestions.forEach(q => {
      const qPoints = q.points || 10;
      maxTotal += qPoints;

      const userAns = answers[q.id];
      if (!userAns) {
        unansweredCount++;
        gradedAnswers[q.id] = {
          questionId: q.id,
          type: q.type,
          isCorrect: false,
          earnedPoints: 0,
          maxPoints: qPoints
        };
        return;
      }

      let isCorrect = false;
      let pointsAwarded = 0;

      // 1. MCQ
      if (q.type === 'mcq') {
        if (userAns.answerMcq === q.correctAnswer) {
          isCorrect = true;
          pointsAwarded = qPoints;
        }
      }
      // 2. Complex MCQ
      else if (q.type === 'complex_mcq') {
        const correctIds = (q.complexOptions || []).filter(o => o.isCorrect).map(o => o.id);
        const selectedIds = userAns.answerComplexMcq || [];
        
        // Exact match of all correct and none incorrect
        const allCorrectSelected = correctIds.every(id => selectedIds.includes(id));
        const noIncorrectSelected = selectedIds.every(id => correctIds.includes(id));

        if (allCorrectSelected && noIncorrectSelected) {
          isCorrect = true;
          pointsAwarded = qPoints;
        } else {
          // Partial points
          const matchCount = selectedIds.filter(id => correctIds.includes(id)).length;
          pointsAwarded = Math.round((matchCount / Math.max(correctIds.length, 1)) * qPoints * 0.7);
        }
      }
      // 3. Matching
      else if (q.type === 'matching') {
        const pairs = q.matchingPairs || [];
        const userPairs = userAns.answerMatching || {};
        let correctPairs = 0;

        pairs.forEach(p => {
          if (userPairs[p.leftPrompt] === p.rightAnswer) {
            correctPairs++;
          }
        });

        pointsAwarded = Math.round((correctPairs / Math.max(pairs.length, 1)) * qPoints);
        if (correctPairs === pairs.length) isCorrect = true;
      }
      // 4. True/False (Multi 4-5 pernyataan per nomor)
      else if (q.type === 'true_false') {
        if (q.trueFalseItems && q.trueFalseItems.length > 0) {
          const userMulti = userAns.answerTrueFalseMulti || {};
          let correctItems = 0;
          q.trueFalseItems.forEach(item => {
            if (userMulti[item.id] === item.isCorrect) {
              correctItems++;
            }
          });
          pointsAwarded = Math.round((correctItems / q.trueFalseItems.length) * qPoints);
          if (correctItems === q.trueFalseItems.length) {
            isCorrect = true;
          }
        } else {
          // Fallback single boolean
          if (userAns.answerTrueFalse === q.trueFalseAnswer) {
            isCorrect = true;
            pointsAwarded = qPoints;
          }
        }
      }

      if (isCorrect) correctCount++;
      else incorrectCount++;

      earnedTotal += pointsAwarded;
      gradedAnswers[q.id] = {
        ...userAns,
        isCorrect,
        earnedPoints: pointsAwarded,
        maxPoints: qPoints
      };
    });

    const scaledScore = maxTotal > 0 ? Math.round((earnedTotal / maxTotal) * 100) : 0;

    return {
      scaledScore,
      correctCount,
      incorrectCount,
      unansweredCount,
      gradedAnswers
    };
  };

  const handleSubmitExam = (isAuto = false) => {
    setIsConfirmModalOpen(false);

    const {
      scaledScore,
      correctCount,
      incorrectCount,
      unansweredCount,
      gradedAnswers
    } = calculateResults();

    const spentSeconds = initialSeconds - timeLeft;

    const session: StudentExamSession = {
      id: 'sess-' + Date.now(),
      examPackageId: examPackage.id,
      studentId: currentUser.id,
      studentName: currentUser.fullName,
      participantNumber: currentUser.participantNumber || '01-054-001-8',
      nisn: currentUser.nisn || '-',
      schoolId: school.id,
      schoolName: school.name,
      grade: currentUser.grade || 6,
      rombel: currentUser.rombel || 'A',
      startedAt: new Date(Date.now() - spentSeconds * 1000).toISOString(),
      finishedAt: new Date().toISOString(),
      durationSpentSeconds: spentSeconds,
      status: 'graded',
      answers: gradedAnswers,
      reviewedQuestionIds,
      score: scaledScore,
      totalCorrect: correctCount,
      totalIncorrect: incorrectCount,
      totalUnanswered: unansweredCount,
      isPassed: scaledScore >= (AppStorage.getSettings().defaultKkm || 75),
      gradedAt: new Date().toISOString(),
      gradedBy: 'Sistem CBT Otomatis'
    };

    AppStorage.saveExamSession(session);
    AppStorage.logActivity(
      currentUser.fullName,
      'siswa',
      'Menyelesaikan Ujian CBT',
      `Menyelesaikan "${examPackage.title}" dengan skor ${scaledScore}. (${correctCount} Benar, ${incorrectCount} Salah)`
    );

    setFinalScore(scaledScore);
    setIsFinished(true);

    // Fire celebratory confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    showToast('success', 'Ujian Selesai!', 'Seluruh jawaban telah berhasil disimpan dan dinilai secara otomatis.');
  };

  // Status counts for confirmation
  const totalQuestions = examQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const reviewedCount = reviewedQuestionIds.length;

  if (isFinished) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6 animate-in zoom-in-95">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <Award className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Alhamdulillah, Ujian Telah Selesai!</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Terima kasih {currentUser.fullName}. Seluruh jawaban ujian kamu telah tersimpan aman di server kecamatan.
          </p>
        </div>

        {examPackage.showScoreImmediately ? (
          <div className="p-6 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 text-center">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Nilai Capaian CBT Kamu</span>
            <div className="text-5xl font-black text-blue-700 my-2">{finalScore}</div>
            <p className="text-xs font-semibold text-slate-700">
              {finalScore >= (AppStorage.getSettings().defaultKkm || 75)
                ? `Selamat! Kamu dinyatakan TUNTAS KKM (≥ ${AppStorage.getSettings().defaultKkm || 75}).`
                : `Nilai kamu belum mencapai KKM (${AppStorage.getSettings().defaultKkm || 75}). Hubungi guru untuk jadwal remedial.`}
            </p>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            Nilai ujian semester akan diumumkan oleh guru dan kepala sekolah setelah rekapitulasi nilai kecamatan selesai.
          </div>
        )}

        <button
          onClick={onFinishExam}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
        >
          Kembali ke Dashboard Siswa
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      
      {/* CBT Top Bar: Student info, title, live countdown timer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 sticky top-16 z-20">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
              {subject ? subject.name : 'Ujian Semester'}
            </span>
            <h3 className="text-sm font-bold text-slate-900">{examPackage.title}</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Peserta: <strong className="text-slate-800">{currentUser.fullName}</strong> ({currentUser.participantNumber}) • {school.name} • <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Agama: {currentUser.religion || 'Islam'}</span>
          </p>
        </div>

        {/* Timer & Autosave Status */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
              <Check className="w-3 h-3" /> {autosaveStatus}
            </div>
            <span className="text-[10px] text-slate-400">Sisa Waktu Pengerjaan</span>
          </div>

          <div className={`px-4 py-2 rounded-xl border font-mono font-black text-lg flex items-center gap-2 shadow-2xs ${
            timeLeft <= 300
              ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            <Clock className="w-5 h-5 shrink-0" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Question Area, Right Palette */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        
        {/* Left: Active Question Area */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-2xs space-y-5">
          
          {/* Question Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                {currentIndex + 1}
              </span>
              <span className="font-bold text-slate-700">
                Soal Nomor {currentIndex + 1} dari {totalQuestions}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                Bobot: {currentQ?.points || 10} Poin
              </span>
              <button
                type="button"
                onClick={toggleReview}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  reviewedQuestionIds.includes(currentQ?.id || '')
                    ? 'bg-amber-400 text-amber-950 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                {reviewedQuestionIds.includes(currentQ?.id || '') ? 'Ragu-ragu (Ditandai)' : 'Ragu-ragu'}
              </button>
            </div>
          </div>

          {/* Question Image (Top position) */}
          {currentQ?.imageUrl && currentQ.imagePosition === 'top' && (
            <div className="text-center my-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <img
                src={currentQ.imageUrl}
                alt={currentQ.imageCaption || 'Gambar Soal'}
                style={{ maxWidth: `${currentQ.imageWidth || 320}px` }}
                className="mx-auto rounded-lg shadow-2xs"
              />
              {currentQ.imageCaption && (
                <p className="text-[11px] text-slate-500 italic mt-1.5 font-medium">{currentQ.imageCaption}</p>
              )}
            </div>
          )}

          {/* Question Text */}
          <div className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed whitespace-pre-line">
            {currentQ?.questionText}
          </div>

          {/* Question Image (Middle position) */}
          {currentQ?.imageUrl && currentQ.imagePosition === 'middle' && (
            <div className="text-center my-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
              <img
                src={currentQ.imageUrl}
                alt={currentQ.imageCaption || 'Gambar Soal'}
                style={{ maxWidth: `${currentQ.imageWidth || 320}px` }}
                className="mx-auto rounded-lg shadow-2xs"
              />
              {currentQ.imageCaption && (
                <p className="text-[11px] text-slate-500 italic mt-1.5 font-medium">{currentQ.imageCaption}</p>
              )}
            </div>
          )}

          {/* INTERACTIVE ANSWER CONTROLS PER QUESTION TYPE */}
          <div className="pt-2">
            
            {/* 1. MCQ */}
            {currentQ?.type === 'mcq' && (
              <div className="space-y-2.5">
                {(currentQ.options || []).map(opt => {
                  const isSelected = answers[currentQ.id]?.answerMcq === opt.key;

                  return (
                    <label
                      key={opt.key}
                      onClick={() => updateAnswer({ answerMcq: opt.key })}
                      className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border cursor-pointer transition text-xs sm:text-sm ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-500 text-blue-950 font-semibold shadow-xs ring-1 ring-blue-400'
                          : 'border-slate-200 hover:bg-slate-50/80 text-slate-800'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {opt.key}
                      </div>
                      <span className="flex-1">{opt.text}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* 2. Complex MCQ */}
            {currentQ?.type === 'complex_mcq' && (
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-blue-700 italic mb-2">
                  * Petunjuk: Kamu boleh mencentang lebih dari satu pilihan jawaban yang benar!
                </p>
                {(currentQ.complexOptions || []).map(opt => {
                  const selectedArr = answers[currentQ.id]?.answerComplexMcq || [];
                  const isChecked = selectedArr.includes(opt.id);

                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border cursor-pointer transition text-xs sm:text-sm ${
                        isChecked
                          ? 'bg-blue-50 border-blue-500 text-blue-950 font-semibold shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          const currentSelected = answers[currentQ.id]?.answerComplexMcq || [];
                          let updated: string[];
                          if (e.target.checked) {
                            updated = [...currentSelected, opt.id];
                          } else {
                            updated = currentSelected.filter(id => id !== opt.id);
                          }
                          updateAnswer({ answerComplexMcq: updated });
                        }}
                        className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                      />
                      <span className="flex-1">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* 3. Matching (Menjodohkan) */}
            {currentQ?.type === 'matching' && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-blue-700 italic">
                  * Petunjuk: Pasangkan setiap pernyataan di sebelah kiri dengan pilihan jawaban di sebelah kanan:
                </p>
                <div className="space-y-2.5">
                  {(currentQ.matchingPairs || []).map(pair => {
                    const currentPairAns = answers[currentQ.id]?.answerMatching || {};
                    const selectedVal = currentPairAns[pair.leftPrompt] || '';

                    return (
                      <div
                        key={pair.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm"
                      >
                        <span className="font-bold text-slate-900 sm:w-1/2">
                          {pair.leftPrompt}
                        </span>
                        <div className="sm:w-1/2">
                          <select
                            value={selectedVal}
                            onChange={e => {
                              const updatedPairs = {
                                ...(answers[currentQ.id]?.answerMatching || {}),
                                [pair.leftPrompt]: e.target.value
                              };
                              updateAnswer({ answerMatching: updatedPairs });
                            }}
                            className="w-full p-2 border border-slate-300 rounded-lg bg-white font-medium text-xs focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">-- Pilih Pasangan Jawaban --</option>
                            {(currentQ.matchingPairs || []).map(p => (
                              <option key={p.id} value={p.rightAnswer}>{p.rightAnswer}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. True / False (4-5 Pernyataan atau single Benar/Salah) */}
            {currentQ?.type === 'true_false' && (
              <div>
                {currentQ.trueFalseItems && currentQ.trueFalseItems.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-700">
                        Tentukan pernyataan berikut <strong>Benar</strong> atau <strong>Salah</strong> ({currentQ.trueFalseItems.length} Pernyataan):
                      </span>
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 w-fit">
                        {Object.keys(answers[currentQ.id]?.answerTrueFalseMulti || {}).length} / {currentQ.trueFalseItems.length} Terjawab
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[11px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th scope="col" className="w-10 px-3 py-2.5 text-center">No</th>
                            <th scope="col" className="px-3 py-2.5">Pernyataan</th>
                            <th scope="col" className="w-44 sm:w-52 px-3 py-2.5 text-center">Pilihan Jawaban</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {currentQ.trueFalseItems.map((item, idx) => {
                            const userChoice = (answers[currentQ.id]?.answerTrueFalseMulti || {})[item.id];
                            return (
                              <tr key={item.id || idx} className="hover:bg-slate-50/70 transition">
                                <td className="px-3 py-3 text-center font-bold text-slate-500 align-top pt-3.5">
                                  {idx + 1}
                                </td>
                                <td className="px-3 py-3 text-slate-900 font-medium leading-relaxed align-middle">
                                  {item.statement}
                                </td>
                                <td className="px-3 py-3 align-middle">
                                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentMap = answers[currentQ.id]?.answerTrueFalseMulti || {};
                                        updateAnswer({
                                          answerTrueFalseMulti: {
                                            ...currentMap,
                                            [item.id]: true
                                          }
                                        });
                                      }}
                                      className={`py-2 px-2 rounded-lg border font-black text-xs transition flex items-center justify-center gap-1 ${
                                        userChoice === true
                                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-300'
                                          : 'border-slate-300 bg-white text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700'
                                      }`}
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      BENAR
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentMap = answers[currentQ.id]?.answerTrueFalseMulti || {};
                                        updateAnswer({
                                          answerTrueFalseMulti: {
                                            ...currentMap,
                                            [item.id]: false
                                          }
                                        });
                                      }}
                                      className={`py-2 px-2 rounded-lg border font-black text-xs transition flex items-center justify-center gap-1 ${
                                        userChoice === false
                                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-300'
                                          : 'border-slate-300 bg-white text-slate-700 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700'
                                      }`}
                                    >
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      SALAH
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => updateAnswer({ answerTrueFalse: true })}
                      className={`py-4 px-6 rounded-2xl border font-black text-sm transition flex items-center justify-center gap-2 ${
                        answers[currentQ.id]?.answerTrueFalse === true
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      BENAR
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAnswer({ answerTrueFalse: false })}
                      className={`py-4 px-6 rounded-2xl border font-black text-sm transition flex items-center justify-center gap-2 ${
                        answers[currentQ.id]?.answerTrueFalse === false
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <AlertCircle className="w-5 h-5" />
                      SALAH
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Navigation Controls: Prev, Next, Finish */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Sebelumnya
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
              >
                Berikutnya <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(true)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Selesaikan Ujian
              </button>
            )}
          </div>

        </div>

        {/* Right: Question Navigation Palette */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-800 text-xs">Navigasi Soal</span>
            <span className="text-[11px] font-bold text-slate-500">
              {answeredCount}/{totalQuestions} Terjawab
            </span>
          </div>

          {/* Number Palette Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2">
            {examQuestions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const hasAnswer = answers[q.id] !== undefined;
              const isReviewed = reviewedQuestionIds.includes(q.id);

              let bgClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200';
              if (isReviewed) {
                bgClass = 'bg-amber-400 text-amber-950 font-black';
              } else if (hasAnswer) {
                bgClass = 'bg-emerald-500 text-white font-bold';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 rounded-xl text-xs font-bold transition flex items-center justify-center relative ${bgClass} ${
                    isCurrent ? 'ring-2 ring-blue-600 ring-offset-2' : ''
                  }`}
                >
                  {idx + 1}
                  {isReviewed && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-900 absolute top-1 right-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
              <span>Sudah Dijawab ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-amber-400 shrink-0" />
              <span>Ragu-ragu ({reviewedCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-300 shrink-0" />
              <span>Belum Dijawab ({unansweredCount})</span>
            </div>
          </div>

          {/* Selesaikan Button in Sidebar */}
          <div className="pt-2">
            <button
              onClick={() => setIsConfirmModalOpen(true)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Selesaikan Ujian
            </button>
          </div>
        </div>

      </div>

      {/* Confirmation Modal Before Submission */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Konfirmasi Selesai Mengerjakan Ujian"
        subtitle="Periksa kembali ringkasan jawaban sebelum mengirim naskah ujian"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-emerald-600 font-bold">Terjawab</p>
              <p className="text-xl font-extrabold text-emerald-900">{answeredCount}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-amber-600 font-bold">Ragu-ragu</p>
              <p className="text-xl font-extrabold text-amber-900">{reviewedCount}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
              <p className="text-rose-600 font-bold">Belum Dijawab</p>
              <p className="text-xl font-extrabold text-rose-900">{unansweredCount}</p>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Perhatian!</p>
                <p className="text-[11px] text-rose-800">
                  Masih ada <strong>{unansweredCount} soal</strong> yang belum kamu jawab. Soal yang tidak dijawab bernilai 0 poin.
                </p>
              </div>
            </div>
          )}

          <p className="text-slate-600 text-center text-xs">
            Apakah kamu yakin ingin menyelesaikan ujian ini sekarang? Setelah dikirim, jawaban tidak dapat diubah kembali.
          </p>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium"
            >
              Periksa Kembali
            </button>
            <button
              type="button"
              onClick={() => handleSubmitExam(false)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
            >
              Ya, Selesaikan Ujian
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
