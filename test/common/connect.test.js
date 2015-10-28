import '../helper';
import React from 'react';
import {createConnector} from '../../common/connect';
import StyleSheet from '../../common/StyleSheet';

describe('connect', () => {
  let Example;
  let ConnectedExample;
  let rendered;
  let resolver;
  let connect;
  let stylesheet = new StyleSheet();

  beforeEach(() => {
    resolver = sinon.stub();
    connect = createConnector(resolver);
    rendered = <div />;

    class MyExample {
      setState() {}
      render() { return rendered; }
    }

    Example = MyExample;
  });

  describe('returned class', () => {
    it('does not override any extra instance methods', () => {
      let testMethods = [
        'componentDidMount',
        'componentWillUnmount',
        'componentDidUnmount',
        'componentWillReceiveProps',
        'setState',
      ];

      testMethods.forEach((method) => {
        Example.prototype[method] = function() { return method; };
      });

      ConnectedExample = connect({})(Example);

      let connected = new ConnectedExample();
      let example = new Example();

      testMethods.forEach((method) => {
        expect(connected[method]).to.be.defined;
        expect(connected[method]()).to.equal(example[method]());
      });
    });

    it('retains class properties', () => {
      let classProperties = {
        foo: {value: 'foo'},

        bar: {
          get() { return 'bar'; },
          set(newBar) { return newBar; },
        },

        baz: {
          value: () => {},
          enumerable: false,
          configurable: false,
        },
      };

      Object.defineProperties(Example, classProperties);
      ConnectedExample = connect(stylesheet)(Example);

      Object.keys(classProperties).forEach((prop) => {
        let descriptor = Object.getOwnPropertyDescriptor(Example, prop);
        expect(descriptor).to.deep.equal(Object.getOwnPropertyDescriptor(ConnectedExample, prop));
      });
    });

    it('copies the original class displayName', () => {
      let displayName = 'Component';
      Example.displayName = displayName;
      ConnectedExample = connect(stylesheet)(Example);
      expect(ConnectedExample.displayName).to.equal(displayName);
    });
  });

  describe('#componentWillMount', () => {
    it('calls the original componentWillMount if set', () => {
      let originalWillMount = Example.prototype.componentWillMount = sinon.spy();
      ConnectedExample = connect(stylesheet)(Example);

      let subject = new ConnectedExample();
      subject.componentWillMount();
      expect(originalWillMount).to.have.been.calledOn(subject);
    });

    it('calls setState with some initial Stylish state', () => {
      sinon.stub(Example.prototype, 'setState');
      let setState = Example.prototype.setState;
      ConnectedExample = connect(stylesheet)(Example);

      let subject = new ConnectedExample();
      subject.componentWillMount();
      expect(setState).to.have.been.calledOn(subject);

      let newState = setState.lastCall.args[0];
      expect(newState._StylishState).to.deep.equal({});
    });
  });

  describe('#render', () => {
    it('overrides render to call the original, then return the resolved component', () => {
      sinon.stub(Example.prototype, 'render').returns(rendered);
      let originalRender = Example.prototype.render;
      ConnectedExample = connect(stylesheet)(Example);

      let subject = new ConnectedExample();
      subject.render();
      expect(originalRender).to.have.been.calledOn(subject);
    });

    it('calls resolve on render', () => {
      sinon.stub(Example.prototype, 'render').returns(rendered);
      ConnectedExample = connect(stylesheet)(Example);

      let subject = new ConnectedExample();
      subject.render();
      expect(resolver).to.have.been.calledWith(rendered, subject, stylesheet, {});
    });

    it('passes the connection options to resolve', () => {
      let options = {foo: 'bar'};
      ConnectedExample = connect(stylesheet, options)(Example);

      new ConnectedExample().render();
      expect(resolver.lastCall.args[3]).to.equal(options);
    });

    it('returns the result of the resolve call', () => {
      resolver.returns(rendered);
      ConnectedExample = connect(stylesheet)(Example);
      expect(new ConnectedExample().render()).to.equal(rendered);
    });
  });
});
