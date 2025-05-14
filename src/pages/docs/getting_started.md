---
title: "Getting Started with Gitmoxi"
navtitle: "Getting Started"
layout: ../../layouts/MdLayout.astro
---

# Getting Started with Gitmoxi
Gitmoxi is inspired by GitOps paradigm where you store, version control, and collaborate on deployment artifacts in Git. Gitmoxi uses deployment artifact files such as ECS service, task, and Lambda function definition to create and update associated objects in AWS services. So you will need **GitHub and AWS accounts** to try Gitmoxi continuous deployment features. In this getting started guide you will:

* Install Gitmoxi on ECS with Fargate, 
* Perform GitOps-based creation and updates including blue/green with sample applications
* Clean-up all the test resources

Start by downloading the artifacts to deploy Gitmoxi on ECS Fargate or EKS. Please note that this download is **strictly for trial purposes to learn, test, and evaluate Gitmoxi**. Please do not use this for any production or sensitive environments.

<button id="downloadLink" class="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-800">Download Trial Now</button>

## Prerequisites
* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
* [Git CLI](https://github.com/git-guides/install-git#install-git-on-mac)
* [Hashicorp Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli)
* [kubectl](https://kubernetes.io/releases/download/#kubectl)
* Gitmoxi CLI
```bash
pip install gmctl
gmctl --help
```
* GitHub token for GitOps

Before deploying Gitmoxi for trial, in your GitHub account [create a developer token (classic)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens). You will need to grant `repo` and `read:packages` access.

![GitHub token access](/gh_token_access.png)

Copy the token value and set the following environment variable, followed by the key AWS region and account variables. 

```bash
export GITHUB_TOKEN=<GITHUB_TOKEN>
export AWS_REGION=<region_to_install_Gitmoxi>
export AWS_ACCOUNT=<account_id_to_install_Gitmoxi>
```

If you are using AWS Profile then set the `AWS_PROFILE` environment variable otherwise Terraform will likely give error. You can usually find the AWS Profile in `~/.aws/config` in the first line within the `[]` brackets.
```bash
cat ~/.aws/config

[profile <YOUR_AWS_PROFILE_IS_LIKELY_HERE>]
...
```
```bash
export AWS_PROFILE=<YOUR AWS PROFILE>
```

Next, install Gitmoxi either on [ECS Fargate](./ecs_fg_install) or [EKS](./eks_install) whichever service best fits your needs and skills.

