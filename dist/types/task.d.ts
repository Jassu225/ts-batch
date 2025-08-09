export type Task = () => Promise<unknown> | unknown;
export declare enum TaskResponseStatus {
    SUCCESS = "success",
    ERROR = "error",
    TIMEOUT = "timeout"
}
export type TaskResult = {
    index: number;
    responseStatus: TaskResponseStatus;
    response: unknown | null;
    error: Error | null;
};
