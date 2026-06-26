import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
  TransactWriteCommand,
  TransactWriteCommandInput,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';

import { config } from '../../../config/index.js';
import { AppError } from '../../../shared/errors.js';
import { logger } from '../../../shared/logger.js';

// Single-table design key patterns
export const KeyPatterns = {
  // User entity
  user: (userId: string) => ({ PK: `USER#${userId}`, SK: `PROFILE` }),
  userEmail: (email: string) => ({ GSI1PK: `EMAIL#${email}`, GSI1SK: `USER` }),

  // Resume entity
  resume: (userId: string, resumeId: string) => ({ PK: `USER#${userId}`, SK: `RESUME#${resumeId}` }),
  resumesByUser: (userId: string) => ({ PK: `USER#${userId}`, SK: 'RESUME#' }),

  // Career matches
  careerMatch: (userId: string, matchId: string) => ({ PK: `USER#${userId}`, SK: `CAREER#${matchId}` }),
  careerMatchesByUser: (userId: string) => ({ PK: `USER#${userId}`, SK: 'CAREER#' }),

  // Chat sessions
  chatSession: (userId: string, sessionId: string) => ({ PK: `USER#${userId}`, SK: `CHAT#${sessionId}` }),
  chatSessionsByUser: (userId: string) => ({ PK: `USER#${userId}`, SK: 'CHAT#' }),

  // Learning roadmaps
  roadmap: (userId: string, roadmapId: string) => ({ PK: `USER#${userId}`, SK: `ROADMAP#${roadmapId}` }),
  roadmapsByUser: (userId: string) => ({ PK: `USER#${userId}`, SK: 'ROADMAP#' }),

  // Session/token storage
  session: (sessionId: string) => ({ PK: `SESSION#${sessionId}`, SK: 'META' }),

  // Analytics events
  analyticsEvent: (userId: string, timestamp: string) => ({ PK: `USER#${userId}`, SK: `EVENT#${timestamp}` }),

  // System config
  systemConfig: (configKey: string) => ({ PK: 'SYSTEM', SK: `CONFIG#${configKey}` }),
} as const;

export interface DynamoDBItem {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  ttl?: number;
  [key: string]: unknown;
}

export class DynamoDBService {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const clientConfig: Record<string, unknown> = {
      region: config.aws.region,
    };

    if (config.dynamodb.endpoint) {
      clientConfig.endpoint = config.dynamodb.endpoint;
    }

    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      };
    }

    const baseClient = new DynamoDBClient(clientConfig);
    this.client = DynamoDBDocumentClient.from(baseClient, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: false,
      },
      unmarshallOptions: {
        wrapNumbers: false,
      },
    });

    this.tableName = config.dynamodb.tableName;
    logger.info({ tableName: this.tableName }, 'DynamoDBService initialized');
  }

  /**
   * Put (create or overwrite) an item in the table.
   */
  async putItem(item: DynamoDBItem, conditionExpression?: string): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: conditionExpression,
      });

      await this.client.send(command);
      logger.debug({ PK: item.PK, SK: item.SK }, 'DynamoDB putItem success');
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw AppError.conflict('Item already exists or condition not met');
      }
      logger.error({ error, PK: item.PK, SK: item.SK }, 'DynamoDB putItem failed');
      throw AppError.internal(`DynamoDB put failed: ${error.message}`);
    }
  }

  /**
   * Get a single item by PK and SK.
   */
  async getItem(pk: string, sk: string): Promise<DynamoDBItem | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { PK: pk, SK: sk },
      });

      const response = await this.client.send(command);
      return (response.Item as DynamoDBItem) || null;
    } catch (error: any) {
      logger.error({ error, PK: pk, SK: sk }, 'DynamoDB getItem failed');
      throw AppError.internal(`DynamoDB get failed: ${error.message}`);
    }
  }

  /**
   * Query items by PK and optional SK condition.
   */
  async query(params: {
    pk: string;
    skPrefix?: string;
    skBetween?: { start: string; end: string };
    indexName?: string;
    limit?: number;
    scanForward?: boolean;
    exclusiveStartKey?: Record<string, unknown>;
    filterExpression?: string;
    expressionAttributeValues?: Record<string, unknown>;
    expressionAttributeNames?: Record<string, string>;
  }): Promise<{ items: DynamoDBItem[]; lastEvaluatedKey?: Record<string, unknown> }> {
    try {
      const pkAttrName = params.indexName ? (params.indexName === 'GSI1' ? 'GSI1PK' : 'GSI2PK') : 'PK';
      const skAttrName = params.indexName ? (params.indexName === 'GSI1' ? 'GSI1SK' : 'GSI2SK') : 'SK';

      let keyConditionExpression = `#pk = :pk`;
      const expressionAttributeNames: Record<string, string> = {
        '#pk': pkAttrName,
        ...(params.expressionAttributeNames || {}),
      };
      const expressionAttributeValues: Record<string, unknown> = {
        ':pk': params.pk,
        ...(params.expressionAttributeValues || {}),
      };

      if (params.skPrefix) {
        keyConditionExpression += ` AND begins_with(#sk, :skPrefix)`;
        expressionAttributeNames['#sk'] = skAttrName;
        expressionAttributeValues[':skPrefix'] = params.skPrefix;
      } else if (params.skBetween) {
        keyConditionExpression += ` AND #sk BETWEEN :skStart AND :skEnd`;
        expressionAttributeNames['#sk'] = skAttrName;
        expressionAttributeValues[':skStart'] = params.skBetween.start;
        expressionAttributeValues[':skEnd'] = params.skBetween.end;
      }

      const commandInput: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: params.indexName,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: params.limit,
        ScanIndexForward: params.scanForward ?? true,
        ExclusiveStartKey: params.exclusiveStartKey,
        FilterExpression: params.filterExpression,
      };

      const command = new QueryCommand(commandInput);
      const response = await this.client.send(command);

      return {
        items: (response.Items || []) as DynamoDBItem[],
        lastEvaluatedKey: response.LastEvaluatedKey as Record<string, unknown> | undefined,
      };
    } catch (error: any) {
      logger.error({ error, pk: params.pk }, 'DynamoDB query failed');
      throw AppError.internal(`DynamoDB query failed: ${error.message}`);
    }
  }

  /**
   * Update specific attributes of an item.
   */
  async update(pk: string, sk: string, updates: Record<string, unknown>, conditionExpression?: string): Promise<DynamoDBItem> {
    try {
      const updateParts: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, unknown> = {};

      let idx = 0;
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'PK' || key === 'SK') continue; // Never update keys
        const nameKey = `#attr${idx}`;
        const valueKey = `:val${idx}`;
        updateParts.push(`${nameKey} = ${valueKey}`);
        expressionAttributeNames[nameKey] = key;
        expressionAttributeValues[valueKey] = value;
        idx++;
      }

      if (updateParts.length === 0) {
        const existing = await this.getItem(pk, sk);
        return existing || ({ PK: pk, SK: sk } as DynamoDBItem);
      }

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { PK: pk, SK: sk },
        UpdateExpression: `SET ${updateParts.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: conditionExpression,
        ReturnValues: 'ALL_NEW',
      });

      const response = await this.client.send(command);
      return (response.Attributes as DynamoDBItem) || { PK: pk, SK: sk };
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw AppError.conflict('Update condition not met');
      }
      logger.error({ error, PK: pk, SK: sk }, 'DynamoDB update failed');
      throw AppError.internal(`DynamoDB update failed: ${error.message}`);
    }
  }

  /**
   * Delete an item by PK and SK.
   */
  async deleteItem(pk: string, sk: string, conditionExpression?: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { PK: pk, SK: sk },
        ConditionExpression: conditionExpression,
      });

      await this.client.send(command);
      logger.debug({ PK: pk, SK: sk }, 'DynamoDB deleteItem success');
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw AppError.conflict('Delete condition not met');
      }
      logger.error({ error, PK: pk, SK: sk }, 'DynamoDB deleteItem failed');
      throw AppError.internal(`DynamoDB delete failed: ${error.message}`);
    }
  }

  /**
   * Batch write up to 25 items (put or delete) in a single request.
   */
  async batchWrite(operations: { put?: DynamoDBItem; delete?: { PK: string; SK: string } }[]): Promise<void> {
    if (operations.length === 0) return;
    if (operations.length > 25) {
      throw AppError.badRequest('DynamoDB batch write supports a maximum of 25 items');
    }

    try {
      const requestItems = operations.map((op) => {
        if (op.put) {
          return { PutRequest: { Item: op.put } };
        }
        if (op.delete) {
          return { DeleteRequest: { Key: { PK: op.delete.PK, SK: op.delete.SK } } };
        }
        throw AppError.badRequest('Each batch operation must have either put or delete');
      });

      const command = new BatchWriteCommand({
        RequestItems: {
          [this.tableName]: requestItems,
        },
      });

      await this.client.send(command);
      logger.info({ operationCount: operations.length }, 'DynamoDB batchWrite success');
    } catch (error: any) {
      logger.error({ error }, 'DynamoDB batchWrite failed');
      throw AppError.internal(`DynamoDB batch write failed: ${error.message}`);
    }
  }

  /**
   * Transactional write — all-or-nothing writes across multiple items.
   */
  async transactWrite(operations: TransactWriteCommandInput['TransactItems']): Promise<void> {
    if (!operations || operations.length === 0) return;

    try {
      const command = new TransactWriteCommand({
        TransactItems: operations.map((op) => {
          // Inject TableName into each operation
          if (op.Put) {
            return { Put: { ...op.Put, TableName: op.Put.TableName || this.tableName } };
          }
          if (op.Update) {
            return { Update: { ...op.Update, TableName: op.Update.TableName || this.tableName } };
          }
          if (op.Delete) {
            return { Delete: { ...op.Delete, TableName: op.Delete.TableName || this.tableName } };
          }
          if (op.ConditionCheck) {
            return { ConditionCheck: { ...op.ConditionCheck, TableName: op.ConditionCheck.TableName || this.tableName } };
          }
          return op;
        }),
      });

      await this.client.send(command);
      logger.info({ operationCount: operations.length }, 'DynamoDB transactWrite success');
    } catch (error: any) {
      if (error.name === 'TransactionCanceledException') {
        logger.warn({ error }, 'DynamoDB transaction cancelled');
        throw AppError.conflict('Transaction cancelled - one or more conditions failed');
      }
      logger.error({ error }, 'DynamoDB transactWrite failed');
      throw AppError.internal(`DynamoDB transact write failed: ${error.message}`);
    }
  }
}

export const dynamoDBService = new DynamoDBService();
