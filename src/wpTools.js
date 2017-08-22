'use strict';

const path = require('path');
const pwd = process.cwd();
const nModules = path.resolve(pwd, './node_modules');
const appPath = path.resolve(pwd, './app');

const devTool = {
  sourceMap: 'source-map',
  inlineMap: 'inline-source-map',
  cheapModuleMap: 'cheap-module-source-map'
};

const resolveExtensions = ['.ts', '.js', '.json', '.css', '.less', '.html'];

const preRules = {
  tslint: {
    test: /\.ts$/,
    enforce: 'pre',
    loader: "tslint-loader",
    options: {
      emitErrors: false,
      failOnHint: false
    }
  }
};


const postRules = {
  istanbul: {
    test: /\.(?:js|ts)$/,
    include: appPath,
    enforce: 'post',
    loader: 'istanbul-instrumenter-loader',
    exclude: [
      /\.spec\.ts$/,
      /app\/domain\/services\/testing/,
      /node_modules/
    ]
  }
};

const aot_build_rules = {
  ts: {
    test: /\.ts$/,
    loaders: ['@ngtools/webpack'],
  },
  html: {
    test: /\.html$/,
    loader: "raw-loader",
  },
  less: {
    test: /\.less$/,
    use: [
      'raw-loader',
      'less-loader'
    ]
  },
  scss: {
    test: /\.scss/,
    use: [
      'raw-loader',
      'sass-loader'
    ]
  },
  css: {
    test: /\.css$/,
    use: [
      'raw-loader',
      'css-loader'
    ]
  },
};

const template_run_rules = {
  ts: {
    test: /\.ts$/,
    loaders: ['ts-loader', 'angular2-template-loader'],
    exclude: /main\.aot\.ts$/
  },
  tsWithComments: {
    test: /\.ts$/,
    use: [
      {
        loader: 'ts-loader',
        options: {
          compilerOptions: {
            removeComments: false
          }
        }
      },
      {
        loader: 'angular2-template-loader'
      }
    ],
    exclude: [nModules]
  },
  tsNoComments: {
    test: /\.ts$/,
    use: [
      {
        loader: 'ts-loader',
        options: {
          compilerOptions: {
            removeComments: true
          }
        }
      },
      {
        loader: 'angular2-template-loader'
      }
    ],
    exclude: [nModules]
  },
  html: {
    test: /\.html$/,
    loader: "raw-loader",
  },
  less: {
    test: /\.less$/,
    use: [
      'raw-loader',
      'less-loader'
    ]
  },
  scss: {
    test: /\.scss/,
    use: [
      'raw-loader',
      'sass-loader'
    ]
  },
  css: {
    test: /\.css$/,
    use: [
      'raw-loader',
      'css-loader'
    ]
  }
};


const rules = {
  ts: {
    test: /\.ts$/,
    loader: 'ts-loader',
    exclude: [nModules]
  },
  tsWithComments: {
    test: /\.ts$/,
    loader: 'ts-loader',
    query: {"compilerOptions": {"removeComments": false}},
    exclude: [nModules]
  },
  tsNoComments: {
    test: /\.ts$/,
    loader: 'ts-loader',
    query: {"compilerOptions": {"removeComments": true}},
    exclude: [nModules]
  },
  html: {
    test: /\.html$/,
    loader: "html-loader",
    options: {
      minimize: true,
      removeAttributeQuotes: false,
      caseSensitive: true,
      customAttrSurround: [[/#/, /(?:)/], [/\*/, /(?:)/], [/\[?\(?/, /(?:)/]],
      customAttrAssign: [/\)?\]?=/]
    }
  },
  jpg: {
    test: /\.(?:jpg|png)$/,
    use: {
      loader: 'url-loader',
      options: {
        limit: 100000
      }
    }
  },
  less: {
    test: /\.less$/,
    use: [
        'style-loader',
        'css-loader',
        'less-loader'
    ]
  },
  scss: {
    test: /\.scss/,
    use: [
      'style-loader',
      'css-loader',
      'sass-loader'
    ]
  },
  css: {
    test: /\.css$/,
    use: [
      'style-loader',
      'css-loader'
    ]
  },
  woff: {
    test: /\.woff(2)?(\?v=\d+\.\d+\.\d+)?$/,
    use: {
      loader: 'url-loader',
      options: {
        limit: 100000,
        mimetype: 'application/font-woff'
      }
    }
  },
  ttf: {
    test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
    use: {
      loader: 'url-loader',
      options: {
        limit: 100000,
        mimetype: 'application/octet-stream'
      }
    }
  },
  eot: {
    test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
    loader: "file-loader"
  },
  svg: {
    test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
    use: {
      loader: 'url-loader',
      options: {
        limit: 100000,
        mimetype: 'application/image/svg+xm'
      }
    }
  },
  raw: {
    test: /\.(?:tjs|tjson|xml)$/,
    loader: 'raw-loader'
  },
  styleNullLoader: {
    test: /\.(?:css|less|scss|styl)$/,
    loader: 'null-loader'
  }
};

module.exports = {
  devtool: devTool,
  extensions: resolveExtensions,
  preRules: preRules,
  postRules: postRules,
  rules: rules,
  template_run_rules: template_run_rules,
  aot_build_rules: aot_build_rules
};
