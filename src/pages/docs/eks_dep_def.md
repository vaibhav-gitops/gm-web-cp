---
title: "EKS Deployment Definition"
navtitle: "EKS Deployment Definition"
layout: ../../layouts/MdLayout.astro
---
# EKS Deployment Definition

This guide explains how to configure EKS deployment definition in Gitmoxi using YAML configuration.

## Configuration Options

The deployment configuration allows you to customize how Gitmoxi performs deployments. Below are the available configuration options with their default values and explanations.

### Basic Structure

```yaml
apiVersion: gitmoxi.io/v1
kind: Deployment
metadata:
  name: my-application
spec:
  # Configuration options go here
```

### Traffic Shifting Configuration

Control how traffic is gradually shifted to your new deployment version.

```yaml
spec:
  trafficShiftingEnabled: false
  trafficShiftingConfig:
    type: "CANARY"
    percent: 20
    waitInterval: 60
```

| Parameter | Description | Default Value |
|-----------|-------------|---------------|
| `trafficShiftingEnabled` | Enable gradual traffic shifting to the new version | `false` |
| `trafficShiftingConfig.type` | Traffic shifting strategy (CANARY or LINEAR) | `"CANARY"` |
| `trafficShiftingConfig.percent` | Initial percentage of traffic to route to new version | `20` |
| `trafficShiftingConfig.waitInterval` | Time in seconds to wait between traffic shifts | `60` |

### Version Management

Configure how Gitmoxi handles previous deployment versions.

```yaml
spec:
  deleteOldVersion: false
  rollback: true
```

| Parameter | Description | Default Value |
|-----------|-------------|---------------|
| `deleteOldVersion` | Whether to delete the previous version after successful deployment | `false` |
| `rollback` | Enable automatic rollback if deployment fails | `true` |

### Alarm Integration

Configure CloudWatch alarms to monitor during deployment.

```yaml
spec:
  alarms:
    alarmNames: []
```

| Parameter | Description | Default Value |
|-----------|-------------|---------------|
| `alarms.alarmNames` | List of CloudWatch alarm names to monitor during deployment | `[]` |

### Readiness Check

Configure how Gitmoxi validates that your deployment is ready.

```yaml
spec:
  readinessCheck:
    waitInterval: 15
    maxRetries: 5
```

| Parameter | Description | Default Value |
|-----------|-------------|---------------|
| `readinessCheck.waitInterval` | Time in seconds between readiness checks | `15` |
| `readinessCheck.maxRetries` | Maximum number of readiness check attempts | `5` |

### Ingress Controller

Configure which ingress controller to use.

```yaml
spec:
  controllerType: "alb"
```

| Parameter | Description | Default Value |
|-----------|-------------|---------------|
| `controllerType` | Type of ingress controller to use (alb, nginx, etc.) | `"alb"` |

### Environment

Configure deployment environment-specific settings.

```yaml
spec:
  environment:
    clusterArn: "arn:aws:ecs:region:account:cluster/name"
```

| Parameter | Description | Default Value |
|-----------|-------------|---------------|
| `environment.clusterArn` | ARN of the ECS cluster for deployment | `null` |
</details>

<details>
  <summary style="font-size: 1.5em; font-weight: bold;">ECS/Fargate Deployment</summary>

## ECS/Fargate Deployment

When deploying to Amazon ECS with Fargate, the following configuration options are applicable.

### Example Configuration

```yaml
apiVersion: gitmoxi.io/v1
kind: DeploymentDefinition
metadata:
  name: my-eks-app
spec:
  trafficShiftingEnabled: true
  trafficShiftingConfig:
    type: "CANARY"
    percent: 20
    waitInterval: 60
  deleteOldVersion: true
  rollback: true
  alarms:
    alarmNames:
      - "my-app-high-cpu-alarm"
      - "my-app-error-rate-alarm"
  readinessCheck:
    waitInterval: 15
    maxRetries: 5
  controllerType: "alb"
  environment:
    clusterArn: "arn:aws:ecs:us-west-2:123456789012:cluster/my-cluster"
```