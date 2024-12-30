---
title: "ECS Deployment Definition"
navtitle: "ECS Deployment Definition"
layout: ../../layouts/MdLayout.astro
---

# ECS Deployment Definition

The deployment definition is a JSON configuration that specifies how ECS services should be deployed, including traffic shifting strategies, alarms, circuit breakers, and stability checks. The structure of the deployment definition should follow the pattern shown below.

## Example of Deployment Definition File
```json
{
    "trafficShiftingConfig": {
        "percent": 20,
        "waitInterval": 30,
        "type": "LINEAR"
    },
    "targetGroupArns": [
        "<target-group-arn-1>",
        "<target-group-arn-2>"
    ],
    "alarms": {
        "alarmNames": [
            "<alarm-name-1>",
            "<alarm-name-2>"
        ]
    },
    "stabilityCheck": {
        "timeoutPerTask": 25,
        "timeout": 220
    },
    "gmDeploymentCircuitBreaker": {
        "rollback": true,
        "failureThresholdPercent": 25
    }
}
```

## Field Descriptions

### 1. trafficShiftingConfig

This field defines the traffic shifting strategy for your ECS deployment. Traffic shifting allows you to gradually shift traffic from the old task set to the new task set, ensuring smooth transitions during deployments.

-- **percent (int):**
Specifies the percentage of traffic to shift in each step. It should be a value between 0 and 100.
Example: 20 means 20% of the traffic will be shifted at each interval. Default is `20`.

-- **waitInterval (int):**
Specifies the time (in seconds) to wait between traffic shifting steps. For example, if the percent is set to 20 and waitInterval is set to 30, 20% of the traffic will be shifted every 30 seconds. Default is `60`.

-- **type (string):**
Specifies the type of traffic shifting strategy to use. Default is `CANARY`. Possible values are:
- CANARY: Gradually shifts traffic in two phases.
- LINEAR: Shifts traffic in equal increments over multiple intervals.
- ALL_AT_ONCE: Shifts all traffic at once.

### 2. targetGroupArns

This field defines the target groups to which the ECS service will route traffic. These target groups are typically used with an Elastic Load Balancer and the multiple target groups defined are used for traffic shifting during blue/green and canary deployments.  

-- **targetGroupArns (list of strings):**
A list of Amazon Resource Names (ARNs) of the target groups that the ECS service will route traffic to.

### 3. alarms

Defines the alarms that are used to monitor the health of your ECS deployment during the deployment process. If not configured, the alarms are not monitored. 

-- **alarmNames (list of strings):**
A list of the names of CloudWatch alarms to monitor during the deployment. These alarms can be based on ECS service metrics (e.g., CPU utilization, memory usage).

### 4. stabilityCheck

Stability checks ensure that the ECS deployment is healthy and meets the specified requirements before proceeding further. The stabilityCheck field is always enabled with default values unless explicitly overridden.

-- **timeoutPerTask (int):**
The time (in seconds) to wait for each individual task during the stability check. If the task does not pass within this time, the deployment is considered failed. Default is `30`.

-- **timeout (int):**
The total timeout (in seconds) for the entire stability check. If the total time exceeds this limit, the deployment is considered failed. Default is `300`.

### 5. gmDeploymentCircuitBreaker

The deployment circuit breaker is a safety mechanism to automatically roll back a deployment if it fails or meets certain thresholds. If not configured, the deployment circuit breaker is disabled.

-- **rollback (boolean):**
Specifies whether to roll back the deployment if the circuit breaker is triggered. If true, the deployment will be rolled back in case of failure. Default is `false`. 

-- **failureThresholdPercent (int):**
Defines the failure threshold as a percentage of desired tasks. If the failure rate exceeds this threshold, the deployment will be rolled back. Default is `50`.

### 6. deleteNewUponTrafficShiftFailure

-- **deleteNewUponTrafficShiftFailure (boolean):**
If true, ECS will delete the new task set if traffic shifting fails. Default is `true`.

### 7. deleteOldUponSuccess

-- **deleteOldUponSuccess (boolean):**
If true, ECS will delete the old task set if the deployment is successful. Default is `true`.

### 8. environment

The environment section allows you to define the AWS region and account for the deployment. If not specified, it will default to the environment variables AWS_REGION and AWS_ACCOUNT.

-- **region (string):**
The AWS region to use for the deployment.

-- **account (string):**
The AWS account ID to use for the deployment.