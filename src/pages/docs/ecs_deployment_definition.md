---
title: "ECS Deployment Definition"
navtitle: "ECS Deployment Definition"
layout: ../../layouts/MdLayout.astro
---

# ECS deployment definition
The deployment definition is a JSON configuration that specifies how ECS services should be deployed, including traffic shifting strategies, alarms, circuit breakers, and stability checks. The following attributes can be specified in the ECS deployment definition (`_depdef.json`) file.

## Environment setting for ECS service deployment
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
### trafficShiftingConfig
This setting defines the traffic shifting strategy for your ECS deployment. The presence of `trafficShiftingConfig` setting with a dictionary value signals traffic shifting is enabled. Traffic shifting allows you to gradually shift traffic from the old task set to the new task set, ensuring smooth transitions and easy rollbacks during deployments. The traffic shifting currently works only for ECS services that use an Application Load Balancer (ALB).

-- **percent (int) [default: 20]:**
Specifies the percentage of traffic to shift in each step. It should be a value between 0 and 100.
Example: 20 means 20% of the traffic will be shifted at each interval. 

-- **waitInterval (int) [default: 60]:**
Specifies the time (in seconds) to wait between traffic shifting steps. For example, for LINEAR traffic shift, if `percent` is set to 20 and `waitInterval` is set to 30, 20% of the traffic will be shifted every 30 seconds. Default is `60`.

-- **type (string) [default: CANARY]:**
Specifies the type of traffic shifting strategy to use. Possible values are:
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

### targetGroupArnPairs
A list of **target group ARN pairs** to be used for traffic shifting for ECS service. For an ECS service that is using Application Load Balancer (ALB), Gitmoxi will iterate through each active target group and use this configuration to find the corressponding traffic shifting target group. For example, if your ECS service is currently using `blue-target-group`, and the configuration is `"targetGroupArnPairs": [[ "arn:xxx:targetgroup/blue-target-group/12345", "arn:xxx:targetgroup/green-target-group/54321"]]`, then during the blue-green delpoyment Gitmoxi will register new tasks to the `green-target-group` and shift the traffic based on `trafficShiftingConfig` setting. Gitmoxi automatically toggles between the configured target group pairs, that is, if `blue-target-group` is in use by current tasks then `green-target-group` will be used for new, and vice-versa.

-- **example configruation**
```json
    "targetGroupArnPairs": [
        [ 
            "arn:aws:elasticloadbalancing:us-east-2:XXXXXXX:targetgroup/blue-target-group/12345",
            "arn:aws:elasticloadbalancing:us-east-2:XXXXXXX:targetgroup/green-target-group/54321"
        ]
    ]
```

### alarms
The list of CloudWatch alarm names to monitor during traffic shifting. If **any of the alarms** are in triggered state then the traffic shifting is cancelled and traffic is rolled back to old target groups.

-- **alarmNames (list of strings) [default: []]**:
Specifies the list of CloudWatch alarm names for monitoring during traffic shifting. 

-- **Example configuration**
```json
    "alarms": { 
        "alarmNames": [
            "string"
        ]
    }
```

### deleteNewUponTrafficShiftFailure (bool) [default:true]
Flag to control whether to delete the new tasks or keep them if the traffic shifting fails. The traffic is always reverted to old tasks upon failure. This flag merely controls whether to keep the tasks around, for example, for troubleshooting purposes. 

## ECS deployment stability check configurations
### stabilityCheck
Stability checks ensure that the ECS deployment is healthy, that is, the desired count of new tasks are running. The stabilityCheck field is always enabled with default values.

-- **pollInterval (int) [default: 30]**
The polling interval (in seconds) to check for the stability of new tasks. 

-- **timeout (int) [default: 300]:**
The total timeout (in seconds) for the entire stability check. If all the new tasks aren't running within this time limit, then the deployment is considered to be failed.  

-- **timeoutPerTask (int):**
The estimated time taken by an individual task to become ready for traffic. The `total timeout = timeoutPerTask * desired count of tasks`. For example, if the desired count of tasks is 10 and each task takes 60s to get ready, then the total timeout will 600s. If you know how long each task takes to get ready, then use this parameter as it will flexibly determine the timeout window based on desired count. 

If you specify both the parameters, `timeout` and `timeoutPerTask`, then timeout = max (timeout, timeoutPerTask * desired_count of tasks); that is maximum value is used to wait for stability.

-- **Example configuration**
```json
    "stabilityCheck": { 
        "pollInterval": 30, 
        "timeout": 300, 
        "timeoutPerTask" : 60
    }
```

## Gitmoxi deployment circuit breaker configurations
### gmDeploymentCircuitBreaker
The Gitmoxi deployment circuit breaker checks how many new tasks are failing to getting ready (RUNNING status). If the number of failed tasks exceeds the configured failure threshold then the deployment is considered a failure. The `gmDeploymentCircuitBreaker` setting has to be present in the `_depdef.json` file for the Gitmoxi deployment circuit breaker to be enabled. 

-- **failureThreshold (int) [default:5]**
The failure threshold specific as absolute failure count number. If the number of new task failures exceeds the failure threshold setting, then the deployment is considered a failure. This setting should be used and set to an small value when the failure tolerance for the service deployment is really low.

-- **failureThresholdPercent (int)**
The failure threshold specified as percent of the service desired count of tasks. The `failure threshold = failureThresholdPercent * desired count of tasks`. For example, if the service desired count of tasks is 10 and `failureThresholdPercent` is 30, then the failure threshold will be 3. If both the `failureThreshold` and `failureThresholdPercent` is used then the minimum of the two setting is used. That is, `failure threshold = min (failureThreshold, failureThresholdPercent * desired_count of tasks)`. The `failureThresholdPercent` can be used when it is hard to determine an absolute failure threshold, for example, if the service desired count is highly dynamic due to autoscaling. 

-- **Example configuration**
```json
    "gmDeploymentCircuitBreaker": { 
        "failureThreshold": 5,
        "failureThresholdPercent" : 30
    }
```
## Rollback upon deployment failure
### deleteNewUponFailure (bool) [default: true]
This is the overall rollback setting to delete the new tasks if there is any failures, including when Gitmoxi deployment circuit breaker reports breach of failure thresholds or when the stability checks report lack of deployment stabilization.

-- **Example configuration**
```json
    "deleteNewUponFailure": true
```

## Fallback capacity provider configuration
### fallbackCapacityProviderStrategy (list) (Optional)
For ECS service, you can specify a capacity provider strategy in the service definition file. But what if, the primary capacity provider strategy, can't fulfill the desired number of tasks? When the fallback capacity provider strategy is configured, Gitmoxi can create new tasks using this strategy if the primary capacity provider strategy can't fulfill the tasks. For example, let us say we use FARGATE_SPOT as the primary capacity provider strategy for an ECS service and specify the fallback capacity provider strategy to be FARGATE on-demand. If the service desired count is 25 and SPOT can only fulfill 10, then Gitmoxi will deploy the remaining 15 using FARGATE on-demand. Also post-deployment, if at anytime you want to switch the number of tasks between primary and secondary capacity provider strategies, you can do so by calling Gitmoxi APIs if this configuration is provided during the service deployment.

The value for `fallbackCapacityProviderStrategy` is a list of [ECS Capacity Provider Strategy Item](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_CapacityProviderStrategyItem.html).

-- **Example configuration**
```json
    "fallbackCapacityProviderStrategy": [
        {
          "capacityProvider": "FARGATE",
          "weight": 1
        }
    ]
```

## Full example
Following is a full example of an ECS deployment definition (`_depdef.json`) file:
```json
{
    "environment": {
        "region" : "us-west-2", 
        "account" : "123456789012", 
    },
    "trafficShiftingConfig": { 
        "percent": 20,
        "waitInterval": 60, 
        "type" : "CANARY"
    },
    "targetGroupArnPairs": [ 
        [
            "blue-tg-arn-string", 
            "green-tg-arn-string"
        ], 
        [
            ...,
            ...
        ],
    ],
    "alarms": { 
        "alarmNames": [
            "HighCPUAlarm",
            "HighMemoryAlarm",
            "HighErrorRateAlarm",
            "HighLatencyAlarm"
        ],
    },
    "deleteNewUponTrafficShiftFailure": true, 
    "stabilityCheck": { 
        "pollInterval": 30, 
        "timeout": 300, 
        "timeoutPerTask" : 60
    },
    "deleteNewUponFailure": true, 
    "gmDeploymentCircuitBreaker": { 
        "failureThreshold": 5,
        "failureThresholdPercent" : 30
    },
    "fallbackCapacityProviderStrategy": [] 
}
```