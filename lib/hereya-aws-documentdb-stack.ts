import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import * as docdb from 'aws-cdk-lib/aws-docdb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class HereyaAwsDocumentdbStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = Vpc.fromLookup(this, 'VPC', {
            isDefault: true
        });

        const cluster = new docdb.DatabaseCluster(this, 'Database', {
            masterUser: {
                username: 'myuser', // NOTE: 'admin' is reserved by DocumentDB
                excludeCharacters: '\"@/:?&=+$,#', // optional, defaults to the set "\"@/" and is also used for eventually created rotations
            },
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MEDIUM),
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC,
            },
            vpc,
            copyTagsToSnapshot: false,  // whether to save the cluster tags when creating the snapshot.
            removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
            parameterGroup: new docdb.ClusterParameterGroup(this, 'ParameterGroup', {
                family: 'docdb5.0',
                parameters: {
                    'tls': 'disabled',
                },
            }),
        });
        cluster.connections.allowDefaultPortFromAnyIpv4('Open to the world');


        // Extract the secret details
        const secret = cluster.secret!;
        const username = secret.secretValueFromJson('username').unsafeUnwrap(); // Retrieve as string
        const password = secret.secretValueFromJson('password').unsafeUnwrap(); // Retrieve as string
        const host = cluster.clusterEndpoint.hostname;
        const port = cluster.clusterEndpoint.port;
        const replicaSetName = 'rs0'


        // Store the MONGO_URL in Secrets Manager
        const mongoPassword = new secretsmanager.Secret(this, 'mongoPasswordSecret', {
            secretStringValue: cdk.SecretValue.unsafePlainText(password),
            description: 'MongoDB connection string for DocumentDB cluster',
        });

        new cdk.CfnOutput(this, 'mongoUsername', {
            value: username,
        });

        new cdk.CfnOutput(this, 'mongoPassword', {
            value: mongoPassword.secretArn,
        });

        new cdk.CfnOutput(this, 'mongoHost', {
            value: host,
        });

        new cdk.CfnOutput(this, 'mongoPort', {
            value: port.toString(),
        });

        new cdk.CfnOutput(this, 'mongoReplicaSet', {
            value: replicaSetName,
        });


        // export DB name
        new cdk.CfnOutput(this, 'mongoDbname', {
            value: 'mydb',
        });
    }
}
