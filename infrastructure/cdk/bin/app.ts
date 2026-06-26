#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { EnvironmentConfig, getEnvironmentConfig } from '../lib/config/environment';
import { ApiGatewayStack } from '../lib/stacks/api-gateway-stack';
import { CognitoStack } from '../lib/stacks/cognito-stack';
import { ComputeStack } from '../lib/stacks/compute-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';
import { QueueStack } from '../lib/stacks/queue-stack';
import { SearchStack } from '../lib/stacks/search-stack';
import { SecurityStack } from '../lib/stacks/security-stack';
import { StepFunctionsStack } from '../lib/stacks/step-functions-stack';
import { StorageStack } from '../lib/stacks/storage-stack';

const app = new cdk.App();

const envName = app.node.tryGetContext('env') || 'dev';
const config: EnvironmentConfig = getEnvironmentConfig(envName);

const prefix = `${config.appName}-${config.envName}`;

const env: cdk.Environment = {
  account: config.account,
  region: config.region,
};

// Database Stack (DynamoDB)
const databaseStack = new DatabaseStack(app, `${prefix}-database`, {
  env,
  config,
  description: `AI Career Platform - Database (${config.envName})`,
});

// Storage Stack (S3 Buckets)
new StorageStack(app, `${prefix}-storage`, {
  env,
  config,
  description: `AI Career Platform - Storage (${config.envName})`,
});

// Queue Stack (SQS + DLQ)
const queueStack = new QueueStack(app, `${prefix}-queues`, {
  env,
  config,
  description: `AI Career Platform - Queues (${config.envName})`,
});

// Search Stack (OpenSearch Serverless)
new SearchStack(app, `${prefix}-search`, {
  env,
  config,
  description: `AI Career Platform - Search (${config.envName})`,
});

// Cognito Stack (User Pool, Identity Pool, App Client)
const cognitoStack = new CognitoStack(app, `${prefix}-cognito`, {
  env,
  config,
  description: `AI Career Platform - Cognito Auth (${config.envName})`,
});

// Security Stack (WAF, KMS)
new SecurityStack(app, `${prefix}-security`, {
  env,
  config,
  description: `AI Career Platform - Security (${config.envName})`,
});

// Compute Stack (Lambda Functions)
const computeStack = new ComputeStack(app, `${prefix}-compute`, {
  env,
  config,
  description: `AI Career Platform - Compute (${config.envName})`,
  resumeQueue: queueStack.resumeProcessing.queue,
  careerQueue: queueStack.careerGeneration.queue,
  embeddingQueue: queueStack.embeddingGeneration.queue,
});
computeStack.addDependency(queueStack);

// API Gateway Stack (REST API with Cognito Authorizer)
const apiGatewayStack = new ApiGatewayStack(app, `${prefix}-api`, {
  env,
  config,
  description: `AI Career Platform - API Gateway (${config.envName})`,
  userPool: cognitoStack.userPool,
});
apiGatewayStack.addDependency(cognitoStack);

// Step Functions Stack (Resume & Career Pipelines)
const stepFunctionsStack = new StepFunctionsStack(app, `${prefix}-workflows`, {
  env,
  config,
  description: `AI Career Platform - Step Functions (${config.envName})`,
  resumeProcessorFn: computeStack.resumeProcessorFn,
  careerGeneratorFn: computeStack.careerGeneratorFn,
  embeddingGeneratorFn: computeStack.embeddingGeneratorFn,
});
stepFunctionsStack.addDependency(computeStack);

// Monitoring Stack (CloudWatch Dashboards & Alarms)
const monitoringStack = new MonitoringStack(app, `${prefix}-monitoring`, {
  env,
  config,
  description: `AI Career Platform - Monitoring (${config.envName})`,
  apiName: `${prefix}-api`,
  dlqQueues: [
    queueStack.resumeProcessing.dlq,
    queueStack.careerGeneration.dlq,
    queueStack.embeddingGeneration.dlq,
  ],
});
monitoringStack.addDependency(queueStack);

// Add tags to all stacks
cdk.Tags.of(app).add('Project', 'ai-career-platform');
cdk.Tags.of(app).add('Environment', config.envName);
cdk.Tags.of(app).add('ManagedBy', 'cdk');

app.synth();
