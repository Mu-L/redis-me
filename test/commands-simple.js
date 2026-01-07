import json from './commands.json' with {type: 'json'}

// redis仓库查询所有命令, 转换为简单的JSON格式, 用于终端提示
// 说明: 虽然可以直接执行command命令从服务器获取，但国际化需额外处理，因此仍然使用本地数据
// https://github.com/redis/redis/tree/unstable/src/commands
// https://raw.githubusercontent.com/redis/redis-doc/refs/heads/master/commands.json

const result = []

// 遍历原始 JSON 对象
for (const [commandName, commandData] of Object.entries(json)) {
  const {group, summary, since} = commandData

  // 查找或创建对应的组
  let groupObj = result.find(item => item.group === group)
  if (!groupObj) {
    groupObj = {
      group: group,
      commands: []
    }
    result.push(groupObj)
  }

  // 添加命令到对应组
  groupObj.commands.push({
    name: commandName,
    summary: summary,
    summaryZh: 'TODO',
    since: since
  })
}

// group排序
const groupOrders = ['generic', 'string', 'hash', 'list', 'set', 'sorted-set', 'stream', 'hyperloglog', 'geo', 'bitmap', 'cluster', 'connection', 'pubsub', 'transactions', 'scripting', 'server']
// 按照预定义顺序对结果进行排序
result.sort((a, b) => {
  const indexA = groupOrders.indexOf(a.group)
  const indexB = groupOrders.indexOf(b.group)
  return indexA - indexB
})
console.log(JSON.stringify(result, null, 2))