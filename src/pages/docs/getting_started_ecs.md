---
title: "Getting Started with Gitmoxi for ECS"
navtitle: "Getting Started ECS"
layout: ../../layouts/MdLayout.astro
---

# Testing Gitmoxi for ECS Deployments

## Infrastructure for ECS test services

We have provided a sample Terraform file which will create the required infrastructure for ECS test services:

* ECS Cluster - needed to create ECS service and tasks
* VPC and Subnet both private and public - needed for Fargate tasks to run
* Security Group - needed for Fargate tasks to run
* ECS Task Execution Role - needed for ECS tasks to run
* CloudWatch log group - needed for containers in ECS tasks to send logs
* Two target groups (needed for the blue/green test)
* An ALB with a listener that forwards traffic to the above two target groups (needed for the blue/green test)
* All of the above is created in `us-west-2` region. You can change that in the `main.tf` file if you want. 

**Please complete all the steps in [Getting Started](./getting_started) section to install Gitmoxi, fork and clone the `gm-demo` repository, and add your copy of the `gm-demo` repository to Gitmoxi.**

Let us start by creating the infrastructure for ECS test services.

```bash
cd gm-demo
export WORKING_DIR=$PWD
cd $WORKING_DIR/ecs/core-infra/terraform
terraform init
terraform plan
terraform apply --auto-approve 
terraform output --json > terraform_output.json
```
Note: Keep the Terraform output JSON file name the same. This file is used to substitute the attributes in service and task definition files.

## Create ECS service 
We will follow the GitOps paradigm where we will commit the deployment artifacts to a repository and then trigger the deployment for that commit. 

Start by copying the deployment artifacts provided in the `ecs/rolling-update` folder. 

 ```bash
 cd $WORKING_DIR/ecs/rolling_update
 cp sample/nginx_taskdef.json.sample nginx_taskdef.json
 cp sample/nginx_svcdef.json.sample nginx_svcdef.json
 cp sample/nginx_depdef.json.sample nginx_depdef.json
 cp sample/nginx_input.json.sample nginx_input.json
 cd $WORKING_DIR
 git add .
 git commit -m "creating nginx svc with rolling update"
 git push
 ```

Now let us trigger the deployment based on above commit. The CLI command `gmctl commit deploy` will deploy the changes associated with the latest commit. 

```bash
gmctl commit deploy -r $GITMOXI_DEMO_REPO -b main 
```
You should see a new service `rolling-nginx-svc` created in your ECS cluster! The `rolling-nginx-svc` has tasks attached to a public subnet and public IP is enabled. You can access the public IP to see the `nginx` welcome page.

## Perform rolling update
In previous step, Gitmoxi created the service since it didn't exist. Now we will update the container image to `httpd`, commit the changes, and trigger Gitmoxi rolling update.

```bash
cd $WORKING_DIR/ecs/rolling_update
cp sample/nginx_input.json.sample.httpd nginx_input.json
git add .
git commit -m "changing image from nginx to httpd to test rolling update"
git push
```
And deploy the changes. Just the same command as above and it will deploy the latest changes and update the service!

```bash
gmctl commit deploy -r $GITMOXI_DEMO_REPO -b main
```

Access the public IP of the tasks and you should see the text `It Works` from `httpd` container instead of the `nginx` welcome message. This will confirm that the rolling deployment has successfully completed.

You can also get a list of the deployments and their status details at http://localhost:3000/deployments/ecs or using the `gmctl` commands. The first command gives a list of the deployments.

```bash
gmctl deployment ecs get -r $GITMOXI_DEMO_REPO -b main
```
The flags, `-v -A`, provide more verbose details.

```bash
gmctl deployment ecs get -r $GITMOXI_DEMO_REPO -b main -v -A
```

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

