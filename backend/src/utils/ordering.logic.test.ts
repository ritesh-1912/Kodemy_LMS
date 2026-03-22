import { describe, it, expect } from "vitest";
import {
  getPrerequisiteVideoId,
  getPrevNextVideoIds,
  isVideoUnlocked,
  getCompletedVideoIds,
} from "./ordering.logic.js";
import type { FlatVideo } from "./ordering.logic.js";

const seq: FlatVideo[] = [
  {
    id: "a",
    title: "A",
    sectionId: "s",
    orderIndex: 0,
    durationSeconds: null,
  },
  {
    id: "b",
    title: "B",
    sectionId: "s",
    orderIndex: 1,
    durationSeconds: null,
  },
  {
    id: "c",
    title: "C",
    sectionId: "s",
    orderIndex: 2,
    durationSeconds: null,
  },
];

describe("ordering.logic", () => {
  it("getPrerequisiteVideoId returns null for first or missing", () => {
    expect(getPrerequisiteVideoId("a", seq)).toBeNull();
    expect(getPrerequisiteVideoId("missing", seq)).toBeNull();
  });

  it("getPrerequisiteVideoId returns previous id", () => {
    expect(getPrerequisiteVideoId("b", seq)).toBe("a");
    expect(getPrerequisiteVideoId("c", seq)).toBe("b");
  });

  it("getPrevNextVideoIds", () => {
    expect(getPrevNextVideoIds("a", seq)).toEqual({
      previousVideoId: null,
      nextVideoId: "b",
    });
    expect(getPrevNextVideoIds("b", seq)).toEqual({
      previousVideoId: "a",
      nextVideoId: "c",
    });
    expect(getPrevNextVideoIds("c", seq)).toEqual({
      previousVideoId: "b",
      nextVideoId: null,
    });
  });

  it("isVideoUnlocked: first video always unlocked", () => {
    expect(isVideoUnlocked("a", seq, new Set())).toBe(true);
  });

  it("isVideoUnlocked: second needs first completed", () => {
    expect(isVideoUnlocked("b", seq, new Set())).toBe(false);
    expect(isVideoUnlocked("b", seq, new Set(["a"]))).toBe(true);
  });

  it("getCompletedVideoIds filters completed", () => {
    const ids = getCompletedVideoIds([
      { videoId: "a", isCompleted: true, completedAt: new Date() },
      { videoId: "b", isCompleted: false, completedAt: null },
      { videoId: "c", isCompleted: false, completedAt: new Date() },
    ]);
    expect([...ids].sort()).toEqual(["a", "c"]);
  });
});
