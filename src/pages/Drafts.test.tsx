import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock Firebase

// Mock Firebase Firestore

// Mock auth context
vi.mock("@/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "test-user-123", uid: "test-user-123" },
    profile: { username: "testuser", display_name: "Test User" },
  }),
}));

// Mock format
vi.mock("@/lib/format", () => ({
  timeAgo: () => "2h",
}));

import Drafts from "./Drafts";

function renderDrafts() {
  return render(
    <MemoryRouter>
      <Drafts />
    </MemoryRouter>
  );
}

describe("Drafts Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the two tabs: Drafts and Scheduled", () => {
    renderDrafts();

    expect(screen.getByText("Drafts")).toBeInTheDocument();
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
  });

  it("renders the page header", () => {
    renderDrafts();

    expect(screen.getByText(/Drafts & scheduled/i)).toBeInTheDocument();
  });

  it("shows empty state for drafts tab", async () => {
    renderDrafts();

    const emptyMsg = await screen.findByText("No drafts saved.");
    expect(emptyMsg).toBeInTheDocument();
  });

  it("renders a link to create a new post", async () => {
    renderDrafts();

    const link = await screen.findByText("New post");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/compose");
  });
});
