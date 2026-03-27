import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateChecklistItems() {
  console.log('Starting checklist items migration...');

  // Find all loan applications that have uploaded documents but missing checklist items
  const applications = await prisma.loanApplication.findMany({
    where: {
      checklistItems: {
        some: {} // Has at least one checklist item
      }
    },
    include: {
      checklistItems: true,
      documents: true,
      client: true
    }
  });

  console.log(`Found ${applications.length} applications to check`);

  for (const application of applications) {
    const existingItemKeys = application.checklistItems.map(item => item.itemKey);
    const isKycVerified = application.client?.kycStatus === 'VERIFIED';
    
    // Define all required items
    const allRequiredItems = [
      { itemKey: 'bank_statement', itemLabel: 'Bank statement for the latest three months (stamped at bank)', documentSource: 'KYC' },
      { itemKey: 'kra_pin_certificate', itemLabel: 'Copy of KRA PIN certificate', documentSource: 'KYC' },
      { itemKey: 'id_copy', itemLabel: 'Copy of ID', documentSource: 'KYC' },
      { itemKey: 'employment_contract', itemLabel: 'Copy of Employment Contract', documentSource: 'KYC' },
      { itemKey: 'utility_bill', itemLabel: 'Utility Bill (proof of address)', documentSource: 'KYC' },
      { itemKey: 'loan_application_form', itemLabel: 'Duly-filled KENELS BUREAU Loan Application form', documentSource: 'LOAN_APPLICATION' }
    ];

    // Find missing items
    const missingItems = allRequiredItems.filter(item => !existingItemKeys.includes(item.itemKey));
    
    if (missingItems.length > 0) {
      console.log(`Application ${application.applicationNumber}: Adding ${missingItems.length} missing checklist items`);
      
      // Create missing checklist items
      await prisma.loanApplicationChecklistItem.createMany({
        data: missingItems.map(item => ({
          loanApplicationId: application.id,
          itemKey: item.itemKey,
          itemLabel: item.itemLabel,
          documentSource: item.documentSource,
          status: (isKycVerified && item.documentSource === 'KYC') ? 'COMPLETED' : 'PENDING',
          completedAt: (isKycVerified && item.documentSource === 'KYC') ? new Date() : null,
          notes: (isKycVerified && item.documentSource === 'KYC') ? 'Auto-completed: Approved during KYC process' : null,
        })),
        skipDuplicates: true
      });
    }
  }

  console.log('Migration completed successfully!');
}

migrateChecklistItems()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
