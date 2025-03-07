---
title: "Gitmoxi for Lambda"
navtitle: "Gitmoxi for Lambda"
layout: ../../layouts/MdLayout.astro
---

# Gitmoxi for AWS Lambda
Gitmoxi provides GitOps based complete life-cycle management for AWS Lambda functions. When the Lambda deployment files are created, changed, or deleted in Git repository, Gitmoxi seamlessly orchestrates those changes for the Lambda functions. Gitmoxi supports both push-based (e.g. API-GW, ALB) and pull-based (e.g. SQS, Kafka) Lambda functions enabling you to build and deploy wide range of API and event-driven applications in a completely serverless archtiecture. For Lambda functions deployment, Gitmoxi orchestrates blue/green deployment where invocations can be shifted from old to new using canary, linear, or all_at_once paradigms. Gitmoxi manages the versions and invocation weight shifting automatically providing a seamless deployment workflow that can easily scale as your number of Lambda functions grow. 

For Lambda GitOps workflow, there are four files that Gitmoxi uses - function definition (`_lambdadef.json`), event source definition (`_lambdaeventsourcedef.json`), deployment configuration definition (`_lambdadepdef.json`), and input file (`_lambdainput.json`). Let us understand these files in more detail as their content and their changes drives the Gitmoxi Lambda GitOps workflow.

## Function definition file
The Lambda function definition JSON file (`_lambdadef.json`) can contain all the attributes defined by the [Lambda Create Function Request](https://docs.aws.amazon.com/lambda/latest/api/API_CreateFunction.html#API_CreateFunction_RequestSyntax). This is the native Lambda function definition. So when the Lambda service team adds more features or changes you can instantly adopt those! 

## Event source definition file
Lambda functions are invoked either by a push-based source such as API-GW, ALB; or pull-based sources (or pollers) such as SQS, Amazon Managed Service for Kafka (MSK). The [event source mapping section](./lambda_event_source_mapping) describes how to define these invocation sources.

## Deployment definition file
The Lambda deployment definition JSON file (`_depdef.json`) contains various settings such as traffic shifting, stability checks which are used by Gitmoxi during Lambda service deployment. These settings are described in more details in [the next section](./lambda_deployment_definition).

## Input file
The Lambda deployment input JSON file (`_input.json`) provides substitution values when you want to parameterize the attributes in function, event source, or deployment definition files. These files are explained in the [input files section](./input_files).

Let us understand how the changes to these files influence associated ECS service objects.
## Gitmoxi GitOps for Lambda

Whenever **any** of the function definition, event source definition, and/or input file are changed, Gitmoxi triggers a new deployment which create new versions of associated Lambda functions. This is because function and event source definition changes naturally indicate changes, and the changes to input file indicates some parameter value has changed. If only the Lambda deployment definition (`_lambdadepdef.json`) file has changed then Gitmoxi will not trigger a new deployment because this file only contains deployment settings.

Based on the function definition file, Gitmoxi checks if an active function exists in the specified region. If function doesn't exist, Gitmoxi will create the function based on definition. And if function exists, then Gitmoxi will create a new version of the function. Gitmoxi will register the new function or new version of function to the `alias` provided in the deployment definition file. This alias is then used for traffic shifting (or invocation weight shifting) between the old and new versions.

Gitmoxi deletes an active Lambda function **only** when the associated function definition file is deleted.

## Gitmoxi Lambda deployment strategies

* **Blue/green update:** For a Lambda blue/green deployment, Gitmoxi will:
    * Create a new version of Lambd function based on latest definition file
    * Wait for the function to become active
    * Based on the traffic shifting configuration in deployment definition file, Gitmoxi will gradually shift the invocation from old to new functions 
    * If the shifting is successful then it will delete the old function version
    * If at any point there is failure such as new version doesn't become active or traffic shifting resulting in CloudWatch alarms, then traffic is restored to old version and new version is deleted. 

* **Blue/green traffic shifting patterns:** For blue/green deployment, Gitmoxi supports following traffic shift patterns:
    * CANARY: Shifts traffic in two phases. E.g. First shift 20%, wait for a configured time interval and if no alarm triggers then shift the remaining 80%.
    * LINEAR: Shifts traffic in equal increments over multiple intervals. E.g. a LINEAR shift of 20% will result in 20%, 40%, 60%, 80%, and 100% traffic shift pattern. Gitmoxi will wait for the configured time interval after each percent shift and only increase the percent if there are no alarm triggers. 
    * ALL_AT_ONCE: Shifts 100% of traffic to the new tasks and if there is any alarm triggers during the wait time then rever traffic to old tasks. 

## Gitmoxi deployment stability checks and circuit breaker
For every deployment, Gitmoxi checks that the desired number of tasks get to running state. Gitmoxi stability check configuration allows you to specify a timeout and polling interval to call the ECS APIs and check for task status. If all tasks don't become stable within the specified timeout then the deployment is considered failed. You can specify either an absolute timeout or specify it based on desired number of tasks. If a service task takes longer to startup or if there are too many replica counts, then it might be better to provide the timeout in terms of desired count. For example, if your service has desired count of 10, you can either specify absolute time, say 600 seconds as the timeout, or specify 120 seconds per task for the timeout setting which will make the absolute time 1200 seconds (120 x 10). If both absolute and per task values are specified then Gitmoxi will take the max of the two values and do the stability check in that time window.

Gitmoxi also has a deployment circuit breaker which will stop and rollback the deployment if number of new task failures exceeds a configured threshold. For this as well, you can either provide an absolute threshold or specify it as a percent of the desired count. For example, if your service has desired count of 10, then you can specify 5 as absolute failure threshold. Or, you can specify 30% task failures, which will set the threshold as 3 failures (30% * 10). If both values are provided Gitmoxi takes the minimum of the two values as the threshold.

All the deployment configurations such as traffic shifting, stability checks, deployment circuit breaker are specified in the ECS deployment definition (`_depdef.json`) file, which is described in more details in [the respective section](./ecs_deployment_definition).