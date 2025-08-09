import { TaskResult } from "./task";
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
    lastCompletedTaskResult: Readonly<TaskResult>;
};
export type CompleteEventDetail = {
    taskResults: readonly Readonly<TaskResult>[];
    timestamp: string;
};
