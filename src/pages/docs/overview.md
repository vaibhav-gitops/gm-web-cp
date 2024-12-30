---
title: "Overview"
navtitle: "Overview"
layout: ../../layouts/MdLayout.astro
---

# Introducing Gitmoxi
GitMoxi is an innovative Continuous Deployment (CD) tool designed specifically for Amazon ECS and AWS Lambda. Unlike generic deployment tools that rely on extensive custom scripting, GitMoxi understands the intricacies of ECS and Lambda services, providing an automated, intuitive, and powerful deployment experience.

GitMoxi leverages the GitOps paradigm to manage and automate deployments for Amazon Elastic Container Service (ECS) with AWS Fargate and AWS Lambda. Deployment-related artifacts, such as service configurations, task definitions, and Lambda function definitions, are maintained in Git repositories. When these files are modified and committed, GitMoxi detects the changes and triggers the necessary updates or creations, whether it's deploying ECS services or updating Lambda functions. The tool supports deploying multiple services and functions simultaneously across clusters and regions, all orchestrated through changes committed to the configured repositories and branches.

<img alt="overview" src="../overview.png" title="Gitmoxi Overview"/>

## Key Features and Benefits

**1. GitOps-Driven Collaboration**  
GitMoxi adopts the GitOps model, enabling teams to manage deployment assets—such as service definitions, task definitions, and Lambda function configurations—directly in Git repositories. This fosters seamless collaboration among platform, DevOps, infrastructure, and application teams using Git features like branching, reviews, and approvals. It also simplifies root-cause analysis and diagnostics, ensuring swift answers to the critical “what changed?” question in case of failures.

**2. Decoupling Service Definitions from Infrastructure-as-Code**  
Unlike traditional approaches that couple service and task definitions with Terraform, CDK, or CloudFormation, GitMoxi decouples these frequently changing assets. You can provide outputs like subnets, IAM roles, security groups, and load balancers as inputs, while GitMoxi integrates them into deployment configurations dynamically. This flexibility eliminates unnecessary stack updates, reduces unexpected errors, and empowers teams to make frequent, worry-free updates.

**3. Advanced Deployment Strategies**  
GitMoxi supports multiple deployment paradigms to suit diverse application needs:
  - **Blue-Green Deployments**: Offers three traffic-shifting patterns—All-at-Once, Linear, and Canary—enabling precise and controlled rollouts.
  - **Rolling Updates**: Leverages ECS's built-in deployment capabilities for incremental updates while preserving stability.  
  This ensures your applications stay highly available and performant, even during complex deployments.

**4. Customizable Circuit Breaking and Rollback Mechanisms**  
With GitMoxi, deployment circuit-breaking rules are highly customizable. Tailor timeouts and failure thresholds to match the specific needs of your applications, whether they involve high-replica tasks, lengthy start times, or low failure tolerances. In case of errors, GitMoxi automatically rolls back deployments to maintain system integrity.

**5. Comprehensive Error Reporting and Troubleshooting**  
Deployments can fail for numerous reasons, from incorrect service definitions to failing health checks or CloudWatch alarms. GitMoxi consolidates error data from every step of the deployment process, presenting it in an intuitive, user-friendly interface. This drastically reduces troubleshooting time and effort, ensuring faster issue resolution.

**6. Flexible Deployment Triggers: Push, Pull, or Both**  
GitMoxi adapts to your workflow by supporting multiple deployment triggers:
  - **Push**: Deploy changes instantly via GitHub Webhooks or API calls.
  - **Pull**: Configure the GitMoxi poller to periodically fetch and apply the latest commits.
  - **Hybrid**: Combine push and pull methods to ensure no changes are missed, with the poller acting as a safety net.

**7. Lambda and ECS Specialization**  
GitMoxi stands apart by deeply understanding the nuances of both ECS with Fargate and AWS Lambda. It automates deployments with minimal scripting, reducing operational burden while delivering tailored solutions for each platform.

**8. Troubleshooting with GitMoxi Agent**  
GitMoxi provides detailed logs and error insights at every step of the deployment process. The **GitMoxi Agent**, powered by Generative AI, takes troubleshooting to the next level. It analyzes error logs, resource configurations, and deployment history to offer actionable insights, automated suggestions, and solutions for common issues. Teams save time and effort by relying on the GitMoxi Agent for enhanced troubleshooting and operational clarity.

**9. Cost Optimization and Resilience**  
With GitMoxi’s support for Fargate-to-Fargate Spot failovers, teams can achieve significant cost savings without sacrificing availability. This unique capability sets GitMoxi apart from generic deployment tools.

## How does it work?

Assume that you have created deployment configurations (such as ECS service and task definition JSON files, or AWS Lambda configuration files). You place these files in a Git repository. In GitMoxi, you configure the repository, branch, and Git access token. Now, whenever the configuration files are changed and committed to the configured branch, GitMoxi can either receive a GitHub webhook or poll for the commit changes. GitMoxi deployment controllers will then appropriately create or update the service—whether it's an ECS service or a Lambda function.

Additional files can be provided, such as:
- **Deployment Configuration**: To set up aspects such as traffic shifting and circuit breaking.
- **Input File**: To provide inputs like subnets, load balancers, or other resources from infrastructure-as-code tools.

Your continuous integration (CI) process can update attributes in the service, task definition files, or Lambda configurations, commit them to the Git repository, and trigger the GitMoxi deployments. See [Getting Started Guide](./getting_started) for more details.