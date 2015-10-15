import '../helper';
import resolve from '../../dom/resolver';
import config from '../../common/config';
import StyleSheet from '../../common/StyleSheet';
import React from 'react';

// Source: fo to, then run: https://developer.mozilla.org/en/docs/Web/HTML/Element
// [].slice.call(document.querySelectorAll('table tbody tr td:first-child')).map(function(el) { return el.textContent.replace(/[ <>]/g, ''); }).join(',');
const BUILT_IN_COMPONENTS = 'html,base,head,link,meta,style,title,address,article,body,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,dd,div,dl,dt,figcaption,figure,hr,li,main,ol,p,pre,ul,a,abbr,b,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,iframe,img,object,param,source,canvas,noscript,script,del,ins,caption,col,colgroup,table,tbody,td,tfoot,th,thead,tr,button,datalist,fieldset,form,input,keygen,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,menuitem,summary,content,decorator,element,shadow,template,acronym,applet,basefont,big,blink,center,dir,frame,frameset,isindex,listing,noembed,plaintext,spacer,strike,tt,xmp'.split(',');

const RULES = Object.freeze({
  base: {backgroundColor: 'red'},
  nested: {backgroundColor: 'green'},
});

let styles = new StyleSheet();
styles.for = sinon.spy((component) => (RULES[component] && [RULES[component]]) || []);

class CustomComponent extends React.Component {
  render() { return this.props.children; }
}

describe('Stylish DOM', () => {
  describe('resolve', () => {
    let rendered;
    let context;

    beforeEach(() => {
      context = new CustomComponent({});
      config.plugins.attach = [];
    });

    it('resolves DOM elements', () => {
      BUILT_IN_COMPONENTS.forEach((component) => {
        rendered = resolve({rendered: React.createElement(component, {styled: 'base'}), styles, context});
        expect(rendered.props.style).to.deep.equal([RULES.base]);
      });
    });

    it('resolves nested DOM elements', () => {
      BUILT_IN_COMPONENTS.forEach((component) => {
        let element = React.createElement(component, {styled: 'base'}, React.createElement('div', {styled: 'nested'}));
        rendered = resolve({rendered: element, styles, context});
        expect(rendered.props.style).to.deep.equal([RULES.base]);
        expect(rendered.props.children.props.style).to.deep.equal([RULES.nested]);
      });
    });

    describe('custom components', () => {
      let customElement;

      beforeEach(() => {
        customElement = (
          <CustomComponent styled="base">
            <div styled="nested" />
          </CustomComponent>
        );
      });

      it('does not resolve custom components or DOM elements nested within them', () => {
        rendered = resolve({rendered: customElement, styles, context});
        expect(rendered.props.style).to.be.undefined;
        expect(rendered.props.children.props.style).to.be.undefined;
      });

      it('resolves custom components and DOM elements nested within them when the depth is specified', () => {
        rendered = resolve({rendered: customElement, styles, context, options: {depth: 10}});
        expect(rendered.props.style).to.deep.equal([RULES.base]);
        expect(rendered.props.children.props.style).to.deep.equal([RULES.nested]);
      });

      it('resolves custom components and DOM elements nested within them when the depth is not considered', () => {
        rendered = resolve({rendered: customElement, styles, context, options: {depth: false}});
        expect(rendered.props.style).to.deep.equal([RULES.base]);
        expect(rendered.props.children.props.style).to.deep.equal([RULES.nested]);
      });
    });
  });
});
