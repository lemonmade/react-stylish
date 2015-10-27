import React from 'react';

React.isDom = true;
React.isNative = false;

React.isCustomComponent = function(element) {
  return typeof element.type !== 'string';
};

export default React;
