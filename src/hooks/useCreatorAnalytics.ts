import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { subDays, startOfDay, format } from "date-fns";

export type Period = "7d" | "30d";

export interface PostMetric {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  like_count: number;
  comment_count: number;
  view_count: number;
  created_at: Date;
  status: string;
}

export interface DailyMetric {
  date: string;
  value: number;
}

export interface AnalyticsTotals {
  views: number;
  likes: number;
  comments: number;
  newFollowers: number;
  engagementRate: number;
  tipsEarned: number;
}

export interface AnalyticsData {
  posts: PostMetric[];
  followers: { id: string; follower_id: string; created_at: Date }[];
  transactions: { id: string; amount: number; created_at: Date }[];
  totals: AnalyticsTotals;
  viewsChart: DailyMetric[];
  followersChart: DailyMetric[];
  earningsChart: DailyMetric[];
  loading: boolean;
}

function buildDailyMap(days: number): Map<string, number> {
  const map = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(now, i);
    map.set(format(startOfDay(d), "yyyy-MM-dd"), 0);
  }
  return map;
}

export function useCreatorAnalytics(period: Period): AnalyticsData {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData>({
    posts: [],
    followers: [],
    transactions: [],
    totals: { views: 0, likes: 0, comments: 0, newFollowers: 0, engagementRate: 0, tipsEarned: 0 },
    viewsChart: [],
    followersChart: [],
    earningsChart: [],
    loading: true,
  });

  const days = period === "7d" ? 7 : 30;

  useEffect(() => {
    if (!user) {
      setData((prev) => ({ ...prev, loading: false }));
      return;
    }

    let cancelled = false;

    async function fetchAnalytics() {
      const startDate = startOfDay(subDays(new Date(), days));
      const startDateISO = startDate.toISOString();

      try {
        // Fetch posts
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(50);

        const posts: PostMetric[] = ((postsData || []) as any[]).map((d: any) => ({
          id: d.id,
          content: d.content || "",
          media_url: d.media_url || null,
          media_type: d.media_type || null,
          like_count: d.like_count || 0,
          comment_count: d.comment_count || 0,
          view_count: d.view_count || 0,
          created_at: new Date(d.created_at),
          status: d.status || "published",
        }));

        // Fetch follows (new followers in period)
        const { data: followsData } = await supabase
          .from('follows')
          .select('*')
          .eq('following_id', user!.id)
          .gte('created_at', startDateISO)
          .order('created_at', { ascending: false });

        const followers = ((followsData || []) as any[]).map((d: any) => ({
          id: d.id,
          follower_id: d.follower_id,
          created_at: new Date(d.created_at),
        }));

        // Fetch tip transactions (earnings)
        const { data: txData } = await supabase
          .from('transactions')
          .select('*')
          .eq('recipient_id', user!.id)
          .eq('type', 'tip')
          .gte('created_at', startDateISO)
          .order('created_at', { ascending: false });

        const transactions = ((txData || []) as any[]).map((d: any) => ({
          id: d.id,
          amount: d.amount || 0,
          created_at: new Date(d.created_at),
        }));

        // Calculate totals
        const postsInPeriod = posts.filter(
          (p) => p.created_at >= startDate
        );
        const totalViews = postsInPeriod.reduce((sum, p) => sum + p.view_count, 0);
        const totalLikes = postsInPeriod.reduce((sum, p) => sum + p.like_count, 0);
        const totalComments = postsInPeriod.reduce((sum, p) => sum + p.comment_count, 0);
        const newFollowers = followers.length;
        const engagementRate =
          totalViews > 0
            ? Math.round(((totalLikes + totalComments) / totalViews) * 100 * 10) / 10
            : 0;
        const tipsEarned = transactions.reduce((sum, t) => sum + t.amount, 0);

        // Build chart data
        const viewsMap = buildDailyMap(days);
        postsInPeriod.forEach((p) => {
          const key = format(startOfDay(p.created_at), "yyyy-MM-dd");
          if (viewsMap.has(key)) {
            viewsMap.set(key, (viewsMap.get(key) || 0) + p.view_count);
          }
        });
        const viewsChart: DailyMetric[] = Array.from(viewsMap.entries()).map(([date, value]) => ({
          date,
          value,
        }));

        const followersMap = buildDailyMap(days);
        followers.forEach((f) => {
          const key = format(startOfDay(f.created_at), "yyyy-MM-dd");
          if (followersMap.has(key)) {
            followersMap.set(key, (followersMap.get(key) || 0) + 1);
          }
        });
        const followersChart: DailyMetric[] = Array.from(followersMap.entries()).map(
          ([date, value]) => ({ date, value })
        );

        const earningsMap = buildDailyMap(days);
        transactions.forEach((t) => {
          const key = format(startOfDay(t.created_at), "yyyy-MM-dd");
          if (earningsMap.has(key)) {
            earningsMap.set(key, (earningsMap.get(key) || 0) + t.amount);
          }
        });
        const earningsChart: DailyMetric[] = Array.from(earningsMap.entries()).map(
          ([date, value]) => ({ date, value })
        );

        if (!cancelled) {
          setData({
            posts,
            followers,
            transactions,
            totals: {
              views: totalViews,
              likes: totalLikes,
              comments: totalComments,
              newFollowers,
              engagementRate,
              tipsEarned,
            },
            viewsChart,
            followersChart,
            earningsChart,
            loading: false,
          });
        }
      } catch (err) {
        console.warn("Analytics fetch error:", err);
        if (!cancelled) {
          setData((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, [user?.id, days]);

  return data;
}
