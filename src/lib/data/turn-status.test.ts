import { describe, expect, test } from "vitest";
import { effectiveStatus } from "./turn-status";

describe("effectiveStatus", () => {
  const now = new Date("2026-10-18T12:00:00Z");
  test("pending há mais de 5 minutos aparece como erro (com Tentar de novo)", () => {
    expect(effectiveStatus("pending", "2026-10-18T11:50:00Z", now)).toBe("error");
  });
  test("pending recente continua pending", () => {
    expect(effectiveStatus("pending", "2026-10-18T11:59:00Z", now)).toBe("pending");
  });
  test("done continua done", () => {
    expect(effectiveStatus("done", "2026-10-18T11:00:00Z", now)).toBe("done");
  });
});
