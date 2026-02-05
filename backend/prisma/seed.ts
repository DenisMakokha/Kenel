import {
  PrismaClient,
  UserRole,
  IdType,
  ProductType,
  ProductVersionStatus,
  InterestRatePeriod,
  InterestRateType,
  FeeCategory,
  FeeCalculationType,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const shouldPrintCredentials = process.env.PRINT_SEED_CREDENTIALS === 'true';

const getSeedPassword = (envKey: string) => {
  const fromEnv = process.env[envKey];
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  return randomBytes(18).toString('base64url');
};

const SEED_PASSWORDS = {
  admin: getSeedPassword('SEED_ADMIN_PASSWORD'),
  creditOfficer: getSeedPassword('SEED_CREDIT_OFFICER_PASSWORD'),
  financeOfficer: getSeedPassword('SEED_FINANCE_OFFICER_PASSWORD'),
  client: getSeedPassword('SEED_CLIENT_PASSWORD'),
  portalClient: getSeedPassword('SEED_PORTAL_CLIENT_PASSWORD'),
};

async function main() {
  console.log('🌱 Seeding Kenels Bureau LMS database...\n');

  // ============================================
  // ADMIN USER - Full system access
  // ============================================
  const adminPassword = await argon2.hash(SEED_PASSWORDS.admin);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kenelsbureau.co.ke' },
    update: {
      password: adminPassword,
      isActive: true,
    },
    create: {
      email: 'admin@kenelsbureau.co.ke',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+254759599124',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // ============================================
  // CREDIT OFFICER - Loan origination & review
  // ============================================
  const officerPassword = await argon2.hash(SEED_PASSWORDS.creditOfficer);
  const officer = await prisma.user.upsert({
    where: { email: 'credit@kenelsbureau.co.ke' },
    update: {
      password: officerPassword,
      isActive: true,
    },
    create: {
      email: 'credit@kenelsbureau.co.ke',
      password: officerPassword,
      firstName: 'James',
      lastName: 'Mwangi',
      phone: '+254700000001',
      role: UserRole.CREDIT_OFFICER,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('✅ Credit Officer created:', officer.email);

  // ============================================
  // FINANCE OFFICER - Repayments & collections
  // ============================================
  const financePassword = await argon2.hash(SEED_PASSWORDS.financeOfficer);
  const finance = await prisma.user.upsert({
    where: { email: 'finance@kenelsbureau.co.ke' },
    update: {
      password: financePassword,
      isActive: true,
    },
    create: {
      email: 'finance@kenelsbureau.co.ke',
      password: financePassword,
      firstName: 'Grace',
      lastName: 'Wanjiku',
      phone: '+254700000002',
      role: UserRole.FINANCE_OFFICER,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('✅ Finance Officer created:', finance.email);

  // ============================================
  // TEST CLIENT - For demo purposes
  // ============================================
  const clientPassword = await argon2.hash(SEED_PASSWORDS.client);
  const client = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {
      password: clientPassword,
      isActive: true,
    },
    create: {
      email: 'john.doe@example.com',
      password: clientPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+254712345678',
      role: UserRole.CLIENT,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('✅ Test Client created:', client.email);

  // Create client profile
  const testClient = await prisma.client.upsert({
    where: { userId: client.id },
    update: {},
    create: {
      userId: client.id,
      clientCode: 'KB-2024-0001',
      firstName: client.firstName,
      lastName: client.lastName,
      idType: IdType.NATIONAL_ID,
      idNumber: '12345678',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'Male',
      phonePrimary: '+254712345678',
      email: client.email,
      residentialAddress: 'Village Market, Nairobi',
      employerName: 'ABC Company Ltd',
      occupation: 'Software Developer',
      monthlyIncome: 150000,
    },
  });
  console.log('✅ Test Client profile created:', testClient.clientCode);

  // Create portal user for client
  const portalPassword = await argon2.hash(SEED_PASSWORDS.portalClient);
  const portalUser = await prisma.clientPortalUser.upsert({
    where: { clientId: testClient.id },
    update: {
      passwordHash: portalPassword,
      status: 'active',
    },
    create: {
      clientId: testClient.id,
      email: 'john.doe@example.com',
      phone: testClient.phonePrimary,
      passwordHash: portalPassword,
      status: 'active',
    },
  });
  console.log('✅ Portal access created for client:', portalUser.email);

  // ============================================
  // LOAN PRODUCTS - Portal-approved products
  // ============================================

  const upsertProductWithPublishedV1 = async (data: {
    code: string;
    name: string;
    description: string;
    productType: ProductType;
    terms: {
      min_principal: number;
      max_principal: number;
      min_term_months: number;
      max_term_months: number;
    };
    interest: {
      rate_per_year: number;
      rate_period: 'PER_MONTH' | 'PER_ANNUM';
    };
  }) => {
    const product = await prisma.loanProduct.upsert({
      where: { code: data.code },
      update: {
        name: data.name,
        description: data.description,
        productType: data.productType,
        currencyCode: 'KES',
        isActive: true,
        deletedAt: null,
      },
      create: {
        code: data.code,
        name: data.name,
        description: data.description,
        productType: data.productType,
        currencyCode: 'KES',
        isActive: true,
      },
    });

    const rules = {
      terms: data.terms,
      interest: data.interest,
      fees: {
        processing_fee_type: 'PERCENTAGE',
        processing_fee_value: 0,
      },
    };

    await prisma.loanProductVersion.upsert({
      where: {
        loanProductId_versionNumber: {
          loanProductId: product.id,
          versionNumber: 1,
        },
      },
      update: {
        status: ProductVersionStatus.PUBLISHED,
        rules,
        createdByUserId: admin.id,
      },
      create: {
        loanProductId: product.id,
        versionNumber: 1,
        status: ProductVersionStatus.PUBLISHED,
        rules,
        createdByUserId: admin.id,
      },
    });

    return product;
  };

  await upsertProductWithPublishedV1({
    code: 'SALARY_ADVANCE_LOAN',
    name: 'SALARY ADVANCE LOAN (For Salaried)',
    description: 'Quick Personal Loan for immediate/urgent/emergency needs.',
    productType: ProductType.SALARY_ADVANCE,
    terms: {
      min_principal: 5000,
      max_principal: 100000,
      min_term_months: 1,
      max_term_months: 3,
    },
    interest: {
      rate_per_year: 14,
      rate_period: 'PER_MONTH',
    },
  });

  await upsertProductWithPublishedV1({
    code: 'TERM_LOAN_SALARIED',
    name: 'Term Loan (For Salaried)',
    description: 'Monthly Instalment loan.',
    productType: ProductType.TERM_LOAN,
    terms: {
      min_principal: 50000,
      max_principal: 2000000,
      min_term_months: 3,
      max_term_months: 36,
    },
    interest: {
      rate_per_year: 18,
      rate_period: 'PER_ANNUM',
    },
  });

  await upsertProductWithPublishedV1({
    code: 'BUSINESS_LOAN',
    name: 'Business Loan',
    description: 'Grow your business with flexible financing.',
    productType: ProductType.BUSINESS_LOAN,
    terms: {
      min_principal: 50000,
      max_principal: 2000000,
      min_term_months: 3,
      max_term_months: 36,
    },
    interest: {
      rate_per_year: 18,
      rate_period: 'PER_ANNUM',
    },
  });

  console.log('✅ Loan products seeded: Salary Advance, Term Loan, Business Loan');

  // ============================================
  // INTEREST RATES - Admin configurations
  // ============================================

  const interestRatesToSeed = [
    {
      name: 'Salary Advance Loan',
      type: InterestRateType.REDUCING,
      rate: 14,
      ratePeriod: InterestRatePeriod.PER_MONTH,
      minTerm: 1,
      maxTerm: 3,
      minAmount: 5000,
      maxAmount: 100000,
      effectiveFrom: new Date('2026-01-01'),
      effectiveTo: null as Date | null,
      isActive: true,
    },
    {
      name: 'Term Loan (Salaried)',
      type: InterestRateType.REDUCING,
      rate: 18,
      ratePeriod: InterestRatePeriod.PER_ANNUM,
      minTerm: 3,
      maxTerm: 36,
      minAmount: 50000,
      maxAmount: 2000000,
      effectiveFrom: new Date('2026-01-01'),
      effectiveTo: null as Date | null,
      isActive: true,
    },
    {
      name: 'Business Loan',
      type: InterestRateType.REDUCING,
      rate: 18,
      ratePeriod: InterestRatePeriod.PER_ANNUM,
      minTerm: 3,
      maxTerm: 36,
      minAmount: 50000,
      maxAmount: 2000000,
      effectiveFrom: new Date('2026-01-01'),
      effectiveTo: null as Date | null,
      isActive: true,
    },
  ];

  const seededRateNames = interestRatesToSeed.map((r) => r.name);

  // IMPORTANT:
  // By default, do NOT delete admin-created rates. This prevents newly created
  // interest rates from “disappearing” after a deploy if seed runs automatically.
  //
  // Set PRUNE_INTEREST_RATES=true to perform a one-time cleanup of any rates that
  // are not part of the canonical seed set.
  if (process.env.PRUNE_INTEREST_RATES === 'true') {
    await prisma.interestRate.updateMany({
      where: {
        deletedAt: null,
        name: { notIn: seededRateNames },
      },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  // Upsert canonical interest rates by name
  for (const rate of interestRatesToSeed) {
    const existingRates = await prisma.interestRate.findMany({
      where: { name: rate.name },
      orderBy: { createdAt: 'desc' },
    });

    const existing = existingRates[0];

    // If an admin explicitly deleted a canonical rate, do not resurrect it unless
    // FORCE_SEED_INTEREST_RATES=true is provided.
    if (existing?.deletedAt && process.env.FORCE_SEED_INTEREST_RATES !== 'true') {
      continue;
    }

    // If there are duplicates with same name, soft-delete all but the newest one.
    if (existingRates.length > 1) {
      await prisma.interestRate.updateMany({
        where: {
          id: { in: existingRates.slice(1).map((r) => r.id) },
        },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });
    }

    if (existing) {
      await prisma.interestRate.update({
        where: { id: existing.id },
        data: {
          type: rate.type,
          rate: rate.rate,
          ratePeriod: rate.ratePeriod,
          minTerm: rate.minTerm,
          maxTerm: rate.maxTerm,
          minAmount: rate.minAmount,
          maxAmount: rate.maxAmount,
          isActive: rate.isActive,
          effectiveFrom: rate.effectiveFrom,
          effectiveTo: rate.effectiveTo,
          deletedAt:
            process.env.FORCE_SEED_INTEREST_RATES === 'true' ? null : undefined,
        },
      });
    } else {
      await prisma.interestRate.create({
        data: {
          name: rate.name,
          type: rate.type,
          rate: rate.rate,
          ratePeriod: rate.ratePeriod,
          minTerm: rate.minTerm,
          maxTerm: rate.maxTerm,
          minAmount: rate.minAmount,
          maxAmount: rate.maxAmount,
          isActive: rate.isActive,
          effectiveFrom: rate.effectiveFrom,
          effectiveTo: rate.effectiveTo,
        },
      });
    }
  }

  console.log('✅ Interest rates seeded and dummy rates removed');

  // ============================================
  // FEE TEMPLATES - Admin configurations
  // ============================================

  const feeTemplatesToSeed = [
    {
      name: 'Processing Fee',
      category: FeeCategory.PROCESSING,
      calculationType: FeeCalculationType.PERCENTAGE,
      value: 3,
      minAmount: 500,
      maxAmount: 10000,
      description: 'One-time processing fee charged at loan disbursement (3% of principal)',
      isActive: true,
    },
    {
      name: 'Insurance Fee',
      category: FeeCategory.INSURANCE,
      calculationType: FeeCalculationType.PERCENTAGE,
      value: 1,
      minAmount: 200,
      maxAmount: 5000,
      description: 'Credit life insurance fee (1% of principal)',
      isActive: true,
    },
    {
      name: 'Late Payment Penalty',
      category: FeeCategory.PENALTY,
      calculationType: FeeCalculationType.PERCENTAGE,
      value: 5,
      minAmount: 100,
      maxAmount: null as number | null,
      description: 'Penalty charged on overdue installments (5% of overdue amount)',
      isActive: true,
    },
    {
      name: 'Legal Fee',
      category: FeeCategory.LEGAL,
      calculationType: FeeCalculationType.FIXED,
      value: 2500,
      minAmount: null as number | null,
      maxAmount: null as number | null,
      description: 'Legal/documentation fee for loan agreements',
      isActive: true,
    },
    {
      name: 'Service Fee',
      category: FeeCategory.SERVICE,
      calculationType: FeeCalculationType.FIXED,
      value: 500,
      minAmount: null as number | null,
      maxAmount: null as number | null,
      description: 'Monthly account maintenance/service fee',
      isActive: true,
    },
  ];

  const seededFeeNames = feeTemplatesToSeed.map((f) => f.name);

  // Prune non-canonical fee templates only when explicitly enabled
  if (process.env.PRUNE_FEE_TEMPLATES === 'true') {
    await prisma.feeTemplate.updateMany({
      where: {
        deletedAt: null,
        name: { notIn: seededFeeNames },
      },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  // Upsert canonical fee templates by name
  for (const fee of feeTemplatesToSeed) {
    const existingFees = await prisma.feeTemplate.findMany({
      where: { name: fee.name },
      orderBy: { createdAt: 'desc' },
    });

    const existing = existingFees[0];

    // If an admin explicitly deleted a canonical fee, do not resurrect it unless
    // FORCE_SEED_FEE_TEMPLATES=true is provided.
    if (existing?.deletedAt && process.env.FORCE_SEED_FEE_TEMPLATES !== 'true') {
      continue;
    }

    // If there are duplicates with same name, soft-delete all but the newest one.
    if (existingFees.length > 1) {
      await prisma.feeTemplate.updateMany({
        where: {
          id: { in: existingFees.slice(1).map((f) => f.id) },
        },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });
    }

    if (existing) {
      await prisma.feeTemplate.update({
        where: { id: existing.id },
        data: {
          category: fee.category,
          calculationType: fee.calculationType,
          value: fee.value,
          minAmount: fee.minAmount,
          maxAmount: fee.maxAmount,
          description: fee.description,
          isActive: fee.isActive,
          deletedAt:
            process.env.FORCE_SEED_FEE_TEMPLATES === 'true' ? null : undefined,
        },
      });
    } else {
      await prisma.feeTemplate.create({
        data: {
          name: fee.name,
          category: fee.category,
          calculationType: fee.calculationType,
          value: fee.value,
          minAmount: fee.minAmount,
          maxAmount: fee.maxAmount,
          description: fee.description,
          isActive: fee.isActive,
        },
      });
    }
  }

  console.log('✅ Fee templates seeded');

  // ============================================
  // OUTPUT CREDENTIALS
  // ============================================
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 KENELS BUREAU LMS - SEEDING COMPLETED!');
  console.log('═'.repeat(60));
  console.log('\n📋 STAFF LOGIN CREDENTIALS (https://kenels.app/login)');
  console.log('─'.repeat(60));
  console.log('\n👑 ADMINISTRATOR');
  console.log('   Email:    admin@kenelsbureau.co.ke');
  console.log('   Password: ' + (shouldPrintCredentials ? SEED_PASSWORDS.admin : '<HIDDEN>'));
  console.log('   Access:   Full system access - all modules');
  console.log('\n📊 CREDIT OFFICER');
  console.log('   Email:    credit@kenelsbureau.co.ke');
  console.log('   Password: ' + (shouldPrintCredentials ? SEED_PASSWORDS.creditOfficer : '<HIDDEN>'));
  console.log('   Access:   Loan applications, client management, credit scoring');
  console.log('\n💰 FINANCE OFFICER');
  console.log('   Email:    finance@kenelsbureau.co.ke');
  console.log('   Password: ' + (shouldPrintCredentials ? SEED_PASSWORDS.financeOfficer : '<HIDDEN>'));
  console.log('   Access:   Repayments, disbursements, collections');
  console.log('\n' + '─'.repeat(60));
  console.log('\n📱 CLIENT PORTAL CREDENTIALS (https://kenels.app/portal/login)');
  console.log('─'.repeat(60));
  console.log('\n👤 TEST CLIENT');
  console.log('   Email:    john.doe@example.com');
  console.log('   Password: ' + (shouldPrintCredentials ? SEED_PASSWORDS.portalClient : '<HIDDEN>'));
  console.log('   Access:   View loans, make payments, apply for loans');
  console.log('\n' + '═'.repeat(60));
  console.log('⚠️  IMPORTANT: Change these passwords after first login!');
  if (!shouldPrintCredentials) {
    console.log('ℹ️  Passwords are hidden by default. Set PRINT_SEED_CREDENTIALS=true to display them during seeding.');
  }
  console.log('═'.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
