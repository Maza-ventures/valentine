// Define user roles
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  FUND_MANAGER = "FUND_MANAGER",
  ANALYST = "ANALYST",
  READ_ONLY = "READ_ONLY",
  USER = "USER"
}

// Define task status
export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  CANCELED = "CANCELED"
}

// Define task priority
export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT"
}

// Define capital call status
export enum CapitalCallStatus {
  PENDING = "PENDING",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  FULLY_PAID = "FULLY_PAID",
  OVERDUE = "OVERDUE"
}

// Define payment status
export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  LATE = "LATE"
}

// User type
export interface User {
  id: string;
  name?: string | null;
  email: string;
  role: UserRole;
  image?: string | null;
}

// Session type
export interface Session {
  user: User;
  expires: string;
}
