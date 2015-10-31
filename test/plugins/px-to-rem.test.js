import '../helper';

import PxToRemPlugin from '../../src/plugins/px-to-rem';

describe('plugins', () => {
  describe('PxToRemPlugin', () => {
    let React;

    function pxToRem(rule, options = {React}) {
      return PxToRemPlugin.create(rule, options);
    }

    beforeEach(() => {
      React = {isDom: true};
    });

    const RULE_WITH_PX_PROPERTIES = Object.freeze({
      borderWidth: 1,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      textStrokeWidth: 1,
    });

    const RULE_WITH_UNITLESS_PROPERTIES = Object.freeze({
      boxFlex: 1,
      boxFlexGroup: 1,
      columnCount: 1,
      fillOpacity: 1,
      flex: 1,
      flexGrow: 1,
      flexNegative: 1,
      flexPositive: 1,
      flexShrink: 1,
      fontWeight: 1,
      lineClamp: 1,
      lineHeight: 1,
      opacity: 1,
      order: 1,
      orphans: 1,
      strokeDashoffset: 1,
      strokeOpacity: 1,
      strokeWidth: 1,
      tabSize: 1,
      textStrokeWidth: 1,
      widows: 1,
      zIndex: 1,
      zoom: 1,
    });

    it('converts numbers to the associated rem amounts', () => {
      let result = pxToRem({padding: 32, width: 300});

      expect(result).to.have.property('padding', '2rem');
      expect(result).to.have.property('width', '18.75rem');
    });

    it('does not convert strings to rem amounts', () => {
      let result = pxToRem({padding: '32'});

      expect(result).to.have.property('padding', '32');
    });

    it('does not change properties that should stay as pixel values', () => {
      let result = pxToRem({...RULE_WITH_PX_PROPERTIES});

      Object.keys(RULE_WITH_PX_PROPERTIES).forEach((property) => {
        expect(result).to.have.property(property, RULE_WITH_PX_PROPERTIES[property]);
      });
    });

    it('does not change unitless numbers', () => {
      let result = pxToRem({...RULE_WITH_UNITLESS_PROPERTIES});

      Object.keys(RULE_WITH_UNITLESS_PROPERTIES).forEach((property) => {
        expect(result).to.have.property(property, RULE_WITH_UNITLESS_PROPERTIES[property]);
      });
    });

    it('does not change properties that need pixels but are 0', () => {
      let result = pxToRem({padding: 0});
      expect(result).to.have.property('padding', 0);
    });

    it('only applies to React DOM', () => {
      let rule = {padding: 32, width: 300};
      let ruleCopy = {...rule};
      let result = pxToRem(rule, {React: {isDom: false}});

      expect(result).to.deep.equal(ruleCopy);
    });

    describe('.excluding', () => {
      const CustomPxToRemPlugin = PxToRemPlugin.excluding('padding', 'margin');

      function customPxToRem(rule, options = {React}) {
        return CustomPxToRemPlugin.create(rule, options);
      }

      it('creates a plugin that excludes the specified properties', () => {
        let rule = {padding: 32, margin: 32};
        let ruleCopy = {...rule};
        let result = customPxToRem(rule);

        Object.keys(result).forEach((property) => {
          expect(ruleCopy[property]).to.equal(rule[property]);
        });
      });

      it('still converts non-omitted properties', () => {
        let result = customPxToRem({width: 300});

        expect(result).to.have.property('width', '18.75rem');
      });

      it('still does not change properties that should stay as pixel values', () => {
        let result = pxToRem({...RULE_WITH_PX_PROPERTIES});

        Object.keys(RULE_WITH_PX_PROPERTIES).forEach((property) => {
          expect(result).to.have.property(property, RULE_WITH_PX_PROPERTIES[property]);
        });
      });

      it('still does not change unitless numbers', () => {
        let result = pxToRem({...RULE_WITH_UNITLESS_PROPERTIES});

        Object.keys(RULE_WITH_UNITLESS_PROPERTIES).forEach((property) => {
          expect(result).to.have.property(property, RULE_WITH_UNITLESS_PROPERTIES[property]);
        });
      });
    });
  });
});
