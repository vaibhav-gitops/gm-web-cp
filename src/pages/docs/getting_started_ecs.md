---
title: "Getting Started with Gitmoxi for ECS"
navtitle: "Getting Started ECS"
layout: ../../layouts/MdLayout.astro
---

# Testing Gitmoxi for ECS Deployments

### Create infrastructure needed by ECS

We have provided a sample Terraform file which will create the required infrastructure for ECS:

* ECS Cluster - needed to create ECS service and tasks
* VPC and Subnet both private and public - needed for Fargate tasks to run
* Security Group - needed for Fargate tasks to run
* ECS Task Execution Role - needed for ECS tasks to run
* CloudWatch log group - needed for containers in ECS tasks to send logs
* Two target groups (needed for the blue/green test)
* An ALB with a listener that forwards traffic to the above two target groups (needed for the blue/green test)

```bash
cd ecs/core-infra/terraform
terraform init
terraform plan
terraform apply --auto-approve 
terraform output --json > ecs_infra.json
```

### Create ECS service
We will simulate a GitOps flow. We will change the service definition file, just change the name for this test. Then we will commit these changes. Gitmoxi will `poll` for these changes and deploy the service. Since the service didn't exist it will create the service.

```bash
cd ecs/app/nginx-rolling
sed -i 's/nginx-svc/my-nginx-svc/g' nginx_input.json
git commit -m "name change to my-nginx-svc" -a
git push
 ```

You should see a new service `my-nginx-svc` created in your ECS cluster!

<strong class="mb-5"> Ok, what just happened? </strong><br/>
Gitmoxi has a poller service, which listens for new commits to all the configured repositories. When you changed the `nginx_input.json` and committed, Gitmoxi gathered all the files `nginx_svcdef.json`, `nginx_taskdef.json`, and `nginx_input.json`, and went through a create workflow for ECS service since the service didn't already exist.

The infrastructure that you created above and stored the output in `ecs_infra.json` file is referenced in the `nginx_input.json`. Gitmoxi automatically replaces these values in the ECS service and task definition! Now you have separation of concerns - infrstructure team can control components such as VPC, subnets whereas application teams can control aspects such as container images, desired count.

### Performing ECS rolling update
Replace the container image for `my-nginx-svc` and commit the changes to the file. Gitmoxi will conduct rolling deployment for the service.

```bash
cd ecs/app/nginx-rolling
sed -i '' 's/"public.ecr.aws\/nginx\/nginx:latest"/"public.ecr.aws\/docker\/library\/httpd:alpine3.20"/' nginx_input.json
git commit -m "change image from nginx to httpd" -a
git push
```


### Performing ECS blue/green deployment
First, let us create a new service `my-nginx-svc-bg`. This is a load-balanced service which uses the ALB and target groups created using terraform.

```bash
cd ecs/app/nginx-bg
sed -i 's/nginx-svc-bg/my-nginx-svc-bg/g' nginx_input.json
git commit -m "creating the nginx service for blue green test" -a
git push
```

If you open the `nginx_svcdef.json` you will see that the service definition is using deployment type `EXTERNAL` which will cause Gitmoxi to use blue/green deployment. The service also uses the target group for which the value comes from the `ecs_infra.json` file. In the `nginx_depdef.json` you can see the blue/green deployment configuration and that two target groups that will be used for traffic shifting as part of the blue/green deployment.

Once the service is created, let us change the image and commit the changes which will trigger the blue/green deployment.

```bash
cd ecs/app/nginx-bg
sed -i '' 's/"public.ecr.aws\/nginx\/nginx:latest"/"public.ecr.aws\/docker\/library\/httpd:alpine3.20"/' nginx_input.json
git commit -m "change image from nginx to httpd" -a
git push
```

This commit will trigger the blue/green deployment.


[In all of these steps our UI isn't playing any major role.]
