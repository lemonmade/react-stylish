import '../helper';
import VendorPrefixesPlugin from '../../plugins/vendor-prefixes';

describe('plugins', () => {
  describe('VendorPrefixesPlugin', () => {
    let React;

    function vendorPrefix(options) {
      options.React = options.React || React;
      return VendorPrefixesPlugin.create(options);
    }

    beforeEach(() => {
      React = {isDom: true};
    });

    it('does nothing', () => {
      expect(vendorPrefix({rule: {}})).to.deep.equal({});
    });
  });
});
