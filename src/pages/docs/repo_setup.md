---
title: "GitOps Repository Setup"
navtitle: "GitOps Repository Setup"
layout: ../../layouts/MdLayout.astro
---

# Setting up GitHub Repository for GitOps
Make sure you have Gitmoxi up and running before proceeding further. If you have followed the previous steps to install Gitmoxi then you should have the `GITMOXI_ENDPOINT_URL` environment variable setup.

```bash
echo $GITMOXI_ENDPOINT_URL
```

We have provided ECS and Lambda sample applications in [gitmoxi/gm-demo](https://github.com/gitmoxi/gm-demo) repository. This repository has:

* 2 ECS services one each for testing rolling and blue/green deployment. 
* 3 Lambda functions to deploy and test with ELB, API-Gateway, and SQS event sources. 
* 1 EKS application for testing blue/green deployment 

We will create a private repository in **your GitHub user account**, copy these sample files, and perform deployments securely using the private repository.

1. Create a **private** repository `gm-trial` in your <a href="https://github.com/new" target="_blank">GitHub account</a>
2. Run following commands to copy the sample applications to your GitHub repository. 

**Note** to set the correct GitHub user name in the environment variable.

```bash
export GITHUB_USER_NAME=<your-github-username>
```
Clone the `gm-demo` repository, copy the files and push to your `gm-trial` private repository.
```
cd ~/
git clone git@github.com:gitmoxi/gm-demo.git
cd gm-demo
git remote remove origin
git remote add origin git@github.com:$GITHUB_USER_NAME/gm-trial
git branch -M main
git push -u -f origin main
```
Check that the new repository has folders named `ecs`, `eks`, and `lambda` in the GitHub web console. Now we can add your private GitHub repository to Gitmoxi for GitOps.

```bash
export GITMOXI_DEMO_REPO=https://github.com/$GITHUB_USER_NAME/gm-trial
gmctl repo add -r $GITMOXI_DEMO_REPO -b main -a GITHUB_TOKEN
gmctl repo get
```
You should see your `gm-demo` repository added. 

Next, you can test any or all of the following services for GitOps-based deployments.
* [Testing ECS GitOps with Gitmoxi](./getting_started_ecs)
* [Testing EKS GitOps with Gitmoxi](./getting_started_k8s)
* [Testing Lambda GitOps with Gitmoxi](./getting_started_lambda)