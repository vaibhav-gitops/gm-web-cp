---
title: "Lambda Event Source Mapping"
navtitle: "Lambda Event Source Mapping"
layout: ../../layouts/MdLayout.astro
---

# Lambda Event Source Mapping

AWS Lambda functions can interact with various event sources through Lambda Event Source Mapping Configuration. This feature enables seamless integration between your Lambda functions and AWS services by supporting both push-based and pull-based event sources.

## Supported Event Sources

GitMoxi currently supports:

| Event Source Type | Supported Services |
|------------------|---------------------|
| **Push-based** | API Gateway, Elastic Load Balancer |
| **Pull-based** | All sources supported by the [Lambda Event Source Mapping API](https://docs.aws.amazon.com/lambda/latest/dg/invocation-eventsourcemapping.html) |

## Configuration File

Event source mappings are defined in the `_lambdaeventsourcedef.json` file, which contains configurations for both push and pull event sources.

## Push Event Sources

Push event sources automatically invoke Lambda functions based on service-specific triggers, with each service having its own configuration requirements.

### Elastic Load Balancer (ELB)

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `Service` | string | Yes | Must be `elasticloadbalancing.amazonaws.com` |
| `TargetGroupArn` | string | Yes | ARN of the target group associated with the Lambda function |

**Example:**
```json
{
  "Service": "elasticloadbalancing.amazonaws.com",
  "TargetGroupArn": "<target-group-arn>"
}
```

### API Gateway

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `Service` | string | Yes | Must be `apigateway.amazonaws.com` |
| `ApiId` | string | Yes | Unique identifier of the API Gateway instance |
| `RouteId` | string | Yes | Identifier for the API's endpoint or route |
| `AliasStageVariableName` | string | No | Name of the stage variable pointing to a specific Lambda alias (useful for versioning deployments) |

**Example:**
```json
{
  "Service": "apigateway.amazonaws.com",
  "ApiId": "<api-id>",
  "RouteId": "<api-route-id>",
  "AliasStageVariableName": "lambdaAlias"
}
```

## Pull Event Sources

Pull event sources use Event Source Mapping to poll the source and invoke the Lambda function with batch processing capabilities.

### Configuration Parameters

For pull event sources, use the exact configuration parameters required by the [Lambda Event Source Mapping API](https://docs.aws.amazon.com/lambda/latest/dg/invocation-eventsourcemapping.html). GitMoxi passes these parameters directly to the AWS API.

**Common parameters include:**

| Parameter | Description |
|-----------|-------------|
| `EventSourceArn` | ARN of the event source (e.g., SQS queue, DynamoDB stream) |
| `FunctionName` | Name or ARN of the Lambda function |
| `BatchSize` | Maximum number of items to retrieve in a single batch |
| `MaximumBatchingWindowInSeconds` | Maximum amount of time to gather records before invoking the function |

## Complete Example

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
      "AliasStageVariableName": "lambdaAlias"
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

> **Note:** Replace placeholder values with your actual resource identifiers when implementing this configuration.
