import { BadRequestException } from '@nestjs/common';
import { LoanApplicationsService } from './loan-applications.service';

// Focused unit tests around the manual credit scoring logic
// using a lightweight mocked PrismaService.

describe('LoanApplicationsService - upsertScore', () => {
  let service: LoanApplicationsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      loanApplication: {
        findUnique: jest.fn(),
      },
      creditScore: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      loanApplicationEvent: {
        create: jest.fn(),
      },
    };

    const loansService = {
      createFromApplication: jest.fn().mockResolvedValue({}),
    };

    service = new LoanApplicationsService(prisma as any, loansService as any);
  });

  it('creates a new score with correct totalScore and grade for SUBMITTED application', async () => {
    prisma.loanApplication.findUnique.mockResolvedValue({
      id: 'app-1',
      status: 'SUBMITTED',
    });

    prisma.creditScore.findUnique.mockResolvedValue(null);

    prisma.creditScore.create.mockResolvedValue({
      id: 'score-1',
      applicationId: 'app-1',
      repaymentHistoryScore: 5,
      stabilityScore: 5,
      incomeScore: 5,
      obligationScore: 5,
      totalScore: 20,
      grade: 'A',
    });

    const dto: any = {
      repaymentHistoryScore: 5,
      stabilityScore: 5,
      incomeScore: 5,
      obligationScore: 5,
      officerComments: 'Strong client',
      recommendation: 'APPROVE',
    };

    const result = await service.upsertScore('app-1', dto, 'user-1');

    expect(prisma.creditScore.create).toHaveBeenCalledTimes(1);
    const createArgs = prisma.creditScore.create.mock.calls[0][0];
    expect(createArgs.data.totalScore).toBe(20);
    expect(createArgs.data.grade).toBe('A');

    expect(result.totalScore).toBe(20);
    expect(result.grade).toBe('A');

    expect(prisma.loanApplicationEvent.create).toHaveBeenCalledTimes(1);
    const eventPayload = prisma.loanApplicationEvent.create.mock.calls[0][0].data.payload;
    expect(eventPayload.totalScore).toBe(20);
    expect(eventPayload.grade).toBe('A');
  });

  it('updates an existing score when one already exists', async () => {
    prisma.loanApplication.findUnique.mockResolvedValue({
      id: 'app-1',
      status: 'UNDER_REVIEW',
    });

    prisma.creditScore.findUnique.mockResolvedValue({
      id: 'score-1',
      applicationId: 'app-1',
    });

    prisma.creditScore.update.mockResolvedValue({
      id: 'score-1',
      applicationId: 'app-1',
      repaymentHistoryScore: 4,
      stabilityScore: 4,
      incomeScore: 4,
      obligationScore: 4,
      totalScore: 16,
      grade: 'B',
    });

    const dto: any = {
      repaymentHistoryScore: 4,
      stabilityScore: 4,
      incomeScore: 4,
      obligationScore: 4,
    };

    const result = await service.upsertScore('app-1', dto, 'user-1');

    expect(prisma.creditScore.update).toHaveBeenCalledTimes(1);
    const updateArgs = prisma.creditScore.update.mock.calls[0][0];
    expect(updateArgs.data.totalScore).toBe(16);
    expect(updateArgs.data.grade).toBe('B');

    expect(result.totalScore).toBe(16);
    expect(result.grade).toBe('B');
    expect(prisma.loanApplicationEvent.create).toHaveBeenCalledTimes(1);
  });

  it('throws BadRequestException when status is not SUBMITTED or UNDER_REVIEW', async () => {
    prisma.loanApplication.findUnique.mockResolvedValue({
      id: 'app-1',
      status: 'DRAFT',
    });

    const dto: any = {
      repaymentHistoryScore: 3,
      stabilityScore: 3,
      incomeScore: 3,
      obligationScore: 3,
    };

    await expect(service.upsertScore('app-1', dto, 'user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(prisma.creditScore.create).not.toHaveBeenCalled();
    expect(prisma.creditScore.update).not.toHaveBeenCalled();
  });
});
