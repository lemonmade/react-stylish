import './helper';

import Stylish from '../src';
import * as SeparateStylish from '../src';
import * as Plugins from '../src/plugins';
import createContainerQuery from '../src/plugins/container-queries/create';

describe('Stylish DOM', () => {
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

    it('exports a ContainerQueries utility', () => {
      expect(Stylish.ContainerQueries).to.deep.equal({create: createContainerQuery});
      expect(Stylish.CQ).to.deep.equal(Stylish.ContainerQueries);
      expect(SeparateStylish.ContainerQueries).to.equal(Stylish.ContainerQueries);
      expect(SeparateStylish.CQ).to.deep.equal(Stylish.ContainerQueries);
    });

    it('exports all plugins', () => {
      expect(Stylish.Plugins).to.equal(Plugins);
    });
  });
});
