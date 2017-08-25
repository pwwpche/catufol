[ ![Codeship Status for wigahluk/catufol](https://app.codeship.com/projects/a692f220-f6ce-0134-948f-3e14bfe21487/status?branch=master)](https://app.codeship.com/projects/210582)

Catùfol
=======

A helper tool on the top of Webpack3, Karma, TypeScript and other tools that helps to reduce configuration
steps. The tool will try to work with a minimum of configuration and will use conventions and other project files
to extract configuration settings whenever it's possible.

### About the name

Catùfol is a Catalan word that is used to name the pots or containers that ares used to carry water in a water wheel or
_noria_. There is also a Romainan word (without the accent) that means _potato_. You can chose whichever
meaning you like more :)

## Conventions

Catùfol relays on folder structure and file name conventions in order to work properly. The main idea is to minimize
configuration settings, as a trade off, we need to follow some conventions on how we structure our app.

### Folders

```
yourApp/
├── app/                     // Here goes all your app code
│   ├── main.ts              // Your entry point file for Webpack
│   ├── main.aot.ts          // Your entry point file for Webpack with Ahead-of-Time build (optional)
│   ├── helloTest.spec.ts    // Test files are expected to have the extension .spec.ts
│   └── index.html           // This is the HTML template used to generate the final index.html on your build
├── coverage/                // Generated folder. Coverage reports will be created here
├── build/                   // Generated folder. Your packaged files will be created here
├── typings/                 // Generated folder. Typings use this folder for type definitions
├── node_modules/            // Generated folder. NPM use this folder for keeping dependencies
├── catufol.json             // Catufol configuration file
├── package.json             // NPM configuration file
├── typings.json             // Typings configuration file
├── test.loader.json         // Karma entry point
├── tsconfig.json            // Configuration for the Typescript compiler
└── tsconfig.aot.json        // Configuration for the Angular compiler (optional)
```

* `app` contains all the source files, including tests
* `build` will be used for generated files and its content will be deleted on every build. It should not be versioned
* `coverage` will contain the test coverage reports and it should also be ignored from version control

_As a general rule, avoid creating your own content in generated folders or files as they can be overwritten by different
tools._

#### Files

* `app/main.ts` entry point for the application
* `app/index.html` template to be used to generate the index.html file for loading the app
* `test.loader.js` entry point for Karma 

## Dependencies

* __Webpack__ This project is sort of a Webpack wrapper, without it, it doesn't make too much sense
* __TypeScript__ This project is very opinionated on languages and it assumes you'll use TypeScript, although it will
be compatible with JavaScript sources too
* __Karma__ It is assumed that your project is using Karma to run tests. No plans to support other tools
* __Jasmine__ For now we assume your project is using Jasmine for unit tests
* __NodeJS 5.0__ or greater


## Usage

Install it with NPM:
```shell
npm install catufol
```
    
You may want to add a configuration file `catufol.json`:

```
{
  "appName": "apps",     // It will default to your project name in package.json if not provided
  "devServerPort": 8081, // Defaults to 8080, changes the webpack dev server port
  "exportJQuery": true,  // Defaults to false, when true makes jQuery available in your modules as `jQuery`, `$`, and `window.jQuery`
  "vendors": [           // Modules included here will be included in a vendors.bundle.js file instead of bundle.js
     "reflect-metadata",
     "es6-shim"
     /* ... */
  ],
  "devEntryFile": "./app/main.ts",        // It will default to ./app/main.ts if not provided
  "prodEntryFile": "./app/main-build.ts", // It will default to ./app/main.ts if not provided,
  "aotEntryFile": "./app/main.aot.ts",    // It will default to ./app/main.aot.ts if not provided,
  "karmaFiles": [/* ... */]               // This can be used to insert files in the files configuration for Karma.
                                          // If you need any.By default catufol will load some needed files.
  "useTemplateUrl": false,                // If you are using "templateUrl" and "styleUrls" in @Component, set this to true.
  "enableAOT": false                      // If you want to run or build with Angular Ahead-of-Time compile
}
```

**Notice**:

* Angular can load component template and style from a resource file. This is achieved by using 
`@Component({styleUrls: [...file...], templateUrl: "file.html"})`, instead of the `require(...)`
statements that are more widely used. Webpack needs a special `angular2-template-loader` to load
these resources. So set `useTemplateUrl` to `true` if you are using this method to load your templates.

* `enableAOT` does not work in Test mode, which means you can't test your AOT build. This is because 
AOT and JIT build works on different Jasmine test loaders. However, there's not much use case on 
testing AOT builds, since it shares every file except for the entry file as JIT build.
 
* `enableAOT` will _override_  `useTemplateUrl`. If you want to both develop and build with JIT, 
 just set `useTemplateUrl` to `true`. And you can just set `enableAOT` to `true` if you want to 
 do both in AOT mode. If you want to build with AOT and develop with JIT:
  * Use `{"useTemplateUrl": true}` when developing.
  * Use `{"enableAOT": true}` when building. 


It may be helpful to add some scripts to your `package.json` file:
```
{
  "scripts": {
     "build": "catufol -b",
        "start": "catufol -r",
        "test:debug": "catufol -i",
        "test": "catufol -t"
        /* ... */
        }
}

```

Test loader file for __Karma__ is expected to be on the root of your project and to be named `test.loader.js` and if
you are using AngularJS 2.0 it may look like this:

```javascript
Error.stackTraceLimit = 20;

var context = require.context('./app', true, /\.spec\.ts$/);
context.keys().forEach(context);
var testing = require('@angular/core/testing');
var browserDynamic = require('@angular/platform-browser-dynamic/testing');

testing.setBaseTestProviders(
    browserDynamic.TEST_BROWSER_DYNAMIC_PLATFORM_PROVIDERS,
    browserDynamic.TEST_BROWSER_DYNAMIC_APPLICATION_PROVIDERS
);
```

### Optional loaders

* **Sass** If you want to use Sass you will need to install a Webpack Sass Loader. A recommended version is **3.2.0**. Newer versions will use Webpack 2.0, which is not compatible with the current version of Catùfol.



### Build Folder

The generated `build` folder will have the following structure:

```
build/
├── yourApp/                            // The folder will be named with the same name you used in catufol.json
│   └── bundles/
│       ├── bundle.[sha].js             // Bundled file for your app
│       ├── bundle.[sha].js.map         // Source map for your main bundle file
│       ├── vendor.bundle.[sha].js      // Vendors code bundle
│       └── vendor.bundle.[sha].js.map  // Sourcmap for vendors code
├── buildinfo.json                      // A file containing details about the build
└── index.html                          // HTML that will work as your entry point
```

### CLI options

* `-t` `--test` will run unit tests once using PhantomJS. Commonly used in CI environments
* `-i` `--interactive` will run tests in interactive mode using Chrome
* `-hl` `--headless` will run tests using headless Chrome 
* `-r` `--run` will run Webpack Development Server
* `-b` `--build` will create the final artifacts using Webpack

### Testing

To run the tests, first install webpack and rxjs locally (do not save or include in package.json) with `npm i webpack`,
and `npm i rxjs`.

Run `npm test`.