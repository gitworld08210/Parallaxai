import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BuyCoinsSheet } from "./BuyCoinsSheet";



vi.mock("@/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "test-user-123" }, profile: null }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("BuyCoinsSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all coin packs when open", () => {
    render(<BuyCoinsSheet open={true} onOpenChange={() => {}} />);
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.getByText("5,000")).toBeInTheDocument();
  });

  it("renders pack prices", () => {
    render(<BuyCoinsSheet open={true} onOpenChange={() => {}} />);
    expect(screen.getByText("₹49")).toBeInTheDocument();
    expect(screen.getByText("₹199")).toBeInTheDocument();
    expect(screen.getByText("₹499")).toBeInTheDocument();
    expect(screen.getByText("₹1499")).toBeInTheDocument();
  });

  it("renders badges on packs", () => {
    render(<BuyCoinsSheet open={true} onOpenChange={() => {}} />);
    expect(screen.getByText("Popular")).toBeInTheDocument();
    expect(screen.getByText("Best value")).toBeInTheDocument();
  });

  it("highlights selected pack on click", () => {
    render(<BuyCoinsSheet open={true} onOpenChange={() => {}} />);
    const firstPack = screen.getByText("100").closest("button");
    expect(firstPack).toBeInTheDocument();
    if (firstPack) {
      fireEvent.click(firstPack);
      expect(firstPack.className).toContain("border-primary");
    }
  });

  it("shows continue button with selected pack price", () => {
    render(<BuyCoinsSheet open={true} onOpenChange={() => {}} />);
    // Default selected pack is PACKS[1] which is 500 coins / ₹199
    expect(screen.getByText("Continue · ₹199")).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    render(<BuyCoinsSheet open={false} onOpenChange={() => {}} />);
    expect(screen.queryByText("Buy Aurelix Coins")).not.toBeInTheDocument();
  });
});
