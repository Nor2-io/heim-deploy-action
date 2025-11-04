import { jest } from '@jest/globals'

import * as core from '../__fixtures__/core.js';
import * as tc from '../__fixtures__/tool-cache.js';
import { HTTPError } from '@actions/tool-cache';
import * as io from '../__fixtures__/io.js';
import * as exec from '../__fixtures__/exec.js';
import * as hc from '@actions/http-client';

import osm, { arch } from 'os';
import path from 'path';

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/tool-cache', () => tc);
jest.unstable_mockModule('@actions/io', () => io);
jest.unstable_mockModule('@actions/exec', () => exec);
// jest.unstable_mockModule('@actions/http-client', () => hc);

const { run } = await import('../src/main.js');

import dataJson from "./data/data.json";
import { IHeimVersions } from '../src/main';
import { TypedResponse } from '@actions/http-client/lib/interfaces.js';
import { ExecOutput } from '@actions/exec';
import { ExecOptions } from 'child_process';
import { env } from 'process';

describe('heim-exec', () => {
    const debugPrints = false;

    // node
    let os = {} as any;
    let archSpy: jest.Spied<typeof arch>;

    // @actions/core
    let inputs = {} as any;
    let addPathSpy: jest.Spied<typeof core.addPath>;
    let exportVariableSpy: jest.Spied<typeof core.exportVariable>;
    let getInputSpy: jest.Spied<typeof core.getInput>;
    let getBooleanInput: jest.Spied<typeof core.getBooleanInput>;
    let setOutputSpy: jest.Spied<typeof core.setOutput>;
    let infoSpy: jest.Spied<typeof core.info>;
    let dbgSpy: jest.Spied<typeof core.debug>;
    let warningSpy: jest.Spied<typeof core.warning>;
    let setFailedSpy: jest.Spied<typeof core.setFailed>;

    // @actions/tool-cache
    let findSpy: jest.Spied<typeof tc.find>;
    let findAllSpy: jest.Spied<typeof tc.findAllVersions>;

    // @actions/http-client
    let getJsonSpy: jest.Spied<typeof hc.HttpClient.prototype.getJson>;

    // @actions/io
    let whichSpy: jest.Spied<typeof io.which>;

    // @actions/exec
    let getExecOutputSpy: jest.Spied<typeof exec.getExecOutput>;
    let execSpy: jest.Spied<typeof exec.exec>;

    const execOptions = <ExecOptions> {
        failOnStdErr: false
    }
    
    beforeEach(() => {
        // node
        os = {};
        archSpy = jest.spyOn(osm, 'arch');
        archSpy.mockImplementation(() => os['arch']);

        // @actions/core
        inputs = {
            token: '',
            path: '',
            dev: false,
            host: '',
            envs: '',
            isWorkspace: false,
            component: '',
            verbose: false,
            failOnStdErr: false
        };
        getInputSpy = jest.spyOn(core, 'getInput');
        getInputSpy.mockImplementation((name) => {
            return inputs[name];
        });
        getBooleanInput = jest.spyOn(core, 'getBooleanInput');
        getBooleanInput.mockImplementation((name) => {
            return inputs[name];
        })
        addPathSpy = jest.spyOn(core, 'addPath');
        addPathSpy.mockImplementation(() => {});
        exportVariableSpy = jest.spyOn(core, 'exportVariable');
        exportVariableSpy.mockImplementation(() => {});
        infoSpy = jest.spyOn(core, 'info');
        infoSpy.mockImplementation((msg: any) => {
            if(debugPrints) {
                console.log(`Info called with \n"${msg}"`) 
            }
        });
        dbgSpy = jest.spyOn(core, 'debug');
        dbgSpy.mockImplementation((msg: any) => { 
            if(debugPrints) {
                console.log(`Debug called with \n"${msg}"`) 
            }
        });
        warningSpy = jest.spyOn(core, 'warning');
        warningSpy.mockImplementation((msg: any) => {
            if(debugPrints) {
                console.log(msg);
            }
        })
        setFailedSpy = jest.spyOn(core, 'setFailed');
        setFailedSpy.mockImplementation(() => {});

        // @actions/tool-cache
        findSpy = jest.spyOn(tc, 'find');

        // @actions/http-client
        getJsonSpy = jest.spyOn(hc.HttpClient.prototype, 'getJson');
        getJsonSpy.mockImplementation(async _url => {
            let data: any;
            data = <IHeimVersions>dataJson;
            return <TypedResponse<IHeimVersions>> {
                statusCode: 200,
                result: data
            }
        });

        // @actions/io
        whichSpy = jest.spyOn(io, 'which');

        // @actions/exec
        getExecOutputSpy = jest.spyOn(exec, 'getExecOutput');
        execSpy = jest.spyOn(exec, 'exec');
        execSpy.mockImplementation(async () => {
            return 0;
        });
    })

    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    })

    afterAll(() => {
        jest.restoreAllMocks();
    })


    // token 
    // - no value
    // - HEIM_CI_TOKEN value - done
    // - token variable value - done

    // path
    // - no value - done
    // - value - done

    // dev
    // - no value - done
    // - value -done

    // host
    // - no value - done
    // - value - done

    // envs
    // - no value -done
    // - value - done

    // isWorkspace
    // - no value - done
    // - value - done
    
    // component
    // - no value - done
    // - value in workspace - done
    // - value outside workspace - done

    // verbose
    // - no value - done
    // - value - done

    // version
    // - no value with heim in path - done
    // - no value with heim not in path - done
    // - v1 with higher none matching version in path
    // - v1 without higher version in path
    // - 1.1.1
    // - invalid version

    // getExecOutput none 0 exit code

    it('No version', async () => {
        os.arch = 'x64';
        inputs.token = "test";

        whichSpy.mockImplementation(async () => "");
        await run();

        expect(setFailedSpy).toHaveBeenLastCalledWith("Unable to find heim installation");
    })

    it('Unsupported arch', async () => {
        os.arch = "ppc64";
        inputs.token = "test";
        
        await run();

        expect(setFailedSpy).toHaveBeenLastCalledWith(`Unsupported architecture '${os.arch}'`);
    })

    it('No CI token', async () => {
        os.arch = "x64";
        
        await run();

        expect(setFailedSpy).toHaveBeenLastCalledWith("HEIM_CI_TOKEN or token is required for deployment");
    });

    it('Component not in workspace', async () => {
        os.arch = "x64";
        env["HEIM_CI_TOKEN"] = "test";
        inputs.component = "test_component";

        let whichPath = path.normalize('/usr/bin/heim/bin/heim');
        whichSpy.mockImplementation(async () => whichPath);
        getExecOutputSpy.mockImplementation(async () => { return <ExecOutput> {
            stdout: "heim-cli 1.1.1",
            exitCode: 0
        } })
        
        await run();

        expect(warningSpy).toHaveBeenCalledWith('ignoring "component" outside of a workspace');
    });

    it('Without variables set', async () => {
        os.arch = "x64";
        inputs.token = "test";

        let whichPath = path.normalize('/usr/bin/heim/bin/heim');
        whichSpy.mockImplementation(async () => whichPath);
        getExecOutputSpy.mockImplementation(async () => { return <ExecOutput> {
            stdout: "heim-cli 1.1.1",
            exitCode: 0
        } })
        
        await run();

        expect(execSpy).toHaveBeenCalledWith('heim', ['deploy'], execOptions)
    })

    it('With variables values set', async () => {
        os.arch = "x64";
        inputs.token = "test";
        inputs.path = "/this/is/a/path/to/a/module";
        inputs.dev = 'true';
        inputs.host = JSON.stringify({
            addr: "127.0.0.1",
            port: 443
        });
        inputs.envs = JSON.stringify({
            TEST: "test",
            TEST2: "test2"
        });
        inputs.isWorkspace = 'true';
        inputs.component = "test_component";
        inputs.verbose = 'true'

        let whichPath = path.normalize('/usr/bin/heim/bin/heim');
        whichSpy.mockImplementation(async () => whichPath);
        getExecOutputSpy.mockImplementation(async () => { return <ExecOutput> {
            stdout: "heim-cli 1.1.1",
            exitCode: 0
        } })
        
        await run();

        expect(execSpy).toHaveBeenCalledWith('heim', [
            'deploy',
            '--dev',
            '--verbose',
            '--workspace',
            '--component',
            inputs.component,
            '--host',
            '127.0.0.1',
            '--port',
            '443',
            '--envs',
            'TEST=test',
            '--envs',
            'TEST2=test2',
            inputs.path
        ], execOptions)
    });
})