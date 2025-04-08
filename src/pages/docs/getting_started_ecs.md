---
title: "Getting Started with Gitmoxi for ECS"
navtitle: "Getting Started ECS"
layout: ../../layouts/MdLayout.astro
---
# ECS Deployments with Gitmoxi GitOps

> **⚠️ IMPORTANT:** Before proceeding, complete all steps in the [Getting Started](./getting_started) section to install Gitmoxi, create your private **`gm-trial`** repository, and add that repository to Gitmoxi.

## Overview

This guide will walk you through testing Gitmoxi's GitOps-based deployment for ECS by:

1. Creating the infrastructure needed to deploy ECS sample services
2. Creating ECS services and performing rolling and blue/green updates using Gitmoxi GitOps
3. Cleaning up all test resources when finished

## Infrastructure Resources
We've provided a sample Terraform file to create the required infrastructure for ECS test services. Your IAM role must have permissions to create the following resources in the `us-west-2` region:

| Category | Resources | Purpose |
|----------|-----------|---------|
| **Networking** | • VPC<br>• Public Subnets<br>• Private Subnets<br>• Security Groups | Network infrastructure and access control for Fargate tasks |
| **ECS** | • ECS Cluster<br>• Task Execution Role | Required for creating and running ECS services and tasks |
| **Load Balancing** | • Application Load Balancer<br>• Target Groups (2)<br>• Listener Rules | Forwards traffic to target groups for blue/green testing |
| **Monitoring** | • CloudWatch Log Group | Container log management |

> **Note:** The default region is `us-west-2`. You can modify this in the `main.tf` file if needed.

Start by cloning your `gm-trial` private repository that you created in the [Getting Started](./getting_started) section. Below commands clone it in your `HOME` directory but you can clone anywhere. 

```bash
cd ~
git clone git@github.com:$GITHUB_USER_NAME/gm-trial.git
```
Switch to the `gm-trial` directory.
```bash
cd ~/gm-trial
export WORKING_DIR=$PWD
```
## Create infrastructure for ECS test services
```bash
cd $WORKING_DIR/ecs/core-infra/terraform
terraform init
terraform plan
terraform apply --auto-approve 
terraform output --json > terraform_output.json
```
Let the `terraform apply` and `terraform output` finish because this infrastructure is required to deploy ECS services.

> **Note:** Keep the Terraform output JSON file name the same. This file is used to substitute parameterized attribute values in service and task definition files.

## Create ECS service 
Following the GitOps paradigm, we will create the ECS service deployment files and commit the changes to a repository and then trigger the deployment for that commit. 

Start by copying the deployment artifacts provided in the `ecs/rolling-update/sample` folder. 

```bash
cd $WORKING_DIR/ecs/rolling-update
cp sample/nginx_taskdef.json.sample nginx_taskdef.json
cp sample/nginx_svcdef.json.sample nginx_svcdef.json
cp sample/nginx_depdef.json.sample nginx_depdef.json
cp sample/nginx_input.json.sample nginx_input.json
cd $WORKING_DIR
```
Review the changes, you should see the above copied files and the `terraform_output.json` as new file.

```bash
git status
``` 
```
...
...
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	ecs/core-infra/terraform/terraform_output.json
	ecs/rolling-update/nginx_depdef.json
	ecs/rolling-update/nginx_input.json
	ecs/rolling-update/nginx_svcdef.json
	ecs/rolling-update/nginx_taskdef.json
```

Add files and commit changes.
```bash
git add .
git commit -m "creating nginx svc with rolling update"
git push
```
## Gitmoxi commit dryrun
Before deploying the change, let us do a `dryrun` to check what all files have changed and why they are relevant for Gitmoxi with respect to ECS or Lambda deployments. The `dryrun` command tells the `latest_commit_hash`, the `previous_processed_commit_hash`, the files that have changed, and relevance of those changes for ECS service or Lambda functions.

```bash
gmctl commit dryrun -r $GITMOXI_DEMO_REPO -b main 
```
```
latest_commit_hash                        previous_processed_commit_hash    file                                   change             relevance
----------------------------------------  --------------------------------  -------------------------------------  -----------------  ------------------
95f3ca6ea26aea02ff74938c0ee964fd5520a88d                                    ecs/rolling-update/nginx_input.json    added_or_modified  ecs_relevant_files
95f3ca6ea26aea02ff74938c0ee964fd5520a88d                                    ecs/rolling-update/nginx_svcdef.json   added_or_modified  ecs_relevant_files
95f3ca6ea26aea02ff74938c0ee964fd5520a88d                                    ecs/rolling-update/nginx_taskdef.json  added_or_modified  ecs_relevant_files
```

## Gitmoxi commit deploy
Now trigger the deployment based on above commit. The CLI command `gmctl commit deploy` will deploy the changes associated with the latest commit. 

```bash
gmctl commit deploy -r $GITMOXI_DEMO_REPO -b main 
```
In Gitmoxi UI, you can click on the `ECS -> Live Deployments` section to see live timeline of the deployment and associated events. (If you did all steps in Getting Started section and are in the same terminal then the Gitmoxi UI can be printed using `echo $GITMOXI_ENDPOINT_URL`.)
![ECS Live Deployment](/ecs_live_deployment.png)

You should see a new service `rolling-nginx-svc` created in your ECS cluster in AWS console as well. The `rolling-nginx-svc` has tasks attached to a public subnet and public IP is enabled. You can access the public IP to see the `nginx` welcome page.

**Congrats!** You have successfully created ECS service using Gitmoxi GitOps!

## Perform rolling update
In previous step, Gitmoxi created the service since it didn't exist. Now you will update the container image to `httpd`, commit the changes, and trigger Gitmoxi rolling update.

```bash
cd $WORKING_DIR/ecs/rolling-update
cp sample/nginx_input.json.sample.httpd nginx_input.json
git add .
git commit -m "changing image from nginx to httpd to test rolling update"
git push
```
And deploy the changes. Just the same command as above and it will deploy the latest changes and update the service!

```bash
gmctl commit deploy -r $GITMOXI_DEMO_REPO -b main
```
You can check the UI again in `ECS -> Live Deployments` section. Or, also use the CLI to get the list of deployments.

```bash
gmctl deployment ecs get -r $GITMOXI_DEMO_REPO  -s rolling-nginx-svc
```
The flags, `-v -A`, provide more verbose details.

```bash
gmctl deployment ecs get -r $GITMOXI_DEMO_REPO -s rolling-nginx-svc -v -A
```
Access the public IP of the tasks and you should see the text `It Works` from `httpd` container instead of the `nginx` welcome message. This will confirm that the rolling deployment has successfully completed.

## Cool, tell me more what is happening here? 

The `gmctl commit deploy` command invokes the Gitmoxi workflow which gets all the file changes since the last known commit. Gitmoxi stores the commit information, including head commit hash, in the DynamoDB table. So Gitmoxi can check what is the last known commit and fetch all the changes since that commit. If there is no known last commit, example when the repository is added for first time, Gitmoxi will treat all the files as new additions. 

Gitmoxi then looks for relevant file changes. In case of ECS, the relevant files are determined by the suffix `_svcdef.json` (service definition file), `_taskdef.json` (task definition file), and `_input.json` (input file with substitutions for attributes). If any relevant files are changed then Gitmoxi triggers the create/update workflow. 

The infrastructure that you created using Terraform provided all the necessary input needed for the ECS service. The `terraform_ouput.json` file is referenced in `nginx_input.json` file and Gitmoxi replaces the attributes in service and task definition files using the Terraform output. This way you have a clean separation of concern between infrastructure and service/task definition files. You also don't need to do brittle and hacky things in Terraform such as ignore `desired_count`, use a dummy container since task definition creation needs a container. Also in next section you will see that you can do seamless blue-grean deployment which works harmoniously with your Terraform generated infrastructure. 

## Delete the ECS rolling update test service
You can delete the `rolling-nginx-svc` service (it costs money even if it is running on Fargate Spot!). Please adjust the attributes if you have changed them in Terraform.

```bash
aws ecs delete-service --cluster gitmoxidemo --service rolling-nginx-svc --region us-west-2 --force
```

## Create ECS service for blue/green test
We will create a load-balanced ECS service and test the blue/green deployment. Note that we have already created the `ALB` along with a listener and two target groups using Terraform in the create ECS infrastructure section. Now we will just use those target groups and create the new ECS service named `bg-nginx-svc`.

```bash
cd $WORKING_DIR/ecs/blue-green-update
cp sample/nginx_taskdef.json.sample nginx_taskdef.json
cp sample/nginx_svcdef.json.sample nginx_svcdef.json
cp sample/nginx_depdef.json.sample nginx_depdef.json
cp sample/nginx_input.json.sample nginx_input.json
cd $WORKING_DIR
git add .
git commit -m "creating the blue/green test service"
git push
```
Do a quick dryrun to check that the service files for blue/green are the relevant changes.
```bash
gmctl commit dryrun -r $GITMOXI_DEMO_REPO -b main 
```
```
latest_commit_hash                        previous_processed_commit_hash            file                                      change             relevance
----------------------------------------  ----------------------------------------  ----------------------------------------  -----------------  ------------------
ac668f7f3da9f09c07d0fb5c88a70a617263ebb7  484d16f968226c1b35f566c406b620c4e3c450cb  ecs/blue-green-update/nginx_input.json    added_or_modified  ecs_relevant_files
ac668f7f3da9f09c07d0fb5c88a70a617263ebb7  484d16f968226c1b35f566c406b620c4e3c450cb  ecs/blue-green-update/nginx_svcdef.json   added_or_modified  ecs_relevant_files
ac668f7f3da9f09c07d0fb5c88a70a617263ebb7  484d16f968226c1b35f566c406b620c4e3c450cb  ecs/blue-green-update/nginx_taskdef.json  added_or_modified  ecs_relevant_files
```

Now we are ready to deploy this commit.

```bash
gmctl commit deploy -r $GITMOXI_DEMO_REPO -b main 
```

In the AWS console, `us-west-2` region, you should see ECS `bg-nginx-svc` in the `gitmoxidemo` cluster. The tasks for this service are running on private subnets. So you can only access them through the load balancer endpoint. You should see the `nginx` welcome message when you go to the load balancer endpoint.

```bash
cd $WORKING_DIR/ecs/core-infra/terraform
echo "http://$(terraform output -raw alb_endpoint)"
curl -s "$(jq -r '.alb_endpoint.value' terraform_output.json)"
```

## Perform blue/green deployment
Once again we will change the task container image from `nginx` to `httpd`. This time we will do the blue/green deployment so there will be two sets of tasks running - the old with `nginx` container, and the new with `http` container. Then we will do the `linear` traffic shift, moving 20% of traffic every 10 seconds from old to new tasks. This shift is done by changing the target group weights on the ALB listener forwarding rule.

```bash
cd $WORKING_DIR/ecs/blue-green-update
cp sample/nginx_input.json.sample.httpd nginx_input.json
cd $WORKING_DIR
git add .
git commit -m "changing image from nginx to httpd to test blue/green deployment"
git push
```

And deploy the changes using our familiar `gmctl commit deploy ` command. 

```bash
gmctl commit deploy -r $GITMOXI_DEMO_REPO -b main 
```

After a few seconds the tasks with new container image (`httpd`) will be running and registered to the ALB target group. Now ping the ALB endpoint multiple times using the curl command. 

```bash
cd $WORKING_DIR
curl -s "$(jq -r '.alb_endpoint.value' ecs/core-infra/terraform/terraform_output.json)"
```

You should see the output flip between `It Works` message from the new `httpd` containers to the `nginx` welcome message from the old `nginx` containers. You can also open the AWS console, go to the ALB, and see that the target group weights are increasing linearly by 20%. Once the whole traffic is shifted the old tasks with `nginx` container will be deleted. The full traffic is now served by the new tasks with new container. 

[Gitmoxi ECS blue/green deployment documentation]() provides further details on features such as different traffic shifting patterns, multiple target group support, controls such as shift percent and shift interval, alarms to monitor and rollback.

## Delete the ECS blue/green update test service
You can delete the `bg-nginx-svc` service using command below. Please adjust the attributes if you have changed them in Terraform.

```bash
aws ecs delete-service --cluster gitmoxidemo --service bg-nginx-svc --region us-west-2 --force
```

## Cleanup

Let's now delete all the AWS resources we created to perform the ECS testing.

```bash
cd $WORKING_DIR/ecs/core-infra/terraform
terraform destroy --auto-approve
cd $WORKING_DIR
```

In the next [Lambda section](./getting_started_lambda) you will test Lambda create and update using the same GitOps flow as above providing you with a unified deployment workflow for both ECS and Lambda.

