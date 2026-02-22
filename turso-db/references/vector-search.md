# Turso Vector Search

## Vector Types

| Type | Function | Description | Storage |
|------|----------|-------------|---------|
| Float32 dense | `vector32()` | 32-bit float per dimension | 4 bytes/dim |
| Float64 dense | `vector64()` | 64-bit float per dimension | 8 bytes/dim |
| Float32 sparse | `vector32_sparse()` | Non-zero 32-bit floats + indices | Variable |
| 8-bit quantized | `vector8()` | Linearly quantized to 8-bit int | 1 byte/dim + 8 bytes |
| 1-bit binary | `vector1bit()` | Positive→1, non-positive→0 | 1 bit/dim |

## Creating Vectors

```sql
SELECT vector32('[1.0, 2.0, 3.0]');
SELECT vector64('[1.0, 2.0, 3.0]');
SELECT vector32_sparse('[0.0, 1.5, 0.0, 2.3, 0.0]');
SELECT vector8('[1.0, 2.0, 3.0, 4.0]');
SELECT vector1bit('[1, -1, 1, 1, -1, 0, 0.5]');
```

## Extracting Vectors

```sql
SELECT vector_extract(embedding) FROM documents;
```

## Distance Functions

All require same type and dimension for both vectors.

| Function | Returns | Ideal for |
|----------|---------|-----------|
| `vector_distance_cos(v1, v2)` | 0 (identical) to 2 (opposite) | Text embeddings, document similarity |
| `vector_distance_l2(v1, v2)` | Euclidean distance | Image embeddings, spatial data |
| `vector_distance_dot(v1, v2)` | Negative dot product | Normalized embeddings, MIPS |
| `vector_distance_jaccard(v1, v2)` | Weighted Jaccard distance | Sparse vectors, TF-IDF, bag-of-words |

For `vector1bit`: `cos` returns Hamming distance; `l2` returns error; `jaccard` returns binary Jaccard distance.

## Utility Functions

```sql
-- Concatenate two vectors
SELECT vector_concat(vector32('[1.0, 2.0]'), vector32('[3.0, 4.0]'));
-- → [1.0, 2.0, 3.0, 4.0]

-- Slice a vector (start_index to end_index, exclusive)
SELECT vector_slice(vector32('[1.0, 2.0, 3.0, 4.0, 5.0]'), 1, 4);
-- → [2.0, 3.0, 4.0]
```

## Example: Semantic Search

```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY,
    name TEXT,
    content TEXT,
    embedding BLOB
);

INSERT INTO documents (name, content, embedding) VALUES
    ('Doc 1', 'Machine learning basics', vector32('[0.2, 0.5, 0.1, 0.8]')),
    ('Doc 2', 'Database fundamentals', vector32('[0.1, 0.3, 0.9, 0.2]')),
    ('Doc 3', 'Neural networks guide', vector32('[0.3, 0.6, 0.2, 0.7]'));

SELECT
    name,
    content,
    vector_distance_cos(embedding, vector32('[0.25, 0.55, 0.15, 0.75]')) AS similarity
FROM documents
ORDER BY similarity
LIMIT 5;
```
