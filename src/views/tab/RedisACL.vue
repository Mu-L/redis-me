<script setup lang="ts">
/** ACL 用户管理主界面：列表展示 + 编辑态 form 由本组件持有，对话框 UI 在 UserAdd.vue */
import { computed, inject, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { shareProvideKey } from '@/types/me-interface'
import type { AclUserDetail } from '@/types/tauri-specta'
import {
  buildAclPreviewCommand,
  buildAclSavePayload,
  createAclModelFromDetail,
  createDefaultAclModel,
  summarizeRules,
  type AclEditModel,
} from '@/utils/acl'
import { meCommands, meConfirm, meOk, meWarn } from '@/utils/util'
import UserAdd from '@/views/ext/UserAdd.vue'

const { t } = useI18n()
const share = inject(shareProvideKey)!
const canEdit = computed(() => !share.readonly)

const keyword = ref('')
const loading = ref(false)
const users = ref<AclUserDetail[]>([])
const whoami = ref('')

/** 编辑对话框：form 与 UserAdd 共享同一 reactive 对象 */
const editVisible = ref(false)
const editLoading = ref(false)
const editMode = ref<'add' | 'edit'>('add')
const form = reactive<AclEditModel>(createDefaultAclModel())

const filterUsers = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  if (!key) return users.value
  return users.value.filter(item => {
    const command = item.commandRules.join(' ').toLowerCase()
    return (
      item.username.toLowerCase().includes(key) ||
      command.includes(key) ||
      item.keyPatterns.join(' ').toLowerCase().includes(key) ||
      item.channelPatterns.join(' ').toLowerCase().includes(key)
    )
  })
})

const previewCommand = computed(() => buildAclPreviewCommand(form))

/** 危险命令黑名单 ↔ form.commandRules 中的 -@dangerous，由 UserAdd 双向绑定 */
const dangerousBlocked = computed({
  get: () => form.commandRules.includes('-@dangerous'),
  set: (blocked: boolean) => {
    // 开关语义：开启=强制追加 -@dangerous；关闭=移除该规则
    const next = form.commandRules.filter(v => v !== '-@dangerous')
    if (blocked) next.push('-@dangerous')
    form.commandRules = next
  },
})

function resetForm() {
  Object.assign(form, createDefaultAclModel())
}

/** ACL USERS + 并行 GETUSER 拉详情；用户很多时可能偏慢 */
async function refresh() {
  loading.value = true
  try {
    const names = await meCommands.aclUsers(share.conn!.id)
    const details = await Promise.all(
      names.map(name => meCommands.aclGetuser(share.conn!.id, name)),
    )
    users.value = details.sort((a, b) => a.username.localeCompare(b.username))
    whoami.value = await meCommands.aclWhoami(share.conn!.id)
  } finally {
    loading.value = false
  }
}

function openAdd() {
  editMode.value = 'add'
  resetForm()
  editVisible.value = true
}

function openEdit(row: AclUserDetail) {
  editMode.value = 'edit'
  Object.assign(form, createAclModelFromDetail(row))
  editVisible.value = true
}

async function genPassword() {
  form.password = await meCommands.aclGenpass(share.conn!.id, 128)
  meOk(t('redisACL.passwordGenerated'))
}

/** 校验 → buildAclSavePayload（密码 SHA256）→ aclSetuser；键/频道空列表在后端会放宽权限，故前端拦截 */
async function saveUser() {
  const username = form.username.trim()
  if (!username) {
    meWarn(t('redisACL.usernameRequired'))
    return
  }
  if (editMode.value === 'add' && !form.password.trim()) {
    meWarn(t('redisACL.passwordRequired'))
    return
  }
  if (!form.keyPatterns.length) {
    meWarn(t('redisACL.keyPatternsRequired'))
    return
  }
  if (!form.channelPatterns.length) {
    meWarn(t('redisACL.channelPatternsRequired'))
    return
  }

  editLoading.value = true
  try {
    const payload = await buildAclSavePayload(form)
    // 新增必须有密码；编辑留空表示沿用原 hash 或 nopass
    if (editMode.value === 'add' && !payload.passwordHashes.length) {
      meWarn(t('redisACL.passwordRequired'))
      return
    }
    await meCommands.aclSetuser(share.conn!.id, payload)
    meOk(editMode.value === 'add' ? t('addOk') : t('editOk'))
    editVisible.value = false
    await refresh()
  } finally {
    editLoading.value = false
  }
}

function deleteUser(row: AclUserDetail) {
  if (row.username === 'default') {
    meWarn(t('redisACL.defaultProtected'))
    return
  }
  meConfirm(t('redisACL.deleteConfirm', { user: row.username }), async () => {
    await meCommands.aclDeluser(share.conn!.id, [row.username])
    meOk(t('deleteOk'))
    await refresh()
  })
}

/** 复制用户：预填规则/模式，用户名加后缀，需重新设密码（同连接管理复制） */
function openCopy(row: AclUserDetail) {
  editMode.value = 'add'
  Object.assign(form, createAclModelFromDetail(row), {
    username: `${row.username}-${t('copy')}`,
    password: '',
    passwordHashes: [],
  })
  editVisible.value = true
}

void refresh()
</script>

<template>
  <div class="redis-acl" v-loading="loading">
    <div class="me-flex header">
      <div class="me-flex header-left">
        <el-button v-if="canEdit" type="primary" icon="el-icon-plus" @click="openAdd">
          {{ t('redisACL.addUser') }}
        </el-button>
        <el-text type="info">{{ t('redisACL.currentUser') }}: {{ whoami || '--' }}</el-text>
        <me-website to="acl" margin-left="0" />
      </div>
      <div class="me-flex">
        <el-input
          v-model="keyword"
          :placeholder="t('redisACL.keyword')"
          style="width: 260px; margin-right: 10px"
          clearable />
        <el-button icon="el-icon-search" @click="refresh" type="primary" :loading="loading" />
      </div>
    </div>

    <div class="table">
      <me-table :data="filterUsers" export-name="acl-users">
        <el-table-column
          prop="username"
          :label="t('redisACL.username')"
          width="120"
          show-overflow-tooltip />
        <el-table-column :label="t('redisACL.status')" width="92" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? t('redisACL.enabled') : t('redisACL.disabled') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('redisACL.commandRules')" min-width="120" show-overflow-tooltip>
          <!-- 命令规则列占满剩余宽度，展示完整规则串 -->
          <template #default="{ row }">{{
            row.commandRules.length ? row.commandRules.join(' ') : '--'
          }}</template>
        </el-table-column>
        <el-table-column :label="t('redisACL.keyPatternsCol')" width="96" show-overflow-tooltip>
          <template #default="{ row }">{{ summarizeRules(row.keyPatterns, 2) }}</template>
        </el-table-column>
        <el-table-column :label="t('redisACL.channelPatternsCol')" width="88" show-overflow-tooltip>
          <template #default="{ row }">{{ summarizeRules(row.channelPatterns, 2) }}</template>
        </el-table-column>
        <el-table-column v-if="canEdit" :label="t('action')" width="100" align="center">
          <template #default="{ row }">
            <div class="action-icons">
              <me-icon
                icon="el-icon-document-copy"
                class="icon-btn"
                :info="t('copy')"
                @click="openCopy(row)" />
              <me-icon
                icon="el-icon-edit"
                class="icon-btn"
                :info="t('edit')"
                @click="openEdit(row)" />
              <me-icon
                icon="el-icon-delete"
                class="icon-btn"
                :info="t('delete')"
                @click="deleteUser(row)" />
            </div>
          </template>
        </el-table-column>
      </me-table>
    </div>
  </div>

  <!-- form / previewCommand / dangerousBlocked 均由父组件维护 -->
  <UserAdd
    v-model="editVisible"
    v-model:dangerous-blocked="dangerousBlocked"
    :mode="editMode"
    :loading="editLoading"
    :form="form"
    :preview-command="previewCommand"
    @save="saveUser"
    @generate-password="genPassword" />
</template>

<style scoped lang="scss">
.redis-acl {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .header {
    margin-bottom: 10px;
    align-items: center;
    justify-content: space-between;
  }

  .header-left {
    gap: 8px;
  }

  .table {
    flex-grow: 1;
    height: 0;
  }
}

.action-icons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: nowrap;
}
</style>
