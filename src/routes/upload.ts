import { createError } from '@/middleware/errorHandler';
import { s3Service } from '@/services/s3Service';
import { logger } from '@/utils/logger';
import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allow images, documents, and common file types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/json',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// Upload single file
router.post(
  '/single',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw createError.validation('No file uploaded');
      }

      const { originalname, mimetype, buffer } = req.file;
      const folder = req.body.folder || 'uploads';

      const fileUrl = await s3Service.uploadFile(
        `${folder}/${Date.now()}-${originalname}`,
        buffer,
        mimetype,
        {
          originalName: originalname,
          uploadedBy: req.body.userId || 'anonymous',
          uploadedAt: new Date().toISOString(),
        }
      );

      logger.info(`File uploaded successfully: ${originalname}`);

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          fileName: originalname,
          fileUrl,
          fileSize: buffer.length,
          mimeType: mimetype,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Upload multiple files
router.post(
  '/multiple',
  upload.array('files', 5),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.files || req.files.length === 0) {
        throw createError.validation('No files uploaded');
      }

      const files = req.files as unknown as Array<{
        originalname: string;
        mimetype: string;
        buffer: Buffer;
      }>;
      const folder = req.body.folder || 'uploads';
      const uploadedFiles = [];

      for (const file of files) {
        const { originalname, mimetype, buffer } = file;

        const fileUrl = await s3Service.uploadFile(
          `${folder}/${Date.now()}-${originalname}`,
          buffer,
          mimetype,
          {
            originalName: originalname,
            uploadedBy: req.body.userId || 'anonymous',
            uploadedAt: new Date().toISOString(),
          }
        );

        uploadedFiles.push({
          fileName: originalname,
          fileUrl,
          fileSize: buffer.length,
          mimeType: mimetype,
          uploadedAt: new Date().toISOString(),
        });
      }

      logger.info(`${uploadedFiles.length} files uploaded successfully`);

      res.status(201).json({
        success: true,
        message: `${uploadedFiles.length} files uploaded successfully`,
        data: uploadedFiles,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get signed URL for direct upload
router.post(
  '/presigned-url',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileName, contentType, folder = 'uploads' } = req.body;

      if (!fileName || !contentType) {
        throw createError.validation('fileName and contentType are required');
      }

      const key = `${folder}/${Date.now()}-${fileName}`;
      const signedUrl = await s3Service.getSignedUrl(key, 3600); // 1 hour expiry

      res.json({
        success: true,
        data: {
          uploadUrl: signedUrl,
          key,
          expiresIn: 3600,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete file
router.delete(
  '/:key',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.params;

      if (!key) {
        throw createError.validation('File key is required');
      }

      await s3Service.deleteFile(decodeURIComponent(key));

      logger.info(`File deleted successfully: ${key}`);

      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get file info
router.get('/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;

    if (!key) {
      throw createError.validation('File key is required');
    }

    const signedUrl = await s3Service.getSignedUrl(
      decodeURIComponent(key),
      3600
    );

    res.json({
      success: true,
      data: {
        key: decodeURIComponent(key),
        downloadUrl: signedUrl,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as uploadRoutes };
