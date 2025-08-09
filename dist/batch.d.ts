import { BatchConfig } from "./types/config";
import { Task, TaskResult } from "./types/task";
import * as EventTypes from "./constants/events";
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
    get isProcessing(): boolean;
    get progress(): number;
    addEventListener(type: (typeof EventTypes)[keyof typeof EventTypes], callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void;
}
export default Batch;
