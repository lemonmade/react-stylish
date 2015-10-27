import '../helper';

import Stylish from '../../native';
import * as SeparateStylish from '../../native';
import {Plugins} from '../../plugins';

describe('Stylish Native', () => {
  describe('exports', () => {
    it('exports a connect function', () => {
      expect(Stylish.connect).to.be.a('function');
      expect(SeparateStylish.connect).to.equal(Stylish.connect);
    });

    it('exports a create function', () => {
      expect(Stylish.create).to.be.a('function');
      expect(SeparateStylish.create).to.equal(Stylish.create);
    });

    it('exports a configure function', () => {
      expect(Stylish.configure).to.be.a('function');
      expect(SeparateStylish.configure).to.equal(Stylish.configure);
    });

    it('exports all plugins', () => {
      expect(Stylish.Plugins).to.equal(Plugins);
    });
  });
});
