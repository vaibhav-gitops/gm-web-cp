---
title: "Configuration"
navtitle: "Configuration"
layout: ../../layouts/MdLayout.astro
---

# GitMoxi Configuration

### Deployment Configuration Files
GitMoxi relies on structured configuration files to manage deployments effectively. These files define deployment strategies, traffic shifting rules, rollback policies, and environment-specific parameters. The files are organized into a clear folder structure, ensuring consistency and scalability.

1. **Deployment Definition File**: Define stability checks, rollback policies, and traffic shifting rules.
2. **Input File**: Provide environment-specific parameters that will be used in the other deployment files such as IAM roles, container images, and API IDs.
3. **Service and Task Definitions**: Standard ECS service and task definitions, including networking and logging configurations.
4. **Lambda Definition**: Specify function-specific settings, such as memory, timeout, and runtime.
5. **Lambda Event Source Definition**: Connect Lambda functions to specific data sources like API Gateway, SQS, Kinesis streams etc., enabling automated event-driven workflows.

### Folder Structure
The following is the recommended folder structure for managing ECS and Lambda configurations:

**ECS:**
- `project-name/ecs/service-name/name_depdef.json` - Deployment definition file for ECS services.
- `project-name/ecs/service-name/name_input.json` - Input file containing environment variables and references.
- `project-name/ecs/service-name/name_svcdef.json` - Standard ECS service definition. Input to ECS CreateService API call.
- `project-name/ecs/service-name/name_taskdef.json` - Standard ECS Task definition file. Input to ECS RegisterTaskDefinition API call.

<br/>

**Lambda:**
- `project-name/lambda/function-name/name_lambdadef.json` - Standard lambda function definition. Input to Lambda CreateFunction API call.
- `project-name/lambda/function-name/name_lambdadepdef.json` - Deployment definition file for Lambda.
- `project-name/lambda/function-name/name_lambdainput.json` - Input file containing configuration variables for Lambda.
- `project-name/lambda/function-name/name_lambdaeventsourcedef.json` - Event source mapping file for Lambda triggers.