---
title: "Deployment Input"
navtitle: "Deployment Input"
layout: ../../layouts/MdLayout.astro
---

# Input File for Deployment Configuration

The Input file contains configuration values that are injected into the other configuration files to help maintain a standardized single source of truth for specific configurations and also to inject values (such as ARNs) that are output from your IaC into the deployment with minimal overhead. The input file is processed to replace placeholders in other configuration files with the provided values.

## Key Concepts
- **Input File:** The Input file that contains key-value pairs, where keys are placeholders in your other deployment files and values are the data used to replace those placeholders.

- **Referenced File:** GitMoxi enables you to refercence external file containing additional configuration. This is typically the output from your IaC execution. All the output fields automatically become a part of the Input file as key-value pairs, which can then be used in other configuration files.

## How to Use the Input File

### 1. Structure of the Input File

```json
{
    "ref" : {
        "file" : ["terraform_output_file.json"],
        "type" : "TERRAFORM"
    },
    "nginx_container_image": "public.ecr.aws/docker/library/httpd:alpine3.20",
    "nginx_container_port": 80
}
```

-- **ref:** A reference to an external file containing additional configuration that is an output from your IaC execution. GitMoxi will load and integrate the contents of the referenced file into the final configuration. This allows you to modularize your configuration and keep different pieces of your infrastructure separate.

-- **type:** The type field in the input file specifies the type of configuration being referenced, with "TERRAFORM" indicating that the referenced file contains Terraform output data. Supported values are JSON, CDK, and TERRAFORM. 

GitMoxi understands how TERRAFORM and CDK generates its output and will automatically convert it into the necessary configuration values. For JSON, the referenced file will be directly used to replace placeholders.

-- **Other Configuration Values:** The configuration values that you want to directly provide GitMoxi for the deployment. These must be key-value pairs. 

### 2. Use of Placeholders

To use the input file, simply use the keys in the other deployment configuration files. GitMoxi will read the input file, extract the necessary values, and use them to replace the placeholders.

For example, you may have your ECS task definition like this:
```json
{
  "containerDefinitions": [
    {
      "image": "{{ nginx_container_image }}",
      "portMappings": [
        {
          "containerPort": "{{ container_port }}",
        }]
    }]
}
```
When the input file is processed, the system will replace `{{ nginx_container_image }}` and `{{ container_port }}` with the corresponding values from the input file.

### 3. Processing the Input File
GitMoxi takes the input file and processes it to inject the values into the deployment template. The following steps occur:

- **Loading the Template:** The system loads the deployment template, which contains placeholders (e.g., {{ nginx_container_image }}).

- **Injecting the Input Values:** The placeholders in the template are replaced with the corresponding values from the input file (e.g., public.ecr.aws/nginx/nginx:latest for nginx_container_image).

- **Output Generation:** After processing, a final deployment configuration is generated with all placeholders replaced.

### Conclusion

The input file simplifies the process of managing configurations by enabling you to define values in one centralized place and seamlessly apply them across multiple deployment templates. This approach reduces duplication, and ensures consistency. Finally, by referencing external outputs (e.g., from Terraform or CDK) and directly injecting values into deployment files, GitMoxi provides an efficient and flexible way to manage your deployment configurations across various tools.






