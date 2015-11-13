var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool: 'eval',

  entry: './app/index',

  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'app.js',
    publicPath: '/static/',
  },

  plugins: [
    new webpack.NoErrorsPlugin(),
  ],

  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel'],
      exclude: /node_modules/,
    }],
  },
};
