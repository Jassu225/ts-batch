import { BatchConfig } from "./types/config";
import { Task, TaskResult } from "./types/task";
import * as EventTypes from "./types/events";
type WrappedTask = {
    task: Task;
    index: number;
};
export declare const getDefaultQueue: () => WrappedTask[];
export declare const getDefaultTotalTasks: () => number;
export declare const getDefaultCompletedTasks: () => number;
export declare const getDefaultProcessPromise: () => Promise<Readonly<TaskResult>[]> | null;
export declare const getDefaultTaskResults: () => TaskResult[];
export declare const getDefaultConcurrency: () => number;
declare class Batch extends EventTarget {
    private config;
    private queue;
    private totalTasks;
    private completedTasks;
    private processPromise;
    private taskResults;
    constructor(config?: Partial<BatchConfig>);
    add(task: Task): void;
    process(): Promise<Readonly<TaskResult>[]>;
    private startProcessing;
    private onTaskEnd;
    private processTask;
    private setToDefault;
    reset(): void;
    addEventListener(type: (typeof EventTypes)[keyof typeof EventTypes], callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void;
    get isProcessing(): boolean;
    get progress(): number;
    get size(): number;
    get concurrency(): number;
}
export default Batch;
