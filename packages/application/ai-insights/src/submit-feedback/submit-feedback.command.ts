export interface SubmitFeedbackCommand {
  insightId: string;
  userId: string;
  accepted: boolean;
  modifiedValue?: string;
}

export interface SubmitFeedbackResult {
  feedbackId: string;
}
