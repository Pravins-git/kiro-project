import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

import { BaseStack, BaseStackProps } from './base-stack';

export class SecurityStack extends BaseStack {
  public readonly encryptionKey: kms.Key;
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    // ─── KMS Encryption Key ────────────────────────────────────────────
    this.encryptionKey = new kms.Key(this, 'EncryptionKey', {
      alias: `alias/${this.prefixName('encryption')}`,
      description: 'KMS key for encrypting sensitive data in AI Career Platform',
      enableKeyRotation: true,
      removalPolicy: this.config.removalPolicy,
      pendingWindow: cdk.Duration.days(7),
    });

    // ─── WAF WebACL ────────────────────────────────────────────────────
    this.webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
      name: this.prefixName('waf'),
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      description: 'WAF WebACL for AI Career Platform API protection',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: this.prefixName('waf-metrics'),
        sampledRequestsEnabled: true,
      },
      rules: [
        // Rate Limiting Rule — 2000 requests per 5 minutes per IP
        {
          name: 'RateLimitRule',
          priority: 1,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: this.prefixName('waf-rate-limit'),
            sampledRequestsEnabled: true,
          },
        },
        // AWS Managed Rule — SQL Injection Protection
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: this.prefixName('waf-sqli'),
            sampledRequestsEnabled: true,
          },
        },
        // AWS Managed Rule — XSS Protection
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: this.prefixName('waf-bad-inputs'),
            sampledRequestsEnabled: true,
          },
        },
        // AWS Managed Rule — Common Rule Set (XSS, path traversal, etc.)
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 4,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
              excludedRules: [
                { name: 'SizeRestrictions_BODY' }, // Allow larger bodies for resume uploads
              ],
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: this.prefixName('waf-common'),
            sampledRequestsEnabled: true,
          },
        },
        // AWS Managed Rule — Bot Control
        {
          name: 'AWSManagedRulesBotControlRuleSet',
          priority: 5,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesBotControlRuleSet',
              managedRuleGroupConfigs: [
                {
                  awsManagedRulesBotControlRuleSet: {
                    inspectionLevel: 'COMMON',
                  },
                },
              ],
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: this.prefixName('waf-bot-control'),
            sampledRequestsEnabled: true,
          },
        },
        // Block requests from specific countries (optional, customize as needed)
        // Geo-restriction can be added here if required
      ],
    });

    // ─── Outputs ───────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.encryptionKey.keyArn,
      description: 'KMS encryption key ARN',
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: this.encryptionKey.keyId,
      description: 'KMS encryption key ID',
    });

    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAcl.attrArn,
      description: 'WAF WebACL ARN',
    });

    new cdk.CfnOutput(this, 'WebAclId', {
      value: this.webAcl.attrId,
      description: 'WAF WebACL ID',
    });
  }
}
