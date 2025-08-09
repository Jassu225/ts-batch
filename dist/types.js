export var TaskResponseStatus;
(function (TaskResponseStatus) {
    TaskResponseStatus["Success"] = "success";
    TaskResponseStatus["Error"] = "error";
    TaskResponseStatus["Timeout"] = "timeout";
})(TaskResponseStatus || (TaskResponseStatus = {}));
export const TASK_TIMEOUT_ERROR = new Error("Task timed out");
export const ADD_TASK_ERROR = new Error("Cannot add new tasks during processing");
export const NO_TASKS_ERROR = new Error("No tasks to process");
