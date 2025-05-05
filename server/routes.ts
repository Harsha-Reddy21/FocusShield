import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertBlockedSiteSchema, insertSessionSchema, updateSessionSchema, insertTimerSettingsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Blocklist routes
  app.get("/api/blocklist", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const userId = req.user.id;
      const blockedSites = await storage.getBlockedSites(userId);
      res.json(blockedSites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blocklist" });
    }
  });

  app.post("/api/blocklist", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const userId = req.user.id;
      const parsedData = insertBlockedSiteSchema.parse({ ...req.body, userId });
      
      // Check if site already exists
      const existingSites = await storage.getBlockedSites(userId);
      const domainExists = existingSites.some(site => site.domain === parsedData.domain);
      
      if (domainExists) {
        return res.status(400).json({ message: "Site already in blocklist" });
      }
      
      const newSite = await storage.addBlockedSite(parsedData);
      res.status(201).json(newSite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add site to blocklist" });
    }
  });

  app.delete("/api/blocklist/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const userId = req.user.id;
      const siteId = parseInt(req.params.id);
      
      if (isNaN(siteId)) {
        return res.status(400).json({ message: "Invalid site ID" });
      }
      
      const removed = await storage.removeBlockedSite(siteId, userId);
      
      if (removed) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Site not found or unauthorized" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to remove site from blocklist" });
    }
  });
  
  // Timer settings routes
  app.get("/api/timer-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const userId = req.user.id;
      let settings = await storage.getTimerSettings(userId);
      
      // Create default settings if none exist
      if (!settings) {
        settings = await storage.createTimerSettings({
          userId,
          workDuration: 25,
          breakDuration: 5,
          longBreakDuration: 15,
          sessionsBeforeLongBreak: 4,
          soundEnabled: true,
          notificationsEnabled: true,
        });
      }
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch timer settings" });
    }
  });

  app.put("/api/timer-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const userId = req.user.id;
      
      // Validate settings
      const parsedData = insertTimerSettingsSchema.partial().parse({ ...req.body, userId });
      
      // Check if settings exist, create if not
      let settings = await storage.getTimerSettings(userId);
      
      if (!settings) {
        settings = await storage.createTimerSettings({
          userId,
          workDuration: parsedData.workDuration || 25,
          breakDuration: parsedData.breakDuration || 5,
          longBreakDuration: parsedData.longBreakDuration || 15,
          sessionsBeforeLongBreak: parsedData.sessionsBeforeLongBreak || 4,
          soundEnabled: parsedData.soundEnabled !== undefined ? parsedData.soundEnabled : true,
          notificationsEnabled: parsedData.notificationsEnabled !== undefined ? parsedData.notificationsEnabled : true,
        });
      } else {
        settings = await storage.updateTimerSettings(userId, parsedData);
      }
      
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update timer settings" });
    }
  });
  
  // Session routes
  app.post("/api/sessions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const userId = req.user.id;
      const parsedData = insertSessionSchema.parse({ ...req.body, userId });
      
      const session = await storage.createSession(parsedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.put("/api/sessions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const sessionId = parseInt(req.params.id);
      
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      // Get the session to verify ownership
      const session = await storage.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to update this session" });
      }
      
      const parsedData = updateSessionSchema.partial().parse(req.body);
      const updatedSession = await storage.updateSession(sessionId, parsedData);
      
      res.json(updatedSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  app.get("/api/sessions", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const sessions = await storage.getUserSessions(userId, limit);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const userId = req.user.id;
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      
      const stats = await storage.getSessionStats(userId, days);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session stats" });
    }
  });

  app.get("/api/sessions/today", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const userId = req.user.id;
      const allSessions = await storage.getUserSessions(userId);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaysSessions = allSessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate >= today;
      });
      
      const completedWorkSessions = todaysSessions.filter(s => s.type === 'work' && s.completed).length;
      const totalFocusTime = todaysSessions
        .filter(s => s.type === 'work' && s.duration)
        .reduce((sum, s) => sum + (s.duration || 0), 0);
      
      res.json({
        sessions: todaysSessions,
        summary: {
          completedSessions: completedWorkSessions,
          totalFocusTimeSeconds: totalFocusTime,
          totalFocusTimeMinutes: Math.round(totalFocusTime / 60),
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's sessions" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
