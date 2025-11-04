# Heim setup

Action to setup heim on a github runner.
It also sets the HEIM_HOME variable and adds heim to the path.


## Inputs
| key     | description | required | default |
| ------- | ----------- | -------- | ------- |
| token | A heim ci token, either this or the HEIM_CI_TOKEN env needs to be set | true | |
| path | The path to the component to build, defaults to current directory | false | |
| dev | Set the dev flag to deploy a dev build | false | false |
| host | Set the host flags, host: { "addr": "127.0.0.1", port: 3000 } | false | |
| envs | Environment values to set via flags, envs: { "ENV1": "value1", "ENV2": "value2" } | false | |
| isWorkspace | Set the workspace flag | false | false |
| component | The component to the deploy in a workspace | false | |
| version | the heim version to use, ex: 1.1.1, v1, current | true | current |
| verbose | Run with the verbose flag | false | false |
| failOnStdErr | Should the execution fail on stderr | false | false |

