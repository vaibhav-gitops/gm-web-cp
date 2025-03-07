---
title: "CLI Reference"
navtitle: "CLI Reference"
layout: ../../layouts/MdLayout.astro
---

# CLI Reference
Gitmoxi comes with a CLI, `gmctl`, which can be used for easily interacting with Gitmoxi application including to conduct deployment dry runs, deploy commits, understand the details of deployments and get the status of deployments.

- **gmctl**: 
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
- **gmctl commit**: Command to get, deploy, or delete commits. 
  ```bash
  gmctl commit --help                                                     
  Usage: gmctl commit [OPTIONS] COMMAND [ARGS]...

    Commit related commands.

  Options:
    --help  Show this message and exit.

  Commands:
    delete
    deploy
    get
  ```
- **gmctl commit get**: 

