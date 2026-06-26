import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

import { BaseStack, BaseStackProps } from './base-stack';

export interface ComputeStackProps extends BaseStackProps {
  resumeQueue?: sqs.IQueue;
  careerQueue?: sqs.IQueue;
  embeddingQueue?: sqs.IQueue;
}

export class ComputeStack extends BaseStack {
  public readonly resumeProcessorFn: lambda.Function;
  public readonly careerGeneratorFn: lambda.Function;
  public readonly embeddingGeneratorFn: lambda.Function;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(300),
      memorySize: 512,
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        NODE_ENV: this.config.envName,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
        DYNAMODB_TABLE_NAME: this.prefixName('main'),
      },
    };

    // Lambda execution role with common permissions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: this.prefixName('lambda-exec'),
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    // Add DynamoDB permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:Query',
          'dynamodb:BatchWriteItem',
        ],
        resources: [`arn:aws:dynamodb:${this.region}:${this.account}:table/${this.prefixName('main')}*`],
      }),
    );

    // Add Bedrock permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: ['*'],
      }),
    );

    // Add S3 permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [`arn:aws:s3:::${this.prefixName('*')}/*`],
      }),
    );

    // Add Textract permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['textract:AnalyzeDocument', 'textract:DetectDocumentText', 'textract:StartDocumentAnalysis', 'textract:GetDocumentAnalysis'],
        resources: ['*'],
      }),
    );

    // Add Comprehend permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['comprehend:DetectSentiment', 'comprehend:DetectKeyPhrases', 'comprehend:DetectEntities', 'comprehend:DetectDominantLanguage'],
        resources: ['*'],
      }),
    );

    // Resume Processing Lambda
    this.resumeProcessorFn = new lambda.Function(this, 'ResumeProcessor', {
      ...commonLambdaProps,
      functionName: this.prefixName('resume-processor'),
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Resume processor invoked', JSON.stringify(event));
          // Placeholder: Process SQS messages containing resume processing requests
          for (const record of event.Records || []) {
            const body = JSON.parse(record.body);
            console.log('Processing resume:', body.resumeId);
            // TODO: Implement resume parsing, Textract, Comprehend analysis
          }
          return { statusCode: 200, body: 'OK' };
        };
      `),
      role: lambdaRole,
      description: 'Processes resumes from SQS queue — extracts text, analyzes with AI',
    });

    // Career Generation Lambda
    this.careerGeneratorFn = new lambda.Function(this, 'CareerGenerator', {
      ...commonLambdaProps,
      functionName: this.prefixName('career-generator'),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(600),
      memorySize: 1024,
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Career generator invoked', JSON.stringify(event));
          // Placeholder: Generate career recommendations using Bedrock
          for (const record of event.Records || []) {
            const body = JSON.parse(record.body);
            console.log('Generating career matches for user:', body.userId);
            // TODO: Implement Bedrock-based career recommendation generation
          }
          return { statusCode: 200, body: 'OK' };
        };
      `),
      role: lambdaRole,
      description: 'Generates career recommendations using AI models',
    });

    // Embedding Generation Lambda
    this.embeddingGeneratorFn = new lambda.Function(this, 'EmbeddingGenerator', {
      ...commonLambdaProps,
      functionName: this.prefixName('embedding-generator'),
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Embedding generator invoked', JSON.stringify(event));
          // Placeholder: Generate vector embeddings for semantic search
          for (const record of event.Records || []) {
            const body = JSON.parse(record.body);
            console.log('Generating embeddings for:', body.documentId);
            // TODO: Implement embedding generation using Bedrock Titan Embeddings
          }
          return { statusCode: 200, body: 'OK' };
        };
      `),
      role: lambdaRole,
      description: 'Generates vector embeddings for semantic search',
    });

    // Connect SQS queues as event sources (if provided)
    if (props.resumeQueue) {
      this.resumeProcessorFn.addEventSource(
        new SqsEventSource(props.resumeQueue, {
          batchSize: 5,
          maxBatchingWindow: cdk.Duration.seconds(30),
        }),
      );
    }

    if (props.careerQueue) {
      this.careerGeneratorFn.addEventSource(
        new SqsEventSource(props.careerQueue, {
          batchSize: 2,
          maxBatchingWindow: cdk.Duration.seconds(60),
        }),
      );
    }

    if (props.embeddingQueue) {
      this.embeddingGeneratorFn.addEventSource(
        new SqsEventSource(props.embeddingQueue, {
          batchSize: 10,
          maxBatchingWindow: cdk.Duration.seconds(30),
        }),
      );
    }

    // Outputs
    new cdk.CfnOutput(this, 'ResumeProcessorArn', {
      value: this.resumeProcessorFn.functionArn,
    });
    new cdk.CfnOutput(this, 'CareerGeneratorArn', {
      value: this.careerGeneratorFn.functionArn,
    });
    new cdk.CfnOutput(this, 'EmbeddingGeneratorArn', {
      value: this.embeddingGeneratorFn.functionArn,
    });
  }
}
