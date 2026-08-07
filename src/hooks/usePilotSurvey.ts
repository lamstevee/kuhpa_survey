import { useState, useEffect, useCallback, useMemo } from 'react';
import { PilotPhase, RiasecScores, RiasecAnswer, PilotResult } from '../types/pilot';
import { savePilotResult, generatePilotCode } from '../../lib/supabase';
import { QUESTION_POOL, ClusterType } from '../data/questionPool';

const STORAGE_KEY = 'pilot_survey_progress';
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5분
const PROGRESS_EXPIRY_MS = 30 * 60 * 1000; // 30분

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface ShuffledRiasecItem {
  originalIndex: number;
  swapped: boolean; // true = A/B 화면상 위치 바꿈
}

function generateShuffledOrder(): ShuffledRiasecItem[] {
  return shuffleArray(
    QUESTION_POOL.map((_, i) => ({
      originalIndex: i,
      swapped: Math.random() < 0.5,
    }))
  );
}

interface ParticipantInfo {
  name: string;
  studentId: string;
}

interface UsePilotSurveyOptions {
  participantInfo?: ParticipantInfo;
  onComplete?: (result: PilotResult) => void;
}

export function usePilotSurvey(options: UsePilotSurveyOptions = {}) {
  const { participantInfo, onComplete } = options;

  const [phase, setPhase] = useState<PilotPhase>('intro');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PilotResult | null>(null);

  const [riasecIndex, setRiasecIndex] = useState(0);
  const [riasecAnswers, setRiasecAnswers] = useState<RiasecAnswer>({});
  const [riasecScores, setRiasecScores] = useState<RiasecScores | null>(null);
  const [selectedClusters, setSelectedClusters] = useState<ClusterType[]>([]);

  const [shuffledOrder, setShuffledOrder] = useState<ShuffledRiasecItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.savedAt && Date.now() - new Date(parsed.savedAt).getTime() > PROGRESS_EXPIRY_MS) {
          localStorage.removeItem(STORAGE_KEY);
          return generateShuffledOrder();
        }
        if (parsed.shuffledOrder?.length === QUESTION_POOL.length) {
          return parsed.shuffledOrder;
        }
      } catch { /* ignore */ }
    }
    return generateShuffledOrder();
  });

  const currentRiasecQuestion = useMemo(() => {
    const item = shuffledOrder[riasecIndex];
    if (!item) return null;
    const orig = QUESTION_POOL[item.originalIndex];
    if (!item.swapped) return orig;
    return { ...orig, A: orig.B, B: orig.A };
  }, [shuffledOrder, riasecIndex]);

  const riasecDisplayValue = useMemo((): 'A' | 'B' | undefined => {
    const item = shuffledOrder[riasecIndex];
    if (!item) return undefined;
    const stored = riasecAnswers[QUESTION_POOL[item.originalIndex].id];
    if (!stored) return undefined;
    return item.swapped ? (stored === 'A' ? 'B' : 'A') : stored;
  }, [shuffledOrder, riasecIndex, riasecAnswers]);

  // 진행 상태 복원 (새로고침 대응)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.savedAt && Date.now() - new Date(parsed.savedAt).getTime() > PROGRESS_EXPIRY_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      if (parsed.phase === 'riasec') {
        const savedIndex = parsed.riasecIndex ?? 0;
        if (parsed.riasecAnswers) setRiasecAnswers(parsed.riasecAnswers);
        if (parsed.selectedClusters) setSelectedClusters(parsed.selectedClusters);
        setRiasecIndex(savedIndex >= 0 && savedIndex < QUESTION_POOL.length ? savedIndex : 0);
        setPhase('riasec');
      } else if (parsed.phase === 'interest_select') {
        if (parsed.selectedClusters) setSelectedClusters(parsed.selectedClusters);
        setPhase('interest_select');
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('진행 상태 복원 실패, 초기화:', e);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // 자동 저장 (interest_select, riasec 단계)
  useEffect(() => {
    if (phase !== 'interest_select' && phase !== 'riasec') return;
    const saveProgress = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        phase,
        riasecIndex,
        riasecAnswers,
        selectedClusters,
        shuffledOrder,
        savedAt: new Date().toISOString(),
      }));
    };
    saveProgress();
    const interval = setInterval(saveProgress, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [phase, riasecIndex, riasecAnswers, selectedClusters, shuffledOrder]);

  const calculateRiasecScores = useCallback((answers: RiasecAnswer): RiasecScores => {
    const scores: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    QUESTION_POOL.forEach((q) => {
      const choice = answers[q.id];
      if (!choice) return;
      const weights = choice === 'A' ? q.A.weights : q.B.weights;
      weights.forEach(([dim, weight]) => {
        scores[dim] += weight;
      });
    });
    return scores;
  }, []);

  const startSurvey = useCallback(() => {
    setPhase('interest_select');
  }, []);

  const toggleCluster = useCallback((cluster: ClusterType) => {
    setSelectedClusters((prev) => {
      if (prev.includes(cluster)) return prev.filter((c) => c !== cluster);
      if (prev.length >= 3) return prev;
      return [...prev, cluster];
    });
  }, []);

  const startRiasec = useCallback(() => {
    setPhase('riasec');
    setRiasecIndex(0);
    setRiasecAnswers({});
    setShuffledOrder(generateShuffledOrder());
  }, []);

  const finishSurvey = useCallback(async (finalAnswers: RiasecAnswer) => {
    setIsLoading(true);
    setError(null);
    const scores = calculateRiasecScores(finalAnswers);
    setRiasecScores(scores);
    const code = generatePilotCode();
    const pilotResult: PilotResult = {
      code,
      name: participantInfo?.name || undefined,
      studentId: participantInfo?.studentId || undefined,
      riasecScores: scores,
      riasecAnswers: finalAnswers,
      interestedFields: selectedClusters,
      createdAt: new Date().toISOString(),
    };
    try {
      await savePilotResult(code, {
        name: participantInfo?.name,
        studentId: participantInfo?.studentId,
        riasecScores: scores,
        riasecAnswers: finalAnswers,
        interestedFields: selectedClusters,
      });
    } catch (e) {
      // savePilotResult가 내부에서 이미 흡수하지만, 방어적으로 한 번 더 잡는다.
      console.warn('결과 저장 중 알 수 없는 오류(무시하고 계속):', e);
    }
    localStorage.removeItem(STORAGE_KEY);
    setResult(pilotResult);
    setPhase('complete');
    setIsLoading(false);
    onComplete?.(pilotResult);
  }, [calculateRiasecScores, participantInfo, selectedClusters, onComplete]);

  const answerRiasecQuestion = useCallback((choice: 'A' | 'B') => {
    const item = shuffledOrder[riasecIndex];
    if (!item) return;
    const questionId = QUESTION_POOL[item.originalIndex].id;
    const actualChoice = item.swapped ? (choice === 'A' ? 'B' : 'A') : choice;
    const newAnswers = { ...riasecAnswers, [questionId]: actualChoice };
    setRiasecAnswers(newAnswers);

    setTimeout(() => {
      if (riasecIndex >= QUESTION_POOL.length - 1) {
        finishSurvey(newAnswers);
      } else {
        setRiasecIndex((prev) => prev + 1);
      }
    }, 300);
  }, [riasecIndex, riasecAnswers, shuffledOrder, finishSurvey]);

  const riasecCanGoPrevious = riasecIndex > 0;
  const goToPreviousRiasec = useCallback(() => {
    if (riasecCanGoPrevious) setRiasecIndex((prev) => prev - 1);
  }, [riasecCanGoPrevious]);

  const backToInterestSelect = useCallback(() => {
    setPhase('interest_select');
  }, []);

  const resetSurvey = useCallback(() => {
    setPhase('intro');
    setError(null);
    setResult(null);
    setRiasecIndex(0);
    setRiasecAnswers({});
    setRiasecScores(null);
    setSelectedClusters([]);
    setShuffledOrder(generateShuffledOrder());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    phase,
    isLoading,
    error,
    result,
    startSurvey,
    resetSurvey,

    selectedClusters,
    toggleCluster,
    startRiasec,
    backToInterestSelect,

    riasecIndex,
    riasecScores,
    currentRiasecQuestion,
    riasecDisplayValue,
    answerRiasecQuestion,
    goToPreviousRiasec,
    riasecCanGoPrevious,
  };
}

export default usePilotSurvey;
