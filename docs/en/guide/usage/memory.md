# Memory Analysis

The memory analysis feature in [RedisME](https://www.hepengju.com) is built on the Redis `MEMORY USAGE` command, which helps you find large keys.

## Feature Overview

- **Large key scan**: Analyze keys that match your criteria and show type, name, size, and more; supports fuzzy matching.
- **Large key actions**: Copy key names, view values, delete keys, and batch-delete multiple selected keys.
- **Scan tuning**: Fine-grained options for batch size per scan, delay between scan rounds, maximum keys to scan, and related parameters.
- **Folder quick memory analysis**: Right-click a key folder in the left sidebar to quickly analyze memory usage of keys under that folder.

![main.png](../../../public/images/memory/main.png)
![param.png](../../../public/images/memory/param.png)
![folder.png](../../../public/images/memory/folder.png)
