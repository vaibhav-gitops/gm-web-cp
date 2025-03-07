---
title: "Core Concepts"
navtitle: "Core Concepts"
layout: ../../layouts/MdLayout.astro
---

# How Gitmoxi works
GitMoxi leverages the GitOps paradigm to manage and automate deployments. For this paradigm, the deployment artifacts such as ECS service definition, ECS task definition, or Lambda function definition are stored in Git repositories. When these files are changed and commited to a repository branch, Gitmoxi orchestrates the creation, update, or deletion of associated service objects based on file changes. Gitmoxi can handle multiple files changes from a commit and conduct parallel execution to deploy those changes to associated services. Gitmoxi can both create service objects, such as ECS service and Lambda function, and update them using variety of deployment strategies such as rolling and blue/green with variety of traffic shifting patterns. When the files are deleted, Gitmoxi deletes the associated service objects as well, completing the entire life-cycle. 

For all the commits and deployments Gitmoxi stores processing details in AWS DynamoDB tables. Gitmoxi comprehensively gathers status during deployments so that you can easily troubleshoot any failures. Whether it is simple errors such as mis-configured attributes or more intricate failures such as insufficient IAM roles, lack of IP addresses, or alarm triggers during traffic shifting, Gitmoxi gathers and reports them all. Gitmoxi also provides a flexible deployment circuit breaker which can be used to trigger rollbacks based on number of failures or when a deployment is taking too long to stabilize. 

Below section provide more details on the repositories and commits, followed by next chapters covering feature details for deployments.

## Git repositories
GitOps paradigm starts by storing the deployment artifacts in Git repositories. Git provides excellent features to version control the artifacts; to collaborate, review, and approve changes, and to have a complete audit trail for addressing the recurring question of *what changed?*. You can configure multiple repositories to use with Gitmoxi. And for each repository you can configure multiple branches. Below is the example of adding a repository for use with Gitmoxi.
```bash
gmctl repo add -r "<deployment-artifacts-git-repo>" -b main,dev -a "<aws-secret-mgr-arn-for-Github-token>"
```
An access token is needed for Gitmoxi to evaluate the changes associated with commits and to read the deployment artifacts. Gitmoxi currently supports AWS Secrets Manager and AWS Parameter Store where you can securely store the token. While adding the repository you just need to provide the ARN associated with the token's secret store. The token is fetched directly from the store by Gitmoxi application and neither stored nor logged anywhere. If you rotate/change the token Gitmoxi will seamlessly fetch the latest token. 

## Git commits
You can trigger Gitmoxi deployment **after** you have committed (pushed) changes to deployment artifacts to a configured repository and branch. For example, you can create `nginx/nginx_svcdef.json` and `nginx/nginx_taskdef.json`, enter all the necessary details needed for an Amazon ECS service and task definition, and commit the changes to a configured repository and branch. Once committed, you can trigger Gitmoxi deployment using the CLI command `gmctl commit deploy`. This command will automatically work with the latest commit and associated changes. You can invoke this command in your CI/CD pipeline.

  ```bash
  gmctl commit deploy -r "<deployment-artifacts-git-repo>" -b main
  ```

### Gitmoxi file naming requirements
*But how does Gitmoxi know which files to use for which service object?* Gitmoxi **requires** a specific file naming convention to identify relevant files and group files associated to a specific service object. 
* For Amazon ECS service, the relevant files are those ending follwing suffixes:
  * ``_svcdef.json`` - the ECS service definition file
  * `_taskdef.json`- the ECS task definition file
  * `_depdef.json`- the Gitmoxi deployment configuration for the ECS service 
  * `_input.json`- the file that contains substitution values 

* For AWS Lambda service, the relevant files are those ending in following suffixes:
  * `_lambdadef.json`- the Lambda function definition file
  * `_lambdaeventsourcedef.json`- the Lambda event source definition file
  * `_lambdadepdef.json`- Gitmoxi deployment configuration for the Lambda service (more on this in the Features section)
  * `_lambdainput.json`- he file that contains substitution values (more on this in the next section)

* Gitmoxi will associate all relevant files that have the same **path-prefix** to a single service object. For example, files: `dev/nginx/nginx_svcdef.json`, `dev/nginx/nginx_taskdef.json`, `dev/nginx/nginx_input.json`, and `dev/nginx/nginx_depdef.json` all have the same path-prefix: `dev/nginx/nginx`. Gitmoxi will automatically associate all these files together. The path-prefix is the directory path of a file plus the file name excluding the Gitmoxi suffix part.

For Gitmoxi to identify relevant files you need to **use the above suffixes**. And, for Gitmoxi to assciate multiple files to a single service object (ECS service or Lambda function) you need to **give them the same path-prefix**. One way to do this is put all the files associated with a service object in the same folder, start the file names using the service object name, and then ensure appropriate suffix for the respective file. In the above example, `dev/nginx` is the folder and all related file names start with the service name, `nginx`. 

**Note** that the ECS (`_svcdef.json` and `_taskdef.json`) and Lambda (`_lambdadef.json` and `_lambdaeventsourcedef.json`) contain only the native attributes as defined and required by those services. Gitmoxi doesn't modify or add any propreitary attributes in those files. 

# Summary
For the Gitmoxi GitOps worklfow:
* Configure repositories and branches in Gitmoxi
* Create deployment artifacts ensuring required files names for ECS services and Lambda functions 
* Make changes and commit to the configured repository and branch
* Invoke the Gitmoxi deploy command. 

Next, we will take a closer look at how Gitmoxi deploys ECS services and Lambda functions based on the deployment artifact file changes. 