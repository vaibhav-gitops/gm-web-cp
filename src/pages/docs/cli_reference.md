---
title: "CLI Reference"
navtitle: "CLI Reference"
layout: ../../layouts/MdLayout.astro
---

# CLI Reference
Gitmoxi comes with a CLI, `gmctl` (pronoucend *g-m-cut-l*), which can be used for easily interacting with Gitmoxi application including to conduct deployment dry runs, deploy commits, understand the details of deployments and get the status of deployments.

## gmctl
The is the main command entry point. The parameter to note is the `-e | --endpoint-url` for the Gitmoxi service API endpoint. You can either provide it in the command or set the environment variable `GITMOXI_ENDPOINT_URL` to avoid passing this parameter repeatedly.
 
  ```bash
  gmctl --help              
  Usage: gmctl [OPTIONS] COMMAND [ARGS]...

  Options:
    -e, --endpoint-url TEXT         The Gitmoxi FastAPI endpoint URL  [default:
                                    env(GITMOXI_ENDPOINT_URL), fallback to
                                    http://127.0.0.1:8080]
    -l, --log-level [DEBUG|INFO|WARNING|ERROR|CRITICAL]
                                    The log level  [default: ERROR]
    --help                          Show this message and exit.

  Commands:
    commit      Commit related commands.
    deployment  User related commands.
    repo        Repo related commands.
  ```
  
## gmctl commit 
Command to get or deploy commits. 
  ```bash
  gmctl commit --help                                                     
  Usage: gmctl commit [OPTIONS] COMMAND [ARGS]...

    Commit related commands.

  Options:
    --help  Show this message and exit.

  Commands:
    deploy
    get
  ```
### gmctl commit get 
For the repository and branch, which are required input, the command will return list of last N commits processed by Gitmoxi.
  ```bash
  gmctl commit get --help                                                  
  Usage: gmctl commit get [OPTIONS]

  Options:
    -r, --repo-url TEXT  The repository URL  [required]
    -b, --branch TEXT    The branch in the repository  [required]
    -n, --n INTEGER      The number of commits to get
    --help               Show this message and exit.
  ```

### gmctl commit deploy 
The command will first figure out what all files have changed between the latest commit and last commit processed by Gitmoxi. If there are ECS and Lambda relevant file changes then this command triggers deployment based on those files. If Gitmoxi has not processed any commits before for this repository and branch, then all the files in the repository are considered as *changed* and for all the ECS and Lambda relevant files deployments will be triggered. If the lastest commit is the same as last commit processed by Gitmoxi then there are no changes and no deployments. If the lastest commit is the same as last commit processed by Gitmoxi then you can force a redeploy of the last commit by providing the `-f|--force` flag. 
  ```bash
  gmctl commit deploy --help                                               
  Usage: gmctl commit deploy [OPTIONS]

  Options:
    -r, --repo-url TEXT  The repository URL  [required]
    -b, --branch TEXT    The branch in the repository  [required]
    -f, --force          Force deploy last known commit if there are no other
                        changes
    --help               Show this message and exit.
  ```

### gmctl commit dryrun** 
The command will figure out what all files have changed between the latest commit and last commit processed by Gitmoxi. It will then look for ECS and Lambda relevant files changes and report those files. If you trigger the `gmctl commit deploy` command, then these are the changed ECS and Lambda files will result in deployment. So the `dryrun` gives you insight what relevant files changed and what deployments will get triggered. You can use it as a review before triggering the `deploy` command.
  ```bash
  gmctl commit dryrun --help                                               
  Usage: gmctl commit dryrun [OPTIONS]

  Options:
    -r, --repo-url TEXT  The repository URL  [required]
    -b, --branch TEXT    The branch in the repository  [required]
    --help               Show this message and exit.
  ```
