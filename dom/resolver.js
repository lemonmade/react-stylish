import React from 'react';
import createResolver from '../common/resolver';

export default createResolver({
  Children: React.Children,
  isValidElement: React.isValidElement,
  cloneElement: React.cloneElement,
  isCustomComponent(element) { return typeof element.type !== 'string'; },
});
