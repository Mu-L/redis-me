<script setup>
import { nanoid } from 'nanoid'
import { computed } from 'vue'
// 共享数据
import { useI18n } from 'vue-i18n'

import KeyTypeTag from './KeyTypeTag.vue'

const { t } = useI18n()
const share = inject('share')
const canEdit = computed(() => !share.readonly)

const emit = defineEmits([
  'chooseKey',
  'chooseFolder',
  'contextKey',
  'contextFolder',
  'checkChange',
])
const { filterKeyList, showCheckbox, keyShowTree, sortByCount } = defineProps({
  color: { type: String, default: 'var(--el-color-primary)' },
  redisKey: { type: Object, default: null },
  filterKeyList: { type: Array, default: [] },
  showCheckbox: { type: Boolean, default: false }, // 是否显示树形节点的复选框
  keyShowTree: { type: Boolean, default: true }, // 列表或者树形
  sortByCount: { type: Boolean, default: true }, // 文件夹按照键数量排序 或 字母顺序
})

// 左键点击
function nodeClick(_data, node) {
  if (node.isLeaf) {
    emit('chooseKey', node.data.redisKey)
  } else {
    emit('chooseFolder', node.key)
  }
}

// 右键点击
const contextMenuNode = ref({})
const meContextRef = useTemplateRef('meContextRef')

function nodeContextMenu(e, _data, node) {
  // db0根节点不显示上下文
  if (node.data.isRootNode) return
  contextMenuNode.value = node
  meContextRef.value.showMenu(e)
}

function handleCommand(command) {
  if (contextMenuNode.value.isLeaf) {
    const redisKey = contextMenuNode.value.data.redisKey
    emit('contextKey', command, redisKey)
  } else {
    const folder = contextMenuNode.value.key
    emit('contextFolder', command, folder)
  }
}

function handleClose() {
  contextMenuNode.value = {}
}

// 右键选中的键, 加入样式
function getNodeClass(node) {
  const clazz = []
  if (
    (node.isLeaf && node.data.redisKey?.key === contextMenuNode.value?.data?.redisKey?.key) ||
    (!node.isLeaf && node.key == contextMenuNode.value?.key)
  ) {
    clazz.push('context-key')
  }

  // 列表展示时左侧的空白较多处理
  if (!keyShowTree && !showCheckbox && node.isLeaf) {
    clazz.push('list-key')
  }
  return clazz
}

// 计算树的数据
const emptyText = computed(() => t('keyTree.noData'))
const treeData = computed(() => {
  // 列表展示
  if (!keyShowTree) {
    return buildList(filterKeyList)
  }

  // 树形展示
  const root = buildTree(filterKeyList)
  root.forEach(node => countLeaves(node))

  // 根节点排序及其子节点排序
  root.sort((n1, n2) => nodesSort(n1, n2))
  root.forEach(node => sortNodeChildrenLoop(node))
  return root
})

// 循环方式排序节点的子节点（避免递归栈溢出）
function sortNodeChildrenLoop(rootNode) {
  // 初始化一个栈，将根节点压入栈中
  const stack = [rootNode]
  while (stack.length > 0) {
    // 取出栈顶节点
    const node = stack.pop()
    if (node.children && node.children.length > 0) {
      // 对当前节点的子节点进行排序
      node.children.sort((n1, n2) => nodesSort(n1, n2))
      // 将所有子节点压入栈中，以便后续处理
      node.children.forEach(child => stack.push(child))
    }
  }
}

function nodesSort(n1, n2) {
  if (sortByCount) {
    // 文件夹在上面，叶子在下面（将叶子节点的数量归零，避免和只有1个键的文件夹混在一起）
    const n1Count = n1.children.length > 0 ? n1.keyCount : 0
    const n2Count = n2.children.length > 0 ? n2.keyCount : 0
    // 文件夹按照键数量排序, 键数量相同时按照名称排序
    return n2Count - n1Count === 0 ? (n2.id > n1.id ? -1 : 1) : n2Count - n1Count
  } else {
    // 保存文件夹在上面，叶子在下面（文件夹的数量为都设置为1）
    const n1Count = n1.children.length > 0 ? 1 : 0
    const n2Count = n2.children.length > 0 ? 1 : 0
    // 文件夹按照名称排序
    return n2Count - n1Count === 0 ? (n2.id > n1.id ? -1 : 1) : n2Count - n1Count
  }
}

// 显示复选框时补充根节点
const rootId = nanoid() + Date.now()
const treeRef = useTemplateRef('tree')
const defaultExpandedKeys = computed(() => [rootId])
watch(
  () => [showCheckbox, filterKeyList],
  () => {
    treeRef.value?.setCheckedKeys([])
  },
)
const rootTreeData = computed(() => {
  if (showCheckbox) {
    return [
      {
        id: rootId,
        label: 'db' + share.conn?.db,
        children: treeData.value,
        keyCount: filterKeyList.length || 0,
        isRootNode: true,
      },
    ]
  } else {
    return treeData.value
  }
})

// 构建树：这个方法是由AI（豆包）生成的，非常不赖！ 但由BUG，还得亲自修复边界问题
function buildTree(keyList) {
  const root = []
  keyList.forEach(rk => {
    const parts = rk.key.split(/:+/)
    let nowLevel = root
    parts.forEach((part, index) => {
      // 叶子节点显示全称且保存原始值
      // hepengju 这种键直接返回
      if (index === parts.length - 1) {
        // 叶子节点显示全称且保存原始值
        let node = { id: 'leaf-' + rk.key, label: rk.key, children: [], redisKey: rk }
        nowLevel.push(node)
        return
      }

      // hepengju:
      // hepengju:string
      let node = nowLevel.find(item => item.label === part && item.redisKey === undefined) // 此处过滤去掉上面的叶子节点
      if (!node) {
        // 避免叶子节点的id与部分非叶子节点一致
        node = { id: parts.slice(0, index + 1).join(':'), label: part, children: [] }
        nowLevel.push(node)
      }
      nowLevel = node.children
    })
  })
  return root
}

// 统计叶子节点个数: 循环方式（豆包）  ==> 递归方式在数据量比较大时会栈溢出
function countLeaves(node) {
  // 初始化一个栈，将根节点压入栈中
  const stack = [node]
  // 用于存储每个节点的叶子节点数量
  const keyCounts = new Map()

  while (stack.length > 0) {
    // 取出栈顶节点
    const nowNode = stack[stack.length - 1]

    // 如果当前节点的所有子节点都已经处理过
    if (nowNode.children.every(child => keyCounts.has(child))) {
      // 弹出栈顶节点
      stack.pop()
      if (nowNode.children.length === 0) {
        // 如果是叶子节点，叶子数量为 1
        keyCounts.set(nowNode, 1)
      } else {
        // 计算当前节点的叶子节点数量，等于所有子节点叶子节点数量之和
        let keyCount = 0
        nowNode.children.forEach(child => {
          keyCount += keyCounts.get(child)
        })
        keyCounts.set(nowNode, keyCount)
      }
      // 将计算好的叶子节点数量赋值给节点的 keyCount 属性
      nowNode.keyCount = keyCounts.get(nowNode)
    } else {
      // 如果当前节点的子节点还有未处理的，将未处理的子节点压入栈中
      nowNode.children.forEach(child => {
        if (!keyCounts.has(child)) {
          stack.push(child)
        }
      })
    }
  }
  // 返回根节点的叶子节点数量
  return keyCounts.get(node)
}

// 构建树: 仅仅叶子节点（即List显示）
function buildList(keyList) {
  return keyList.map(rk => ({ id: 'leaf-' + rk.key, label: rk.key, children: [], redisKey: rk }))
}

// 获取选中的节点键
function checkChange() {
  emit(
    'checkChange',
    treeRef.value.getCheckedNodes(true).map(node => node.redisKey),
  )
}
</script>

<template>
  <el-auto-resizer>
    <template #default="{ height }">
      <el-tree-v2
        ref="tree"
        :data="rootTreeData"
        :default-expanded-keys="defaultExpandedKeys"
        @check-change="checkChange"
        @node-click="nodeClick"
        @node-contextmenu="nodeContextMenu"
        highlight-current
        :style="{
          '--el-text-color-regular': color,
          '--el-tree-node-hover-bg-color': 'var(--el-color-info-light-8)',
        }"
        :empty-text="emptyText"
        :height="height"
        :item-size="20"
        :show-checkbox="showCheckbox">
        <template #default="{ node }">
          <div style="width: 100%" v-if="node.isLeaf" :class="getNodeClass(node)">
            <Suspense>
              <template #default>
                <KeyTypeTag :conn-id="share.conn.id" :redis-key="node.data.redisKey" />
              </template>
              <template #fallback>
                <el-tag size="small" disable-transitions type="info" effect="dark">?</el-tag>
              </template>
            </Suspense>
            {{ node.label }}
          </div>
          <div class="me-flex" v-else style="width: 100%" :class="getNodeClass(node)">
            <me-icon
              :name="node.label"
              :icon="
                node.data.isRootNode
                  ? 'me-icon-db'
                  : node.expanded
                    ? 'el-icon-folderOpened'
                    : 'el-icon-folder'
              " />
            <div style="color: var(--el-color-info); margin-right: 10px">
              [ {{ node.data.keyCount }} ]
            </div>
          </div>
        </template>
      </el-tree-v2>

      <!-- 右键菜单 -->
      <me-context ref="meContextRef" @handle-command="handleCommand" @handle-close="handleClose">
        <template v-if="contextMenuNode.isLeaf">
          <el-dropdown-item command="addKey" v-if="canEdit"
            ><me-icon icon="el-icon-circle-plus" :name="t('keyTree.addKey')"
          /></el-dropdown-item>
          <el-dropdown-item command="refreshKey"
            ><me-icon icon="el-icon-refresh" :name="t('keyTree.refreshKey')"
          /></el-dropdown-item>
          <el-dropdown-item command="copyKey"
            ><me-icon icon="el-icon-document-copy" :name="t('keyTree.copyKey')"
          /></el-dropdown-item>
          <el-dropdown-item command="renameKey"
            ><me-icon icon="el-icon-edit" :name="t('keyList.renameKey')"
          /></el-dropdown-item>
          <el-dropdown-item command="deleteKey" divided v-if="canEdit"
            ><me-icon icon="el-icon-delete" :name="t('keyTree.deleteKey')"
          /></el-dropdown-item>
        </template>
        <template v-else>
          <el-dropdown-item command="addKey" v-if="canEdit"
            ><me-icon icon="el-icon-circle-plus" :name="t('keyTree.addKey')"
          /></el-dropdown-item>
          <el-dropdown-item command="copyFolder"
            ><me-icon icon="el-icon-document-copy" :name="t('keyTree.copyFolder')"
          /></el-dropdown-item>
          <el-dropdown-item command="loadFolder" divided
            ><me-icon icon="el-icon-search" :name="t('keyTree.loadFolder')"
          /></el-dropdown-item>
          <el-dropdown-item command="memoryUsage"
            ><me-icon icon="me-icon-memory" :name="t('keyTree.memoryUsage')"
          /></el-dropdown-item>
          <el-dropdown-item command="exportFolder" divided :disabled="share.exportImporting"
            ><me-icon icon="el-icon-upload" :name="t('keyTree.exportFolder')"
          /></el-dropdown-item>
          <el-dropdown-item command="deleteFolder" v-if="canEdit" :disabled="share.exportImporting"
            ><me-icon icon="el-icon-delete" :name="t('keyTree.deleteFolder')"
          /></el-dropdown-item>
        </template>
      </me-context>
    </template>
  </el-auto-resizer>
</template>

<style scoped lang="scss">
/* 高亮当前行的颜色 */
:deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
  background-color: var(--el-color-info-light-8);
}

/* 右键选中的键 */
:deep(.context-key) {
  outline: 1px dashed var(--el-color-primary);
  outline-offset: 1px;
}

/* 列表展示时左侧空白处理 */
:deep(.list-key) {
  margin-left: -20px;
}

/*  键类型TAG设置 */
:deep(.el-tag--small) {
  height: 16px;
  width: 16px;
  padding: 0 4px;

  font-size: 10px;
}
</style>
