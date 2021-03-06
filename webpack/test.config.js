var path = require("path");
var _ = require('lodash');
var baseConfig = require('./base.config.js')();
var envConfig = require('../env-config.js');
envConfig.mode = 'development';
var mode = envConfig.nodeEnv = 'development';

var rules = baseConfig.module.rules.concat();
if (envConfig.runCoverage) {
  rules.push({
    test: /\.js/,
    use: 'istanbul-instrumenter-loader',
    include: [
      path.resolve(__dirname, '..', 'src'),
      path.resolve(__dirname, '..', 'node_modules'),
    ],
  });
}

// this is the config for generating the files needed to run the examples.
module.exports = _.extend({}, baseConfig, {
  resolve: {
    alias: {
      jsnums :  'wescheme-js/src/runtime/js-numbers',
      lex :     'wescheme-js/src/lex',
      types :   'wescheme-js/src/runtime/types',
      structs : 'wescheme-js/src/structures',
      'codemirror-blocks': 'CodeMirror-Blocks'
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  devtool: 'inline-source-map',
  module: _.extend({}, baseConfig.module, {
    rules: rules
  }),
  mode: 'development'
});
