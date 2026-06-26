import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  SendMessageBatchCommand,
  SendMessageBatchRequestEntry,
  Message,
} from '@aws-sdk/client-sqs';

import { config } from '../../../config/index.js';
import { AppError } from '../../../shared/errors.js';
import { logger } from '../../../shared/logger.js';

export type QueueName = 'resume-processing' | 'career-generation' | 'embedding-generation';

export interface SQSMessageOptions {
  delaySeconds?: number;
  messageGroupId?: string;
  messageDeduplicationId?: string;
  messageAttributes?: Record<string, { DataType: string; StringValue: string }>;
}

export interface ReceivedMessage {
  messageId: string;
  receiptHandle: string;
  body: string;
  attributes?: Record<string, string>;
  messageAttributes?: Record<string, { dataType: string; stringValue: string }>;
}

export class SQSService {
  private client: SQSClient;
  private queueUrls: Record<QueueName, string>;

  constructor() {
    const clientConfig: Record<string, unknown> = {
      region: config.aws.region,
    };

    if (config.sqs.endpoint) {
      clientConfig.endpoint = config.sqs.endpoint;
    }

    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      };
    }

    this.client = new SQSClient(clientConfig);

    this.queueUrls = {
      'resume-processing': config.sqs.resumeQueueUrl,
      'career-generation': config.sqs.careerQueueUrl,
      'embedding-generation': config.sqs.embeddingQueueUrl,
    };

    logger.info('SQSService initialized');
  }

  /**
   * Send a single message to the specified queue.
   */
  async sendMessage(queueName: QueueName, messageBody: object | string, options: SQSMessageOptions = {}): Promise<string> {
    const queueUrl = this.getQueueUrl(queueName);
    const body = typeof messageBody === 'string' ? messageBody : JSON.stringify(messageBody);

    try {
      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: body,
        DelaySeconds: options.delaySeconds,
        MessageGroupId: options.messageGroupId,
        MessageDeduplicationId: options.messageDeduplicationId,
        MessageAttributes: options.messageAttributes
          ? Object.fromEntries(
              Object.entries(options.messageAttributes).map(([key, val]) => [
                key,
                { DataType: val.DataType, StringValue: val.StringValue },
              ]),
            )
          : undefined,
      });

      const response = await this.client.send(command);
      logger.info({ queueName, messageId: response.MessageId }, 'SQS message sent');

      return response.MessageId || '';
    } catch (error: any) {
      logger.error({ error, queueName }, 'SQS sendMessage failed');
      throw AppError.internal(`SQS send message failed: ${error.message}`);
    }
  }

  /**
   * Receive messages from the specified queue.
   */
  async receiveMessage(
    queueName: QueueName,
    maxMessages = 1,
    waitTimeSeconds = 5,
    visibilityTimeout = 30,
  ): Promise<ReceivedMessage[]> {
    const queueUrl = this.getQueueUrl(queueName);

    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: Math.min(maxMessages, 10),
        WaitTimeSeconds: waitTimeSeconds,
        VisibilityTimeout: visibilityTimeout,
        MessageAttributeNames: ['All'],
        AttributeNames: ['All'],
      });

      const response = await this.client.send(command);
      const messages = (response.Messages || []).map(this.mapMessage);

      logger.info({ queueName, messageCount: messages.length }, 'SQS messages received');
      return messages;
    } catch (error: any) {
      logger.error({ error, queueName }, 'SQS receiveMessage failed');
      throw AppError.internal(`SQS receive message failed: ${error.message}`);
    }
  }

  /**
   * Delete a message from the queue after successful processing.
   */
  async deleteMessage(queueName: QueueName, receiptHandle: string): Promise<void> {
    const queueUrl = this.getQueueUrl(queueName);

    try {
      const command = new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      });

      await this.client.send(command);
      logger.info({ queueName }, 'SQS message deleted');
    } catch (error: any) {
      logger.error({ error, queueName }, 'SQS deleteMessage failed');
      throw AppError.internal(`SQS delete message failed: ${error.message}`);
    }
  }

  /**
   * Send up to 10 messages in a single batch request.
   */
  async sendBatch(queueName: QueueName, messages: { id: string; body: object | string; delaySeconds?: number }[]): Promise<{ successful: string[]; failed: string[] }> {
    const queueUrl = this.getQueueUrl(queueName);

    if (messages.length === 0) {
      return { successful: [], failed: [] };
    }

    if (messages.length > 10) {
      throw AppError.badRequest('SQS batch send supports a maximum of 10 messages');
    }

    try {
      const entries: SendMessageBatchRequestEntry[] = messages.map((msg) => ({
        Id: msg.id,
        MessageBody: typeof msg.body === 'string' ? msg.body : JSON.stringify(msg.body),
        DelaySeconds: msg.delaySeconds,
      }));

      const command = new SendMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: entries,
      });

      const response = await this.client.send(command);

      const successful = (response.Successful || []).map((s) => s.Id || '');
      const failed = (response.Failed || []).map((f) => f.Id || '');

      logger.info({ queueName, successful: successful.length, failed: failed.length }, 'SQS batch send completed');

      return { successful, failed };
    } catch (error: any) {
      logger.error({ error, queueName }, 'SQS sendBatch failed');
      throw AppError.internal(`SQS batch send failed: ${error.message}`);
    }
  }

  private getQueueUrl(queueName: QueueName): string {
    const url = this.queueUrls[queueName];
    if (!url) {
      logger.warn({ queueName }, 'SQS queue URL not configured');
      throw AppError.internal(`SQS queue URL not configured for: ${queueName}`);
    }
    return url;
  }

  private mapMessage(msg: Message): ReceivedMessage {
    return {
      messageId: msg.MessageId || '',
      receiptHandle: msg.ReceiptHandle || '',
      body: msg.Body || '',
      attributes: msg.Attributes as Record<string, string> | undefined,
      messageAttributes: msg.MessageAttributes
        ? Object.fromEntries(
            Object.entries(msg.MessageAttributes).map(([key, val]) => [
              key,
              { dataType: val.DataType || '', stringValue: val.StringValue || '' },
            ]),
          )
        : undefined,
    };
  }
}

export const sqsService = new SQSService();
