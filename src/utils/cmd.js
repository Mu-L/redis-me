export const commands =
[
  {
    "group": "generic",
    "commands": [
      {
        "name": "COPY",
        "summary": "Copies the value of a key to a new key",
        "summaryZh": "将键的值复制到新键",
        "since": "6.2.0"
      },
      {
        "name": "DEL",
        "summary": "Deletes one or more keys",
        "summaryZh": "删除一个或多个键",
        "since": "1.0.0"
      },
      {
        "name": "DUMP",
        "summary": "Returns a serialized representation of the value stored at a key",
        "summaryZh": "返回存储在键中的值的序列化表示",
        "since": "2.6.0"
      },
      {
        "name": "EXISTS",
        "summary": "Determines whether one or more keys exist",
        "summaryZh": "确定一个或多个键是否存在",
        "since": "1.0.0"
      },
      {
        "name": "EXPIRE",
        "summary": "Sets the expiration time of a key in seconds",
        "summaryZh": "设置键的过期时间（秒）",
        "since": "1.0.0"
      },
      {
        "name": "EXPIREAT",
        "summary": "Sets the expiration time of a key to a Unix timestamp",
        "summaryZh": "将键的过期时间设置为Unix时间戳",
        "since": "1.2.0"
      },
      {
        "name": "EXPIRETIME",
        "summary": "Returns the expiration time of a key as a Unix timestamp",
        "summaryZh": "返回键的过期时间作为Unix时间戳",
        "since": "7.0.0"
      },
      {
        "name": "KEYS",
        "summary": "Returns all key names that match a pattern",
        "summaryZh": "返回所有匹配模式的键名",
        "since": "1.0.0"
      },
      {
        "name": "MIGRATE",
        "summary": "Atomically transfers a key from one Redis instance to another",
        "summaryZh": "原子地将键从一个Redis实例传输到另一个",
        "since": "2.6.0"
      },
      {
        "name": "MOVE",
        "summary": "Moves a key to another database",
        "summaryZh": "将键移动到另一个数据库",
        "since": "1.0.0"
      },
      {
        "name": "OBJECT",
        "summary": "A container for object introspection commands",
        "summaryZh": "对象内省命令的容器",
        "since": "2.2.3"
      },
      {
        "name": "OBJECT ENCODING",
        "summary": "Returns the internal encoding of a Redis object",
        "summaryZh": "返回Redis对象的内部编码",
        "since": "2.2.3"
      },
      {
        "name": "OBJECT FREQ",
        "summary": "Returns the logarithmic access frequency counter of a Redis object",
        "summaryZh": "返回Redis对象的对数访问频率计数器",
        "since": "4.0.0"
      },
      {
        "name": "OBJECT HELP",
        "summary": "Returns helpful text about the different subcommands",
        "summaryZh": "返回关于不同子命令的帮助文本",
        "since": "6.2.0"
      },
      {
        "name": "OBJECT IDLETIME",
        "summary": "Returns the time since the last access to a Redis object",
        "summaryZh": "返回自上次访问Redis对象以来的时间",
        "since": "2.2.3"
      },
      {
        "name": "OBJECT REFCOUNT",
        "summary": "Returns the reference count of a value of a key",
        "summaryZh": "返回键值的引用计数",
        "since": "2.2.3"
      },
      {
        "name": "PERSIST",
        "summary": "Removes the expiration time of a key",
        "summaryZh": "移除键的过期时间",
        "since": "2.2.0"
      },
      {
        "name": "PEXPIRE",
        "summary": "Sets the expiration time of a key in milliseconds",
        "summaryZh": "设置键的过期时间（毫秒）",
        "since": "2.6.0"
      },
      {
        "name": "PEXPIREAT",
        "summary": "Sets the expiration time of a key to a Unix milliseconds timestamp",
        "summaryZh": "将键的过期时间设置为Unix毫秒时间戳",
        "since": "2.6.0"
      },
      {
        "name": "PEXPIRETIME",
        "summary": "Returns the expiration time of a key as a Unix milliseconds timestamp",
        "summaryZh": "返回键的过期时间作为Unix毫秒时间戳",
        "since": "7.0.0"
      },
      {
        "name": "PTTL",
        "summary": "Returns the expiration time in milliseconds of a key",
        "summaryZh": "返回键的过期时间（毫秒）",
        "since": "2.6.0"
      },
      {
        "name": "RANDOMKEY",
        "summary": "Returns a random key name from the database",
        "summaryZh": "从数据库返回一个随机键名",
        "since": "1.0.0"
      },
      {
        "name": "RENAME",
        "summary": "Renames a key and overwrites the destination",
        "summaryZh": "重命名键并覆盖目标",
        "since": "1.0.0"
      },
      {
        "name": "RENAMENX",
        "summary": "Renames a key only when the target key name doesn't exist",
        "summaryZh": "仅当目标键名不存在时重命名键",
        "since": "1.0.0"
      },
      {
        "name": "RESTORE",
        "summary": "Creates a key from the serialized representation of a value",
        "summaryZh": "从值的序列化表示创建键",
        "since": "2.6.0"
      },
      {
        "name": "SCAN",
        "summary": "Iterates over the key names in the database",
        "summaryZh": "迭代数据库中的键名",
        "since": "2.8.0"
      },
      {
        "name": "SORT",
        "summary": "Sorts the elements in a list, a set, or a sorted set, optionally storing the result",
        "summaryZh": "对列表、集合或有序集合中的元素进行排序，可选地存储结果",
        "since": "1.0.0"
      },
      {
        "name": "SORT_RO",
        "summary": "Returns the sorted elements of a list, a set, or a sorted set",
        "summaryZh": "返回列表、集合或有序集合的排序元素",
        "since": "7.0.0"
      },
      {
        "name": "TOUCH",
        "summary": "Returns the number of existing keys out of those specified after updating the time they were last accessed",
        "summaryZh": "在更新最后访问时间后，返回指定键中存在的键的数量",
        "since": "3.2.1"
      },
      {
        "name": "TTL",
        "summary": "Returns the expiration time in seconds of a key",
        "summaryZh": "返回键的过期时间（秒）",
        "since": "1.0.0"
      },
      {
        "name": "TYPE",
        "summary": "Determines the type of value stored at a key",
        "summaryZh": "确定存储在键中的值的类型",
        "since": "1.0.0"
      },
      {
        "name": "UNLINK",
        "summary": "Asynchronously deletes one or more keys",
        "summaryZh": "异步删除一个或多个键",
        "since": "4.0.0"
      },
      {
        "name": "WAIT",
        "summary": "Blocks until the asynchronous replication of all preceding write commands sent by the connection is completed",
        "summaryZh": "阻塞直到连接发送的所有先前写入命令的异步复制完成",
        "since": "3.0.0"
      },
      {
        "name": "WAITAOF",
        "summary": "Blocks until all of the preceding write commands sent by the connection are written to the append-only file of the master and/or replicas",
        "summaryZh": "阻塞直到连接发送的所有先前写入命令被写入主节点和/或副本的追加文件",
        "since": "7.2.0"
      }
    ]
  },
  {
    "group": "string",
    "commands": [
      {
        "name": "APPEND",
        "summary": "Appends a string to the value of a key. Creates the key if it doesn't exist",
        "summaryZh": "将字符串追加到键的值。如果键不存在则创建",
        "since": "2.0.0"
      },
      {
        "name": "DECR",
        "summary": "Decrements the integer value of a key by one. Uses 0 as initial value if the key doesn't exist",
        "summaryZh": "将键的整数值减一。如果键不存在则使用0作为初始值",
        "since": "1.0.0"
      },
      {
        "name": "DECRBY",
        "summary": "Decrements a number from the integer value of a key. Uses 0 as initial value if the key doesn't exist",
        "summaryZh": "从键的整数值中减去一个数。如果键不存在则使用0作为初始值",
        "since": "1.0.0"
      },
      {
        "name": "GET",
        "summary": "Returns the string value of a key",
        "summaryZh": "返回键的字符串值",
        "since": "1.0.0"
      },
      {
        "name": "GETDEL",
        "summary": "Returns the string value of a key after deleting the key",
        "summaryZh": "删除键后返回键的字符串值",
        "since": "6.2.0"
      },
      {
        "name": "GETEX",
        "summary": "Returns the string value of a key after setting its expiration time",
        "summaryZh": "设置键的过期时间后返回键的字符串值",
        "since": "6.2.0"
      },
      {
        "name": "GETRANGE",
        "summary": "Returns a substring of the string stored at a key",
        "summaryZh": "返回存储在键中的字符串的子字符串",
        "since": "2.4.0"
      },
      {
        "name": "GETSET",
        "summary": "Returns the previous string value of a key after setting it to a new value",
        "summaryZh": "将键设置为新值后返回键的先前字符串值",
        "since": "1.0.0"
      },
      {
        "name": "INCR",
        "summary": "Increments the integer value of a key by one. Uses 0 as initial value if the key doesn't exist",
        "summaryZh": "将键的整数值加一。如果键不存在则使用0作为初始值",
        "since": "1.0.0"
      },
      {
        "name": "INCRBY",
        "summary": "Increments the integer value of a key by a number. Uses 0 as initial value if the key doesn't exist",
        "summaryZh": "将键的整数值增加一个数。如果键不存在则使用0作为初始值",
        "since": "1.0.0"
      },
      {
        "name": "INCRBYFLOAT",
        "summary": "Increment the floating point value of a key by a number. Uses 0 as initial value if the key doesn't exist",
        "summaryZh": "将键的浮点值增加一个数。如果键不存在则使用0作为初始值",
        "since": "2.6.0"
      },
      {
        "name": "LCS",
        "summary": "Finds the longest common substring",
        "summaryZh": "查找最长公共子字符串",
        "since": "7.0.0"
      },
      {
        "name": "MGET",
        "summary": "Atomically returns the string values of one or more keys",
        "summaryZh": "原子地返回一个或多个键的字符串值",
        "since": "1.0.0"
      },
      {
        "name": "MSET",
        "summary": "Atomically creates or modifies the string values of one or more keys",
        "summaryZh": "原子地创建或修改一个或多个键的字符串值",
        "since": "1.0.1"
      },
      {
        "name": "MSETNX",
        "summary": "Atomically modifies the string values of one or more keys only when all keys don't exist",
        "summaryZh": "仅当所有键不存在时，原子地修改一个或多个键的字符串值",
        "since": "1.0.1"
      },
      {
        "name": "PSETEX",
        "summary": "Sets both string value and expiration time in milliseconds of a key. The key is created if it doesn't exist",
        "summaryZh": "设置键的字符串值和过期时间（毫秒）。如果键不存在则创建",
        "since": "2.6.0"
      },
      {
        "name": "SET",
        "summary": "Sets the string value of a key, ignoring its type. The key is created if it doesn't exist",
        "summaryZh": "设置键的字符串值，忽略其类型。如果键不存在则创建",
        "since": "1.0.0"
      },
      {
        "name": "SETEX",
        "summary": "Sets the string value and expiration time of a key. Creates the key if it doesn't exist",
        "summaryZh": "设置键的字符串值和过期时间。如果键不存在则创建",
        "since": "2.0.0"
      },
      {
        "name": "SETNX",
        "summary": "Set the string value of a key only when the key doesn't exist",
        "summaryZh": "仅当键不存在时设置键的字符串值",
        "since": "1.0.0"
      },
      {
        "name": "SETRANGE",
        "summary": "Overwrites a part of a string value with another by an offset. Creates the key if it doesn't exist",
        "summaryZh": "通过偏移量用另一个字符串覆盖字符串值的一部分。如果键不存在则创建",
        "since": "2.2.0"
      },
      {
        "name": "STRLEN",
        "summary": "Returns the length of a string value",
        "summaryZh": "返回字符串值的长度",
        "since": "2.2.0"
      },
      {
        "name": "SUBSTR",
        "summary": "Returns a substring from a string value",
        "summaryZh": "返回字符串值的子字符串",
        "since": "1.0.0"
      }
    ]
  },
  {
    "group": "hash",
    "commands": [
      {
        "name": "HDEL",
        "summary": "Deletes one or more fields and their values from a hash. Deletes the hash if no fields remain",
        "summaryZh": "从哈希中删除一个或多个字段及其值。如果没有字段剩余则删除哈希",
        "since": "2.0.0"
      },
      {
        "name": "HEXISTS",
        "summary": "Determines whether a field exists in a hash",
        "summaryZh": "确定字段是否存在于哈希中",
        "since": "2.0.0"
      },
      {
        "name": "HGET",
        "summary": "Returns the value of a field in a hash",
        "summaryZh": "返回哈希中字段的值",
        "since": "2.0.0"
      },
      {
        "name": "HGETALL",
        "summary": "Returns all fields and values in a hash",
        "summaryZh": "返回哈希中的所有字段和值",
        "since": "2.0.0"
      },
      {
        "name": "HINCRBY",
        "summary": "Increments the integer value of a field in a hash by a number. Uses 0 as initial value if the field doesn't exist",
        "summaryZh": "将哈希中字段的整数值增加一个数。如果字段不存在则使用0作为初始值",
        "since": "2.0.0"
      },
      {
        "name": "HINCRBYFLOAT",
        "summary": "Increments the floating point value of a field by a number. Uses 0 as initial value if the field doesn't exist",
        "summaryZh": "将字段的浮点值增加一个数。如果字段不存在则使用0作为初始值",
        "since": "2.6.0"
      },
      {
        "name": "HKEYS",
        "summary": "Returns all fields in a hash",
        "summaryZh": "返回哈希中的所有字段",
        "since": "2.0.0"
      },
      {
        "name": "HLEN",
        "summary": "Returns the number of fields in a hash",
        "summaryZh": "返回哈希中的字段数量",
        "since": "2.0.0"
      },
      {
        "name": "HMGET",
        "summary": "Returns the values of all fields in a hash",
        "summaryZh": "返回哈希中所有字段的值",
        "since": "2.0.0"
      },
      {
        "name": "HMSET",
        "summary": "Sets the values of multiple fields",
        "summaryZh": "设置多个字段的值",
        "since": "2.0.0"
      },
      {
        "name": "HRANDFIELD",
        "summary": "Returns one or more random fields from a hash",
        "summaryZh": "从哈希返回一个或多个随机字段",
        "since": "6.2.0"
      },
      {
        "name": "HSCAN",
        "summary": "Iterates over fields and values of a hash",
        "summaryZh": "迭代哈希的字段和值",
        "since": "2.8.0"
      },
      {
        "name": "HSET",
        "summary": "Creates or modifies the value of a field in a hash",
        "summaryZh": "创建或修改哈希中字段的值",
        "since": "2.0.0"
      },
      {
        "name": "HSETNX",
        "summary": "Sets the value of a field in a hash only when the field doesn't exist",
        "summaryZh": "仅当字段不存在时设置哈希中字段的值",
        "since": "2.0.0"
      },
      {
        "name": "HSTRLEN",
        "summary": "Returns the length of the value of a field",
        "summaryZh": "返回字段值的长度",
        "since": "3.2.0"
      },
      {
        "name": "HVALS",
        "summary": "Returns all values in a hash",
        "summaryZh": "返回哈希中的所有值",
        "since": "2.0.0"
      }
    ]
  },
  {
    "group": "list",
    "commands": [
      {
        "name": "BLMOVE",
        "summary": "Pops an element from a list, pushes it to another list and returns it. Blocks until an element is available otherwise. Deletes the list if the last element was moved",
        "summaryZh": "从一个列表弹出一个元素，将其推入另一个列表并返回它。否则阻塞直到元素可用。如果最后一个元素被移动则删除列表",
        "since": "6.2.0"
      },
      {
        "name": "BLMPOP",
        "summary": "Pops the first element from one of multiple lists. Blocks until an element is available otherwise. Deletes the list if the last element was popped",
        "summaryZh": "从多个列表中的一个弹出第一个元素。否则阻塞直到元素可用。如果最后一个元素被弹出则删除列表",
        "since": "7.0.0"
      },
      {
        "name": "BLPOP",
        "summary": "Removes and returns the first element in a list. Blocks until an element is available otherwise. Deletes the list if the last element was popped",
        "summaryZh": "移除并返回列表中的第一个元素。否则阻塞直到元素可用。如果最后一个元素被弹出则删除列表",
        "since": "2.0.0"
      },
      {
        "name": "BRPOP",
        "summary": "Removes and returns the last element in a list. Blocks until an element is available otherwise. Deletes the list if the last element was popped",
        "summaryZh": "移除并返回列表中的最后一个元素。否则阻塞直到元素可用。如果最后一个元素被弹出则删除列表",
        "since": "2.0.0"
      },
      {
        "name": "BRPOPLPUSH",
        "summary": "Pops an element from a list, pushes it to another list and returns it. Block until an element is available otherwise. Deletes the list if the last element was popped",
        "summaryZh": "从一个列表弹出一个元素，将其推入另一个列表并返回它。否则阻塞直到元素可用。如果最后一个元素被弹出则删除列表",
        "since": "2.2.0"
      },
      {
        "name": "LINDEX",
        "summary": "Returns an element from a list by its index",
        "summaryZh": "通过索引返回列表中的元素",
        "since": "1.0.0"
      },
      {
        "name": "LINSERT",
        "summary": "Inserts an element before or after another element in a list",
        "summaryZh": "在列表中的另一个元素之前或之后插入元素",
        "since": "2.2.0"
      },
      {
        "name": "LLEN",
        "summary": "Returns the length of a list",
        "summaryZh": "返回列表的长度",
        "since": "1.0.0"
      },
      {
        "name": "LMOVE",
        "summary": "Returns an element after popping it from one list and pushing it to another. Deletes the list if the last element was moved",
        "summaryZh": "从一个列表弹出元素并将其推入另一个列表后返回该元素。如果最后一个元素被移动则删除列表",
        "since": "6.2.0"
      },
      {
        "name": "LMPOP",
        "summary": "Returns multiple elements from a list after removing them. Deletes the list if the last element was popped",
        "summaryZh": "移除后返回列表中的多个元素。如果最后一个元素被弹出则删除列表",
        "since": "7.0.0"
      },
      {
        "name": "LPOP",
        "summary": "Returns the first elements in a list after removing it. Deletes the list if the last element was popped",
        "summaryZh": "移除后返回列表中的第一个元素。如果最后一个元素被弹出则删除列表",
        "since": "1.0.0"
      },
      {
        "name": "LPOS",
        "summary": "Returns the index of matching elements in a list",
        "summaryZh": "返回列表中匹配元素的索引",
        "since": "6.0.6"
      },
      {
        "name": "LPUSH",
        "summary": "Prepends one or more elements to a list. Creates the key if it doesn't exist",
        "summaryZh": "向列表 prepend 一个或多个元素。如果键不存在则创建",
        "since": "1.0.0"
      },
      {
        "name": "LPUSHX",
        "summary": "Prepends one or more elements to a list only when the list exists",
        "summaryZh": "仅当列表存在时向列表 prepend 一个或多个元素",
        "since": "2.2.0"
      },
      {
        "name": "LRANGE",
        "summary": "Returns a range of elements from a list",
        "summaryZh": "返回列表中的一个元素范围",
        "since": "1.0.0"
      },
      {
        "name": "LREM",
        "summary": "Removes elements from a list. Deletes the list if the last element was removed",
        "summaryZh": "从列表中移除元素。如果最后一个元素被移除则删除列表",
        "since": "1.0.0"
      },
      {
        "name": "LSET",
        "summary": "Sets the value of an element in a list by its index",
        "summaryZh": "通过索引设置列表中元素的值",
        "since": "1.0.0"
      },
      {
        "name": "LTRIM",
        "summary": "Removes elements from both ends a list. Deletes the list if all elements were trimmed",
        "summaryZh": "从列表两端移除元素。如果所有元素都被修剪则删除列表",
        "since": "1.0.0"
      },
      {
        "name": "RPOP",
        "summary": "Returns and removes the last elements of a list. Deletes the list if the last element was popped",
        "summaryZh": "返回并移除列表的最后一个元素。如果最后一个元素被弹出则删除列表",
        "since": "1.0.0"
      },
      {
        "name": "RPOPLPUSH",
        "summary": "Returns the last element of a list after removing and pushing it to another list. Deletes the list if the last element was popped",
        "summaryZh": "移除并将列表的最后一个元素推入另一个列表后返回该元素。如果最后一个元素被弹出则删除列表",
        "since": "1.2.0"
      },
      {
        "name": "RPUSH",
        "summary": "Appends one or more elements to a list. Creates the key if it doesn't exist",
        "summaryZh": "向列表追加一个或多个元素。如果键不存在则创建",
        "since": "1.0.0"
      },
      {
        "name": "RPUSHX",
        "summary": "Appends an element to a list only when the list exists",
        "summaryZh": "仅当列表存在时向列表追加元素",
        "since": "2.2.0"
      }
    ]
  },
  {
    "group": "set",
    "commands": [
      {
        "name": "SADD",
        "summary": "Adds one or more members to a set. Creates the key if it doesn't exist",
        "summaryZh": "向集合添加一个或多个成员。如果键不存在则创建",
        "since": "1.0.0"
      },
      {
        "name": "SCARD",
        "summary": "Returns the number of members in a set",
        "summaryZh": "返回集合中的成员数量",
        "since": "1.0.0"
      },
      {
        "name": "SDIFF",
        "summary": "Returns the difference of multiple sets",
        "summaryZh": "返回多个集合的差集",
        "since": "1.0.0"
      },
      {
        "name": "SDIFFSTORE",
        "summary": "Stores the difference of multiple sets in a key",
        "summaryZh": "将多个集合的差集存储在键中",
        "since": "1.0.0"
      },
      {
        "name": "SINTER",
        "summary": "Returns the intersect of multiple sets",
        "summaryZh": "返回多个集合的交集",
        "since": "1.0.0"
      },
      {
        "name": "SINTERCARD",
        "summary": "Returns the number of members of the intersect of multiple sets",
        "summaryZh": "返回多个集合交集的成员数量",
        "since": "7.0.0"
      },
      {
        "name": "SINTERSTORE",
        "summary": "Stores the intersect of multiple sets in a key",
        "summaryZh": "将多个集合的交集存储在键中",
        "since": "1.0.0"
      },
      {
        "name": "SISMEMBER",
        "summary": "Determines whether a member belongs to a set",
        "summaryZh": "确定成员是否属于集合",
        "since": "1.0.0"
      },
      {
        "name": "SMEMBERS",
        "summary": "Returns all members of a set",
        "summaryZh": "返回集合的所有成员",
        "since": "1.0.0"
      },
      {
        "name": "SMISMEMBER",
        "summary": "Determines whether multiple members belong to a set",
        "summaryZh": "确定多个成员是否属于集合",
        "since": "6.2.0"
      },
      {
        "name": "SMOVE",
        "summary": "Moves a member from one set to another",
        "summaryZh": "将成员从一个集合移动到另一个集合",
        "since": "1.0.0"
      },
      {
        "name": "SPOP",
        "summary": "Returns one or more random members from a set after removing them. Deletes the set if the last member was popped",
        "summaryZh": "移除后从集合返回一个或多个随机成员。如果最后一个成员被弹出则删除集合",
        "since": "1.0.0"
      },
      {
        "name": "SRANDMEMBER",
        "summary": "Get one or multiple random members from a set",
        "summaryZh": "从集合获取一个或多个随机成员",
        "since": "1.0.0"
      },
      {
        "name": "SREM",
        "summary": "Removes one or more members from a set. Deletes the set if the last member was removed",
        "summaryZh": "从集合中移除一个或多个成员。如果最后一个成员被移除则删除集合",
        "since": "1.0.0"
      },
      {
        "name": "SSCAN",
        "summary": "Iterates over members of a set",
        "summaryZh": "迭代集合的成员",
        "since": "2.8.0"
      },
      {
        "name": "SUNION",
        "summary": "Returns the union of multiple sets",
        "summaryZh": "返回多个集合的并集",
        "since": "1.0.0"
      },
      {
        "name": "SUNIONSTORE",
        "summary": "Stores the union of multiple sets in a key",
        "summaryZh": "将多个集合的并集存储在键中",
        "since": "1.0.0"
      }
    ]
  },
  {
    "group": "sorted-set",
    "commands": [
      {
        "name": "BZMPOP",
        "summary": "Removes and returns a member by score from one or more sorted sets. Blocks until a member is available otherwise. Deletes the sorted set if the last element was popped",
        "summaryZh": "通过分数从一个或多个有序集合中移除并返回成员。否则阻塞直到成员可用。如果最后一个元素被弹出则删除有序集合",
        "since": "7.0.0"
      },
      {
        "name": "BZPOPMAX",
        "summary": "Removes and returns the member with the highest score from one or more sorted sets. Blocks until a member available otherwise.  Deletes the sorted set if the last element was popped",
        "summaryZh": "从一个或多个有序集合中移除并返回分数最高的成员。否则阻塞直到成员可用。如果最后一个元素被弹出则删除有序集合",
        "since": "5.0.0"
      },
      {
        "name": "BZPOPMIN",
        "summary": "Removes and returns the member with the lowest score from one or more sorted sets. Blocks until a member is available otherwise. Deletes the sorted set if the last element was popped",
        "summaryZh": "从一个或多个有序集合中移除并返回分数最低的成员。否则阻塞直到成员可用。如果最后一个元素被弹出则删除有序集合",
        "since": "5.0.0"
      },
      {
        "name": "ZADD",
        "summary": "Adds one or more members to a sorted set, or updates their scores. Creates the key if it doesn't exist",
        "summaryZh": "向有序集合添加一个或多个成员，或更新它们的分数。如果键不存在则创建",
        "since": "1.2.0"
      },
      {
        "name": "ZCARD",
        "summary": "Returns the number of members in a sorted set",
        "summaryZh": "返回有序集合中的成员数量",
        "since": "1.2.0"
      },
      {
        "name": "ZCOUNT",
        "summary": "Returns the count of members in a sorted set that have scores within a range",
        "summaryZh": "返回有序集合中分数在范围内的成员数量",
        "since": "2.0.0"
      },
      {
        "name": "ZDIFF",
        "summary": "Returns the difference between multiple sorted sets",
        "summaryZh": "返回多个有序集合的差集",
        "since": "6.2.0"
      },
      {
        "name": "ZDIFFSTORE",
        "summary": "Stores the difference of multiple sorted sets in a key",
        "summaryZh": "将多个有序集合的差集存储在键中",
        "since": "6.2.0"
      },
      {
        "name": "ZINCRBY",
        "summary": "Increments the score of a member in a sorted set",
        "summaryZh": "增加有序集合中成员的分数",
        "since": "1.2.0"
      },
      {
        "name": "ZINTER",
        "summary": "Returns the intersect of multiple sorted sets",
        "summaryZh": "返回多个有序集合的交集",
        "since": "6.2.0"
      },
      {
        "name": "ZINTERCARD",
        "summary": "Returns the number of members of the intersect of multiple sorted sets",
        "summaryZh": "返回多个有序集合交集的成员数量",
        "since": "7.0.0"
      },
      {
        "name": "ZINTERSTORE",
        "summary": "Stores the intersect of multiple sorted sets in a key",
        "summaryZh": "将多个有序集合的交集存储在键中",
        "since": "2.0.0"
      },
      {
        "name": "ZLEXCOUNT",
        "summary": "Returns the number of members in a sorted set within a lexicographical range",
        "summaryZh": "返回有序集合中字典序范围内的成员数量",
        "since": "2.8.9"
      },
      {
        "name": "ZMPOP",
        "summary": "Returns the highest- or lowest-scoring members from one or more sorted sets after removing them. Deletes the sorted set if the last member was popped",
        "summaryZh": "移除后从一个或多个有序集合中返回分数最高或最低的成员。如果最后一个成员被弹出则删除有序集合",
        "since": "7.0.0"
      },
      {
        "name": "ZMSCORE",
        "summary": "Returns the score of one or more members in a sorted set",
        "summaryZh": "返回有序集合中一个或多个成员的分数",
        "since": "6.2.0"
      },
      {
        "name": "ZPOPMAX",
        "summary": "Returns the highest-scoring members from a sorted set after removing them. Deletes the sorted set if the last member was popped",
        "summaryZh": "移除后从有序集合中返回分数最高的成员。如果最后一个成员被弹出则删除有序集合",
        "since": "5.0.0"
      },
      {
        "name": "ZPOPMIN",
        "summary": "Returns the lowest-scoring members from a sorted set after removing them. Deletes the sorted set if the last member was popped",
        "summaryZh": "移除后从有序集合中返回分数最低的成员。如果最后一个成员被弹出则删除有序集合",
        "since": "5.0.0"
      },
      {
        "name": "ZRANDMEMBER",
        "summary": "Returns one or more random members from a sorted set",
        "summaryZh": "从有序集合返回一个或多个随机成员",
        "since": "6.2.0"
      },
      {
        "name": "ZRANGE",
        "summary": "Returns members in a sorted set within a range of indexes",
        "summaryZh": "返回有序集合中索引范围内的成员",
        "since": "1.2.0"
      },
      {
        "name": "ZRANGEBYLEX",
        "summary": "Returns members in a sorted set within a lexicographical range",
        "summaryZh": "返回有序集合中字典序范围内的成员",
        "since": "2.8.9"
      },
      {
        "name": "ZRANGEBYSCORE",
        "summary": "Returns members in a sorted set within a range of scores",
        "summaryZh": "返回有序集合中分数范围内的成员",
        "since": "1.0.5"
      },
      {
        "name": "ZRANGESTORE",
        "summary": "Stores a range of members from sorted set in a key",
        "summaryZh": "将有序集合中的一个成员范围存储在键中",
        "since": "6.2.0"
      },
      {
        "name": "ZRANK",
        "summary": "Returns the index of a member in a sorted set ordered by ascending scores",
        "summaryZh": "返回按分数升序排列的有序集合中成员的索引",
        "since": "2.0.0"
      },
      {
        "name": "ZREM",
        "summary": "Removes one or more members from a sorted set. Deletes the sorted set if all members were removed",
        "summaryZh": "从有序集合中移除一个或多个成员。如果所有成员都被移除则删除有序集合",
        "since": "1.2.0"
      },
      {
        "name": "ZREMRANGEBYLEX",
        "summary": "Removes members in a sorted set within a lexicographical range. Deletes the sorted set if all members were removed",
        "summaryZh": "从有序集合中移除字典序范围内的成员。如果所有成员都被移除则删除有序集合",
        "since": "2.8.9"
      },
      {
        "name": "ZREMRANGEBYRANK",
        "summary": "Removes members in a sorted set within a range of indexes. Deletes the sorted set if all members were removed",
        "summaryZh": "从有序集合中移除索引范围内的成员。如果所有成员都被移除则删除有序集合",
        "since": "2.0.0"
      },
      {
        "name": "ZREMRANGEBYSCORE",
        "summary": "Removes members in a sorted set within a range of scores. Deletes the sorted set if all members were removed",
        "summaryZh": "从有序集合中移除分数范围内的成员。如果所有成员都被移除则删除有序集合",
        "since": "1.2.0"
      },
      {
        "name": "ZREVRANGE",
        "summary": "Returns members in a sorted set within a range of indexes in reverse order",
        "summaryZh": "返回有序集合中索引范围内的成员（逆序）",
        "since": "1.2.0"
      },
      {
        "name": "ZREVRANGEBYLEX",
        "summary": "Returns members in a sorted set within a lexicographical range in reverse order",
        "summaryZh": "返回有序集合中字典序范围内的成员（逆序）",
        "since": "2.8.9"
      },
      {
        "name": "ZREVRANGEBYSCORE",
        "summary": "Returns members in a sorted set within a range of scores in reverse order",
        "summaryZh": "返回有序集合中分数范围内的成员（逆序）",
        "since": "2.2.0"
      },
      {
        "name": "ZREVRANK",
        "summary": "Returns the index of a member in a sorted set ordered by descending scores",
        "summaryZh": "返回有序集合中按降序排列的成员索引",
        "since": "2.0.0"
      },
      {
        "name": "ZSCAN",
        "summary": "Iterates over members and scores of a sorted set",
        "summaryZh": "迭代有序集合的成员和分数",
        "since": "2.8.0"
      },
      {
        "name": "ZSCORE",
        "summary": "Returns the score of a member in a sorted set",
        "summaryZh": "返回有序集合中成员的分数",
        "since": "1.2.0"
      },
      {
        "name": "ZUNION",
        "summary": "Returns the union of multiple sorted sets",
        "summaryZh": "返回多个有序集合的并集",
        "since": "6.2.0"
      },
      {
        "name": "ZUNIONSTORE",
        "summary": "Stores the union of multiple sorted sets in a key",
        "summaryZh": "将多个有序集合的并集存储在键中",
        "since": "2.0.0"
      }
    ]
  },
  {
    "group": "stream",
    "commands": [
      {
        "name": "XACK",
        "summary": "Returns the number of messages that were successfully acknowledged by the consumer group member of a stream",
        "summaryZh": "返回流的消费者组成员成功确认的消息数量",
        "since": "5.0.0"
      },
      {
        "name": "XADD",
        "summary": "Appends a new message to a stream. Creates the key if it doesn't exist",
        "summaryZh": "向流追加新消息。如果键不存在则创建",
        "since": "5.0.0"
      },
      {
        "name": "XAUTOCLAIM",
        "summary": "Changes, or acquires, ownership of messages in a consumer group, as if the messages were delivered to as consumer group member",
        "summaryZh": "更改或获取消费者组中消息的所有权，就像消息已传递给消费者组成员一样",
        "since": "6.2.0"
      },
      {
        "name": "XCLAIM",
        "summary": "Changes, or acquires, ownership of a message in a consumer group, as if the message was delivered a consumer group member",
        "summaryZh": "更改或获取消费者组中消息的所有权，就像消息已传递给消费者组成员一样",
        "since": "5.0.0"
      },
      {
        "name": "XDEL",
        "summary": "Returns the number of messages after removing them from a stream",
        "summaryZh": "返回从流中删除后的消息数量",
        "since": "5.0.0"
      },
      {
        "name": "XGROUP",
        "summary": "A container for consumer groups commands",
        "summaryZh": "消费者组命令的容器",
        "since": "5.0.0"
      },
      {
        "name": "XGROUP CREATE",
        "summary": "Creates a consumer group",
        "summaryZh": "创建消费者组",
        "since": "5.0.0"
      },
      {
        "name": "XGROUP CREATECONSUMER",
        "summary": "Creates a consumer in a consumer group",
        "summaryZh": "在消费者组中创建消费者",
        "since": "6.2.0"
      },
      {
        "name": "XGROUP DELCONSUMER",
        "summary": "Deletes a consumer from a consumer group",
        "summaryZh": "从消费者组中删除消费者",
        "since": "5.0.0"
      },
      {
        "name": "XGROUP DESTROY",
        "summary": "Destroys a consumer group",
        "summaryZh": "销毁消费者组",
        "since": "5.0.0"
      },
      {
        "name": "XGROUP HELP",
        "summary": "Returns helpful text about the different subcommands",
        "summaryZh": "返回关于不同子命令的帮助文本",
        "since": "5.0.0"
      },
      {
        "name": "XGROUP SETID",
        "summary": "Sets the last-delivered ID of a consumer group",
        "summaryZh": "设置消费者组的最后传递 ID",
        "since": "5.0.0"
      },
      {
        "name": "XINFO",
        "summary": "A container for stream introspection commands",
        "summaryZh": "流内省命令的容器",
        "since": "5.0.0"
      },
      {
        "name": "XINFO CONSUMERS",
        "summary": "Returns a list of the consumers in a consumer group",
        "summaryZh": "返回消费者组中的消费者列表",
        "since": "5.0.0"
      },
      {
        "name": "XINFO GROUPS",
        "summary": "Returns a list of the consumer groups of a stream",
        "summaryZh": "返回流的消费者组列表",
        "since": "5.0.0"
      },
      {
        "name": "XINFO HELP",
        "summary": "Returns helpful text about the different subcommands",
        "summaryZh": "返回关于不同子命令的帮助文本",
        "since": "5.0.0"
      },
      {
        "name": "XINFO STREAM",
        "summary": "Returns information about a stream",
        "summaryZh": "返回有关流的信息",
        "since": "5.0.0"
      },
      {
        "name": "XLEN",
        "summary": "Return the number of messages in a stream",
        "summaryZh": "返回流中的消息数量",
        "since": "5.0.0"
      },
      {
        "name": "XPENDING",
        "summary": "Returns the information and entries from a stream consumer group's pending entries list",
        "summaryZh": "返回流消费者组待处理条目列表的信息和条目",
        "since": "5.0.0"
      },
      {
        "name": "XRANGE",
        "summary": "Returns the messages from a stream within a range of IDs",
        "summaryZh": "返回流中 ID 范围内的消息",
        "since": "5.0.0"
      },
      {
        "name": "XREAD",
        "summary": "Returns messages from multiple streams with IDs greater than the ones requested. Blocks until a message is available otherwise",
        "summaryZh": "返回来自多个流的消息，其 ID 大于请求的 ID。否则阻塞直到消息可用",
        "since": "5.0.0"
      },
      {
        "name": "XREADGROUP",
        "summary": "Returns new or historical messages from a stream for a consumer in a group. Blocks until a message is available otherwise",
        "summaryZh": "为组中的消费者返回流中的新消息或历史消息。否则阻塞直到消息可用",
        "since": "5.0.0"
      },
      {
        "name": "XREVRANGE",
        "summary": "Returns the messages from a stream within a range of IDs in reverse order",
        "summaryZh": "返回流中 ID 范围内的消息（逆序）",
        "since": "5.0.0"
      },
      {
        "name": "XSETID",
        "summary": "An internal command for replicating stream values",
        "summaryZh": "用于复制流值的内部命令",
        "since": "5.0.0"
      },
      {
        "name": "XTRIM",
        "summary": "Deletes messages from the beginning of a stream",
        "summaryZh": "从流的开头删除消息",
        "since": "5.0.0"
      }
    ]
  },
  {
    "group": "hyperloglog",
    "commands": [
      {
        "name": "PFADD",
        "summary": "Adds elements to a HyperLogLog key. Creates the key if it doesn't exist",
        "summaryZh": "向 HyperLogLog 键添加元素。如果键不存在则创建",
        "since": "2.8.9"
      },
      {
        "name": "PFCOUNT",
        "summary": "Returns the approximated cardinality of the set(s) observed by the HyperLogLog key(s)",
        "summaryZh": "返回 HyperLogLog 键观察到的集合的近似基数",
        "since": "2.8.9"
      },
      {
        "name": "PFDEBUG",
        "summary": "Internal commands for debugging HyperLogLog values",
        "summaryZh": "用于调试 HyperLogLog 值的内部命令",
        "since": "2.8.9"
      },
      {
        "name": "PFMERGE",
        "summary": "Merges one or more HyperLogLog values into a single key",
        "summaryZh": "将一个或多个 HyperLogLog 值合并到单个键中",
        "since": "2.8.9"
      },
      {
        "name": "PFSELFTEST",
        "summary": "An internal command for testing HyperLogLog values",
        "summaryZh": "用于测试 HyperLogLog 值的内部命令",
        "since": "2.8.9"
      }
    ]
  },
  {
    "group": "geo",
    "commands": [
      {
        "name": "GEOADD",
        "summary": "Adds one or more members to a geospatial index. The key is created if it doesn't exist",
        "summaryZh": "向地理空间索引添加一个或多个成员。如果键不存在则创建",
        "since": "3.2.0"
      },
      {
        "name": "GEODIST",
        "summary": "Returns the distance between two members of a geospatial index",
        "summaryZh": "返回地理空间索引中两个成员之间的距离",
        "since": "3.2.0"
      },
      {
        "name": "GEOHASH",
        "summary": "Returns members from a geospatial index as geohash strings",
        "summaryZh": "以 geohash 字符串形式返回地理空间索引中的成员",
        "since": "3.2.0"
      },
      {
        "name": "GEOPOS",
        "summary": "Returns the longitude and latitude of members from a geospatial index",
        "summaryZh": "返回地理空间索引中成员的经度和纬度",
        "since": "3.2.0"
      },
      {
        "name": "GEORADIUS",
        "summary": "Queries a geospatial index for members within a distance from a coordinate, optionally stores the result",
        "summaryZh": "查询地理空间索引中距离坐标一定范围内的成员，可选地存储结果",
        "since": "3.2.0"
      },
      {
        "name": "GEORADIUSBYMEMBER",
        "summary": "Queries a geospatial index for members within a distance from a member, optionally stores the result",
        "summaryZh": "查询地理空间索引中距离成员一定范围内的成员，可选地存储结果",
        "since": "3.2.0"
      },
      {
        "name": "GEORADIUSBYMEMBER_RO",
        "summary": "Returns members from a geospatial index that are within a distance from a member",
        "summaryZh": "返回地理空间索引中距离成员一定范围内的成员",
        "since": "3.2.10"
      },
      {
        "name": "GEORADIUS_RO",
        "summary": "Returns members from a geospatial index that are within a distance from a coordinate",
        "summaryZh": "返回地理空间索引中距离坐标一定范围内的成员",
        "since": "3.2.10"
      },
      {
        "name": "GEOSEARCH",
        "summary": "Queries a geospatial index for members inside an area of a box or a circle",
        "summaryZh": "查询地理空间索引中方框或圆形区域内的成员",
        "since": "6.2.0"
      },
      {
        "name": "GEOSEARCHSTORE",
        "summary": "Queries a geospatial index for members inside an area of a box or a circle, optionally stores the result",
        "summaryZh": "查询地理空间索引中方框或圆形区域内的成员，可选地存储结果",
        "since": "6.2.0"
      }
    ]
  },
  {
    "group": "bitmap",
    "commands": [
      {
        "name": "BITCOUNT",
        "summary": "Counts the number of set bits (population counting) in a string",
        "summaryZh": "计算字符串中设置的位（人口计数）数量",
        "since": "2.6.0"
      },
      {
        "name": "BITFIELD",
        "summary": "Performs arbitrary bitfield integer operations on strings",
        "summaryZh": "对字符串执行任意位字段整数操作",
        "since": "3.2.0"
      },
      {
        "name": "BITFIELD_RO",
        "summary": "Performs arbitrary read-only bitfield integer operations on strings",
        "summaryZh": "对字符串执行任意只读位字段整数操作",
        "since": "6.0.0"
      },
      {
        "name": "BITOP",
        "summary": "Performs bitwise operations on multiple strings, and stores the result",
        "summaryZh": "对多个字符串执行位操作，并存储结果",
        "since": "2.6.0"
      },
      {
        "name": "BITPOS",
        "summary": "Finds the first set (1) or clear (0) bit in a string",
        "summaryZh": "查找字符串中第一个设置（1）或清除（0）的位",
        "since": "2.8.7"
      },
      {
        "name": "GETBIT",
        "summary": "Returns a bit value by offset",
        "summaryZh": "按偏移量返回位值",
        "since": "2.2.0"
      },
      {
        "name": "SETBIT",
        "summary": "Sets or clears the bit at offset of the string value. Creates the key if it doesn't exist",
        "summaryZh": "设置或清除字符串值偏移量处的位。如果键不存在则创建",
        "since": "2.2.0"
      }
    ]
  },
  {
    "group": "cluster",
    "commands": [
      {
        "name": "ASKING",
        "summary": "Signals that a cluster client is following an -ASK redirect",
        "summaryZh": "表示集群客户端正在遵循 -ASK 重定向",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER",
        "summary": "A container for Redis Cluster commands",
        "summaryZh": "Redis 集群命令的容器",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER ADDSLOTS",
        "summary": "Assigns new hash slots to a node",
        "summaryZh": "为节点分配新的哈希槽",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER ADDSLOTSRANGE",
        "summary": "Assigns new hash slot ranges to a node",
        "summaryZh": "为节点分配新的哈希槽范围",
        "since": "7.0.0"
      },
      {
        "name": "CLUSTER BUMPEPOCH",
        "summary": "Advances the cluster config epoch",
        "summaryZh": "推进集群配置纪元",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER COUNT-FAILURE-REPORTS",
        "summary": "Returns the number of active failure reports active for a node",
        "summaryZh": "返回节点的活动故障报告数量",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER COUNTKEYSINSLOT",
        "summary": "Returns the number of keys in a hash slot",
        "summaryZh": "返回哈希槽中的键数量",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER DELSLOTS",
        "summary": "Sets hash slots as unbound for a node",
        "summaryZh": "将哈希槽设置为节点的未绑定状态",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER DELSLOTSRANGE",
        "summary": "Sets hash slot ranges as unbound for a node",
        "summaryZh": "将哈希槽范围设置为节点的未绑定状态",
        "since": "7.0.0"
      },
      {
        "name": "CLUSTER FAILOVER",
        "summary": "Forces a replica to perform a manual failover of its master",
        "summaryZh": "强制副本对其主节点执行手动故障转移",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER FLUSHSLOTS",
        "summary": "Deletes all slots information from a node",
        "summaryZh": "从节点中删除所有槽信息",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER FORGET",
        "summary": "Removes a node from the nodes table",
        "summaryZh": "从节点表中删除节点",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER GETKEYSINSLOT",
        "summary": "Returns the key names in a hash slot",
        "summaryZh": "返回哈希槽中的键名",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER HELP",
        "summary": "Returns helpful text about the different subcommands",
        "summaryZh": "返回关于不同子命令的帮助文本",
        "since": "5.0.0"
      },
      {
        "name": "CLUSTER INFO",
        "summary": "Returns information about the state of a node",
        "summaryZh": "返回有关节点状态的信息",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER KEYSLOT",
        "summary": "Returns the hash slot for a key",
        "summaryZh": "返回键的哈希槽",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER LINKS",
        "summary": "Returns a list of all TCP links to and from peer nodes",
        "summaryZh": "返回与对等节点之间的所有 TCP 链接列表",
        "since": "7.0.0"
      },
      {
        "name": "CLUSTER MEET",
        "summary": "Forces a node to handshake with another node",
        "summaryZh": "强制节点与另一个节点握手",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER MYID",
        "summary": "Returns the ID of a node",
        "summaryZh": "返回节点的 ID",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER MYSHARDID",
        "summary": "Returns the shard ID of a node",
        "summaryZh": "返回节点的分片 ID",
        "since": "7.2.0"
      },
      {
        "name": "CLUSTER NODES",
        "summary": "Returns the cluster configuration for a node",
        "summaryZh": "返回节点的集群配置",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER REPLICAS",
        "summary": "Lists the replica nodes of a master node",
        "summaryZh": "列出主节点的副本节点",
        "since": "5.0.0"
      },
      {
        "name": "CLUSTER REPLICATE",
        "summary": "Configure a node as replica of a master node",
        "summaryZh": "将节点配置为主节点的副本",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER RESET",
        "summary": "Resets a node",
        "summaryZh": "重置节点",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER SAVECONFIG",
        "summary": "Forces a node to save the cluster configuration to disk",
        "summaryZh": "强制节点将集群配置保存到磁盘",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER SET-CONFIG-EPOCH",
        "summary": "Sets the configuration epoch for a new node",
        "summaryZh": "为新节点设置配置纪元",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER SETSLOT",
        "summary": "Binds a hash slot to a node",
        "summaryZh": "将哈希槽绑定到节点",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER SHARDS",
        "summary": "Returns the mapping of cluster slots to shards",
        "summaryZh": "返回集群槽到分片的映射",
        "since": "7.0.0"
      },
      {
        "name": "CLUSTER SLAVES",
        "summary": "Lists the replica nodes of a master node",
        "summaryZh": "列出主节点的副本节点",
        "since": "3.0.0"
      },
      {
        "name": "CLUSTER SLOTS",
        "summary": "Returns the mapping of cluster slots to nodes",
        "summaryZh": "返回集群槽到节点的映射",
        "since": "3.0.0"
      },
      {
        "name": "READONLY",
        "summary": "Enables read-only queries for a connection to a Redis Cluster replica node",
        "summaryZh": "为 Redis 集群副本节点的连接启用只读查询",
        "since": "3.0.0"
      },
      {
        "name": "READWRITE",
        "summary": "Enables read-write queries for a connection to a Reids Cluster replica node",
        "summaryZh": "为 Redis 集群副本节点的连接启用读写查询",
        "since": "3.0.0"
      }
    ]
  },
  {
    "group": "connection",
    "commands": [
      {
        "name": "AUTH",
        "summary": "Authenticates the connection",
        "summaryZh": "验证连接",
        "since": "1.0.0"
      },
      {
        "name": "CLIENT",
        "summary": "A container for client connection commands",
        "summaryZh": "客户端连接命令的容器",
        "since": "2.4.0"
      },
      {
        "name": "CLIENT CACHING",
        "summary": "Instructs the server whether to track the keys in the next request",
        "summaryZh": "指示服务器是否跟踪下一个请求中的键",
        "since": "6.0.0"
      },
      {
        "name": "CLIENT GETNAME",
        "summary": "Returns the name of the connection",
        "summaryZh": "返回连接的名称",
        "since": "2.6.9"
      },
      {
        "name": "CLIENT GETREDIR",
        "summary": "Returns the client ID to which the connection's tracking notifications are redirected",
        "summaryZh": "返回连接的跟踪通知被重定向到的客户端 ID",
        "since": "6.0.0"
      },
      {
        "name": "CLIENT HELP",
        "summary": "Returns helpful text about the different subcommands",
        "summaryZh": "返回关于不同子命令的帮助文本",
        "since": "5.0.0"
      },
      {
        "name": "CLIENT ID",
        "summary": "Returns the unique client ID of the connection",
        "summaryZh": "返回连接的唯一客户端 ID",
        "since": "5.0.0"
      },
      {
        "name": "CLIENT INFO",
        "summary": "Returns information about the connection",
        "summaryZh": "返回有关连接的信息",
        "since": "6.2.0"
      },
      {
        "name": "CLIENT KILL",
        "summary": "Terminates open connections",
        "summaryZh": "终止打开的连接",
        "since": "2.4.0"
      },
      {
        "name": "CLIENT LIST",
        "summary": "Lists open connections",
        "summaryZh": "列出打开的连接",
        "since": "2.4.0"
      },
      {
        "name": "CLIENT NO-EVICT",
        "summary": "Sets the client eviction mode of the connection",
        "summaryZh": "设置连接的客户端驱逐模式",
        "since": "7.0.0"
      },
      {
        "name": "CLIENT NO-TOUCH",
        "summary": "Controls whether commands sent by the client affect the LRU/LFU of accessed keys",
        "summaryZh": "控制客户端发送的命令是否影响访问键的 LRU/LFU",
        "since": "7.2.0"
      },
      {
        "name": "CLIENT PAUSE",
        "summary": "Suspends commands processing",
        "summaryZh": "暂停命令处理",
        "since": "3.0.0"
      },
      {
        "name": "CLIENT REPLY",
        "summary": "Instructs the server whether to reply to commands",
        "summaryZh": "指示服务器是否回复命令",
        "since": "3.2.0"
      },
      {
        "name": "CLIENT SETINFO",
        "summary": "Sets information specific to the client or connection",
        "summaryZh": "设置特定于客户端或连接的信息",
        "since": "7.2.0"
      },
      {
        "name": "CLIENT SETNAME",
        "summary": "Sets the connection name",
        "summaryZh": "设置连接名称",
        "since": "2.6.9"
      },
      {
        "name": "CLIENT TRACKING",
        "summary": "Controls server-assisted client-side caching for the connection",
        "summaryZh": "控制连接的服务器辅助客户端缓存",
        "since": "6.0.0"
      },
      {
        "name": "CLIENT TRACKINGINFO",
        "summary": "Returns information about server-assisted client-side caching for the connection",
        "summaryZh": "返回有关连接的服务器辅助客户端缓存的信息",
        "since": "6.2.0"
      },
      {
        "name": "CLIENT UNBLOCK",
        "summary": "Unblocks a client blocked by a blocking command from a different connection",
        "summaryZh": "从不同连接解除被阻塞命令阻塞的客户端",
        "since": "5.0.0"
      },
      {
        "name": "CLIENT UNPAUSE",
        "summary": "Resumes processing commands from paused clients",
        "summaryZh": "恢复处理来自暂停客户端的命令",
        "since": "6.2.0"
      },
      {
        "name": "ECHO",
        "summary": "Returns the given string",
        "summaryZh": "返回给定的字符串",
        "since": "1.0.0"
      },
      {
        "name": "HELLO",
        "summary": "Handshakes with the Redis server",
        "summaryZh": "与Redis服务器握手",
        "since": "6.0.0"
      },
      {
        "name": "PING",
        "summary": "Returns the server's liveliness response",
        "summaryZh": "返回服务器的活跃响应",
        "since": "1.0.0"
      },
      {
        "name": "QUIT",
        "summary": "Closes the connection",
        "summaryZh": "关闭连接",
        "since": "1.0.0"
      },
      {
        "name": "RESET",
        "summary": "Resets the connection",
        "summaryZh": "重置连接",
        "since": "6.2.0"
      },
      {
        "name": "SELECT",
        "summary": "Changes the selected database",
        "summaryZh": "更改所选数据库",
        "since": "1.0.0"
      }
    ]
  },
  {
    "group": "pubsub",
    "commands": [
      {
        "name": "PSUBSCRIBE",
        "summary": "Listens for messages published to channels that match one or more patterns",
        "summaryZh": "监听发布到匹配一个或多个模式的频道的消息",
        "since": "2.0.0"
      },
      {
        "name": "PUBLISH",
        "summary": "Posts a message to a channel",
        "summaryZh": "向频道发布消息",
        "since": "2.0.0"
      },
      {
        "name": "PUBSUB",
        "summary": "A container for Pub/Sub commands",
        "summaryZh": "Pub/Sub 命令的容器",
        "since": "2.8.0"
      },
      {
        "name": "PUBSUB CHANNELS",
        "summary": "Returns the active channels",
        "summaryZh": "返回活动频道",
        "since": "2.8.0"
      },
      {
        "name": "PUBSUB HELP",
        "summary": "Returns helpful text about the different subcommands",
        "summaryZh": "返回关于不同子命令的帮助文本",
        "since": "6.2.0"
      },
      {
        "name": "PUBSUB NUMPAT",
        "summary": "Returns a count of unique pattern subscriptions",
        "summaryZh": "返回唯一模式订阅的计数",
        "since": "2.8.0"
      },
      {
        "name": "PUBSUB NUMSUB",
        "summary": "Returns a count of subscribers to channels",
        "summaryZh": "返回频道订阅者的计数",
        "since": "2.8.0"
      },
      {
        "name": "PUBSUB SHARDCHANNELS",
        "summary": "Returns the active shard channels",
        "summaryZh": "返回活动分片频道",
        "since": "7.0.0"
      },
      {
        "name": "PUBSUB SHARDNUMSUB",
        "summary": "Returns the count of subscribers of shard channels",
        "summaryZh": "返回分片频道订阅者的计数",
        "since": "7.0.0"
      },
      {
        "name": "PUNSUBSCRIBE",
        "summary": "Stops listening to messages published to channels that match one or more patterns",
        "summaryZh": "停止监听发布到匹配一个或多个模式的频道的消息",
        "since": "2.0.0"
      },
      {
        "name": "SPUBLISH",
        "summary": "Post a message to a shard channel",
        "summaryZh": "向分片频道发布消息",
        "since": "7.0.0"
      },
      {
        "name": "SSUBSCRIBE",
        "summary": "Listens for messages published to shard channels",
        "summaryZh": "监听发布到分片频道的消息",
        "since": "7.0.0"
      },
      {
        "name": "SUBSCRIBE",
        "summary": "Listens for messages published to channels",
        "summaryZh": "监听发布到频道的消息",
        "since": "2.0.0"
      },
      {
        "name": "SUNSUBSCRIBE",
        "summary": "Stops listening to messages posted to shard channels",
        "summaryZh": "停止监听发布到分片频道的消息",
        "since": "7.0.0"
      },
      {
        "name": "UNSUBSCRIBE",
        "summary": "Stops listening to messages posted to channels",
        "summaryZh": "停止监听发布到频道的消息",
        "since": "2.0.0"
      }
    ]
  },
  {
    "group": "transactions",
    "commands": [
      {
        "name": "DISCARD",
        "summary": "Discards a transaction",
        "summaryZh": "放弃事务",
        "since": "2.0.0"
      },
      {
        "name": "EXEC",
        "summary": "Executes all commands in a transaction",
        "summaryZh": "执行事务中的所有命令",
        "since": "1.2.0"
      },
      {
        "name": "MULTI",
        "summary": "Starts a transaction",
        "summaryZh": "开始事务",
        "since": "1.2.0"
      },
      {
        "name": "UNWATCH",
        "summary": "Forgets about watched keys of a transaction",
        "summaryZh": "忘记事务的已监视键",
        "since": "2.2.0"
      },
      {
        "name": "WATCH",
        "summary": "Monitors changes to keys to determine the execution of a transaction",
        "summaryZh": "监控键的变化以确定事务的执行",
        "since": "2.2.0"
      }
    ]
  },
  {
    "group": "scripting",
    "commands": [
      {
        "name": "EVAL",
        "summary": "Executes a server-side Lua script",
        "summaryZh": "执行服务器端Lua脚本",
        "since": "2.6.0"
      },
      {
        "name": "EVALSHA",
        "summary": "Executes a server-side Lua script by SHA1 digest",
        "summaryZh": "通过 SHA1 摘要执行服务器端 Lua 脚本",
        "since": "2.6.0"
      },
      {
        "name": "EVALSHA_RO",
        "summary": "Executes a read-only server-side Lua script by SHA1 digest",
        "summaryZh": "通过 SHA1 摘要执行只读服务器端 Lua 脚本",
        "since": "7.0.0"
      },
      {
        "name": "EVAL_RO",
        "summary": "Executes a read-only server-side Lua script",
        "summaryZh": "执行只读服务器端 Lua 脚本",
        "since": "7.0.0"
      },
      {
        "name": "FCALL",
        "summary": "Invokes a function",
        "summaryZh": "调用函数",
        "since": "7.0.0"
      },
      {
        "name": "FCALL_RO",
        "summary": "Invokes a read-only function",
        "summaryZh": "调用只读函数",
        "since": "7.0.0"
      },
      {
        "name": "FUNCTION",
        "summary": "A container for function commands",
        "summaryZh": "函数命令的容器",
        "since": "7.0.0"
      },
      {
        "name": "FUNCTION DELETE",
        "summary": "Deletes a library and its functions",
        "summaryZh": "删除库及其函数",
        "since": "7.0.0"
      },
      {
        "name": "FUNCTION DUMP",
        "summary": "Dumps all libraries into a serialized binary payload",
        "summaryZh": "将所有库转储到序列化的二进制有效负载中",
        "since": "7.0.0"
      },
      {
        "name": "FUNCTION FLUSH",
        "summary": "Deletes all libraries and functions",
        "summaryZh": "删除所有库和函数",
        "since": "7.0.0"
      },
      {
        "name": "FUNCTION HELP",
        "summary": "Returns helpful text about the different subcommands",
        "summaryZh": "返回关于不同子命令的帮助文本",
        "since": "7.0.0"
      },
      {
        "name": "FUNCTION KILL",
        "summary": "Terminates a function during execution",
        "summaryZh": "在执行期间终止函数",
        "since": "7.0.0"
      },
      {
        "name": "FUNCTION LIST",
        "summary": "Returns information about all libraries",
        "summaryZh": "返回有关所有库的信息",
        "since": "7.0.0"
      },
      {
        "name": "FUNCTION LOAD",
        "summary": "Creates a library",
        "summaryZh": "创建库",
        "since": "7.0.0"
      },
      {
        "name": "FUNCTION RESTORE",
        "summary": "Restores all libraries from a payload",
        "summaryZh": "从有效负载恢复所有库",
        "since": "7.0.0"
      },
      {
        "name": "FUNCTION STATS",
        "summary": "Returns information about a function during execution",
        "summaryZh": "返回执行期间函数的信息",
        "since": "7.0.0"
      },
      {
        "name": "SCRIPT",
        "summary": "A container for Lua scripts management commands",
        "summaryZh": "Lua 脚本管理命令的容器",
        "since": "2.6.0"
      },
      {
        "name": "SCRIPT DEBUG",
        "summary": "Sets the debug mode of server-side Lua scripts",
        "summaryZh": "设置服务器端 Lua 脚本的调试模式",
        "since": "3.2.0"
      },
      {
        "name": "SCRIPT EXISTS",
        "summary": "Determines whether server-side Lua scripts exist in the script cache",
        "summaryZh": "确定服务器端 Lua 脚本是否存在于脚本缓存中",
        "since": "2.6.0"
      },
      {
        "name": "SCRIPT FLUSH",
        "summary": "Removes all server-side Lua scripts from the script cache",
        "summaryZh": "从脚本缓存中删除所有服务器端 Lua 脚本",
        "since": "2.6.0"
      },
      {
        "name": "SCRIPT HELP",
        "summary": "Returns helpful text about the different subcommands",
        "summaryZh": "返回关于不同子命令的帮助文本",
        "since": "5.0.0"
      },
      {
        "name": "SCRIPT KILL",
        "summary": "Terminates a server-side Lua script during execution",
        "summaryZh": "在执行期间终止服务器端 Lua 脚本",
        "since": "2.6.0"
      },
      {
        "name": "SCRIPT LOAD",
        "summary": "Loads a server-side Lua script to the script cache",
        "summaryZh": "将服务器端Lua脚本加载到脚本缓存",
        "since": "2.6.0"
      }
    ]
  },
  {
    "group": "server",
    "commands": [
      {
        "name": "ACL",
        "summary": "A container for Access List Control commands",
        "summaryZh": "访问列表控制命令的容器",
        "since": "6.0.0"
      },
      {
        "name": "ACL CAT",
        "summary": "Lists the ACL categories, or the commands inside a category",
        "summaryZh": "列出 ACL 类别或类别中的命令",
        "since": "6.0.0"
      },
      {
        "name": "ACL DELUSER",
        "summary": "Deletes ACL users, and terminates their connections",
        "summaryZh": "删除 ACL 用户并终止其连接",
        "since": "6.0.0"
      },
      {
        "name": "ACL DRYRUN",
        "summary": "Simulates the execution of a command by a user, without executing the command",
        "summaryZh": "模拟用户执行命令，但不执行命令",
        "since": "7.0.0"
      },
      {
        "name": "ACL GENPASS",
        "summary": "Generates a pseudorandom, secure password that can be used to identify ACL users",
        "summaryZh": "生成可用于标识 ACL 用户的伪随机安全密码",
        "since": "6.0.0"
      },
      {
        "name": "ACL GETUSER",
        "summary": "Lists the ACL rules of a user",
        "summaryZh": "列出用户的 ACL 规则",
        "since": "6.0.0"
      },
      {
        "name": "ACL HELP",
        "summary": "Returns helpful text about the different subcommands",
        "summaryZh": "返回关于不同子命令的帮助文本",
        "since": "6.0.0"
      },
      {
        "name": "ACL LIST",
        "summary": "Dumps the effective rules in ACL file format",
        "summaryZh": "以 ACL 文件格式转储有效规则",
        "since": "6.0.0"
      },
      {
        "name": "ACL LOAD",
        "summary": "Reloads the rules from the configured ACL file",
        "summaryZh": "从配置的 ACL 文件重新加载规则",
        "since": "6.0.0"
      },
      {
        "name": "ACL LOG",
        "summary": "Lists recent security events generated due to ACL rules",
        "summaryZh": "列出由于 ACL 规则生成的最近安全事件",
        "since": "6.0.0"
      },
      {
        "name": "ACL SAVE",
        "summary": "Saves the effective ACL rules in the configured ACL file",
        "summaryZh": "将有效 ACL 规则保存到配置的 ACL 文件中",
        "since": "6.0.0"
      },
      {
        "name": "ACL SETUSER",
        "summary": "Creates and modifies an ACL user and its rules",
        "summaryZh": "创建和修改 ACL 用户及其规则",
        "since": "6.0.0"
      },
      {
        "name": "ACL USERS",
        "summary": "Lists all ACL users",
        "summaryZh": "列出所有 ACL 用户",
        "since": "6.0.0"
      },
      {
        "name": "ACL WHOAMI",
        "summary": "Returns the authenticated username of the current connection",
        "summaryZh": "返回当前连接的认证用户名",
        "since": "6.0.0"
      },
      {
        "name": "BGREWRITEAOF",
        "summary": "Asynchronously rewrites the append-only file to disk",
        "summaryZh": "异步重写追加文件到磁盘",
        "since": "1.0.0"
      },
      {
        "name": "BGSAVE",
        "summary": "Asynchronously saves the database(s) to disk",
        "summaryZh": "异步将数据库保存到磁盘",
        "since": "1.0.0"
      },
      {
        "name": "COMMAND",
        "summary": "Returns detailed information about all commands",
        "summaryZh": "返回有关所有命令的详细信息",
        "since": "2.8.13"
      },
      {
        "name": "COMMAND COUNT",
        "summary": "Returns a count of commands",
        "summaryZh": "返回命令计数",
        "since": "2.8.13"
      },
      {
        "name": "COMMAND DOCS",
        "summary": "Returns documentary information about one, multiple or all commands",
        "summaryZh": "返回有关一个、多个或所有命令的文档信息",
        "since": "7.0.0"
      },
      {
        "name": "COMMAND GETKEYS",
        "summary": "Extracts the key names from an arbitrary command",
        "summaryZh": "从任意命令中提取键名",
        "since": "2.8.13"
      },
      {
        "name": "COMMAND GETKEYSANDFLAGS",
        "summary": "Extracts the key names and access flags for an arbitrary command",
        "summaryZh": "从任意命令中提取键名和访问标志",
        "since": "7.0.0"
      },
      {
        "name": "COMMAND HELP",
        "summary": "Returns helpful text about the different subcommands",
        "summaryZh": "返回关于不同子命令的帮助文本",
        "since": "5.0.0"
      },
      {
        "name": "COMMAND INFO",
        "summary": "Returns information about one, multiple or all commands",
        "summaryZh": "返回有关一个、多个或所有命令的信息",
        "since": "2.8.13"
      },
      {
        "name": "COMMAND LIST",
        "summary": "Returns a list of command names",
        "summaryZh": "返回命令名称列表",
        "since": "7.0.0"
      },
      {
        "name": "CONFIG",
        "summary": "A container for server configuration commands",
        "summaryZh": "服务器配置命令的容器",
        "since": "2.0.0"
      },
      {
        "name": "CONFIG GET",
        "summary": "Returns the effective values of configuration parameters",
        "summaryZh": "返回配置参数的有效值",
        "since": "2.0.0"
      },
      {
        "name": "CONFIG HELP",
        "summary": "Returns helpful text about the different subcommands",
        "summaryZh": "返回关于不同子命令的帮助文本",
        "since": "5.0.0"
      },
      {
        "name": "CONFIG RESETSTAT",
        "summary": "Resets the server's statistics",
        "summaryZh": "重置服务器的统计信息",
        "since": "2.0.0"
      },
      {
        "name": "CONFIG REWRITE",
        "summary": "Persists the effective configuration to file",
        "summaryZh": "将有效配置持久化到文件",
        "since": "2.8.0"
      },
      {
        "name": "CONFIG SET",
        "summary": "Sets configuration parameters in-flight",
        "summaryZh": "动态设置配置参数",
        "since": "2.0.0"
      },
      {
        "name": "DBSIZE",
        "summary": "Returns the number of keys in the database",
        "summaryZh": "返回数据库中的键数量",
        "since": "1.0.0"
      },
      {
        "name": "DEBUG",
        "summary": "A container for debugging commands",
        "summaryZh": "调试命令的容器",
        "since": "1.0.0"
      },
      {
        "name": "FAILOVER",
        "summary": "Starts a coordinated failover from a server to one of its replicas",
        "summaryZh": "启动从服务器到其一个副本的协调故障转移",
        "since": "6.2.0"
      },
      {
        "name": "FLUSHALL",
        "summary": "Removes all keys from all databases",
        "summaryZh": "从所有数据库中删除所有键",
        "since": "1.0.0"
      },
      {
        "name": "FLUSHDB",
        "summary": "Remove all keys from the current database",
        "summaryZh": "从当前数据库中删除所有键",
        "since": "1.0.0"
      },
      {
        "name": "INFO",
        "summary": "Returns information and statistics about the server",
        "summaryZh": "返回有关服务器的信息和统计数据",
        "since": "1.0.0"
      },
      {
        "name": "LASTSAVE",
        "summary": "Returns the Unix timestamp of the last successful save to disk",
        "summaryZh": "返回最后一次成功保存到磁盘的 Unix 时间戳",
        "since": "1.0.0"
      },
      {
        "name": "LATENCY",
        "summary": "A container for latency diagnostics commands",
        "summaryZh": "延迟诊断命令的容器",
        "since": "2.8.13"
      },
      {
        "name": "LATENCY DOCTOR",
        "summary": "Returns a human-readable latency analysis report",
        "summaryZh": "返回人类可读的延迟分析报告",
        "since": "2.8.13"
      },
      {
        "name": "LATENCY GRAPH",
        "summary": "Returns a latency graph for an event",
        "summaryZh": "返回事件的延迟图表",
        "since": "2.8.13"
      },
      {
        "name": "LATENCY HELP",
        "summary": "Returns helpful text about the different subcommands",
        "summaryZh": "返回关于不同子命令的帮助文本",
        "since": "2.8.13"
      },
      {
        "name": "LATENCY HISTOGRAM",
        "summary": "Returns the cumulative distribution of latencies of a subset or all commands",
        "summaryZh": "返回子集或所有命令的延迟累积分布",
        "since": "7.0.0"
      },
      {
        "name": "LATENCY HISTORY",
        "summary": "Returns timestamp-latency samples for an event",
        "summaryZh": "返回事件的时间戳-延迟样本",
        "since": "2.8.13"
      },
      {
        "name": "LATENCY LATEST",
        "summary": "Returns the latest latency samples for all events",
        "summaryZh": "返回所有事件的最新延迟样本",
        "since": "2.8.13"
      },
      {
        "name": "LATENCY RESET",
        "summary": "Resets the latency data for one or more events",
        "summaryZh": "重置一个或多个事件的延迟数据",
        "since": "2.8.13"
      },
      {
        "name": "LOLWUT",
        "summary": "Displays computer art and the Redis version",
        "summaryZh": "显示计算机艺术和 Redis 版本",
        "since": "5.0.0"
      },
      {
        "name": "MEMORY",
        "summary": "A container for memory diagnostics commands",
        "summaryZh": "内存诊断命令的容器",
        "since": "4.0.0"
      },
      {
        "name": "MEMORY DOCTOR",
        "summary": "Outputs a memory problems report",
        "summaryZh": "输出内存问题报告",
        "since": "4.0.0"
      },
      {
        "name": "MEMORY HELP",
        "summary": "Returns helpful text about the different subcommands",
        "summaryZh": "返回关于不同子命令的帮助文本",
        "since": "4.0.0"
      },
      {
        "name": "MEMORY MALLOC-STATS",
        "summary": "Returns the allocator statistics",
        "summaryZh": "返回分配器统计信息",
        "since": "4.0.0"
      },
      {
        "name": "MEMORY PURGE",
        "summary": "Asks the allocator to release memory",
        "summaryZh": "请求分配器释放内存",
        "since": "4.0.0"
      },
      {
        "name": "MEMORY STATS",
        "summary": "Returns details about memory usage",
        "summaryZh": "返回有关内存使用情况的详细信息",
        "since": "4.0.0"
      },
      {
        "name": "MEMORY USAGE",
        "summary": "Estimates the memory usage of a key",
        "summaryZh": "估计键的内存使用情况",
        "since": "4.0.0"
      },
      {
        "name": "MODULE",
        "summary": "A container for module commands",
        "summaryZh": "模块命令的容器",
        "since": "4.0.0"
      },
      {
        "name": "MODULE HELP",
        "summary": "Returns helpful text about the different subcommands",
        "summaryZh": "返回关于不同子命令的帮助文本",
        "since": "5.0.0"
      },
      {
        "name": "MODULE LIST",
        "summary": "Returns all loaded modules",
        "summaryZh": "返回所有加载的模块",
        "since": "4.0.0"
      },
      {
        "name": "MODULE LOAD",
        "summary": "Loads a module",
        "summaryZh": "加载模块",
        "since": "4.0.0"
      },
      {
        "name": "MODULE LOADEX",
        "summary": "Loads a module using extended parameters",
        "summaryZh": "使用扩展参数加载模块",
        "since": "7.0.0"
      },
      {
        "name": "MODULE UNLOAD",
        "summary": "Unloads a module",
        "summaryZh": "卸载模块",
        "since": "4.0.0"
      },
      {
        "name": "MONITOR",
        "summary": "Listens for all requests received by the server in real-time",
        "summaryZh": "实时监听服务器收到的所有请求",
        "since": "1.0.0"
      },
      {
        "name": "PSYNC",
        "summary": "An internal command used in replication",
        "summaryZh": "复制中使用的内部命令",
        "since": "2.8.0"
      },
      {
        "name": "REPLCONF",
        "summary": "An internal command for configuring the replication stream",
        "summaryZh": "用于配置复制流的内部命令",
        "since": "3.0.0"
      },
      {
        "name": "REPLICAOF",
        "summary": "Configures a server as replica of another, or promotes it to a master",
        "summaryZh": "将服务器配置为另一个服务器的副本，或将其提升为主服务器",
        "since": "5.0.0"
      },
      {
        "name": "RESTORE-ASKING",
        "summary": "An internal command for migrating keys in a cluster",
        "summaryZh": "集群中迁移键的内部命令",
        "since": "3.0.0"
      },
      {
        "name": "ROLE",
        "summary": "Returns the replication role",
        "summaryZh": "返回复制角色",
        "since": "2.8.12"
      },
      {
        "name": "SAVE",
        "summary": "Synchronously saves the database(s) to disk",
        "summaryZh": "同步将数据库保存到磁盘",
        "since": "1.0.0"
      },
      {
        "name": "SHUTDOWN",
        "summary": "Synchronously saves the database(s) to disk and shuts down the Redis server",
        "summaryZh": "同步将数据库保存到磁盘并关闭Redis服务器",
        "since": "1.0.0"
      },
      {
        "name": "SLAVEOF",
        "summary": "Sets a Redis server as a replica of another, or promotes it to being a master",
        "summaryZh": "将Redis服务器设置为另一个服务器的副本，或将其提升为主服务器",
        "since": "1.0.0"
      },
      {
        "name": "SLOWLOG",
        "summary": "A container for slow log commands",
        "summaryZh": "慢日志命令的容器",
        "since": "2.2.12"
      },
      {
        "name": "SLOWLOG GET",
        "summary": "Returns the slow log's entries",
        "summaryZh": "返回慢日志的条目",
        "since": "2.2.12"
      },
      {
        "name": "SLOWLOG HELP",
        "summary": "Show helpful text about the different subcommands",
        "summaryZh": "显示关于不同子命令的帮助文本",
        "since": "6.2.0"
      },
      {
        "name": "SLOWLOG LEN",
        "summary": "Returns the number of entries in the slow log",
        "summaryZh": "返回慢日志中的条目数量",
        "since": "2.2.12"
      },
      {
        "name": "SLOWLOG RESET",
        "summary": "Clears all entries from the slow log",
        "summaryZh": "清除慢日志中的所有条目",
        "since": "2.2.12"
      },
      {
        "name": "SWAPDB",
        "summary": "Swaps two Redis databases",
        "summaryZh": "交换两个Redis数据库",
        "since": "4.0.0"
      },
      {
        "name": "SYNC",
        "summary": "An internal command used in replication",
        "summaryZh": "复制中使用的内部命令",
        "since": "1.0.0"
      },
      {
        "name": "TIME",
        "summary": "Returns the server time",
        "summaryZh": "返回服务器时间",
        "since": "2.6.0"
      }
    ]
  }
]
