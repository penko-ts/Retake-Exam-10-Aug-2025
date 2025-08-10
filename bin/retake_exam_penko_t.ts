import * as cdk from 'aws-cdk-lib';
import { LidyaCdkProjectStack } from '../lib/retake_exam_penko_t-stack';

const app = new cdk.App();

new LidyaCdkProjectStack(app, 'LidyaCdkProjectStackk', {
    env: {
        region: 'eu-central-1'
    }
});