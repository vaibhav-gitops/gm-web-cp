---
title: "Deployment Input"
navtitle: "Deployment Input"
layout: ../../layouts/MdLayout.astro
---

# Deployment Input Files

Gitmoxi enables seamless collaboration between application and infrastructure teams by combining their inputs into deployment artifacts. This allows you to substitute values from both teams directly into your deployment files.

## Overview

Input files (ending in `_input.json` for ECS or `_lambdainput.json` for Lambda) provide substitution values for other deployment files. For example, in the [nginx_taskdef.json](https://github.com/gitmoxi/gm-demo/ecs/rolling-update/nginx_taskdef.json) file, parameters like `image`, `awslogs-group`, and `awslogs-region` are templated:

```json
"containerDefinitions": [
    {
        "name": "nginx-container",
        "image": "{{nginx_container_image}}", 
        // ...
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

The corresponding [nginx_input.json](https://github.com/gitmoxi/gm-demo/ecs/rolling-update/nginx_input.json) provides values for these variables. Some values come directly from the input file itself (like `nginx_container_image`), while others (like `region` and `cloudwatch_log_group_name`) are sourced from the referenced `terraform_output.json` file:

```json
{
  "ref": {
    "file": ["ecs/core-infra/terraform/terraform_output.json"],
    "type": "TERRAFORM"
  },
  "nginx_container_image": "public.ecr.aws/nginx/nginx:latest"
}
```

## Input File Structure

Input files consist of two main components:

### 1. Reference Section (`ref`)

The reference section specifies external files from which Gitmoxi should gather substitution values. These are typically JSON outputs from infrastructure-as-code tools like Terraform or CDK.

**Properties:**

- **`file`** (list of strings) [default: []]: External files for gathering substitution values. These files **must be in the same repository and branch** as your service definition files. Specify the full path excluding the repository URL.
  
- **`type`** (string) [TERRAFORM|CDK|JSON]: The type of reference files:
  - `TERRAFORM`: Terraform output in JSON format
  - `CDK`: CDK output in JSON format
  - `JSON`: Plain JSON files

**Example configuration:**

```json
"ref": {
  "file": ["ecs/core-infra/terraform/terraform_output.json"],
  "type": "TERRAFORM"
}
```

### 2. Simple Key-Value Pairs

The input file can contain direct key-value pairs for substitution.

## Complete Example

Here's a complete example of an input file:

```json
{
  "ref": {
    "file": ["ecs/core-infra/terraform/terraform_output.json"],
    "type": "TERRAFORM"
  },
  "nginx_container_image": "public.ecr.aws/nginx/nginx:latest",
  "nginx_container_port": 80
}
```

## Parameter Substitution with Jinja

Gitmoxi uses the Jinja templating engine to substitute values from input files. Here are common patterns for different data types:

### Simple String or Integer Values

```json
{
  "containerDefinitions": [
    {
      "image": "{{ nginx_container_image }}",
      "portMappings": [
        {
          "containerPort": {{ container_port }}
        }
      ]
    }
  ]
}
```

Note that strings are enclosed in quotes (`"{{ variable }}"`), while integers are not (`{{ variable }}`).

### List of String Values

For lists, use the `tojson` filter to ensure proper serialization:

```json
"networkConfiguration": {
  "awsvpcConfiguration": {
    "subnets": {{ private_subnets | tojson }},
    "assignPublicIp": "DISABLED",
    "securityGroups": {{ allow_web_security_group_ids | tojson }}
  }
}
```

### Dictionary Values

Access specific values in dictionaries using bracket notation:

```json
"loadBalancers": [
  {
    "targetGroupArn": "{{ target_group_arns['blue-tg'] }}",
    "containerPort": 80,
    "containerName": "nginx-container"
  }
]
```

Example of a dictionary output from Terraform:

```json
"target_group_arns": {
  "value": {
    "blue-tg": "arn:aws:xxx:targetgroup/blue-tg/5678",
    "green-tg": "arn:aws:xxx:targetgroup/green-tg/1234"
  }
}
```

## Key Benefits

- **Team Collaboration**: Combine input from application and infrastructure teams
- **Infrastructure Integration**: Easily reference outputs from Terraform and CDK
- **Flexible Templating**: Support for various data types through Jinja
- **Simplified Workflow**: Automatic parsing of infrastructure output files

Remember that all attributes requiring substitution must use the correct Jinja parameter syntax, and you can leverage AI assistants like ChatGPT, GitHub Copilot, or Claude to help generate these templates.
