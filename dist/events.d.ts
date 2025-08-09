import { CompleteEventDetail, ProgressEventDetail, StartEventDetail } from "./types/event-details";
type OmitTimestamp<T> = Omit<T, "timestamp">;
export declare class StartEvent extends CustomEvent<StartEventDetail> {
    constructor(detail: OmitTimestamp<StartEventDetail>);
}
export declare class ProgressEvent extends CustomEvent<ProgressEventDetail> {
    constructor(detail: OmitTimestamp<ProgressEventDetail>);
}
export declare class CompleteEvent extends CustomEvent<CompleteEventDetail> {
    constructor(detail: OmitTimestamp<CompleteEventDetail>);
}
export {};
