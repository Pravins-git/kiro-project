import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

import { BaseStack, BaseStackProps } from './base-stack';

export interface MonitoringStackProps extends BaseStackProps {
  apiName?: string;
  dlqQueues?: sqs.IQueue[];
}

export class MonitoringStack extends BaseStack {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const apiName = props.apiName || this.prefixName('api');

    // SNS Topic for alarm notifications
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: this.prefixName('alarms'),
      displayName: 'AI Career Platform Alarms',
    });

    // CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'MainDashboard', {
      dashboardName: this.prefixName('dashboard'),
    });

    // ─── API Gateway Metrics ───────────────────────────────────────────
    const apiGateway5xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '5XXError',
      dimensionsMap: { ApiName: apiName },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const apiGateway4xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '4XXError',
      dimensionsMap: { ApiName: apiName },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const apiLatencyMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: { ApiName: apiName },
      statistic: 'p99',
      period: cdk.Duration.minutes(5),
    });

    const apiRequestCountMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Count',
      dimensionsMap: { ApiName: apiName },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // ─── Custom Application Metrics ────────────────────────────────────
    const customNamespace = 'AICareerPlatform';

    const aiInferenceTimeMetric = new cloudwatch.Metric({
      namespace: customNamespace,
      metricName: 'AIInferenceTime',
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const resumeProcessingMetric = new cloudwatch.Metric({
      namespace: customNamespace,
      metricName: 'ResumeProcessingDuration',
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const errorCountMetric = new cloudwatch.Metric({
      namespace: customNamespace,
      metricName: 'ErrorCount',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // ─── Alarms ────────────────────────────────────────────────────────

    // API 5xx Error Rate > 1%
    const api5xxAlarm = new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      alarmName: this.prefixName('api-5xx-high'),
      alarmDescription: 'API 5xx error rate exceeds 1% of total requests',
      metric: apiGateway5xxMetric,
      threshold: 1,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    api5xxAlarm.addAlarmAction({ bind: () => ({ alarmActionArn: this.alarmTopic.topicArn }) });

    // API Latency > 3 seconds (p99)
    const latencyAlarm = new cloudwatch.Alarm(this, 'ApiLatencyAlarm', {
      alarmName: this.prefixName('api-latency-high'),
      alarmDescription: 'API p99 latency exceeds 3 seconds',
      metric: apiLatencyMetric,
      threshold: 3000,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    latencyAlarm.addAlarmAction({ bind: () => ({ alarmActionArn: this.alarmTopic.topicArn }) });

    // DLQ Messages > 0
    if (props.dlqQueues && props.dlqQueues.length > 0) {
      for (let i = 0; i < props.dlqQueues.length; i++) {
        const dlq = props.dlqQueues[i];
        const dlqMessagesMetric = new cloudwatch.Metric({
          namespace: 'AWS/SQS',
          metricName: 'ApproximateNumberOfMessagesVisible',
          dimensionsMap: { QueueName: dlq.queueName },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        });

        const dlqAlarm = new cloudwatch.Alarm(this, `DlqAlarm${i}`, {
          alarmName: this.prefixName(`dlq-messages-${i}`),
          alarmDescription: `DLQ ${dlq.queueName} has messages — processing failures detected`,
          metric: dlqMessagesMetric,
          threshold: 0,
          evaluationPeriods: 1,
          comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        });
        dlqAlarm.addAlarmAction({ bind: () => ({ alarmActionArn: this.alarmTopic.topicArn }) });
      }
    }

    // ─── Dashboard Widgets ─────────────────────────────────────────────
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Request Count',
        left: [apiRequestCountMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Errors',
        left: [apiGateway4xxMetric, apiGateway5xxMetric],
        width: 12,
      }),
    );

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Latency (p99)',
        left: [apiLatencyMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'AI Inference Time',
        left: [aiInferenceTimeMetric],
        width: 12,
      }),
    );

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Resume Processing Duration',
        left: [resumeProcessingMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Application Errors',
        left: [errorCountMetric],
        width: 12,
      }),
    );

    // ─── Outputs ───────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      description: 'SNS Topic ARN for alarms',
    });
  }
}
