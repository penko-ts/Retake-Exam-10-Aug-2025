import * as cdk from 'aws-cdk-lib';
import { CfnOutput, Duration } from 'aws-cdk-lib';
import { SnsDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Protocol } from 'aws-cdk-lib/aws-ec2';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Code, Runtime, Function } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Lambda } from 'aws-cdk-lib/aws-ses-actions';
import { Subscription, Topic, SubscriptionProtocol } from 'aws-cdk-lib/aws-sns';
import { Construct, Node } from 'constructs';
import path from 'path';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { table } from 'console';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { HttpMethod } from 'aws-cdk-lib/aws-events';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';


export class LidyaCdkProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  
    const WebsiteBucket = new Bucket(this, 'staticWebsiteBucket', {
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
      }
    });

    const bucketDeployment = new BucketDeployment(this, 'indexDeployment', {
      sources: [Source.asset(path.join(__dirname, '../website-assets'))],
      destinationBucket: WebsiteBucket
    });

    const topic = new Topic(this,'FavoriteCatTopic',{
      displayName: 'Favorite Cat Topic',
    });
    const subscription = new Subscription(this,'LidyaSubscription',{
      protocol: SubscriptionProtocol.EMAIL,
      endpoint: 'penko.aprilci@gmail.com',
      topic,
    });

    const emailRecipient = 'penko.aprilci@gmail.com';

    // DynamoDB table
    const table = new Table(this, 'FavoriteCatTable', {
      partitionKey: { 
        name: 'PK', 
        type: AttributeType.STRING },
      sortKey: {
        name: 'SK',
        type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Lambda function to save cat and send SNS
    const saveCatLambda = new NodejsFunction(this, 'SaveCatLambda', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: {
        TABLE_NAME: table.tableName,
        TOPIC_ARN: topic.topicArn
      }
    });
    table.grantReadWriteData(saveCatLambda);
    topic.grantPublish(saveCatLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, 'CatApi', {
      restApiName: 'Cat API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      }
    });
    const saveCatIntegration = new apigateway.LambdaIntegration(saveCatLambda);
    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(WebsiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      }
    });
    
    
    new cdk.CfnOutput(this, 'WebsiteURL', { value: distribution.domainName });
    new cdk.CfnOutput(this, 'ApiURL', { value: api.url });
  }
}
