import { TaskResponseStatus } from "../src/types/task";
import type { Task, TaskResult } from "../src/types/task";
import type { BatchConfig } from "../src/types/config";

describe("Types", () => {
  describe("TaskResponseStatus", () => {
    it("should have correct enum values", () => {
      expect(TaskResponseStatus.SUCCESS).toBe("success");
      expect(TaskResponseStatus.ERROR).toBe("error");
    });

    it("should be usable in switch statements", () => {
      const testStatus = (status: TaskResponseStatus): string => {
        switch (status) {
          case TaskResponseStatus.SUCCESS:
            return "Task succeeded";
          case TaskResponseStatus.ERROR:
            return "Task failed";
          default:
            return "Unknown status";
        }
      };

      expect(testStatus(TaskResponseStatus.SUCCESS)).toBe("Task succeeded");
      expect(testStatus(TaskResponseStatus.ERROR)).toBe("Task failed");
    });
  });

  describe("Task type", () => {
    it("should accept synchronous functions", () => {
      const syncTask: Task = () => "sync result";
      expect(typeof syncTask).toBe("function");
    });

    it("should accept asynchronous functions", () => {
      const asyncTask: Task = async () => "async result";
      expect(typeof asyncTask).toBe("function");
    });

    it("should accept functions returning promises", () => {
      const promiseTask: Task = () => Promise.resolve("promise result");
      expect(typeof promiseTask).toBe("function");
    });

    it("should accept functions returning any type", () => {
      const stringTask: Task = () => "string";
      const numberTask: Task = () => 42;
      const objectTask: Task = () => ({ key: "value" });
      const nullTask: Task = () => null;
      const undefinedTask: Task = () => undefined;

      expect(typeof stringTask).toBe("function");
      expect(typeof numberTask).toBe("function");
      expect(typeof objectTask).toBe("function");
      expect(typeof nullTask).toBe("function");
      expect(typeof undefinedTask).toBe("function");
    });
  });

  describe("TaskResult type", () => {
    it("should create valid success result", () => {
      const result: TaskResult = {
        index: 0,
        responseStatus: TaskResponseStatus.SUCCESS,
        response: "test result",
        error: null,
      };

      expect(result.index).toBe(0);
      expect(result.responseStatus).toBe(TaskResponseStatus.SUCCESS);
      expect(result.response).toBe("test result");
      expect(result.error).toBeNull();
    });

    it("should create valid error result", () => {
      const error = new Error("Task failed");
      const result: TaskResult = {
        index: 1,
        responseStatus: TaskResponseStatus.ERROR,
        response: null,
        error: error,
      };

      expect(result.index).toBe(1);
      expect(result.responseStatus).toBe(TaskResponseStatus.ERROR);
      expect(result.response).toBeNull();
      expect(result.error).toBe(error);
    });

    it("should allow various response types", () => {
      const results: TaskResult[] = [
        {
          index: 0,
          responseStatus: TaskResponseStatus.SUCCESS,
          response: "string",
          error: null,
        },
        {
          index: 1,
          responseStatus: TaskResponseStatus.SUCCESS,
          response: 42,
          error: null,
        },
        {
          index: 2,
          responseStatus: TaskResponseStatus.SUCCESS,
          response: { key: "value" },
          error: null,
        },
        {
          index: 3,
          responseStatus: TaskResponseStatus.SUCCESS,
          response: [1, 2, 3],
          error: null,
        },
      ];

      expect(results).toHaveLength(4);
      results.forEach((result, index) => {
        expect(result.index).toBe(index);
        expect(result.responseStatus).toBe(TaskResponseStatus.SUCCESS);
      });
    });
  });

  describe("BatchConfig type", () => {
    it("should accept valid configurations", () => {
      const config1: BatchConfig = {
        concurrency: 5,
      };

      const config2: BatchConfig = {
        concurrency: 1,
      };

      const config3: BatchConfig = {
        concurrency: 100,
      };

      expect(config1.concurrency).toBe(5);
      expect(config2.concurrency).toBe(1);
      expect(config3.concurrency).toBe(100);
    });

    it("should be usable as partial config", () => {
      const partialConfig: Partial<BatchConfig> = {};
      const partialWithConcurrency: Partial<BatchConfig> = { concurrency: 3 };

      expect(partialConfig).toEqual({});
      expect(partialWithConcurrency.concurrency).toBe(3);
    });
  });
});
