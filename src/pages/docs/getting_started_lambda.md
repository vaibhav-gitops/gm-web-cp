---
title: "Getting Started with Gitmoxi for Lambda"
navtitle: "Getting Started Lambda"
layout: ../../layouts/MdLayout.astro
---

# Lambda Deployments with Gitmoxi GitOps

> **⚠️ IMPORTANT:** Before proceeding, complete all steps in the [Getting Started](./getting_started) section to install Gitmoxi, create your private **`gm-trial`** repository, and add that repository to Gitmoxi.

This guide helps you test the deployment of AWS Lambda functions with GitMoxi. It sets up the necessary infrastructure to create and deploy Lambda functions while also testing their end-to-end integration with API Gateway, Elastic Load Balancer (ELB), and Amazon SQS. Additionally, we will test blue-green deployments with Lambda and incremental traffic shifting.

## Infrastructure for Lambda Test Functions

| Category | Resources | Purpose |
|----------|-----------|---------|
| **IAM** | • Execution role<br>• Lambda policies<br>• Custom SQS policy | Provide necessary permissions for Lambda function execution and SQS access |
| **Storage** | • S3 bucket<br>• Test Lambda zip files (blue, green, sqs) | Store and manage Lambda function code packages |
| **API Management** | • HTTP API Gateway<br>• Default stage<br>• Test route | Required for testing API Gateway integration with Lambda functions |
| **Networking** | • VPC and subnets<br>• Security groups | Required infrastructure for testing load balancer integration |
| **Load Balancing** | • Application Load Balancer (ALB)<br>• Target groups<br>• Listeners | Enable load balancing capabilities for Lambda functions |
| **Messaging** | • SQS queue<br>• Test message | Required for testing SQS event-based Lambda triggering |

If you **have not** cloned your `gm-trial` repo then clone it first. Below commands clone it in your `HOME` directory but you can clone anywhere. 

```bash
cd ~
git clone git@github.com:gitmoxi/gm-trial.git
```
Switch to the `gm-trial` directory.
```
cd ~/gm-trial
export WORKING_DIR=$PWD
```
Start by creating the infrastructure needed for Lambda functions. 

```bash
cd $WORKING_DIR/lambda/core-infra/terraform
terraform init
terraform plan
terraform apply --auto-approve
terraform output --json > terraform_output.json
cd $WORKING_DIR
```
Let the `terraform apply` and `terraform output` finish because this infrastructure is required to deploy Lambda functions.

## Creating Lambda functions and testing integrations
Following the GitOps paradigm, we will create the Lambda function deployment files and commit the changes to a repository and then trigger the deployment for that commit. 

Start by copying the deployment artifacts provided in the `ecs/rolling-update/sample` folder. 

### <u> 1. Testing API Gateway integration </u>
Start by copying the deployment artifacts provided in the `lambda/lambda-api-gateway/sample` folder. 

```bash
cd $WORKING_DIR/lambda/lambda-api-gateway
cp sample/test_lambdadef.json.sample test_lambdadef.json
cp sample/test_lambdadepdef.json.sample test_lambdadepdef.json
cp sample/test_lambdaeventsourcedef.json.sample test_lambdaeventsourcedef.json
cp sample/test_lambdainput.json.sample test_lambdainput.json
cd $WORKING_DIR
```
Check the git status. You should see the Lambda definition files and `terraform_output.json` files as added.
```bash
git status
```
Commit the changes.
```
git add .
git commit -m "Updated Lambda API Gateway function definition to trigger a deployment"
git push
```
## Gitmoxi commit dryrun
Before deploying the change, let us do a `dryrun` to check what all files have changed and why they are relevant for Gitmoxi with respect to ECS or Lambda deployments. The `dryrun` command tells the `latest_commit_hash`, the `previous_processed_commit_hash`, the files that have changed, and relevance of those changes for ECS service or Lambda functions.

```bash
gmctl commit dryrun -r $GITMOXI_DEMO_REPO -b main 
```
## Gitmoxi commit deploy

Now trigger the deployment.
```bash
gmctl commit deploy -r $GITMOXI_DEMO_REPO -b main 
```

A new Lambda deployment will be triggered, resulting in the creation of a new version of the function named LambdaFunction_APIGateway.

**What just happened**
* A GitOps workflow was triggered by the `gmctl commit deploy` command. GitMoxi observed the changes in the commit, automatically detecting the modified files, and then triggered a deployment specifically for the function whose files were updated.
* A new version for the specific Lambda function was created.
* The function was integrated with API Gateway, with API Gateway added as a trigger. To view this integration, navigate to the Lambda function in the AWS Console, go to the `Alias` tab, and check the `Triggers` section. Alternatively, you can also observe the integration through the new test route created in the API Gateway through our Terraform configuration.
* Permissions were added for API Gateway to trigger the Lambda function. These permissions are visible in the Lambda console under the Alias tab in the Permissions section.
* The API Gateway endpoint is now available, allowing you to test the integration and view its output. Run the following command to see the output of the integration:

```bash
cd $WORKING_DIR
curl "$(jq -r '.api_endpoint_with_route.value' lambda/core-infra/terraform/terraform_output.json)"
```
This command triggers the API Gateway endpoint and should return `Blue from Lambda!`, showcasing successful deployment and integration of the BlueFunction.zip.  
```
{"message": "Blue from Lambda!", ...
...
```
### Testing Blue/Green Deployment with Lambda and API Gateway

Let's update the Lambda definition to replace the blue function with the green function, triggering a new deployment with the updated function code.

```bash
cd $WORKING_DIR/lambda/lambda-api-gateway
cp sample/test_lambdadef.json.sample.green test_lambdadef.json
```
```bash
git status
```
```bash
git add .
git commit -m "Updated Lambda API Gateway function definition to trigger a B/G deployment" -a
git push
```
Trigger deployment of latest commit

```bash
gmctl commit deploy -r $GITMOXI_DEMO_REPO -b main 
```

Let's **repeat polling** the API Gateway endpoint. While the deployment is in progress and traffic shifting is underway, the endpoint will return a mix of `Blue from Lambda!` and `Green from Lambda!`. After the deployment is complete, the endpoint will only return `Green from Lambda!`.

```bash
cd $WORKING_DIR
curl "$(jq -r '.api_endpoint_with_route.value' lambda/core-infra/terraform/terraform_output.json)"
```
```
➜  gm-trial git:(main) cd $WORKING_DIR
curl "$(jq -r '.api_endpoint_with_route.value' lambda/core-infra/terraform/terraform_output.json)"

{"message": "Blue from Lambda!", ...
...                                                                                        

➜  gm-trial git:(main) cd $WORKING_DIR
curl "$(jq -r '.api_endpoint_with_route.value' lambda/core-infra/terraform/terraform_output.json)"

{"message": "Green from Lambda!", ...
...

➜  gm-trial git:(main) cd $WORKING_DIR
curl "$(jq -r '.api_endpoint_with_route.value' lambda/core-infra/terraform/terraform_output.json)"

{"message": "Green from Lambda!", ...
... 
```

### <u> 2. Testing Elastic Load Balancer integration </u>

We will repeat a similar process to trigger an initial deployment to test the integration and then another deployment to test the Blue/Green Deployment.

```bash
cd $WORKING_DIR/lambda/lambda-elb
cp sample/test_lambdadef.json.sample test_lambdadef.json
cp sample/test_lambdadepdef.json.sample test_lambdadepdef.json
cp sample/test_lambdaeventsourcedef.json.sample test_lambdaeventsourcedef.json
cp sample/test_lambdainput.json.sample test_lambdainput.json
cd $WORKING_DIR
git add .
git commit -m "Updated Lambda ELB function definition to trigger a deployment"
git push
```
Now trigger the deployment.

```bash
gmctl commit deploy -r $GITMOXI_DEMO_REPO -b main 
```

**What just happened**
* A new version for the ELB Lambda function was created.
* The function was integrated with ELB.
* Permissions were added for ELB to trigger the Lambda function.
* The ELB endpoint should enable us to test the integration. Run the following command to see the output of the integration:

```bash
cd $WORKING_DIR
curl -s "$(jq -r '.elb_endpoint.value' lambda/core-infra/terraform/terraform_output.json)" | jq -r '.message'
```
The command triggers the ELB endpoint and should return `Blue from Lambda!`
```
Blue from Lambda!
```

### Testing Blue/Green Deployment with Lambda and ELB

Similar as before, let's update the Lambda definition to replace the blue function with the green function, triggering a new deployment with the updated function code.

```bash
cd $WORKING_DIR/lambda/lambda-elb
cp sample/test_lambdadef.json.sample.green test_lambdadef.json
git add .
git commit -m "Updated Lambda ELB function definition to trigger a B/G deployment" -a
git push
```
Trigger deployment of latest commit

```bash
gmctl commit deploy -r $GITMOXI_DEMO_REPO -b main 
```

Let's repeat polling the API Gateway endpoint. While the deployment is in progress and traffic shifting is underway, the endpoint will return a mix of `Blue from Lambda!` and `Green from Lambda!`. After the deployment is complete, the endpoint will only return `Green from Lambda!`.

```bash
cd $WORKING_DIR
curl -s "$(jq -r '.elb_endpoint.value' lambda/core-infra/terraform/terraform_output.json)" | jq -r '.message'
```

### <u> 3. Testing SQS integration </u>

For SQS testing, we will showcase that our Lambda function can start processing events from an SQS queue. 

Once again, we will trigger a deployment to test the integration. Here we won't test blue/green deployment, though if you have a use-case - it is indeed possible with GitMoxi. 

```bash
cd $WORKING_DIR/lambda/lambda-sqs
cp sample/test_lambdadef.json.sample test_lambdadef.json
cp sample/test_lambdadepdef.json.sample test_lambdadepdef.json
cp sample/test_lambdaeventsourcedef.json.sample test_lambdaeventsourcedef.json
cp sample/test_lambdainput.json.sample test_lambdainput.json
cd $WORKING_DIR
git add .
git commit -m "Updated Lambda SQS function definition to trigger a deployment"
git push
```

Now trigger the deployment.

```bash
gmctl commit deploy -r $GITMOXI_DEMO_REPO -b main 
```

**What just happened**
* A new version for the SQS Lambda function was created.
* An Event Source Mapping was created for SQS. You can view the new mapping in the "Event Source Mapping" tab in the Lambda console.
* The initial event we pushed into the queue through terraform is processed by the Lambda function.

```bash
export LOG_GROUP="/aws/lambda/LambdaFunction_SQS"

export LATEST_STREAM=$(aws logs describe-log-streams --log-group-name "$LOG_GROUP" --order-by "LastEventTime" --descending --limit 1 --query "logStreams[0].logStreamName" --region us-east-1 --output text)

aws logs get-log-events --log-group-name "$LOG_GROUP" --log-stream-name "$LATEST_STREAM" --start-from-head --limit 10  --region us-east-1
```

You should see the CloudWatch output events where one of them displays `Hello from SQS!`. This message corresponds to the initial event we pushed into the SQS queue via Terraform. It confirms that the integration is successful and that our Lambda function is processing events from the queue as expected.
```
{
    "events": [
        ...
        {
            "timestamp": 1742005052241,
            "message": "Received message: Hello from SQS!\n",
            "ingestionTime": 1742005053912
        },
        ...
}
```

## Cleanup

Let's now delete all the AWS resources you created to perform the Lambda testing.

```bash
aws lambda delete-function --function-name LambdaFunction_APIGateway --region us-east-1
aws lambda delete-function --function-name LambdaFunction_ELB --region us-east-1
aws lambda delete-function --function-name LambdaFunction_SQS --region us-east-1
cd $WORKING_DIR/lambda/core-infra/terraform 
terraform destroy --auto-approve
```





