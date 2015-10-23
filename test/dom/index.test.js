import '../helper';
import React from 'react';
import Stylish from '../..';
import * as SeparateStylish from '../..';
import Plugins from '../../plugins';
import config from '../../common/config';

describe('Stylish DOM', () => {
  it('exports a connect function', () => {
    expect(Stylish.connect).to.be.a('function');
    expect(SeparateStylish.connect).to.equal(Stylish.connect);
  });

  it('exports a create function', () => {
    expect(Stylish.create).to.be.a('function');
    expect(SeparateStylish.create).to.equal(Stylish.create);
  });

  it('exports all plugins', () => {
    expect(Stylish.Plugins).to.equal(Plugins);
  });

  it('sets the react version to DOM', () => {
    expect(config.React.Library).to.equal(React);
    expect(config.React.isDom).to.be.true;
    expect(config.React.isNative).to.be.false;
  });
});
