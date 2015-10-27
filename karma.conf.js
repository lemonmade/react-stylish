var path = require('path');

module.exports = function(config) {
  config.set({
    browsers: ['PhantomJS'],
    // karma only needs to know about the test bundle
    frameworks: ['mocha', 'sinon-chai', 'phantomjs-shim'],
    plugins: [
      'karma-phantomjs-launcher',
      'karma-phantomjs-shim',
      'karma-mocha',
      'karma-sinon-chai',
      'karma-webpack',
      'karma-coverage',
      'karma-mocha-reporter',
      'karma-chrome-launcher',
    ],

    files: [
      'test/plugins/**.js',
      'test/dom/**.js',
      'test/native/**.js',
      'test/common/connect.test.js',
      'test/common/create.test.js',
      'test/common/StyleSheet.test.js',
      'test/common/utilities.test.js',
    ],
    preprocessors: {
      'test/*/**.js': ['webpack'],
    },
    reporters: ['mocha', 'coverage'],
    singleRun: true,
    autoWatch: false,

    webpack: {
      devtool: 'inline-source-map',
      resolveLoader: {root: __dirname},
      module: {
        loaders: [
          {
            exclude: /(node_modules|test|lib)/,
            loader: 'isparta?babel',
            test: /\.js$/,
          },

          {
            include: path.resolve('test/'),
            loader: 'babel',
            test: /\.js$/,
          },

          {
            include: path.resolve('node_modules/react-native'),
            loader: 'lib/loaders/react-native',
            test: /\.js$/,
          },
        ],
      },
    },

    logLevel: config.LOG_INFO,
    colors: true,

    webpackServer: {
      quiet: false,
      noInfo: true,
      stats: {
        assets: false,
        colors: true,
        version: false,
        hash: false,
        timings: false,
        chunks: false,
        chunkModules: false,
      },
    },

    coverageReporter: {
      dir: 'reports/coverage',
      // type: 'text',
      reporters: [
        {type: 'text', subdir: '.', file: 'text.txt'},
        {type: 'html', subdir: 'report-html'},
        {type: 'lcov', subdir: 'report-lcov'},
        {type: 'lcovonly', subdir: '.', file: 'report-lcovonly.txt'},
      ],
    },
  });
};
