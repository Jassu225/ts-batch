export declare const TASK_TIMEOUT_ERROR: Error;
declare class AddTaskError extends Error {
    constructor(message: string);
}
export declare const CANNOT_ADD_TASK_DURING_PROCESSING_ERROR: AddTaskError;
export declare const TASK_MUST_BE_FUNCTION_ERROR: AddTaskError;
export declare const NO_TASKS_ERROR: Error;
export declare const CANNOT_RESET_DURING_PROCESSING_ERROR: Error;
export {};
