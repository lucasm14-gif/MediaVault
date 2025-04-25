import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';
import { randomBytes } from 'crypto';

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with original extension
    const uniqueSuffix = randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

// File filter to only allow image files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Supported types: ${allowedMimeTypes.join(', ')}`));
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
});

// Export a function to get the full path to an uploaded file
export function getUploadedFilePath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}

// Export a function to get the URL for an uploaded file
export function getUploadedFileUrl(req: Request, filename: string): string {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

// Create Express route to serve uploaded files
export function setupUploadRoutes(app: any) {
  app.use('/uploads', (req: Request, res: any, next: any) => {
    // Allow access to uploaded files without authentication
    next();
  }, (req: any, res: any, next: any) => {
    const filePath = path.join(UPLOADS_DIR, req.path);
    res.sendFile(filePath, (err: any) => {
      if (err) {
        // Only pass to next middleware if file not found
        // otherwise send the error response
        if (err.code === 'ENOENT') {
          return next();
        }
        return res.status(500).send('Error serving uploaded file');
      }
    });
  });
}
