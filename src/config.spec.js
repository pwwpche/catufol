/* global describe */
/* global it */
/* global expect */
/* global require */
'use strict';

const Conf = require('./config');

function expectAll(wpConf) {
  const vals = ['.ts', '.js', '.json', '.css', '.less', '.html'];
  vals.forEach(v => {
    expect(wpConf.resolve.extensions.indexOf(v) > -1).toBe(true);
  });
}

describe('Configuration', () => {
  it('Test', () => {
    const source = {appName: 'a', vendors: ['b', 'c'], entryFile: 'e'};
    const conf = new Conf(source);
    const wpConf = conf.wpTest();

    expectAll(wpConf);

    expect(wpConf.devtool).toBe('inline-source-map');
    expect(wpConf.entryFile).toBeUndefined();
    expect(wpConf.plugins.length).toBe(0);
    expect(wpConf.entry).toBeUndefined();
    expect(wpConf.output).toBeUndefined();
  });

  it('Should use template loader if useTemplateUrl while not enableAOT', () => {
    const source = {
      appName: 'a',
      vendors: ['b', 'c'],
      devEntryFile: 'dev-file',
      prodEntryFile: 'prod-file',
      aotEntryFile: 'aot-file',
      useTemplateUrl: true,
      enableAOT: false
    };
    const conf = new Conf(source);
    const runbase = conf.wpRun();
    const buildbase = conf.wpBuild();
    const bases = [runbase, buildbase];
    expect(runbase.entry.app).toContain('dev-file');
    expect(runbase.entry.app).not.toContain('prod-file');
    expect(buildbase.entry.app).toContain('prod-file');
    expect(buildbase.entry.app).not.toContain('dev-file');

    bases.forEach(base => {
      expect(base.entry.app).not.toContain("aot-file");
      expect(JSON.stringify(base.module.rules)
              .indexOf("angular2-template-loader") !== -1).toBe(true);
      expect(JSON.stringify(base.module.rules)
              .indexOf("@ngtools/webpack") === -1).toBe(true);
    });
  });

  it('Should use ngtools/webpack when enableAOT', () => {

    // tsConfigAOT: 'package.json':
    // package.json is not a typescript config file. It is added because the AOT
    // plugin '@ngtools/webpack' needs a file to initialize itself.
    const source = {
      appName: 'a',
      vendors: ['b', 'c'],
      devEntryFile: 'dev-file',
      prodEntryFile: 'prod-file',
      aotEntryFile: 'aot-file',
      useTemplateUrl: true,
      enableAOT: true,
      tsConfigAOT: 'package.json'
    };
    const conf = new Conf(source);
    const runbase = conf.wpRun();
    const buildbase = conf.wpBuild();
    const bases = [runbase, buildbase];

    bases.forEach(base => {
      expect(base.entry.app).toContain('aot-file');
      expect(base.entry.app).not.toContain('prod-file');
      expect(base.entry.app).not.toContain("dev-file");

      expect(JSON.stringify(base.module.rules)
              .indexOf("angular2-template-loader") === -1).toBe(true);
      expect(JSON.stringify(base.module.rules)
              .indexOf("@ngtools/webpack") !== -1).toBe(true);
    });
  });


  it('Should not contain @ngtools/webpack when running tests', () => {
    const source = {
      appName: 'a',
      vendors: ['b', 'c'],
      devEntryFile: 'dev-file',
      prodEntryFile: 'prod-file',
      aotEntryFile: 'aot-file',
      useTemplateUrl: true,
      enableAOT: true
    };
    const conf = new Conf(source);
    const base = conf.wpTest();
    expect(JSON.stringify(base.module.rules)
            .indexOf("angular2-template-loader") !== -1).toBe(true);
    expect(JSON.stringify(base.module.rules)
            .indexOf("@ngtools/webpack") === -1).toBe(true);

  });

  it('ExportJQuery should be false by default', () => {
    const source = {appName: 'a', vendors: ['b', 'c'], entryFile: 'e'};
    const conf = new Conf(source);
    expect(conf.json().exportJQuery).toBe(false)
  });

  it('No Karma files by default', () => {
    const source = {appName: 'a', vendors: ['b', 'c'], entryFile: 'e'};
    const conf = new Conf(source);
    const karma = conf.karmaBase();
    expect(conf.json().karmaFiles.length).toBe(0);
    expect(karma.files.length).toBe(10);
  });

  it('Karma file as string', () => {
    const source = {
      appName: 'a',
      vendors: ['b', 'c'],
      entryFile: 'e',
      karmaFiles: ['a.f']
    };
    const conf = new Conf(source);

    expect(conf.json().karmaFiles.length).toBe(1);
    expect(conf.json().karmaFiles[0]).toBe('a.f');

    const karma = conf.karmaBase();
    expect(karma.files.length).toBe(11);
    expect(karma.files.indexOf('a.f') >= 0).toBe(true);
  });
});