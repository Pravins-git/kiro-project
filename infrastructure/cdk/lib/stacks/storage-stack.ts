import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

import { BaseStack, BaseStackProps } from './base-stack';

export class StorageStack extends BaseStack {
  public readonly stagingBucket: s3.Bucket;
  public readonly productionBucket: s3.Bucket;
  public readonly quarantineBucket: s3.Bucket;
  public readonly analyticsBucket: s3.Bucket;
  public readonly assetsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    const commonBucketProps: Partial<s3.BucketProps> = {
      removalPolicy: this.config.removalPolicy,
      autoDeleteObjects: !this.config.isProd,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: this.config.isProd,
    };

    // Staging bucket - temporary file storage during processing
    this.stagingBucket = new s3.Bucket(this, 'StagingBucket', {
      ...commonBucketProps,
      bucketName: this.prefixName('staging'),
      lifecycleRules: [
        {
          id: 'CleanupStagingFiles',
          expiration: cdk.Duration.days(7),
          enabled: true,
        },
      ],
    });

    // Production bucket - final processed files
    this.productionBucket = new s3.Bucket(this, 'ProductionBucket', {
      ...commonBucketProps,
      bucketName: this.prefixName('production'),
      versioned: true,
    });

    // Quarantine bucket - malware-detected files
    this.quarantineBucket = new s3.Bucket(this, 'QuarantineBucket', {
      ...commonBucketProps,
      bucketName: this.prefixName('quarantine'),
      lifecycleRules: [
        {
          id: 'DeleteQuarantinedFiles',
          expiration: cdk.Duration.days(30),
          enabled: true,
        },
      ],
    });

    // Analytics bucket - Parquet files for Power BI
    this.analyticsBucket = new s3.Bucket(this, 'AnalyticsBucket', {
      ...commonBucketProps,
      bucketName: this.prefixName('analytics'),
      lifecycleRules: [
        {
          id: 'ArchiveOldAnalytics',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(365),
            },
          ],
          enabled: true,
        },
      ],
    });

    // Assets bucket - static assets (profile photos, etc.)
    this.assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      ...commonBucketProps,
      bucketName: this.prefixName('assets'),
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'StagingBucketName', { value: this.stagingBucket.bucketName });
    new cdk.CfnOutput(this, 'ProductionBucketName', { value: this.productionBucket.bucketName });
    new cdk.CfnOutput(this, 'QuarantineBucketName', { value: this.quarantineBucket.bucketName });
    new cdk.CfnOutput(this, 'AnalyticsBucketName', { value: this.analyticsBucket.bucketName });
    new cdk.CfnOutput(this, 'AssetsBucketName', { value: this.assetsBucket.bucketName });
  }
}
