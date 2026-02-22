# Turso Advanced Features

## Journal Modes

Query or switch journal mode at runtime:

```sql
PRAGMA journal_mode;                          -- query current mode
PRAGMA journal_mode = wal;                    -- WAL mode (default)
PRAGMA journal_mode = experimental_mvcc;      -- MVCC mode
```

- Switching modes triggers a checkpoint
- Legacy SQLite databases auto-convert to WAL on open
- Legacy modes (`delete`, `truncate`, `persist`, `memory`, `off`) not supported

## Encryption (Experimental)

Requires `--experimental-encryption` flag.

### Setup

Generate a 32-byte hex key:

```shell
openssl rand -hex 32
```

### Create Encrypted Database

```shell
tursodb --experimental-encryption database.db
```

Then in the shell:

```sql
PRAGMA cipher = 'aegis256';   -- or 'aes256gcm'
PRAGMA hexkey = '<your-64-char-hex-key>';
```

Or via URI:

```shell
tursodb --experimental-encryption \
  "file:database.db?cipher=aegis256&hexkey=<your-64-char-hex-key>"
```

### Reopening Encrypted Database

Must use URI format with cipher and hexkey parameters:

```shell
tursodb --experimental-encryption \
  "file:database.db?cipher=aegis256&hexkey=<your-64-char-hex-key>"
```

### Supported Ciphers

AES-GCM (128/256-bit), AEGIS-256, AEGIS-256-X2, AEGIS-256-X4, AEGIS-128L, AEGIS-128-X2, AEGIS-128-X4.

## Change Data Capture (CDC) — Early Preview

Track all inserts, updates, and deletes per connection in real-time.

### Enable CDC

```sql
PRAGMA unstable_capture_data_changes_conn('<mode>[,custom_cdc_table]');
```

### Modes

| Mode | Description |
|------|-------------|
| `off` | Disable CDC |
| `id` | Log only rowid (most compact) |
| `before` | Capture row state before updates/deletes |
| `after` | Capture row state after inserts/updates |
| `full` | Both before and after states (recommended for audit) |

Changes are logged to `turso_cdc` table (or a custom table name).

### CDC Table Schema

| Column | Type | Description |
|--------|------|-------------|
| `change_id` | INTEGER | Monotonically increasing PK |
| `change_time` | INTEGER | Unix epoch seconds |
| `change_type` | INTEGER | 1=INSERT, 0=UPDATE, -1=DELETE |
| `table_name` | TEXT | Affected table |
| `id` | INTEGER | Rowid of affected row |
| `before` | BLOB | Row state before change (NULL for INSERT) |
| `after` | BLOB | Row state after change (NULL for DELETE) |
| `updates` | BLOB | Granular column modifications (UPDATE only) |

### Example

```sql
PRAGMA unstable_capture_data_changes_conn('full');
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
INSERT INTO users VALUES (1, 'John'), (2, 'Jane');
UPDATE users SET name='John Doe' WHERE id=1;
DELETE FROM users WHERE id=2;
SELECT * FROM turso_cdc;
```

### Notes

- CDC records visible before transaction commits
- Failed operations not recorded
- Schema changes tracked with `table_name = 'sqlite_schema'`
- `full` mode: each N-byte update writes 3x to disk (before + after + WAL)
- `WITHOUT ROWID` tables not supported

## Index Methods (Experimental)

Requires `--experimental-index-method` flag. Custom data access methods integrated with query planner.

### Create/Drop

```sql
CREATE INDEX t_idx ON t USING index_method_name (column1, column2);
CREATE INDEX t_idx ON t USING index_method_name (c) WITH (a = 1, b = 'text');
DROP INDEX t_idx;
```

DML (INSERT/DELETE/UPDATE) on the base table automatically updates the index. The query planner automatically uses the index when a query matches one of the index method's patterns.

## SQLite C API

Turso supports a subset of the SQLite C API:

- `sqlite3_open` / `sqlite3_open_v2` — open connection
- `sqlite3_prepare_v2` — prepare SQL statement
- `sqlite3_step` — execute/advance prepared statement
- `sqlite3_column_*` — extract column values (`type`, `count`, `decltype`, `name`, `int64`, `double`, `blob`, `bytes`, `text`)
- `libsql_wal_frame_count` — get WAL frame count (Turso extension)
