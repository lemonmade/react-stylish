import '../helper';
import PxToRemPlugin from '../../plugins/px-to-rem';

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

    it('converts numbers to the associated rem amounts', () => {
      let rule = {padding: 32, width: 300};

      pxToRem(rule);
      expect(rule.padding).to.equal('2rem');
      expect(rule.width).to.equal('18.75rem');
    });

    it('does not convert strings to rem amounts', () => {
      let rule = {padding: '32'};
      pxToRem(rule);
      expect(rule.padding).to.equal('32');
    });

    it('does not change properties that should stay as pixel values', () => {
      let rule = {...RULE_WITH_PX_PROPERTIES};

      pxToRem(rule);
      Object.keys(RULE_WITH_PX_PROPERTIES).forEach((property) => {
        expect(RULE_WITH_PX_PROPERTIES[property]).to.equal(rule[property]);
      });
    });

    it('only applies to React DOM', () => {
      let rule = {padding: 32, width: 300};
      let ruleCopy = {...rule};

      pxToRem({rule, React: {isDom: false}});
      expect(rule).to.deep.equal(ruleCopy);
    });

    describe('.excluding', () => {
      const CustomPxToRemPlugin = PxToRemPlugin.excluding('padding', 'margin');

      function customPxToRem(rule, options = {React}) {
        return CustomPxToRemPlugin.create(rule, options);
      }

      it('creates a plugin that excludes the specified properties', () => {
        let rule = {padding: 32, margin: 32};
        let ruleCopy = {...rule};

        customPxToRem(rule);
        Object.keys(ruleCopy).forEach((property) => {
          expect(ruleCopy[property]).to.equal(rule[property]);
        });
      });

      it('still converts non-omitted properties', () => {
        let rule = {width: 300};
        customPxToRem(rule);
        expect(rule).to.have.property('width', '18.75rem');
      });

      it('still omits pixel-required values', () => {
        let rule = {...RULE_WITH_PX_PROPERTIES};

        customPxToRem(rule);
        Object.keys(RULE_WITH_PX_PROPERTIES).forEach((property) => {
          expect(RULE_WITH_PX_PROPERTIES[property]).to.equal(rule[property]);
        });
      });
    });
  });
});
