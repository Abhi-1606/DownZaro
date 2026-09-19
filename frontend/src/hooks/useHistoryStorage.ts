import { useState, useEffect, useRef, useCallback } from 'react';
import { HistoryItem } from '../utils/types';

const STORAGE_KEY = 'DOWNZARO_HISTORY_V1';
const MAX_HISTORY_ITEMS = 500;

export const useHistoryStorage = () => {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Return empty list on parse error or private mode
    }
    return [];
  });

  const [undoToast, setUndoToast] = useState<{
    visible: boolean;
    message: string;
    action: () => void;
  } | null>(null);

  const undoTimeoutRef = useRef<any>(null);

  // Sync to localStorage
  const saveToStorage = useCallback((items: HistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)));
    } catch {
      // Storage quota exceeded: prune oldest 50 items and retry
      try {
        const pruned = items.slice(0, Math.max(1, items.length - 50));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
      } catch {
        // Fallback in-memory
      }
    }
  }, []);

  // Multi-tab sync via storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setHistory(parsed);
          }
        } catch {
          // ignore corrupted data from other tabs
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addHistoryItem = useCallback((item: HistoryItem) => {
    setHistory((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      const updated = [item, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const removeHistoryItem = useCallback((id: string) => {
    setHistory((prev) => {
      const itemToRemove = prev.find((i) => i.id === id);
      if (!itemToRemove) return prev;

      const updated = prev.filter((i) => i.id !== id);
      saveToStorage(updated);

      // Show Undo Toast
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      setUndoToast({
        visible: true,
        message: `Removed "${itemToRemove.title.slice(0, 30)}..."`,
        action: () => {
          setHistory((curr) => {
            const restored = [itemToRemove, ...curr];
            saveToStorage(restored);
            return restored;
          });
          setUndoToast(null);
        },
      });

      undoTimeoutRef.current = setTimeout(() => {
        setUndoToast(null);
      }, 8000);

      return updated;
    });
  }, [saveToStorage]);

  const clearAllHistory = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const snapshot = [...prev];
      saveToStorage([]);

      // Show Undo Toast for 8 seconds
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      setUndoToast({
        visible: true,
        message: 'Cleared all',
        action: () => {
          setHistory(snapshot);
          saveToStorage(snapshot);
          setUndoToast(null);
        },
      });

      undoTimeoutRef.current = setTimeout(() => {
        setUndoToast(null);
      }, 8000);

      return [];
    });
  }, [saveToStorage]);

  const dismissUndo = useCallback(() => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoToast(null);
  }, []);

  return {
    history,
    addHistoryItem,
    removeHistoryItem,
    clearAllHistory,
    undoToast,
    dismissUndo,
  };
};
