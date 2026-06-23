import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';

const COMMUNITY_LOCAL_KEY = 'tm_community_queue';

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
        // Flush community queue
        const communityQueue = readQueue<CommunityLocal>(COMMUNITY_LOCAL_KEY);
        if (communityQueue.length > 0) {
          const remaining: CommunityLocal[] = [];
          for (const item of communityQueue) {
            try {
              const { error } = await supabase.from('community_posts').insert({
                name: item.name,
                note: item.note,
                location: item.location,
                tags: item.tags,
                card_style: item.cardStyle,
                created_by: {
                  uid: user?.uid ?? null,
                  email: user?.email ?? null,
                  displayName: user?.displayName ?? null,
                },
                created_at: new Date().toISOString(),
              });
              if (error) throw error;
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
