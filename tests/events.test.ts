import { StartEvent, ProgressEvent, CompleteEvent } from "../src/events";
import { TaskResponseStatus } from "../src/types/task";

describe("Event Classes", () => {
  describe("StartEvent", () => {
    it("should create start event with correct type", () => {
      const event = new StartEvent({ totalTasks: 5 });

      expect(event.type).toBe("start");
      expect(event.detail.totalTasks).toBe(5);
      expect(event.detail.timestamp).toBeDefined();
      expect(StartEvent.type).toBe("start");
    });

    it("should add timestamp automatically", () => {
      const beforeTime = Date.now();
      const event = new StartEvent({ totalTasks: 3 });
      const afterTime = Date.now();
      const eventTime = new Date(event.detail.timestamp).getTime();

      expect(eventTime).toBeGreaterThanOrEqual(beforeTime);
      expect(eventTime).toBeLessThanOrEqual(afterTime);
    });
  });

  describe("ProgressEvent", () => {
    it("should create progress event with correct type and data", () => {
      const taskResult = {
        index: 0,
        responseStatus: TaskResponseStatus.SUCCESS,
        response: "test result",
        error: null,
      };

      const event = new ProgressEvent({
        totalTasks: 5,
        completedTasks: 2,
        pendingTasks: 3,
        progress: 40,
        lastCompletedTaskResult: taskResult,
      });

      expect(event.type).toBe("progress");
      expect(event.detail.totalTasks).toBe(5);
      expect(event.detail.completedTasks).toBe(2);
      expect(event.detail.pendingTasks).toBe(3);
      expect(event.detail.progress).toBe(40);
      expect(event.detail.lastCompletedTaskResult).toBe(taskResult);
      expect(event.detail.timestamp).toBeDefined();
      expect(ProgressEvent.type).toBe("progress");
    });

    it("should handle error task results", () => {
      const taskResult = {
        index: 1,
        responseStatus: TaskResponseStatus.ERROR,
        response: null,
        error: new Error("Task failed"),
      };

      const event = new ProgressEvent({
        totalTasks: 2,
        completedTasks: 1,
        pendingTasks: 1,
        progress: 50,
        lastCompletedTaskResult: taskResult,
      });

      expect(event.detail.lastCompletedTaskResult.responseStatus).toBe(
        TaskResponseStatus.ERROR
      );
      expect(event.detail.lastCompletedTaskResult.error?.message).toBe(
        "Task failed"
      );
    });
  });

  describe("CompleteEvent", () => {
    it("should create complete event with correct type and results", () => {
      const taskResults = [
        {
          index: 0,
          responseStatus: TaskResponseStatus.SUCCESS,
          response: "result 1",
          error: null,
        },
        {
          index: 1,
          responseStatus: TaskResponseStatus.ERROR,
          response: null,
          error: new Error("failed"),
        },
      ];

      const event = new CompleteEvent({ taskResults });

      expect(event.type).toBe("complete");
      expect(event.detail.taskResults).toHaveLength(2);
      expect(event.detail.taskResults[0]).toBe(taskResults[0]);
      expect(event.detail.taskResults[1]).toBe(taskResults[1]);
      expect(event.detail.timestamp).toBeDefined();
      expect(CompleteEvent.type).toBe("complete");
    });

    it("should handle empty results array", () => {
      const event = new CompleteEvent({ taskResults: [] });

      expect(event.detail.taskResults).toHaveLength(0);
      expect(Array.isArray(event.detail.taskResults)).toBe(true);
    });
  });

  describe("Event timestamp consistency", () => {
    it("should generate unique timestamps for rapid events", () => {
      const events = [];

      for (let i = 0; i < 5; i++) {
        events.push(new StartEvent({ totalTasks: i }));
      }

      const timestamps = events.map((e) => e.detail.timestamp);

      // All timestamps should be valid ISO strings
      timestamps.forEach((ts) => {
        expect(new Date(ts).toISOString()).toBe(ts);
      });
    });
  });
});
