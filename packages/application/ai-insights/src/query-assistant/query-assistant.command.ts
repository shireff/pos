export interface QueryAssistantCommand {
  question: string;
  companyId: string;
  branchId?: string | null;
  userId: string;
}

export interface QueryAssistantResult {
  id: string;
  answer: string;
  source: string;
  timestamp: string;
}
