import {
  CloudWatchClient,
  PutMetricDataCommand,
  MetricDatum,
  StandardUnit,
} from '@aws-sdk/client-cloudwatch';

import { config } from '../../../config/index.js';
import { logger } from '../../../shared/logger.js';

export interface MetricData {
  metricName: string;
  value: number;
  unit?: StandardUnit;
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

export class CloudWatchService {
  private client: CloudWatchClient;
  private namespace: string;
  private buffer: MetricDatum[];
  private flushInterval: NodeJS.Timeout | null;
  private maxBufferSize: number;

  constructor() {
    const clientConfig: Record<string, unknown> = {
      region: config.aws.region,
    };

    if (config.cloudwatch.endpoint) {
      clientConfig.endpoint = config.cloudwatch.endpoint;
    }

    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      };
    }

    this.client = new CloudWatchClient(clientConfig);
    this.namespace = config.cloudwatch.namespace;
    this.buffer = [];
    this.maxBufferSize = 20; // AWS allows up to 1000 per PutMetricData, batch at 20
    this.flushInterval = null;

    // Auto-flush every 60 seconds
    this.startAutoFlush();

    logger.info({ namespace: this.namespace }, 'CloudWatchService initialized');
  }

  /**
   * Publish a single metric data point.
   */
  async putMetricData(metric: MetricData): Promise<void> {
    const datum: MetricDatum = {
      MetricName: metric.metricName,
      Value: metric.value,
      Unit: metric.unit || StandardUnit.None,
      Timestamp: metric.timestamp || new Date(),
      Dimensions: metric.dimensions
        ? Object.entries(metric.dimensions).map(([Name, Value]) => ({ Name, Value }))
        : undefined,
    };

    this.buffer.push(datum);

    if (this.buffer.length >= this.maxBufferSize) {
      await this.flush();
    }
  }

  /**
   * Publish multiple metrics at once.
   */
  async putMetrics(metrics: MetricData[]): Promise<void> {
    for (const metric of metrics) {
      await this.putMetricData(metric);
    }
  }

  /**
   * Flush buffered metrics to CloudWatch.
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const metricsToSend = [...this.buffer];
    this.buffer = [];

    try {
      // CloudWatch accepts up to 1000 metric data points per call
      const chunks = this.chunkArray(metricsToSend, 20);

      for (const chunk of chunks) {
        const command = new PutMetricDataCommand({
          Namespace: this.namespace,
          MetricData: chunk,
        });

        await this.client.send(command);
      }

      logger.debug({ metricCount: metricsToSend.length }, 'CloudWatch metrics flushed');
    } catch (error: any) {
      // Put metrics back in buffer on failure
      this.buffer.unshift(...metricsToSend);
      logger.error({ error }, 'CloudWatch flush failed');
      // Don't throw — metrics are best-effort
    }
  }

  /**
   * Record API latency metric.
   */
  async recordApiLatency(endpoint: string, method: string, latencyMs: number, statusCode: number): Promise<void> {
    await this.putMetricData({
      metricName: 'ApiLatency',
      value: latencyMs,
      unit: StandardUnit.Milliseconds,
      dimensions: {
        Endpoint: endpoint,
        Method: method,
        StatusCode: statusCode.toString(),
      },
    });
  }

  /**
   * Record AI inference time metric.
   */
  async recordAIInferenceTime(model: string, operation: string, durationMs: number): Promise<void> {
    await this.putMetricData({
      metricName: 'AIInferenceTime',
      value: durationMs,
      unit: StandardUnit.Milliseconds,
      dimensions: {
        Model: model,
        Operation: operation,
      },
    });
  }

  /**
   * Record error count metric.
   */
  async recordError(errorType: string, endpoint?: string): Promise<void> {
    await this.putMetricData({
      metricName: 'ErrorCount',
      value: 1,
      unit: StandardUnit.Count,
      dimensions: {
        ErrorType: errorType,
        ...(endpoint ? { Endpoint: endpoint } : {}),
      },
    });
  }

  /**
   * Record request count metric.
   */
  async recordRequest(endpoint: string, method: string): Promise<void> {
    await this.putMetricData({
      metricName: 'RequestCount',
      value: 1,
      unit: StandardUnit.Count,
      dimensions: {
        Endpoint: endpoint,
        Method: method,
      },
    });
  }

  /**
   * Record resume processing metric.
   */
  async recordResumeProcessing(status: 'success' | 'failure', durationMs: number): Promise<void> {
    await this.putMetrics([
      {
        metricName: 'ResumeProcessingDuration',
        value: durationMs,
        unit: StandardUnit.Milliseconds,
        dimensions: { Status: status },
      },
      {
        metricName: 'ResumeProcessingCount',
        value: 1,
        unit: StandardUnit.Count,
        dimensions: { Status: status },
      },
    ]);
  }

  /**
   * Stop auto-flush timer (for graceful shutdown).
   */
  stopAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  private startAutoFlush(): void {
    this.flushInterval = setInterval(async () => {
      try {
        await this.flush();
      } catch (error) {
        logger.error({ error }, 'CloudWatch auto-flush error');
      }
    }, 60_000);

    // Don't prevent process exit
    if (this.flushInterval.unref) {
      this.flushInterval.unref();
    }
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}

export const cloudWatchService = new CloudWatchService();
