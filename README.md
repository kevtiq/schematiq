# Schematiq - JavaScript object schematiqs

![](https://github.com/kevtiq/schematiq/workflows/test/badge.svg)
[![Node version](https://img.shields.io/npm/v/schematiq.svg?style=flat)](https://www.npmjs.com/package/schematiq)
[![NPM Downloads](https://img.shields.io/npm/dm/schematiq.svg?style=flat)](https://www.npmjs.com/package/schematiq)
[![Minified size](https://img.shields.io/bundlephobia/min/schematiq?label=minified)](https://www.npmjs.com/package/schematiq)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight library that allows for object handling based on various schemas. The library includes object validation, (de-)normalization and transformation.

## Object validation

For object validation one defines rules for each property of the object. Combined, rules define the validation schema. Each rule must contain a `type`. Other settings are optional.

```ts
type Rule = {
  type: 'string' | 'boolean' | 'number' | 'array'; // type error
  required?: boolean; // required error
  message?: 'my custom message';
  regexp?: RegExp; // format error, only when type = 'string'
  rule?: (value, obj) => boolean; // other error
  each?: Schema; // required when type = 'array'
};

type Schema = {
  [key: string]: Rule; // also for nested properties, e.g. "nested.property"
};
```

when

An object can be validated by using the `validate` function of **schematiq**. It returns an object indicating which properties of the object have errors. It also indicates the type of error, unless you set a custom error message.

```js
import { validate } from 'schematiq';

const errors = validate(obj, schema);
// { "nested.property": "type" | "required" | "format" | "other" | "my custom message" }
```

## Object normalization and denormalization

Normalization allows for deep nested objects to be transformed into a flat dictionary, while denormalization reverses this. See the example below.

```js
const input = [
  {
    likes: [
      { id: 1, name: 'Like 1' },
      { id: 2, name: 'Like 2' }
    ],
    company: { id: 1, name: 'Company 1', likes: [{ id: 1, name: 'Like 1' }] }
  },
  {
    id: 2,
    name: 'User 2',
    likes: [
      { id: 1, name: 'Like 1' },
      { id: 3, name: 'Like 3' }
    ]
  }
];

const output = {
  users: [
    { id: 1, name: 'User 1', likes: [1, 2], company: 1 },
    { id: 2, name: 'User 2', likes: [1, 2] }
  ],
  likes: [
    { id: 1, name: 'Like 1' },
    { id: 2, name: 'Like 2' },
    { id: 3, name: 'Like 3' }
  ],
  companies: [{ id: 1, name: 'Company 1', likes: [1] }]
};
```

To allow for (de-)normalization, a schema has to be created indicating how objects relate to each other. You can build these schemas using the `schema(name, relations)` helper from **schematiq**. The `name` parameter indicates in which dictionary of the output the objects will be stored. The `relations` parameter is an object representing those parts of the schema that indicates relationships to other objects.

```js
import { schema, normalize, denormalize } from 'schematiq';

const likeSchema = schema('likes');
const companySchema = schema('companies', { likes: [likeSchema] });
const userSchema = schema('users', {
  likes: [likeSchema],
  company: companySchema
});

const output = normalize(input, userSchema);
const input = denormalize(output, userSchema);
```

## Object helpers

In addition, some simple helpers around objects are also present.

- `get(obj, path, defaultValue = undefined)`: retrieves a value in a nested object, defined by its path. Optionally, the default value can be provided;
- `set(obj, path, value)`: sets a value in a nested object defined by its path. If the structure of the object does not suffice, this function will make it so;
