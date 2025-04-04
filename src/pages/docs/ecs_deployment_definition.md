---
title: "ECS Deployment Definition"
navtitle: "ECS Deployment Definition"
layout: ../../layouts/MdLayout.astro
---
# ECS Deployment Definition

This document outlines the JSON configuration that specifies how ECS services should be deployed using Gitmoxi, including traffic shifting strategies, alarms, circuit breakers, and stability checks.

## Environment Settings

### `environment`

Configure the deployment environment for your ECS service.

| Property | Type | Description |
|----------|------|-------------|
| `region` | string | The AWS region for service deployment. If not provided, uses the `AWS_REGION` environment variable set during Gitmoxi installation. |
| `account` | string | The AWS account ID for service deployment. Currently, Gitmoxi only supports deployment to the same AWS account where it's installed. If not provided, uses the `AWS_ACCOUNT` environment variable. |

**Example:**
```json
"environment": {
    "region": "us-west-2",
    "account": "123456789012"
}
```

## Traffic Shifting Configuration

### `trafficShiftingConfig`

Define the traffic shifting strategy for your ECS deployment. The presence of this setting with a dictionary value enables traffic shifting, which allows gradual migration from old to new task sets. Currently works only with ECS services using Application Load Balancers (ALB).

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

### `targetGroupArnPairs`

A list of target group ARN pairs used for traffic shifting. Gitmoxi iterates through each active target group and uses this configuration to find the corresponding traffic shifting target group. Gitmoxi automatically toggles between the configured target group pairs.

**Example:**
```json
"targetGroupArnPairs": [
    [ 
        "arn:aws:elasticloadbalancing:us-east-2:XXXXXXX:targetgroup/blue-target-group/12345",
        "arn:aws:elasticloadbalancing:us-east-2:XXXXXXX:targetgroup/green-target-group/54321"
    ]
]
```

### `alarms`

CloudWatch alarms to monitor during traffic shifting. If any of the specified alarms trigger, traffic shifting is canceled and traffic is rolled back to old target groups.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `alarmNames` | array | `[]` | List of CloudWatch alarm names to monitor during traffic shifting. |

**Example:**
```json
"alarms": { 
    "alarmNames": [
        "HighCPUAlarm",
        "HighMemoryAlarm"
    ]
}
```

### `deleteNewUponTrafficShiftFailure`

| Type | Default | Description |
|------|---------|-------------|
| boolean | `true` | Controls whether to delete new tasks if traffic shifting fails. Traffic is always reverted to old tasks upon failure. Setting to `false` keeps tasks for troubleshooting. |

## Stability Check Configuration

### `stabilityCheck`

Ensures that the ECS deployment is healthy with the desired count of running tasks. This field is always enabled with default values.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `pollInterval` | integer | 30 | Polling interval in seconds to check for new task stability. |
| `timeout` | integer | 300 | Total timeout in seconds for the entire stability check. Deployment fails if new tasks aren't running within this time. |
| `timeoutPerTask` | integer | - | Estimated time in seconds for an individual task to become ready. Total timeout = timeoutPerTask × desired count of tasks. |

When both `timeout` and `timeoutPerTask` are specified, the maximum value is used: `max(timeout, timeoutPerTask × desired_count)`.

**Example:**
```json
"stabilityCheck": { 
    "pollInterval": 30, 
    "timeout": 300, 
    "timeoutPerTask": 60
}
```

## Circuit Breaker Configuration

### `gmDeploymentCircuitBreaker`

Monitors how many new tasks fail to reach RUNNING status. If failures exceed the configured threshold, the deployment is considered failed. This setting must be present in the `_depdef.json` file to enable circuit breaking.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `failureThreshold` | integer | 5 | Absolute number of task failures allowed before deployment fails. Use a small value for low failure tolerance. |
| `failureThresholdPercent` | integer | - | Failure threshold as a percentage of desired task count. Calculated as: failureThresholdPercent × desired count of tasks. |

When both thresholds are specified, the minimum value is used: `min(failureThreshold, failureThresholdPercent × desired_count)`.

**Example:**
```json
"gmDeploymentCircuitBreaker": { 
    "failureThreshold": 5,
    "failureThresholdPercent": 30
}
```

## Rollback Configuration

### `deleteNewUponFailure`

| Type | Default | Description |
|------|---------|-------------|
| boolean | `true` | Controls whether to delete new tasks if the deployment fails for any reason, including circuit breaker threshold breaches or stability check failures. |

## Capacity Provider Configuration

### `fallbackCapacityProviderStrategy`

Allows specifying a fallback capacity provider strategy if the primary strategy can't fulfill the desired number of tasks. For example, using FARGATE as a fallback when FARGATE_SPOT cannot provide enough capacity.

The value is a list of [ECS Capacity Provider Strategy Items](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_CapacityProviderStrategyItem.html).

**Example:**
```json
"fallbackCapacityProviderStrategy": [
    {
        "capacityProvider": "FARGATE",
        "weight": 1
    }
]
```

## Complete Example

Below is a comprehensive example of an ECS deployment definition (`_depdef.json`):

```json
{
    "environment": {
        "region": "us-west-2",
        "account": "123456789012"
    },
    "trafficShiftingConfig": {
        "percent": 20,
        "waitInterval": 60,
        "type": "CANARY"
    },
    "targetGroupArnPairs": [
        [
            "arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/blue-tg/12345",
            "arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/green-tg/54321"
        ]
    ],
    "alarms": {
        "alarmNames": [
            "HighCPUAlarm",
            "HighMemoryAlarm",
            "HighErrorRateAlarm",
            "HighLatencyAlarm"
        ]
    },
    "deleteNewUponTrafficShiftFailure": true,
    "stabilityCheck": {
        "pollInterval": 30,
        "timeout": 300,
        "timeoutPerTask": 60
    },
    "deleteNewUponFailure": true,
    "gmDeploymentCircuitBreaker": {
        "failureThreshold": 5,
        "failureThresholdPercent": 30
    },
    "fallbackCapacityProviderStrategy": [
        {
            "capacityProvider": "FARGATE",
            "weight": 1
        }
    ]
}
```
