export enum IdType {
  NATIONAL_ID = 'NATIONAL_ID',
  PASSPORT = 'PASSPORT',
  ALIEN_CARD = 'ALIEN_CARD',
}

export enum KycStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum RiskRating {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum CreatedChannel {
  BRANCH = 'BRANCH',
  AGENT = 'AGENT',
  ONLINE = 'ONLINE',
}

export enum DocumentType {
  ID_FRONT = 'ID_FRONT',
  ID_BACK = 'ID_BACK',
  PASSPORT_PHOTO = 'PASSPORT_PHOTO',
  NATIONAL_ID = 'NATIONAL_ID',
  PASSPORT = 'PASSPORT',
  PAYSLIP = 'PAYSLIP',
  BANK_STATEMENT = 'BANK_STATEMENT',
  EMPLOYMENT_LETTER = 'EMPLOYMENT_LETTER',
  CONTRACT = 'CONTRACT',
  PROOF_OF_RESIDENCE = 'PROOF_OF_RESIDENCE',
  OTHER = 'OTHER',
}

export interface Client {
  id: string;
  clientCode: string;
  userId: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  idType: IdType;
  idNumber: string;
  dateOfBirth: string;
  gender?: string;
  maritalStatus?: string;
  phonePrimary: string;
  phoneSecondary?: string;
  email?: string;
  residentialAddress?: string;
  employerName?: string;
  employerAddress?: string;
  employerPhone?: string;
  occupation?: string;
  monthlyIncome?: string;
  createdChannel: CreatedChannel;
  kycStatus: KycStatus;
  kycLevel?: string;
  kycVerifiedAt?: string;
  kycVerifiedBy?: string;
  riskRating?: RiskRating;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  nextOfKin?: NextOfKin[];
  referees?: Referee[];
  documents?: ClientDocument[];
  kycEvents?: KycEvent[];
  _count?: {
    loans: number;
    applications: number;
  };
}

export interface NextOfKin {
  id: string;
  clientId: string;
  fullName: string;
  relation: string;
  phone: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Referee {
  id: string;
  clientId: string;
  fullName: string;
  relation?: string;
  phone: string;
  idNumber?: string;
  employerName?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientDocument {
  id: string;
  clientId: string;
  documentType: DocumentType;
  fileName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  uploadedAt: string;
  isDeleted: boolean;
  virusScanStatus?: string;
}

export interface KycEvent {
  id: string;
  clientId: string;
  fromStatus: KycStatus;
  toStatus: KycStatus;
  reason?: string;
  notes?: string;
  performedBy: string;
  createdAt: string;
}

export interface CreateClientDto {
  firstName: string;
  lastName: string;
  otherNames?: string;
  idType: IdType;
  idNumber: string;
  dateOfBirth: string;
  gender?: string;
  maritalStatus?: string;
  phonePrimary: string;
  phoneSecondary?: string;
  email?: string;
  residentialAddress?: string;
  employerName?: string;
  employerAddress?: string;
  employerPhone?: string;
  occupation?: string;
  monthlyIncome?: string;
  createdChannel?: CreatedChannel;
  notes?: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {}

export interface QueryClientsDto {
  search?: string;
  kycStatus?: KycStatus;
  riskRating?: RiskRating;
  page?: number;
  limit?: number;
}

export interface ClientListResponse {
  data: Client[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SubmitKycDto {
  notes?: string;
}

export interface ApproveKycDto {
  notes?: string;
}

export interface RejectKycDto {
  reason: string;
  notes?: string;
}

export interface UpdateRiskRatingDto {
  riskRating: RiskRating;
  notes?: string;
}

export interface CreateNextOfKinDto {
  fullName: string;
  relation: string;
  phone: string;
  email?: string;
  address?: string;
  isPrimary?: boolean;
}

export interface UpdateNextOfKinDto extends Partial<CreateNextOfKinDto> {}

export interface CreateRefereeDto {
  fullName: string;
  relation?: string;
  phone: string;
  idNumber?: string;
  employerName?: string;
  address?: string;
}

export interface UpdateRefereeDto extends Partial<CreateRefereeDto> {}
