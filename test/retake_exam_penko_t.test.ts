import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LidyaCdkProjectStack } from '../lib/retake_exam_penko_t-stack';

test('Stack matches snapshot', () => {
  const app = new cdk.App();
  const stack = new LidyaCdkProjectStack(app, 'TestStack');
  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});