import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as tc from '@actions/tool-cache'
import * as hc from '@actions/http-client'

import { env } from 'process'
import semver from 'semver'
import path from 'path'
import os from 'os'

export interface IHeimAsset {
  name: string
  download_url: string
}
export interface IHeimVersions {
  name: string
  version: string
  date: string
  assets: IHeimAsset[]
}

interface IHeimHost {
  addr: string
  port: number
}

interface IHeimInputs {
  token: string | undefined

  args: string[]
}

async function getToolVersion(toolPath: string): Promise<string> {
  try {
    const { stdout, stderr, exitCode } = await exec.getExecOutput(
      toolPath,
      ['--version'],
      {
        ignoreReturnCode: true,
        silent: true
      }
    )

    if (exitCode > 0) {
      core.info(`[warning]${stderr}`)
      return ''
    }

    const version = stdout.trim().substring(stdout.indexOf(' ')).trim()

    return version
  } catch {
    return ''
  }
}

async function findHeim() {
  const version = core.getInput('version', { required: false })

  let arch: string
  if (os.arch() === 'x64') {
    arch = 'x86_64'
  } else if (os.arch() === 'arm64') {
    arch = 'aarch64'
  } else {
    throw new Error(`Unsupported architecture '${os.arch()}'`)
  }

  const allVersions = tc.findAllVersions('heim', arch)
  let toolPath: string = await io.which('heim', false)
  const pathVersion = await getToolVersion(toolPath)

  if (version) {
    if (version === 'current' || version === 'latest') {
      const httpClient = new hc.HttpClient('exec heim', [], {
        allowRetries: true,
        maxRetries: 3
      })
      const resp = await httpClient.getJson<IHeimVersions>(
        `https://cloud.heim.dev/heim/release?version=${version}`
      )
      if (resp.statusCode === 200 && resp.result != null) {
        toolPath = tc.find('heim', resp.result.version, arch)
      } else {
        throw new Error(`Unabled to find a version matching ${version}`)
      }
    } else if (version.startsWith('v')) {
      const foundVersion = semver.coerce(version)
      const condition = `>=${foundVersion} <${foundVersion?.inc('major')}`
      if (foundVersion) {
        if (foundVersion.raw != pathVersion) {
          const evalVersion = tc.evaluateVersions(allVersions, condition)

          if (
            semver.lt(evalVersion, pathVersion) &&
            !semver.satisfies(pathVersion, condition)
          ) {
            core.warning(
              `Found newer version in path than the expected version, ${version} < ${pathVersion}`
            )
            toolPath = tc.find('heim', evalVersion, arch)
          }
        }
      } else {
        throw new Error(
          `Invalid version ${version}, available versions: ${allVersions}`
        )
      }
    } else {
      if (semver.valid(version)) {
        toolPath = tc.find('heim', version, arch)
      } else {
        throw new Error(
          `Invalid version ${version}, available versions: ${allVersions}`
        )
      }
    }
  }

  if (!toolPath) {
    throw new Error('Unable to find heim installation')
  }

  if (!toolPath.includes('bin')) {
    core.exportVariable('HEIM_HOME', toolPath)
    core.addPath(path.join(toolPath, 'heim', 'bin'))
  }
}

async function readInputs(): Promise<IHeimInputs> {
  const token = core.getInput('token', { required: false })
  if (!token && !env['HEIM_CI_TOKEN']) {
    throw new Error('HEIM_CI_TOKEN or token is required for deployment')
  }

  await findHeim()

  const args: string[] = ['deploy']
  if (core.getBooleanInput('dev', { required: false })) {
    args.push('--dev')
  } else {
    args.push('--release')
  }

  if (core.getBooleanInput('verbose', { required: false })) {
    args.push('--verbose')
  }

  const isWorkspace = core.getBooleanInput('isWorkspace', { required: false })
  if (isWorkspace) {
    args.push('--workspace')
  }
  const component = core.getInput('component', { required: false })
  if (component && isWorkspace) {
    args.push('--component', component)
  } else if (component && !isWorkspace) {
    core.warning('ignoring "component" outside of a workspace')
  }

  const host = core.getInput('host', { required: false })
  if (host) {
    const hostJson: IHeimHost = JSON.parse(host)
    args.push('--host', hostJson.addr)
    args.push('--port', `${hostJson.port}`)
  } else {                                                  
      args.push('--cloud')                             
  } 
  
  const envs = core.getInput('envs', { required: false })
  if (envs) {
    const obj: object = JSON.parse(envs)
    const envsMap: Map<string, string> = new Map(Object.entries(obj))
    envsMap.forEach((value, key) => {
      args.push('--envs', `${key}=${value}`)
    })
  }

  const componentPath = core.getInput('path', { required: false })
  if (componentPath) {
    args.push(componentPath)
  }

  return <IHeimInputs>{
    token: token,
    args: args
  }
}

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const heimInputs = await readInputs()

    if (heimInputs.token) {
      env['HEIM_CI_TOKEN'] = heimInputs.token
    }

    const options: exec.ExecOptions = {}
    options.failOnStdErr = core.getBooleanInput('failOnStdErr', {
      required: false
    })

    await exec.exec('heim', heimInputs.args, options)
  } catch (err) {
    // Fail the workflow run if an error occurs
    core.setFailed((err as Error).message)
  }
}
