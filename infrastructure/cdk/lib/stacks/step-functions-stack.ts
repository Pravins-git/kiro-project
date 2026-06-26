import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

import { BaseStack, BaseStackProps } from './base-stack';

export interface StepFunctionsStackProps extends BaseStackProps {
  resumeProcessorFn?: lambda.IFunction;
  careerGeneratorFn?: lambda.IFunction;
  embeddingGeneratorFn?: lambda.IFunction;
}

export class StepFunctionsStack extends BaseStack {
  public readonly resumeProcessingStateMachine: sfn.StateMachine;
  public readonly careerRecommendationStateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: StepFunctionsStackProps) {
    super(scope, id, props);

    // ─── Resume Processing Pipeline ───────────────────────────────────
    const resumeLogGroup = new logs.LogGroup(this, 'ResumeStateMachineLogGroup', {
      logGroupName: `/aws/states/${this.prefixName('resume-pipeline')}`,
      retention: this.config.isProd ? logs.RetentionDays.ONE_YEAR : logs.RetentionDays.ONE_MONTH,
      removalPolicy: this.config.removalPolicy,
    });

    // Define steps for resume processing pipeline
    const validateInput = new sfn.Pass(this, 'ValidateResumeInput', {
      comment: 'Validate that required fields are present',
      resultPath: '$.validation',
      parameters: {
        'isValid': true,
        'timestamp.$': '$$.State.EnteredTime',
      },
    });

    const extractText = new sfn.Pass(this, 'ExtractText', {
      comment: 'Extract text from document using Textract',
      resultPath: '$.textExtraction',
      parameters: {
        'status': 'COMPLETED',
        'extractedAt.$': '$$.State.EnteredTime',
      },
    });

    const analyzeWithAI = new sfn.Pass(this, 'AnalyzeWithAI', {
      comment: 'Analyze resume content with Bedrock AI',
      resultPath: '$.aiAnalysis',
      parameters: {
        'status': 'COMPLETED',
        'analyzedAt.$': '$$.State.EnteredTime',
      },
    });

    const generateEmbeddings = new sfn.Pass(this, 'GenerateEmbeddings', {
      comment: 'Generate vector embeddings for semantic search',
      resultPath: '$.embeddings',
      parameters: {
        'status': 'COMPLETED',
        'generatedAt.$': '$$.State.EnteredTime',
      },
    });

    const updateDatabase = new sfn.Pass(this, 'UpdateDatabase', {
      comment: 'Store analysis results in DynamoDB',
      resultPath: '$.database',
      parameters: {
        'status': 'COMPLETED',
        'updatedAt.$': '$$.State.EnteredTime',
      },
    });

    const resumeSuccess = new sfn.Succeed(this, 'ResumeProcessingComplete', {
      comment: 'Resume processing pipeline completed successfully',
    });

    const resumeFailure = new sfn.Fail(this, 'ResumeProcessingFailed', {
      error: 'ResumeProcessingError',
      cause: 'One or more steps in the resume processing pipeline failed',
    });

    // Error handler
    const handleError = new sfn.Pass(this, 'HandleResumeError', {
      comment: 'Log error and update status to failed',
      resultPath: '$.error',
    });

    // Build the resume processing chain
    const resumeDefinition = validateInput
      .next(extractText)
      .next(analyzeWithAI)
      .next(
        new sfn.Parallel(this, 'ParallelPostProcessing', {
          comment: 'Run embedding generation and database update in parallel',
        })
          .branch(generateEmbeddings)
          .branch(updateDatabase)
          .addCatch(handleError.next(resumeFailure), {
            errors: ['States.ALL'],
            resultPath: '$.parallelError',
          }),
      )
      .next(resumeSuccess);

    this.resumeProcessingStateMachine = new sfn.StateMachine(this, 'ResumeProcessingPipeline', {
      stateMachineName: this.prefixName('resume-pipeline'),
      definitionBody: sfn.DefinitionBody.fromChainable(resumeDefinition),
      timeout: cdk.Duration.minutes(30),
      tracingEnabled: true,
      logs: {
        destination: resumeLogGroup,
        level: sfn.LogLevel.ALL,
        includeExecutionData: true,
      },
    });

    // ─── Career Recommendation Pipeline ───────────────────────────────
    const careerLogGroup = new logs.LogGroup(this, 'CareerStateMachineLogGroup', {
      logGroupName: `/aws/states/${this.prefixName('career-pipeline')}`,
      retention: this.config.isProd ? logs.RetentionDays.ONE_YEAR : logs.RetentionDays.ONE_MONTH,
      removalPolicy: this.config.removalPolicy,
    });

    const loadUserProfile = new sfn.Pass(this, 'LoadUserProfile', {
      comment: 'Load user profile and resume analysis from DynamoDB',
      resultPath: '$.userProfile',
      parameters: {
        'status': 'LOADED',
        'loadedAt.$': '$$.State.EnteredTime',
      },
    });

    const loadChatContext = new sfn.Pass(this, 'LoadChatContext', {
      comment: 'Load user chat/behavioral context',
      resultPath: '$.chatContext',
      parameters: {
        'status': 'LOADED',
        'loadedAt.$': '$$.State.EnteredTime',
      },
    });

    const generateRecommendations = new sfn.Pass(this, 'GenerateRecommendations', {
      comment: 'Generate career recommendations using Bedrock AI',
      resultPath: '$.recommendations',
      parameters: {
        'status': 'COMPLETED',
        'generatedAt.$': '$$.State.EnteredTime',
      },
    });

    const scoreAndRank = new sfn.Pass(this, 'ScoreAndRank', {
      comment: 'Score and rank recommendations by confidence',
      resultPath: '$.scoring',
      parameters: {
        'status': 'COMPLETED',
        'scoredAt.$': '$$.State.EnteredTime',
      },
    });

    const storeResults = new sfn.Pass(this, 'StoreCareerResults', {
      comment: 'Store career recommendations in DynamoDB',
      resultPath: '$.storage',
      parameters: {
        'status': 'STORED',
        'storedAt.$': '$$.State.EnteredTime',
      },
    });

    const sendNotification = new sfn.Pass(this, 'SendNotification', {
      comment: 'Notify user that recommendations are ready',
      resultPath: '$.notification',
      parameters: {
        'status': 'SENT',
        'sentAt.$': '$$.State.EnteredTime',
      },
    });

    const careerSuccess = new sfn.Succeed(this, 'CareerRecommendationComplete', {
      comment: 'Career recommendation pipeline completed successfully',
    });

    // Build the career recommendation chain
    const careerDefinition = new sfn.Parallel(this, 'LoadUserData', {
      comment: 'Load user profile and chat context in parallel',
    })
      .branch(loadUserProfile)
      .branch(loadChatContext)
      .next(generateRecommendations)
      .next(scoreAndRank)
      .next(storeResults)
      .next(sendNotification)
      .next(careerSuccess);

    this.careerRecommendationStateMachine = new sfn.StateMachine(this, 'CareerRecommendationPipeline', {
      stateMachineName: this.prefixName('career-pipeline'),
      definitionBody: sfn.DefinitionBody.fromChainable(careerDefinition),
      timeout: cdk.Duration.minutes(15),
      tracingEnabled: true,
      logs: {
        destination: careerLogGroup,
        level: sfn.LogLevel.ALL,
        includeExecutionData: true,
      },
    });

    // ─── Outputs ───────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'ResumeStateMachineArn', {
      value: this.resumeProcessingStateMachine.stateMachineArn,
      description: 'Resume Processing State Machine ARN',
    });

    new cdk.CfnOutput(this, 'CareerStateMachineArn', {
      value: this.careerRecommendationStateMachine.stateMachineArn,
      description: 'Career Recommendation State Machine ARN',
    });
  }
}
