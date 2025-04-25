import { db } from "./index";
import * as schema from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    console.log("🌱 Starting database seeding...");

    // Create admin user if it doesn't exist
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, "admin")
    });

    if (!existingAdmin) {
      const hashedPassword = await hashPassword("Admin123");
      const [admin] = await db.insert(schema.users).values({
        username: "admin",
        password: hashedPassword
      }).returning();
      
      console.log(`👤 Created admin user: ${admin.username}`);
    } else {
      console.log("👤 Admin user already exists");
    }

    // Add sample clients
    const sampleClients = [
      {
        name: "Acme Corporation",
        email: "contact@acme.com",
        description: "Global manufacturer of innovative products",
        uniqueId: "acme-corp-28fde9a12b34cd56",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastAccessed: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        name: "Globex Corporation",
        email: "info@globex.com",
        description: "International technology and innovation",
        uniqueId: "globex-corp-7a9bc8d12e34f5",
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        lastAccessed: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        name: "Soylent Corp",
        email: "support@soylent.com",
        description: "Sustainable food solutions provider",
        uniqueId: "soylent-corp-3e41f5d67a9b0c",
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        lastAccessed: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      }
    ];

    // Check if clients already exist
    const existingClients = await db.query.clients.findMany();
    
    if (existingClients.length === 0) {
      // Insert clients
      const insertedClients = await db.insert(schema.clients).values(sampleClients).returning();
      console.log(`👥 Added ${insertedClients.length} sample clients`);

      // Add sample photos for Acme Corporation
      const acmeClient = insertedClients.find(client => client.name === "Acme Corporation");
      if (acmeClient) {
        const acmePhotos = [
          {
            clientId: acmeClient.id,
            title: "Product Showcase 1",
            description: "High resolution product photography",
            url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJvZHVjdCUyMHBob3RvZ3JhcGh5fGVufDB8fDB8fHww",
            filename: "product-showcase-1.jpg",
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
          },
          {
            clientId: acmeClient.id,
            title: "Product Showcase 2",
            description: "Lifestyle presentation of your product",
            url: "https://images.unsplash.com/photo-1624913503273-5f9c4e980dba?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8cHJvZHVjdCUyMHBob3RvZ3JhcGh5fGVufDB8fDB8fHww",
            filename: "product-showcase-2.jpg",
            createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
          },
          {
            clientId: acmeClient.id,
            title: "Product Showcase 3",
            description: "Detailed close-up shots",
            url: "https://images.unsplash.com/photo-1588600878108-578031aa6e5f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHByb2R1Y3QlMjBwaG90b2dyYXBoeXxlbnwwfHwwfHx8MA%3D%3D",
            filename: "product-showcase-3.jpg",
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
          }
        ];
        
        await db.insert(schema.photos).values(acmePhotos);
        console.log(`📸 Added sample photos for ${acmeClient.name}`);

        // Add sample videos for Acme Corporation
        const acmeVideos = [
          {
            clientId: acmeClient.id,
            title: "Product Demo Video",
            description: "Complete walkthrough of product features",
            youtubeUrl: "dQw4w9WgXcQ",
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          }
        ];
        
        await db.insert(schema.videos).values(acmeVideos);
        console.log(`🎥 Added sample videos for ${acmeClient.name}`);
      }

      // Add sample photos for Globex Corporation
      const globexClient = insertedClients.find(client => client.name === "Globex Corporation");
      if (globexClient) {
        const globexPhotos = [
          {
            clientId: globexClient.id,
            title: "Product Close-up",
            description: "Detailed product photography",
            url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fHByb2R1Y3QlMjBwaG90b2dyYXBoeXxlbnwwfHwwfHx8MA%3D%3D",
            filename: "product-close-up.jpg",
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          }
        ];
        
        await db.insert(schema.photos).values(globexPhotos);
        console.log(`📸 Added sample photos for ${globexClient.name}`);

        // Add sample videos for Globex Corporation
        const globexVideos = [
          {
            clientId: globexClient.id,
            title: "Brand Story",
            description: "The story behind our collaboration",
            youtubeUrl: "9bZkp7q19f0",
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
          }
        ];
        
        await db.insert(schema.videos).values(globexVideos);
        console.log(`🎥 Added sample videos for ${globexClient.name}`);
      }
      
      // Add sample videos for Soylent Corp
      const soylentClient = insertedClients.find(client => client.name === "Soylent Corp");
      if (soylentClient) {
        const soylentVideos = [
          {
            clientId: soylentClient.id,
            title: "Product Tutorial",
            description: "How to use our products effectively",
            youtubeUrl: "HmZKgaHa3Fg",
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
          }
        ];
        
        await db.insert(schema.videos).values(soylentVideos);
        console.log(`🎥 Added sample videos for ${soylentClient.name}`);
      }
    } else {
      console.log("👥 Sample clients already exist");
    }

    console.log("✅ Database seeding completed");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

seed();
