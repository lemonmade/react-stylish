import {isObject} from '../../common/utilities';

export const PREFIX = 'containerQuery';
const EXTRACT_NUMBERS_REGEX = new RegExp(`(^${PREFIX}\\(|\\)$)`, 'g');

export function parseContainerQuery(query) {
  let justNumbers = query.replace(EXTRACT_NUMBERS_REGEX, '');
  let [min, max] = justNumbers.split(',').map((number) => number ? parseInt(number, 10) : false);
  return {min: min || 0, max: max || Infinity};
}

export default function createContainerQuery(optionsOrMin, explicitMax, rule) {
  let min = '';
  let max = '';

  if (isObject(optionsOrMin)) {
    min = optionsOrMin.min || min;
    max = optionsOrMin.max || max;
    rule = explicitMax;
  } else {
    min = optionsOrMin || min;
    max = explicitMax || max;
  }

  let key = `${PREFIX}(${min},${max})`;
  return rule ? {[key]: rule} : key;
}
