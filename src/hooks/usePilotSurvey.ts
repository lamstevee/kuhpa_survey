import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PilotQuestion,
  PilotAnswers,
  PilotAnswer,
  PilotResult,
  ValueScores,
  CareerDecision,
  SelfEfficacy,
  Preferences,
  DeviceInfo,
  PilotPhase,
  RiasecScores,
  RiasecAnswer
} from '../types/pilot';
import { getActiveQuestions } from '../data/pilotQuestions';
import { savePilotResult, generatePilotCode } from '../../lib/supabase';
import { QUESTION_POOL, ClusterType } from '../data/questionPool';

const STORAGE_KEY = 'pilot_survey_progress';
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const PROGRESS_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// Fisher-Yates shuffle
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
  swapped: boolean; // true = A/B visually swapped
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
  email: string;
}

interface UsePilotSurveyOptions {
  participantInfo?: ParticipantInfo;
  onComplete?: (result: PilotResult) => void;
  skipIntro?: boolean;
  // 보완검사부터 시작할 때 사용
  initialRiasecScores?: RiasecScores;
  initialRiasecAnswers?: RiasecAnswer;
  startAtSupplementary?: boolean;
  // SSO 추가 정보
  department?: string;
  major?: string;
  source?: string;
  mode?: string;
}

interface UsePilotSurveyReturn {
  // State
  phase: PilotPhase;
  currentIndex: number;
  currentQuestion: PilotQuestion | null;
  answers: PilotAnswers;
  activeQuestions: PilotQuestion[];
  result: PilotResult | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  startSurvey: () => void;
  answerQuestion: (answer: PilotAnswer) => void;
  goToPrevious: () => void;
  goToNext: () => void;
  forceGoToNext: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  resetSurvey: () => void;

  // RIASEC-related
  riasecIndex: number;
  riasecAnswers: RiasecAnswer;
  riasecScores: RiasecScores | null;
  currentRiasecQuestion: typeof QUESTION_POOL[0] | null;
  riasecDisplayValue: 'A' | 'B' | undefined;
  answerRiasecQuestion: (choice: 'A' | 'B') => void;
  goToPreviousRiasec: () => void;
  goToNextRiasec: () => void;
  riasecCanGoPrevious: boolean;
  riasecCanGoNext: boolean;
  startSupplementary: () => void;
  skipSupplementary: () => Promise<void>;
  selectedClusters: ClusterType[];
  setSelectedClusters: (clusters: ClusterType[]) => void;
  toggleCluster: (cluster: ClusterType) => void;
  startMajorPreview: () => void;
  startRiasecFromPreview: () => void;
  backToInterestSelect: () => void;
  interestedMajorKeys: string[];
  toggleInterestedMajor: (key: string) => void;

  // Phone collection (for external users)
  startPhoneCollection: () => void;
  completePhoneCollection: (phone?: string, nextPhase?: PilotPhase) => void;
}

export function usePilotSurvey(options: UsePilotSurveyOptions = {}): UsePilotSurveyReturn {
  const {
    participantInfo,
    onComplete,
    skipIntro = false,
    initialRiasecScores,
    initialRiasecAnswers,
    startAtSupplementary = false,
    department,
    major,
    source,
    mode,
  } = options;

  // 보완검사부터 시작하는 경우 phase를 supplementary로 설정
  const [phase, setPhase] = useState<PilotPhase>(() => {
    if (startAtSupplementary && initialRiasecScores) return 'supplementary';
    if (skipIntro) return 'interest_select';
    return 'intro';
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<PilotAnswers>({});
  const [result, setResult] = useState<PilotResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // RIASEC state - 초기값이 있으면 사용
  const [riasecIndex, setRiasecIndex] = useState(0);
  const [riasecAnswers, setRiasecAnswers] = useState<RiasecAnswer>(initialRiasecAnswers || {});
  const [riasecScores, setRiasecScores] = useState<RiasecScores | null>(initialRiasecScores || null);
  const [selectedClusters, setSelectedClusters] = useState<ClusterType[]>([]);
  const [interestedMajorKeys, setInterestedMajorKeys] = useState<string[]>([]);
  const [surveyStartTime, setSurveyStartTime] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [savedPilotCode, setSavedPilotCode] = useState<string | null>(null);

  // Shuffled RIASEC question order + A/B swap flags (restored from localStorage or generated fresh)
  const [shuffledOrder, setShuffledOrder] = useState<ShuffledRiasecItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 30분 만료 체크
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

  // Calculate active questions based on current answers (handles conditional questions)
  const activeQuestions = useMemo(() => {
    return getActiveQuestions(answers);
  }, [answers]);

  const currentQuestion = activeQuestions[currentIndex] || null;

  // Shuffled RIASEC: return question with A/B potentially swapped
  const currentRiasecQuestion = useMemo(() => {
    const item = shuffledOrder[riasecIndex];
    if (!item) return null;
    const orig = QUESTION_POOL[item.originalIndex];
    if (!item.swapped) return orig;
    return { ...orig, A: orig.B, B: orig.A };
  }, [shuffledOrder, riasecIndex]);

  // Display value: translate stored answer back to swapped display coordinates
  const riasecDisplayValue = useMemo((): 'A' | 'B' | undefined => {
    const item = shuffledOrder[riasecIndex];
    if (!item) return undefined;
    const stored = riasecAnswers[QUESTION_POOL[item.originalIndex].id];
    if (!stored) return undefined;
    return item.swapped ? (stored === 'A' ? 'B' : 'A') : stored;
  }, [shuffledOrder, riasecIndex, riasecAnswers]);

  // Load saved progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // 30분 만료 체크
        if (parsed.savedAt && Date.now() - new Date(parsed.savedAt).getTime() > PROGRESS_EXPIRY_MS) {
          console.log('Survey progress expired (30min), clearing');
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        // Validate saved data integrity before restoring
        const isValidRiasecScores = parsed.riasecScores &&
          typeof parsed.riasecScores === 'object' &&
          ['R', 'I', 'A', 'S', 'E', 'C'].every(k => typeof parsed.riasecScores[k] === 'number');

        const isValidRiasecAnswers = parsed.riasecAnswers &&
          typeof parsed.riasecAnswers === 'object';

        // Restore phase with strict validation
        if (parsed.phase === 'riasec') {
          const savedIndex = parsed.riasecIndex ?? 0;
          if (isValidRiasecAnswers) setRiasecAnswers(parsed.riasecAnswers);
          if (savedIndex >= 0 && savedIndex < QUESTION_POOL.length) {
            setRiasecIndex(savedIndex);
          } else {
            console.warn('Invalid riasecIndex, starting from 0');
            setRiasecIndex(0);
          }
          setPhase('riasec');
        } else if (parsed.phase === 'riasec_result') {
          // riasec_result 복원 - 페이지 새로고침 시 결과 유지
          if (isValidRiasecScores) {
            if (isValidRiasecAnswers) setRiasecAnswers(parsed.riasecAnswers);
            setRiasecScores(parsed.riasecScores);
            setPhase('riasec_result');
            console.log('Restored riasec_result phase from localStorage');
          } else {
            console.warn('Invalid riasecScores for riasec_result phase, resetting');
            localStorage.removeItem(STORAGE_KEY);
          }
        } else if (parsed.phase === 'supplementary') {
          if (isValidRiasecScores) setRiasecScores(parsed.riasecScores);
          if (isValidRiasecAnswers) setRiasecAnswers(parsed.riasecAnswers);
          if (parsed.answers && Object.keys(parsed.answers).length > 0) {
            setAnswers(parsed.answers);
            setCurrentIndex(parsed.currentIndex || 0);
          }
          setPhase('supplementary');
        } else {
          // Unknown or 'complete' phase in storage — discard
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error('Failed to load saved progress, resetting:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Auto-save progress for riasec, riasec_result, and supplementary phases
  useEffect(() => {
    if (phase !== 'riasec' && phase !== 'riasec_result' && phase !== 'supplementary') return;

    const saveProgress = () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        answers,
        currentIndex,
        phase,
        riasecIndex,
        riasecAnswers,
        riasecScores,
        shuffledOrder,
        savedAt: new Date().toISOString()
      }));
    };

    // Save on answer change
    saveProgress();

    // Save periodically
    const interval = setInterval(saveProgress, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [answers, currentIndex, phase, riasecIndex, riasecAnswers, riasecScores, shuffledOrder]);

  // Calculate RIASEC scores
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

  // Calculate scores from answers
  const calculateScores = useCallback((finalAnswers: PilotAnswers): {
    valueScores: ValueScores;
    careerDecision: CareerDecision;
    selfEfficacy: SelfEfficacy;
    preferences: Preferences;
  } => {
    // Value scores (V01-V15 mapped to 7 categories)
    const valueScores: ValueScores = {
      achievement: ((finalAnswers['V01'] as number || 0) + (finalAnswers['V02'] as number || 0)) / 2,
      recognition: ((finalAnswers['V03'] as number || 0) + (finalAnswers['V04'] as number || 0)) / 2,
      independence: ((finalAnswers['V05'] as number || 0) + (finalAnswers['V06'] as number || 0)) / 2,
      social: ((finalAnswers['V07'] as number || 0) + (finalAnswers['V08'] as number || 0)) / 2,
      security: ((finalAnswers['V09'] as number || 0) + (finalAnswers['V10'] as number || 0)) / 2,
      economic: ((finalAnswers['V11'] as number || 0) + (finalAnswers['V12'] as number || 0)) / 2,
      growth: ((finalAnswers['V13'] as number || 0) + (finalAnswers['V14'] as number || 0) + (finalAnswers['V15'] as number || 0)) / 3,
    };

    // Career decision (D01-D04)
    const decisionAvg = (
      (finalAnswers['D01'] as number || 0) +
      (finalAnswers['D02'] as number || 0) +
      (finalAnswers['D03'] as number || 0) +
      (finalAnswers['D04'] as number || 0)
    ) / 4;

    let decisionStatus: 'decided' | 'exploring' | 'undecided';
    if (decisionAvg >= 4) {
      decisionStatus = 'decided';
    } else if (decisionAvg >= 2.5) {
      decisionStatus = 'exploring';
    } else {
      decisionStatus = 'undecided';
    }

    const careerDecision: CareerDecision = {
      status: decisionStatus,
      score: decisionAvg,
      factors: finalAnswers['C04'] as string[] | undefined
    };

    // Self efficacy by RIASEC (E01-E06)
    // E01=I(분석), E02=A(창의), E03=S(대인), E04=E(리더십), E05=R(실무), E06=C(체계)
    const selfEfficacy: SelfEfficacy = {
      I: finalAnswers['E01'] as number || 0,
      A: finalAnswers['E02'] as number || 0,
      S: finalAnswers['E03'] as number || 0,
      E: finalAnswers['E04'] as number || 0,
      R: finalAnswers['E05'] as number || 0,
      C: finalAnswers['E06'] as number || 0,
    };

    // Preferences from S01-S04 and C01-C03
    const preferences: Preferences = {
      fieldPreference: finalAnswers['S01'] as string,
      workStyle: finalAnswers['S02'] as string,
      workEnvironment: finalAnswers['S03'] as string,
      careerGoal: finalAnswers['S04'] as string,
      conditionalDetails: [
        finalAnswers['C01'] as string,
        finalAnswers['C02'] as string,
        finalAnswers['C03'] as string,
      ].filter(Boolean)
    };

    return { valueScores, careerDecision, selfEfficacy, preferences };
  }, []);

  // Get device info
  const getDeviceInfo = (): DeviceInfo => ({
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    platform: navigator.platform,
    language: navigator.language,
  });

  // Start RIASEC phase
  const startRiasec = useCallback(() => {
    setPhase('riasec');
    setRiasecIndex(0);
    setRiasecAnswers({});
    setShuffledOrder(generateShuffledOrder());
    setSurveyStartTime(Date.now());
  }, []);

  // Start survey (redirects to interest_select, or directly to riasec for LTU)
  const startSurvey = useCallback(() => {
    if (mode === 'ltu') {
      startRiasec();
    } else {
      setPhase('interest_select');
    }
  }, [mode, startRiasec]);

  const toggleCluster = useCallback((cluster: ClusterType) => {
    setSelectedClusters(prev => {
      if (prev.includes(cluster)) {
        return prev.filter(c => c !== cluster);
      }
      if (prev.length >= 3) return prev;
      return [...prev, cluster];
    });
  }, []);

  const toggleInterestedMajor = useCallback((key: string) => {
    setInterestedMajorKeys(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      }
      if (prev.length >= 5) return prev;
      return [...prev, key];
    });
  }, []);

  const startMajorPreview = useCallback(() => {
    setPhase('major_preview');
  }, []);

  const startRiasecFromPreview = useCallback(() => {
    startRiasec();
  }, [startRiasec]);

  const backToInterestSelect = useCallback(() => {
    setPhase('interest_select');
  }, []);

  // Save RIASEC result to DB (called when RIASEC phase completes)
  // Also calls onComplete immediately to save to localStorage
  const saveRiasecResult = useCallback(async (scores: RiasecScores, answers: RiasecAnswer) => {
    try {
      const code = generatePilotCode();
      setSavedPilotCode(code);
      const deviceInfo = getDeviceInfo();

      await savePilotResult(code, {}, {
        name: participantInfo?.name || undefined,
        studentId: participantInfo?.studentId || undefined,
        email: participantInfo?.email || undefined,
        phone: phoneNumber || undefined,
        riasecScores: scores,
        riasecAnswers: answers,
        skippedSupplementary: false,
        deviceInfo,
        department,
        major,
        source,
        durationSeconds: surveyStartTime ? Math.round((Date.now() - surveyStartTime) / 1000) : undefined,
      });

      console.log('RIASEC result saved to DB with code:', code, 'studentId:', participantInfo?.studentId);

      // localStorage는 여기서 삭제하지 않음 - riasec_result 상태를 유지해야 함
      // 보완검사 완료 또는 건너뛰기 시에만 삭제됨

      // Call onComplete immediately to save result to App state and localStorage
      // This ensures result is saved even if user navigates away before clicking Skip
      const pilotResult: PilotResult = {
        code,
        name: participantInfo?.name || undefined,
        studentId: participantInfo?.studentId || undefined,
        email: participantInfo?.email || undefined,
        rawAnswers: {},
        riasecScores: scores,
        riasecAnswers: answers,
        skippedSupplementary: false, // User can still do supplementary later
        valueScores: { achievement: 0, recognition: 0, independence: 0, social: 0, security: 0, economic: 0, growth: 0 },
        careerDecision: { status: 'exploring', score: 0 },
        selfEfficacy: {},
        preferences: {},
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      };
      onComplete?.(pilotResult);
    } catch (e) {
      console.error('Failed to save RIASEC result:', e);
    }
  }, [participantInfo, onComplete]);

  // Answer RIASEC question and auto-advance
  const answerRiasecQuestion = useCallback((choice: 'A' | 'B') => {
    const item = shuffledOrder[riasecIndex];
    const questionId = QUESTION_POOL[item.originalIndex].id;
    // Translate display choice back to original A/B if swapped
    const actualChoice = item.swapped ? (choice === 'A' ? 'B' : 'A') : choice;
    const newAnswers = { ...riasecAnswers, [questionId]: actualChoice };
    setRiasecAnswers(newAnswers);

    // Auto-advance after a short delay for visual feedback
    setTimeout(() => {
      if (riasecIndex >= QUESTION_POOL.length - 1) {
        // Complete RIASEC phase
        const scores = calculateRiasecScores(newAnswers);
        setRiasecScores(scores);
        setPhase('riasec_result');

        // Save RIASEC result immediately to DB
        saveRiasecResult(scores, newAnswers);
      } else {
        setRiasecIndex(prev => prev + 1);
      }
    }, 300);
  }, [riasecIndex, riasecAnswers, shuffledOrder, calculateRiasecScores, saveRiasecResult]);

  // Answer current question and auto-advance
  const answerQuestion = useCallback((answer: PilotAnswer) => {
    if (!currentQuestion) return;

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  }, [currentQuestion]);

  // RIASEC navigation
  const riasecCanGoPrevious = riasecIndex > 0;
  const riasecCanGoNext = true; // Always allow proceeding without answering

  const goToPreviousRiasec = useCallback(() => {
    if (riasecCanGoPrevious) setRiasecIndex(prev => prev - 1);
  }, [riasecCanGoPrevious]);

  const goToNextRiasec = useCallback(() => {
    if (riasecIndex >= QUESTION_POOL.length - 1) {
      // Complete RIASEC phase
      const scores = calculateRiasecScores(riasecAnswers);
      setRiasecScores(scores);
      setPhase('riasec_result');

      // Save RIASEC result immediately to DB
      saveRiasecResult(scores, riasecAnswers);
    } else {
      setRiasecIndex(prev => prev + 1);
    }
  }, [riasecIndex, riasecAnswers, calculateRiasecScores, saveRiasecResult]);

  // Navigation
  const canGoPrevious = currentIndex > 0;
  // Freetext questions are optional and can be skipped
  const canGoNext = currentQuestion
    ? currentQuestion.type === 'freetext' || answers[currentQuestion.id] !== undefined
    : false;

  const goToPrevious = useCallback(() => {
    if (canGoPrevious) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [canGoPrevious]);

  // Force advance to next question (bypasses canGoNext check for auto-advance after selection)
  const forceGoToNext = useCallback(async () => {
    // Check if this is the last question
    if (currentIndex >= activeQuestions.length - 1) {
      // Complete the survey (reuse existing code to avoid duplicates)
      setIsLoading(true);
      setError(null);

      try {
        const code = savedPilotCode || generatePilotCode();
        const { valueScores, careerDecision, selfEfficacy, preferences } = calculateScores(answers);
        const deviceInfo = getDeviceInfo();

        const pilotResult: PilotResult = {
          code,
          name: participantInfo?.name || undefined,
          studentId: participantInfo?.studentId || undefined,
          email: participantInfo?.email || undefined,
          rawAnswers: answers,
          valueScores,
          careerDecision,
          selfEfficacy,
          preferences,
          roleModel: {
            name: answers['R01'] as string,
            traits: answers['R02'] as string[],
          },
          valueRanking: answers['K01'] as Record<string, number>,
          riasecScores: riasecScores || undefined,
          riasecAnswers: riasecAnswers || undefined,
          deviceInfo,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        };

        // Save to Supabase
        await savePilotResult(code, answers, {
          name: participantInfo?.name || undefined,
          studentId: participantInfo?.studentId || undefined,
          email: participantInfo?.email || undefined,
          phone: phoneNumber || undefined,
          valueScores,
          careerDecision,
          selfEfficacy,
          preferences,
          riasecScores: riasecScores || undefined,
          riasecAnswers: riasecAnswers || undefined,
          deviceInfo,
          department,
          major,
          source,
          durationSeconds: surveyStartTime ? Math.round((Date.now() - surveyStartTime) / 1000) : undefined,
        });

        // Clear saved progress
        localStorage.removeItem(STORAGE_KEY);

        setResult(pilotResult);
        setPhase('complete');
        onComplete?.(pilotResult);
      } catch (e) {
        console.error('Failed to save result:', e);
        setError('결과 저장에 실패했습니다. 다시 시도해 주세요.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, activeQuestions.length, answers, participantInfo, riasecScores, riasecAnswers, calculateScores, onComplete]);

  // Phase transitions
  const startSupplementary = useCallback(() => {
    setPhase('supplementary');
    setCurrentIndex(0);
  }, []);

  const skipSupplementary = useCallback(async () => {
    if (!riasecScores) {
      setError('RIASEC 점수가 없습니다. 처음부터 다시 시작해 주세요.');
      return;
    }
    // Save RIASEC-only result (reuse existing code to avoid duplicates)
    setIsLoading(true);
    try {
      const code = savedPilotCode || generatePilotCode();
      await savePilotResult(code, {}, {
        name: participantInfo?.name || undefined,
        studentId: participantInfo?.studentId || undefined,
        email: participantInfo?.email || undefined,
        phone: phoneNumber || undefined,
        riasecScores: riasecScores!,
        riasecAnswers,
        skippedSupplementary: true,
        deviceInfo: getDeviceInfo(),
        department,
        major,
        source,
        durationSeconds: surveyStartTime ? Math.round((Date.now() - surveyStartTime) / 1000) : undefined,
      });
      localStorage.removeItem(STORAGE_KEY);

      const pilotResult: PilotResult = {
        code,
        name: participantInfo?.name || undefined,
        studentId: participantInfo?.studentId || undefined,
        email: participantInfo?.email || undefined,
        rawAnswers: {},
        riasecScores: riasecScores!,
        riasecAnswers,
        skippedSupplementary: true,
        valueScores: { achievement: 0, recognition: 0, independence: 0, social: 0, security: 0, economic: 0, growth: 0 },
        careerDecision: { status: 'exploring', score: 0 },
        selfEfficacy: {},
        preferences: {},
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      };

      setResult(pilotResult);
      setPhase('complete');
      onComplete?.(pilotResult);
    } catch (e) {
      setError('결과 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [participantInfo, riasecScores, riasecAnswers, onComplete]);

  const goToNext = useCallback(async () => {
    if (!canGoNext) return;

    // Check if this is the last question
    if (currentIndex >= activeQuestions.length - 1) {
      // Complete the survey (reuse existing code to avoid duplicates)
      setIsLoading(true);
      setError(null);

      try {
        const code = savedPilotCode || generatePilotCode();
        const { valueScores, careerDecision, selfEfficacy, preferences } = calculateScores(answers);
        const deviceInfo = getDeviceInfo();

        const pilotResult: PilotResult = {
          code,
          name: participantInfo?.name || undefined,
          studentId: participantInfo?.studentId || undefined,
          email: participantInfo?.email || undefined,
          rawAnswers: answers,
          valueScores,
          careerDecision,
          selfEfficacy,
          preferences,
          roleModel: {
            name: answers['R01'] as string,
            traits: answers['R02'] as string[],
          },
          valueRanking: answers['K01'] as Record<string, number>,
          riasecScores: riasecScores || undefined,
          riasecAnswers: riasecAnswers || undefined,
          deviceInfo,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        };

        // Save to Supabase
        await savePilotResult(code, answers, {
          name: participantInfo?.name || undefined,
          studentId: participantInfo?.studentId || undefined,
          email: participantInfo?.email || undefined,
          phone: phoneNumber || undefined,
          valueScores,
          careerDecision,
          selfEfficacy,
          preferences,
          riasecScores: riasecScores || undefined,
          riasecAnswers: riasecAnswers || undefined,
          deviceInfo,
          department,
          major,
          source,
          durationSeconds: surveyStartTime ? Math.round((Date.now() - surveyStartTime) / 1000) : undefined,
        });

        // Clear saved progress
        localStorage.removeItem(STORAGE_KEY);

        setResult(pilotResult);
        setPhase('complete');
        onComplete?.(pilotResult);
      } catch (e) {
        console.error('Failed to save result:', e);
        setError('결과 저장에 실패했습니다. 다시 시도해 주세요.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [canGoNext, currentIndex, activeQuestions.length, answers, participantInfo, riasecScores, riasecAnswers, calculateScores, onComplete]);

  // Reset survey
  const resetSurvey = useCallback(() => {
    setPhase(skipIntro ? 'interest_select' : 'intro');
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);
    setError(null);
    setRiasecIndex(0);
    setRiasecAnswers({});
    setRiasecScores(null);
    setSelectedClusters([]);
    setInterestedMajorKeys([]);
    setShuffledOrder(generateShuffledOrder());
    localStorage.removeItem(STORAGE_KEY);
  }, [skipIntro]);

  // Phone collection phase transitions (for external users)
  const startPhoneCollection = useCallback(() => {
    setPhase('phone_collection');
  }, []);

  const completePhoneCollection = useCallback((phone?: string, nextPhase?: PilotPhase) => {
    if (phone) {
      setPhoneNumber(phone);
    }
    // 지정된 phase로 이동, 없으면 riasec_result (결과 화면)
    setPhase(nextPhase || 'riasec_result');
  }, []);

  return {
    // Existing
    phase,
    currentIndex,
    currentQuestion,
    answers,
    activeQuestions,
    result,
    isLoading,
    error,
    startSurvey,
    answerQuestion,
    goToPrevious,
    goToNext,
    forceGoToNext,
    canGoNext,
    canGoPrevious,
    resetSurvey,

    // New RIASEC-related
    riasecIndex,
    riasecAnswers,
    riasecScores,
    currentRiasecQuestion,
    riasecDisplayValue,
    answerRiasecQuestion,
    goToPreviousRiasec,
    goToNextRiasec,
    riasecCanGoPrevious,
    riasecCanGoNext,
    startSupplementary,
    skipSupplementary,
    selectedClusters,
    setSelectedClusters,
    toggleCluster,
    startMajorPreview,
    startRiasecFromPreview,
    backToInterestSelect,
    interestedMajorKeys,
    toggleInterestedMajor,

    // Phone collection
    startPhoneCollection,
    completePhoneCollection,
  };
}

export default usePilotSurvey;
