---
title: "Lambda Deployment Definition"
navtitle: "Lambda Deployment Definition"
layout: ../../layouts/MdLayout.astro
---

# Lambda Deployment Definition
The deployment definition is a JSON configuration that specifies how Lambda functions should be deployed, including traffic shifting strategies, alarms, environment variables, and readiness checks. The following attributes can be specified in the Lambda deployment definition (`_lambdadepdef.json`) file.

## Environment setting for Lambda function deployment
### environment
This setting allows you to change the region for an ECS service deployment. For example, you change the `region` attribute in the environment and deploy the same service to different regions.  

-- **region (string)**
The AWS region where the service should be deployed. If this setting is not provided, then the region for the service deployment is derived from the `AWS_REGION` environment variable set when installing Gitmoxi.

-- **account (string)**
The AWS account ID where the service should be deployed. Currently, Gitmoxi only supports deployment to the same AWS account where Gitmoxi is installed. If this setting is not provided, then the account id for the service deployment is derived from the `AWS_ACCOUNT` environment variable set when installing Gitmoxi.

-- **Example configuration**
```json
    "environment": {
        "region": "us-west-2",
        "account": "12345"
    }
```
## Traffic shifting configurations
## alias (string) (required)
This field specifies the alias for the Lambda function. The alias is used to route traffic to a specific version of the Lambda function. This is a required field and does not assume a default value.

-- **Example configuration**
```json
    "alias": "PROD"
```

### trafficShiftingConfig
Defines the traffic shifting strategy for the deployment. Traffic shifting enables gradual transitions to new Lambda versions. The presence of `trafficShiftingConfig` setting with a dictionary value signals traffic shifting is enabled.

-- **percent (int) [default: 20]:**
Specifies the percentage of traffic to shift in each step. It should be a value between 0 and 100. 

-- **waitInterval (int) [default: 60]:**
Specifies the time (in seconds) to wait between incremental traffic shifts. 

-- **type (string) [default: CANARY]:**
Defines the type of traffic shifting strategy. The possible values are:
- CANARY: Gradually shifts traffic in two phases.
- LINEAR: Shifts traffic in equal increments over multiple intervals.
- ALL_AT_ONCE: Shifts all traffic at once.

-- **Example configuration**
```json
    "trafficShiftingConfig": { 
        "percent": 20,
        "waitInterval": 60, 
        "type" : "CANARY"
    }
```

### alarms
Defines the CloudWatch alarms to monitor during the deployment. If alarms are triggered, the deployment will be rolled back. If not configured, the alarms are not monitored.

-- **alarmNames (list of strings) [default: []]:**
A list of CloudWatch alarm names to monitor.

-- **Example configuration**
```json
    "alarms": { 
        "alarmNames": 
            [
                "string",
                ...
            ]
    }
```
## Lambda function readiness check
### readinessCheck
Specifies readiness checks to ensure the new version is stable and functional before routing traffic to it.

-- **waitInterval (int) [default: 10]:**
The time (in seconds) to wait between readiness check retries.

-- **maxRetries (int) [default: 5]:**
The maximum number of retries allowed during the readiness check.
-- **Example configuration**
```json
"readinessCheck": {
        "waitInterval": 10,
        "maxRetries": 5
    }
```
## Full example
Following is a full example of Lambda deployment definition (`_lambdadepdef.json`) file:
```json
{
    "alias": "PROD",
    "environment": {
        "region": "us-east-1"
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