---
title: "Lambda Event Source Mapping"
navtitle: "Lambda Event Source Mapping"
layout: ../../layouts/MdLayout.astro
---

# Lambda Event Source Mapping

The Lambda Event Source Mapping Configuration defines how AWS Lambda functions interact with different event sources. It supports both **push-based** and **pull-based** event sources, enabling seamless integration with services like API Gateway, SQS, Elastic Load Balancing, among many others.

Currently, GitMoxi supports API Gateway and Elastic Loader Balancer as the push-based event sources are API Gateway and Elastic Loader Balancer. In addition, GitMoxi supports all pull-based event sources supported by the <a href="https://docs.aws.amazon.com/lambda/latest/dg/invocation-eventsourcemapping.html" target="_blank">Lambda Event Source Mapping API</a>.

## Example Configuration File
```json
{
  "PushEventSources": [
    {
      "Service": "elasticloadbalancing.amazonaws.com",
      "TargetGroupArn": "<target-group-arn>"
    },
    {
      "Service": "apigateway.amazonaws.com",
      "ApiId": "<api-id>",
      "RouteId": "<api-route-id>",
      "AlaisStageVariableName": "lambdaAlias"
    }
  ],
  "PullEventSources": {
    "EventSourceMapping": {
      "EventSourceArn": "<sqs-arn>",
      "FunctionName": "MyLambdaFunction",
      "BatchSize": 10,
      "MaximumBatchingWindowInSeconds": 60
    }
  }
}
```

## Field Descriptions

### 1. PushEventSources

Defines the configuration for push-based event sources. Push event sources automatically invoke the Lambda function based on service-specific triggers.

#### 1.1 Elastic Load Balancer Configuration
- **Service (string):** AWS service responsible for invoking the Lambda function. For ELB, this should be `elasticloadbalancing.amazonaws.com`. 

- **TargetGroupArn (string):** For Elastic Load Balancer (ELB) integrations, this is the Amazon Resource Name (ARN) of the target group associated with the Lambda function.

#### 1.2 API Gateway Configuration
- **Service (string):** AWS service responsible for invoking the Lambda function. For API Gateway, this should be `apigateway.amazonaws.com`. 

- **ApiId (string):** This is the unique identifier of the API Gateway instance.

- **RouteId (string):** This specifies the Route ID to identify the API's endpoint or route.

- **[Optional] AliasStageVariableName (string):** This field specifies the name of the stage variable pointing to a specific Lambda alias. Useful for versioning deployments in API Gateway.

### 2. PullEventSources

Defines the configuration for pull-based event sources. Pull event sources use Event Source Mapping to poll the event source and invoke the Lambda function with batch processing. 

For Pull event sources, use the exact configuration required by the <a href="https://docs.aws.amazon.com/lambda/latest/dg/invocation-eventsourcemapping.html" target="_blank">Lambda Event Source Mapping API</a>. GitMoxi will use that same configuration to setup/update the event source mapping for your Lambda Function.



