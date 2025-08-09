import { COMPLETE_EVENT, PROGRESS_EVENT, START_EVENT } from "./event-types";
function addTimestamp(detail) {
    return {
        ...detail,
        timestamp: new Date().toISOString(),
    };
}
export class StartEvent extends CustomEvent {
    constructor(detail) {
        super(START_EVENT, { detail: addTimestamp(detail) });
    }
}
export class ProgressEvent extends CustomEvent {
    constructor(detail) {
        super(PROGRESS_EVENT, { detail: addTimestamp(detail) });
    }
}
export class CompleteEvent extends CustomEvent {
    constructor(detail) {
        super(COMPLETE_EVENT, { detail: addTimestamp(detail) });
    }
}
