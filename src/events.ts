import {
  CompleteEventDetail,
  ProgressEventDetail,
  StartEventDetail,
} from "./types/event-details";
import {
  COMPLETE_EVENT,
  PROGRESS_EVENT,
  START_EVENT,
} from "./constants/events";

type OmitTimestamp<T> = Omit<T, "timestamp">;
function addTimestamp<T extends { timestamp: string }>(
  detail: OmitTimestamp<T>
): T {
  return {
    ...(detail as T),
    timestamp: new Date().toISOString(),
  };
}

export class StartEvent extends CustomEvent<StartEventDetail> {
  constructor(detail: OmitTimestamp<StartEventDetail>) {
    super(START_EVENT, { detail: addTimestamp(detail) });
  }
}

export class ProgressEvent extends CustomEvent<ProgressEventDetail> {
  constructor(detail: OmitTimestamp<ProgressEventDetail>) {
    super(PROGRESS_EVENT, { detail: addTimestamp(detail) });
  }
}

export class CompleteEvent extends CustomEvent<CompleteEventDetail> {
  constructor(detail: OmitTimestamp<CompleteEventDetail>) {
    super(COMPLETE_EVENT, { detail: addTimestamp(detail) });
  }
}
