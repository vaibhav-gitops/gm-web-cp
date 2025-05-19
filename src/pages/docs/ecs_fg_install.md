---
title: "Install Gitmoxi on ECS Fargate"
navtitle: "Install Gitmoxi on ECS Fargate"
layout: ../../layouts/MdLayout.astro
---
# Install Gitmoxi on ECS Fargate
## Prerequisites
Make sure you have done all the steps in the [Getting Started](/docs/getting_started) section and set the following environment variables which are required for installing Gitmoxi on ECS Fargate.
```
AWS_REGION
AWS_ACCOUNT
AWS_PROFILE
GITHUB_TOKEN
```
## Required AWS IAM Role

The Gitmoxi Terraform will use your AWS credentials to create the following resources. Ensure that your signed-in user has permissions to create:

| Resource Type | Details |
|---------------|---------|
| **Network Infrastructure** | • VPC with subnets (1 private, 1 public per AZ)<br>• NAT Gateways<br>• Internet Gateways |
| **Load Balancing** | • Application Load Balancer (ALB)<br>• One listener<br>• Two target groups for blue/green deployment<br>• Security group for load balancer |
| **Container Services** | • ECS cluster<br>• Gitmoxi ECS service and task definition<br>• Security group for Gitmoxi ECS task |
| **IAM** | • IAM roles for Gitmoxi ECS task<br> |
| **Logging** | • CloudWatch log group for Gitmoxi containers<br> |

Start by setting few input variables needed by the Terraform module.

```bash
export TF_VAR_github_token=$GITHUB_TOKEN
export TF_VAR_aws_region=$AWS_REGION
export TF_VAR_aws_account_id=$AWS_ACCOUNT
```

### Install Gitmoxi
Go to the `gitmoxi-trial` directory, which is obtained by unzipping the trial download file you recieved in email. Under the `ecs-fargate` directory you will find the `gitmoxi.tf` which has all the infrastructure needed for installing Gitmoxi on ECS/Fargate. 

```bash
cd gitmoxi-trial
export GITMOXI_DEPLOY_DIR=$PWD
cd ecs-fargate
terraform init
terraform apply --auto-approve
export GITMOXI_ENDPOINT_URL="http://$(terraform output -raw alb_endpoint)"
export GITMOXI_TASK_IAM_ROLE="$(terraform output -raw task_iam_role)"
echo $GITMOXI_ENDPOINT_URL
```
The Terraform output will give the ALB DNS where you can access the Gitmoxi frontend. Once `gitmoxi-svc` is running in the `gitmoxi` cluster in the region you specified, then you can should see below page at the ALB URL. The ECS task IAM role will be needed in the EKS test section; hence we have setup the environment variable `GITMOXI_TASK_IAM_ROLE`.

## Gitmoxi Up and Running
Wait for the `gitmoxi` service to be ready. You should see the below UI at `$GITMOXI_ENDPOINT_URL` before proceeding with the next steps.
![Gitmoxi UI](/gitmoxi_ui_page.png)

Next, we will [add a GitHub repository](/docs/repo_setup) to Gitmoxi to test the GitOps workflow.