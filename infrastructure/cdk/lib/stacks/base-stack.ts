import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { EnvironmentConfig } from '../config/environment';

export interface BaseStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

export class BaseStack extends cdk.Stack {
  protected readonly config: EnvironmentConfig;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);
    this.config = props.config;
  }

  protected prefixName(name: string): string {
    return `${this.config.appName}-${this.config.envName}-${name}`;
  }
}
