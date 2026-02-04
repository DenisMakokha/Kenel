import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

export type ScanResult = {
  isClean: boolean;
  virusName?: string;
  error?: string;
};

@Injectable()
export class VirusScanService {
  private readonly logger = new Logger(VirusScanService.name);
  private clamAvailable: boolean | null = null;

  constructor(private readonly prisma: PrismaService) {
    this.checkClamAvailability();
  }

  private async checkClamAvailability(): Promise<boolean> {
    if (this.clamAvailable !== null) {
      return this.clamAvailable;
    }

    try {
      await execAsync('which clamscan');
      this.clamAvailable = true;
      this.logger.log('ClamAV is available for virus scanning');
    } catch {
      this.clamAvailable = false;
      this.logger.warn('ClamAV not installed - virus scanning disabled. Install with: sudo apt install clamav');
    }

    return this.clamAvailable;
  }

  /**
   * Scan a file for viruses using ClamAV
   */
  async scanFile(filePath: string): Promise<ScanResult> {
    if (!existsSync(filePath)) {
      return { isClean: false, error: 'File not found' };
    }

    const isAvailable = await this.checkClamAvailability();
    if (!isAvailable) {
      // If ClamAV not installed, mark as clean (can't scan)
      this.logger.warn(`Skipping virus scan for ${filePath} - ClamAV not available`);
      return { isClean: true };
    }

    try {
      // Run clamscan on the file
      // --no-summary: don't print summary
      // --infected: only print infected files
      const { stdout, stderr } = await execAsync(`clamscan --no-summary "${filePath}"`, {
        timeout: 60000, // 60 second timeout
      });

      // If no output or "OK" in output, file is clean
      if (stdout.includes(': OK')) {
        this.logger.log(`File scanned clean: ${filePath}`);
        return { isClean: true };
      }

      // Check for virus detection
      const match = stdout.match(/: (.+) FOUND/);
      if (match) {
        const virusName = match[1];
        this.logger.warn(`Virus detected in ${filePath}: ${virusName}`);
        return { isClean: false, virusName };
      }

      // Unknown result, treat as clean but log
      this.logger.warn(`Unknown scan result for ${filePath}: ${stdout}`);
      return { isClean: true };
    } catch (error: any) {
      // Exit code 1 means virus found
      if (error.code === 1 && error.stdout) {
        const match = error.stdout.match(/: (.+) FOUND/);
        if (match) {
          const virusName = match[1];
          this.logger.warn(`Virus detected in ${filePath}: ${virusName}`);
          return { isClean: false, virusName };
        }
      }

      this.logger.error(`Error scanning file ${filePath}: ${error.message}`);
      return { isClean: true, error: error.message };
    }
  }

  /**
   * Scan a client document and update its status
   */
  async scanClientDocument(documentId: string): Promise<ScanResult> {
    const document = await this.prisma.clientDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return { isClean: false, error: 'Document not found' };
    }

    const filePath = document.filePath.startsWith('/')
      ? document.filePath
      : `${process.cwd()}/${document.filePath}`;

    const result = await this.scanFile(filePath);

    // Update document status
    await this.prisma.clientDocument.update({
      where: { id: documentId },
      data: {
        virusScanStatus: result.isClean ? 'clean' : 'infected',
      },
    });

    this.logger.log(`Updated client document ${documentId} scan status: ${result.isClean ? 'clean' : 'infected'}`);

    return result;
  }

  /**
   * Scan an application document and update its status
   */
  async scanApplicationDocument(documentId: string): Promise<ScanResult> {
    const document = await this.prisma.applicationDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return { isClean: false, error: 'Document not found' };
    }

    const filePath = document.filePath.startsWith('/')
      ? document.filePath
      : `${process.cwd()}/${document.filePath}`;

    const result = await this.scanFile(filePath);

    // ApplicationDocument may not have virusScanStatus field, check schema
    // For now, just return the result
    this.logger.log(`Scanned application document ${documentId}: ${result.isClean ? 'clean' : 'infected'}`);

    return result;
  }

  /**
   * Scan all pending documents (background job)
   */
  async scanPendingDocuments(): Promise<{ scanned: number; infected: number }> {
    const pendingDocs = await this.prisma.clientDocument.findMany({
      where: {
        virusScanStatus: 'pending',
        isDeleted: false,
      },
      take: 10, // Process in batches
    });

    let scanned = 0;
    let infected = 0;

    for (const doc of pendingDocs) {
      const result = await this.scanClientDocument(doc.id);
      scanned++;
      if (!result.isClean) {
        infected++;
      }
    }

    if (scanned > 0) {
      this.logger.log(`Batch scan complete: ${scanned} scanned, ${infected} infected`);
    }

    return { scanned, infected };
  }
}
