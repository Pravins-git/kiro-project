import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

import { BaseStack, BaseStackProps } from './base-stack';

export interface ApiGatewayStackProps extends BaseStackProps {
  userPool?: cognito.IUserPool;
}

export class ApiGatewayStack extends BaseStack {
  public readonly api: apigateway.RestApi;
  public readonly cognitoAuthorizer: apigateway.CognitoUserPoolsAuthorizer | undefined;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    // Access Logging
    const accessLogGroup = new logs.LogGroup(this, 'ApiAccessLogs', {
      logGroupName: `/aws/apigateway/${this.prefixName('api')}-access`,
      retention: this.config.isProd ? logs.RetentionDays.ONE_YEAR : logs.RetentionDays.ONE_MONTH,
      removalPolicy: this.config.removalPolicy,
    });

    // REST API
    this.api = new apigateway.RestApi(this, 'RestApi', {
      restApiName: this.prefixName('api'),
      description: `AI Career Intelligence Platform API (${this.config.envName})`,
      deployOptions: {
        stageName: this.config.envName,
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
        metricsEnabled: true,
        tracingEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(accessLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: this.config.isProd
          ? ['https://app.aicareerplatform.com']
          : apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Request-Id',
        ],
        allowCredentials: true,
      },
      cloudWatchRole: true,
    });

    // Cognito Authorizer (if user pool provided)
    if (props.userPool) {
      this.cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
        authorizerName: this.prefixName('cognito-auth'),
        cognitoUserPools: [props.userPool],
        identitySource: 'method.request.header.Authorization',
        resultsCacheTtl: cdk.Duration.minutes(5),
      });
    }

    // Usage Plan with API Key (for third-party integrations)
    const usagePlan = this.api.addUsagePlan('StandardUsagePlan', {
      name: this.prefixName('standard-plan'),
      description: 'Standard usage plan with throttling',
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.DAY,
      },
    });

    const apiKey = this.api.addApiKey('DefaultApiKey', {
      apiKeyName: this.prefixName('default-key'),
      description: 'Default API key for third-party integrations',
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({ stage: this.api.deploymentStage });

    // API Resources (placeholder structure)
    const v1 = this.api.root.addResource('v1');
    
    // Health endpoint (no auth)
    const health = v1.addResource('health');
    health.addMethod('GET', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: {
          'application/json': JSON.stringify({
            status: 'healthy',
            version: '1.0.0',
          }),
        },
      }],
      requestTemplates: {
        'application/json': '{"statusCode": 200}',
      },
    }), {
      methodResponses: [{ statusCode: '200' }],
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'API Gateway REST API ID',
    });
  }
}
