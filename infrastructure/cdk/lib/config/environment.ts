import * as cdk from 'aws-cdk-lib';

export interface EnvironmentConfig {
  appName: string;
  envName: 'dev' | 'staging' | 'prod';
  account: string;
  region: string;
  removalPolicy: cdk.RemovalPolicy;
  isProd: boolean;
}

export function getEnvironmentConfig(envName: string): EnvironmentConfig {
  const validEnvs = ['dev', 'staging', 'prod'] as const;
  if (!validEnvs.includes(envName as (typeof validEnvs)[number])) {
    throw new Error(`Invalid environment: ${envName}. Must be one of: ${validEnvs.join(', ')}`);
  }

  const env = envName as 'dev' | 'staging' | 'prod';

  const configs: Record<typeof env, Omit<EnvironmentConfig, 'appName'>> = {
    dev: {
      envName: 'dev',
      account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
      region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      isProd: false,
    },
    staging: {
      envName: 'staging',
      account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
      region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      isProd: false,
    },
    prod: {
      envName: 'prod',
      account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
      region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      isProd: true,
    },
  };

  return {
    appName: 'ai-career-platform',
    ...configs[env],
  };
}
