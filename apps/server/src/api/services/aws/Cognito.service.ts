import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand,
  AssociateSoftwareTokenCommand,
  VerifySoftwareTokenCommand,
  SetUserMFAPreferenceCommand,
  AuthFlowType,
  ChallengeNameType,
  RespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { config } from '../../../config/index.js';
import { AppError } from '../../../shared/errors.js';
import { logger } from '../../../shared/logger.js';

export interface CognitoSignUpParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface CognitoSignInParams {
  email: string;
  password: string;
}

export interface CognitoTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface CognitoUserInfo {
  sub: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
}

export class CognitoService {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;

  constructor() {
    const clientConfig: Record<string, unknown> = {
      region: config.cognito.region,
    };

    // Use explicit credentials if provided, otherwise rely on default provider chain
    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      };
    }

    this.client = new CognitoIdentityProviderClient(clientConfig);
    this.userPoolId = config.cognito.userPoolId;
    this.clientId = config.cognito.clientId;

    if (config.useCognito && (!this.userPoolId || !this.clientId)) {
      logger.warn('Cognito is enabled but COGNITO_USER_POOL_ID or COGNITO_CLIENT_ID is not set');
    }
  }

  async signUp(params: CognitoSignUpParams): Promise<{ userSub: string; codeDeliveryDetails?: unknown }> {
    try {
      const command = new SignUpCommand({
        ClientId: this.clientId,
        Username: params.email,
        Password: params.password,
        UserAttributes: [
          { Name: 'email', Value: params.email },
          { Name: 'given_name', Value: params.firstName },
          { Name: 'family_name', Value: params.lastName },
        ],
      });

      const response = await this.client.send(command);
      logger.info({ email: params.email }, 'Cognito user signed up successfully');

      return {
        userSub: response.UserSub || '',
        codeDeliveryDetails: response.CodeDeliveryDetails,
      };
    } catch (error: any) {
      logger.error({ error, email: params.email }, 'Cognito signUp failed');
      if (error.name === 'UsernameExistsException') {
        throw AppError.conflict('Email already registered');
      }
      if (error.name === 'InvalidPasswordException') {
        throw AppError.badRequest('Password does not meet requirements');
      }
      throw AppError.internal(`Cognito sign up failed: ${error.message}`);
    }
  }

  async signIn(params: CognitoSignInParams): Promise<CognitoTokens> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: params.email,
          PASSWORD: params.password,
        },
      });

      const response = await this.client.send(command);

      if (response.ChallengeName === ChallengeNameType.MFA_SETUP || response.ChallengeName === ChallengeNameType.SOFTWARE_TOKEN_MFA) {
        throw AppError.badRequest('MFA challenge required', 'MFA_REQUIRED');
      }

      const result = response.AuthenticationResult;
      if (!result) {
        throw AppError.unauthorized('Authentication failed');
      }

      logger.info({ email: params.email }, 'Cognito user signed in successfully');

      return {
        accessToken: result.AccessToken || '',
        idToken: result.IdToken || '',
        refreshToken: result.RefreshToken || '',
        expiresIn: result.ExpiresIn || 3600,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error({ error, email: params.email }, 'Cognito signIn failed');
      if (error.name === 'NotAuthorizedException' || error.name === 'UserNotFoundException') {
        throw AppError.unauthorized('Invalid credentials');
      }
      if (error.name === 'UserNotConfirmedException') {
        throw AppError.badRequest('Email not verified. Please confirm your email first.', 'EMAIL_NOT_VERIFIED');
      }
      throw AppError.internal(`Cognito sign in failed: ${error.message}`);
    }
  }

  async confirmSignUp(email: string, confirmationCode: string): Promise<void> {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: confirmationCode,
      });

      await this.client.send(command);
      logger.info({ email }, 'Cognito user email confirmed');
    } catch (error: any) {
      logger.error({ error, email }, 'Cognito confirmSignUp failed');
      if (error.name === 'CodeMismatchException') {
        throw AppError.badRequest('Invalid confirmation code');
      }
      if (error.name === 'ExpiredCodeException') {
        throw AppError.badRequest('Confirmation code has expired');
      }
      throw AppError.internal(`Cognito confirm sign up failed: ${error.message}`);
    }
  }

  async forgotPassword(email: string): Promise<{ codeDeliveryDetails?: unknown }> {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
      });

      const response = await this.client.send(command);
      logger.info({ email }, 'Cognito forgot password initiated');

      return { codeDeliveryDetails: response.CodeDeliveryDetails };
    } catch (error: any) {
      logger.error({ error, email }, 'Cognito forgotPassword failed');
      if (error.name === 'UserNotFoundException') {
        // Don't reveal if user exists
        return { codeDeliveryDetails: undefined };
      }
      throw AppError.internal(`Cognito forgot password failed: ${error.message}`);
    }
  }

  async confirmForgotPassword(email: string, confirmationCode: string, newPassword: string): Promise<void> {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: confirmationCode,
        Password: newPassword,
      });

      await this.client.send(command);
      logger.info({ email }, 'Cognito password reset confirmed');
    } catch (error: any) {
      logger.error({ error, email }, 'Cognito confirmForgotPassword failed');
      if (error.name === 'CodeMismatchException') {
        throw AppError.badRequest('Invalid confirmation code');
      }
      throw AppError.internal(`Cognito confirm forgot password failed: ${error.message}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<CognitoTokens> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });

      const response = await this.client.send(command);
      const result = response.AuthenticationResult;

      if (!result) {
        throw AppError.unauthorized('Token refresh failed');
      }

      return {
        accessToken: result.AccessToken || '',
        idToken: result.IdToken || '',
        refreshToken: refreshToken, // Cognito doesn't always return a new refresh token
        expiresIn: result.ExpiresIn || 3600,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error({ error }, 'Cognito refreshToken failed');
      throw AppError.unauthorized('Invalid or expired refresh token');
    }
  }

  async getUser(accessToken: string): Promise<CognitoUserInfo> {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response = await this.client.send(command);
      const attributes = response.UserAttributes || [];

      const getAttr = (name: string): string | undefined =>
        attributes.find((a) => a.Name === name)?.Value;

      return {
        sub: getAttr('sub') || '',
        email: getAttr('email') || '',
        emailVerified: getAttr('email_verified') === 'true',
        firstName: getAttr('given_name'),
        lastName: getAttr('family_name'),
      };
    } catch (error: any) {
      logger.error({ error }, 'Cognito getUser failed');
      if (error.name === 'NotAuthorizedException') {
        throw AppError.unauthorized('Invalid or expired access token');
      }
      throw AppError.internal(`Cognito get user failed: ${error.message}`);
    }
  }

  async setupMFA(accessToken: string): Promise<{ secretCode: string; session?: string }> {
    try {
      const command = new AssociateSoftwareTokenCommand({
        AccessToken: accessToken,
      });

      const response = await this.client.send(command);

      return {
        secretCode: response.SecretCode || '',
        session: response.Session,
      };
    } catch (error: any) {
      logger.error({ error }, 'Cognito MFA setup failed');
      throw AppError.internal(`Cognito MFA setup failed: ${error.message}`);
    }
  }

  async verifyMFA(accessToken: string, totpCode: string, friendlyDeviceName?: string): Promise<void> {
    try {
      const command = new VerifySoftwareTokenCommand({
        AccessToken: accessToken,
        UserCode: totpCode,
        FriendlyDeviceName: friendlyDeviceName || 'authenticator-app',
      });

      await this.client.send(command);

      // Enable MFA preference
      const prefCommand = new SetUserMFAPreferenceCommand({
        AccessToken: accessToken,
        SoftwareTokenMfaSettings: {
          Enabled: true,
          PreferredMfa: true,
        },
      });

      await this.client.send(prefCommand);
      logger.info('Cognito MFA verified and enabled');
    } catch (error: any) {
      logger.error({ error }, 'Cognito MFA verification failed');
      if (error.name === 'EnableSoftwareTokenMFAException') {
        throw AppError.badRequest('Invalid TOTP code');
      }
      throw AppError.internal(`Cognito MFA verify failed: ${error.message}`);
    }
  }

  async respondToMFAChallenge(session: string, totpCode: string, email: string): Promise<CognitoTokens> {
    try {
      const command = new RespondToAuthChallengeCommand({
        ClientId: this.clientId,
        ChallengeName: ChallengeNameType.SOFTWARE_TOKEN_MFA,
        Session: session,
        ChallengeResponses: {
          USERNAME: email,
          SOFTWARE_TOKEN_MFA_CODE: totpCode,
        },
      });

      const response = await this.client.send(command);
      const result = response.AuthenticationResult;

      if (!result) {
        throw AppError.unauthorized('MFA challenge failed');
      }

      return {
        accessToken: result.AccessToken || '',
        idToken: result.IdToken || '',
        refreshToken: result.RefreshToken || '',
        expiresIn: result.ExpiresIn || 3600,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error({ error }, 'Cognito MFA challenge response failed');
      throw AppError.unauthorized('Invalid MFA code');
    }
  }
}

export const cognitoService = new CognitoService();
