---
title: "CI/CD Integration"
navtitle: "CI/CD Integration"
layout: ../../layouts/MdLayout.astro
---

# Integration with CI/CD Pipelines

GitMoxi is not just another deployment tool — it’s a product designed to optimize and enhance deployment workflows through intelligent service-specific deployments, improve deployment consistency, and ensure rapid iteration. While traditional CI/CD pipelines focus on the end-to-end software delivery lifecycle, GitMoxi specializes in deployment automation, complementing your pipeline by making the deployment stage smarter and more efficient.

### Key Differences and Benefits

- **Intelligent Service-Specific Deployments:** GitMoxi intelligently handles deployments for the specific AWS service, ensuring precise updates tailored to your application needs.

- **Detailed Logs for Troubleshooting:** GitMoxi provides comprehensive, step-by-step logs to simplify debugging and give you unparalleled visibility into deployment processes.

- **Centralized Configuration Management:** By utilizing a single source of truth for configuration, GitMoxi ensures consistency across environments without additional manual effort.

- **IaC Integration:** GitMoxi easily incorporates outputs from your Infrastructure-as-Code (IaC) tools, streamlining deployments by automatically injecting these configurations into the pipeline.

- **Flexible and Scalable:** Adapts to diverse deployment strategies and scales effortlessly across environments and services.

### 1. Integration with GitHub Actions

GitMoxi can be integrated into GitHub Actions to enable automatic deployments triggered by events such as code pushes or pull requests.

**Example Workflow:**
  ```yaml
  name: Deploy with GitMoxi

  on:
   push:
     branches:
       - main

  obs:
   deploy:
     runs-on: ubuntu-latest

     steps:
     - name: Checkout code
       uses: actions/checkout@v3

     - name: Install GitMoxi CLI
       run: |
         pip install gitmoxi

     - name: Deploy with GitMoxi
       run: |
         gitmoxi deploy --commit ${{ github.sha }}
  ```

### 2. Integration with Jenkins

Integrating GitMoxi with Jenkins involves configuring pipeline scripts to execute GitMoxi commands.

**Example Jenkinsfile:**
  ```groovy
  pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Install GitMoxi') {
            steps {
                sh 'pip install gitmoxi'
            }
        }
        stage('Deploy') {
            steps {
                sh 'gitmoxi deploy --commit ${GIT_COMMIT}'
            }
        }
    }
  }
  ```

### 3. Integration with AWS CodePipeline

GitMoxi can work with AWS CodePipeline by including it in the build or deploy phases of your pipeline.

**Steps:**

**a.** Create a Buildspec file for CodeBuild:

  ```yaml
  version: 0.2
  phases:
  install:
    commands:
    - pip install gitmoxi
  build:
    commands:
    - gitmoxi deploy --commit $CODEBUILD_RESOLVED_SOURCE_VERSION
  ```

**b.** Add the CodeBuild project as a stage in CodePipeline.

### 4. Integration with GitLab CI/CD

In GitLab, GitMoxi can be integrated through .gitlab-ci.yml.

**Example .gitlab-ci.yml:**
  ```yaml
  stages:
    - deploy

  deploy:
    stage: deploy
    script:
      - pip install gitmoxi
      - gitmoxi deploy --commit $CI_COMMIT_SHA
  ```

### Best Practices for CI/CD Integration
1. **Environment Variables:** Use CI/CD tools to inject environment-specific variables for deployments, such as AWS credentials, regions, or cluster configurations.
2. **Approval Gates:** Add manual or automated approval steps for sensitive deployments using features like GitHub Action review gates or Jenkins input steps.
3. **Parallel Deployments:** Use pipeline parallelism to deploy to multiple environments or services concurrently for faster rollouts.