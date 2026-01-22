export type RetentionStrategy = 'anonymize' | 'delete' | 'none';

export interface RetentionPolicy {
  strategy: RetentionStrategy;
  afterYears: number;
}

export const retentionPolicies: Record<string, RetentionPolicy> = {
  clients: { strategy: 'anonymize', afterYears: 7 },
  audit_logs: { strategy: 'delete', afterYears: 5 },
};
