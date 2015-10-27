import '../helper';

import config, {configure} from '../../common/config';

describe('configure', () => {
  it('overwrites existing properties', () => {
    configure({identifier: 'foo'});
    expect(config).to.have.property('identifier', 'foo');
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
