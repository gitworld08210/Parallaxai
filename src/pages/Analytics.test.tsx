import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock Firebase
vi.mock("@/lib/firebase", () => ({
  db: {},
  auth: {},
}));

// Mock Firebase Firestore
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  limit: vi.fn(),
  Timestamp: { fromDate: vi.fn(() => ({ seconds: 0, nanoseconds: 0 })) },
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
  onSnapshot: vi.fn((_ref: any, cb: any) => {
    if (typeof cb === "function") cb({ exists: () => false, data: () => ({}) });
    return vi.fn();
  }),
}));

// Mock auth context
vi.mock("@/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "test-user-123", uid: "test-user-123" },
    profile: { username: "testuser", display_name: "Test User" },
  }),
}));

// Mock useCoinBalance
vi.mock("@/hooks/useCoinBalance", () => ({
  useCoinBalance: () => ({ balance: 500, loading: false, refresh: vi.fn() }),
}));

// Mock useCreatorAnalytics to avoid async Firestore calls
vi.mock("@/hooks/useCreatorAnalytics", () => ({
  useCreatorAnalytics: () => ({
    posts: [],
    followers: [],
    transactions: [],
    totals: {
      views: 1234,
      likes: 567,
      comments: 89,
      newFollowers: 42,
      engagementRate: 5.3,
      tipsEarned: 250,
    },
    viewsChart: [
      { date: "2024-01-01", value: 100 },
      { date: "2024-01-02", value: 150 },
    ],
    followersChart: [
      { date: "2024-01-01", value: 5 },
      { date: "2024-01-02", value: 3 },
    ],
    earningsChart: [
      { date: "2024-01-01", value: 50 },
      { date: "2024-01-02", value: 75 },
    ],
    loading: false,
  }),
}));

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock("recharts", () => ({
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, transition, whileHover, whileTap, ...validProps } = props;
      return <div {...validProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

import Analytics from "./Analytics";

function renderAnalytics() {
  return render(
    <MemoryRouter>
      <Analytics />
    </MemoryRouter>
  );
}

describe("Analytics Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the four tabs", () => {
    renderAnalytics();

    expect(screen.getByRole("tab", { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /content/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /audience/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /earnings/i })).toBeInTheDocument();
  });

  it("renders the page header with title", () => {
    renderAnalytics();

    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });

  it("renders period toggle buttons", () => {
    renderAnalytics();

    expect(screen.getByText("7 Days")).toBeInTheDocument();
    expect(screen.getByText("30 Days")).toBeInTheDocument();
  });

  it("shows overview tab content by default", () => {
    renderAnalytics();

    expect(screen.getByText("Views")).toBeInTheDocument();
    expect(screen.getAllByText("1,234").length).toBeGreaterThanOrEqual(1);
  });
});
