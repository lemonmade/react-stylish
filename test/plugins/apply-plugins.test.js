import '../helper';
import React from 'react';
import config from '../../common/config';
import {
  applyCreatePlugins,
  applyAttachPlugins,
} from '../../plugins/apply-plugins';

describe('plugins', () => {
  let pluginOne;
  let pluginTwo;

  let intermediateRule = Object.freeze({color: 'blue'});
  let finalRule = Object.freeze({color: 'green'});

  beforeEach(() => {
    config.plugins.create = [];
    config.plugins.attach = [];
    config.React.use(React, {dom: true});
  });

  describe('applyCreatePlugins', () => {
    let originalRule;

    beforeEach(() => {
      pluginOne = sinon.spy(({rule}) => rule);
      pluginTwo = sinon.spy(({rule}) => rule);
      originalRule = {color: 'red'};
    });

    it('calls all create plugins with the details of the rule', () => {
      config.plugins.create = [pluginOne, pluginTwo];

      applyCreatePlugins({rule: originalRule});

      let expectedConfig = {
        React,
        isDom: true,
        isNative: false,
        dynamic: false,
        rule: originalRule,
      };

      expect(pluginOne).to.have.been.calledWith(expectedConfig);
      expect(pluginTwo).to.have.been.calledWith(expectedConfig);
    });

    it('passes the dynamic attribute from the original call', () => {
      config.plugins.create = pluginOne;
      applyCreatePlugins({rule: originalRule, dynamic: true});
      expect(pluginOne.lastCall.args[0]).to.have.property('dynamic', true);
    });

    it('returns the result of the resolved rules', () => {
      pluginOne = sinon.spy(() => intermediateRule);
      pluginTwo = sinon.spy(() => finalRule);
      config.plugins.create = [pluginOne, pluginTwo];

      let result = applyCreatePlugins({rule: originalRule});
      expect(pluginOne.lastCall.args[0].rule).to.equal(originalRule);
      expect(pluginTwo.lastCall.args[0].rule).to.equal(intermediateRule);
      expect(result).to.equal(finalRule);
    });
  });

  describe('applyAttachPlugins', () => {
    let originalRules;

    beforeEach(() => {
      config.plugins.create = [];
      config.plugins.attach = [];

      pluginOne = sinon.spy(({rules}) => rules);
      pluginTwo = sinon.spy(({rules}) => rules);
      originalRules = [{color: 'red'}, {color: 'purple'}];
    });

    it('calls all attach plugins with the passed rules', () => {
      config.plugins.attach = [pluginOne, pluginTwo];

      let expectedConfig = {
        React,
        isDom: true,
        isNative: false,
        rules: originalRules,
      };

      applyAttachPlugins({rules: originalRules});
      expect(pluginOne).to.have.been.calledWith(expectedConfig);
      expect(pluginTwo).to.have.been.calledWith(expectedConfig);
    });

    it('returns the result of the resolved rules', () => {
      pluginOne = sinon.spy(() => { return intermediateRule; });
      pluginTwo = sinon.spy(() => { return finalRule; });
      config.plugins.attach = [pluginOne, pluginTwo];

      let result = applyAttachPlugins({rules: originalRules});
      expect(pluginOne.lastCall.args[0]).to.have.property('rules', originalRules);
      expect(pluginTwo.lastCall.args[0]).to.have.property('rules', intermediateRule);
      expect(result).to.equal(finalRule);
    });
  });
});
