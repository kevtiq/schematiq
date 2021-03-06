import get from './get';
import { Primitive, TypedObject } from './types';

type Errors = TypedObject<string>;
type Schema = TypedObject<Rule>;
type Rule = {
  type: string;
  required?: boolean;
  message?: string;
  rule?(v: Primitive, obj?: object): boolean;
  regexp?: RegExp;
  each?: Schema;
};

// helper that checks if a value exists (not null and not undefined)
function exists(value: Primitive): boolean {
  return value !== undefined && value !== null;
}

// returns the message of a rule or a default value
function message(rule: Rule, def: string): string {
  return rule.message || def;
}

function evaluate(
  value: Primitive,
  rule: Rule,
  obj?: object
): string | undefined {
  let error: string | undefined;
  // property is required but does not exists
  if (rule.required && !exists(value)) error = message(rule, 'required');
  // no need to continue if the value does not exists
  else if (!exists(value)) return;
  // property is of the wrong type, except for checking array types
  else if (typeof value !== rule.type && rule.type !== 'array')
    error = message(rule, 'type');
  // type checking for arrays
  else if (rule.type === 'array' && (!Array.isArray(value) || !rule.each))
    error = message(rule, 'type');
  // in case of primitives in the array, check them directly
  else if (
    rule.type === 'string' &&
    rule.regexp?.test(value as string) === false
  )
    error = message(rule, 'format');
  // property does not apply to custom rule
  else if (rule.rule && !rule.rule(value, obj)) error = message(rule, 'other');
  return error;
}

export default function validate(obj: object, schema: Schema): Errors {
  const errors: Errors = {};

  Object.entries(schema).forEach(([key, rule]) => {
    const value = get(obj, key);
    const error = evaluate(value, rule);
    if (error) errors[key] = error;
    if (error || rule.type !== 'array' || !exists(value)) return;

    (value as Array<object>).forEach((v, i) => {
      const nestedErrors = validate(v, rule.each as Schema);
      Object.entries(nestedErrors).forEach(
        ([k, e]) => (errors[`${key}.${i}.${k}`] = e)
      );
    });
  });
  return errors;
}
