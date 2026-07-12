export interface AcceptRecommendationCommand {
  recommendationId: string;
  userId: string;
  modifiedValue?: string;
}

export interface AcceptRecommendationResult {
  success: boolean;
  appliedCommand?: string;
}
