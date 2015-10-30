import '../../helper';
import VendorPrefixesPlugin, {createVendorPrefixPlugin} from '../../../src/plugins/vendor-prefixes';

describe('plugins', () => {
  describe('VendorPrefixesPlugin', () => {
    const rule = Object.freeze({textStrokeWidth: 2});
    let prefixer;
    let Plugin;

    beforeEach(() => {
      prefixer = sinon.stub().returns({WebkitTextStrokeWidth: 2});
      Plugin = createVendorPrefixPlugin(prefixer);
    });

    it('exports a default plugin with a create method', () => {
      expect(VendorPrefixesPlugin.create).to.be.a('function');
    });

    it('calls the prefixer with the passed rule', () => {
      let result = Plugin.create(rule, {React: {isDom: true}});
      expect(prefixer).to.have.been.calledWith(rule);
      expect(result).to.deep.equal({WebkitTextStrokeWidth: 2});
    });

    it('does not prefix when not using React DOM', () => {
      let result = Plugin.create(rule, {React: {isDom: false}});
      expect(prefixer).not.to.have.been.called;
      expect(result).to.equal(rule);
    });
  });
});
