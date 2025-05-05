import { users, blockedSites, timerSettings, sessions } from "@shared/schema";
import type { User, InsertUser, BlockedSite, InsertBlockedSite, TimerSettings, InsertTimerSettings, Session, InsertSession, UpdateSession } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Blocked sites methods
  getBlockedSites(userId: number): Promise<BlockedSite[]>;
  addBlockedSite(site: InsertBlockedSite): Promise<BlockedSite>;
  removeBlockedSite(id: number, userId: number): Promise<boolean>;
  
  // Timer settings methods
  getTimerSettings(userId: number): Promise<TimerSettings | undefined>;
  createTimerSettings(settings: InsertTimerSettings): Promise<TimerSettings>;
  updateTimerSettings(userId: number, settings: Partial<InsertTimerSettings>): Promise<TimerSettings>;
  
  // Session methods
  createSession(session: InsertSession): Promise<Session>;
  getSession(id: number): Promise<Session | undefined>;
  updateSession(id: number, update: Partial<UpdateSession>): Promise<Session>;
  getUserSessions(userId: number, limit?: number): Promise<Session[]>;
  getSessionStats(userId: number, days?: number): Promise<any>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private blockedSites: Map<number, BlockedSite>;
  private timerSettings: Map<number, TimerSettings>;
  private sessions: Map<number, Session>;
  private currentUserId: number;
  private currentBlockedSiteId: number;
  private currentTimerSettingsId: number;
  private currentSessionId: number;
  sessionStore: session.SessionStore;
  
  constructor() {
    this.users = new Map();
    this.blockedSites = new Map();
    this.timerSettings = new Map();
    this.sessions = new Map();
    this.currentUserId = 1;
    this.currentBlockedSiteId = 1;
    this.currentTimerSettingsId = 1;
    this.currentSessionId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Blocked sites methods
  async getBlockedSites(userId: number): Promise<BlockedSite[]> {
    return Array.from(this.blockedSites.values()).filter(
      (site) => site.userId === userId,
    );
  }
  
  async addBlockedSite(site: InsertBlockedSite): Promise<BlockedSite> {
    const id = this.currentBlockedSiteId++;
    const blockedSite: BlockedSite = { ...site, id };
    this.blockedSites.set(id, blockedSite);
    return blockedSite;
  }
  
  async removeBlockedSite(id: number, userId: number): Promise<boolean> {
    const site = this.blockedSites.get(id);
    if (site && site.userId === userId) {
      return this.blockedSites.delete(id);
    }
    return false;
  }
  
  // Timer settings methods
  async getTimerSettings(userId: number): Promise<TimerSettings | undefined> {
    return Array.from(this.timerSettings.values()).find(
      (settings) => settings.userId === userId,
    );
  }
  
  async createTimerSettings(settings: InsertTimerSettings): Promise<TimerSettings> {
    const id = this.currentTimerSettingsId++;
    const timerSettings: TimerSettings = { ...settings, id };
    this.timerSettings.set(id, timerSettings);
    return timerSettings;
  }
  
  async updateTimerSettings(userId: number, updatedSettings: Partial<InsertTimerSettings>): Promise<TimerSettings> {
    const existingSettings = await this.getTimerSettings(userId);
    
    if (!existingSettings) {
      throw new Error("Timer settings not found");
    }
    
    const updated = {
      ...existingSettings,
      ...updatedSettings,
    };
    
    this.timerSettings.set(existingSettings.id, updated);
    return updated;
  }
  
  // Session methods
  async createSession(sessionData: InsertSession): Promise<Session> {
    const id = this.currentSessionId++;
    const session: Session = {
      ...sessionData,
      id,
      endTime: null,
      duration: null,
      completed: false,
      aborted: false,
      abortReason: null,
      sitesBlocked: 0,
    };
    this.sessions.set(id, session);
    return session;
  }
  
  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }
  
  async updateSession(id: number, update: Partial<UpdateSession>): Promise<Session> {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error("Session not found");
    }
    
    const updatedSession = {
      ...session,
      ...update,
    };
    
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }
  
  async getUserSessions(userId: number, limit?: number): Promise<Session[]> {
    const userSessions = Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => {
        // Sort by start time descending (newest first)
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      });
    
    if (limit) {
      return userSessions.slice(0, limit);
    }
    
    return userSessions;
  }
  
  async getSessionStats(userId: number, days = 7): Promise<any> {
    const userSessions = await this.getUserSessions(userId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentSessions = userSessions.filter(
      session => new Date(session.startTime) >= cutoffDate
    );
    
    // Create daily data map
    const dailyData: Record<string, {
      date: string;
      focusMinutes: number;
      completedSessions: number;
      abortedSessions: number;
    }> = {};
    
    // Initialize days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = {
        date: dateStr,
        focusMinutes: 0,
        completedSessions: 0,
        abortedSessions: 0,
      };
    }
    
    // Fill with actual data
    recentSessions.forEach(session => {
      const dateStr = new Date(session.startTime).toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        if (session.completed) {
          dailyData[dateStr].completedSessions += 1;
        }
        if (session.aborted) {
          dailyData[dateStr].abortedSessions += 1;
        }
        if (session.duration && session.type === 'work') {
          dailyData[dateStr].focusMinutes += Math.round(session.duration / 60);
        }
      }
    });
    
    // Calculate overall stats
    const totalWorkSessions = recentSessions.filter(s => s.type === 'work').length;
    const completedWorkSessions = recentSessions.filter(s => s.type === 'work' && s.completed).length;
    const abortedWorkSessions = recentSessions.filter(s => s.type === 'work' && s.aborted).length;
    const totalFocusTime = recentSessions
      .filter(s => s.type === 'work' && s.duration)
      .reduce((sum, s) => sum + (s.duration || 0), 0);
    
    return {
      dailyData: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)),
      summary: {
        totalWorkSessions,
        completedWorkSessions,
        abortedWorkSessions,
        totalFocusTimeMinutes: Math.round(totalFocusTime / 60),
        completionRate: totalWorkSessions ? Math.round((completedWorkSessions / totalWorkSessions) * 100) : 0,
      }
    };
  }
}

export const storage = new MemStorage();
