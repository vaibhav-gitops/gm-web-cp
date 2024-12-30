---
title: "Core Concepts"
navtitle: "Core Concepts"
layout: ../../layouts/MdLayout.astro
---

# Core Concepts

This section introduces the fundamental concepts behind GitMoxi, including its GitOps-driven workflow, deployment strategies, and the various components that work together to automate deployments for ECS and Lambda environments.

## <u>Deployment Strategies</u>

GitMoxi supports multiple deployment strategies, allowing you to choose the approach that best suits the needs of your application and environment. These strategies provide fine-grained control over how new versions of your application are deployed, minimizing risks and ensuring stability.

### Rolling Deployments

Rolling Deployments are an incremental update process that deploys a new version of an application gradually across a set of instances. This strategy ensures that a portion of your application is always available during the update process, reducing downtime and improving availability.

- **How It Works:**
GitMoxi updates a subset of instances at a time, while the rest of the instances continue serving traffic. Once the new instances are healthy, another batch of instances is updated, until the entire fleet is updated.

- **When to Use:**
Rolling Deployments are ideal when you need to minimize downtime with gradual, incremental updates. They work best for large-scale services or microservices where you can afford to update a subset of instances at a time without risking service disruption.

### Blue/Green Deployments

Blue/Green Deployments enable you to deploy a new version of your application (the "green" version) alongside the existing version (the "blue" version). Traffic is then shifted between the two versions based on predefined rules, such as percentage-based shifting or manual approval.

- **How It Works:**
Two identical environments are maintained, one running the old version (blue) and one running the new version (green). Once the green version is ready and validated, traffic is shifted to it, while the blue version is kept as a fallback.

- **When to Use:**
Blue/Green Deployments are best for ensuring zero downtime and quick instant rollback. They are suited for high-risk updates or critical applications where you need to test the new version in a production-like environment before fully switching over.

### Canary Deployments

Canary Deployments deploy a new version of the application to a small subset of instances (the "canaries") before rolling it out to the entire fleet. This allows teams to test the new version in a live environment with minimal risk.

- **How It Works:**
A small percentage of traffic is directed to the canary version of the application. Based on the results, traffic is gradually shifted to the new version. This phased rollout helps catch issues early before they impact all users.

- **When to Use:**
Canary deployments are suitable for introducing new features or updates with a controlled, gradual rollout. It’s particularly useful when you want to test the new version with a small group of users before scaling it to a broader audience.

## <u>GitOps Model</u>

GitOps is a methodology that leverages Git repositories to manage the state of your deployments. With GitMoxi, the state of your applications is declared within version-controlled files, enabling teams to manage their deployment configurations and easily track changes.

**How It Works:**

- **Git Repositories as the Source of Truth**: Deployment configurations (such as ECS service and task definitions, or Lambda function configurations) are stored in a Git repository. Git acts as the source of truth, enabling teams to maintain and version their infrastructure code alongside application code.

- **Commit History and Pull Requests**: Git commits, pull requests (PRs), and reviews ensure that changes are thoroughly vetted before being applied to your deployment environment. Changes are logged in Git, providing a clear history of what was modified, when, and by whom.

- **Automated Deployment Triggering**: GitMoxi monitors the repository for changes and triggers deployments automatically when new commits are detected. It can use GitHub webhooks or periodic polling to check for changes in the repository.

- **Deployment Automation**: Once changes are detected, GitMoxi takes over, ensuring that the deployment process is automated. This reduces the need for manual intervention and enables a continuous deployment pipeline.

### Deployment Triggers in GitMoxi

- **Webhook Triggering**: GitMoxi can listen for GitHub webhooks that notify the tool of new commits to a specific branch. This enables automatic deployments whenever changes are pushed to the repository.

- **Polling**: Alternatively, GitMoxi can periodically poll the Git repository for changes. This method ensures that deployments are triggered even if webhooks are not available, providing flexibility in the deployment process.

- **Command-based Triggering**: Users can also trigger deployments manually through a **CLI command**. This method gives teams more control over when deployments are initiated, especially useful for CI/CD processes or situations where automated triggers are not desirable.

By adopting the GitOps model, GitMoxi helps simplify the deployment process, enforce version control on infrastructure, and ensure that deployment configurations are always up to date.

## <u>Components Overview</u>

GitMoxi integrates several components that work together to automate and manage deployments across ECS and Lambda environments. Below is an overview of these key components:

### Deployment Configuration Files
Deployment configuration files are essential for defining how your application is deployed.

- **Deployment Definition:**
The Deployment Definition file defines key deployment strategies and settings such as stability checks, deployment circuit breakers, and environment variables. These configurations ensure the smooth and reliable deployment of your application.

- **Inputs:**
The Input file allows the user to provide the output of their Infrastructure as Code (IAC) in a format that GitMoxi can absorb automatically. This file helps generate specific configurations for deployments, such as security groups, IAM roles, and more.

- **ECS Specific Configurations:**
The ECS Service and Task Definition files define how ECS resources (such as containers and tasks) are set up and deployed.

- **Lambda Definition:**
The Lambda Function Definition defines function-specific settings, such as memory allocation, timeout settings, and trigger events.

- **Lambda Event Source Mapping:**
Lambda Event Source Mapping allows you to connect Lambda functions to specific data sources, such as API Gateway, Elastic Load Balancer, or SQS queues. This mapping ensures that your Lambda functions automatically process events from these sources, enabling event-driven architectures for your deployments.

All these configuration files should be stored in a Git repository.

### Monitoring and Rollback Mechanisms

GitMoxi provides comprehensive monitoring and rollback capabilities to ensure successful deployments and quick resolution of any issues.

- **Monitoring:**
  GitMoxi generates detailed logs throughout the deployment process, offering deep insights into deployment health and progress. These logs allow users to track every step, from resource initialization to final validation.

  GitMoxi also integrates with AWS CloudWatch for robust alarm monitoring and service health checks. Key metrics, such as error rates, task health, and resource availability, are continuously monitored. Before marking a deployment as successful, GitMoxi performs thorough service health checks to ensure stability and performance.

- **Rollback:**
  GitMoxi includes robust rollback mechanisms designed to safeguard application stability in case of deployment failures. Configurations allow teams to define stability checks, set timeouts, and establish failure thresholds. These settings ensure that deployment issues are quickly identified and addressed.

  If a deployment encounters failures or exceeds predefined thresholds, GitMoxi automatically reverts to the last stable state. This minimizes downtime and preserves the availability of your application, allowing for uninterrupted operations.

These monitoring and rollback features provide teams with visibility, resilience, and peace of mind throughout the deployment lifecycle.
