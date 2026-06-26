import {
  SFNClient,
  StartExecutionCommand,
  DescribeExecutionCommand,
  ExecutionStatus,
} from '@aws-sdk/client-sfn';

import { config } from '../../../config/index.js';
import { AppError } from '../../../shared/errors.js';
import { logger } from '../../../shared/logger.js';

export type WorkflowType = 'resume-processing' | 'career-recommendation';

export interface ExecutionResult {
  executionArn: string;
  startDate: Date;
}

export interface ExecutionDescription {
  executionArn: string;
  stateMachineArn: string;
  name: string;
  status: string;
  startDate: Date;
  stopDate?: Date;
  input?: string;
  output?: string;
  error?: string;
  cause?: string;
}

export class StepFunctionsService {
  private client: SFNClient;
  private stateMachineArns: Record<WorkflowType, string>;

  constructor() {
    const clientConfig: Record<string, unknown> = {
      region: config.aws.region,
    };

    if (config.stepFunctions.endpoint) {
      clientConfig.endpoint = config.stepFunctions.endpoint;
    }

    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      };
    }

    this.client = new SFNClient(clientConfig);

    this.stateMachineArns = {
      'resume-processing': config.stepFunctions.resumeArn,
      'career-recommendation': config.stepFunctions.careerArn,
    };

    logger.info('StepFunctionsService initialized');
  }

  /**
   * Start a new execution of a state machine.
   */
  async startExecution(workflowType: WorkflowType, input: object, executionName?: string): Promise<ExecutionResult> {
    const stateMachineArn = this.getStateMachineArn(workflowType);

    try {
      const command = new StartExecutionCommand({
        stateMachineArn,
        name: executionName || `${workflowType}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        input: JSON.stringify(input),
      });

      const response = await this.client.send(command);

      logger.info(
        { workflowType, executionArn: response.executionArn },
        'Step Functions execution started',
      );

      return {
        executionArn: response.executionArn || '',
        startDate: response.startDate || new Date(),
      };
    } catch (error: any) {
      logger.error({ error, workflowType }, 'Step Functions startExecution failed');
      if (error.name === 'ExecutionAlreadyExists') {
        throw AppError.conflict('Execution with this name already exists');
      }
      if (error.name === 'StateMachineDoesNotExist') {
        throw AppError.internal(`State machine not found: ${workflowType}`);
      }
      throw AppError.internal(`Step Functions start execution failed: ${error.message}`);
    }
  }

  /**
   * Describe the current status of an execution.
   */
  async describeExecution(executionArn: string): Promise<ExecutionDescription> {
    try {
      const command = new DescribeExecutionCommand({
        executionArn,
      });

      const response = await this.client.send(command);

      logger.info(
        { executionArn, status: response.status },
        'Step Functions execution described',
      );

      return {
        executionArn: response.executionArn || '',
        stateMachineArn: response.stateMachineArn || '',
        name: response.name || '',
        status: response.status || ExecutionStatus.RUNNING,
        startDate: response.startDate || new Date(),
        stopDate: response.stopDate,
        input: response.input,
        output: response.output,
        error: response.error,
        cause: response.cause,
      };
    } catch (error: any) {
      logger.error({ error, executionArn }, 'Step Functions describeExecution failed');
      if (error.name === 'ExecutionDoesNotExist') {
        throw AppError.notFound('Execution not found');
      }
      throw AppError.internal(`Step Functions describe execution failed: ${error.message}`);
    }
  }

  /**
   * Start the resume processing workflow.
   */
  async startResumeProcessing(params: {
    userId: string;
    resumeId: string;
    s3Bucket: string;
    s3Key: string;
    fileName: string;
  }): Promise<ExecutionResult> {
    return this.startExecution('resume-processing', {
      ...params,
      startedAt: new Date().toISOString(),
    });
  }

  /**
   * Start the career recommendation workflow.
   */
  async startCareerRecommendation(params: {
    userId: string;
    resumeId: string;
    preferences?: Record<string, unknown>;
  }): Promise<ExecutionResult> {
    return this.startExecution('career-recommendation', {
      ...params,
      startedAt: new Date().toISOString(),
    });
  }

  /**
   * Check if an execution is still running.
   */
  async isExecutionRunning(executionArn: string): Promise<boolean> {
    const description = await this.describeExecution(executionArn);
    return description.status === ExecutionStatus.RUNNING;
  }

  /**
   * Wait for an execution to complete (with timeout).
   */
  async waitForExecution(executionArn: string, timeoutMs = 300_000, pollIntervalMs = 5000): Promise<ExecutionDescription> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const description = await this.describeExecution(executionArn);

      if (description.status !== ExecutionStatus.RUNNING) {
        return description;
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw AppError.internal(`Execution timed out after ${timeoutMs}ms: ${executionArn}`);
  }

  private getStateMachineArn(workflowType: WorkflowType): string {
    const arn = this.stateMachineArns[workflowType];
    if (!arn) {
      logger.warn({ workflowType }, 'Step Functions state machine ARN not configured');
      throw AppError.internal(`State machine ARN not configured for: ${workflowType}`);
    }
    return arn;
  }
}

export const stepFunctionsService = new StepFunctionsService();
