---
title: "Getting Started with Gitmoxi"
navtitle: "Getting Started"
layout: ../../layouts/MdLayout.astro
---

# Getting Started with Gitmoxi
Gitmoxi is inspired by GitOps paradigm where you store, version control, and collaborate on deployment artifacts in Git. Gitmoxi uses these files to create and update associated objects in AWS services. So you will need GitHub and AWS accounts to try Gitmoxi continuous deployment features. In this getting started guide, you will setup Gitmoxi on you laptop, use deployment artifacts from GitHub, and deploy resources in AWS.

<a href="#" id="downloadLink" class="text-blue-600 hover:underline">Download Trial Now</a>

### Prerequisites
* Mac laptop (tested on Sonoma 14.5)
* [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
* [Git CLI](https://github.com/git-guides/install-git#install-git-on-mac)
* [Hashicorp Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli)
* Gitmoxi CLI
  ```bash
  pip install gmctl
  gmctl --help
  ```

### Installation Setup
<details class="mb-5 pl-3">
<summary class="text-lg"><strong>Install with Docker Desktop (may require Docker License)</strong></summary>

[Install Docker Desktop](https://www.docker.com/products/docker-desktop/)

</details>

<details class="mb-5 pl-3">
<summary class="text-lg"><strong>Install with Lima</strong></summary>

#### Install Lima, Docker CLI, and Docker Compose
* Lima is an open-source container runtime that runs containers in a lightweight Linux VM, offering a seamless, Docker-compatible alternative.
* The Docker CLI and Docker Compose are open-source tools and do not require a license; it is the use of Docker Desktop that requires a paid license.

  ```bash
  brew install lima docker docker-compose
  limactl start template://docker --mount-writable  # Proceed with preset configurations. This takes a few minutes to start.
  docker context create lima-docker --docker "host=unix://$HOME/sock/docker.sock"
  docker context use lima-docker
  rm ~/.docker/config.json
  ```

</details>

### Authenticate to AWS account
* Ensure you have an **AWS account** with the required privileges (or for testing you can also use admin privileges if available).
* Authenticate to the account.
* Set the following env variables. You can the find the `AWS_PROFILE` in `~/.aws/credentials` file; usually the first line before authentication secrets will have profile in `[]` brackets.
  ```bash
  export AWS_ACCOUNT=<your AWS account id>
  export AWS_PROFILE=<the profile from authentication>
  export AWS_REGION=<your default AWS region>
  ```

### Setting up GitHub repository for the deployment artifacts

* Start by forking the https://github.com/gitmoxi/gm-demo repository.
* **[Create a GitHub access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)** so that Gitmoxi can read the manifest files for deployment. Give this token access to the `repo` all actions and `read:packages`.
  ```bash
  export GITHUB_TOKEN=<token you created above>
  export GM_DEMO_REPO_URL=https://github.com/<your-github-username>/gm-demo # Make sure to replace the username
  ```
**Note** that for production deployments you will use AWS Secrets Manager or SSM Parameter Store (SecureString) to store the GitHub token.

### Install Gitmoxi

* Start by replacing the environment variables with your AWS account and GitHub token values from above.
  ```bash
  cp sample.env .env
  sed -i 's/<AWS_REGION>/'"$AWS_REGION"'/g' .env
  sed -i 's/<AWS_ACCOUNT>/'"$AWS_ACCOUNT"'/g' .env
  sed -i 's/<AWS_PROFILE>/'"$AWS_PROFILE"'/g' .env
  sed -i 's/<GITHUB_TOKEN>/'"$GITHUB_TOKEN"'/g' .env
  ```
* Start the DynamoDB and Redis local containers

  ```bash
  # Terminal 1
  docker-compose -f dynamo-redis-compose.yml up 
  ```
* In second different terminal create the tables used by Gitmoxi application

  ```bash
  # Terminal 2
  source create_tables.sh
  ```
* In third terminal start the Gitmoxi application
  ```bash  
  # Terminal 3
  docker-compose -f gitmoxi-docker-compose.yml up
  ```
You can check that the UI is running at http://localhost:3000

### Setup GitHub repository for use with Gitmoxi
Add the `gm-demo` repository you forked above

  ```bash
  gmctl repo add -r $GM_DEMO_REPO_URL -b main -a GITHUB_TOKEN
  ```

<br/>
<div class="highlight-box">With everything set up, you're now ready to begin testing!! The following two sub-sections will guide you through testing GitMoxi for ECS and Lambda deployments.</div>

<style>
  .highlight-box { 
    border-radius: 8px;
    background-color: rgba(219,239,255,0.72);
    padding: 1rem 1.5rem;
    font-size: 1rem;
  }
</style>