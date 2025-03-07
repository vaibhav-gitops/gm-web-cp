---
title: "Lambda Event Source Mapping"
navtitle: "Lambda Event Source Mapping"
layout: ../../layouts/MdLayout.astro
---

# Lambda Event Source Mapping

The Lambda Event Source Mapping Configuration defines how AWS Lambda functions interact with different event sources. It supports both **push-based** and **pull-based** event sources, enabling seamless integration with services like API Gateway, SQS, Elastic Load Balancing, among many others. Currently, GitMoxi supports API Gateway and Elastic Loader Balancer as the push-based event sources. In addition, GitMoxi supports all the pull-based event sources supported by the <a href="https://docs.aws.amazon.com/lambda/latest/dg/invocation-eventsourcemapping.html" target="_blank">Lambda Event Source Mapping API</a>.

The following attributes can be specified in the Lambda event source definition (`_lambdaeventsourcedef.json`) file.

## Defining the push event sources
### PushEventSources
Defines the configuration for push-based event sources. Push event sources automatically invoke the Lambda function based on service-specific triggers.

#### Elastic Load Balancer Configuration
- **Service (string) (required):** AWS service responsible for invoking the Lambda function. For ELB, this should be `elasticloadbalancing.amazonaws.com`. 

- **TargetGroupArn (string) (required):** For Elastic Load Balancer (ELB) integrations, this is the Amazon Resource Name (ARN) of the target group associated with the Lambda function.

#### API Gateway Configuration
- **Service (string) (required):** AWS service responsible for invoking the Lambda function. For API Gateway, this should be `apigateway.amazonaws.com`. 

- **ApiId (string) (required):** This is the unique identifier of the API Gateway instance.

- **RouteId (string) (required):** This specifies the Route ID to identify the API's endpoint or route.

- **AliasStageVariableName (string) [Optional]:** This field specifies the name of the stage variable pointing to a specific Lambda alias. Useful for versioning deployments in API Gateway.

### Defining the pull event sources
Pull event sources use Event Source Mapping to poll the event source and invoke the Lambda function with batch processing. For Pull event sources, use the exact configuration required by the <a href="https://docs.aws.amazon.com/lambda/latest/dg/invocation-eventsourcemapping.html" target="_blank">Lambda Event Source Mapping API</a>. GitMoxi will use that same configuration to setup/update the event source mapping for your Lambda Function.

## Full example
Following is the full example of a push-based Lambda event source definition (`_lambdaeventsourcedef.json`) file:
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