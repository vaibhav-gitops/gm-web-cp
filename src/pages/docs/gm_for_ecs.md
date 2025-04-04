---
title: "Gitmoxi for ECS"
navtitle: "Gitmoxi for ECS"
layout: ../../layouts/MdLayout.astro
---

# Gitmoxi for Amazon ECS

## Introduction

Managing container deployments at scale can be complex and error-prone. Gitmoxi solves this challenge by providing full GitOps-based lifecycle management for Amazon ECS services. With Gitmoxi, you can declaratively define your ECS infrastructure as code and store it in Git, ensuring that your deployment process is repeatable, auditable, and version-controlled.

When ECS deployment files are created, modified, or deleted in a Git repository, Gitmoxi automatically orchestrates the corresponding changes in your ECS clusters. Based on your application's needs, Gitmoxi supports both rolling updates and blue/green deployments with a variety of traffic shifting strategies.

## Key Files and Workflow

In the ECS GitOps workflow, Gitmoxi uses four key files to manage deployments:

| File | Name | Purpose |
|------|------|---------|
| **Service definition** | `_svcdef.json` | Defines ECS service parameters |
| **Task definition** | `_taskdef.json` | Specifies container configurations |
| **Deployment configuration** | `_depdef.json` | Controls deployment strategies and traffic shifting |
| **Input file** | `_input.json` | Provides parameterization values |

Let's explore each of these files, as their contents—and any changes to them—drive Gitmoxi's ECS deployment logic.

## Service Definition File

The ECS service definition file (`_svcdef.json`) includes all attributes supported by the [Amazon ECS CreateService API](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_CreateService.html#API_CreateService_RequestSyntax). This file is written using native ECS definitions, meaning you can immediately take advantage of new ECS features as they are released—no waiting for tool-specific updates.

A particularly important attribute in this file is `deploymentController`:
- If set to `"ECS"`, Gitmoxi leverages ECS's native rolling deployment mechanism.
- If set to `"EXTERNAL"`, Gitmoxi performs its own deployment using a blue/green strategy, including advanced traffic shifting.

To enable blue/green deployments with Gitmoxi, simply set `deploymentController` to `EXTERNAL` in the `_svcdef.json` file.

### Example Service Definition
<details>
<summary>Click to expand service definition example</summary>

```json
{
  "cluster": "production-cluster",
  "serviceName": "web-frontend",
  "taskDefinition": "web-frontend:latest",
  "desiredCount": 10,
  "deploymentController": {
    "type": "EXTERNAL"
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/web-frontend/1234567890123456",
      "containerName": "web-app",
      "containerPort": 8080
    }
  ],
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": [
        "subnet-12345678",
        "subnet-87654321"
      ],
      "securityGroups": [
        "sg-12345678"
      ],
      "assignPublicIp": "DISABLED"
    }
  }
}
```
</details>

## Task Definition File

The ECS task definition JSON file (`_taskdef.json`) can contain all the attributes defined by the [ECS Task Definition Registration Request](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_RegisterTaskDefinition.html#API_RegisterTaskDefinition_RequestSyntax). 

Whenever an ECS service needs to be created or updated, Gitmoxi will:
1. Register a new task definition using the task definition file
2. Obtain the ARN for the new revision
3. Use that ARN in the service creation or update process

If the task definition file is not present, Gitmoxi uses the task definition attribute (`"taskDefinition"`) from the service definition file. If neither the task definition file nor the attribute are provided, the service creation will fail.

### Example Task Definition
<details>
<summary>Click to expand task definition example</summary>

```json
{
  "family": "web-frontend",
  "networkMode": "awsvpc",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "web-app",
      "image": "123456789012.dkr.ecr.us-west-2.amazonaws.com/web-frontend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "hostPort": 8080,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/web-frontend",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ],
  "requiresCompatibilities": [
    "FARGATE"
  ],
  "cpu": "256",
  "memory": "512"
}
```
</details>

## Deployment Definition File

The ECS deployment definition JSON file (`_depdef.json`) contains various settings used by Gitmoxi during ECS service deployment, including:

- Traffic shifting strategies
- Circuit breaking parameters
- Stability checks
- Alarm integrations

These settings control how Gitmoxi transitions between old and new task revisions, monitors deployment health, and responds to failures.

### Example Deployment Definition
<details>
<summary>Click to expand ECS deployment definition example</summary>

```json
{
  "trafficShift": {
    "type": "LINEAR",
    "interval": 60,
    "percentage": 20
  },
  "stabilityCheck": {
    "timeout": 600,
    "timeoutPerTask": 120,
    "interval": 15
  },
  "circuitBreaker": {
    "failureThreshold": 5,
    "failureThresholdPercentage": 30
  }
}
```
</details>

For complete details on deployment configuration options, see the [ECS Deployment Definition Guide](./ecs_deployment_definition).

## Input File

The ECS deployment input JSON file (`_input.json`) provides substitution values when you want to parameterize the attributes in service, task, or deployment definition files. This enables you to reuse configuration templates across different environments or services.

### Example Input File
<details>
<summary>Click to expand input file example</summary>

```json
{
  "cluster": "production-cluster",
  "desiredCount": 10,
  "servicePrefix": "web-",
  "serviceName": "frontend",
  "image": "123456789012.dkr.ecr.us-west-2.amazonaws.com/web-frontend:latest",
  "environment": "production",
  "cpu": "256",
  "memory": "512"
}
```
</details>

### Example Usage in Task Definition
<details>
<summary>Click to expand input substitution example</summary>

```json
{
  "family": "${servicePrefix}${serviceName}",
  "containerDefinitions": [
    {
      "name": "${serviceName}",
      "image": "${image}",
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "${environment}"
        }
      ],
      "cpu": ${cpu},
      "memory": ${memory}
    }
  ]
}
```
</details>

For more details on parameter substitution, see the [Input Files Guide](./input_files).

## Gitmoxi GitOps for ECS

Here's how changes to deployment files influence your ECS services:

1. **When changes are detected**: Whenever the service definition, task definition, and/or input file are changed, Gitmoxi triggers a new deployment to create or update the associated ECS service.

2. **Service creation**: If no active service exists in the specified cluster and region, Gitmoxi creates a new service based on the service definition.

3. **Service update**: If the service already exists, Gitmoxi updates it with the new configuration.

4. **Task definition registration**: Gitmoxi always registers the task definition (regardless of whether it has changed) and uses the latest revision for service creation or update.

> **Note**: Changes to only the deployment definition file (`_depdef.json`) will not trigger a new deployment because this file contains deployment settings rather than service attributes.

## Deployment Strategies

Gitmoxi supports two main deployment strategies for ECS services:

### Rolling Update Deployment

In an ECS service rolling update, new task versions are *gradually* created while the old versions are deleted. The deployment process is controlled by two key parameters in the ECS service definition:

- `minimumHealthyPercent`: Minimum percentage of tasks that must remain running
- `maximumPercent`: Maximum percentage of tasks (old + new) allowed during deployment

#### Example Scenario

For a service with 10 running tasks:

| Configuration | Behavior |
|---------------|----------|
| minimumHealthyPercent: 100<br>maximumPercent: 150 | - 5 new tasks are created first<br>- Once new tasks are healthy, 5 old tasks are removed<br>- Remaining 5 new tasks are created |
| minimumHealthyPercent: 50<br>maximumPercent: 100 | - 5 old tasks can be removed immediately<br>- 5 new tasks are created<br>- Remaining 5 old tasks are removed<br>- Remaining 5 new tasks are created |

#### Advantages of Rolling Updates
- Simple to orchestrate
- Cost-effective for high task counts
- Controlled resource usage during deployment

#### Limitations of Rolling Updates
- Not suitable when old and new versions can't serve mixed traffic
- Limited control over traffic shifting
- Rollbacks require repeating the gradual process

### Blue/Green Deployment

For an ECS blue/green deployment, Gitmoxi:

1. Creates a complete new set of tasks based on the latest changes
2. Waits for all new tasks to achieve running status
3. Performs traffic shifting from old to new tasks (if service uses a load balancer)
4. Deletes old tasks after successful traffic shift
5. Rolls back to old tasks if failures occur during deployment

#### Advantages of Blue/Green Deployments
- Easy rollbacks to stable versions
- Granular control over traffic shifting
- Minimized downtime risks

#### Limitations of Blue/Green Deployments
- Requires an Application Load Balancer
- Higher cost (2x tasks running during deployment)
- More complex configuration


### Choosing the Right Strategy

| Requirement | Recommended Strategy |
|-------------|----------------------|
| API versioning (e.g., /api/v1 vs /api/v2) | Blue/Green |
| Live user sessions that shouldn't be interrupted | Blue/Green |
| High task count with cost constraints | Rolling Update |
| Need for rapid rollback capability | Blue/Green |
| Simple service with stateless behavior | Either |

## Traffic Shifting Patterns for Blue/Green Deployments

For blue/green deployments, Gitmoxi supports several traffic shifting patterns:

### CANARY
Shifts traffic in two phases:
1. First shift a small percentage (e.g., 20%)
2. Monitor for a configured time interval
3. If no alarms trigger, shift the remaining traffic (e.g., 80%)

### LINEAR
Shifts traffic in equal increments over multiple intervals:
1. Start with initial percentage (e.g., 20%)
2. Increase by that percentage at each step (20%, 40%, 60%, 80%, 100%)
3. Monitor between each increment
4. Revert to old tasks if alarms trigger at any point

### ALL_AT_ONCE
Shifts 100% of traffic to new tasks immediately:
1. Direct all traffic to new tasks
2. Monitor for configured wait time
3. Revert to old tasks if alarms trigger during wait time

## Deployment Stability Checks

Gitmoxi performs health checks during deployment to ensure tasks reach a stable running state:

### Configuration Options

- `timeout`: Maximum absolute time (in seconds) to wait for task stability
- `timeoutPerTask`: Time allotted per task (multiplied by desired count)
- `interval`: How frequently Gitmoxi polls for task status

### Example Calculations

| Desired Count | Configuration | Effective Timeout |
|---------------|---------------|-------------------|
| 10 tasks | timeout: 600 | 600 seconds |
| 10 tasks | timeoutPerTask: 120 | 1200 seconds (120 × 10) |
| 10 tasks | timeout: 600<br>timeoutPerTask: 120 | 1200 seconds (max value used) |

## Deployment Circuit Breaker

The circuit breaker prevents wasteful deployment attempts when tasks repeatedly fail to start:

### Configuration Options

- `failureThreshold`: Absolute number of task failures before aborting
- `failureThresholdPercentage`: Percentage of desired count that can fail

### Example Calculations

| Desired Count | Configuration | Failure Threshold |
|---------------|---------------|-------------------|
| 10 tasks | failureThreshold: 5 | 5 failures |
| 10 tasks | failureThresholdPercentage: 30 | 3 failures (30% × 10) |
| 10 tasks | failureThreshold: 5<br>failureThresholdPercentage: 30 | 3 failures (min value used) |

## Troubleshooting Common Issues

### Service Creation Failures

| Problem | Possible Causes | Solution |
|---------|----------------|----------|
| Missing task definition | Neither `_taskdef.json` nor `taskDefinition` attribute exists | Create a task definition file or add the attribute to `_svcdef.json` |
| Permission errors | Insufficient IAM permissions | Verify the execution role has appropriate permissions |
| Resource constraints | Insufficient CPU/memory or no container instances available | Check resource availability or increase limits |

### Deployment Failures

| Problem | Possible Causes | Solution |
|---------|----------------|----------|
| Tasks failing to start | Container errors, unhealthy checks | Check container logs and health check configuration |
| Traffic shifting alarms | Application errors in new version | Fix issues or modify alarm sensitivity |
| Timeout during deployment | Tasks taking too long to become stable | Increase stability timeout settings |

### Configuration Issues

| Problem | Possible Causes | Solution |
|---------|----------------|----------|
| Parameter substitution errors | Missing or invalid input values | Verify all referenced parameters exist in `_input.json` |
| File format issues | Invalid JSON syntax | Validate JSON formatting |
| Deployment not triggered | Changes only to `_depdef.json` | Make a minor change to service or task definition |

## Best Practices

### General Recommendations

- Use source control branches to test deployment changes before merging to production
- Create separate deployment files for different environments (dev, staging, prod)
- Define appropriate health checks in task definitions to ensure accurate stability reporting

### Rolling Update Best Practices

- Set `minimumHealthyPercent` to at least 50% for production services
- Consider using `maximumPercent` of 150-200% for faster deployments when resources permit
- Test deployment configuration with non-critical services first

### Blue/Green Deployment Best Practices

- Start with CANARY or LINEAR traffic shifting patterns to minimize risk
- Configure appropriate CloudWatch alarms to detect issues during traffic shifting
- Use small initial traffic percentages (10-20%) when deploying critical changes

## Glossary

| Term | Definition |
|------|------------|
| **GitOps** | Infrastructure management approach using Git as the single source of truth |
| **Rolling Update** | Deployment strategy that gradually replaces tasks |
| **Blue/Green Deployment** | Strategy that creates a complete parallel environment before shifting traffic |
| **Canary Deployment** | Pattern that tests new version with a small percentage of traffic |
| **Circuit Breaker** | Mechanism to stop deployments when failures exceed threshold |
| **Task Definition** | ECS configuration specifying how containers should run |
| **Service Definition** | ECS configuration defining how tasks should be deployed and maintained |

## Additional Resources

- <a href="https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html" target="_blank">Amazon ECS Documentation</a>
- <a href="./ecs_deployment_definition" target="_blank">Gitmoxi ECS Deployment Definition Guide</a>
<br>
- <a href="./input_files" target="_blank">Input Files Guide</a>
