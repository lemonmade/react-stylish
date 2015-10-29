import '../helper';

import config, {configure} from '../../src/common/config';

describe('configure', () => {
  it('overwrites existing properties', () => {
    configure({identifier: 'foo'});
    expect(config).to.have.property('identifier', 'foo');
  });

  describe('.addPlugins', () => {
    it('adds plugins after the existing set of plugins', () => {
      let pluginOne = {attach() {}};
      let pluginTwo = {create() {}};
      let pluginThree = {add() {}};

      configure({plugins: [pluginOne]});
      configure.addPlugins(pluginTwo, pluginThree);
      expect(config.plugins).to.deep.equal([pluginOne, pluginTwo, pluginThree]);
    });
  });

  describe('.defaults', () => {
    it('resets the config to defaults', () => {
      let defaults = {...config};

      let newConfig = {};
      Object.keys(config).forEach((key) => newConfig[key] = 'foo');
      configure(newConfig);
      expect(config).to.deep.equal(newConfig);

      configure.defaults();
      expect(config).to.deep.equal(defaults);
    });

    it('deletes any extra properties that were added', () => {
      configure({foo: 'bar'});
      expect(config).to.have.property('foo');

      configure.defaults();
      expect(config).not.to.have.property('foo');
    });
  });
});
