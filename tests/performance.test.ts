import Batch from "../src/batch";
import { TaskResponseStatus } from "../src/types/task";

describe("Performance Tests", () => {
  describe("Large number of tasks", () => {
    it("should handle 1000 synchronous tasks efficiently", async () => {
      const batch = new Batch({ concurrency: 10 });
      const taskCount = 1000;

      const startTime = performance.now();

      // Add 1000 tasks
      for (let i = 0; i < taskCount; i++) {
        batch.add(() => `task-${i}`);
      }

      const results = await batch.process();
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(taskCount);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all tasks completed successfully
      results.forEach((result, index) => {
        expect(result.responseStatus).toBe(TaskResponseStatus.SUCCESS);
        expect(result.response).toBe(`task-${index}`);
        expect(result.index).toBe(index);
      });
    }, 10000); // 10 second timeout

    it("should handle 100 asynchronous tasks with proper concurrency", async () => {
      const batch = new Batch({ concurrency: 5 });
      const taskCount = 100;
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const startTime = performance.now();

      for (let i = 0; i < taskCount; i++) {
        batch.add(async () => {
          concurrentCount++;
          maxConcurrent = Math.max(maxConcurrent, concurrentCount);

          // Simulate some async work
          await new Promise((resolve) => setTimeout(resolve, 10));

          concurrentCount--;
          return `async-task-${i}`;
        });
      }

      const results = await batch.process();
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(taskCount);
      expect(maxConcurrent).toBeLessThanOrEqual(5); // Should respect concurrency limit
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify order is maintained
      results.forEach((result, index) => {
        expect(result.responseStatus).toBe(TaskResponseStatus.SUCCESS);
        expect(result.response).toBe(`async-task-${index}`);
        expect(result.index).toBe(index);
      });
    }, 15000); // 15 second timeout

    it("should maintain performance with multiple resets", async () => {
      const batch = new Batch({ concurrency: 5 });
      const iterations = 10;
      const tasksPerIteration = 50;

      const startTime = performance.now();

      for (let iteration = 0; iteration < iterations; iteration++) {
        // Add tasks
        for (let i = 0; i < tasksPerIteration; i++) {
          batch.add(() => `iteration-${iteration}-task-${i}`);
        }

        // Process tasks
        const results = await batch.process();
        expect(results).toHaveLength(tasksPerIteration);

        // Reset for next iteration
        batch.reset();
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    }, 10000);
  });

  describe("Memory usage", () => {
    it("should not leak memory with many small tasks", async () => {
      const batch = new Batch({ concurrency: 10 });
      const taskCount = 1000;

      // Add many small tasks
      for (let i = 0; i < taskCount; i++) {
        batch.add(() => Math.random());
      }

      const results = await batch.process();

      // Reset and verify cleanup
      batch.reset();

      expect(results).toHaveLength(taskCount);
      expect(batch.progress).toBe(0);
      expect(batch.isProcessing).toBe(false);
    });

    it("should handle tasks with large return values", async () => {
      const batch = new Batch({ concurrency: 2 });
      const largeObject = { data: new Array(10000).fill("test") };

      batch.add(() => ({ ...largeObject, id: 1 }));
      batch.add(() => ({ ...largeObject, id: 2 }));
      batch.add(() => ({ ...largeObject, id: 3 }));

      const results = await batch.process();

      expect(results).toHaveLength(3);
      expect((results[0].response as any).id).toBe(1);
      expect((results[1].response as any).id).toBe(2);
      expect((results[2].response as any).id).toBe(3);
      expect((results[0].response as any).data).toHaveLength(10000);
    });
  });

  describe("Event performance", () => {
    it("should emit events efficiently for many tasks", async () => {
      const batch = new Batch({ concurrency: 5 });
      const taskCount = 200;

      let startEventCount = 0;
      let progressEventCount = 0;
      let completeEventCount = 0;

      batch.addEventListener("start", () => startEventCount++);
      batch.addEventListener("progress", () => progressEventCount++);
      batch.addEventListener("complete", () => completeEventCount++);

      for (let i = 0; i < taskCount; i++) {
        batch.add(() => `task-${i}`);
      }

      const startTime = performance.now();
      await batch.process();
      const endTime = performance.now();

      expect(startEventCount).toBe(1);
      expect(progressEventCount).toBe(taskCount);
      expect(completeEventCount).toBe(1);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
    }, 5000);
  });

  describe("Concurrency stress test", () => {
    it("should handle high concurrency correctly", async () => {
      const batch = new Batch({ concurrency: 50 });
      const taskCount = 200;
      let activeTasks = 0;
      let maxActive = 0;

      for (let i = 0; i < taskCount; i++) {
        batch.add(async () => {
          activeTasks++;
          maxActive = Math.max(maxActive, activeTasks);

          await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 100)
          );

          activeTasks--;
          return `task-${i}`;
        });
      }

      const results = await batch.process();

      expect(results).toHaveLength(taskCount);
      expect(maxActive).toBeLessThanOrEqual(50);

      // Verify all tasks completed and order is maintained
      results.forEach((result, index) => {
        expect(result.responseStatus).toBe(TaskResponseStatus.SUCCESS);
        expect(result.response).toBe(`task-${index}`);
        expect(result.index).toBe(index);
      });
    }, 10000);
  });
});
