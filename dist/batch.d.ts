import { BatchConfig, Task, TaskResult } from "./types";
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
}
export default Batch;
