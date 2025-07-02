export type UserRole = 'OPERATION_TOOL_ADMIN' | 'BUSINESS_MANAGER' | 'OPERATOR';
export const USER_ROLES = ['OPERATION_TOOL_ADMIN', 'BUSINESS_MANAGER', 'OPERATOR'] as const;

export interface User { id: string; email: string; name: string; role: UserRole; rentalCompanyId?: string; }

export type RentalCompanyStatus = 'PREPARING' | 'ACTIVE' | 'SUSPENDED';
export const RENTAL_COMPANY_STATUSES = ['PREPARING', 'ACTIVE', 'SUSPENDED'] as const;

export interface RentalCompany { id: string; name: string; registrationNumber?: string; address?: string; representative?: string; phoneNumber?: string; status: RentalCompanyStatus; createdAt: string; updatedAt: string; }

export type ForkliftManagementStatus = 'IN_STORAGE' | 'RENTED' | 'ON_LOAN' | 'UNDER_REPAIR' | 'PART_REPLACEMENT' | 'OVERDUE_RECOVERY' | 'DISPOSED';
export const FORKLIFT_MANAGEMENT_STATUSES = ['IN_STORAGE', 'RENTED', 'ON_LOAN', 'UNDER_REPAIR', 'PART_REPLACEMENT', 'OVERDUE_RECOVERY', 'DISPOSED'] as const;

export type ForkliftDisplayContractStatus = 'ONE_MONTH_LEFT' | 'TWO_MONTHS_LEFT' | 'MID_TERM_TERMINATION' | 'ON_HOLD' | 'CONTRACT_ENDED';
export const FORKLIFT_DISPLAY_CONTRACT_STATUSES = ['ONE_MONTH_LEFT', 'TWO_MONTHS_LEFT', 'MID_TERM_TERMINATION', 'ON_HOLD', 'CONTRACT_ENDED'] as const;

export type ForkliftOperationStatus = 'CHECKING' | 'UNAVAILABLE' | 'OPERATING' | 'STOPPED' | 'REMOTE_STOPPED';
export const FORKLIFT_OPERATION_STATUSES = ['CHECKING', 'UNAVAILABLE', 'OPERATING', 'STOPPED', 'REMOTE_STOPPED'] as const;

export interface Forklift { id: string; manufacturer: string; year: number; tonnage: number; type: string; chassisNumber: string; modelName: string; gpsSerialNumber?: string; purchaseDate: string; purchasePrice: number; withdrawalDate: string; location: string; notes?: string; managementStatus: ForkliftManagementStatus; contractStatus?: ForkliftDisplayContractStatus; operationStatus?: ForkliftOperationStatus; currentContractId?: string; rentalCompanyId: string; }

export type ContractStatus = 'RENTING' | 'CONTRACT_ENDED' | 'MID_TERM_TERMINATION' | 'ON_HOLD' | 'AWAITING_RECOVERY';
export const CONTRACT_STATUSES = ['RENTING', 'CONTRACT_ENDED', 'MID_TERM_TERMINATION', 'ON_HOLD', 'AWAITING_RECOVERY'] as const;

export type ContractType = 'SHORT_TERM' | 'LONG_TERM';
export const CONTRACT_TYPES = ['SHORT_TERM', 'LONG_TERM'] as const;

export type ContractHistoryType = 'CONTRACT_SIGNED' | 'RENTAL_START' | 'FORKLIFT_DELIVERED' | 'CONTRACT_EXTENDED' | 'CONTRACT_ENDED';
export const CONTRACT_HISTORY_TYPES = ['CONTRACT_SIGNED', 'RENTAL_START', 'FORKLIFT_DELIVERED', 'CONTRACT_EXTENDED', 'CONTRACT_ENDED'] as const;

export interface ContractHistoryEntry { type: ContractHistoryType; date: string; description?: string; }

export type ForkliftManagementHistoryType = 'PART_REPLACEMENT' | 'REPAIR' | 'OTHER';
export const FORKLIFT_MANAGEMENT_HISTORY_TYPES = ['PART_REPLACEMENT', 'REPAIR', 'OTHER'] as const;

export interface ForkliftManagementHistoryEntry { id: string; type: ForkliftManagementHistoryType; date: string; cost?: number; responsibleParty?: 'LESSEE' | 'LESSOR'; description?: string; }

export interface Contract { id: string; lesseeId: string; forkliftId: string; contractPdfUrl?: string; startDate: string; endDate: string; contractType: ContractType; status: ContractStatus; rentalFee: number; shippingCost?: number; deposit?: number; repairCost?: number; commission?: number; earlyTerminationPenalty?: number; taxInvoiceIssueDate: string; paymentDueDate: string; paymentMethod: PaymentMethod; history: ContractHistoryEntry[]; rentalCompanyId: string; }

export interface Lessee { id: string; name: string; registrationNumber: string; address?: string; representative: string; phoneNumber: string; contractIds: string[]; }

export type SettlementItemType = 'RENTAL_FEE' | 'SHIPPING_COST' | 'DEPOSIT' | 'REPAIR_COST' | 'COMMISSION' | 'EARLY_TERMINATION_PENALTY';
export const SETTLEMENT_ITEM_TYPES = ['RENTAL_FEE', 'SHIPPING_COST', 'DEPOSIT', 'REPAIR_COST', 'COMMISSION', 'EARLY_TERMINATION_PENALTY'] as const;

export type SettlementStatus = 'PAID' | 'OVERDUE';
export const SETTLEMENT_STATUSES = ['PAID', 'OVERDUE'] as const;

export type PaymentMethod = 'CMS_5TH' | 'CMS_15TH' | 'CMS_25TH' | 'MONTH_END_BANK_TRANSFER' | 'AFTER_30_DAYS_BANK_TRANSFER' | 'AFTER_45_DAYS_BANK_TRANSFER' | 'BANK_TRANSFER' | 'CREDIT_CARD';
export const PAYMENT_METHODS = ['CMS_5TH', 'CMS_15TH', 'CMS_25TH', 'MONTH_END_BANK_TRANSFER', 'AFTER_30_DAYS_BANK_TRANSFER', 'AFTER_45_DAYS_BANK_TRANSFER', 'BANK_TRANSFER', 'CREDIT_CARD'] as const;

export interface SettlementItem { id: string; contractId: string; type: SettlementItemType; amount: number; date: string; status: SettlementStatus; description?: string; }

export type OverdueCaseType = 'RENTAL_FEE_OVERDUE' | 'DEPOSIT_DEDUCTED' | 'CONTRACT_TERMINATED' | 'CERTIFIED_MAIL';
export const OVERDUE_CASE_TYPES = ['RENTAL_FEE_OVERDUE', 'DEPOSIT_DEDUCTED', 'CONTRACT_TERMINATED', 'CERTIFIED_MAIL'] as const;

export interface OverdueRecord { id: string; contractId: string; accumulatedOverdueFee: number; lastNotificationDate?: string; notificationHistory: OverdueCaseType[]; }