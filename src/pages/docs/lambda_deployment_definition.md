---
title: "Lambda Deployment Definition"
navtitle: "Lambda Deployment Definition"
layout: ../../layouts/MdLayout.astro
---

# Lambda Deployment Definition

The deployment definition is a JSON configuration that specifies how Lambda functions should be deployed, including traffic shifting strategies, alarms, environment variables, and readiness checks. The structure of the deployment definition should follow the pattern shown below.

## Example of Deployment Definition File
```json
{
    "alias": "PROD",
    "trafficShiftingEnabled": true,
    "trafficShiftingConfig": {
        "percent": 50,
        "waitInterval": 60,
        "type": "CANARY"
    },
    "environmentVariables": {
        "region": "us-east-1"
    },
    "deleteOldVersion": true,
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

## Field Descriptions

### 1. alias
This field specifies the alias for the Lambda function. The alias is used to route traffic to a specific version of the Lambda function. This is a required field for does not assume a default value.

-- **alias (string):**
Defines the alias to associate with the deployment. This allows controlled traffic routing and versioning.

### 2. trafficShiftingEnabled
This field enables or disables traffic shifting for the deployment.

-- **trafficShiftingEnabled (boolean):**
If true, traffic is shifted gradually to the new version based on the configuration in trafficShiftingConfig. If false, all traffic is routed directly to the new version.

### 3. trafficShiftingConfig

Defines the traffic shifting strategy for the deployment. Traffic shifting enables gradual transitions to new Lambda versions.

-- **percent (int):**
Specifies the percentage of traffic to shift in each step. It should be a value between 0 and 100. Default is `20`

-- **waitInterval (int):**
Specifies the time (in seconds) to wait between incremental traffic shifts. Default is `60`

-- **type (string):**
Defines the type of traffic shifting strategy. Default is `CANARY`. Possible values are:
- CANARY: Gradually shifts traffic in two phases.
- LINEAR: Shifts traffic in equal increments over multiple intervals.
- ALL_AT_ONCE: Shifts all traffic at once.

### 4. environmentVariables

The environment section allows you to define the AWS region and account for the deployment. If not specified, it will default to the environment variables AWS_REGION and AWS_ACCOUNT.

-- **region (string):**
The AWS region to use for the deployment.

-- **account (string):**
The AWS account ID to use for the deployment.

### 5. alarms

Defines the CloudWatch alarms to monitor during the deployment. If alarms are triggered, the deployment will be rolled back. If not configured, the alarms are not monitored.

-- **alarmNames (list of strings):**
A list of CloudWatch alarm names to monitor.

### 6. readinessCheck

Specifies readiness checks to ensure the new version is stable and functional before routing traffic to it.

-- **waitInterval (int):**
The time (in seconds) to wait between readiness check retries. Default is `10`.

-- **maxRetries (int):**
The maximum number of retries allowed during the readiness check. Default is `5`.