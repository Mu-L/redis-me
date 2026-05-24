# Custom Codec

[RedisME](https://www.hepengju.com) supports custom serialization/deserialization via external scripts, so you can view and edit non–UTF-8 or application-specific payloads.

## Entry and setup

1. Open the value detail view
2. Click the **edit** icon next to the **encoding** dropdown to open the **Custom Codec** dialog
3. Add an entry:
   - **Name** — shown in the dropdown
   - **Command** — full executable command including the interpreter (see below)

![](../../../public/images/codec/main.png)

## Script protocol

The app appends **two arguments** after your command:

```bash
# Read: Redis raw bytes (wire base64) → editor text
{command} decode {wire_base64}

# Write: editor text → Redis raw bytes (wire base64)
{command} encode {editor_text_utf8_base64}
```

| Direction  | Arg 1    | Arg 2                                | stdout                                    |
| ---------- | -------- | ------------------------------------ | ----------------------------------------- |
| **decode** | `decode` | Base64 of raw Redis bytes            | UTF-8 text (shown in the editor)          |
| **encode** | `encode` | Base64 of editor text as UTF-8 bytes | **Single line** Base64 of raw Redis bytes |

Notes:

- Arg 2 is quoted by the app for the shell; read it with `sys.argv[2]` (Python) or `process.argv[3]` (Node — `argv[1]` is the script path)
- On **decode** success, stdout is editable text; on **encode** success, stdout is a single Base64 line
- On failure, write to stderr and use a non-zero exit code; the app shows the full executed command in the error message

## Command examples

```
python C:\path\to\codec.py
node /path/to/codec.js
```

::: tip stdout encoding
The app reads stdout as **UTF-8**. On Windows, Python scripts should call `sys.stdout.reconfigure(encoding='utf-8')` (see samples below).
:::

## Workflow

1. Configure and save your custom codec entry
2. Select it from the **encoding** dropdown
3. The value area shows decoded text; edit and click **Save**
4. Use **Test Decode / Test Encode** in the dialog to verify your script (default sample Base64 is `aGVsbG8=`, i.e. `hello`)

## Scope and limits

- **String type only** for now
- Default execution timeout is 30 seconds
- Very large values may hit command-line length limits

## Sample: Python (Base64 codec simulated in script)

Pass-through UTF-8 text — useful for verifying the protocol or simple text scenarios.

```python
import sys
import base64

# Windows pipe output may default to GBK; RedisME reads stdout as UTF-8
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

Command example:

```
C:\path\to\python.exe C:\path\to\codec.py
```

## Sample: Node.js (Base64 codec simulated in script)

```javascript
#!/usr/bin/env node
/** wire base64 ↔ UTF-8 text (same protocol as codec.py) */
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

Command example:

```
node C:\path\to\codec.js
```

## Troubleshooting

| Symptom                       | Likely cause                                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| `invalid utf-8 sequence`      | Script stdout is not UTF-8 (e.g. Chinese output on Windows)                                         |
| `Illegal base64 character 22` | Quotes passed through a `.cmd` wrapper — use `%~1 %~2` in the batch file or strip `"` in the script |
| python / java not found       | Interpreter not on PATH — use the **full path**                                                     |
| Empty decode                  | Script did not write to stdout on decode, or exit code is non-zero                                  |

The error message includes the **executed command** line for copy/paste into a terminal.

![](../../../public/images/codec/error.png)
