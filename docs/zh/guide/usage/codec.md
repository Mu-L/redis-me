# 自定义编解码

[RedisME](https://www.hepengju.com) 支持通过外部脚本自定义序列化/反序列化，便于查看与编辑非 UTF-8 或业务自定义格式的数据。

## 入口与配置

1. 打开值详情页
2. 在 **数据编码** 下拉框右侧点击 **编辑** 图标，打开「自定义编解码」对话框
3. 添加一项：
   - **名称**：显示在下拉列表中
   - **命令**：含解释器的完整可执行命令（见下文）

![](../../../public/images/codec/main.png)

## 脚本协议

应用会在你配置的命令后**自动追加两个参数**：

```bash
# 读：Redis 原始字节（wire base64）→ 编辑器展示文本
{command} decode {wire_base64}

# 写：编辑器文本 → Redis 原始字节（wire base64）
{command} encode {editor_text_utf8_base64}
```

| 方向       | 参数 1   | 参数 2                         | stdout                         |
| ---------- | -------- | ------------------------------ | ------------------------------ |
| **decode** | `decode` | Redis 原始字节的 Base64        | UTF-8 文本（写入编辑器）       |
| **encode** | `encode` | 编辑区文本的 UTF-8 字节 Base64 | **单行** Redis 原始字节 Base64 |

约定：

- 参数 2 由应用加引号后传给 shell，脚本用 `sys.argv[2]`（Python）或 `process.argv[3]`（Node，因 `argv[1]` 为脚本路径）读取即可
- **decode** 成功：stdout 输出可编辑文本；**encode** 成功：stdout 仅一行 Base64
- 失败：stderr 输出错误信息，非 0 退出码；应用会在错误提示中附上实际执行的完整命令

## 命令配置示例

```
python C:\path\to\codec.py
node /path/to/codec.js
```

::: tip stdout 编码
应用按 **UTF-8** 读取脚本 stdout。Windows 上 Python 建议在脚本内设置 `sys.stdout.reconfigure(encoding='utf-8')`（见下方示例）。
:::

## 使用流程

1. 配置好自定义编解码并保存
2. 在 **数据编码** 下拉中选择你的自定义项
3. 值区显示 decode 后的文本，编辑后点击 **保存**
4. 可在配置对话框中用 **测试解码 / 测试编码** 验证脚本（样例 Base64 默认 `aGVsbG8=`，即 `hello`）

## 适用范围与限制

- **目前仅支持 String 类型**
- 单次执行默认超时 30 秒
- 超大值可能受命令行长度限制

## 示例：Python（脚本模拟Base64编解码）

透传 UTF-8 文本，适合验证协议或简单文本场景。

```python
import sys
import base64

# Windows 管道输出默认可能是 GBK，RedisME 按 UTF-8 读取
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

mode, b64 = sys.argv[1], sys.argv[2]
if mode == 'decode':
    print(base64.b64decode(b64).decode('utf-8', errors='replace'))
elif mode == 'encode':
    text = base64.b64decode(b64).decode('utf-8')
    print(base64.b64encode(text.encode('utf-8')).decode('ascii'))
```

配置命令示例：

```
C:\path\to\python.exe C:\path\to\codec.py
```

## 示例：Node.js（脚本模拟Base64编解码）

```javascript
#!/usr/bin/env node
/** wire base64 ↔ UTF-8 文本（与 codec.py 协议一致） */
const mode = process.argv[2]
const b64 = process.argv[3]

if (mode === 'decode') {
  process.stdout.write(Buffer.from(b64, 'base64').toString('utf8'))
} else if (mode === 'encode') {
  const text = Buffer.from(b64, 'base64').toString('utf8')
  process.stdout.write(Buffer.from(text, 'utf8').toString('base64'))
} else {
  process.stderr.write(`unknown mode: ${mode}\n`)
  process.exit(1)
}
```

配置命令示例：

```
node C:\path\to\codec.js
```

## 故障排查

| 现象                          | 常见原因                                                          |
| ----------------------------- | ----------------------------------------------------------------- |
| `invalid utf-8 sequence`      | 脚本 stdout 非 UTF-8（Windows 中文输出）                          |
| `Illegal base64 character 22` | 经 `.cmd` 转发时引号传入脚本；bat 内用 `%~1 %~2` 或脚本内去掉 `"` |
| 找不到 python / java          | PATH 无解释器 → 改用 **完整路径**                                 |
| 解码结果为空                  | 脚本 decode 未向 stdout 输出，或退出码非 0                        |

错误提示中会包含 **执行命令** 一行，可复制到终端对照调试。

![](../../../public/images/codec/error.png)
