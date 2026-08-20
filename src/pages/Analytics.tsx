import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/vibe/GlassCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty/EmptyState";
import {
  BarChart3,
  Eye,
  Heart,
  Users,
  TrendingUp,
  Coins,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useCreatorAnalytics, Period } from "@/hooks/useCreatorAnalytics";
import { useCoinBalance } from "@/hooks/useCoinBalance";
import { format, parseISO } from "date-fns";

function PeriodToggle({
  period,
  onChange,
}: {
  period: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted/30 p-0.5">
      {(["7d", "30d"] as const).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
            period === p
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {p === "7d" ? "7 Days" : "30 Days"}
        </button>
      ))}
    </div>
  );
}

function KPICard({
  label,
  value,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  value: string;
  icon: typeof Eye;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-3.5 w-3.5 text-primary/70" />
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <p className="text-xl font-bold">{value}</p>
      </GlassCard>
    </motion.div>
  );
}

function formatShortDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), "MMM d");
  } catch {
    return dateStr;
  }
}

export default function Analytics() {
  const [period, setPeriod] = useState<Period>("7d");
  const { posts, totals, viewsChart, followersChart, earningsChart, loading } =
    useCreatorAnalytics(period);
  const { balance } = useCoinBalance();

  const topPosts = [...posts]
    .sort((a, b) => b.like_count + b.view_count - (a.like_count + a.view_count))
    .slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen pb-24">
        <PageHeader title="Analytics" />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <PageHeader
        title="Analytics"
        right={<PeriodToggle period={period} onChange={setPeriod} />}
      />
      <div className="p-4 space-y-5">
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Views</p>
                    <p className="text-2xl font-bold">
                      {totals.views.toLocaleString()}
                    </p>
                  </div>
                  <Eye className="h-5 w-5 text-primary/50" />
                </div>
                {viewsChart.length > 0 ? (
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={viewsChart}>
                        <defs>
                          <linearGradient
                            id="viewsGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor="hsl(var(--primary))"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatShortDate}
                          tick={{ fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          labelFormatter={formatShortDate}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#viewsGradient)"
                          name="Views"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-40 rounded-lg bg-muted/20 grid place-items-center text-xs text-muted-foreground">
                    No view data yet
                  </div>
                )}
              </GlassCard>
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              <KPICard
                label="Total Views"
                value={totals.views.toLocaleString()}
                icon={Eye}
                delay={0.05}
              />
              <KPICard
                label="Total Likes"
                value={totals.likes.toLocaleString()}
                icon={Heart}
                delay={0.1}
              />
              <KPICard
                label="New Followers"
                value={totals.newFollowers.toLocaleString()}
                icon={Users}
                delay={0.15}
              />
              <KPICard
                label="Engagement Rate"
                value={`${totals.engagementRate}%`}
                icon={TrendingUp}
                delay={0.2}
              />
            </div>
          </TabsContent>

          {/* CONTENT TAB */}
          <TabsContent value="content" className="mt-4 space-y-3">
            {topPosts.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No content yet"
                subtitle="Publish posts to see your top performing content here."
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <p className="text-sm font-semibold text-muted-foreground">
                  Top Performing Posts
                </p>
                {topPosts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <GlassCard className="p-3">
                      <div className="flex gap-3">
                        {post.media_url ? (
                          <img
                            src={post.media_url}
                            alt=""
                            className="h-14 w-14 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-lg bg-muted/30 grid place-items-center flex-shrink-0">
                            <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {post.content || "No caption"}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Eye className="h-3 w-3" />
                              {post.view_count.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Heart className="h-3 w-3" />
                              {post.like_count.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground/60">
                              {post.view_count > 0
                                ? `${Math.round(
                                    ((post.like_count + post.comment_count) /
                                      post.view_count) *
                                      100
                                  )}% eng.`
                                : "0% eng."}
                            </span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>

          {/* AUDIENCE TAB */}
          <TabsContent value="audience" className="mt-4 space-y-4">
            {totals.newFollowers === 0 ? (
              <EmptyState
                icon={Users}
                title="No audience data"
                subtitle="Grow your following to see insights here."
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <GlassCard className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">
                      New Followers
                    </p>
                    <Users className="h-4 w-4 text-primary/50" />
                  </div>
                  <p className="text-2xl font-bold">
                    +{totals.newFollowers.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    in the last {period === "7d" ? "7 days" : "30 days"}
                  </p>
                </GlassCard>

                <GlassCard className="p-4">
                  <p className="text-xs text-muted-foreground mb-3">
                    Followers by Day
                  </p>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={followersChart}>
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatShortDate}
                          tick={{ fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          labelFormatter={formatShortDate}
                        />
                        <Bar
                          dataKey="value"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                          name="Followers"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </TabsContent>

          {/* EARNINGS TAB */}
          <TabsContent value="earnings" className="mt-4 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Current Balance
                    </p>
                    <p className="text-2xl font-bold">
                      {balance.toLocaleString()} coins
                    </p>
                  </div>
                  <Coins className="h-5 w-5 text-amber-400/70" />
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Tips Earned
                    </p>
                    <p className="text-2xl font-bold">
                      {totals.tipsEarned.toLocaleString()} coins
                    </p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-400/70" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  in the last {period === "7d" ? "7 days" : "30 days"}
                </p>
              </GlassCard>

              {totals.tipsEarned === 0 ? (
                <EmptyState
                  icon={Coins}
                  title="No earnings yet"
                  subtitle="Start creating content to receive tips from your audience."
                  size="sm"
                />
              ) : (
                <GlassCard className="p-4">
                  <p className="text-xs text-muted-foreground mb-3">
                    Earnings by Day
                  </p>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={earningsChart}>
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatShortDate}
                          tick={{ fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                          labelFormatter={formatShortDate}
                        />
                        <Bar
                          dataKey="value"
                          fill="hsl(142 71% 45%)"
                          radius={[4, 4, 0, 0]}
                          name="Coins"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
