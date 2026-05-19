import { useEffect, useRef } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const FEEDBACK_LOCAL_KEY = 'tm_feedback_queue';
const COMMUNITY_LOCAL_KEY = 'tm_community_queue';

type FeedbackRowLocal = {
  source_english: string;
  speaker_profile: string;
  sentence_family: string;
  model_target_tm_romanized: string;
  corrected_target_tm_romanized: string;
  source_id: string;
  reviewer_id?: string;
  timestamp: string;
};

type CommunityLocal = {
  id: string;
  name: string;
  note: string;
  location: string;
  tags: string[];
  cardStyle: string;
  timestamp: string; // ISO
};

function readQueue<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeQueue<T>(key: string, rows: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(rows));
  } catch {
    // ignore
  }
}

export default function useBackgroundSync() {
  const { user } = useAuth();
  const runningRef = useRef(false);

  useEffect(() => {
    async function flush() {
      if (runningRef.current) return;
      if (!navigator.onLine) return;
      runningRef.current = true;

      try {
        // Flush feedback queue
        const feedbackQueue = readQueue<FeedbackRowLocal>(FEEDBACK_LOCAL_KEY);
        if (feedbackQueue.length > 0) {
          const remaining: FeedbackRowLocal[] = [];
          for (const row of feedbackQueue) {
            try {
              await addDoc(collection(db, 'feedback_corrections'), {
                ...row,
                submittedBy: {
                  uid: user?.uid ?? null,
                  email: user?.email ?? null,
                  displayName: user?.displayName ?? null,
                },
                submittedAt: serverTimestamp(),
              });
            } catch (err) {
              // keep remaining and stop attempting further to avoid repeated failures
              remaining.push(row);
            }
          }
          writeQueue(FEEDBACK_LOCAL_KEY, remaining);
        }

        // Flush community queue
        const communityQueue = readQueue<CommunityLocal>(COMMUNITY_LOCAL_KEY);
        if (communityQueue.length > 0) {
          const remaining: CommunityLocal[] = [];
          for (const item of communityQueue) {
            try {
              await addDoc(collection(db, 'community_posts'), {
                name: item.name,
                note: item.note,
                location: item.location,
                tags: item.tags,
                cardStyle: item.cardStyle,
                createdBy: {
                  uid: user?.uid ?? null,
                  email: user?.email ?? null,
                  displayName: user?.displayName ?? null,
                },
                createdAt: serverTimestamp(),
              });
            } catch (err) {
              remaining.push(item);
            }
          }
          writeQueue(COMMUNITY_LOCAL_KEY, remaining);
        }
      } finally {
        runningRef.current = false;
      }
    }

    // try on mount, on auth change, on online event
    flush();
    window.addEventListener('online', flush);

    return () => {
      window.removeEventListener('online', flush);
    };
  }, [user]);

  // periodic retry every 30s
  useEffect(() => {
    const id = setInterval(() => {
      if (navigator.onLine) {
        // call flush by dispatching an online event handler via custom event
        const ev = new Event('online');
        window.dispatchEvent(ev);
      }
    }, 30000);

    return () => clearInterval(id);
  }, []);
}
