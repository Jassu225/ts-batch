import Batch, { getDefaultConcurrency } from "@/batch";
import { TaskResponseStatus } from "@/types/task";
import { StartEvent, ProgressEvent, CompleteEvent } from "@/events";
import {
  CANNOT_ADD_TASK_DURING_PROCESSING_ERROR,
  CANNOT_RESET_DURING_PROCESSING_ERROR,
  NO_TASKS_ERROR,
  TASK_MUST_BE_FUNCTION_ERROR,
} from "@/constants/errors";

describe("Batch", () => {
  let batch: Batch;

  beforeEach(() => {
    batch = new Batch();
  });

  describe("constructor", () => {
    it("should create batch with default concurrency", () => {
      const batch = new Batch();
      expect(batch).toBeInstanceOf(Batch);
      expect(batch.isProcessing).toBe(false);
      expect(batch.progress).toBe(0);
      expect(batch.concurrency).toBe(getDefaultConcurrency());
    });

    it("should create batch with custom concurrency", () => {
      const batch = new Batch({ concurrency: 5 });
      expect(batch).toBeInstanceOf(Batch);
      expect(batch.concurrency).toBe(5);
    });

    it("should use navigator.hardwareConcurrency if available", () => {
      // Mock navigator.hardwareConcurrency
      const originalNavigator = global.navigator;
      global.navigator = { hardwareConcurrency: 8 } as any;

      const batch = new Batch();
      expect(batch).toBeInstanceOf(Batch);
      expect(batch.concurrency).toBe(8);

      // Restore original navigator
      global.navigator = originalNavigator;
    });

    it("should throw error for invalid concurrency", () => {
      expect(() => new Batch({ concurrency: 0 })).toThrow();
      expect(() => new Batch({ concurrency: -1 })).toThrow();
    });
  });

  describe("add method", () => {
    it("should add synchronous tasks", () => {
      expect(() => batch.add(() => "sync task")).not.toThrow();
    });

    it("should add asynchronous tasks", () => {
      expect(() => batch.add(async () => "async task")).not.toThrow();
    });

    it("should add multiple tasks", () => {
      expect(() => {
        batch.add(() => "task 1");
        batch.add(() => "task 2");
        batch.add(() => "task 3");
      }).not.toThrow();
    });

    it("should throw error when adding non-function", () => {
      expect(() => batch.add("not a function" as any)).toThrow(
        TASK_MUST_BE_FUNCTION_ERROR
      );
      expect(() => batch.add(123 as any)).toThrow(TASK_MUST_BE_FUNCTION_ERROR);
      expect(() => batch.add(null as any)).toThrow(TASK_MUST_BE_FUNCTION_ERROR);
    });

    it("should throw error when adding task during processing", async () => {
      batch.add(() => new Promise((resolve) => setTimeout(resolve, 100)));

      const processPromise = batch.process();

      expect(() => batch.add(() => "new task")).toThrow(
        CANNOT_ADD_TASK_DURING_PROCESSING_ERROR
      );

      await processPromise;
    });
  });

  describe("process method", () => {
    it("should throw error when no tasks added", async () => {
      await expect(batch.process()).rejects.toThrow(NO_TASKS_ERROR);
    });

    it("should process single synchronous task", async () => {
      batch.add(() => "test result");

      const results = await batch.process();

      expect(results).toHaveLength(1);
      expect(results[0].responseStatus).toBe(TaskResponseStatus.SUCCESS);
      expect(results[0].response).toBe("test result");
      expect(results[0].error).toBeNull();
      expect(results[0].index).toBe(0);
    });

    it("should process single asynchronous task", async () => {
      batch.add(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return "async result";
      });

      const results = await batch.process();

      expect(results).toHaveLength(1);
      expect(results[0].responseStatus).toBe(TaskResponseStatus.SUCCESS);
      expect(results[0].response).toBe("async result");
    });

    it("should process multiple tasks in order", async () => {
      batch.add(() => "task 1");
      batch.add(() => "task 2");
      batch.add(() => "task 3");

      const results = await batch.process();

      expect(results).toHaveLength(3);
      expect(results[0].response).toBe("task 1");
      expect(results[1].response).toBe("task 2");
      expect(results[2].response).toBe("task 3");

      // Check order is maintained
      expect(results[0].index).toBe(0);
      expect(results[1].index).toBe(1);
      expect(results[2].index).toBe(2);
    });

    it("should handle task errors gracefully", async () => {
      batch.add(() => "success");
      batch.add(() => {
        throw new Error("task error");
      });
      batch.add(() => "another success");

      const results = await batch.process();

      expect(results).toHaveLength(3);
      expect(results[0].responseStatus).toBe(TaskResponseStatus.SUCCESS);
      expect(results[1].responseStatus).toBe(TaskResponseStatus.ERROR);
      expect(results[2].responseStatus).toBe(TaskResponseStatus.SUCCESS);

      expect(results[1].error?.message).toBe("task error");
    });

    it("should return same promise when called multiple times", async () => {
      batch.add(() => "test");
      const promise1 = batch.process();
      const promise2 = batch.process();

      expect(promise1).toBe(promise2);

      const results = await promise1;
      expect(results).toHaveLength(1);
    });

    it("should respect concurrency limit", async () => {
      const batch = new Batch({ concurrency: 2 });
      let concurrentTasks = 0;
      let maxConcurrent = 0;

      for (let i = 0; i < 5; i++) {
        batch.add(async () => {
          concurrentTasks++;
          maxConcurrent = Math.max(maxConcurrent, concurrentTasks);
          await new Promise((resolve) => setTimeout(resolve, 50));
          concurrentTasks--;
          return `task ${i}`;
        });
      }

      await batch.process();
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });

  describe("event system", () => {
    it("should emit start event", async () => {
      const startHandler = jest.fn();
      batch.addEventListener(StartEvent.type, startHandler);

      batch.add(() => "test");
      await batch.process();

      expect(startHandler).toHaveBeenCalledTimes(1);
      expect(startHandler.mock.calls[0][0].detail.totalTasks).toBe(1);
      expect(startHandler.mock.calls[0][0].detail.timestamp).toBeDefined();
    });

    it("should emit progress events", async () => {
      const progressHandler = jest.fn();
      batch.addEventListener(ProgressEvent.type, progressHandler);

      batch.add(() => "task 1");
      batch.add(() => "task 2");

      await batch.process();

      expect(progressHandler).toHaveBeenCalledTimes(2);

      // First progress event
      const firstCall = progressHandler.mock.calls[0][0].detail;
      expect(firstCall.totalTasks).toBe(2);
      expect(firstCall.completedTasks).toBe(1);
      expect(firstCall.pendingTasks).toBe(1);
      expect(firstCall.progress).toBe(50);
      expect(firstCall.lastCompletedTaskResult).toBeDefined();

      // Second progress event
      const secondCall = progressHandler.mock.calls[1][0].detail;
      expect(secondCall.completedTasks).toBe(2);
      expect(secondCall.progress).toBe(100);
    });

    it("should emit complete event", async () => {
      const completeHandler = jest.fn();
      batch.addEventListener(CompleteEvent.type, completeHandler);

      batch.add(() => "test");
      await batch.process();

      expect(completeHandler).toHaveBeenCalledTimes(1);
      expect(completeHandler.mock.calls[0][0].detail.taskResults).toHaveLength(
        1
      );
      expect(completeHandler.mock.calls[0][0].detail.timestamp).toBeDefined();
    });

    it("should support string event types", async () => {
      const startHandler = jest.fn();
      const progressHandler = jest.fn();
      const completeHandler = jest.fn();
      batch.addEventListener("start", startHandler);
      batch.addEventListener("progress", progressHandler);
      batch.addEventListener("complete", completeHandler);

      batch.add(() => "test");
      await batch.process();

      expect(startHandler).toHaveBeenCalledTimes(1);
      expect(progressHandler).toHaveBeenCalledTimes(1);
      expect(completeHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("properties", () => {
    it("should track processing state", async () => {
      expect(batch.isProcessing).toBe(false);

      batch.add(() => new Promise((resolve) => setTimeout(resolve, 50)));

      // Start processing
      const promise = batch.process();

      // Should be processing immediately
      expect(batch.isProcessing).toBe(true);

      // Wait for completion
      await promise;

      // Should not be processing after completion
      expect(batch.isProcessing).toBe(false);
    });

    it("should calculate progress correctly", async () => {
      expect(batch.progress).toBe(0);

      batch.add(() => "task 1");
      batch.add(() => "task 2");

      // Progress should still be 0 before processing
      expect(batch.progress).toBe(0);

      await batch.process();

      // Should be 100% after completion
      expect(batch.progress).toBe(100);
    });
  });

  describe("reset method", () => {
    it("should reset batch to initial state", async () => {
      batch.add(() => "test");
      await batch.process();

      expect(batch.progress).toBe(100);

      batch.reset();

      expect(batch.progress).toBe(0);
      expect(batch.isProcessing).toBe(false);
    });

    it("should throw error when resetting during processing", async () => {
      batch.add(() => new Promise((resolve) => setTimeout(resolve, 100)));

      const promise = batch.process();

      expect(() => batch.reset()).toThrow(CANNOT_RESET_DURING_PROCESSING_ERROR);

      await promise;
    });

    it("should allow adding new tasks after reset", async () => {
      batch.add(() => "first batch");
      await batch.process();

      batch.reset();

      batch.add(() => "second batch");
      const results = await batch.process();

      expect(results).toHaveLength(1);
      expect(results[0].response).toBe("second batch");
    });
  });

  describe("edge cases", () => {
    it("should handle empty task results", async () => {
      batch.add(() => undefined);
      batch.add(() => null);
      batch.add(() => "");

      const results = await batch.process();

      expect(results).toHaveLength(3);
      expect(results[0].response).toBeUndefined();
      expect(results[1].response).toBeNull();
      expect(results[2].response).toBe("");

      results.forEach((result) => {
        expect(result.responseStatus).toBe(TaskResponseStatus.SUCCESS);
      });
    });

    it("should handle tasks that return promises", async () => {
      batch.add(() => Promise.resolve("promise result"));

      const results = await batch.process();

      expect(results[0].response).toBe("promise result");
    });

    it("should handle tasks with different execution times", async () => {
      batch.add(
        () => new Promise((resolve) => setTimeout(() => resolve("slow"), 100))
      );
      batch.add(() => "fast");
      batch.add(
        () => new Promise((resolve) => setTimeout(() => resolve("medium"), 50))
      );

      const results = await batch.process();

      // Results should be in order regardless of completion time
      expect(results[0].response).toBe("slow");
      expect(results[1].response).toBe("fast");
      expect(results[2].response).toBe("medium");
    });

    it("should handle concurrent processing with correct order", async () => {
      const batch = new Batch({ concurrency: 3 });
      const delays = [100, 50, 25, 75, 10];

      delays.forEach((delay, index) => {
        batch.add(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve(`task-${index}`), delay)
            )
        );
      });

      const results = await batch.process();

      // Results should maintain original order
      expect(results.map((r) => r.response)).toEqual([
        "task-0",
        "task-1",
        "task-2",
        "task-3",
        "task-4",
      ]);
    });
  });
});
