---
title: "CLI Reference"
navtitle: "CLI Reference"
layout: ../../layouts/MdLayout.astro
---
# gmctl - Gitmoxi Command Line Interface
`gmctl` is the command line interface for interacting with Gitmoxi services. It provides various commands for managing repositories, deployments, and commits. Below are global options that apply to all subcommands.

```
gmctl [OPTIONS] COMMAND [ARGS]...
```
| Option | Default | Description |
|--------|---------|-------------|
| `-e, --endpoint-url` | `env(GITMOXI_ENDPOINT_URL)` or `http://127.0.0.1:8080` | The Gitmoxi FastAPI endpoint URL |
| `-l, --log-level` | `ERROR` | The log level (`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`) |

## Repository management commands
Repository-related commands for configuring Git repositories in Gitmoxi.
```
gmctl repo [SUBCOMMAND]
```
### Add repository
Add repository containing artifacts for Gitmoxi GitOps deployments.

```
gmctl repo add [OPTIONS]
```

| Option | Required | Description |
|--------|----------|-------------|
| `-r, --repo-url` | Yes | The repository URL |
| `-a, --access-token-arn` | Yes | The access token ARN |
| `-b, --branches`  | Yes | Branches in the repository |

**Example:**
```
gmctl repo add -r https://github_repo -a arn:aws:secretsmanager:us-east-1:12345:secret:my-token -b main -b dev
```

### Get repository
Get repository configuration details such as branch and access token ARN if configured for use with Gitmoxi. If no repository is provided it will list all the configured repositories.
```
gmctl repo get [OPTIONS]
```
| Option | Required | Description |
|--------|----------|-------------|
| `-r, --repo-url` | No | The repository URL |

**Example:**
```
gmctl repo get
```
### Delete repository
Delete repository configuration for Gitmoxi.
```
gmctl repo delete [OPTIONS]
```
| Option | Required | Description |
|--------|----------|-------------|
| `-r, --repo-url` | Yes | The repository URL |

**Example:**
```
gmctl repo delete -r https://github_repo_to_remove
```

## Deployment Management
Commands for managing deployments in Gitmoxi.
```
gmctl deployment [SUBCOMMAND]
```
### Get Deployments by Commit
Retrieve ECS and Lambda deployment records for a specific commit.
```
gmctl deployment get [OPTIONS]
```
| Option | Required | Description |
|--------|----------|-------------|
| `-c, --commit-hash` | Yes | The commit hash to filter deployments |

**Example:**
```
gmctl deployment get -c abc123
```

This command retrieves deployment records for both ECS and Lambda services associated with the specified commit hash. It displays the deployment details in a tabular format for each service.

**Output:**
- For ECS deployments, the command displays repository URL, commit hash, account ID, region, service name, cluster, creation timestamp, status, and file prefix.
- For Lambda deployments, the command displays repository URL, commit hash, account ID, region, function name, creation timestamp, status, and file prefix.

### Get ECS Deployments
This command retrieves ECS deployment records based on specified filters. It displays the deployment information in a tabular format and optionally provides detailed status information for each deployment when the verbose flag is enabled.
```
gmctl deployment ecs get [OPTIONS]
```
| Option              | Required  | Description                                                                 |
|---------------------|-----------|-----------------------------------------------------------------------------|
| `-r, --repo-url`    | No        | Repository URL to filter deployments                                        |
| `-c, --commit-hash` | No        | Commit hash to filter deployments                                           |
| `-a, --account-id`  | No        | AWS account ID to filter deployments                                        |
| `-re, --region`     | No        | AWS region to filter deployments                                            |
| `-s, --service`     | No        | ECS service name to filter deployments                                      |
| `-cl, --cluster`    | No        | ECS cluster name to filter deployments                                      |
| `-st, --status`     | No        | Deployment status to filter deployments<br>Choices: `PROCESSING`, `PROCESSED_ERROR`, `PROCESSED_SUCCESS` |
| `-n, --number-of-records` | No  | Number of records to retrieve (default: 10)                                |
| `-v, --verbose`     | No        | Enable verbose output with detailed status information                      |
| `-A, --show-all`    | No        | Show detailed status for all deployments (not just error states)            |

The command displays a table with the following fields for each deployment:
- Repository URL
- Commit hash
- AWS account ID
- AWS region
- ECS service name
- ECS cluster name
- Creation timestamp
- Deployment status
- File prefix

When the verbose flag is enabled, additional status details are displayed for deployments in error state. If the show-all flag is also enabled, status details are shown for all deployments regardless of state.

**Examples:**
- Basic usage with minimal filters
```bash
gmctl deployment ecs get -re us-west-2 -s my-service
```
- Filter deployments by repository and status
```bash
gmctl deployment ecs get -r https://github.com/example/repo -st PROCESSED_SUCCESS
```
- View detailed information for failed deployments
```bash
gmctl deployment ecs get -s my-service -v
```
- Show detailed information for all deployments
```bash
gmctl deployment ecs get -s my-service -v --show-all
```
- Limit the number of results
```bash
gmctl deployment ecs get -s my-service -n 5
```
### Get Lambda Deployments
This command retrieves Lambda deployment records based on specified filters. It displays the deployment information in a tabular format and optionally provides detailed status information for each deployment when the verbose flag is enabled.
```
gmctl deployment lambda get [OPTIONS]
```
| Option              | Required  | Description                                                                 |
|---------------------|-----------|-----------------------------------------------------------------------------|
| `-r, --repo-url`    | No        | Repository URL to filter deployments                                        |
| `-c, --commit-hash` | No        | Commit hash to filter deployments                                           |
| `-a, --account-id`  | No        | AWS account ID to filter deployments                                        |
| `-re, --region`     | No        | AWS region to filter deployments                                            |
| `-fn, --function-name` | No     | Lambda function name to filter deployments                                  |
| `-st, --status`     | No        | Deployment status to filter deployments<br>Choices: `PROCESSING`, `PROCESSED_ERROR`, `PROCESSED_SUCCESS` |
| `-n, --number-of-records` | No  | Number of records to retrieve (default: 10)                                |
| `-v, --verbose`     | No        | Enable verbose output with detailed status information                      |
| `-A, --show-all`    | No        | Show detailed status for all deployments (not just error states)            |

The command displays a table with the following fields for each deployment:

- Repository URL
- Commit hash
- AWS account ID
- AWS region
- Lambda function name
- Creation timestamp
- Deployment status
- File prefix

When the verbose flag is enabled, additional status details are displayed for deployments in error state. If the show-all flag is also enabled, status details are shown for all deployments regardless of state.

**Examples:**
- Basic usage with minimal filters
```bash
gmctl deployment lambda get -re us-east-1 -fn my-function
```
- Filter deployments by repository and status
```bash
gmctl deployment lambda get -r https://github.com/example/repo -st PROCESSED_SUCCESS
```
- View detailed information for failed deployments
```bash
gmctl deployment lambda get -fn my-function -v
```
- Show detailed information for all deployments
```bash
gmctl deployment lambda get -fn my-function -v -A
```
- Limit the number of results
```bash
gmctl deployment lambda get -fn my-function --n 5
```
## Commit Management
Commands for working with Git commits in Gitmoxi.
```
gmctl commit [SUBCOMMAND]
```
### Get commit
Retrieve the latest commits from the specified repository and branch.
```
gmctl commit get [OPTIONS]
```
| Option         | Required  | Description                                      |
|----------------|-----------|--------------------------------------------------|
| `-r, --repo-url` | Yes       | The URL of the repository                       |
| `-b, --branch`   | Yes       | The branch to retrieve commits from             |
| `-n, --n`        | No        | The number of commits to retrieve (default: 1) |

This will display a table of the most recent commits with the following information:
- commit_hash
- repo_url
- branch
- receive_timestamp
- status

**Example:**
```
gmctl commit get -r https://github.com/example/repo -b main -n 5
```
### Deploy commit
Deploy the latest commit from the specified repository and branch.
```
gmctl commit deploy -r REPO_URL -b BRANCH [-f] [-v]
```
| Option          | Required  | Description                                                   |
|-----------------|-----------|---------------------------------------------------------------|
| `-r, --repo-url` | Yes       | The URL of the repository                                     |
| `-b, --branch`   | Yes       | The branch to deploy from                                     |
| `-f, --force`    | No        | Force deployment of the last known commit if there are no changes |
| `-v, --verbose`  | No        | Enable verbose output                                         |

This will deploy the latest commit and display a table of affected files including:
- latest_commit_hash
- previous_processed_commit_hash
- file
- change (added_or_modified/deleted)
- relevance (ecs/lambda)

**Example**
```
gmctl commit deploy -r https://github.com/example/repo -b main --force
```
### Dryrun for a commit
Perform a dry run to identify changes in the specified repository and branch without deploying.
```
gmctl commit dryrun [OPTIONS]
```
| Option               | Required  | Description                                   |
|----------------------|-----------|-----------------------------------------------|
| `-r, --repo-url`     | Yes       | The URL of the repository                     |
| `-b, --branch`       | Yes       | The branch to perform the dry run on          |
| `-p, --process_template` | No    | Process templates for changed files           |
| `-v, --verbose`      | No        | Enable verbose output                         |

This will display a table of files that would be affected by deployment, including:
- latest_commit_hash
- previous_processed_commit_hash
- file
- change (added_or_modified/deleted)
- relevance (ecs/lambda)

**Example:**
```
gmctl commit dryrun -r https://github.com/example/repo -b main -p
```
### Relevant files for commit
Get relevant files that were processed for a specific commit.
```
gmctl commit files -c COMMIT_HASH
```
| Option              | Required  | Description                                      |
|---------------------|-----------|--------------------------------------------------|
| `-c, --commit-hash` | Yes       | The commit hash to retrieve relevant files for   |
This will display a table of files associated with the specified commit, including:
- receive_timestamp
- file
- change (added_or_modified/deleted)
- relevance (ecs/lambda)
**Example:**
```
gmctl commit files -c abc123
```
