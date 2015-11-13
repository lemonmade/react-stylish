/* eslint no-console: 0 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import path from 'path';
import fs from 'fs';
import express from 'express';
import webpack from 'webpack';

import config from './webpack.config';

import App from './app/App';

let app = express();
let compiler = webpack(config);
let indexHTML = fs.readFileSync(path.join(__dirname, 'index.html')).toString();

app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath,
}));

app.get('*', (req, res) => {
  res.write(
    indexHTML.replace('<!-- {{app}} -->', ReactDOMServer.renderToString(<App />))
  );

  res.end();
});

app.listen(3000, 'localhost', (err) => {
  if (err) {
    console.log(err);
    return;
  }

  console.log('Listening at http://localhost:3000');
});
