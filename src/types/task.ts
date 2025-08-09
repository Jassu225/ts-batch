export type Task = () => Promise<unknown> | unknown;

export enum TaskResponseStatus {
  Success = "success",
  Error = "error",
  Timeout = "timeout",
}

export type TaskResult = {
  index: number;
  responseStatus: TaskResponseStatus;
  response: unknown | null;
  error: Error | null;
};
