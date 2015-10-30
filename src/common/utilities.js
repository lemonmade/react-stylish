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

const KEYS_TO_IGNORE_WHEN_COPYING_PROPERTIES = [
  'arguments',
  'callee',
  'caller',
  'length',
  'name',
  'prototype',
  'type',
];

export function copyPropertyDescriptors({from, to}) {
  Object.getOwnPropertyNames(from).forEach((key) => {
    if (
      KEYS_TO_IGNORE_WHEN_COPYING_PROPERTIES.indexOf(key) < 0 &&
      !to.hasOwnProperty(key)
    ) {
      let descriptor = Object.getOwnPropertyDescriptor(from, key);
      Object.defineProperty(to, key, descriptor);
    }
  });
}

const KEBAB_REGEX = /[\-\s]+(.)?/g;
function toUpper(match, char) { return char && char.toUpperCase(); }
export function kebabToCamel(string) {
  return string.replace(KEBAB_REGEX, toUpper);
}
