import { validateConcurrency } from "../src/utils";

describe("Utils", () => {
  describe("validateConcurrency", () => {
    it("should not throw for valid concurrency values", () => {
      expect(() => validateConcurrency(1)).not.toThrow();
      expect(() => validateConcurrency(5)).not.toThrow();
      expect(() => validateConcurrency(100)).not.toThrow();
      expect(() => validateConcurrency(10.5)).not.toThrow(); // Decimal should work
    });

    it("should throw for invalid concurrency values", () => {
      expect(() => validateConcurrency(0)).toThrow(
        "Concurrency must be greater than 0"
      );
      expect(() => validateConcurrency(-1)).toThrow(
        "Concurrency must be greater than 0"
      );
      expect(() => validateConcurrency(-10)).toThrow(
        "Concurrency must be greater than 0"
      );
    });

    it("should throw for falsy values", () => {
      expect(() => validateConcurrency(null as any)).toThrow(
        "Concurrency must be greater than 0"
      );
      expect(() => validateConcurrency(undefined as any)).toThrow(
        "Concurrency must be greater than 0"
      );
      expect(() => validateConcurrency(false as any)).toThrow(
        "Concurrency must be greater than 0"
      );
      expect(() => validateConcurrency("" as any)).toThrow(
        "Concurrency must be greater than 0"
      );
    });

    it("should handle edge cases", () => {
      expect(() => validateConcurrency(Number.MIN_VALUE)).not.toThrow();
      expect(() => validateConcurrency(0.1)).not.toThrow();
      expect(() => validateConcurrency(Number.MAX_SAFE_INTEGER)).not.toThrow();
    });
  });
});
