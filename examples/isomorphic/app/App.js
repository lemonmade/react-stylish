import React, {Component} from 'react';
import Stylish from '../../../src';

import Button from './Button';

let styles = Stylish.create({
  content: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#F0FAFE',
  },

  heading: {
    fontSize: 40,
    margin: 0,
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'sans-serif',
    color: '#434347',
  },

  options: {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: -15,
    marginBottom: -15,

    [Stylish.CQ.create({min: 600})]: {
      flexDirection: 'row',
    },
  },

  option: {
    marginLeft: 15,
    marginBottom: 15,
    flex: 1,
  },
});

@Stylish.connect(styles)
export default class App extends Component {
  render() {
    return (
      <div styled="content">
        <h1 styled="heading">What do you think of Stylish?</h1>

        <div styled="options">
          <div styled="option"><Button>It's great!</Button></div>
          <div styled="option"><Button destructive>It's alright...</Button></div>
        </div>
      </div>
    );
  }
}
