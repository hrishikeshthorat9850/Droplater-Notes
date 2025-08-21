import { describe, it, expect } from "vitest";
import { NoteZod } from "../validation/zodValidation.js";

describe("NoteZod validator", () => {
  it("should throw if webhookUrl is not a valid URL", () => {
    expect(() =>
      NoteZod.parse({
        title: "Test",
        body: "Test body",
        webhookUrl: "not-a-url",
        releaseAt: new Date().toISOString(),
      })
    ).toThrow();
  });

  it("should parse a valid payload successfully", () => {
    const result = NoteZod.parse({
      title: "Valid",
      body: "Valid body",
      webhookUrl: "http://localhost:4000/sink",
      releaseAt: new Date().toISOString(),
    });
    expect(result.title).toBe("Valid");
  });
});
