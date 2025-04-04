---
title: "Core Concepts"
navtitle: "Core Concepts"
layout: ../../layouts/MdLayout.astro
---

# How Gitmoxi works
GitMoxi leverages the GitOps paradigm to manage and automate deployments. In this model, deployment artifacts—such as ECS service definitions, ECS task definitions, and Lambda function configurations—are stored in Git repositories. When these files are changed and committed to a branch, GitMoxi orchestrates the creation, update, or deletion of associated service objects based on the changes.

GitMoxi supports parallel execution and can process multiple file changes in a single commit, deploying updates across services efficiently. It handles both the creation and updating of service objects using a range of deployment strategies, including rolling updates and blue/green deployments with flexible traffic shifting patterns. When a file is deleted from the repository, GitMoxi also deletes the corresponding service object, completing the full lifecycle management.

For every commit and deployment, GitMoxi logs detailed processing metadata in AWS DynamoDB tables. It captures comprehensive deployment status, enabling you to troubleshoot with ease—whether the issue is a simple misconfiguration, missing IAM permissions, exhausted IPs, or alarm-triggered failures during traffic shifting.

GitMoxi also includes a flexible deployment circuit breaker that can automatically trigger rollbacks based on failure thresholds or prolonged stabilization times.

Below sections provide more details on the repositories and commits, followed by next chapters covering feature details for deployments.

## Git repositories
The GitOps paradigm begins with storing deployment artifacts in Git repositories. Git provides powerful features for version control, collaboration, code review, and approvals, as well as a complete audit trail to answer the recurring question: *what changed?*. 

With GitMoxi, you can configure multiple repositories and, for each repository, associate multiple branches. Below is an example of how to add a repository for use with GitMoxi:

```bash
gmctl repo add -r "<deployment-artifacts-git-repo>" -b main -b dev -a "<aws-secret-mgr-arn-for-Github-token>"
```
An access token is required for GitMoxi to evaluate commit changes and read deployment artifacts. GitMoxi currently supports AWS Secrets Manager and AWS Systems Manager Parameter Store to securely store this token. When adding a repository, simply provide the ARN of the secret where the token is stored. GitMoxi fetches the token directly and never stores or logs it. If the token is rotated or changed, GitMoxi will automatically retrieve the latest version.

## Git commits
You can trigger a GitMoxi deployment **after** pushing changes to a configured repository and branch. For example, to deploy an Amazon ECS service, you might create `nginx/nginx_svcdef.json` and `nginx/nginx_taskdef.json`, fill in the necessary configuration details, and commit them to a branch. Once committed, you can initiate deployment with:

```bash
gmctl commit deploy -r "<deployment-artifacts-git-repo>" -b main
```
This command works with the latest commit and all associated file changes. It can also be invoked from your CI/CD pipeline.

### Gitmoxi file naming requirements
*How does GitMoxi know which files belong to which service object?*  
GitMoxi relies on a specific file naming convention to identify and group deployment artifacts related to a particular service object.

**For Amazon ECS services**, the following suffixes are required:
- `_svcdef.json`: ECS service definition
- `_taskdef.json`: ECS task definition
- `_depdef.json`: GitMoxi deployment configuration for ECS
- `_input.json`: Substitution values

**For AWS Lambda functions**, use these suffixes:
- `_lambdadef.json`: Lambda function definition
- `_lambdaeventsourcedef.json`: Lambda event source mapping
- `_lambdadepdef.json`: GitMoxi deployment configuration for Lambda
- `_lambdainput.json`: Substitution values

GitMoxi groups all files with the same **path-prefix** as belonging to one service object. For instance, the following files:

```
dev/nginx/nginx_svcdef.json  
dev/nginx/nginx_taskdef.json  
dev/nginx/nginx_input.json  
dev/nginx/nginx_depdef.json
```

...share a path-prefix of `dev/nginx/nginx` and are thus treated as a single service object. The path-prefix is defined as the directory path plus the file name, minus the GitMoxi-specific suffix.

To ensure GitMoxi can properly associate files:
- **Use the required suffixes**
- **Ensure all files for a single service share the same path-prefix**

A good practice is to store related files in the same directory, start filenames with the service name, and append the appropriate suffix.

**Note:** ECS files (`_svcdef.json`, `_taskdef.json`) and Lambda files (`_lambdadef.json`, `_lambdaeventsourcedef.json`) should contain only native AWS attributes. GitMoxi does **not** introduce any proprietary fields.

## Summary

To use GitMoxi in your GitOps workflow:

- Configure repositories and branches
- Create deployment artifacts using the required naming conventions
- Commit changes to the configured repository and branch
- Run the GitMoxi deploy command

Next, we’ll dive deeper into how GitMoxi deploys ECS services and Lambda functions based on changes to these deployment artifact files.