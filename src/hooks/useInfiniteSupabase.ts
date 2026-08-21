import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FilterDef {
  column: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in";
  value: any;
}

interface UseInfiniteSupabaseOptions {
  table: string;
  select?: string;
  filters?: FilterDef[];
  orderBy?: { column: string; ascending?: boolean };
  pageSize?: number;
  enabled?: boolean;
}

interface UseInfiniteSupabaseReturn<T> {
  data: T[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useInfiniteSupabase<T = any>(
  options: UseInfiniteSupabaseOptions
): UseInfiniteSupabaseReturn<T> {
  const { table, select = "*", filters = [], orderBy, pageSize = 10, enabled = true } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const buildQuery = useCallback(() => {
    let q = supabase.from(table as any).select(select);
    for (const f of filters) {
      q = (q as any)[f.operator](f.column, f.value);
    }
    if (orderBy) {
      q = q.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    }
    return q;
  }, [table, select, JSON.stringify(filters), orderBy?.column, orderBy?.ascending]);

  const loadMore = useCallback(async () => {
    if (!enabled || isFetchingRef.current || !hasMoreRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const from = offsetRef.current;
      const to = from + pageSize - 1;
      const q = buildQuery();
      const { data: rows, error } = await q.range(from, to);

      if (error) throw error;

      if (!rows || rows.length < pageSize) {
        hasMoreRef.current = false;
        setHasMore(false);
      }

      if (rows && rows.length > 0) {
        offsetRef.current = from + rows.length;
        setData((prev) => [...prev, ...(rows as unknown as T[])]);
      }
    } catch (err) {
      console.error("useInfiniteSupabase loadMore error:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [enabled, pageSize, buildQuery]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    offsetRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);
    setData([]);
    isFetchingRef.current = false;

    setLoading(true);
    try {
      const q = buildQuery();
      const { data: rows, error } = await q.range(0, pageSize - 1);

      if (error) throw error;

      if (!rows || rows.length < pageSize) {
        hasMoreRef.current = false;
        setHasMore(false);
      }

      if (rows && rows.length > 0) {
        offsetRef.current = rows.length;
        setData(rows as unknown as T[]);
      }
    } catch (err) {
      console.error("useInfiniteSupabase refresh error:", err);
    } finally {
      setLoading(false);
    }
  }, [enabled, pageSize, buildQuery]);

  return { data, loading, hasMore, loadMore, refresh };
}
