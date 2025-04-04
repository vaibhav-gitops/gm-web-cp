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

Start by downloading the Terraform manifest to install Gitmoxi in ECS Fargate. Please note that this download is **strictly for trial purposes to learn, test, and evaluate Gitmoxi**. Please do not use this for any production or sensitive environments.

<a href="#" id="downloadLink" class="text-blue-600 hover:underline">Download Trial Now</a>

## Prerequisites
* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
* [Git CLI](https://github.com/git-guides/install-git#install-git-on-mac)
* [Hashicorp Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli)
* Gitmoxi CLI
```bash
pip install gmctl
gmctl --help
```

## Required AWS IAM role
The Gitmoxi Terraform will use your AWS credentials and create the following resources. So make sure the user that you are signed-in has permissions to create these resources: 

* VPC and subnets - 1 private subnet and 1 public subnet per Availability Zone in the region. 
* For the subnets also create require NAT and Internet Gateways
* ALB with one listener and two target groups for blue/green deployment
* Security group for load balancer 
* ECS cluster 
* Gitmoxi ECS service and task definition
* IAM roles needed for Gitmoxi ECS task
* Security group needed for Gitmoxi ECS task 
* CloudWatch log group needed for Gitmoxi containers

## GitHub token for GitOps

Before deploying Gitmoxi for trial, in your GitHub account [create a developer token (classic)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens). You will need to grant `repo` and `read:packages` access.

![GitHub token access](/gh_token_access.png)

Copy the token value and set the following `TF_VAR_`s in a terminal for Terraform to pick these values. 
```bash
export TF_VAR_github_token=<GITHUB_TOKEN>
export TF_VAR_aws_region=<AWS_REGION>
export TF_VAR_aws_account_id=<YOUR_AWS_ACCOUNT>
```

## Install Gitmoxi
We will assume that you have downloaded the `gitmoxi.tf` and stored it in `gitmoxi-trial` directory (you can use any folder).
```
cd gitmoxi-trial
terraform init
terraform apply --auto-approve
export GITMOXI_ENDPOINT_URL="http://$(terraform output -raw alb_endpoint)"
echo $GITMOXI_ENDPOINT_URL
```
The Terraform output will give the ALB DNS where you can access the Gitmoxi frontend. Once `gitmoxi-svc` is running in the `gitmoxi` cluster in the region you specified, then you can should see below page at the ALB URL

![Gitmoxi UI](/gitmoxi_ui_page.png)

## Repository for GitOps
**Fork** the Gitmoxi sample applications repository, [gitmoxi/gm-demo](https://github.com/gitmoxi/gm-demo). This applications has two ECS services to testing rolling and blue/green deployments. And there are 3 Lambda functions to deploy and test with ELB, API-Gateway, and SQS event sources.

Once you have forked the above sample applications repository, clone to your laptop and we will add the repository to Gitmoxi.
```bash
export GITHUB_USER_NAME=<your-github-username>
git clone git@github.com:$GITHUB_USER_NAME/gm-demo.git
export GITMOXI_DEMO_REPO=https://github.com/$GITHUB_USER_NAME/gm-demo
gmctl repo add -r $GITMOXI_DEMO_REPO -b main -a GITHUB_TOKEN
gmctl repo get
```
You should see your `gm-demo` repository added. Next, we will test GitOps workflow with [ECS](./getting_started_ecs)