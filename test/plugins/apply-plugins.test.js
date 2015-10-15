import '../helper';
import config from '../../common/config';
import {
  applyCreatePlugins,
  applyAttachPlugins,
} from '../../plugins/apply-plugins';

describe('plugins', () => {
  let pluginOne;
  let pluginTwo;

  beforeEach(() => {
    config.plugins.create = [];
    config.plugins.attach = [];
  });

  describe('applyCreatePlugins', () => {
    let originalRule;

    beforeEach(() => {
      pluginOne = sinon.spy(({rule}) => rule);
      pluginTwo = sinon.spy(({rule}) => rule);
      originalRule = {color: 'red'};
    });

    it('calls all create plugins with the passed rule', () => {
      config.plugins.create = [pluginOne, pluginTwo];

      applyCreatePlugins({rule: originalRule});
      expect(pluginOne).to.have.been.calledWith({rule: originalRule});
      expect(pluginTwo).to.have.been.calledWith({rule: originalRule});
    });

    it('returns the result of the resolved rules', () => {
      pluginOne = sinon.spy(() => { return {color: 'blue'}; });
      pluginTwo = sinon.spy(() => { return {color: 'green'}; });
      config.plugins.create = [pluginOne, pluginTwo];

      let result = applyCreatePlugins({rule: originalRule});
      expect(pluginOne).to.have.been.calledWith({rule: originalRule});
      expect(pluginTwo).to.have.been.calledWith({rule: {color: 'blue'}});
      expect(result).to.deep.equal({color: 'green'});
    });

    it('does not call attach plugins', () => {
      config.plugins.create = pluginOne;
      config.plugins.attach = pluginTwo;

      applyCreatePlugins({rule: originalRule});
      expect(pluginOne).to.have.been.called;
      expect(pluginTwo).to.not.have.been.called;
    });

    it('does not call a plugin that is meant for a different version of react', () => {
      pluginOne.options = {react: 'native'};
      pluginTwo.options = {react: 'dom'};
      config.react = 'dom';
      config.plugins.create = [pluginOne, pluginTwo];

      applyCreatePlugins({rule: originalRule});
      expect(pluginOne).to.not.have.been.called;
      expect(pluginTwo).to.have.been.called;
    });

    it('does not call a plugin that is meant for a different stage', () => {
      pluginOne.options = {stage: 'attach'};
      pluginTwo.options = {stage: 'create'};
      config.react = 'dom';
      config.plugins.create = [pluginOne, pluginTwo];

      applyCreatePlugins({rule: originalRule});
      expect(pluginOne).to.not.have.been.called;
      expect(pluginTwo).to.have.been.called;
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

      applyAttachPlugins({rules: originalRules});
      expect(pluginOne).to.have.been.calledWith({rules: originalRules});
      expect(pluginTwo).to.have.been.calledWith({rules: originalRules});
    });

    it('returns the result of the resolved rules', () => {
      pluginOne = sinon.spy(() => { return {color: 'blue'}; });
      pluginTwo = sinon.spy(() => { return {color: 'green'}; });
      config.plugins.attach = [pluginOne, pluginTwo];

      let result = applyAttachPlugins({rules: originalRules});
      expect(pluginOne).to.have.been.calledWith({rules: originalRules});
      expect(pluginTwo).to.have.been.calledWith({rules: {color: 'blue'}});
      expect(result).to.deep.equal({color: 'green'});
    });

    it('does not call create plugins', () => {
      config.plugins.attach = pluginOne;
      config.plugins.create = pluginTwo;

      applyAttachPlugins({rules: originalRules});
      expect(pluginOne).to.have.been.called;
      expect(pluginTwo).to.not.have.been.called;
    });

    it('does not call a plugin that is meant for a different version of react', () => {
      pluginOne.options = {react: 'native'};
      pluginTwo.options = {react: 'dom'};
      config.react = 'dom';
      config.plugins.attach = [pluginOne, pluginTwo];

      applyAttachPlugins({rules: originalRules});
      expect(pluginOne).to.not.have.been.called;
      expect(pluginTwo).to.have.been.called;
    });

    it('does not call a plugin that is meant for a different stage', () => {
      pluginOne.options = {stage: 'create'};
      pluginTwo.options = {stage: 'attach'};
      config.react = 'dom';
      config.plugins.attach = [pluginOne, pluginTwo];

      applyAttachPlugins({rules: originalRules});
      expect(pluginOne).to.not.have.been.called;
      expect(pluginTwo).to.have.been.called;
    });
  });
});
