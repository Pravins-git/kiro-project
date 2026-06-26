import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  version: process.env.npm_package_version || '0.1.0',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  logLevel: process.env.LOG_LEVEL || 'info',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-career-platform',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  openaiApiKey: process.env.OPENAI_API_KEY || 'mock-key',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3BucketName: process.env.AWS_S3_BUCKET_NAME || 'kiro-resumes-local',
  },
  // Cognito configuration
  useCognito: process.env.USE_COGNITO === 'true',
  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID || '',
    clientId: process.env.COGNITO_CLIENT_ID || '',
    region: process.env.COGNITO_REGION || process.env.AWS_REGION || 'us-east-1',
  },
  // Textract
  textract: {
    endpoint: process.env.TEXTRACT_ENDPOINT || '',
  },
  // Comprehend
  comprehend: {
    endpoint: process.env.COMPREHEND_ENDPOINT || '',
  },
  // SQS Queue URLs
  sqs: {
    endpoint: process.env.SQS_ENDPOINT || '',
    resumeQueueUrl: process.env.SQS_RESUME_QUEUE_URL || '',
    careerQueueUrl: process.env.SQS_CAREER_QUEUE_URL || '',
    embeddingQueueUrl: process.env.SQS_EMBEDDING_QUEUE_URL || '',
  },
  // SNS
  sns: {
    endpoint: process.env.SNS_ENDPOINT || '',
    topicArn: process.env.SNS_TOPIC_ARN || '',
  },
  // DynamoDB
  dynamodb: {
    endpoint: process.env.DYNAMODB_ENDPOINT || '',
    tableName: process.env.DYNAMODB_TABLE_NAME || 'ai-career-platform-dev-main',
  },
  // Secrets Manager
  secretsManager: {
    endpoint: process.env.SECRETS_MANAGER_ENDPOINT || '',
    prefix: process.env.SECRETS_MANAGER_PREFIX || 'ai-career-platform',
  },
  // CloudWatch
  cloudwatch: {
    endpoint: process.env.CLOUDWATCH_ENDPOINT || '',
    namespace: process.env.CLOUDWATCH_NAMESPACE || 'AICareerPlatform',
  },
  // Step Functions
  stepFunctions: {
    endpoint: process.env.STEP_FUNCTIONS_ENDPOINT || '',
    resumeArn: process.env.STEP_FUNCTIONS_RESUME_ARN || '',
    careerArn: process.env.STEP_FUNCTIONS_CAREER_ARN || '',
  },
  // X-Ray
  xrayEnabled: process.env.XRAY_ENABLED === 'true',
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
} as const;
