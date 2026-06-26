import * as cdk from 'aws-cdk-lib';
import * as opensearchserverless from 'aws-cdk-lib/aws-opensearchserverless';
import { Construct } from 'constructs';

import { BaseStack, BaseStackProps } from './base-stack';

export class SearchStack extends BaseStack {
  public readonly collection: opensearchserverless.CfnCollection;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    const collectionName = `${this.config.appName}-${this.config.envName}-vectors`;

    // Encryption policy (required for serverless collections)
    const encryptionPolicy = new opensearchserverless.CfnSecurityPolicy(
      this,
      'EncryptionPolicy',
      {
        name: `${this.config.envName}-enc-policy`,
        type: 'encryption',
        policy: JSON.stringify({
          Rules: [
            {
              Resource: [`collection/${collectionName}`],
              ResourceType: 'collection',
            },
          ],
          AWSOwnedKey: true,
        }),
      },
    );

    // Network policy (allow access from VPC or public for dev)
    const networkPolicy = new opensearchserverless.CfnSecurityPolicy(this, 'NetworkPolicy', {
      name: `${this.config.envName}-net-policy`,
      type: 'network',
      policy: JSON.stringify([
        {
          Rules: [
            {
              Resource: [`collection/${collectionName}`],
              ResourceType: 'collection',
            },
            {
              Resource: [`collection/${collectionName}`],
              ResourceType: 'dashboard',
            },
          ],
          AllowFromPublic: !this.config.isProd,
        },
      ]),
    });

    // OpenSearch Serverless Collection
    this.collection = new opensearchserverless.CfnCollection(this, 'VectorCollection', {
      name: collectionName,
      type: 'VECTORSEARCH',
      description: 'Vector search collection for career path and student profile embeddings',
    });

    this.collection.addDependency(encryptionPolicy);
    this.collection.addDependency(networkPolicy);

    // Outputs
    new cdk.CfnOutput(this, 'CollectionEndpoint', {
      value: this.collection.attrCollectionEndpoint,
      description: 'OpenSearch Serverless collection endpoint',
    });

    new cdk.CfnOutput(this, 'CollectionArn', {
      value: this.collection.attrArn,
      description: 'OpenSearch Serverless collection ARN',
    });
  }
}
