import compact from 'lodash.compact';
import flatten from 'lodash.flatten';
import isArray from 'lodash.isarray';
import isEmpty from 'lodash.isempty';
import isFunction from 'lodash.isfunction';
import isNumber from 'lodash.isnumber';
import merge from 'lodash.merge';

export {
  compact,
  flatten,
  isArray,
  isEmpty,
  isFunction,
  isNumber,
  merge,
};

export function isObject(object) {
  return Boolean(object) && object.constructor === Object;
}

export function asArray(array) {
  return isArray(array) ? array : [array];
}

const KNOWN_STATICS = {
  name: true,
  length: true,
  prototype: true,
  caller: true,
  callee: true,
  arguments: true,
  arity: true,
};

const REACT_STATICS = {
  childContextTypes: true,
  contextTypes: true,
  defaultProps: true,
  displayName: true,
  getDefaultProps: true,
  mixins: true,
  propTypes: true,
  type: true,
};

export function hoistStatics({from, to}) {
  Object.getOwnPropertyNames(from).forEach((key) => {
    if (REACT_STATICS[key] || KNOWN_STATICS[key] || to.hasOwnProperty(key)) { return; }
    let descriptor = Object.getOwnPropertyDescriptor(from, key);
    Object.defineProperty(to, key, descriptor);
  });

  return to;
}

const KEBAB_REGEX = /[\-\s]+(.)?/g;
function toUpper(match, char) { return char && char.toUpperCase(); }
export function kebabToCamel(string) {
  return string.replace(KEBAB_REGEX, toUpper);
}
