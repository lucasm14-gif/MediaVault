import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { isAuthenticated } from "./auth";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { upload, getUploadedFileUrl, setupUploadRoutes } from "./multer";
import { generateUniqueId } from "../client/src/lib/utils";
import { db } from "@db";
import { 
  clients, 
  photos, 
  videos, 
  insertClientSchema, 
  insertPhotoSchema, 
  insertVideoSchema 
} from "@shared/schema";
import { eq, count, desc, and } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Setup routes to serve uploaded files
  setupUploadRoutes(app);

  // ===== Dashboard API Routes =====
  
  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      // Get client count
      const [clientCountResult] = await db.select({ 
        count: count() 
      }).from(clients);
      
      // Get photo count
      const [photoCountResult] = await db.select({ 
        count: count() 
      }).from(photos);
      
      // Get video count
      const [videoCountResult] = await db.select({ 
        count: count() 
      }).from(videos);
      
      // Calculate total views (could be a separate table in a real app)
      // For now, using mock data as this is just a counter
      const totalViews = 2845;
      
      res.json({
        clientCount: clientCountResult.count,
        photoCount: photoCountResult.count,
        videoCount: videoCountResult.count,
        totalViews: totalViews
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });
  
  // Recent activity
  app.get("/api/dashboard/activity", isAuthenticated, async (req, res) => {
    try {
      // Fetch recent photos
      const recentPhotos = await db.select({
        id: photos.id,
        title: photos.title,
        clientId: photos.clientId,
        createdAt: photos.createdAt
      })
      .from(photos)
      .orderBy(desc(photos.createdAt))
      .limit(5);
      
      // Fetch recent videos
      const recentVideos = await db.select({
        id: videos.id,
        title: videos.title,
        clientId: videos.clientId,
        createdAt: videos.createdAt
      })
      .from(videos)
      .orderBy(desc(videos.createdAt))
      .limit(5);
      
      // Fetch recent clients
      const recentClients = await db.select({
        id: clients.id,
        name: clients.name,
        createdAt: clients.createdAt
      })
      .from(clients)
      .orderBy(desc(clients.createdAt))
      .limit(5);
      
      // Combine and format activities
      const activities = [
        ...recentPhotos.map(photo => ({
          type: "photo",
          title: "New photo uploaded",
          description: `Added to ${photo.clientId ? "client repository" : "unknown repository"}`,
          createdAt: photo.createdAt
        })),
        ...recentVideos.map(video => ({
          type: "video",
          title: "New video embedded",
          description: `Added to ${video.clientId ? "client repository" : "unknown repository"}`,
          createdAt: video.createdAt
        })),
        ...recentClients.map(client => ({
          type: "client",
          title: "New client added",
          description: `Added ${client.name} to your clients`,
          createdAt: client.createdAt
        }))
      ];
      
      // Sort by most recent first
      activities.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Return the 10 most recent activities
      res.json(activities.slice(0, 10));
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });
  
  // Recent client access
  app.get("/api/dashboard/access", isAuthenticated, async (req, res) => {
    try {
      // Get clients with their last accessed date
      const clientsWithAccess = await db.select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        uniqueId: clients.uniqueId,
        lastAccessed: clients.lastAccessed
      })
      .from(clients)
      .orderBy(desc(clients.lastAccessed))
      .limit(10);
      
      // Format the response
      const recentAccess = clientsWithAccess.map(client => ({
        accessedAt: client.lastAccessed,
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          uniqueId: client.uniqueId
        }
      }));
      
      res.json(recentAccess);
    } catch (error) {
      console.error("Error fetching recent access:", error);
      res.status(500).json({ message: "Failed to fetch recent access" });
    }
  });

  // ===== Client API Routes =====
  
  // Get all clients
  app.get("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const allClients = await db.select().from(clients).orderBy(desc(clients.createdAt));
      
      // Get photo and video counts for each client
      const clientsWithCounts = await Promise.all(
        allClients.map(async (client) => {
          // Count photos
          const [photoCount] = await db.select({ count: count() })
            .from(photos)
            .where(eq(photos.clientId, client.id));
          
          // Count videos
          const [videoCount] = await db.select({ count: count() })
            .from(videos)
            .where(eq(videos.clientId, client.id));
          
          return {
            ...client,
            photosCount: photoCount.count,
            videosCount: videoCount.count
          };
        })
      );
      
      res.json(clientsWithCounts);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });
  
  // Get client by ID (admin only)
  app.get("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      
      const client = await db.select()
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1);
      
      if (!client.length) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client[0]);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });
  
  // Get client by unique ID (public)
  app.get("/api/clients/public/:uniqueId", async (req, res) => {
    try {
      const uniqueId = req.params.uniqueId;
      
      const client = await db.select()
        .from(clients)
        .where(eq(clients.uniqueId, uniqueId))
        .limit(1);
      
      if (!client.length) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Update last accessed timestamp
      await db.update(clients)
        .set({ lastAccessed: new Date() })
        .where(eq(clients.id, client[0].id));
      
      // Return client info
      res.json(client[0]);
    } catch (error) {
      console.error("Error fetching client by unique ID:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });
  
  // Create client
  app.post("/api/clients", isAuthenticated, async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertClientSchema.parse(req.body);
      
      // Generate a unique ID for client repository access
      const uniqueId = generateUniqueId(24);
      
      // Insert client
      const [newClient] = await db.insert(clients)
        .values({
          ...validatedData,
          uniqueId,
          createdAt: new Date(),
          lastAccessed: null
        })
        .returning();
      
      res.status(201).json(newClient);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });
  
  // Update client
  app.put("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const validatedData = insertClientSchema.parse(req.body);
      
      const [updatedClient] = await db.update(clients)
        .set(validatedData)
        .where(eq(clients.id, clientId))
        .returning();
      
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(updatedClient);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });
  
  // Delete client
  app.delete("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      
      // Delete all associated photos and videos first
      await db.delete(photos).where(eq(photos.clientId, clientId));
      await db.delete(videos).where(eq(videos.clientId, clientId));
      
      // Delete the client
      const [deletedClient] = await db.delete(clients)
        .where(eq(clients.id, clientId))
        .returning();
      
      if (!deletedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // ===== Photo API Routes =====
  
  // Get all photos
  app.get("/api/photos", isAuthenticated, async (req, res) => {
    try {
      const allPhotos = await db.select()
        .from(photos)
        .orderBy(desc(photos.createdAt));
      
      res.json(allPhotos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });
  
  // Get photos by client unique ID (public)
  app.get("/api/clients/:uniqueId/photos", async (req, res) => {
    try {
      const uniqueId = req.params.uniqueId;
      
      // Get client ID from unique ID
      const client = await db.select({ id: clients.id })
        .from(clients)
        .where(eq(clients.uniqueId, uniqueId))
        .limit(1);
      
      if (!client.length) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const clientId = client[0].id;
      
      // Get photos for this client
      const clientPhotos = await db.select()
        .from(photos)
        .where(eq(photos.clientId, clientId))
        .orderBy(desc(photos.createdAt));
      
      res.json(clientPhotos);
    } catch (error) {
      console.error("Error fetching client photos:", error);
      res.status(500).json({ message: "Failed to fetch client photos" });
    }
  });
  
  // Upload photos
  app.post("/api/photos", isAuthenticated, upload.array("photos", 10), async (req, res) => {
    try {
      const { title, description, clientId } = req.body;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No photos uploaded" });
      }
      
      const uploadedPhotos = [];
      
      // Process each uploaded file
      for (const file of files) {
        // Create a URL for the uploaded file
        const url = getUploadedFileUrl(req, file.filename);
        
        // Validate and insert photo data
        const photoData = {
          title,
          description: description || "",
          clientId: parseInt(clientId),
          url,
          filename: file.filename,
          createdAt: new Date()
        };
        
        const validatedData = insertPhotoSchema.parse(photoData);
        
        // Insert into database
        const [newPhoto] = await db.insert(photos)
          .values(validatedData)
          .returning();
        
        uploadedPhotos.push(newPhoto);
      }
      
      res.status(201).json(uploadedPhotos);
    } catch (error) {
      console.error("Error uploading photos:", error);
      res.status(500).json({ message: "Failed to upload photos" });
    }
  });
  
  // Delete photo
  app.delete("/api/photos/:id", isAuthenticated, async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      
      const [deletedPhoto] = await db.delete(photos)
        .where(eq(photos.id, photoId))
        .returning();
      
      if (!deletedPhoto) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      // Note: In a production system, you would also delete the file from storage
      
      res.json({ message: "Photo deleted successfully" });
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // ===== Video API Routes =====
  
  // Get all videos
  app.get("/api/videos", isAuthenticated, async (req, res) => {
    try {
      const allVideos = await db.select()
        .from(videos)
        .orderBy(desc(videos.createdAt));
      
      res.json(allVideos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });
  
  // Get videos by client unique ID (public)
  app.get("/api/clients/:uniqueId/videos", async (req, res) => {
    try {
      const uniqueId = req.params.uniqueId;
      
      // Get client ID from unique ID
      const client = await db.select({ id: clients.id })
        .from(clients)
        .where(eq(clients.uniqueId, uniqueId))
        .limit(1);
      
      if (!client.length) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const clientId = client[0].id;
      
      // Get videos for this client
      const clientVideos = await db.select()
        .from(videos)
        .where(eq(videos.clientId, clientId))
        .orderBy(desc(videos.createdAt));
      
      res.json(clientVideos);
    } catch (error) {
      console.error("Error fetching client videos:", error);
      res.status(500).json({ message: "Failed to fetch client videos" });
    }
  });
  
  // Create video (YouTube embed)
  app.post("/api/videos", isAuthenticated, async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertVideoSchema.parse({
        ...req.body,
        createdAt: new Date()
      });
      
      // Insert video
      const [newVideo] = await db.insert(videos)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newVideo);
    } catch (error) {
      console.error("Error creating video:", error);
      res.status(500).json({ message: "Failed to create video" });
    }
  });
  
  // Delete video
  app.delete("/api/videos/:id", isAuthenticated, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      
      const [deletedVideo] = await db.delete(videos)
        .where(eq(videos.id, videoId))
        .returning();
      
      if (!deletedVideo) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      res.json({ message: "Video deleted successfully" });
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ message: "Failed to delete video" });
    }
  });

  // ===== Settings API Routes =====
  
  // These routes would be implemented in a real app
  // For now they just return successful responses
  
  app.put("/api/settings/profile", isAuthenticated, (req, res) => {
    res.json({ message: "Profile updated successfully" });
  });
  
  app.put("/api/settings/password", isAuthenticated, (req, res) => {
    res.json({ message: "Password updated successfully" });
  });
  
  app.put("/api/settings/notifications", isAuthenticated, (req, res) => {
    res.json({ message: "Notification preferences updated successfully" });
  });
  
  app.put("/api/settings/system", isAuthenticated, (req, res) => {
    res.json({ message: "System settings updated successfully" });
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
