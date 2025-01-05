---
title: "Getting Started with Gitmoxi for Lambda"
navtitle: "Getting Started Lambda"
layout: ../../layouts/MdLayout.astro
---

# Testing Gitmoxi for Lambda Deployments

This guide helps you test the deployment of AWS Lambda functions with GitMoxi. It sets up the necessary infrastructure to create and deploy Lambda functions while also testing their end-to-end integration with API Gateway, Elastic Load Balancer (ELB), and Amazon SQS. Additionally, we will test blue-green deployments with Lambda and incremental traffic shifting.

## Creating the infrastructure required for testing

- IAM: Execution role and policies for Lambda, and a Custom policy for SQS access.
- S3: Bucket for Lambda code, and uploaded the test Lambda function zip files (blue, green, sqs).
- API Gateway: HTTP API with default stage and a test route. Required for testing API Gateway integration. 
- VPC: Default or custom VPC and subnets. Required for testing load balancer integration.
- Load Balancer: Application Load Balancer (ALB). Required for testing load balancer integration.
- Security group, target group, listener. Required for testing load balancer integration.
- SQS: Queue and pushes a test message to the queue. Required for testing SQS integration. 

```bash
cd lambda/core-infra
terraform init
terraform plan
terraform apply --auto-approve
terraform output --json > terraform_output.json
```

## Creating the three lambda functions and testing the integrations

We will simulate a GitOps flow. We will append a new line at the end of individual lambda definitions to register a change to the file. Then we will commit these changes. GitMoxi will poll for these changes and deploy a new version of the Lambda function.

### <u> 1. Testing API Gateway integration </u>

```bash
cd ../..
echo "" >> lambda/lambda-api-gateway/test_lambdadef.json
git add .
git commit -m "Updated Lambda API Gateway Def to trigger a deployment"
git push
```

After pushing the changes, a new Lambda deployment will be triggered, resulting in the creation of a new version of the function named LambdaFunction_APIGateway.

**What just happened**
- A GitOps workflow was triggered by the push. GitMoxi observed the changes in the commit, automatically detecting the modified files, and then triggered a deployment specifically for the fucntion whose files were updated.
- A new version for the specific Lambda function was created.
- The function was integrated with API Gateway, with API Gateway added as a trigger. To view this integration, navigate to the Lambda function in the AWS Console, go to the Alias tab, and check the Triggers section. Alternatively, you can also observe the integration through the new test route created in the API Gateway through our Terraform configuration.
- Permissions were added for API Gateway to trigger the Lambda function. These permissions are visible in the Lambda console under the Alias tab in the Permissions section.
- The API Gateway endpoint is now available, allowing you to test the integration and view its output. Run the following command to see the output of the integration:

 ```bash
 curl "$(jq -r '.api_endpoint_with_route.value' lambda/core-infra/terraform_output.json)"
 ```

- This command triggers the API Gateway endpoint and should return `Blue from Lambda!`, showcasing successful deployment and integration of the BlueFunction.zip.  

**Testing Blue/Green Deployment with Lambda and API Gateway**

Let's update the Lambda definition to replace the blue function with the green function, triggering a new deployment with the updated function code.

```bash
sed -i 's|"S3Key": "{{ s3_object_blue_key }}"|"S3Key": "{{ s3_object_green_key }}"|' lambda/lambda-api-gateway/test_lambdadef.json
git add .
git commit -m "Updated Lambda API Gateway Def to trigger a B/G deployment"
git push
```

Let's repeat polling the API Gateway endpoint. While the deployment is in progress and traffic shifting is underway, the endpoint will return a mix of `Blue from Lambda!` and `Green from Lambda!`. After the deployment is complete, the endpoint will only return `Green from Lambda!`.

```bash
curl "$(jq -r '.api_endpoint_with_route.value' lambda/core-infra/terraform_output.json)"
```

### <u> 2. Testing Elastic Load Balancer integration </u>

We will repeat a similar process to trigger an initial deployment to test the integration and then another deployment to test the Blue/Green Deployment.

```bash
echo "" >> lambda/lambda-elb/test_lambdadef.json
git add .
git commit -m "Updated Lambda ELB Def to trigger a deployment"
git push
```

**What just happened**
- A new version for the ELB Lambda function was created.
- The function was integrated with ELB.
- Permissions were added for ELB to trigger the Lambda function.
- The ELB endpoint should enable us to test the integration. Run the following command to see the output of the integration:

```bash
curl -s "$(jq -r '.elb_endpoint.value' lambda/core-infra/terraform_output.json)" | jq -r '.message'
```
- The commend triggers the ELB endpoint and should return `Blue from Lambda!`

**Testing Blue/Green Deployment with Lambda and ELB**

Similar as before, let's update the Lambda definition to replace the blue function with the green function, triggering a new deployment with the updated function code.

```bash
sed -i 's|"S3Key": "{{ s3_object_blue_key }}"|"S3Key": "{{ s3_object_green_key }}"|' lambda/lambda-elb/test_lambdadef.json
git add .
git commit -m "Updated Lambda ELB Def to trigger a B/G deployment"
git push
```

Let's repeat polling the API Gateway endpoint. While the deployment is in progress and traffic shifting is underway, the endpoint will return a mix of `Blue from Lambda!` and `Green from Lambda!`. After the deployment is complete, the endpoint will only return `Green from Lambda!`.

```bash
curl -s "$(jq -r '.elb_endpoint.value' lambda/core-infra/terraform_output.json)" | jq -r '.message'
```

### <u> 3. Testing SQS integration </u>

For SQS testing, we will showcase that our Lambda fucntion can start processing events from an SQS queue. 

Once again, we will trigger a deployment to test the integration. Here we won't test blue/green deployment, though if you have a use-case - it is indeed possible with GitMoxi. 

```bash
echo "" >> lambda/lambda-sqs/test_lambdadef.json
git add .
git commit -m "Updated Lambda SQS Def to trigger a deployment"
git push
```

**What just happened**
- A new version for the SQS Lambda function was created.
- An Event Source Mapping was created for SQS. You can view the new mapping in the "Event Source Mapping" tab in the Lambda console.
- The initial event we pushed into the queue through terraform is processed by the Lambda function.

```bash
export LOG_GROUP="/aws/lambda/LambdaFunction_SQS"
export LATEST_STREAM=$(aws logs describe-log-streams --log-group-name "$LOG_GROUP" --order-by "LastEventTime" --descending --limit 1 --query "logStreams[0].logStreamName" --output text)
aws logs get-log-events --log-group-name "$LOG_GROUP" --log-stream-name "$LATEST_STREAM" --limit 10 | jq -r '.events[].message | capture("body\": \"(?<body>.*?)\"").body'
```

- This should print `Hello from SQS!` to the console, which is the text of the initial event we pushed into the SQS queue from our terraform. This showcases that the integration was successful and our Lambda function is processing the events from the queue. 