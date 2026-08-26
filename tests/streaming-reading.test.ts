import { describe, expect, it } from "vitest";
import { getInitialReadingState, shouldStartReadingStream } from "@/components/suriya/streaming-reading";

describe("streaming reading state", () => {
  it("preserves a persisted failure instead of starting a new stream automatically", () => {
    expect(getInitialReadingState("failed", null)).toEqual({ text: "", status: "failed" });
  });

  it("shows persisted response text as complete", () => {
    expect(getInitialReadingState("complete", "Stored answer")).toEqual({ text: "Stored answer", status: "complete" });
  });

  it("starts a failed reading stream only after an explicit retry", () => {
    expect(shouldStartReadingStream("failed", null, 0)).toBe(false);
    expect(shouldStartReadingStream("failed", null, 1)).toBe(true);
  });
});
