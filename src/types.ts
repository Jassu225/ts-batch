export type BatchConfig = {
  concurrency: number;
  // timeout: number;
  // taskTimeout: number;
  // taskInterval: number;
};

export type Task = () => Promise<unknown> | unknown;

export enum TaskResponseStatus {
  Success = "success",
  Error = "error",
  Timeout = "timeout",
}

export const TASK_TIMEOUT_ERROR = new Error("Task timed out");
export const ADD_TASK_ERROR = new Error(
  "Cannot add new tasks during processing"
);
export const NO_TASKS_ERROR = new Error("No tasks to process");

export type TaskResult = {
  index: number;
  responseStatus: TaskResponseStatus;
  response: unknown | null;
  error: Error | null;
};

export type ProgressStats = {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  progress: number;
};

export type StartEventDetail = {
  totalTasks: ProgressStats["totalTasks"];
  timestamp: string; // ISO string
};

export type ProgressEventDetail = ProgressStats & {
  timestamp: string; // ISO string
  lastCompletedTaskResult: Readonly<TaskResult>;
};

export type CompleteEventDetail = {
  taskResults: readonly Readonly<TaskResult>[];
  timestamp: string; // ISO string
};
