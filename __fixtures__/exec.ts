import type * as execType from '@actions/exec'
import { jest } from '@jest/globals'

export const getExecOutput = jest.fn<typeof execType.getExecOutput>()
export const exec = jest.fn<typeof execType.exec>()
