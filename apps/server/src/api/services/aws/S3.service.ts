import crypto from 'crypto';

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { config } from '../../../config/index.js';
import { logger } from '../../../shared/logger.js';

export class S3Service {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = config.aws.s3BucketName;
    
    // Only initialize with credentials if they exist, else let AWS SDK use default provider chain (IAM role, ~/.aws/credentials)
    const clientConfig: any = { region: config.aws.region };
    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      };
    }
    
    this.client = new S3Client(clientConfig);
  }

  /**
   * Uploads a file buffer to S3 and returns the Object Key.
   */
  async uploadFile(userId: string, originalName: string, buffer: Buffer, mimetype: string): Promise<string> {
    try {
      const extension = originalName.split('.').pop() || 'pdf';
      const fileKey = `resumes/${userId}/${crypto.randomUUID()}.${extension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: buffer,
        ContentType: mimetype,
      });

      await this.client.send(command);
      logger.info(`Successfully uploaded ${fileKey} to S3 bucket ${this.bucketName}`);
      return fileKey;
    } catch (error) {
      logger.error('S3 Upload Failed', error);
      throw new Error('Failed to securely store document in S3');
    }
  }

  /**
   * Generates a pre-signed URL to securely access a private S3 object.
   * URL expires in 1 hour.
   */
  async getPresignedUrl(fileKey: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn: 3600 });
      return url;
    } catch (error) {
      logger.error(`Failed to generate presigned URL for ${fileKey}`, error);
      throw new Error('Failed to generate secure document link');
    }
  }
}

export const s3Service = new S3Service();
