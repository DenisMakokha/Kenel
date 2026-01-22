import { ReportsService } from './reports.service';

// Focused unit tests around as-of balances and DPD logic
// using synthetic in-memory loans. Prisma is not hit in these tests.

describe('ReportsService - as-of balances & DPD', () => {
  let service: ReportsService;

  beforeEach(() => {
    service = new ReportsService({} as any);
  });

  describe('parseAsOfDate', () => {
    beforeAll(() => {
      jest.useFakeTimers();
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('returns today (at midnight) when input is undefined', () => {
      const fakeNow = new Date('2025-03-31T12:34:56.000Z');
      jest.setSystemTime(fakeNow);

      const expected = new Date();
      expected.setHours(0, 0, 0, 0);

      const result = (service as any).parseAsOfDate(undefined);
      expect(result.getTime()).toBe(expected.getTime());
    });

    it('clamps future dates to today (at midnight)', () => {
      const fakeNow = new Date('2025-03-31T12:34:56.000Z');
      jest.setSystemTime(fakeNow);

      const expected = new Date();
      expected.setHours(0, 0, 0, 0);

      const result = (service as any).parseAsOfDate('2099-01-01');
      expect(result.getTime()).toBe(expected.getTime());
    });
  });

  describe('computeOutstandingAsOf', () => {
    it('returns zero balances when as-of date is before disbursement', () => {
      const loan: any = {
        disbursedAt: new Date('2025-01-15T00:00:00.000Z'),
        schedules: [
          {
            id: 's1',
            dueDate: new Date('2025-01-31T00:00:00.000Z'),
            principalDue: 1000,
            interestDue: 100,
            feesDue: 0,
            totalDue: 1100,
            principalPaid: 0,
            interestPaid: 0,
            feesPaid: 0,
            penaltiesPaid: 0,
            totalPaid: 0,
          },
        ],
        repayments: [],
        application: {
          productVersion: {
            rules: null,
          },
        },
      };

      const asOf = new Date('2025-01-01T00:00:00.000Z');
      const result = (service as any).computeOutstandingAsOf(loan, asOf);

      expect(result.principalOutstanding).toBe(0);
      expect(result.interestOutstanding).toBe(0);
      expect(result.feesOutstanding).toBe(0);
      expect(result.penaltiesOutstanding).toBe(0);
      expect(result.daysPastDue).toBe(0);
      expect(result.bucketLabel).toBe('0');
      expect(result.overduePrincipal).toBe(0);
      expect(result.overdueInterest).toBe(0);
    });

    it('applies repayments in allocation order and derives DPD from schedule state', () => {
      const loan: any = {
        disbursedAt: new Date('2025-01-01T00:00:00.000Z'),
        schedules: [
          {
            id: 's1',
            installmentNumber: 1,
            dueDate: new Date('2025-01-10T00:00:00.000Z'),
            principalDue: 1000,
            interestDue: 0,
            feesDue: 0,
            totalDue: 1000,
            principalPaid: 0,
            interestPaid: 0,
            feesPaid: 0,
            penaltiesPaid: 0,
            totalPaid: 0,
          },
        ],
        repayments: [
          {
            id: 'r1',
            amount: 400,
            transactionDate: new Date('2025-01-15T00:00:00.000Z'),
            createdAt: new Date('2025-01-15T00:00:00.000Z'),
          },
        ],
        application: {
          productVersion: {
            // Use default allocation order: penalties, fees, interest, principal
            rules: null,
          },
        },
      };

      const asOf = new Date('2025-02-10T00:00:00.000Z');
      const result = (service as any).computeOutstandingAsOf(loan, asOf);

      // Starting principal 1000, repayment of 400 applied to principal
      expect(result.principalOutstanding).toBeCloseTo(600);
      expect(result.interestOutstanding).toBeCloseTo(0);
      expect(result.feesOutstanding).toBeCloseTo(0);
      expect(result.penaltiesOutstanding).toBeCloseTo(0);

      // As-of is 31 days after due date (bucket 31-60)
      expect(result.daysPastDue).toBeGreaterThan(30);
      expect(result.daysPastDue).toBeLessThanOrEqual(60);
      expect(result.bucketLabel).toBe('31-60');

      // Overdue principal is remaining principal on the overdue installment
      expect(result.overduePrincipal).toBeCloseTo(600);
      expect(result.overdueInterest).toBeCloseTo(0);
    });
  });
});
