import {kebabToCamel} from '../../common/utilities';

export default function createPrefixer({canUseDOM}) {
  if (!canUseDOM) { return (rule) => rule; }

  const el = document.createElement('div');
  const style = el.style;

  // Apparently, older FF versions might have no float property.
  if (style.float == null) { style.float = ''; }

  let prefixes = {js: '', css: ''};

  const prefixMapping = {
    Webkit: '-webkit-',
    Moz: '-moz-',
    ms: '-ms-',
    O: '-o-', // eslint-disable-line id-length
  };

  const testProp = 'Transform';
  Object.keys(prefixMapping).forEach((js) => {
    if (Boolean(prefixes.js) || !(`${js}${testProp}` in style)) { return; }
    prefixes.js = js;
    prefixes.css = prefixMapping[js];
  });

  let valueCache = {};
  const COLOR_TEST = /^rgb/;

  function getValueName(property, value) {
    if (typeof value !== 'string' || !isNaN(parseInt(value, 10))) { return value; }
    let cacheKey = `${property}${value}`;
    if (valueCache[cacheKey] != null) { return valueCache[cacheKey]; }

    el.style[property] = value;
    let result = el.style[property];

    if (result === value || (result && result.match(COLOR_TEST))) {
      valueCache[cacheKey] = value;
    } else {
      value = `${prefixes.css}${value}`;
      el.style[property] = value;
      valueCache[cacheKey] = (el.style[property] === value) ? value : false;
    }

    return valueCache[cacheKey];
  }

  // Prefill the cache
  let propertyCache = {};
  let computed = window.getComputedStyle(document.documentElement);
  Object.keys(computed).forEach((key) => propertyCache[computed[key]] = computed[key]);

  function getPropertyName(property) {
    if (propertyCache[property] != null) { return propertyCache[property]; }

    let camelProp = kebabToCamel(property);
    if (camelProp in el.style) {
      // CSS-style value
      propertyCache[property] = property;
    } else {
      // Vendor prefix or no match
      let prefixedProp = `${prefixes.js}${camelProp[0].toUpperCase()}${camelProp.substr(1)}`;
      propertyCache[property] = (prefixedProp in style) ? prefixedProp : false;
    }

    return propertyCache[property];
  }

  return function prefix(rule) {
    let prefixedRule = {};

    Object.keys(rule).forEach((property) => {
      let propertyName = getPropertyName(property);
      if (propertyName === false) { return; }

      let value = rule[property];
      let valueName = getValueName(property, value);
      if (valueName === false) { return; }

      prefixedRule[propertyName] = valueName;
    });

    return prefixedRule;
  };
}
