'use strict';
const path = require('path');
const pwd = process.cwd();

const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const wp = require('./wpTools');
const karma = require('./karmaTools');
const AotPlugin = require('@ngtools/webpack').AotPlugin;
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

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
      useTemplateUrl: !!json.useTemplateUrl,
      enableAOT: !!json.enableAOT,
      enableAnalyzer: !!json.enableAnalyzer,
      tsConfigAOT: json.tsConfigAOT || "./tsconfig.aot.json"
    };
  };
  this.buildPath = function () {
    return json.buildPath || './build';
  };
  this.wpPort = function () {
    return json.devServerPort || 8080;
  };
  this.getRules = function (method, keys) {
    let conf = {};
    if ("aot" === method) {
      conf = wp.aot_build_rules;
    } else if ("template" === method) {
      conf = wp.template_run_rules;
    } else {
      conf = wp.rules;
    }
    return keys.filter( key => key in conf ).map( key => conf[key]);
  }
}

Configuration.prototype.wpBase = function () {
  const plugins = [];
  const providePluginOptions = new webpack.ProvidePlugin({
    $: "jquery",
    jQuery: "jquery",
    "window.jQuery": "jquery"
  });

  if (this.json().exportJQuery) {
    plugins.push(providePluginOptions);
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
    vendor: conf.vendors
  };
  base.output = {
    path: path.resolve(pwd, conf.buildPath),
    filename: `${conf.appName}/bundles/bundle.[hash].js`,
    sourceMapFilename: '[file].map',
    publicPath: '/'
  };
  if (conf.enableAOT) {
    const aotPluginOptions = new AotPlugin({
      tsConfigPath: path.resolve(pwd, conf.tsConfigAOT),
      entryModule: path.resolve(pwd, '/app/app.module#AppModule')
    });
    base.plugins.push(aotPluginOptions);
    base.entry.app = [conf.aotEntryFile];
  } else {
    base.entry.app = [conf.devEntryFile];
  }
  
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
  const templateResolutionMethod = conf.useTemplateUrl ? "template" : "";
  const method = conf.enableAOT ? "aot" : templateResolutionMethod;
  const rules = this.getRules(method, ['ts', 'html', 'less', 'scss', 'css']);

  const definePluginOptions = new webpack.DefinePlugin({
    'process.env.NODE_ENV': '"production"'
  });
  const htmlPluginOptions = new HtmlWebpackPlugin({
    filename: 'index.html',
    template: './app/index.html'
  });
  const uglifyJsPluginOptions = new webpack.optimize.UglifyJsPlugin({
    sourceMap: true,
    mangle: true,
    compress: {
      warnings: false, // Suppress uglification warnings
      pure_getters: true,
      unsafe: true
    },
    output: {
      comments: false
    },
    minimize: true
  });
  const commonsChunkPluginOptions = new webpack.optimize.CommonsChunkPlugin({
    name: 'vendor',
    filename: `${conf.appName}/bundles/vendor.bundle.[hash].js`
  });

  if(!conf.enableAOT){
    base.entry.app = [conf.prodEntryFile];
  }
  base.devtool = wp.devtool.cheapModuleMap;
  base.module.rules = base.module.rules.concat(rules);

  base.plugins.push(definePluginOptions);
  base.plugins.push(htmlPluginOptions);
  base.plugins.push(uglifyJsPluginOptions);
  base.plugins.push(commonsChunkPluginOptions);
  base.plugins.push(new webpack.optimize.ModuleConcatenationPlugin());
  if (conf.enableAnalyzer) {
    base.plugins.push(new BundleAnalyzerPlugin());
  }
  return base;
};

Configuration.prototype.wpRun = function () {
  const conf = this.json();
  const base = this.wpRunBase();

  const templateUrlMethod = conf.useTemplateUrl ? "template" : "";
  const method = conf.enableAOT ? "aot" : templateUrlMethod;
  const rules = this.getRules(method, ['ts', 'html', 'less', 'css']);

  const webpackServer = ['webpack/hot/dev-server',
    `webpack-dev-server/client?http://localhost:${this.wpPort()}`];
  const commonsChunkPluginOptions = new webpack.optimize.CommonsChunkPlugin({
    name: 'vendor',
    filename: `${conf.appName}/bundles/vendor.bundle.js`
  });
  const htmlWebpackPluginOptions = new HtmlWebpackPlugin({
    filename: 'index.html',
    template: './app/index.html'
  });


  base.devtool = wp.devtool.inlineMap;
  base.entry.app = webpackServer.concat(base.entry.app);
  base.module.rules = base.module.rules.concat(rules);
  base.plugins.push(new webpack.HotModuleReplacementPlugin());
  base.plugins.push(htmlWebpackPluginOptions);
  base.plugins.push(commonsChunkPluginOptions);
  base.plugins.push(new webpack.LoaderOptionsPlugin({
    debug: true
  }));
  return base;
};

Configuration.prototype.wpTestBase = function () {
  const base = this.wpBase();
  const conf = this.json();
  const method = conf.useTemplateUrl ? "template" : "";
  const rules = this.getRules(method, ['html', 'less', 'css']);

  base.devtool = wp.devtool.inlineMap;
  base.module.rules = base.module.rules.concat(rules);
  base.module.rules.push(wp.rules.raw);
  base.module.rules.push(wp.rules.styleNullLoader);
  return base;
};

Configuration.prototype.wpTest = function () {
  const base = this.wpTestBase();
  const conf = this.json();
  const method = conf.useTemplateUrl ? "template" : "";
  const rules = this.getRules(method, ['tsWithComments']);
  base.module.rules.push(wp.preRules.tslint);
  base.module.rules = base.module.rules.concat(rules);
  base.module.rules.push(wp.postRules.istanbul);
  return base;
};

Configuration.prototype.wpDebug = function () {
  const base = this.wpTestBase();
  const conf = this.json();
  const method = conf.useTemplateUrl ? "template" : "";
  const rules = this.getRules(method, ['tsNoComments']);

  base.devtool = wp.devtool.inlineMap;
  base.module.rules = base.module.rules.concat(rules);
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
      flags: ['--headless', '--disable-gpu', '--remote-debugging-port=9222', '-incognito']
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
