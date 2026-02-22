# Turso JavaScript API

## Installation

Native package:

```console
npm i @tursodatabase/database
```

WebAssembly package:

```console
npm i @tursodatabase/database --cpu wasm32
```

## Getting Started

```javascript
import { connect } from '@tursodatabase/database';

const db = await connect('turso.db');
const row = db.prepare('SELECT 1').get();
console.log(row);
```

Use `Database.prepare()` to create prepared statements and `Statement.get()` to execute them.

For full API details, see the [JavaScript API reference](https://github.com/tursodatabase/turso/blob/main/docs/javascript-api-reference.md).
