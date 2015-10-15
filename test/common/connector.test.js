import '../helper';
import React from 'react';
import connector from '../../common/connector';

describe('connector', () => {
  let Example;
  let ConnectedExample;
  let rendered;
  let styles;
  let resolver;
  let connect;

  beforeEach(() => {
    styles = {for: sinon.spy(), attach: sinon.spy()};
    resolver = sinon.stub();
    connect = connector({resolver});
    rendered = <div />;

    class MyExample {
      setState() {}
      render() { return rendered; }
    }

    Example = MyExample;
  });

  describe('returned class', () => {
    it('does not override any instance methods other than render', () => {
      let testMethods = [
        'componentWillMount',
        'componentDidMount',
        'componentWillUnmount',
        'componentDidUnmount',
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
        expect(connected[method]()).to.deep.equal(example[method]());
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
      ConnectedExample = connect(styles)(Example);

      Object.keys(classProperties).forEach((prop) => {
        let descriptor = Object.getOwnPropertyDescriptor(Example, prop);
        expect(descriptor).to.deep.equal(Object.getOwnPropertyDescriptor(ConnectedExample, prop));
      });
    });

    it('copies the original class displayName', () => {
      let displayName = 'Component';
      Example.displayName = displayName;
      ConnectedExample = connect(styles)(Example);
      expect(ConnectedExample.displayName).to.equal(displayName);
    });
  });

  describe('#componentWillMount', () => {
    it('calls the original componentWillMount if set', () => {
      let originalWillMount = Example.prototype.componentWillMount = sinon.spy();
      ConnectedExample = connect(styles)(Example);

      let subject = new ConnectedExample();
      subject.componentWillMount();
      expect(originalWillMount).to.have.been.calledOn(subject);
    });

    it('calls setState with some initial Stylish state', () => {
      sinon.stub(Example.prototype, 'setState');
      let setState = Example.prototype.setState;
      ConnectedExample = connect(styles)(Example);

      let subject = new ConnectedExample();
      subject.componentWillMount();
      expect(setState).to.have.been.calledOn(subject);

      let arg = setState.lastCall.args[0];
      expect(Object.keys(arg)[0]).to.match(/_Stylish/);
      expect(arg[Object.keys(arg)[0]]).to.deep.equal({hover: {}, active: {}, focus: {}});
    });
  });

  describe('#render', () => {
    it('overrides render to call the original, then return the resolved component', () => {
      sinon.stub(Example.prototype, 'render').returns(rendered);
      let originalRender = Example.prototype.render;
      ConnectedExample = connect(styles)(Example);

      let subject = new ConnectedExample();
      subject.render();
      expect(originalRender).to.have.been.calledOn(subject);
    });

    it('calls the passed resolver on render', () => {
      sinon.stub(Example.prototype, 'render').returns(rendered);
      ConnectedExample = connect(styles)(Example);

      let subject = new ConnectedExample();
      subject.render();
      expect(resolver).to.have.been.calledWith({rendered, styles, context: subject, options: {}});
    });

    it('passes the connection options to the resolver', () => {
      let options = {foo: 'bar'};
      ConnectedExample = connect(styles, options)(Example);

      new ConnectedExample().render();
      expect(resolver.lastCall.args[0].options).to.equal(options);
    });

    it('returns the result of the resolver', () => {
      resolver.returns(rendered);
      ConnectedExample = connect(styles)(Example);
      expect(new ConnectedExample().render()).to.equal(rendered);
    });
  });

  describe('#stylesFor', () => {
    let subject;

    beforeEach(() => {
      Example = connect(styles)(Example);
      subject = new Example();
    });

    it('adds a #stylesFor method to the component', () => {
      expect(subject.stylesFor).to.be.a('function');
    });

    it('sets the context as the component', () => {
      subject.stylesFor('component');
      expect(styles.attach).to.have.been.calledWith(subject);
    });

    it('asks the style object for styles for the passed component', () => {
      subject.stylesFor('component');
      expect(styles.for).to.have.been.calledWith('component');
    });

    it('does not override an existing stylesFor method', () => {
      class CustomExample {
        stylesFor() { return 'foo'; }
      }

      let originalStylesFor = CustomExample.prototype.stylesFor;
      Example = connect(styles)(CustomExample);
      subject = new Example();

      expect(subject.stylesFor).to.equal(originalStylesFor);
    });
  });
});
