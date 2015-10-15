import '../helper';
import create from '../../common/create';
import config from '../../common/config';
import StyleSheet from '../../common/StyleSheet';

describe('create', () => {
  it('creates a StyleSheet', () => {
    expect(create()).to.be.an.instanceOf(StyleSheet);
  });

  it('creates a StyleSheet with the passed base rules', () => {
    let baseRule = {backgroundColor: 'red'};
    let styles = create({button: baseRule});
    expect(styles.button).to.deep.equal([baseRule]);
  });

  describe('.use', () => {
    it('uses the passed plugin as the new create plugins', () => {
      let plugins = [sinon.stub(), sinon.stub()];
      create.use({plugins});
      expect(config.plugins.create).to.deep.equal(plugins);
    });
  });
});
