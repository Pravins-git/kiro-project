import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

import { BaseStack, BaseStackProps } from './base-stack';

export interface QueueWithDlq {
  queue: sqs.Queue;
  dlq: sqs.Queue;
}

export class QueueStack extends BaseStack {
  public readonly resumeProcessing: QueueWithDlq;
  public readonly careerGeneration: QueueWithDlq;
  public readonly embeddingGeneration: QueueWithDlq;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    // Resume Processing Queue
    this.resumeProcessing = this.createQueueWithDlq('resume-processing', {
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
      maxReceiveCount: 3,
    });

    // Career Generation Queue
    this.careerGeneration = this.createQueueWithDlq('career-generation', {
      visibilityTimeout: cdk.Duration.seconds(600),
      retentionPeriod: cdk.Duration.days(14),
      maxReceiveCount: 3,
    });

    // Embedding Generation Queue
    this.embeddingGeneration = this.createQueueWithDlq('embedding-generation', {
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
      maxReceiveCount: 3,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ResumeQueueUrl', {
      value: this.resumeProcessing.queue.queueUrl,
    });
    new cdk.CfnOutput(this, 'CareerQueueUrl', {
      value: this.careerGeneration.queue.queueUrl,
    });
    new cdk.CfnOutput(this, 'EmbeddingQueueUrl', {
      value: this.embeddingGeneration.queue.queueUrl,
    });
  }

  private createQueueWithDlq(
    name: string,
    options: {
      visibilityTimeout: cdk.Duration;
      retentionPeriod: cdk.Duration;
      maxReceiveCount: number;
    },
  ): QueueWithDlq {
    const dlq = new sqs.Queue(this, `${name}-dlq`, {
      queueName: this.prefixName(`${name}-dlq`),
      retentionPeriod: options.retentionPeriod,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    });

    const queue = new sqs.Queue(this, name, {
      queueName: this.prefixName(name),
      visibilityTimeout: options.visibilityTimeout,
      retentionPeriod: options.retentionPeriod,
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: options.maxReceiveCount,
      },
    });

    return { queue, dlq };
  }
}
