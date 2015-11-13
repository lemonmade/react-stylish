import React from 'react';
import Stylish from '../../../src';

const GREEN = '#3B8A49';
const DARK_GREEN = '#2A6234';

const RED = '#D53A35';
const DARK_RED = '#A7292A';

let styles = Stylish.create({
  padding: 15,
  borderRadius: 5,
  border: 0,
  fontSize: 20,
  width: '100%',
  display: 'block',
  color: 'white',
  backgroundColor: GREEN,
  transition: 'background-color 0.3s ease',

  hover: {backgroundColor: DARK_GREEN},
  focus: {backgroundColor: DARK_GREEN},
});

styles.variation('destructive', {
  backgroundColor: RED,

  hover: {backgroundColor: DARK_RED},
  focus: {backgroundColor: DARK_RED},
});

function Button({children}) {
  return <button styled>{children}</button>;
}

export default Stylish.connect(styles)(Button);
