/* eslint no-var: 0 */

var reactExternal = {
  root: 'React',
  commonjs2: 'react',
  commonjs: 'react',
  amd: 'react',
};

module.exports = {
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/,
      },
    ],
  },

  externals: {
    react: reactExternal,
    'react-native': reactExternal,
  },

  output: {
    library: 'Stylish',
    libraryTarget: 'umd',
  },

  resolve: {
    extensions: ['', '.js'],
  },
};
