'use strict';
const path = require('path');
const pwd = process.cwd();

const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const wp = require('./wpTools');
const karma = require('./karmaTools');
const AotPlugin = require('@ngtools/webpack').AotPlugin;
const BundleAnalyzerPlugin = require(
    'webpack-bundle-analyzer').BundleAnalyzerPlugin;

function Configuration(json) {
  this.json = function () {
    return {
      appName: json.appName,
      buildPath: this.buildPath(),
      vendors: json.vendors.slice(),
      devEntryFile: json.devEntryFile || './app/main.ts',
      prodEntryFile: json.prodEntryFile || './app/main.ts',
      aotEntryFile: json.aotEntryFile || './app/main.aot.ts',
      exportJQuery: !!json.exportJQuery,
      karmaFiles: json.karmaFiles || [],
      useTemplateUrl: !!json.useTemplateUrl || !!json.aotEntryFile,
      buildAoT: !!json.buildAoT
    };
  };
  this.buildPath = function () {
    return json.buildPath || './build';
  };
  this.wpPort = function () {
    return json.devServerPort || 8080;
  };
  this.getConfig = function (method, keys) {
    const conf = "aot" === method ? wp.aot_build_rules : "template" === method
        ? wp.template_run_rules : wp.rules;
    let rules = [];
    keys.forEach(key => {
      if (key in conf) {
        rules.push(conf[key]);
      }
    });
    return rules;
  }
}

Configuration.prototype.wpBase = function () {
  const plugins = [];
  if (this.json().exportJQuery) {
    plugins.push(new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery"
    }));
  }
  return {
    plugins: plugins,
    resolve: {extensions: wp.extensions},
    module: {
      rules: []
    }
  };
};

Configuration.prototype.wpRunBase = function () {
  const conf = this.json();
  const base = this.wpBase();
  base.entry = {
    app: [],
    vendor: conf.vendors
  };
  base.output = {
    path: path.resolve(pwd, conf.buildPath),
    filename: `${conf.appName}/bundles/bundle.[hash].js`,
    sourceMapFilename: '[file].map',
    publicPath: '/'
  };
  base.module.rules.push(wp.preRules.tslint);
  base.module.rules.push(wp.rules.raw);
  base.module.rules.push(wp.rules.jpg);
  base.module.rules.push(wp.rules.woff);
  base.module.rules.push(wp.rules.ttf);
  base.module.rules.push(wp.rules.eot);
  base.module.rules.push(wp.rules.svg);
  return base;
};

Configuration.prototype.wpBuild = function () {
  const conf = this.json();
  const base = this.wpRunBase();
  base.devtool = wp.devtool.cheapModuleMap;
  base.entry.app.push(conf.prodEntryFile);

  base.plugins.push(new webpack.DefinePlugin({
    'process.env.NODE_ENV': '"production"'
  }));
  base.plugins.push(new HtmlWebpackPlugin(
      {filename: 'index.html', template: './app/index.html'}));

  if (conf.buildAoT) {
    base.plugins.push(new AotPlugin({
      tsConfigPath: path.resolve(pwd, 'tsconfig.aot.json'),
      entryModule: path.resolve(pwd, 'app/app.module#AppModule')
    }));
  }
  const method = conf.buildAoT ? "aot" : (conf.useTemplateUrl ? "template"
      : "");
  this.getConfig(method, ['ts', 'html', 'less', 'scss', 'css'])
      .forEach(function (rule) {
        base.module.rules.push(rule);
      });

  base.plugins.push(new webpack.optimize.UglifyJsPlugin({
    sourceMap: true,
    mangle: true,
    compress: {
      warnings: false, // Suppress uglification warnings
      pure_getters: true,
      unsafe: true
    },
    output: {
      comments: false,
    },
    minimize: true
  }));
  base.plugins.push(new webpack.optimize.CommonsChunkPlugin({
    name: 'vendor',
    filename: `${conf.appName}/bundles/vendor.bundle.[hash].js`
  }));

  base.plugins.push(new webpack.optimize.ModuleConcatenationPlugin());
  return base;
}

Configuration.prototype.wpRun = function () {
  const conf = this.json();
  const base = this.wpRunBase();
  const method = conf.buildAoT ? "aot" : (conf.useTemplateUrl ? "template"
      : "");
  this.getConfig(method, ['ts', 'html', 'less', 'scss', 'css'])
      .forEach(function (rule) {
        base.module.rules.push(rule);
      });

  base.devtool = wp.devtool.inlineMap;
  base.entry.app.push('webpack/hot/dev-server');
  base.entry.app.push(
      `webpack-dev-server/client?http://localhost:${this.wpPort()}`);
  base.entry.app.push(conf.devEntryFile);
  base.plugins.push(new webpack.HotModuleReplacementPlugin());
  base.plugins.push(new HtmlWebpackPlugin(
      {filename: 'index.html', template: './app/index.html'}));
  base.plugins.push(new webpack.optimize.CommonsChunkPlugin({
    name: 'vendor',
    filename: `${conf.appName}/bundles/vendor.bundle.js`
  }));
  base.plugins.push(new webpack.LoaderOptionsPlugin({
    debug: true
  }));
  return base;
};

Configuration.prototype.wpTestBase = function () {
  const base = this.wpBase();
  const conf = this.json();
  base.devtool = wp.devtool.inlineMap;
  const method = conf.buildAoT ? "aot" : (conf.useTemplateUrl ? "template"
      : "");
  this.getConfig(method, ['html'])
      .forEach(function (rule) {
        base.module.rules.push(rule);
      });
  base.module.rules.push(wp.rules.raw);
  base.module.rules.push(wp.rules.styleNullLoader);
  return base;
};

Configuration.prototype.wpTest = function () {
  const base = this.wpTestBase();
  const conf = this.json();
  base.module.rules.push(wp.preRules.tslint);
  const method = conf.buildAoT ? "aot" : (conf.useTemplateUrl ? "template"
      : "");
  this.getConfig(method, ['tsWithComments'])
      .forEach(function (rule) {
        base.module.rules.push(rule);
      });
  base.module.rules.push(wp.postRules.istanbul);
  return base;
};

Configuration.prototype.wpDebug = function () {
  const base = this.wpTestBase();
  const conf = this.json();
  base.devtool = wp.devtool.inlineMap;
  const method = conf.buildAoT ? "aot" : (conf.useTemplateUrl ? "template"
      : "");
  this.getConfig(method, ['tsNoComments'])
      .forEach(function (rule) {
        base.module.rules.push(rule);
      });
  return base;
};

Configuration.prototype.karmaBase = function () {
  const json = this.json();
  const files = [
    karma.es6Shim,
    'node_modules/zone.js/dist/zone.min.js',
    'node_modules/zone.js/dist/long-stack-trace-zone.js',
    'node_modules/zone.js/dist/proxy.js',
    'node_modules/zone.js/dist/sync-test.js',
    'node_modules/zone.js/dist/jasmine-patch.js',
    'node_modules/zone.js/dist/async-test.js',
    'node_modules/zone.js/dist/fake-async-test.js',
    'node_modules/reflect-metadata/Reflect.js',
    {pattern: 'test.loader.js', watched: false}
  ].concat(json.karmaFiles);
  return {
    basePath: '',
    logLevel: 'info',
    port: 9876,
    frameworks: ['jasmine'],
    files: files,
    preprocessors: {'test.loader.js': ['webpack', 'sourcemap']}
  };
};

Configuration.prototype.karmaHeadless = function () {
  const base = this.karmaBase();
  base.browsers = ['ChromeHeadless'];
  base.customLaunchers = {
    ChromeHeadless: {
      base: 'Chrome',
      flags: ['--headless', '--disable-gpu', '--remote-debugging-port=9222',
        '-incognito']
    }
  };
  base.singleRun = true;
  base.reporters = ['dots', 'coverage-istanbul', 'junit'];
  base.junitReporter = {
    outputFile: 'test-results.xml',
    outputDir: 'coverage/',
    useBrowserName: false
  };
  base.coverageIstanbulReporter = {
    dir: 'coverage/',
    reporters: [
      {type: 'text-summary'},
      {type: 'json'},
      {type: 'html'}
    ],
    fixWebpackSourcePaths: true
  };
  base.webpack = this.wpTest();
  base.webpackMiddleware = {noInfo: true};
  return base;
};

Configuration.prototype.karmaTest = function () {
  const base = this.karmaBase();
  base.browsers = ['Chrome'];
  base.singleRun = true;
  base.reporters = ['dots', 'coverage-istanbul', 'junit'];
  base.junitReporter = {
    outputFile: 'test-results.xml',
    outputDir: 'coverage/',
    useBrowserName: false
  };
  base.coverageIstanbulReporter = {
    dir: 'coverage/',
    reporters: [
      {type: 'text-summary'},
      {type: 'json'},
      {type: 'html'}
    ],
    fixWebpackSourcePaths: true
  };
  base.webpack = this.wpTest();
  base.webpackMiddleware = {noInfo: true};
  return base;
};

Configuration.prototype.karmaDebug = function () {
  const base = this.karmaBase();
  base.browsers = ['Chrome'];
  base.singleRun = false;
  base.reporters = ['progress'];

  base.webpack = this.wpDebug();
  base.webpackMiddleware = {noInfo: true};
  return base;
};

module.exports = Configuration;
