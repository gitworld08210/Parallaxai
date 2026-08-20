import { useState, useRef, useCallback } from "react";
import {
  Query,
  DocumentData,
  getDocs,
  query,
  startAfter,
  limit,
  DocumentSnapshot,
} from "firebase/firestore";

interface UseInfiniteFirestoreOptions {
  pageSize?: number;
}

interface UseInfiniteFirestoreReturn<T> {
  data: T[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useInfiniteFirestore<T = DocumentData>(
  baseQuery: Query<DocumentData> | null,
  options: UseInfiniteFirestoreOptions = {}
): UseInfiniteFirestoreReturn<T> {
  const { pageSize = 10 } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<DocumentSnapshot<DocumentData> | null>(null);
  const isFetchingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (!baseQuery || isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const constraints = [limit(pageSize)];
      if (lastDocRef.current) {
        constraints.unshift(startAfter(lastDocRef.current));
      }

      const q = query(baseQuery, ...constraints);
      const snap = await getDocs(q);

      if (snap.docs.length < pageSize) {
        setHasMore(false);
      }

      if (snap.docs.length > 0) {
        lastDocRef.current = snap.docs[snap.docs.length - 1];
        const newItems = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData((prev) => [...prev, ...newItems]);
      }
    } catch (err) {
      console.error("useInfiniteFirestore loadMore error:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [baseQuery, pageSize, hasMore]);

  const refresh = useCallback(async () => {
    if (!baseQuery) return;
    lastDocRef.current = null;
    setHasMore(true);
    setData([]);
    isFetchingRef.current = false;

    setLoading(true);
    try {
      const q = query(baseQuery, limit(pageSize));
      const snap = await getDocs(q);

      if (snap.docs.length < pageSize) {
        setHasMore(false);
      }

      if (snap.docs.length > 0) {
        lastDocRef.current = snap.docs[snap.docs.length - 1];
        const items = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(items);
      }
    } catch (err) {
      console.error("useInfiniteFirestore refresh error:", err);
    } finally {
      setLoading(false);
    }
  }, [baseQuery, pageSize]);

  return { data, loading, hasMore, loadMore, refresh };
}
