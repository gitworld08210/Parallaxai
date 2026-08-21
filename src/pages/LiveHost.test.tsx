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

// Mock livekit-client
vi.mock("livekit-client", () => ({
  createLocalTracks: vi.fn(),
  Track: { Kind: { Video: "video", Audio: "audio" } },
  LocalVideoTrack: class {},
  LocalAudioTrack: class {},
}));

import LiveHost from "./LiveHost";

function renderLiveHost() {
  return render(
    <MemoryRouter>
      <LiveHost />
    </MemoryRouter>
  );
}

describe("LiveHost Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the go-live form with title input", () => {
    renderLiveHost();

    expect(screen.getByText("Go Live")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("What's this live about?")).toBeInTheDocument();
  });

  it("renders access type buttons", () => {
    renderLiveHost();

    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Paid entry")).toBeInTheDocument();
    expect(screen.getByText("Subscribers only")).toBeInTheDocument();
  });

  it("renders start broadcast button", () => {
    renderLiveHost();

    expect(screen.getByText("Start broadcast")).toBeInTheDocument();
  });

  it("renders allow gifts toggle", () => {
    renderLiveHost();

    expect(screen.getByText("Allow gifts")).toBeInTheDocument();
  });
});
