import { describe, expect, it } from 'vitest'

import type { AclUserDetail } from '@/types/tauri-specta'
import {
  buildAclPreviewCommand,
  buildAclSavePayload,
  createAclModelFromDetail,
  createDefaultAclModel,
  isAclSupported,
  sha256Hex,
} from '@/utils/acl'

function sampleDetail(overrides: Partial<AclUserDetail> = {}): AclUserDetail {
  return {
    username: 'user1',
    enabled: true,
    nopass: false,
    flags: [],
    passwordHashes: ['2bfce0458e8f8e0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0'],
    commandRules: ['+@read'],
    keyPatterns: ['*'],
    channelPatterns: ['*'],
    selectors: [],
    ...overrides,
  }
}

describe('isAclSupported', () => {
  it('6.0 及以上为 true', () => {
    expect(isAclSupported('6.2.0')).toBe(true)
    expect(isAclSupported('7.4.1')).toBe(true)
  })

  it('5.x 及以下为 false', () => {
    expect(isAclSupported('5.0.14')).toBe(false)
    expect(isAclSupported(undefined)).toBe(false)
  })
})

describe('buildAclSavePayload', () => {
  it('编辑未改密码时沿用原 passwordHashes', async () => {
    const model = createAclModelFromDetail(sampleDetail())
    const payload = await buildAclSavePayload(model)
    expect(payload.passwordHashes).toEqual(sampleDetail().passwordHashes)
  })

  it('编辑 nopass 用户允许空 passwordHashes', async () => {
    const model = createAclModelFromDetail(sampleDetail({ nopass: true, passwordHashes: [] }))
    const payload = await buildAclSavePayload(model)
    expect(payload.passwordHashes).toEqual([])
  })

  it('新密码会转为 sha256 hash', async () => {
    const model = createDefaultAclModel()
    model.password = 'secret'
    const payload = await buildAclSavePayload(model)
    expect(payload.passwordHashes).toEqual([await sha256Hex('secret')])
  })

  it('键/频道模式去掉 ~ & 前缀并去重', async () => {
    const model = createDefaultAclModel()
    model.keyPatterns = ['~app:*', 'app:*']
    model.channelPatterns = ['&room:*', 'room:*']
    const payload = await buildAclSavePayload(model)
    expect(payload.keyPatterns).toEqual(['app:*'])
    expect(payload.channelPatterns).toEqual(['room:*'])
  })
})

describe('buildAclPreviewCommand', () => {
  it('预览命令包含规范化后的模式前缀', () => {
    const model = createDefaultAclModel()
    model.username = 'demo'
    model.keyPatterns = ['~*']
    model.channelPatterns = ['&*']
    const preview = buildAclPreviewCommand(model)
    expect(preview).toContain('~*')
    expect(preview).toContain('&*')
    expect(preview).toContain('demo')
  })
})
