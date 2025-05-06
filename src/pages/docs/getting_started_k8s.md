---
title: "Getting Started with Gitmoxi for EKS"
navtitle: "Getting Started EKS"
layout: ../../layouts/MdLayout.astro
---

# EKS Deployments with Gitmoxi GitOps

> **⚠️ IMPORTANT:** Before proceeding, complete all steps in the [Getting Started](./getting_started) section to install Gitmoxi, create your private **`gm-trial`** repository, and add that repository to Gitmoxi.

## Overview

This guide walks you through testing Gitmoxi’s GitOps-based deployment for Amazon EKS by:

1. Creating EKS cluster and associated infrastructure required to test workloads
2. Deploying Kubernetes Resources (Deployment, Service, Secret, Config, and IngresS) using Gitmoxi GitOps
3. Performing a Blue/Green update to test changes
4. Cleaning up test resources

## Infrastructure Resources

We've provided a sample Terraform setup to create the necessary infrastructure for EKS. Ensure your IAM role has the permissions to create the following resources in the `us-west-2` region:

| Category       | Resources                                                                                     | Purpose                                                           |
|----------------|-----------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| **Networking** | • VPC<br>• Public Subnets<br>• Private Subnets<br>• Internet Gateway<br>• NAT Gateway<br>• Security Groups | Network setup for EKS cluster and workloads                      |
| **EKS**        | • EKS Cluster<br>• Node Group (Amazon Linux 2)<br>• ALB Controller (via Helm)                 | Hosts your Kubernetes workloads and manages ingress via ALB      |
| **IAM**        | • EKS Role<br>• Node IAM Role<br>• OIDC Provider<br>• ALB Controller IRSA Role               | Access control, Kubernetes integration, and IAM for Service Accounts |
| **Kubernetes** | • aws-load-balancer-controller Service Account                                                | Allows ALB Controller to authenticate with IAM via IRSA           |
| **Helm**       | • aws-load-balancer-controller Helm Release                                                  | Deploys AWS ALB controller into the EKS cluster                   |

> **Note:** The default region is `us-west-2`. You can change it in the `main.tf` file if necessary.

If you **have not** cloned your `gm-trial` repo then clone it first. Below commands clone it in your `HOME` directory but you can clone anywhere. 

```bash
cd ~
git clone git@github.com:$GITHUB_USER_NAME/gm-trial.git
```

Switch into the directory and export the working path:

```bash
cd ~/gm-trial
export WORKING_DIR=$PWD
```

## Create Infrastructure for EKS Test Workloads

Navigate to the Terraform directory for EKS:

```bash
cd $WORKING_DIR/eks/core-infra/terraform
terraform init
terraform plan
terraform apply --auto-approve
aws eks update-kubeconfig --region us-west-2 --name gitmoxi-eks
```
## Give Gitmoxi controller EKS access
To give the Gitmoxi controller running in ECS Fargate access to deploy and update EKS resources, add its task IAM role to the `aws-auth` configmap in the `kube-system` namespace.
```yaml
apiVersion: v1
data:
  mapRoles: |
    - rolearn: arn:aws:iam::381491902283:role/GitmoxiServiceTaskRole-d70e2906b67d3ee1
      username: gitmoxi-controller
      groups:
        - system:masters
    ...
    ...
```

```bash
cd $WORKING_DIR/eks/core-infra/terraform
./eks_access.sh $GITMOXI_TASK_IAM_ROLE
```

> **Note:** In production you will use [AWS EKS access entries](https://docs.aws.amazon.com/eks/latest/userguide/access-entries.html) with least privileges access. 

## Create EKS Test Workload

We’ll now deploy a sample application using Gitmoxi by committing Kubernetes manifests.

Copy the sample manifests:

```bash
cd $WORKING_DIR/eks/apps/blue-green-update
cp sample/blue_deployment.yaml.sample deployment.yaml
cp sample/service.yaml.sample service.yaml
cp sample/ingress.yaml.sample ingress.yaml
cp sample/secret.yaml.sample secret.yaml
cp sample/configmap.yaml.sample configmap.yaml
cp sample/deployment_definition.yaml.sample deployment_definition.yaml
cd $WORKING_DIR
```

Verify that the files were copied correctly:

```bash
git status
```

You should see the following files as untracked:

```
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	eks/apps/blue-green-update/configmap.yaml
	eks/apps/blue-green-update/deployment.yaml
	eks/apps/blue-green-update/deployment_definition.yaml
	eks/apps/blue-green-update/ingress.yaml
	eks/apps/blue-green-update/secret.yaml
	eks/apps/blue-green-update/service.yaml
```

Add and commit the files:

```bash
git add .
git commit -m "creating nginx workload on EKS"
git push
```
## Gitmoxi Commit Dryrun
Perform a dryrun to verify that the new files are valid and relevant for Gitmoxi:

```bash
gmctl commit dryrun -r $GITMOXI_DEMO_REPO -b main
```

Sample output:

```
latest_commit_hash                        previous_processed_commit_hash            file                                                   change             relevance
----------------------------------------  ----------------------------------------  -----------------------------------------------------  -----------------  ------------------
39477924369a5f61370d789aa16a7f169fbf47a4  e37578c8049a5eccdab40f189ed45df4d2912d6c  eks/apps/blue-green-update/configmap.yaml              added_or_modified  k8s_relevant_files
39477924369a5f61370d789aa16a7f169fbf47a4  e37578c8049a5eccdab40f189ed45df4d2912d6c  eks/apps/blue-green-update/deployment.yaml             added_or_modified  k8s_relevant_files
39477924369a5f61370d789aa16a7f169fbf47a4  e37578c8049a5eccdab40f189ed45df4d2912d6c  eks/apps/blue-green-update/deployment_definition.yaml  added_or_modified  k8s_relevant_files
39477924369a5f61370d789aa16a7f169fbf47a4  e37578c8049a5eccdab40f189ed45df4d2912d6c  eks/apps/blue-green-update/ingress.yaml                added_or_modified  k8s_relevant_files
39477924369a5f61370d789aa16a7f169fbf47a4  e37578c8049a5eccdab40f189ed45df4d2912d6c  eks/apps/blue-green-update/secret.yaml                 added_or_modified  k8s_relevant_files
39477924369a5f61370d789aa16a7f169fbf47a4  e37578c8049a5eccdab40f189ed45df4d2912d6c  eks/apps/blue-green-update/service.yaml                added_or_modified  k8s_relevant_files
```

## Gitmoxi Commit Deploy

Now trigger the actual deployment using:

```bash
gmctl commit deploy -r $GITMOXI_DEMO_REPO -b main
```

Monitor deployment progress from the Gitmoxi UI under `EKS -> Live Deployments`. If you did all steps in Getting Started section and are in the same terminal then you can print the UI URL via:

```bash
echo $GITMOXI_ENDPOINT_URL
```

![EKS Live Deployment](/eks_live_deployment.png)

You should now see a live deployment named `test-app` in your EKS cluster. You should see a new deployment `test-app` created in your EKS cluster in AWS console as well. Validate it by running:

```bash
kubectl get all -n default
```

You will need to wait about 2-3 minutes for the alb ingress controller to provision a new load balancer and get it to `ACTIVE` state. Once the load balancer is active, you can validate that the application is exposed on the load balancer endpoint. You should see the output state `BLUE VERSION`. 

```bash
curl -s $(kubectl get ingress test-app -o=jsonpath='{.status.loadBalancer.ingress[0].hostname}')
```

## Perform a Blue/Green Update

Let’s update the container image from `BLUE` to `GREEN` to test blue/green updates. We will be doing a linear traffic shift, moving 25% of traffic every 15 seconds from old to new tasks.

```bash
cd $WORKING_DIR/eks/apps/blue-green-update
cp sample/green_deployment.yaml.sample deployment.yaml
cd $WORKING_DIR
git add .
git commit -m "updating image from blue to green"
git push
```

Trigger the update:

```bash
gmctl commit deploy -r $GITMOXI_DEMO_REPO -b main
```

You should see this new deployment ongoing on the Gitmoxi UI. Once the traffic shifting starts, you should start seeing the annotations being updated in the ingress. You can confirm that by running:

```bash
kubectl describe ingress -n default
```

You should see `blue-green=update-v2` in the ingress annotations. Now you can start pinging the alb endpoint to see the output flip between `BLUE VERSION` and `GREEN VERSION` while the traffic shifting is underway.

```bash
curl http://$\(kubectl get ingress -n default -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
```


## How Gitmoxi GitOps Works

The `gmctl commit deploy` command initiates Gitmoxi's deploy workflow:

- Gitmoxi retrieves the latest commit from Github.
- It compares current files with the last processed commit.
- If any of the relevant kubernetes manifests are modified, it triggers deployment.

This approach separates infra (Terraform) and Kubernetes manifests, making the setup modular and maintainable.

## Clean Up

To delete the deployed resources:

```bash
kubectl delete all --all && kubectl delete ingress --all && kubectl delete secret --all && kubectl delete configmap --all
```

To delete the entire EKS infrastructure:

```bash
cd $WORKING_DIR/eks/core-infra/terraform
terraform destroy --auto-approve
```

## Congrats!

🎉 You have successfully deployed, updated, and managed a Kubernetes workload on Amazon EKS using Gitmoxi GitOps!

Also, checkout Gitmoxi GitOps for [ECS](./getting_started_ecs) and [Lambda](./getting_started_lambda). 