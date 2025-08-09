export const TASK_TIMEOUT_ERROR = new Error("Task timed out");
class AddTaskError extends Error {
    constructor(message) {
        super(message);
    }
}
export const CANNOT_ADD_TASK_DURING_PROCESSING_ERROR = new AddTaskError("Cannot add new tasks during processing");
export const TASK_MUST_BE_FUNCTION_ERROR = new AddTaskError("Task must be a function");
export const NO_TASKS_ERROR = new Error("No tasks to process");
export const CANNOT_RESET_DURING_PROCESSING_ERROR = new Error("Cannot reset while processing is in progress");
