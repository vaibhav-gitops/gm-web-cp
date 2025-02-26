---
title: "Getting Started with Gitmoxi for ECS"
navtitle: "Getting Started ECS"
layout: ../../layouts/MdLayout.astro
---

# Testing Gitmoxi for ECS Deployments

## Create infrastructure needed by ECS

We have provided a sample Terraform file which will create the required infrastructure for ECS:

* ECS Cluster - needed to create ECS service and tasks
* VPC and Subnet both private and public - needed for Fargate tasks to run
* Security Group - needed for Fargate tasks to run
* ECS Task Execution Role - needed for ECS tasks to run
* CloudWatch log group - needed for containers in ECS tasks to send logs
* Two target groups (needed for the blue/green test)
* An ALB with a listener that forwards traffic to the above two target groups (needed for the blue/green test)
* All of the above is created in `us-west-2` region. You can change that in the `main.tf` file if you want. 

```bash
cd ecs/core-infra/terraform
terraform init
terraform plan
terraform apply --auto-approve 
terraform output --json > terraform_output.json
```
Note: Keep the output file name the same. This file is used to substitute the attributes in service and task definition files.

## Create ECS service 
We will follow the GitOps paradigm where were will commit the deployment artifacts to a repository and then trigger the deployment for that commit. 

Start by copying the deployment artifacts provided in the `ecs/rolling-update` folder. For ECS, Gitmoxi looks for changes to files ending in suffix `_taskdef.json, _svcdef.json, and _input.json`. This way we trigger deployments only when relevant files are changed. The `_depdef.json` file has additiona configuration for deployment.

 ```bash
 cd ecs/rolling-update
 mv nginx_taskdef.json.sample nginx_taskdef.json
 mv nginx_svcdef.json.sample nginx_svcdef.json
 mv nginx_depdef.json.sample nginx_depdef.json
 mv nginx_input.json.sample nginx_input.json
 cd ../../
 git commit -m "creating nginx svc with rolling update" -a
 git push
 ```

Now let us trigger the deployment based on above commit. The CLI command `gmctl commit deploy` will deploy the changes associated with the latest commit. 

 ```bash
 gmctl commit deploy -r https://github.com/<your-github-username>/gm-demo -b main 
 ```
You should see a new service `rolling-nginx-svc` created in your ECS cluster! The GitOps flow ensures you have a reviewed and approved record of the artifacts that is deployed. 

## Perform rolling update
ECS natively supports rolling update. So all we have to do is update the container image, commit the changes, and trigger the deployment just like above.

Go to the `ecs/rolling-update` directory and in file `nginx_input.json` set the `nginx_container_image` value to `"public.ecr.aws/docker/library/httpd:alpine3.20"`. You can do this by editing the file or using the command below.

 ```bash
 cd ecs/rolling-update
 sed -i '' 's/"public.ecr.aws\/nginx\/nginx:latest"/"public.ecr.aws\/docker\/library\/httpd:alpine3.20"/' nginx_input.json
 cd ../..
 ```
Commit these changes to the repository

 ```bash
 git commit -m "changing the image to httpd to test rolling update" -a 
 git push
 ```
And deploy the changes. Just the same command as above and it will deploy the latest changes!

 ```bash
 gmctl commit deploy -r https://github.com/<your-github-username>/gm-demo -b main
 ```

The `rolling-nginx-svc` has tasks attached to a public subnet and public IP is enabled. So you can access the public IP of the task and see the text `It Works` from `httpd` container instead of the `NGINX welcome message`. This will confirm that the rolling deployment has successfully completed.

You can also get a list of the deployments and their status details using the `gmctl` commands. The first command gives a list of the deployments.

 ```bash
 gmctl deployment ecs get -r https://github.com/<your-github-username>/gm-demo 
 ```
The flags, `-v -A`, provide more verbose details.

 ```bash
 gmctl deployment ecs get -r https://github.com/<your-github-username>/gm-demo -v -A
 ```

## Cool, tell me more what is happening here? 

The `gmctl commit deploy` command invokes the Gitmoxi workflow which gets all the file changes since the last known commit. Gitmoxi stores the commit information, including head commit hash, in the DynamoDB table. So Gitmoxi can check what is the last known commit and fetch all the changes since that commit. If there is no known last commit, example when the repository is added for first time, Gitmoxi will treat all the files as new additions. 

Gitmoxi then looks for relevant file changes. In case of ECS, the relevant files are determined by the suffix `_svcdef.json` (service definition file), `_taskdef.json` (task definition file), and `_input.json` (input file with subsitutions for attributes). There are similar relevant files for Lambda as well. If any relevant files are changed then Gitmoxi triggers the create/update workflow. 

The infrastructure that you created using Terraform provided all the necessary input needed for the ECS service. The `terraform_ouput.json` file is referenced in `nginx_input.json` file and Gitmoxi replaces the attributes in service and task definition files using the Terraform output. This way you have a clean separation of concern between infrastructure and service/task definition files. You also don't need to do brittle and hacky things in Terraform such as ignore `desired_count`, use a dummy container since task definition creation needs a container. Also in next section you will see that you can do seamless blue-grean deployment which works harmoniously with your Terraform generated infrastructure. 

## Delete the ECS rolling update test service
You can delete the `rolling-nginx-svc` service (it costs money even if it is running on Fargate Spot!). Please adjust the attributes if you have changed them in Terraform.

 ```bash
 aws ecs delete-service --cluster gitmoxidemo --service rolling-nginx-svc --region us-west-2 --force
 ```

## Create ECS service for blue/green test
We will create a load-balanced ECS service and test the blue/green deployment. Note that we have already create the `ALB` along with a listener and two target groups using Terraform in the create ECS infrastructure section. Now we will just use those target groups and create the new ECS service named `bg-nginx-svc`.

 ```bash
 cd ecs/blue-green-update
 mv bg_nginx_taskdef.json.sample bg_nginx_taskdef.json
 mv bg_nginx_svcdef.json.sample bg_nginx_svcdef.json
 mv bg_nginx_depdef.json.sample bg_nginx_depdef.json
 mv bg_nginx_input.json.sample bg_nginx_input.json
 cd ../..
 git commit -m "creating the blue/green test service" -a
 git push
 ```

 Now we are ready to deploy this commit.

 ```bash
 gmctl commit deploy -r https://github.com/<your-github-username>/gm-demo -b main
 ```

In the AWS console, `us-west-2` region, you should see ECS `bg-nginx-svc` in the `gitmoxidemo` cluster. The tasks for this service are running on private subnets. So you can only access them through the load balancer endpoint. You should see the `NGINX welcome message` when you go to the load balancer endpoint.

```bash
<grab the alb endpoint from terraform_output.json>
run the curl command on it
```

## Perform blue/green deployment
Once again we will change the task container image from `nginx` to `httpd`. This time we will do the blue/green deployment so there will be two sets of tasks running - the old with `nginx` container, and the new with `http` container. Then we will do the `linear` traffic shift, moving 10% of traffic every 10 seconds from old to new tasks. This shift is done by changing the target group weights on the ALB listener forwarding rule. 

Open the file `ecs/blue-green-update/bg_nginx_input.json` and set the value for `nginx_container_image`  to `"public.ecr.aws/docker/library/httpd:alpine3.20"`. You can do this by editing the file or using the command below.

 ```bash
 cd ecs/blue-green-update
 sed -i '' 's/"public.ecr.aws\/nginx\/nginx:latest"/"public.ecr.aws\/docker\/library\/httpd:alpine3.20"/' bg_nginx_input.json
 cd ../..
 ```
Commit these changes to the repository

 ```bash
 git commit -m "changing the image to httpd to test blue/green update" -a 
 git push
 ```
And deploy the changes using our familiar `gmctl commit deploy ` command. 

 ```bash
 gmctl commit deploy -r https://github.com/<your-github-username>/gm-demo -b main
 ```

After a few seconds the tasks with new container image (`httpd`) will be running and registered to the ALB target group. You can open the ALB endpoint in browser and hit refresh multiple times. You should see the return flip between `It Works` message from the new `httpd` containers to the `NGINX welcome message` from the old `nginx` containers. You can also open the AWS console, go to the ALB, and see that the target group weights are increasing linearly by 10%. Once the whole traffic is shifted the old tasks container `nginx` containers will be deleted. The full traffic is now served by the new tasks with new container. 

[Gitmoxi ECS blue/green deployment documentation]() provides further details on features such as different traffic shifting patterns, multiple target group support, controls such as shift percent and shift interval, alarms to monitor and rollback.

## Delete the ECS blue/green update test service
You can delete the `bg-nginx-svc` service using command below. Please adjust the attributes if you have changed them in Terraform.

 ```bash
 aws ecs delete-service --cluster gitmoxidemo --service bg-nginx-svc --region us-west-2 --force
 ```

 In the next section you will test Lambda create and update using the same GitOps flow as above providing you with a unified deployment workflow for both ECS and Lambda. 
