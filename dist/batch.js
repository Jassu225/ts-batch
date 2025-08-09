import { CompleteEvent, ProgressEvent, StartEvent } from "./events";
import { ADD_TASK_ERROR, NO_TASKS_ERROR, 
// TASK_TIMEOUT_ERROR,
TaskResponseStatus, } from "./types";
import { validateConcurrency } from "./utils";
const getDefaultQueue = () => [];
const getDefaultTotalTasks = () => 0;
const getDefaultCompletedTasks = () => 0;
const getDefaultProcessPromise = () => null;
const getDefaultTaskResults = () => [];
class Batch extends EventTarget {
    constructor(config = {}) {
        super();
        this.queue = getDefaultQueue();
        this.totalTasks = getDefaultTotalTasks();
        this.completedTasks = getDefaultCompletedTasks();
        this.processPromise = getDefaultProcessPromise();
        this.taskResults = getDefaultTaskResults();
        const concurrency = config.concurrency ||
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
    add(task) {
        if (this.processPromise) {
            throw ADD_TASK_ERROR;
        }
        if (typeof task !== "function") {
            throw new Error("Task must be a function");
        }
        this.queue.push({ task, index: this.totalTasks });
        ++this.totalTasks;
    }
    async process() {
        if (this.processPromise) {
            return this.processPromise;
        }
        if (this.totalTasks === 0) {
            throw NO_TASKS_ERROR;
        }
        this.taskResults = Array.from({ length: this.totalTasks });
        this.processPromise = new Promise(async (resolve) => {
            await this.startProcessing();
            resolve(this.taskResults.map((t) => Object.freeze(t)));
        }).then((taskResults) => {
            // dispatch complete event
            this.dispatchEvent(new CompleteEvent({ taskResults }));
            return taskResults;
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
            progress: this.completedTasks / this.totalTasks,
            taskResult: this.taskResults[task.index],
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
                ? TaskResponseStatus.Error
                : TaskResponseStatus.Success,
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
        if (this.processPromise) {
            throw new Error("Cannot reset while processing is in progress");
        }
        this.setToDefault();
    }
    get isProcessing() {
        return this.processPromise !== null;
    }
    get progress() {
        return this.totalTasks === 0 ? 0 : this.completedTasks / this.totalTasks;
    }
}
export default Batch;
