import { describe, expect, it } from "vitest";
import { failedReadingState, getInitialReadingState, interpretationModeFromHeader, readingPreview, readingStatusAnnouncement, retryDelayFor, shouldCollapseReading, shouldStartReadingStream } from "@/components/suriya/streaming-reading";

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

  it("polls an in-progress response a bounded number of times", () => {
    expect(retryDelayFor(202, 0)).toBe(3000);
    expect(retryDelayFor(202, 5)).toBeNull();
    expect(retryDelayFor(409, 0)).toBe(3000);
    expect(retryDelayFor(409, 5)).toBeNull();
    expect(retryDelayFor(200, 0)).toBeNull();
    expect(retryDelayFor(500, 0)).toBeNull();
  });

  it("keeps a completed long interpretation compact until the reader expands it", () => {
    expect(shouldCollapseReading("က".repeat(501), "complete")).toBe(true);
    expect(shouldCollapseReading("က".repeat(500), "complete")).toBe(false);
    expect(shouldCollapseReading("က".repeat(501), "generating")).toBe(false);
    const full = `${"အကြောင်းအရာ ".repeat(60)}နိဂုံး`;
    const preview = readingPreview(full);
    expect(preview.length).toBeLessThan(full.length);
    expect(preview.endsWith("…")).toBe(true);
    expect(preview.length).toBeLessThanOrEqual(421);
  });

  it("clears partial text when a stream fails so it is never presented as complete", () => {
    expect(failedReadingState()).toEqual({ text: "", status: "failed" });
  });

  it("uses a valid server-reported interpretation mode", () => {
    expect(interpretationModeFromHeader("model", "deterministic")).toBe("model");
    expect(interpretationModeFromHeader("deterministic", "model")).toBe("deterministic");
    expect(interpretationModeFromHeader("unknown", "model")).toBe("model");
    expect(interpretationModeFromHeader(null, "deterministic")).toBe("deterministic");
  });

  it("announces stream phase changes without announcing every token", () => {
    expect(readingStatusAnnouncement("generating")).toContain("ရေးသား");
    expect(readingStatusAnnouncement("complete")).toContain("အဆင်သင့်");
    expect(readingStatusAnnouncement("failed")).toContain("ရပ်သွား");
  });
});
