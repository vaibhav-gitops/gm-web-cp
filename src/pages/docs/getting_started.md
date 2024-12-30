---
title: "Getting Started with Gitmoxi"
navtitle: "Getting Started"
layout: ../../layouts/MdLayout.astro
---

# Getting Started with Gitmoxi
Gitmoxi is inspired by GitOps paradigm, that is, you store, version control, and collaborate on deployment artifacts in Git. Gitmoxi uses these files to create and update associated objects in AWS services. So you will need GitHub and AWS accounts to try Gitmoxi continuous deployment features. In this getting started guide, you will setup Gitmoxi on you laptop, use deployment artifacts from GitHub, and deploy resources in AWS.

### Prerequisites
* Mac laptop (tested on Sonoma 14.5)
* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
* [Git CLI](https://github.com/git-guides/install-git#install-git-on-mac)
* Either [Hashicorp Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli) or [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html) to create the infrastructure components.
* If you want to use existing infrastructure components such as ECS cluster, task execution IAM role, VPC, subnets, then you don't need Terraform or CDK. Just see the relevant test section and it will guide you on how to provide those values.


### Installation Setup
<details class="mb-5 pl-5">
<summary class="text-lg"><strong>Install with Docker Desktop (may require Docker License)</strong></summary>

[Install Docker Desktop](https://www.docker.com/products/docker-desktop/)

</details>

<details class="mb-5 pl-5">
<summary style="font-size: 18px"><strong>Install with Lima</strong></summary>

#### Install Lima, Docker CLI, and Docker Compose
* Lima is an open-source container runtime that runs containers in a lightweight Linux VM, offering a seamless, Docker-compatible alternative.
* The Docker CLI and Docker Compose are open-source tools and do not require a license; it is the use of Docker Desktop that requires a paid license.

  ```bash
  brew install lima docker docker-compose
  limactl start template://docker --mount-writable  # Proceed with preset configurations. This takes a few minutes to start.
  docker context create lima-docker --docker "host=unix://$HOME/sock/docker.sock"
  docker context use lima-docker
  ```

</details>

### Authenticate to AWS account
* Ensure you have an **AWS account** with the [required privileges](./security.md) (or for testing you can also use admin privileges if available).
* Authenticate to the account.
* Set the following env variables. You can the find the `AWS_PROFILE` in `~/.aws/credentials` file usually the first line before authentication secrets will have in `[]` brackets.
  ```bash
  export AWS_ACCOUNT=<your AWS account id>
  export AWS_PROFILE=<the profile from authentication>
  export AWS_REGION=<your default AWS region>
  ```

### Setting up GitHub

* Start by forking the https://github.com/gitmoxi/gm-demo repository.
* **[Create a GitHub access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)** so that Gitmoxi can read the manifest files for deployment. Give this token access to the `repo` all actions and `read:packages`.
  ```bash
  export GITHUB_TOKEN=<token you created above>
  ```
  **Note** that for production deployments you will use AWS Secrets Manager or SSM Parameter Store (SecureString) to store the GitHub token.

### Run Gitmoxi

* Start by replacing the environment variables with your AWS account and GitHub token values from above.
  ```bash
  cp sample.env .env
  sed -i 's/<AWS_REGION>/'"$AWS_REGION"'/g' .env
  sed -i 's/<AWS_ACCOUNT>/'"$AWS_ACCOUNT"'/g' .env
  sed -i 's/<AWS_PROFILE>/'"$AWS_PROFILE"'/g' .env
  sed -i 's/<GITHUB_TOKEN>/'"$GITHUB_TOKEN"'/g' .env
  ```
* Start the DynamoDB and Redis local containers, followed by creation of tables in DynamoDB, and then launch Gitmoxi application containers. It is easier to just create 3 terminals and launch the following commands in each of them.

  ```bash
  # Terminal 1
  docker-compose -f dynamo-redis-compose.yml up 
  
  # Terminal 2
  source create_tables.sh
  
  # Terminal 3
  docker-compose -f gitmoxi-docker-compose.yml up
  ```
  You can check that the UI is running at http://localhost:3000

### Setup GitHub repository for use with Gitmoxi

* In UI, click on `Respositories` section
* Enter the URL for the forked repo above `https://github.com/<your-user-name>/gm-demo`
* Enter `main` for the branch
* Enter `GITHUB_TOKEN` for GitHub Credentials. (Do not enter the actual token. Just the string as it is the evironment variable where token is stored.)

### Testing Gitmoxi for ECS Deployments

#### Create infrastructure needed by ECS

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

#### Create ECS service
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

#### Performing ECS rolling update
Replace the container image for `my-nginx-svc` and commit the changes to the file. Gitmoxi will conduct rolling deployment for the service.

```bash
cd ecs/app/nginx-rolling
sed -i '' 's/"public.ecr.aws\/nginx\/nginx:latest"/"public.ecr.aws\/docker\/library\/httpd:alpine3.20"/' nginx_input.json
git commit -m "change image from nginx to httpd" -a
git push
```


#### Performing ECS blue//green deployment
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


### Testing Gitmoxi for Lambda Deployments