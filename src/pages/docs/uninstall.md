---
title: "Uninstall Gitmoxi"
navtitle: "Uninstall Gitmoxi"
layout: ../../layouts/MdLayout.astro
---

After you are doing testing Gitmoxi you can remove it using `terraform destroy`. If you are curious about the internal architecture of the Gitmoxi trial version then we have provided additional details below as well. 

Go to the `gitmoxi-trial` directory (or other directory name) where you downloaded and stored the `gitmoxi.tf` trial Terraform manifest

```bash
cd gitmoxi-trial
terraform destroy --auto-approve
```

## Gitmoxi architecture for trial deployment
For trial, we will deploy all the containers needed for Gitmoxi in a single ECS task belonging to an ECS service. Below picture captures the overall architecture for the trial deployment that will be created by Terraform. 

![Gitmoxi Trial Architecture](/gitmoxi-trial-arch.png)

* Gitmoxi task: This task consists of 6 containers 
    * `gm-frontend` manages the Gitmoxi UI. It serves requests on port 3000 which is exposed via the Application Load Balancer (ALB)
    * `gm-backend` handles the API calls It serves requests on port 8080 which is also exposed via the ALB.
    * `gm-worker` is the main controller logic that handles deployments. It can handle multiple deployments in parallel.
    * `gm-poller` provides ability to listen for GitHub changes and automatically deploy the changes without requiring invocation of Gitmoxi deploy calls. We refer this as the `pull` (or listening) model.
    * `dynamodb-local` stores all the Gitmoxi configuration and deployment records. **The local dynamodb stores data in memory. So when the task restarts all the data will be lost.** For production you will use AWS Dynamodb service instead of local container. The `dynamodb-local` serves requests on port 8000 which is accessible only within the private subnet of the VPC. 
    * `redis` is used for the `gm-worker` for parallel processing of multiple deployments. It serves request on port 6379 which is also accessible only within the private subnet of the VPC.
    
    The Gitmoxi task is allocated 2vCPU and 4GB of RAM. And the architecture for the containers is ARM64; so it will run on Fargate backed by Graviton instances.

* Gitmoxi service is a load balanced service which takes two target groups, one for `gm-frontend (port 3000)` and another for `gm-backend (port 8080)`. 
    * The service deploys tasks on private subnets
    * The security group allows access to the 3000, 8080, 8000, and 6379 required by the Gitmoxi task containers. Only 3000 and 8080 are connected to target groups and accessible from outside the VPC.

* ALB is used to access the Gitmoxi frontend and backend services. For trial, the listener is connected to port 80. The listener has default forwarding rule to send traffic to the frontend target group which relays request to `gm-frontend`. The listener has another rule with higher priority that forwards all traffic on `/api/*` and `/auth/*` to the backend target group which relays to `gm-backend`.

## IAM rules used 

* Task execution role uses the AWS managed policy `arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy` which grants access to read ECR repositories and to put logs in CloudWatch.

* Gitmoxi task IAM role uses the following AWS managed policies
    * `policy_arn = "arn:aws:iam::aws:policy/AmazonECS_FullAccess` to manage entire lifecycle of ECS service, task, and tasksets.
    * `policy_arn = "arn:aws:iam::aws:policy/AWSLambda_FullAccess` to manage entire lifecycle of Lambda functions.
    * `policy_arn = "arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess` for reading the ELB listener rules and modifying the traffic weights during blue-green traffic shifting. 
    * `policy_arn = "arn:aws:iam::aws:policy/AmazonAPIGatewayAdministrator` for testing Lambda with API-Gateway
    * `policy_arn = "arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess` to read the CloudWatch alarms.
    * `policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess` to deploy Lambda functions

**Note** that the production deployment has more tighter and specific roles for the Gitmoxi task.