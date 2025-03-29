import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PrismaClient, User, UserRole } from '@prisma/client';

const prisma = new PrismaClient();
const CONFIG_DIR = path.join(os.homedir(), '.valentine');
const AUTH_FILE = path.join(CONFIG_DIR, 'auth.json');

// Mock users for development
const mockUsers = [
  {
    id: "super-admin",
    name: "Super Admin",
    email: "admin@valentine.vc",
    role: UserRole.SUPER_ADMIN,
  },
  {
    id: "fund-manager",
    name: "Fund Manager",
    email: "manager@valentine.vc",
    role: UserRole.FUND_MANAGER,
  },
  {
    id: "analyst",
    name: "Investment Analyst",
    email: "analyst@valentine.vc",
    role: UserRole.ANALYST,
  },
  {
    id: "readonly",
    name: "Read Only User",
    email: "readonly@valentine.vc",
    role: UserRole.READ_ONLY,
  },
];

interface AuthData {
  email: string;
  token?: string;
}

// Ensure config directory exists
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

// Save auth data
export function saveAuthData(data: AuthData): void {
  ensureConfigDir();
  fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2));
}

// Load auth data
export function loadAuthData(): AuthData | null {
  ensureConfigDir();
  if (!fs.existsSync(AUTH_FILE)) {
    return null;
  }

  try {
    const data = fs.readFileSync(AUTH_FILE, 'utf8');
    return JSON.parse(data) as AuthData;
  } catch (error) {
    console.error('Error loading auth data:', error);
    return null;
  }
}

// Clear auth data
export function clearAuthData(): void {
  if (fs.existsSync(AUTH_FILE)) {
    fs.unlinkSync(AUTH_FILE);
  }
}

// Get authenticated user
export async function getAuthenticatedUser(): Promise<User | null> {
  const authData = loadAuthData();
  
  if (!authData) {
    console.error('Not authenticated. Please login first with: vc-cli auth login');
    return null;
  }

  try {
    // For development, check mock users first
    const mockUser = mockUsers.find(user => user.email === authData.email);
    if (mockUser) {
      return mockUser as User;
    }

    // Check database
    const user = await prisma.user.findUnique({
      where: { email: authData.email },
    });

    if (!user) {
      console.error('User not found. Please login again.');
      clearAuthData();
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}
