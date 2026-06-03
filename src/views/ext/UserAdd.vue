<script setup lang="ts">
/** ACL 新增/编辑对话框：只负责表单 UI，form 数据与保存逻辑在 RedisACL.vue */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { ACL_PRESET_COMMAND_RULES, type AclEditModel, type AclPreset } from '@/utils/acl'
import { meCopy, meWarn } from '@/utils/util'

const { t } = useI18n()

const visible = defineModel<boolean>({ default: false })
const dangerousBlocked = defineModel<boolean>('dangerousBlocked', { required: true })

const props = defineProps<{
  mode: 'add' | 'edit'
  loading: boolean
  form: AclEditModel
  previewCommand: string
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'generatePassword'): void
}>()

/** 规则/模式输入框草稿，未点「添加」前不入 form；打开对话框时清空 */
const ruleInput = ref('')
const keyPatternInput = ref('')
const channelPatternInput = ref('')

function pushUnique(target: string[], value: string) {
  const text = value.trim()
  if (!text) return
  if (!target.includes(text)) target.push(text)
}

/** 快捷模板：覆盖 commandRules；新增时顺带重置键/频道为 * */
function applyPreset(preset: AclPreset) {
  props.form.commandRules = [...ACL_PRESET_COMMAND_RULES[preset]]
  // 编辑已有用户时只换命令规则，避免覆盖键/频道模式
  if (props.mode === 'add') {
    props.form.keyPatterns = ['*']
    props.form.channelPatterns = ['*']
  }
}

function addRule() {
  pushUnique(props.form.commandRules, ruleInput.value)
  ruleInput.value = ''
}

/** 键模式存不含 ~ 前缀的纯 pattern，展示/保存时由 acl.ts 统一加 ~ */
function addKeyPattern() {
  const v = keyPatternInput.value.trim().replace(/^~/, '')
  pushUnique(props.form.keyPatterns, v)
  keyPatternInput.value = ''
}

/** 频道模式同理，不含 & 前缀 */
function addChannelPattern() {
  const v = channelPatternInput.value.trim().replace(/^&/, '')
  pushUnique(props.form.channelPatterns, v)
  channelPatternInput.value = ''
}

function resetDraftInputs() {
  ruleInput.value = ''
  keyPatternInput.value = ''
  channelPatternInput.value = ''
}

/** 至少保留一条，避免保存时后端 empty → allkeys / resetchannels */
function removeKeyPattern(item: string) {
  if (props.form.keyPatterns.length <= 1) {
    meWarn(t('redisACL.keyPatternsRequired'))
    return
  }
  props.form.keyPatterns = props.form.keyPatterns.filter(v => v !== item)
}

function removeChannelPattern(item: string) {
  if (props.form.channelPatterns.length <= 1) {
    meWarn(t('redisACL.channelPatternsRequired'))
    return
  }
  props.form.channelPatterns = props.form.channelPatterns.filter(v => v !== item)
}

watch(visible, open => {
  if (open) resetDraftInputs()
})
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'add' ? t('redisACL.addUser') : t('redisACL.editUser')"
    width="800px"
    class="acl-edit-dialog"
    append-to-body
    align-center
    :close-on-press-escape="false"
    draggable>
    <el-form label-position="right" label-width="auto" class="acl-form">
      <!-- 用户行：左输入 + 右启用开关；field-inline-trail 固定宽保证与密码行对齐 -->
      <el-form-item :label="t('redisACL.username')">
        <div class="field-inline-row">
          <el-input
            v-model="props.form.username"
            :disabled="mode === 'edit'"
            clearable
            :placeholder="t('redisACL.usernamePlaceholder')"
            class="base-input">
          </el-input>
          <div class="field-inline-trail">
            <div class="field-inline-action">
              <span>{{ t('redisACL.enableSwitch') }}</span>
              <el-switch v-model="props.form.enabled" />
            </div>
          </div>
        </div>
      </el-form-item>

      <el-form-item :label="t('redisACL.password')">
        <div class="field-inline-row">
          <el-input
            v-model="props.form.password"
            show-password
            clearable
            :placeholder="t('redisACL.passwordPlaceholder')"
            class="base-input">
          </el-input>
          <div class="field-inline-trail">
            <el-button @click="emit('generatePassword')">{{ t('redisACL.genPassword') }}</el-button>
          </div>
        </div>
      </el-form-item>

      <el-row :gutter="12">
        <el-col :span="16">
          <el-form-item :label="t('redisACL.quickPreset')">
            <div class="preset-row">
              <el-button @click="applyPreset('normal')">{{ t('redisACL.presetNormal') }}</el-button>
              <el-button @click="applyPreset('readonly')">{{
                t('redisACL.presetReadonly')
              }}</el-button>
              <el-button @click="applyPreset('admin')">{{ t('redisACL.presetAdmin') }}</el-button>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <!-- dangerousBlocked 实际读写 RedisACL 里 form.commandRules 的 -@dangerous -->
          <el-form-item class="no-label-right">
            <div class="danger-row">
              <span>{{ t('redisACL.dangerousBlacklist') }}</span>
              <el-switch v-model="dangerousBlocked" />
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 命令规则可删至空（后端 nocommands）；键/频道至少保留一条 -->
      <el-form-item :label="t('redisACL.commandRules')">
        <div class="rule-box command-rule-box">
          <div class="pattern-tags command-tags">
            <el-tag
              v-for="item in props.form.commandRules"
              :key="item"
              closable
              disable-transitions
              style="margin: 0 6px 0 0"
              @close="props.form.commandRules = props.form.commandRules.filter(v => v !== item)">
              {{ item }}
            </el-tag>
          </div>
          <div class="command-input-row">
            <el-input
              v-model="ruleInput"
              :placeholder="t('redisACL.rulePlaceholder')"
              class="pattern-input" />
            <el-button class="add-item-btn" @click="addRule">{{ t('redisACL.addRule') }}</el-button>
          </div>
        </div>
      </el-form-item>

      <el-form-item :label="t('redisACL.keyPatterns')">
        <div class="rule-box">
          <div class="pattern-row">
            <div class="pattern-tags">
              <el-tag
                v-for="item in props.form.keyPatterns"
                :key="item"
                closable
                disable-transitions
                style="margin: 0 6px 0 0"
                @close="removeKeyPattern(item)">
                ~{{ item }}
              </el-tag>
            </div>
            <el-input
              v-model="keyPatternInput"
              :placeholder="t('redisACL.keyPatternPlaceholder')"
              class="pattern-input" />
            <el-button class="add-item-btn" @click="addKeyPattern">{{
              t('redisACL.addPattern')
            }}</el-button>
          </div>
        </div>
      </el-form-item>

      <el-form-item :label="t('redisACL.channelPatterns')">
        <div class="rule-box">
          <div class="pattern-row">
            <div class="pattern-tags">
              <el-tag
                v-for="item in props.form.channelPatterns"
                :key="item"
                closable
                disable-transitions
                style="margin: 0 6px 0 0"
                @close="removeChannelPattern(item)">
                &{{ item }}
              </el-tag>
            </div>
            <el-input
              v-model="channelPatternInput"
              :placeholder="t('redisACL.channelPatternPlaceholder')"
              class="pattern-input" />
            <el-button class="add-item-btn" @click="addChannelPattern">{{
              t('redisACL.addPattern')
            }}</el-button>
          </div>
        </div>
      </el-form-item>

      <el-form-item :label="t('redisACL.preview')">
        <!-- 点击复制完整 ACL SETUSER 预览，保存前可核对 -->
        <el-text class="preview-text" @click="meCopy(props.previewCommand)">{{
          props.previewCommand
        }}</el-text>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">{{ t('cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="emit('save')">{{ t('save') }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.rule-box {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 8px;
}

.password-row,
.preset-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.base-input {
  flex: 1;
  min-width: 0;
  width: auto;
}

.field-inline-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.acl-form {
  // 用户/密码行右侧区域统一宽度，保证两行输入框对齐
  --field-inline-trail-width: 6.5rem;
}

.field-inline-trail {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 0 0 var(--field-inline-trail-width);
  width: var(--field-inline-trail-width);
}

.field-inline-action {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.acl-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.acl-edit-dialog :deep(.el-dialog__body) {
  padding-top: 14px;
  padding-bottom: 10px;
}

.danger-row {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: flex-end;
  gap: 8px;
  white-space: nowrap;
}

.no-label-right :deep(.el-form-item__content) {
  justify-content: flex-end;
}

.pattern-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.pattern-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 72px;
  flex: 1;
  overflow-x: hidden;
  overflow-y: hidden;
  white-space: nowrap;
}

.pattern-input {
  width: 200px;
}

.add-item-btn {
  flex-shrink: 0;
  width: 108px;
}

.command-rule-box {
  min-height: 108px;
}

.command-tags {
  min-height: 54px;
  align-items: flex-start;
  flex-wrap: wrap;
  overflow: visible;
  white-space: normal;
}

.command-input-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.preview-text {
  color: var(--el-color-primary);
  cursor: pointer;
  word-break: break-all;
}
</style>
