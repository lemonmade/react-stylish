import '../helper';
import VendorPrefixesPlugin from '../../plugins/vendor-prefixes';

describe('plugins', () => {
  describe('VendorPrefixesPlugin', () => {
    let React;

    function vendorPrefix(rule, options = {React}) {
      return VendorPrefixesPlugin.create(rule, options);
    }

    beforeEach(() => {
      React = {isDom: true};
    });

    it('does nothing', () => {
      expect(vendorPrefix({})).to.deep.equal({});
    });
  });
});
