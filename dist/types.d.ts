export type BatchConfig = {
    concurrency: number;
};
export type Task = () => Promise<unknown> | unknown;
export declare enum TaskResponseStatus {
    Success = "success",
    Error = "error",
    Timeout = "timeout"
}
export declare const TASK_TIMEOUT_ERROR: Error;
export declare const ADD_TASK_ERROR: Error;
export declare const NO_TASKS_ERROR: Error;
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
    timestamp: string;
};
export type ProgressEventDetail = ProgressStats & {
    timestamp: string;
    taskResult: Readonly<TaskResult>;
};
export type CompleteEventDetail = {
    taskResults: readonly Readonly<TaskResult>[];
    timestamp: string;
};
