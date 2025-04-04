---
title: "Lambda Deployment Definition"
navtitle: "Lambda Deployment Definition"
layout: ../../layouts/MdLayout.astro
---

# Lambda Deployment Definition

This document outlines the JSON configuration that specifies how AWS Lambda functions should be deployed using Gitmoxi, including traffic shifting strategies, alarms, environment variables, and readiness checks.

## Environment Settings

### `environment`

Configure the deployment environment for your Lambda function.

| Property | Type | Description |
|----------|------|-------------|
| `region` | string | The AWS region for function deployment. If not provided, uses the `AWS_REGION` environment variable set during Gitmoxi installation. |
| `account` | string | The AWS account ID for function deployment. Currently, Gitmoxi only supports deployment to the same AWS account where it's installed. If not provided, uses the `AWS_ACCOUNT` environment variable. |

**Example:**
```json
"environment": {
    "region": "us-west-2",
    "account": "123456789012"
}
```

## Alias Configuration

### `alias` (Required)

| Type | Default | Description |
|------|---------|-------------|
| string | *none* | Specifies the alias for the Lambda function. The alias is used to route traffic to a specific version of the function. This is a required field with no default value. |

**Example:**
```json
"alias": "PROD"
```

## Traffic Shifting Configuration

### `trafficShiftingConfig`

Define the traffic shifting strategy for your Lambda deployment. The presence of this setting with a dictionary value enables traffic shifting, which allows gradual migration from the old to new Lambda function versions.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `percent` | integer | 20 | Percentage of traffic to shift in each step (0-100). |
| `waitInterval` | integer | 60 | Time in seconds to wait between traffic shifting steps. |
| `type` | string | "CANARY" | Traffic shifting strategy type: <br>• `CANARY`: Gradually shifts traffic in two phases<br>• `LINEAR`: Shifts traffic in equal increments over multiple intervals<br>• `ALL_AT_ONCE`: Shifts all traffic at once |

**Example:**
```json
"trafficShiftingConfig": { 
    "percent": 20,
    "waitInterval": 60, 
    "type": "CANARY"
}
```

## Alarm Configuration

### `alarms`

CloudWatch alarms to monitor during deployment. If any of the specified alarms trigger, the deployment will be rolled back.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `alarmNames` | array | `[]` | List of CloudWatch alarm names to monitor during deployment. |

**Example:**
```json
"alarms": { 
    "alarmNames": [
        "HighLatencyAlarm",
        "ErrorRateAlarm"
    ]
}
```

## Readiness Check Configuration

### `readinessCheck`

Specifies readiness checks to ensure the new version is stable and functional before routing traffic to it.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `waitInterval` | integer | 10 | Time in seconds to wait between readiness check retries. |
| `maxRetries` | integer | 5 | Maximum number of retries allowed during the readiness check. |

**Example:**
```json
"readinessCheck": {
    "waitInterval": 10,
    "maxRetries": 5
}
```

## Complete Example

Below is a comprehensive example of a Lambda deployment definition (`_lambdadepdef.json`):

```json
{
    "alias": "PROD",
    "environment": {
        "region": "us-east-1",
        "account": "123456789012"
    },
    "trafficShiftingConfig": {
        "percent": 50,
        "waitInterval": 60,
        "type": "CANARY"
    },
    "alarms": {
        "alarmNames": [
            "HighLatencyAlarm",
            "ErrorRateAlarm"
        ]
    },
    "readinessCheck": {
        "waitInterval": 10,
        "maxRetries": 5
    }
}
```