import {
  SecretsManagerClient,
  GetSecretValueCommand,
  CreateSecretCommand,
  UpdateSecretCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-secrets-manager';

import { config } from '../../../config/index.js';
import { AppError } from '../../../shared/errors.js';
import { logger } from '../../../shared/logger.js';

export class SecretsManagerService {
  private client: SecretsManagerClient;
  private prefix: string;
  private cache: Map<string, { value: string; expiresAt: number }>;
  private cacheTtlMs: number;

  constructor() {
    const clientConfig: Record<string, unknown> = {
      region: config.aws.region,
    };

    if (config.secretsManager.endpoint) {
      clientConfig.endpoint = config.secretsManager.endpoint;
    }

    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      };
    }

    this.client = new SecretsManagerClient(clientConfig);
    this.prefix = config.secretsManager.prefix;
    this.cache = new Map();
    this.cacheTtlMs = 5 * 60 * 1000; // 5 minutes cache

    logger.info({ prefix: this.prefix }, 'SecretsManagerService initialized');
  }

  /**
   * Get a secret value by name. Uses in-memory cache to reduce API calls.
   */
  async getSecret(secretName: string, useCache = true): Promise<string> {
    const fullName = this.buildSecretName(secretName);

    // Check cache
    if (useCache) {
      const cached = this.cache.get(fullName);
      if (cached && cached.expiresAt > Date.now()) {
        logger.debug({ secretName: fullName }, 'SecretsManager cache hit');
        return cached.value;
      }
    }

    try {
      const command = new GetSecretValueCommand({
        SecretId: fullName,
      });

      const response = await this.client.send(command);
      const secretValue = response.SecretString || '';

      // Update cache
      this.cache.set(fullName, {
        value: secretValue,
        expiresAt: Date.now() + this.cacheTtlMs,
      });

      logger.info({ secretName: fullName }, 'SecretsManager secret retrieved');
      return secretValue;
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException || error.name === 'ResourceNotFoundException') {
        logger.warn({ secretName: fullName }, 'Secret not found');
        throw AppError.notFound(`Secret not found: ${secretName}`);
      }
      if (error.name === 'AccessDeniedException') {
        logger.error({ secretName: fullName }, 'SecretsManager access denied');
        throw AppError.forbidden('Access denied to secret');
      }
      logger.error({ error, secretName: fullName }, 'SecretsManager getSecret failed');
      throw AppError.internal(`SecretsManager get failed: ${error.message}`);
    }
  }

  /**
   * Get a secret and parse it as JSON.
   */
  async getSecretJSON<T = Record<string, unknown>>(secretName: string, useCache = true): Promise<T> {
    const value = await this.getSecret(secretName, useCache);
    try {
      return JSON.parse(value) as T;
    } catch {
      throw AppError.internal(`Secret ${secretName} is not valid JSON`);
    }
  }

  /**
   * Create a new secret.
   */
  async createSecret(secretName: string, secretValue: string | object, description?: string): Promise<string> {
    const fullName = this.buildSecretName(secretName);
    const value = typeof secretValue === 'string' ? secretValue : JSON.stringify(secretValue);

    try {
      const command = new CreateSecretCommand({
        Name: fullName,
        SecretString: value,
        Description: description || `AI Career Platform secret: ${secretName}`,
      });

      const response = await this.client.send(command);
      logger.info({ secretName: fullName, arn: response.ARN }, 'SecretsManager secret created');

      return response.ARN || '';
    } catch (error: any) {
      if (error.name === 'ResourceExistsException') {
        throw AppError.conflict(`Secret already exists: ${secretName}`);
      }
      logger.error({ error, secretName: fullName }, 'SecretsManager createSecret failed');
      throw AppError.internal(`SecretsManager create failed: ${error.message}`);
    }
  }

  /**
   * Update an existing secret's value.
   */
  async updateSecret(secretName: string, secretValue: string | object): Promise<void> {
    const fullName = this.buildSecretName(secretName);
    const value = typeof secretValue === 'string' ? secretValue : JSON.stringify(secretValue);

    try {
      const command = new UpdateSecretCommand({
        SecretId: fullName,
        SecretString: value,
      });

      await this.client.send(command);

      // Invalidate cache
      this.cache.delete(fullName);

      logger.info({ secretName: fullName }, 'SecretsManager secret updated');
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException || error.name === 'ResourceNotFoundException') {
        throw AppError.notFound(`Secret not found: ${secretName}`);
      }
      logger.error({ error, secretName: fullName }, 'SecretsManager updateSecret failed');
      throw AppError.internal(`SecretsManager update failed: ${error.message}`);
    }
  }

  /**
   * Invalidate cached secret value.
   */
  invalidateCache(secretName?: string): void {
    if (secretName) {
      this.cache.delete(this.buildSecretName(secretName));
    } else {
      this.cache.clear();
    }
  }

  private buildSecretName(name: string): string {
    if (name.startsWith(this.prefix)) return name;
    return this.prefix ? `${this.prefix}/${name}` : name;
  }
}

export const secretsManagerService = new SecretsManagerService();
