#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { HereyaAwsDocumentdbStack } from '../lib/hereya-aws-documentdb-stack';

const app = new cdk.App();
new HereyaAwsDocumentdbStack(app, process.env.STACK_NAME!, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});
