---
title: "Install Gitmoxi on EKS"
navtitle: "Install Gitmoxi on EKS"
layout: ../../layouts/MdLayout.astro
---
# Install Gitmoxi on EKS

## Prerequisites
Make sure you have done all the steps in the [Getting Started](./getting_started) section and set the following environment variables which are required for installing Gitmoxi on EKS.
```
AWS_REGION
AWS_ACCOUNT
AWS_PROFILE
GITHUB_TOKEN
```
You can either create a new cluster or use an existing one to deploy Gitmoxi. 

<details>
  <summary style="font-size: 1.5em; font-weight: bold;">Create new EKS cluster</summary>

Create a new EKS cluster if you don't have or don't want to use an existing EKS cluster. To use existing EKS cluster skip to [next section](#install-gitmoxi-on-existing-cluster)

### Required AWS IAM Role
The EKS cluster creation Terraform will use your AWS credentials to create the following resources. Ensure that your signed-in user has permissions to create:

| Resource Type | Details |
|---------------|---------|
| **EKS Cluster** | • eks:CreateCluster, eks:DescribeCluster, eks:UpdateClusterConfig<br>• eks:DeleteCluster, eks:ListClusters<br>• eks:TagResource, eks:UntagResource<br>• eks:CreateAccessEntry, eks:AssociateAccessPolicy<br>• iam:CreateServiceLinkedRole, iam:PassRole |
| **EKS Node Group** | • eks:CreateNodegroup, eks:DescribeNodegroup, eks:DeleteNodegroup<br>• eks:UpdateNodegroupConfig<br>• ec2:DescribeSubnets, ec2:DescribeSecurityGroups<br>• iam:CreateRole, iam:AttachRolePolicy, iam:PassRole<br>• autoscaling:CreateAutoScalingGroup, autoscaling:DescribeAutoScalingGroups |
| **VPC Resources** | • ec2:DescribeVpcs<br>• ec2:DescribeSubnets |
| **Helm Release (AWS LB Controller)** | • eks:DescribeCluster, eks:ListClusters<br>• sts:AssumeRole (to authenticate with EKS) |
| **Pod Identity Association** | • eks:CreatePodIdentityAssociation, eks:DeletePodIdentityAssociation<br>• eks:DescribePodIdentityAssociation<br>• iam:CreateRole, iam:CreatePolicy<br>• iam:AttachRolePolicy<br>• iam:DeleteRole, iam:DeletePolicy, iam:DetachRolePolicy |

### Create EKS cluster
Go to the `gitmoxi-trial` directory, which is obtained by unzipping the trial download file you received in email. Under the `eks` directory you will find `create_cluster` terraform code to create the EKS cluster. 

```bash
cd gitmoxi-trial
export GITMOXI_DEPLOY_DIR=$PWD
cd eks/cluster_create
terraform init
terraform apply --auto-approve
```
> **Note** If you run into an error towards tailend of terraform apply, then re-run the `terraform apply` after a few seconds, there is a race condition with `core-dns` add-on and the `ALB` controller.

Set the context to the new cluster.
```bash
export EKS_CLUSTER_ARN=$(terraform output -raw cluster_arn)
aws eks update-kubeconfig --region us-west-2 --name gitmoxi-eks
```

Check the cluster is ready 
```bash
kubectl get pods -n kube-system
```
```
NAME                               READY   STATUS    RESTARTS       AGE
aws-load-balancer-controller-xxx   1/1     Running   2 (6h1m ago)   6h4m
aws-load-balancer-controller-xxx   1/1     Running   2 (6h1m ago)   6h4m
...
...
```
</details>

<details>
  <summary style="font-size: 1.5em; font-weight: bold;">Use existing EKS cluster</summary>
* Make sure to use a non-production EKS cluster. 
* Make sure your cluster is setup to use EKS Pod Identity and not the old IRSA mechanism.
* Make sure you have ALB ingress controller setup

Start by setting couple of environment variables for the EKS cluster arn and cluster name where you want to deploy Gitmoxi. 

```bash
export EKS_CLUSTER_ARN=
export TF_VAR_cluster_name=
```
Next create the Gitmoxi pod IAM role and association using the terraform provided in the download package. Go to the directory `gitmoxi-trial`, which is obtained by unzipping the downloaded package. 

```bash
cd gitmoxi-trial
export GITMOXI_DEPLOY_DIR=$PWD
cd eks/existing_cluster
terraform init
terraform apply --auto-approve
```
</details>

## Install Gitmoxi
First we will create the `gitmoxi` namespace and ingress object. 

```bash
cd $GITMOXI_DEPLOY_DIR/eks/install_gitmoxi
kubectl apply -f gitmoxi-svc_namespace.yaml 
kubectl apply -f gitmoxi-svc_ingress.yaml
```

Store the Gitmoxi endpoint URL as that is needed for installing other components.

```bash
export GITMOXI_ENDPOINT_URL="http://$(kubectl get ingress gitmoxi-backend-http-8080 -n gitmoxi -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')"
echo $GITMOXI_ENDPOINT_URL
```
```
http://k8s-gitmoxi-xxxxxxxx-xxxxxxx.us-west-2.elb.amazonaws.com
```
> **Note**, you should see the GITMOXI_ENDPOINT_URL otherwise ingress creation has failed and Gitmoxi service won't be accessible.

Set some of the key environment variables needed to install Gitmoxi. 

```bash
rm .env
echo "AWS_REGION=$AWS_REGION" >> .env
echo "AWS_ACCOUNT=$AWS_ACCOUNT" >> .env
echo "GITHUB_TOKEN=$GITHUB_TOKEN" >> .env
echo "GITMOXI_FRONTEND_URL=$GITMOXI_ENDPOINT_URL" >> .env
echo "REACT_APP_BASE_URL=$GITMOXI_ENDPOINT_URL" >> .env
cat .env
```
Install rest of the components using `kustomize` - Gitmoxi deployment, service, service_account, and role-based access control.
```bash
cd $GITMOXI_DEPLOY_DIR/eks
kubectl apply -k install_gitmoxi/
```

Check that the Gitmoxi pod is running.

```bash
kubectl get pods -n gitmoxi
```
```
NAME                       READY   STATUS    RESTARTS   AGE
gitmoxi-76d5784f48-xxxrc   6/6     Running   0          9m7s
```
## Gitmoxi Up and Running
Wait for the `gitmoxi` pod to be in `Running` state. Sometimes the ingress takes a few minutes to get the pods registered and health check passed. Give it like 5-6 mins and you should see the Gitmoxi UI page at the `$GITMOXI_ENDPOINT_URL` endpoint. 

```bash
echo $GITMOXI_ENDPOINT_URL 
```
```          
http://k8s-gitmoxi-xxxxx-xxxxx.us-west-2.elb.amazonaws.com
```

![Gitmoxi UI](/gitmoxi_ui_page.png)

Next, we will [add a GitHub repository](./repo_setup) to Gitmoxi to test the GitOps workflow.