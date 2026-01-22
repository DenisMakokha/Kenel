import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 Database disconnected');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    // Delete in reverse order of dependencies
    await this.$transaction([
      this.auditLog.deleteMany(),
      (this as any).notificationUserState.deleteMany(),
      this.repaymentAllocation.deleteMany(),
      this.repayment.deleteMany(),
      this.loanDocument.deleteMany(),
      this.loanSchedule.deleteMany(),
      this.loan.deleteMany(),
      this.creditScore.deleteMany(),
      this.applicationDocument.deleteMany(),
      this.loanApplication.deleteMany(),
      this.loanProductVersion.deleteMany(),
      this.loanProduct.deleteMany(),
      this.clientDocument.deleteMany(),
      this.clientReferee.deleteMany(),
      this.clientNextOfKin.deleteMany(),
      this.client.deleteMany(),
      this.refreshToken.deleteMany(),
      this.user.deleteMany(),
    ]);
  }
}
