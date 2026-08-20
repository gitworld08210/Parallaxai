import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VoiceBubble } from "./VoiceMessage";

// Mock HTMLAudioElement
beforeEach(() => {
  const mockPlay = vi.fn().mockResolvedValue(undefined);
  const mockPause = vi.fn();

  vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(mockPlay);
  vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(mockPause);
});

describe("VoiceBubble", () => {
  it("renders play button and time display", () => {
    render(<VoiceBubble url="https://example.com/audio.webm" mine={false} />);
    expect(screen.getByLabelText("Play")).toBeInTheDocument();
    expect(screen.getByText("0:00")).toBeInTheDocument();
  });

  it("toggles to pause button when play is clicked", async () => {
    render(<VoiceBubble url="https://example.com/audio.webm" mine={true} />);
    const playBtn = screen.getByLabelText("Play");
    fireEvent.click(playBtn);
    expect(screen.getByLabelText("Pause")).toBeInTheDocument();
  });

  it("toggles back to play button when pause is clicked", () => {
    render(<VoiceBubble url="https://example.com/audio.webm" mine={false} />);
    const playBtn = screen.getByLabelText("Play");
    fireEvent.click(playBtn);
    const pauseBtn = screen.getByLabelText("Pause");
    fireEvent.click(pauseBtn);
    expect(screen.getByLabelText("Play")).toBeInTheDocument();
  });

  it("renders waveform bars", () => {
    const { container } = render(<VoiceBubble url="https://example.com/audio.webm" mine={false} />);
    const bars = container.querySelectorAll("span.rounded-full");
    expect(bars.length).toBe(26);
  });

  it("renders an audio element with the provided url", () => {
    const { container } = render(<VoiceBubble url="https://example.com/test.webm" mine={true} />);
    const audio = container.querySelector("audio");
    expect(audio).toBeInTheDocument();
    expect(audio?.src).toBe("https://example.com/test.webm");
  });
});
