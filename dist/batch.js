import { CompleteEvent, ProgressEvent, StartEvent } from "./events";
import { CANNOT_ADD_TASK_DURING_PROCESSING_ERROR, CANNOT_RESET_DURING_PROCESSING_ERROR, NO_TASKS_ERROR, TASK_MUST_BE_FUNCTION_ERROR, } from "./constants/errors";
import { TaskResponseStatus } from "./types/task";
import { validateConcurrency } from "./utils";
export const getDefaultQueue = () => [];
export const getDefaultTotalTasks = () => 0;
export const getDefaultCompletedTasks = () => 0;
export const getDefaultProcessPromise = () => null;
export const getDefaultTaskResults = () => [];
export const getDefaultConcurrency = () => typeof navigator !== "undefined" && navigator.hardwareConcurrency
    ? navigator.hardwareConcurrency
    : 10;
class Batch extends EventTarget {
    constructor(config = {}) {
        super();
        this.queue = getDefaultQueue();
        this.totalTasks = getDefaultTotalTasks();
        this.completedTasks = getDefaultCompletedTasks();
        this.processPromise = getDefaultProcessPromise();
        this.taskResults = getDefaultTaskResults();
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
    add(task) {
        if (this.isProcessing) {
            throw CANNOT_ADD_TASK_DURING_PROCESSING_ERROR;
        }
        if (typeof task !== "function") {
            throw TASK_MUST_BE_FUNCTION_ERROR;
        }
        this.queue.push({ task, index: this.totalTasks });
        ++this.totalTasks;
    }
    process() {
        if (this.processPromise) {
            return this.processPromise;
        }
        if (this.totalTasks === 0) {
            return Promise.reject(NO_TASKS_ERROR);
        }
        this.taskResults = Array.from({ length: this.totalTasks });
        // Test: store promise without .then() chain to see if that's the issue
        this.processPromise = new Promise(async (resolve) => {
            await this.startProcessing();
            const results = this.taskResults.map((t) => Object.freeze(t));
            // dispatch complete event
            this.dispatchEvent(new CompleteEvent({ taskResults: results }));
            resolve(results);
        });
        return this.processPromise;
    }
    async startProcessing() {
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
                if (!task)
                    continue;
                this.processTask(task).then((taskResult) => {
                    this.onTaskEnd(task, taskResult, resolve);
                });
            }
        });
    }
    onTaskEnd(task, taskResult, resolve) {
        // update completed tasks and store the result
        ++this.completedTasks;
        this.taskResults[task.index] = Object.freeze(taskResult);
        // dispatch progress event
        this.dispatchEvent(new ProgressEvent({
            totalTasks: this.totalTasks,
            completedTasks: this.completedTasks,
            pendingTasks: this.totalTasks - this.completedTasks,
            progress: this.progress,
            lastCompletedTaskResult: this.taskResults[task.index],
        }));
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
    async processTask(task) {
        let result = null;
        let taskError = null;
        try {
            result = await task.task();
        }
        catch (caughtError) {
            taskError = caughtError;
        }
        const taskResult = {
            responseStatus: taskError !== null
                ? TaskResponseStatus.ERROR
                : TaskResponseStatus.SUCCESS,
            response: result,
            error: taskError,
            index: task.index,
        };
        return taskResult;
    }
    setToDefault() {
        this.queue = getDefaultQueue();
        this.totalTasks = getDefaultTotalTasks();
        this.completedTasks = getDefaultCompletedTasks();
        this.taskResults = getDefaultTaskResults();
        this.processPromise = getDefaultProcessPromise();
    }
    reset() {
        if (this.isProcessing) {
            throw CANNOT_RESET_DURING_PROCESSING_ERROR;
        }
        this.setToDefault();
    }
    addEventListener(type, callback, options) {
        super.addEventListener(type, callback, options);
    }
    get isProcessing() {
        return (this.processPromise !== null && this.completedTasks < this.totalTasks);
    }
    get progress() {
        return this.totalTasks === 0
            ? 0
            : Math.round((this.completedTasks * 10000) / this.totalTasks) / 100;
    }
    get size() {
        return this.totalTasks;
    }
    get concurrency() {
        return this.config.concurrency;
    }
}
export default Batch;
