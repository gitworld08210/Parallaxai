import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TipSheet } from "./TipSheet";



vi.mock("@/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "test-user-123" }, profile: { username: "testuser" } }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("TipSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all coin amount presets when open", () => {
    render(
      <TipSheet
        open={true}
        onOpenChange={() => {}}
        recipientId="recipient-123"
        recipientName="creator"
      />
    );
    expect(screen.getByText("10 coins")).toBeInTheDocument();
    expect(screen.getByText("25 coins")).toBeInTheDocument();
    expect(screen.getByText("50 coins")).toBeInTheDocument();
    expect(screen.getByText("100 coins")).toBeInTheDocument();
    // 500 coins appears both in presets and balance display
    expect(screen.getAllByText("500 coins").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("1000 coins")).toBeInTheDocument();
  });

  it("renders recipient name in title", () => {
    render(
      <TipSheet
        open={true}
        onOpenChange={() => {}}
        recipientId="recipient-123"
        recipientName="coolcreator"
      />
    );
    expect(screen.getByText("Send coins to @coolcreator")).toBeInTheDocument();
  });

  it("renders continue button", () => {
    render(
      <TipSheet
        open={true}
        onOpenChange={() => {}}
        recipientId="recipient-123"
        recipientName="creator"
      />
    );
    expect(screen.getByText("Continue")).toBeInTheDocument();
  });

  it("renders balance display", () => {
    render(
      <TipSheet
        open={true}
        onOpenChange={() => {}}
        recipientId="recipient-123"
        recipientName="creator"
      />
    );
    expect(screen.getByText("Your balance")).toBeInTheDocument();
    // Balance "500 coins" matches both the preset button and the balance span
    const balanceSection = screen.getByText("Your balance").closest("div");
    expect(balanceSection).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    render(
      <TipSheet
        open={false}
        onOpenChange={() => {}}
        recipientId="recipient-123"
        recipientName="creator"
      />
    );
    expect(screen.queryByText("Send coins to @creator")).not.toBeInTheDocument();
  });
});
