---
title: "Gitmoxi for ECS"
navtitle: "Gitmoxi for ECS"
layout: ../../layouts/MdLayout.astro
---

# Gitmoxi for Amazon ECS
Gitmoxi provides GitOps based complete life-cycle management for Amazon ECS services. When the ECS deployment files are created, changed, or deleted in Git repository, Gitmoxi seamlessly orchestrates those changes in the ECS clusters. Based on your application needs, Gitmoxi can perform rolling update or blue-green update with variety of traffic shifting patterns. 

For ECS GitOps workflow, there are four files that Gitmoxi uses - service definition (`_svcdef.json`), task definition (`_taskdef.json`), deployment configuration definition (`_depdef.json`), and input file (`_input.json`). Let us understand these files in more detail as their content and their changes drives the Gitmoxi ECS GitOps workflow.

## Service definition file
The ECS service definition JSON file (`_svcdef.json`) can contain all the attributes defined by the [ECS Create Service Request](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_CreateService.html#API_CreateService_RequestSyntax). This is the native ECS service definition. So when the ECS service team adds more features or changes you can instantly adopt those! 

One of the key attributes to note in the service definition file is `deploymentController`. When the value of this attribute is set to `ECS`, then Gitmoxi will leverage the rolling deployment feature provided natively by the ECS service. When the value is set to `EXTERNAL`, then Gitmoxi performs its own deployment using the blue/green deployment paradigm. So if you want to use blue/green and traffic shifting then set the parameter to `EXTERNAL` in the `_svcdef.json` file.

-- **Example configuration**
```json
    "deploymentController": {
        "type": "EXTERNAL"
    }
```

## Task definition file
The ECS task definition JSON file (`_taskdef.json`) can contain all the attributes defined by the [ECS Task Definition Registration Request](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_RegisterTaskDefinition.html#API_RegisterTaskDefinition_RequestSyntax). 

Whenever an ECS service needs to be created or updated, Gitmoxi will use the task definition file to register a new task definition, obtain the ARN for new revision, and use that ARN in the service creation or update. If task definition file is not present then Gitmoxi uses the task definition attribute (`"taskDefinition"`) from the service definition file. If neither the task definition file nor the attribute are provided then the service creation will fail. 

## Deployment definition file
The ECS deployment definition JSON file (`_depdef.json`) contains various settings such as traffic shifting, circuit breaking, stability checks which are used by Gitmoxi during ECS service deployment. These settings are described in more details in [the next section](./ecs_deployment_definition).

## Input file
The ECS deployment input JSON file (`_input.json`) provides substitution values when you want to parameterize the attributes in service, task, or deployment definition files. These files are explained in the [input files section](./input_files).

Let us understand how the changes to these files influence associated ECS service objects.
## Gitmoxi GitOps for ECS

Whenever **any** of the service definition, task definition, and/or input file are changed, Gitmoxi triggers a new deployment which can create or update associated ECS service. This is because service and task definition changes naturally indicate changes, and the changes to input file indicates some parameter value has changed. If only the deployment definition (`_depdef.json`) file has changed then Gitmoxi will not trigger a new deployment because this file only contains deployment settings.

Based on the service definition file, Gitmoxi checks if an active service exists in the specified cluster and region. If service doesn't exist, Gitmoxi will create the service based on service definition. And if service exists, then Gitmoxi will update the service. 

Gitmoxi will register the task definition, using the task definition file, obtain the ARN of the task definition revision, and use that ARN for ECS service creation or update. Irrespective of whether the task definition file has changed or not, Gitmoxi always registers the task definition and uses that revision. 

Gitmoxi deletes an active ECS service **only** when the associated service definition file is deleted.

## Gitmoxi ECS deployment strategies

* **Rolling update:** In an ECS service rolling update, new task versions are *gradually* created while the old versions are deleted. How many new versions are created and how many old versions are deleted is dependent on `minimumHealthyPercent` and `maximumPercent` attribute from ECS service defintion `deploymentConfiguration` section. Let us take an example of service with desired count of 10, that is 10 replica tasks are running. If `minimumHealthyPercent` is set to 100 then none of the old tasks can be deleted unless new tasks are created. But if it is set to say 50, then 5 old tasks can be deleted even before any new tasks are created. If the `maximumPercent` is set to 100 then at any given time the number of running tasks (old + new)can't go above 10. If the `maximumPrecent` is set to 200 then total running tasks can go upto 20 (200% of 10), that is all 10 new tasks can be created even before any old tasks have been deleted. In production, for example, if you don't want to risk availability, then you may keep `minimumHealthyPercent` to 100 and `maximumPercent` to 150. This will create 5 new tasks but won't delete any old ones until new tasks are ready. Then it will delete 5 old tasks and create the remaining 5 new tasks.

The rolling update is simple to orchestrate and it can be cost effective especially if the desired count is very high (For e.g. 50+ tasks). The maximum number of tasks at any given time is controlled by the `maximumPercent` and you can keep it within 110-150% without compromising availability from deletion of old tasks. 

The rolling update is not suitable if old and new tasks can't be mixed to serve the same traffic. For e.g. if your old tasks are serving traffic on `/api/v1` and if new tasks only serve traffic on `/api/v2` then you can't mix these revisions. In rolling update both the old and new tasks co-exist during the time of deployment and either of them can get the request. Rolling update is also unsuitable if you want to have more control on the traffic shifting between the old and the new. For example, in a gaming service, you may have live sessions on old tasks and want to wait before terminating them. Lastly, rolling update is also not easy for rollbacks, since the old and new tasks are all mixed. Any rollback (or rollforward) starts the same gradual process of creating new and deleting old which may not be appropriate for *quickly* reverting adverse changes. 

* **Blue/green update:** For an ECS blue/green deployment, Gitmoxi will:
    * Create a new set of tasks based on latest changes
    * Wait for the all the new tasks to achieve running status
    * If service uses a load balancer and traffic shifting is configured, then Gitmoxi will perform traffic shifting from old to new tasks.
    * If the traffic shifting is successful then old tasks will be deleted
    * If at any point there is failure such as new tasks not getting to running status or traffic shifting resulting in CloudWatch alarms, then traffic is restored to old tasks and new tasks are deleted. 

The blue/green update makes it much easier to do rollbacks and allows you granulat control in shifting traffic from old to new. It can drastically minimize the downtime risks from bad deployments as you can quickly revert entire traffic to old stable version. 

The main drawback of blue/green is that it requires the service to be behind an Application Load Balancer. Without any ALB, there aren't any good mechanisms to split the traffic and test new deployment. Another drawback is the additional cost not only from ALB but also from 2x the number of tasks that are running during the traffic testing time period. 

* **Blue/green traffic shifting patterns:** For blue/green deployment, Gitmoxi supports following traffic shift patterns:
    * CANARY: Shifts traffic in two phases. E.g. First shift 20%, wait for a configured time interval and if no alarm triggers then shift the remaining 80%.
    * LINEAR: Shifts traffic in equal increments over multiple intervals. E.g. a LINEAR shift of 20% will result in 20%, 40%, 60%, 80%, and 100% traffic shift pattern. Gitmoxi will wait for the configured time interval after each percent shift and only increase the percent if there are no alarm triggers. 
    * ALL_AT_ONCE: Shifts 100% of traffic to the new tasks and if there is any alarm triggers during the wait time then rever traffic to old tasks. 

## Gitmoxi deployment stability checks and circuit breaker
For every deployment, Gitmoxi checks that the desired number of tasks get to running state. Gitmoxi stability check configuration allows you to specify a timeout and polling interval to call the ECS APIs and check for task status. If all tasks don't become stable within the specified timeout then the deployment is considered failed. You can specify either an absolute timeout or specify it based on desired number of tasks. If a service task takes longer to startup or if there are too many replica counts, then it might be better to provide the timeout in terms of desired count. For example, if your service has desired count of 10, you can either specify absolute time, say 600 seconds as the timeout, or specify 120 seconds per task for the timeout setting which will make the absolute time 1200 seconds (120 x 10). If both absolute and per task values are specified then Gitmoxi will take the max of the two values and do the stability check in that time window.

Gitmoxi also has a deployment circuit breaker which will stop and rollback the deployment if number of new task failures exceeds a configured threshold. For this as well, you can either provide an absolute threshold or specify it as a percent of the desired count. For example, if your service has desired count of 10, then you can specify 5 as absolute failure threshold. Or, you can specify 30% task failures, which will set the threshold as 3 failures (30% * 10). If both values are provided Gitmoxi takes the minimum of the two values as the threshold.

All the deployment configurations such as traffic shifting, stability checks, deployment circuit breaker are specified in the ECS deployment definition (`_depdef.json`) file, which is described in more details in [the respective section](./ecs_deployment_definition).