import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '@/utils/logger';
import { config } from '@/config/app.config';

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
    this.bucketName = config.aws.s3.bucketName;
  }

  async uploadFile(
    key: string,
    file: Buffer,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        Metadata: metadata,
      });

      await this.s3Client.send(command);
      logger.info(`File uploaded successfully: ${key}`);

      return `https://${this.bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;
    } catch (error) {
      logger.error('Error uploading file to S3:', error);
      throw new Error('Failed to upload file');
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });
      return signedUrl;
    } catch (error) {
      logger.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      logger.info(`File deleted successfully: ${key}`);
    } catch (error) {
      logger.error('Error deleting file from S3:', error);
      throw new Error('Failed to delete file');
    }
  }

  async uploadImage(
    file: Buffer,
    filename: string,
    folder: string = 'images'
  ): Promise<string> {
    const key = `${folder}/${Date.now()}-${filename}`;
    return this.uploadFile(key, file, 'image/jpeg');
  }

  async uploadDocument(
    file: Buffer,
    filename: string,
    contentType: string,
    folder: string = 'documents'
  ): Promise<string> {
    const key = `${folder}/${Date.now()}-${filename}`;
    return this.uploadFile(key, file, contentType);
  }
}

export const s3Service = new S3Service();
