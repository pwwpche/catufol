'use strict';
const path = require('path');
const pwd = process.cwd();

const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');

const wp = require('./wpTools');
const karma = require('./karmaTools');


const nModules = path.resolve(pwd, './node_modules');
const appPath = path.resolve(pwd, './app');

function Configuration (json) {
    this.json = function () {
        return {
            appName: json.appName,
            buildPath: json.buildPath || './build',
            vendors: json.vendors.slice(),
            entryFile: json.entryFile || './app/main.ts'
        };
    };
    this.wpPort = function () {
        return json.devServerPort || 8080;
    }
}

Configuration.prototype.wpBase = function () {
    return {
        plugins: [],
        htmlLoader: wp.htmlLoader,
        tslint: wp.tslint,
        resolve: { extensions: wp.extensions },
        module: {
            preLoaders: [],
            loaders: [],
            postLoaders: []
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
        filename: `${conf.appName}/bundles/bundle.js`,
        sourceMapFilename: '[file].map',
        publicPath: '/'
    };
    base.module.preLoaders.push(wp.loaders.tslint);
    base.module.loaders.push(wp.loaders.ts);
    base.module.loaders.push(wp.loaders.html);
    base.module.loaders.push(wp.loaders.raw);
    base.module.loaders.push(wp.loaders.json);
    base.module.loaders.push(wp.loaders.jpg);
    base.module.loaders.push(wp.loaders.less);
    base.module.loaders.push(wp.loaders.css);
    base.module.loaders.push(wp.loaders.woff);
    base.module.loaders.push(wp.loaders.ttf);
    base.module.loaders.push(wp.loaders.eot);
    base.module.loaders.push(wp.loaders.svg);
    return base;
};

Configuration.prototype.wpBuild = function () {
    const conf = this.json();
    const base = this.wpRunBase();
    base.devtool = wp.devtool.sourceMap;
    base.entry.app.push(conf.entryFile);
    base.plugins.push(new HtmlWebpackPlugin({filename: 'index.html', template: 'index.html'}));
    base.plugins.push(new webpack.optimize.CommonsChunkPlugin('vendor', `${conf.appName}/bundles/vendor.bundle.js`));
    return base;
};

Configuration.prototype.wpRun = function () {
    const conf = this.json();
    const base = this.wpRunBase();
    base.devtool = wp.devtool.inlineMap;
    base.debug = true;
    base.entry.app.push('webpack/hot/dev-server');
    base.entry.app.push('webpack-dev-server/client?http://localhost:8080');
    base.entry.app.push(conf.entryFile);
    base.plugins.push(new HtmlWebpackPlugin({filename: 'index.html', template: 'index.html'}));
    base.plugins.push(new webpack.optimize.CommonsChunkPlugin('vendor', `${conf.appName}/bundles/vendor.bundle.js`));
    return base;
};

Configuration.prototype.wpTestBase = function () {
    const base = this.wpBase();
    base.devtool = wp.devtool.inlineMap;
    base.module.loaders.push(wp.loaders.html);
    base.module.loaders.push(wp.loaders.raw);
    base.module.loaders.push(wp.loaders.json);
    return base;
};

Configuration.prototype.wpTest = function () {
    const base = this.wpTestBase();
    base.module.preLoaders.push(wp.loaders.tslint);
    base.module.loaders.push(wp.loaders.tsWithComments);
    base.module.postLoaders.push(wp.loaders.istambul);
    return base;
};

Configuration.prototype.wpDebug = function () {
    const base = this.wpTestBase();
    base.devtool = wp.devtool.inlineMap;
    base.module.loaders.push(wp.loaders.tsNoComments);
    return base;
};

Configuration.prototype.karmaBase = function () {
    return {
        basePath: '',
        logLevel: 'info',
        port: 9876,
        frameworks: ['jasmine'],
        files: [
            'node_modules/zone.js/dist/zone.min.js',
            'node_modules/zone.js/dist/async-test.js',
            karma.phPolyfill,
            'node_modules/reflect-metadata/Reflect.js',
            karma.es6Shim,
            { pattern: 'test.loader.js', watched: false }
        ],
        preprocessors: { 'test.loader.js': ['webpack', 'sourcemap'] }
    };
};

Configuration.prototype.karmaTest = function () {
    const base = this.karmaBase();
    base.browsers = ['PhantomJS'];
    base.singleRun = true;
    base.reporters = ['dots', 'coverage'];
    base.coverageReporter = {
        dir : 'coverage/',
        reporters: [
            { type: 'text-summary' },
            { type: 'json' },
            { type: 'html' }
        ]
    };
    base.webpack = this.wpTest();
    base.webpackMiddleware = { noInfo: true };
    return base;
};

Configuration.prototype.karmaDebug = function () {
    const base = this.karmaBase();
    base.browsers = ['Chrome'];
    base.singleRun = false;
    base.reporters = ['progress'];

    base.webpack = this.wpDebug();
    base.webpackMiddleware = { noInfo: true };
    return base;
};

module.exports = Configuration;
