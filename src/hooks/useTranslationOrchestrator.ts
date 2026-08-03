import { useCallback, useEffect, useRef, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
  adaptCrowdsourcedRecord,
  buildExactMatchOutcome,
  findExactCrowdsourcedMatch,
  selectLookupCandidateRecords,
  type CrowdsourcedSentenceRecord,
  type TranslationOutcome,
} from '../utils/crowdsourcedLookup';

interface TranslationOrchestratorState {
  loading: boolean;
  error: string | null;
  loadStatus: 'idle' | 'loading' | 'ready' | 'error';
  corpusLoaded: boolean;
  records: CrowdsourcedSentenceRecord[];
}

interface UseTranslationOrchestratorResult {
  state: TranslationOrchestratorState;
  translate: (input: string) => Promise<TranslationOutcome>;
  reset: () => void;
}

function toRecordMap(records: CrowdsourcedSentenceRecord[]) {
  return records.filter(Boolean);
}

export function useTranslationOrchestrator(): UseTranslationOrchestratorResult {
  const [state, setState] = useState<TranslationOrchestratorState>({
    loading: false,
    error: null,
    loadStatus: 'idle',
    corpusLoaded: false,
    records: [],
  });
  const recordsRef = useRef<CrowdsourcedSentenceRecord[]>([]);
  const loadingRef = useRef(false);

  const loadCorpus = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setState(prev => ({ ...prev, loading: true, loadStatus: 'loading', error: null }));

    try {
      const contributionsRef = collection(db, 'contributions');
      const snapshot = await getDocs(contributionsRef);
      const nextRecords = toRecordMap(
        snapshot.docs
          .map(doc => adaptCrowdsourcedRecord(doc.id, doc.data() as Record<string, unknown>))
          .filter((record): record is CrowdsourcedSentenceRecord => Boolean(record))
      );

      recordsRef.current = selectLookupCandidateRecords(nextRecords);
      setState({ loading: false, error: null, loadStatus: 'ready', corpusLoaded: true, records: nextRecords });
    } catch (error) {
      console.error('Could not load crowdsourced corpus', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Verified sentence lookup is unavailable right now.',
        loadStatus: 'error',
        corpusLoaded: false,
      }));
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void loadCorpus();
  }, [loadCorpus]);

  const translate = useCallback(async (input: string): Promise<TranslationOutcome> => {
    const trimmedInput = input.trim();
    const startedAt = performance.now();

    if (!trimmedInput) {
      return {
        originalInput: input,
        romanisedText: '',
        devanagariText: '',
        matchType: 'no-result',
        verified: false,
        latencyMs: Math.round(performance.now() - startedAt),
        dataQualityWarnings: [],
      };
    }

    if (!state.corpusLoaded && !recordsRef.current.length) {
      await loadCorpus();
    }

    const records = recordsRef.current;
    const exactMatch = findExactCrowdsourcedMatch(trimmedInput, records);

    if (exactMatch) {
      const outcome = buildExactMatchOutcome(trimmedInput, exactMatch, Math.round(performance.now() - startedAt));
      return outcome;
    }

    return {
      originalInput: input,
      romanisedText: '',
      devanagariText: '',
      matchType: 'no-result',
      verified: false,
      latencyMs: Math.round(performance.now() - startedAt),
      dataQualityWarnings: ['no-exact-match'],
    };
  }, [loadCorpus, state.corpusLoaded]);

  const reset = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return { state, translate, reset };
}
