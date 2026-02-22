# Turso Full-Text Search (Experimental)

Powered by [Tantivy](https://github.com/quickwit-oss/tantivy). Requires the `fts` feature at compile time.

## Creating an FTS Index

```sql
CREATE INDEX idx_articles ON articles USING fts (title, body);
```

## Tokenizer Configuration

```sql
CREATE INDEX idx_products ON products USING fts (name) WITH (tokenizer = 'ngram');
```

| Tokenizer | Description | Use Case |
|-----------|-------------|----------|
| `default` | Lowercase, punctuation split, 40 char limit | General English text |
| `raw` | No tokenization — exact match only | IDs, UUIDs, tags |
| `simple` | Basic whitespace/punctuation split | Simple text without lowercase |
| `whitespace` | Split on whitespace only | Space-separated tokens |
| `ngram` | 2-3 character n-grams | Autocomplete, substring matching |

## Field Weights

```sql
CREATE INDEX idx_articles ON articles USING fts (title, body)
WITH (weights = 'title=2.0,body=1.0');
```

## Query Functions

### `fts_match(col1, col2, ..., 'query')`

Returns boolean — use in WHERE clauses:

```sql
SELECT id, title FROM articles WHERE fts_match(title, body, 'database');
```

### `fts_score(col1, col2, ..., 'query')`

Returns BM25 relevance score:

```sql
SELECT fts_score(title, body, 'database') as score, id, title
FROM articles
WHERE fts_match(title, body, 'database')
ORDER BY score DESC
LIMIT 10;
```

### `fts_highlight(col1, col2, ..., before_tag, after_tag, 'query')`

Returns text with matching terms wrapped in tags:

```sql
SELECT fts_highlight(body, '<mark>', '</mark>', 'database') as highlighted
FROM articles
WHERE fts_match(title, body, 'database');
```

## Query Syntax (Tantivy)

| Syntax | Example | Description |
|--------|---------|-------------|
| Single term | `database` | Documents containing "database" |
| Multiple terms (OR) | `database sql` | "database" OR "sql" |
| AND | `database AND sql` | Both terms required |
| NOT | `database NOT nosql` | Exclude "nosql" |
| Phrase | `"full text search"` | Exact phrase |
| Prefix | `data*` | Terms starting with "data" |
| Column filter | `title:database` | Match in specific field |
| Boosting | `title:database^2` | Boost field matches |

Combine with regular WHERE conditions:

```sql
SELECT id, title, fts_score(title, body, 'Rust') as score
FROM articles
WHERE fts_match(title, body, 'Rust')
  AND category = 'tech'
ORDER BY score DESC;
```

## Index Maintenance

```sql
OPTIMIZE INDEX idx_articles;  -- specific index
OPTIMIZE INDEX;               -- all FTS indexes
```

Run after bulk inserts or when query performance degrades.

## Limitations

- Use `fts_match()` function, not `WHERE table MATCH 'query'`
- FTS changes visible only after COMMIT (no read-your-writes in transaction)

## Complete Example

```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY,
    title TEXT,
    content TEXT,
    category TEXT
);

CREATE INDEX fts_docs ON documents USING fts (title, content)
WITH (weights = 'title=2.0,content=1.0');

INSERT INTO documents VALUES
    (1, 'Introduction to SQL', 'Learn SQL basics and queries', 'tutorial'),
    (2, 'Advanced SQL Techniques', 'Complex joins and optimization', 'tutorial'),
    (3, 'Database Design', 'Schema design best practices', 'architecture');

SELECT
    id,
    title,
    fts_score(title, content, 'SQL') as score,
    fts_highlight(content, '<b>', '</b>', 'SQL') as snippet
FROM documents
WHERE fts_match(title, content, 'SQL')
ORDER BY score DESC;
```
