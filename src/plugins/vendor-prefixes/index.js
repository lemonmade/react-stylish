import createPrefixer from './prefixer';
import environment from 'exenv';

export function createVendorPrefixPlugin(prefixer) {
  return {
    create(rule, {React}) {
      if (!React.isDom) { return rule; }
      return prefixer(rule);
    },
  };
}

export default createVendorPrefixPlugin(createPrefixer(environment));
