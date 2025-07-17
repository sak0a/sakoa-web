// Core type definitions for TF2 Dodgeball Server

// ===== PLAYER & LEADERBOARD TYPES =====

export interface Player {
  steamid: string;
  name: string;
  kills: number;
  deaths: number;
  kd_ratio: number;
  lastLogout: number;
  firstLogin: number;
  lastLogin: number;
  playtime: number;
  playtimeHours: number;
  points: number;
  topspeed: number;
  deflections: number;
  rank?: number;
  lastLoginDate?: string;
  firstLoginDate?: string;
}

export interface LeaderboardQuery {
  sortBy?: 'topspeed' | 'points' | 'playtime' | 'kills' | 'deaths';
  order?: 'asc' | 'desc';
  limit?: number;
  season?: number;
}

export interface LeaderboardResponse {
  success: boolean;
  error?: string;
  data: {
    players: Player[];
    sortBy: string;
    order: string;
    total: number;
  };
}

// ===== DONOR TYPES =====

export interface Donation {
  amount: number;
  date: string;
  added_date?: number;
  added_by?: string;
  notes?: string;
}

export interface Donor {
  name?: string; // For backward compatibility
  display_name: string;
  tier: string; // Allow any custom tier
  donations?: Donation[];
  amount: number;
  total_amount?: number;
  steamid: string; // Steam3 format [U:1:XXXXXXX]
  show_on_website: boolean;
  expiry_date?: number;
  added_date?: number;
  added_by?: string;
  donationCount?: number;
  donation_count?: number;
  firstDonation?: string;
  lastDonation?: string;
}

export interface DonorsData {
  donors: Donor[];
  cached?: boolean;
  timestamp?: string;
  source?: string;
  error?: string;
}

// Database-specific donor types
export interface DbDonor {
  steamid: string;
  display_name: string;
  tier: string;
  show_on_website: boolean;
  expiry_date: number;
  added_date: number;
  added_by: string;
  donations: DbDonation[];
  total_amount: number;
}

export interface DbDonation {
  amount: number;
  donation_date: string;
  added_date: number;
  added_by: string;
  notes?: string;
}

// ===== CHATBOT TYPES =====

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: number;
  isUser: boolean;
}

export interface ChatbotResponse {
  success: boolean;
  response: string;
  suggestions?: string[];
  error?: string;
}

// ===== SERVER TYPES =====

export interface ServerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  location: string;
  connectUrl: string;
  comingSoon: boolean;
}

export interface ServerPlayer {
  name: string;
  score: number;
  time: number;
}

export interface ServerStatus {
  id: string;
  status: 'online' | 'offline';
  name: string;
  map: string;
  maxplayers: number;
  players: ServerPlayer[];
  location: string;
  connectUrl: string;
  comingSoon: boolean;
  error?: string;
}

export interface ServersData {
  servers: ServerConfig[];
}

export interface ServerStatusResponse {
  servers: ServerStatus[];
}

// ===== SEASON TYPES =====

export interface SeasonConfig {
  startDay: number;
  referenceYear: number;
  referenceMonth: number;
}

export interface SeasonDateRange {
  startDate: Date;
  endDate: Date;
  seasonNumber: number;
}

export interface Season {
  seasonNumber: number;
  name: string;
  displayName: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  tableName: string;
  dateRange: string;
}

export interface SeasonsResponse {
  success: boolean;
  error?: string;
  data: {
    seasons: Season[];
    currentSeason: number;
    total: number;
  };
}

// ===== SETTINGS TYPES =====

export interface MaintenanceSettings {
  enabled: boolean;
  title?: string;
  message?: string;
  estimatedTime?: string;
  lastUpdated?: string;
}

export interface DiscordSettings {
  inviteUrl: string;
  lastUpdated?: string;
}

export interface SeasonSettings {
  startYear: number;
  startMonth: number;
  startDay: number;
  lastUpdated?: string;
}

export interface Settings {
  maintenance: MaintenanceSettings;
  discord: DiscordSettings;
  seasons: SeasonSettings;
}

export interface PublicSettings {
  discord: {
    inviteUrl: string;
  };
  maintenance: {
    enabled: boolean;
  };
}

// ===== API RESPONSE TYPES =====

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface AuthResponse {
  success: boolean;
  authenticated?: boolean;
  message?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ===== STEAMID TYPES =====

export interface SteamIdValidationResult {
  valid: boolean;
  steamID64: string | null;
  error: string | null;
}

export interface SteamIdExamples {
  steamID64: string;
  steamID3: string;
  legacy: string;
}

// ===== DATABASE TYPES =====

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  charset: string;
  timezone: string;
}

export interface QueryResult<T = any> {
  rows: T[];
  fields: any[];
}

export interface DatabaseConnectionInfo {
  host: string;
  port: number;
  user: string;
  database: string;
  status: 'connected' | 'disconnected' | 'failed';
  timestamp: string;
}

export interface DatabaseError {
  message: string;
  code?: string;
  errno?: number;
  sqlState?: string;
  timestamp: string;
}

export interface DatabaseTestResult {
  success: boolean;
  connection: DatabaseConnectionInfo;
  error?: DatabaseError;
}

export interface DatabaseRetryResult {
  success: boolean;
  message: string;
  connection: DatabaseConnectionInfo;
  error?: DatabaseError;
}

export interface DatabaseStatus {
  connected: boolean;
  connection: DatabaseConnectionInfo;
  error?: DatabaseError;
}

export interface DatabaseApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: {
    message: string;
    details: string;
    timestamp: string;
  };
}

export interface DatabaseConfigInfo {
  host: string;
  port: number;
  user: string;
  database: string;
  passwordSet: boolean;
}

export interface DatabaseReloadResult {
  success: boolean;
  message: string;
  connection: DatabaseConnectionInfo;
  config: DatabaseConfigInfo;
  error?: DatabaseError;
}

// ===== CACHE TYPES =====

export interface CacheEntry {
  key: string;
  timestamp: number;
  expiresAt: number;
  ttlRemaining: number;
  isExpired: boolean;
  dataSize: number;
}

export interface CacheStats {
  totalEntries: number;
  entries: CacheEntry[];
  memoryUsage: number;
}

export interface CacheSettings {
  serverStatusInterval: number;
  leaderboardInterval: number;
  playerSearchInterval: number;
  seasonalLeaderboardInterval: number;
  databaseStatusInterval: number;
  lastUpdated?: string;
}

export interface CacheApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: {
    message: string;
    details: string;
    timestamp: string;
  };
}

// ===== ADMIN TYPES =====

export interface AdminState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface FileManagerData {
  fileType: 'donors' | 'servers';
  data: string;
}

// ===== UTILITY TYPES =====

export type SortOrder = 'asc' | 'desc';
export type DonorTier = 'VIP' | 'Supporter' | 'Premium' | 'Elite';
export type ServerStatusType = 'online' | 'offline';
export type LeaderboardSortField = 'topspeed' | 'points' | 'playtime' | 'kills' | 'deaths';

// ===== CONSTANTS =====

export const VALID_SORT_FIELDS: LeaderboardSortField[] = ['topspeed', 'points', 'playtime', 'kills', 'deaths'];
export const VALID_DONOR_TIERS: DonorTier[] = ['VIP', 'Supporter', 'Premium', 'Elite'];
export const DEFAULT_LEADERBOARD_LIMIT = 50;
export const MAX_LEADERBOARD_LIMIT = 50;
