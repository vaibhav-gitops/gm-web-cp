---
title: "Deployment Input"
navtitle: "Deployment Input"
layout: ../../layouts/MdLayout.astro
---

# Input files
Deployment artifacts have values that come both from application teams and infrastructure teams. For example, application teams might determine aspects such as container images, container ports, vCPU, memory; whereas, infrastructure teams might determine aspects such as subnets, security groups, load balancer provisioning, IAM roles. Gitmoxi enables you to combine the input from both these teams and seamlessly substitute the values in the deployment artifact files.

The files ending in `_input.json` (for ECS) and `_lambdainput.json` (for Lambda) are used to provide substitution values in other files. For example, if you did the [Testing ECS](./getting_started_ecs.md) section you can see that in the [nginx_taskdef.json](https://github.com/gitmoxi/gm-demo/ecs/rolling-update/nginx_taskdef.json), the `image`, `awslogs-group`, and `awslogs-region` are all parameterized. 
```json
  "containerDefinitions": [
          {
              "name": "nginx-container",
              "image": "{{nginx_container_image}}", 
              ...
              ...
              "logConfiguration": {
                  "logDriver": "awslogs",
                  "options": {
                      "awslogs-group": "{{cloudwatch_log_group_name}}", 
                      "awslogs-region": "{{region}}", 
                      "awslogs-stream-prefix": "ecs"
                  }
              }
          }
      ]
  ```
The [nginx_input.json](https://github.com/gitmoxi/gm-demo/ecs/rolling-update/nginx_taskdef.json) provides values for these variables. The `nginx_container_image` key-value is present in the input file itself. Whereas, the values for `awslogs-region` and `awslogs-group` come from the `terraform_output.json` file provided in the `ref` attribute.
```json
  {
    "ref" : {
        "file" : ["ecs/core-infra/terraform/terraform_output.json"],
        "type" : "TERRAFORM"
    },
    "nginx_container_image": "public.ecr.aws/nginx/nginx:latest"
  }
```

## Structure of the input file
The input files consists of a `ref` (reference) section and simple key-value pairs.  
### ref
The reference section allows you to specify external files which Gitmoxi should read to gather the substitution values. Usually, the external files will be JSON format output of infra-as-code tools such as Terraform or CDK. For example, `terraform output --json > terraform_output.json` and `cdk deploy -O cdk_output.json` will both generate JSON-formatted output values. By referencing these output files you can let Gitmoxi substitute infrastructure values such as subnets, security groups, target groups, IAM roles into the ECS or Lambda object definitions. Best part, Gitmoxi knows how to read the JSON outputs of Terraform and CDK; all you need to do is reference them in input files!

-- **file (list of strings) [default: []]:** specifies the list of external files to use for gathering substitution values. These files **must be in the same repository and branch** as the associated service object definition files. The path you specify is the full path excluding the repository url part. For example, to reference `https://github.com/<username>/prod/terraform/terraform_output.json` you will just add `prod/terraform/terraform_output.json`.

-- **type (string) [TERRAFORM|CDK|JSON]:** The type of the reference files. They can be of type:
* `TERRAFORM` implying the files are Terraform output in JSON format
* `CDK` implying the files are CDK output in JSON format
* `JSON` implying they are plain JSON files 

-- **Example configuration**
```json
  "ref": {
      "file" : ["ecs/core-infra/terraform/terraform_output_file.json"],
      "type" : "TERRAFORM"
  }
```

### Simple key-value pairs
The input file can also contain simple key-value pairs to be used for substitution.

## Full example
Following is a full example of an input file.
```json
{
    "ref" : {
        "file" : ["ecs/core-infra/terraform/terraform_output.json"],
        "type" : "TERRAFORM"
    },
    "nginx_container_image": "public.ecr.aws/nginx/nginx:latest",
    "nginx_container_port": 80
}
```

## Jinja for parameter substitution
Gitmoxi uses Jinja library to substitute values from input files into all the other files. The attributes that need substituted values should have parameter specified in correct Jinja syntax. Below we provide examples that capture the syntax of common needs in the ECS and Lambda deployment artifacts. Also you can use any GenAI powered services (ChatGPT, GitHub Copilot, Claude) to generate Jinja parameterization! 

-- **Simple string or integer values**
Below is a snippet from container definition which are a part of ECS task definition (`_taskdef.json`) file. The `image` string value is parameterized using the syntax `"{{ nginx_container_image }}"`. The `containerPort` integer value is parameterized using the syntax `{{ container_port }}` (without the quotes).
```json
{
  "containerDefinitions": [
    {
      "image": "{{ nginx_container_image }}",
      "portMappings": [
        {
          "containerPort": {{ container_port }}
        }]
    }]
}
```
-- **List of string values**
Another common attribute value is a list of strings. Below is an example from ECS service definition where `subnets` and `securityGroups` are list of string values. The substitution variables `private_subnets` and `allow_web_security_group_ids` are list of strings, usually coming from a Terraform or CDK JSON output file. The Jinja syntax `{{ <list of string variable name> | tojson }}` ensures correct serialization of the list value. For example, if `"private_subnets" : ["subnet_123", "subnet_456"]`. Then Jinja template rendering will assign `"subnets" : ["subnet_123", "subnet_456"]`.

```json
  "networkConfiguration": {
      "awsvpcConfiguration": {
        "subnets": {{ private_subnets | tojson }},
        "assignPublicIp": "DISABLED",
        "securityGroups": {{ allow_web_security_group_ids | tojson }}
      }
    }
```

-- **Value in a dictionary**
Sometimes multiple values are created in a Terrform or CDK module. For example, for blue/green deployments you will create two target groups and associate them to a listener rule. Now in the service definition you want to refer to just one of the target groups, say `blue-tg`. One easy option is to ouput dictionary value from infra-as-code and reference the specific value by name. In below snippet from ECS service definition, `loadBalancers` attribute requires a `targetGroupArn`. We can directly reference the `blue-tg` from the dictionary variable `target_group_arns` and use that value for substitution.

```json
"loadBalancers": [
    {
      "targetGroupArn": "{{ target_group_arns['blue-tg'] }}",
      "containerPort": 80,
      "containerName": "nginx-container"
    }
  ],
```
The `target_groups_arns` is a dictionary output from Terraform which looks like below. Gitmoxi already knows how to parse Terraform JSON output, so you just need to specify the right dictionary value for the service target group ARN.
```json
  "target_group_arns": {
      ...
      "value": {
        "blue-tg": "arn:aws:xxx:targetgroup/blue-tg/5678",
        "green-tg": "arn:aws:xxx:targetgroup/green-tg/1234"
      }
  }
```
# Summary
* Gitmoxi enables you to specify input files which are used to substitute values in other deployment artifact files.
* In the input files you can reference external files and Gitmoxi will gather the input values from those files.
* The external files should be in same repository and branch
* In addition to simple JSON files, Gitmoxi is able to parse Terraform and CDK JSON output files to gather input values.
* Gitmoxi uses Jinja templating to perform the substitutions.
* All the attributes that need substituted values should be specified with correct Jinja parameter syntax.