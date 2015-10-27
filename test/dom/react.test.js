import '../helper';

import React from '../../dom/react';

describe('Stylish DOM', () => {
  describe('React', () => {
    it('sets the react version to DOM', () => {
      expect(React).to.equal(React);
      expect(React.isDom).to.be.true;
      expect(React.isNative).to.be.false;
    });

    describe('.isCustomComponent', () => {
      // Source: fo to, then run: https://developer.mozilla.org/en/docs/Web/HTML/Element
      // [].slice.call(document.querySelectorAll('table tbody tr td:first-child')).map(function(el) { return el.textContent.replace(/[ <>]/g, ''); }).join(',');
      const BUILT_IN_COMPONENTS = 'html,base,head,link,meta,style,title,address,article,body,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,dd,div,dl,dt,figcaption,figure,hr,li,main,ol,p,pre,ul,a,abbr,b,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,iframe,img,object,param,source,canvas,noscript,script,del,ins,caption,col,colgroup,table,tbody,td,tfoot,th,thead,tr,button,datalist,fieldset,form,input,keygen,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,menuitem,summary,content,decorator,element,shadow,template,acronym,applet,basefont,big,blink,center,dir,frame,frameset,isindex,listing,noembed,plaintext,spacer,strike,tt,xmp'.split(',');

      class CustomComponent extends React.Component {
        render() { return this.props.children; }
      }

      it('adds a .isCustomComponent static method to React', () => {
        expect(React.isCustomComponent).to.be.a('function');
      });

      it('identifies DOM elements as not being custom', () => {
        BUILT_IN_COMPONENTS.forEach((component) => {
          let element = React.createElement(component);
          expect(React.isCustomComponent(element)).to.be.false;
        });
      });

      it('identifies custom classes as being custom', () => {
        let element = React.createElement(CustomComponent);
        expect(React.isCustomComponent(element)).to.be.true;
      });
    });
  });
});
