import '../../helper';
import createPrefixer from '../../../src/plugins/vendor-prefixes/prefixer';

describe('plugins', () => {
  describe('VendorPrefixesPlugin', () => {
    const rule = Object.freeze({transform: 2});
    let prefixer;
    let mockStyle;
    let allProperties;

    beforeEach(() => {
      mockStyle = {};
      allProperties = [];

      sinon.stub(document, 'createElement', () => {
        return {style: mockStyle};
      });

      sinon.stub(window, 'getComputedStyle', () => {
        return allProperties;
      });
    });

    afterEach(() => {
      document.createElement.restore();
      window.getComputedStyle.restore();
    });

    describe('when DOM is available', () => {
      function createDOMPrefixer() {
        return createPrefixer({canUseDOM: true});
      }

      it('uses the prefixed version if it exists and the regular one does not', () => {
        mockStyle = {WebkitTransform: ''};
        prefixer = createDOMPrefixer();
        expect(prefixer({transform: 'scale(2)'})).to.deep.equal({WebkitTransform: 'scale(2)'});
      });

      ['Webkit', 'Moz', 'ms', 'O'].forEach((prefix) => {
        it(`Recognizes the ${prefix} prefix`, () => {
          let transformName = `${prefix}Transform`;
          mockStyle = {[transformName]: ''};
          prefixer = createDOMPrefixer();
          expect(prefixer({transform: 'scale(2)'})).to.deep.equal({[transformName]: 'scale(2)'});
        });
      });

      it('uses a value that matches the one style is set to', () => {
        mockStyle = {fontWeight: ''};
        prefixer = createDOMPrefixer();
        expect(prefixer({fontWeight: 'bold'})).to.deep.equal({fontWeight: 'bold'});
      });

      it('uses a prefixed value if it matches the one the style is set to', () => {
        mockStyle = {
          WebkitTransform: '',
          get minWidth() { return '-webkit-min-content'; },
          set minWidth(value) {},
        };

        prefixer = createDOMPrefixer();
        expect(prefixer({minWidth: 'min-content'})).to.deep.equal({minWidth: '-webkit-min-content'});
      });

      it('caches property and value access', () => {
        let getFontWeight = sinon.stub().returns('bold');
        mockStyle = {
          get fontWeight() { return getFontWeight(); },
          set fontWeight(value) {},
        };

        prefixer = createDOMPrefixer();

        prefixer({fontWeight: 'bold'});
        prefixer({fontWeight: 'bold'});

        expect(getFontWeight).to.have.been.calledOnce;
      });

      it('ignores number values', () => {
        mockStyle = {lineHeight: ''};
        prefixer = createDOMPrefixer();
        expect(prefixer({lineHeight: 2})).to.deep.equal({lineHeight: 2});
      });

      it('ignores strings that are numbers with units', () => {
        mockStyle = {lineHeight: ''};
        prefixer = createDOMPrefixer();
        expect(prefixer({lineHeight: '2.2rem'})).to.deep.equal({lineHeight: '2.2rem'});
      });

      it('ignores browsers converting colors to different formats', () => {
        mockStyle = {
          get color() { return 'rgb(256, 256, 256)'; },
          set color(value) {},
        };

        prefixer = createDOMPrefixer();
        expect(prefixer({color: 'white'})).deep.equal({color: 'white'});
      });

      it('ignores null values', () => {
        mockStyle = {lineHeight: ''};
        prefixer = createDOMPrefixer();
        expect(prefixer({lineHeight: null})).to.deep.equal({lineHeight: null});
      });

      it('omits properties it does not recognize', () => {
        prefixer = createDOMPrefixer();
        expect(prefixer({foo: 'bar'})).to.be.empty;
      });

      it('omits properties if it does not recognize their values', () => {
        mockStyle = {
          get transform() { return ''; },
          set transform(value) {},
        };

        prefixer = createDOMPrefixer();

        expect(prefixer({transform: 'foo'})).to.be.empty;
      });
    });

    describe('when DOM is not available', () => {
      beforeEach(() => {
        prefixer = createPrefixer({canUseDOM: false});
      });

      it('just returns the rule when DOM is not available', () => {
        expect(prefixer(rule)).to.equal(rule);
        expect(document.createElement).not.to.have.been.called;
        expect(window.getComputedStyle).not.to.have.been.called;
      });
    });
  });
});
