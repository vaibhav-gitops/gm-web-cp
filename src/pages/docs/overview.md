---
title: "Overview"
navtitle: "Overview"
layout: ../../layouts/MdLayout.astro
---

# Introducing Gitmoxi: The Future of Unified Deployment
Gitmoxi is the industry's first unified deployment controller designed for **Amazon ECS**, **AWS Fargate**, and **AWS Lambda**, powered by the **GitOps** paradigm. In the GitOps model, deployment artifacts such as service configurations, task definitions, and Lambda function definitions are versioned and managed within Git repositories. When these files are modified and committed, **Gitmoxi** automatically detects changes and triggers appropriate actions, such as creating or updating services and functions in ECS or Lambda. 

Gitmoxi can orchestrate deployments across multiple clusters and regions simultaneously. It integrates deployment artifact file changes with Git repository workflows, offering an intuitive, unified solution that understands the intricacies of each AWS service. Gitmoxi also supports advanced deployment strategies such as **rolling updates**, **blue-green deployments**, and **canary deployments**, with flexible traffic shifting patterns to meet the needs of modern cloud applications.

<img alt="overview" src="/overview.png" title="Gitmoxi Overview"/>

## Key Features and Benefits
### **1. GitOps-Driven Collaboration**
By adopting the **GitOps** model, Gitmoxi enables teams to manage deployment assets, including service definitions, task definitions, and Lambda function configurations, directly in Git repositories. This fosters collaboration among platform, DevOps, infrastructure, and application teams using Git features like branching, pull requests, reviews, and approvals. The GitOps approach also simplifies diagnostics and root-cause analysis by making it easy to trace changes and quickly answer the critical “what changed?” question when things go wrong.

### **2. Decoupling Service Definitions from Infrastructure-as-Code**
Traditional deployment methods often couple ECS services, Lambda functions, and container definitions with infrastructure-as-code tools like Terraform, CDK, or CloudFormation. This coupling can lead to unnecessary full-stack updates and unexpected errors in components that didn’t change. Gitmoxi removes this coupling, allowing you to manage service and function definitions in simple JSON files separate from infrastructure code. By ingesting infrastructure outputs such as subnets, IAM roles, and security groups from IaC tools, Gitmoxi seamlessly substitutes these values in ECS and Lambda deployment artifacts, offering the best of both worlds: infrastructure managed by IaC and application deployments managed by Gitmoxi.

### **3. Advanced Deployment Strategies**
Gitmoxi supports a variety of deployment paradigms:
- **Rolling Updates**: Incremental updates via ECS’s built-in deployment capabilities, preserving service stability.
- **Blue-Green Deployments**: Gitmoxi enables multiple traffic-shifting patterns for ECS—All-at-Once, Linear, and Canary—and advanced blue/green setups for services with complex dependencies. For Lambda, Gitmoxi offers blue/green rollouts with the same traffic-shifting patterns. 

These deployment strategies ensure your applications maintain high availability and performance, even during complex updates.

### **4. Customizable Circuit Breaking and Rollback Mechanisms**
Gitmoxi offers flexible deployment circuit-breaking rules, allowing you to tailor timeouts and failure thresholds based on the needs of your applications. In case of failure, Gitmoxi automatically triggers rollbacks to maintain system integrity.

### **5. Comprehensive Error Reporting and Troubleshooting**
Deployments can fail for a variety of reasons, from incorrect definitions to health check failures. Gitmoxi consolidates error information throughout the deployment process, providing a user-friendly interface that simplifies troubleshooting and accelerates issue resolution.

### **6. Flexible Deployment Triggers: Push, Pull, or Both**
Gitmoxi adapts to your workflow by supporting multiple deployment triggers:
- **Push**: Instantly deploy changes via GitHub webhooks, Gitmoxi CLI, or API calls.
- **Pull**: Configure Gitmoxi’s poller to periodically fetch and apply the latest changes.
- **Hybrid**: Combine push and pull methods to ensure no changes are missed, with the poller acting as a safety net.

### **7. Troubleshooting with Gitmoxi Agent**
Gitmoxi integrates a **Generative AI-powered agent** that enhances the troubleshooting process. By analyzing logs, resource configurations, and deployment history, the Gitmoxi Agent provides actionable insights, automated suggestions, and resolutions for common issues, saving your team time and reducing operational overhead.

### **8. Cost Optimization and Resilience**
Gitmoxi allows seamless fallback between **Fargate Spot** and **Fargate on-demand** instances. If Spot capacity drops, Gitmoxi ensures your applications switch to on-demand instances, optimizing cost while maintaining availability.

### **9. Integrated with Your Favorite Tools**
Gitmoxi integrates with several tools commonly used in CI/CD workflows, ensuring it fits seamlessly into your environment:
- **Terraform and AWS CDK** for ingesting infrastructure attributes like subnets and security groups.
- **AWS Secrets Manager and SSM Parameter Store** for handling sensitive information like GitHub tokens.
- **Slack** for deployment notifications.
- **GitHub** to enable the GitOps workflow.
- **OpenAI (ChatGPT)** and **Groq** for leveraging Generative AI agents.
Additional integrations are coming soon to further enhance your workflow.

---

## How Does Gitmoxi Work?

At a high level, Gitmoxi works by monitoring changes to deployment artifacts such as ECS service/task definitions or AWS Lambda function configuration files stored in a Git repository. You configure the repository, branch, and Git access token in Gitmoxi. When changes are committed to the repository, Gitmoxi automatically triggers the appropriate deployment action for ECS or Lambda.

Additional configuration files can be provided:
- **Deployment Configuration**: Define traffic-shifting strategies, circuit-breaking rules, etc.
- **Input Files**: Provide infrastructure outputs (e.g., subnets, load balancers) from IaC tools like Terraform.

To get started, check out our **[Getting Started Guide](./getting_started)** and begin using Gitmoxi today!
