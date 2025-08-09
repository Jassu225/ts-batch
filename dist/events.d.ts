import { CompleteEventDetail, ProgressEventDetail, StartEventDetail } from "./types/event-details";
type OmitTimestamp<T> = Omit<T, "timestamp">;
export declare class StartEvent extends CustomEvent<StartEventDetail> {
    constructor(detail: OmitTimestamp<StartEventDetail>);
    static readonly type = "start";
}
export declare class ProgressEvent extends CustomEvent<ProgressEventDetail> {
    constructor(detail: OmitTimestamp<ProgressEventDetail>);
    static readonly type = "progress";
}
export declare class CompleteEvent extends CustomEvent<CompleteEventDetail> {
    constructor(detail: OmitTimestamp<CompleteEventDetail>);
    static readonly type = "complete";
}
export * from "./types/event-details";
