![Heim Logo](/assets/heim.svg)

[\[Getting Started\]](https://cloud.heim.dev/heim/docs/start-here/getting-started/)
[\[Documentation\]](https://cloud.heim.dev/heim/docs/)

# Heim deploy

Deploy your heim application using the heim cli

## Usage

```Yaml
# Latest version
- name: Heim Deploy
  id: heim-deploy
  uses: Nor2-io/heim-deploy-action@v1
  with:
    token: ${{ secrets.HEIM_CI_TOKEN }}

# Major version
- name: Heim Deploy
  id: heim-deploy
  uses: Nor2-io/heim-deploy-action@v1
  with:
    token: ${{ secrets.HEIM_CI_TOKEN }}
    version: v1

# Specific version
- name: Heim Deploy
  id: heim-deploy
  uses: Nor2-io/heim-deploy-action@v1
  with:
    token: ${{ secrets.HEIM_CI_TOKEN }}
    version: "1.2.2"

# Full
- name: Heim Deploy
  id: heim-deploy
  uses: Nor2-io/heim-deploy-action@v1
  with:
    token: ${{ secrets.HEIM_CI_TOKEN }}
    path: 'path/to/component'
    dev: false
    host:
      addr: '127.0.0.1'
      port: 443
    envs:
      ENV1: 'VALUE1'
    isWorkspace: false
    component: 'wasm-component-1'
    version: 'current'
    verbose: false
    failOnStdErr: false
```

## Inputs

| key          | description                                                                       | required | default |
| ------------ | --------------------------------------------------------------------------------- | -------- | ------- |
| token        | A heim ci token, either this or the HEIM_CI_TOKEN env needs to be set             | true     |         |
| path         | The path to the component to build, defaults to current directory                 | false    |         |
| dev          | Set the dev flag to deploy a dev build                                            | false    | false   |
| host         | Set the host flags, host: { "addr": "127.0.0.1", port: 3000 }                     | false    |         |
| envs         | Environment values to set via flags, envs: { "ENV1": "value1", "ENV2": "value2" } | false    |         |
| isWorkspace  | Set the workspace flag                                                            | false    | false   |
| component    | The component to the deploy in a workspace                                        | false    |         |
| version      | the heim version to use, ex: 1.1.1, v1, current                                   | true     | current |
| verbose      | Run with the verbose flag                                                         | false    | false   |
| failOnStdErr | Should the execution fail on stderr                                               | false    | false   |
