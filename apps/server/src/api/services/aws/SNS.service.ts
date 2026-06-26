import {
  SNSClient,
  PublishCommand,
  SubscribeCommand,
  CreateTopicCommand,
  ListSubscriptionsByTopicCommand,
  UnsubscribeCommand,
  MessageAttributeValue,
} from '@aws-sdk/client-sns';

import { config } from '../../../config/index.js';
import { AppError } from '../../../shared/errors.js';
import { logger } from '../../../shared/logger.js';

export interface PublishOptions {
  subject?: string;
  messageAttributes?: Record<string, { DataType: string; StringValue: string }>;
  messageGroupId?: string;
  messageDeduplicationId?: string;
}

export interface SubscriptionInfo {
  subscriptionArn: string;
  protocol: string;
  endpoint: string;
}

export class SNSService {
  private client: SNSClient;
  private defaultTopicArn: string;

  constructor() {
    const clientConfig: Record<string, unknown> = {
      region: config.aws.region,
    };

    if (config.sns.endpoint) {
      clientConfig.endpoint = config.sns.endpoint;
    }

    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      };
    }

    this.client = new SNSClient(clientConfig);
    this.defaultTopicArn = config.sns.topicArn;

    logger.info('SNSService initialized');
  }

  /**
   * Publish a message to an SNS topic.
   */
  async publishMessage(message: string | object, topicArn?: string, options: PublishOptions = {}): Promise<string> {
    const targetArn = topicArn || this.defaultTopicArn;
    if (!targetArn) {
      throw AppError.internal('SNS topic ARN not configured');
    }

    const messageBody = typeof message === 'string' ? message : JSON.stringify(message);

    try {
      const messageAttributes: Record<string, MessageAttributeValue> | undefined = options.messageAttributes
        ? Object.fromEntries(
            Object.entries(options.messageAttributes).map(([key, val]) => [
              key,
              { DataType: val.DataType, StringValue: val.StringValue },
            ]),
          )
        : undefined;

      const command = new PublishCommand({
        TopicArn: targetArn,
        Message: messageBody,
        Subject: options.subject,
        MessageAttributes: messageAttributes,
        MessageGroupId: options.messageGroupId,
        MessageDeduplicationId: options.messageDeduplicationId,
      });

      const response = await this.client.send(command);
      logger.info({ messageId: response.MessageId, topicArn: targetArn }, 'SNS message published');

      return response.MessageId || '';
    } catch (error: any) {
      logger.error({ error, topicArn: targetArn }, 'SNS publishMessage failed');
      throw AppError.internal(`SNS publish failed: ${error.message}`);
    }
  }

  /**
   * Subscribe an endpoint (email, SMS, Lambda ARN, SQS ARN, etc.) to a topic.
   */
  async subscribe(protocol: string, endpoint: string, topicArn?: string): Promise<string> {
    const targetArn = topicArn || this.defaultTopicArn;
    if (!targetArn) {
      throw AppError.internal('SNS topic ARN not configured');
    }

    try {
      const command = new SubscribeCommand({
        TopicArn: targetArn,
        Protocol: protocol,
        Endpoint: endpoint,
        ReturnSubscriptionArn: true,
      });

      const response = await this.client.send(command);
      logger.info({ protocol, endpoint, topicArn: targetArn }, 'SNS subscription created');

      return response.SubscriptionArn || '';
    } catch (error: any) {
      logger.error({ error, protocol, endpoint }, 'SNS subscribe failed');
      throw AppError.internal(`SNS subscribe failed: ${error.message}`);
    }
  }

  /**
   * Unsubscribe from a topic.
   */
  async unsubscribe(subscriptionArn: string): Promise<void> {
    try {
      const command = new UnsubscribeCommand({
        SubscriptionArn: subscriptionArn,
      });

      await this.client.send(command);
      logger.info({ subscriptionArn }, 'SNS unsubscribed');
    } catch (error: any) {
      logger.error({ error, subscriptionArn }, 'SNS unsubscribe failed');
      throw AppError.internal(`SNS unsubscribe failed: ${error.message}`);
    }
  }

  /**
   * Create a new SNS topic and return its ARN.
   */
  async createTopic(topicName: string, attributes?: Record<string, string>): Promise<string> {
    try {
      const command = new CreateTopicCommand({
        Name: topicName,
        Attributes: attributes,
      });

      const response = await this.client.send(command);
      logger.info({ topicName, topicArn: response.TopicArn }, 'SNS topic created');

      return response.TopicArn || '';
    } catch (error: any) {
      logger.error({ error, topicName }, 'SNS createTopic failed');
      throw AppError.internal(`SNS create topic failed: ${error.message}`);
    }
  }

  /**
   * List all subscriptions for a topic.
   */
  async listSubscriptions(topicArn?: string): Promise<SubscriptionInfo[]> {
    const targetArn = topicArn || this.defaultTopicArn;
    if (!targetArn) {
      throw AppError.internal('SNS topic ARN not configured');
    }

    try {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: targetArn,
      });

      const response = await this.client.send(command);
      return (response.Subscriptions || []).map((sub) => ({
        subscriptionArn: sub.SubscriptionArn || '',
        protocol: sub.Protocol || '',
        endpoint: sub.Endpoint || '',
      }));
    } catch (error: any) {
      logger.error({ error, topicArn: targetArn }, 'SNS listSubscriptions failed');
      throw AppError.internal(`SNS list subscriptions failed: ${error.message}`);
    }
  }

  /**
   * Helper: Send an email notification via SNS.
   */
  async sendEmailNotification(subject: string, message: string, topicArn?: string): Promise<string> {
    return this.publishMessage(message, topicArn, { subject });
  }

  /**
   * Helper: Send an admin alert with high priority.
   */
  async sendAdminAlert(alertMessage: string, severity: 'low' | 'medium' | 'high' | 'critical'): Promise<string> {
    return this.publishMessage(alertMessage, undefined, {
      subject: `[${severity.toUpperCase()}] AI Career Platform Alert`,
      messageAttributes: {
        severity: { DataType: 'String', StringValue: severity },
        source: { DataType: 'String', StringValue: 'ai-career-platform' },
        timestamp: { DataType: 'String', StringValue: new Date().toISOString() },
      },
    });
  }
}

export const snsService = new SNSService();
