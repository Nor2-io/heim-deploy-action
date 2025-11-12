import type * as tc from '@actions/tool-cache'
import { jest } from '@jest/globals'

export const find = jest.fn<typeof tc.find>()
export const findAllVersions = jest.fn<typeof tc.findAllVersions>()
