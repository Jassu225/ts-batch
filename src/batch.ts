import { CompleteEvent, ProgressEvent, StartEvent } from "./events";
import { BatchConfig } from "./types/config";
import {
  CANNOT_ADD_TASK_DURING_PROCESSING_ERROR,
  CANNOT_RESET_DURING_PROCESSING_ERROR,
  NO_TASKS_ERROR,
  TASK_MUST_BE_FUNCTION_ERROR,
} from "./constants/errors";
import { Task, TaskResult, TaskResponseStatus } from "./types/task";
import { validateConcurrency } from "./utils";
import * as EventTypes from "./types/events";

type WrappedTask = {
  task: Task;
  index: number;
};

export const getDefaultQueue = (): WrappedTask[] => [];
export const getDefaultTotalTasks = (): number => 0;
export const getDefaultCompletedTasks = (): number => 0;
export const getDefaultProcessPromise = (): Promise<
  Readonly<TaskResult>[]
> | null => null;
export const getDefaultTaskResults = (): TaskResult[] => [];
export const getDefaultConcurrency = (): number =>
  typeof navigator !== "undefined" && navigator.hardwareConcurrency
    ? navigator.hardwareConcurrency
    : 10;

class Batch extends EventTarget {
  private config: BatchConfig;
  private queue: WrappedTask[] = getDefaultQueue();
  private totalTasks: number = getDefaultTotalTasks();
  private completedTasks: number = getDefaultCompletedTasks();
  private processPromise: Promise<Readonly<TaskResult>[]> | null =
    getDefaultProcessPromise();
  private taskResults: TaskResult[] = getDefaultTaskResults();

  constructor(config: Partial<BatchConfig> = {}) {
    super();
    const concurrency = config.concurrency ?? getDefaultConcurrency();

    validateConcurrency(concurrency);

    this.config = {
      concurrency,
      // timeout: config.timeout || Infinity,
      // taskTimeout: config.taskTimeout || Infinity,
      // taskInterval: config.taskInterval || 0,
    };
    this.setToDefault();
  }

  public add(task: Task): void {
    if (this.isProcessing) {
      throw CANNOT_ADD_TASK_DURING_PROCESSING_ERROR;
    }
    if (typeof task !== "function") {
      throw TASK_MUST_BE_FUNCTION_ERROR;
    }
    this.queue.push({ task, index: this.totalTasks });
    ++this.totalTasks;
  }

  public process(): Promise<Readonly<TaskResult>[]> {
    if (this.processPromise) {
      return this.processPromise;
    }
    if (this.totalTasks === 0) {
      return Promise.reject(NO_TASKS_ERROR);
    }

    this.taskResults = Array.from({ length: this.totalTasks });

    // Test: store promise without .then() chain to see if that's the issue
    this.processPromise = new Promise<Readonly<TaskResult>[]>(
      async (resolve) => {
        await this.startProcessing();
        const results = this.taskResults.map((t) => Object.freeze(t));
        // dispatch complete event
        this.dispatchEvent(new CompleteEvent({ taskResults: results }));
        resolve(results);
      }
    );

    return this.processPromise;
  }

  private async startProcessing(): Promise<void> {
    // dispatch start event
    this.dispatchEvent(new StartEvent({ totalTasks: this.totalTasks }));

    return new Promise((resolve) => {
      // Handle edge case of empty queue
      if (this.queue.length === 0) {
        resolve();
        return;
      }
      // Start initial batch of concurrent tasks
      const initialTasks = Math.min(this.config.concurrency, this.queue.length);
      for (let i = 0; i < initialTasks; i++) {
        const task = this.queue.shift();
        if (!task) continue;
        this.processTask(task).then((taskResult) => {
          this.onTaskEnd(task, taskResult, resolve);
        });
      }
    });
  }

  private onTaskEnd(
    task: WrappedTask,
    taskResult: TaskResult,
    resolve: () => void
  ) {
    // update completed tasks and store the result
    ++this.completedTasks;
    this.taskResults[task.index] = Object.freeze(taskResult);
    // dispatch progress event
    this.dispatchEvent(
      new ProgressEvent({
        totalTasks: this.totalTasks,
        completedTasks: this.completedTasks,
        pendingTasks: this.totalTasks - this.completedTasks,
        progress: this.progress,
        lastCompletedTaskResult: this.taskResults[task.index],
      })
    );

    // check for completion
    if (this.completedTasks === this.totalTasks) {
      resolve();
    }

    // get the next task from the queue
    const newTask = this.queue.shift();
    if (!newTask) {
      return;
    }
    this.processTask(newTask).then((taskResult) => {
      this.onTaskEnd(newTask, taskResult, resolve);
    });
  }

  private async processTask(task: WrappedTask): Promise<TaskResult> {
    let result: unknown = null;
    let taskError: Error | null = null;

    try {
      result = await task.task();
    } catch (caughtError) {
      taskError = caughtError as Error;
    }

    const taskResult: TaskResult = {
      responseStatus:
        taskError !== null
          ? TaskResponseStatus.ERROR
          : TaskResponseStatus.SUCCESS,
      response: result,
      error: taskError,
      index: task.index,
    };
    return taskResult;
  }

  private setToDefault() {
    this.queue = getDefaultQueue();
    this.totalTasks = getDefaultTotalTasks();
    this.completedTasks = getDefaultCompletedTasks();
    this.taskResults = getDefaultTaskResults();
    this.processPromise = getDefaultProcessPromise();
  }

  public reset(): void {
    if (this.isProcessing) {
      throw CANNOT_RESET_DURING_PROCESSING_ERROR;
    }
    this.setToDefault();
  }

  public addEventListener(
    type: (typeof EventTypes)[keyof typeof EventTypes],
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean
  ): void {
    super.addEventListener(type, callback, options);
  }

  public get isProcessing(): boolean {
    return (
      this.processPromise !== null && this.completedTasks < this.totalTasks
    );
  }

  public get progress(): number {
    return this.totalTasks === 0
      ? 0
      : Math.round((this.completedTasks * 10000) / this.totalTasks) / 100;
  }

  public get size(): number {
    return this.totalTasks;
  }

  public get concurrency(): number {
    return this.config.concurrency;
  }
}

export default Batch;
