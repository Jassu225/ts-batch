import { COMPLETE_EVENT, PROGRESS_EVENT, START_EVENT } from "./types/events";
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
StartEvent.type = START_EVENT;
export class ProgressEvent extends CustomEvent {
    constructor(detail) {
        super(PROGRESS_EVENT, { detail: addTimestamp(detail) });
    }
}
ProgressEvent.type = PROGRESS_EVENT;
export class CompleteEvent extends CustomEvent {
    constructor(detail) {
        super(COMPLETE_EVENT, { detail: addTimestamp(detail) });
    }
}
CompleteEvent.type = COMPLETE_EVENT;
export * from "./types/event-details";
