import '../helper';
import create from '../../common/create';
import StyleSheet from '../../common/StyleSheet';

describe('create', () => {
  it('creates a StyleSheet', () => {
    expect(create()).to.be.an.instanceOf(StyleSheet);
  });

  it('passes the arguments to the StyleSheet constructor', () => {
    let rule = {backgroundColor: 'green'};
    let stylesheet = create({button: rule});
    expect(stylesheet.button).to.deep.equal(rule);
  });
});
