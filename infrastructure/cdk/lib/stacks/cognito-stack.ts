import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

import { BaseStack, BaseStackProps } from './base-stack';

export class CognitoStack extends BaseStack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly identityPool: cognito.CfnIdentityPool;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    // User Pool
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: this.prefixName('users'),
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: true, mutable: true },
        familyName: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(7),
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: false,
        otp: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: this.config.removalPolicy,
      userVerification: {
        emailSubject: 'AI Career Intelligence Platform - Verify your email',
        emailBody:
          'Hello {username},\n\nThank you for signing up for the AI Career Intelligence Platform.\n\nYour verification code is: {####}\n\nThis code expires in 24 hours.',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      userInvitation: {
        emailSubject: 'AI Career Intelligence Platform - Your account has been created',
        emailBody:
          'Hello {username},\n\nAn account has been created for you on the AI Career Intelligence Platform.\n\nYour temporary password is: {####}\n\nPlease sign in and change your password.',
      },
    });

    // Google Identity Provider (ready to configure with real Google OAuth credentials)
    // Uncomment and configure when Google OAuth is ready:
    // const googleProvider = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleProvider', {
    //   userPool: this.userPool,
    //   clientId: 'GOOGLE_CLIENT_ID',
    //   clientSecretValue: cdk.SecretValue.secretsManager('google-oauth-client-secret'),
    //   scopes: ['openid', 'email', 'profile'],
    //   attributeMapping: {
    //     email: cognito.ProviderAttribute.GOOGLE_EMAIL,
    //     givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
    //     familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
    //   },
    // });

    // App Client
    this.userPoolClient = this.userPool.addClient('AppClient', {
      userPoolClientName: this.prefixName('web-client'),
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: this.config.isProd
          ? ['https://app.aicareerplatform.com/auth/callback']
          : ['http://localhost:3000/auth/callback'],
        logoutUrls: this.config.isProd
          ? ['https://app.aicareerplatform.com']
          : ['http://localhost:3000'],
      },
      preventUserExistenceErrors: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // Identity Pool (for AWS credential vending to authenticated users)
    this.identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: this.prefixName('identity'),
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: this.userPoolClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'IdentityPoolId', {
      value: this.identityPool.ref,
      description: 'Cognito Identity Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolProviderUrl', {
      value: this.userPool.userPoolProviderUrl,
      description: 'Cognito User Pool Provider URL',
    });
  }
}
