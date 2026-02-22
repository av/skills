# Turso SQL Reference

## SQL Shell

The `tursodb` command provides an interactive SQL shell.

```console
$ tursodb                    # in-memory transient database
$ tursodb mydata.db          # persistent database file
```

### Shell Commands

| Command | Description |
|---------|-------------|
| `.schema` | Display database schema |
| `.dump` | Dump database contents as SQL |
| `.tables` | List tables |

### CLI Options

| Option | Description |
|--------|-------------|
| `-m`, `--output-mode` `<mode>` | `pretty` (default) or `list` |
| `-q`, `--quiet` | Suppress startup info |
| `-e`, `--echo` | Print commands before execution |
| `--readonly` | Open in read-only mode |
| `--mcp` | Start MCP server instead of shell |
| `--experimental-encryption` | Enable encryption at rest |
| `--experimental-strict` | Enable strict schema |
| `--experimental-views` | Enable views |

## SQL Statements

### CREATE TABLE

```sql
CREATE TABLE table_name (column_name [column_type], ...);
```

### ALTER TABLE

```sql
ALTER TABLE old_name RENAME TO new_name;
ALTER TABLE table_name ADD COLUMN column_name [column_type];
ALTER TABLE table_name DROP COLUMN column_name;
```

### DROP TABLE

```sql
DROP TABLE table_name;
```

### INSERT

```sql
INSERT INTO table_name [(column_name, ...)] VALUES (value, ...) [, (value, ...) ...];
```

### SELECT

```sql
SELECT expression
    [FROM table-or-subquery]
    [WHERE condition]
    [GROUP BY expression];
```

### UPDATE

```sql
UPDATE table_name SET column_name = value [WHERE expression];
```

### DELETE

```sql
DELETE FROM table_name [WHERE expression];
```

### CREATE INDEX

> Indexes are experimental and not enabled by default.

```sql
CREATE INDEX [index_name] ON table_name (column_name);
```

### DROP INDEX

```sql
DROP INDEX index_name;
```

## Transactions

Three types: **deferred** (default), **immediate**, and **concurrent** (MVCC only).

```sql
BEGIN [DEFERRED | IMMEDIATE | EXCLUSIVE | CONCURRENT] [TRANSACTION];
COMMIT [TRANSACTION];
ROLLBACK [TRANSACTION];
END [TRANSACTION];  -- alias for COMMIT
```

- **Deferred**: No locks until first read/write. Upgrades to write on first write statement.
- **Immediate/Exclusive**: Acquires write lock immediately; blocks other writers.
- **Concurrent** (MVCC only): Optimistic concurrency — multiple concurrent readers/writers. Conflict detection at commit time; `SQLITE_BUSY` on write-write conflict.

### Concurrent Transaction Details (MVCC)

- Snapshot isolation: reads see data committed before transaction began
- Row-level conflict detection at commit
- Cannot commit while an exclusive transaction holds the lock
- Use `BEGIN CONCURRENT` for max concurrency; `BEGIN IMMEDIATE` only when exclusive access needed

## Limitations

- No multi-process or multi-threading access
- No savepoints, triggers, views (views experimental behind flag), vacuum
- UTF-8 only
- Query result ordering not guaranteed identical to SQLite
