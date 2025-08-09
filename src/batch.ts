import { CompleteEvent, ProgressEvent, StartEvent } from "./events";
import {
  ADD_TASK_ERROR,
  BatchConfig,
  NO_TASKS_ERROR,
  Task,
  // TASK_TIMEOUT_ERROR,
  TaskResponseStatus,
  TaskResult,
} from "./types";
import { validateConcurrency } from "./utils";

type WrappedTask = {
  task: Task;
  index: number;
};

const getDefaultQueue = (): WrappedTask[] => [];
const getDefaultTotalTasks = (): number => 0;
const getDefaultCompletedTasks = (): number => 0;
const getDefaultProcessPromise = (): Promise<Readonly<TaskResult>[]> | null =>
  null;
const getDefaultTaskResults = (): TaskResult[] => [];

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
    const concurrency =
      config.concurrency ||
      (typeof navigator !== "undefined" && navigator.hardwareConcurrency) ||
      10;

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
    if (this.processPromise) {
      throw ADD_TASK_ERROR;
    }
    if (typeof task !== "function") {
      throw new Error("Task must be a function");
    }
    this.queue.push({ task, index: this.totalTasks });
    ++this.totalTasks;
  }

  public async process(): Promise<Readonly<TaskResult>[]> {
    if (this.processPromise) {
      return this.processPromise;
    }
    if (this.totalTasks === 0) {
      throw NO_TASKS_ERROR;
    }

    this.taskResults = Array.from({ length: this.totalTasks });
    this.processPromise = new Promise<Readonly<TaskResult>[]>(
      async (resolve) => {
        await this.startProcessing();
        resolve(this.taskResults.map((t) => Object.freeze(t)));
      }
    ).then((taskResults) => {
      // dispatch complete event
      this.dispatchEvent(new CompleteEvent({ taskResults }));
      return taskResults;
    });
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
        progress: this.completedTasks / this.totalTasks,
        taskResult: this.taskResults[task.index],
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
          ? TaskResponseStatus.Error
          : TaskResponseStatus.Success,
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
    if (this.processPromise) {
      throw new Error("Cannot reset while processing is in progress");
    }
    this.setToDefault();
  }

  public get isProcessing(): boolean {
    return this.processPromise !== null;
  }

  public get progress(): number {
    return this.totalTasks === 0 ? 0 : this.completedTasks / this.totalTasks;
  }
}

export default Batch;
