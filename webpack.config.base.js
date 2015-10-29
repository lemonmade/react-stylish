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

  output: {
    library: 'Stylish',
    libraryTarget: 'umd',
  },

  resolve: {
    extensions: ['', '.js'],
  },
};
