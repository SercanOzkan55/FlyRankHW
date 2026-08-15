export type ReportJobStatus = "queued" | "processing" | "completed" | "failed";

export interface TaskSummaryReportJob {
  id: string;
  idempotencyKeyHash: string;
  status: ReportJobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  artifactFilename?: string;
  error?: string;
}

export interface PublicReportJob {
  jobId: string;
  status: ReportJobStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  downloadUrl?: string;
  error?: string;
}

export interface TaskSummary {
  totalTasks: number;
  completedTasks: number;
  openTasks: number;
  completionRate: number;
  daily: Array<{ day: string; created: number; completed: number }>;
}
