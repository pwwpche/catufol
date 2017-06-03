/* global describe */
/* global it */
/* global expect */
/* global require */
'use strict';

const Conf = require('./config');

function expectAll(wpConf) {
    const vals = ['.ts','.js','.json','.css', '.less', '.html'];
    vals.forEach(v => { expect(wpConf.resolve.extensions.indexOf(v) > -1).toBe(true);} );

    expect(wpConf.htmlLoader.minimize).toBe(true);
    expect(wpConf.htmlLoader.removeAttributeQuotes).toBe(false);
    expect(wpConf.htmlLoader.caseSensitive).toBe(true);


}

describe('Configuration', () => {
    it('Test', () => {
        const source = { appName: 'a', vendors: ['b', 'c'], entryFile: 'e' };
        const conf = new Conf(source);
        const wpConf = conf.wpTest();

        expectAll(wpConf);

        expect(wpConf.devtool).toBe('inline-source-map');
        expect(wpConf.plugins.length).toBe(0);
        expect(wpConf.entry).toBeUndefined();
        expect(wpConf.output).toBeUndefined();

        expect(wpConf.tslint.emitErrors).toBe(false);
        expect(wpConf.tslint.failOnHint).toBe(false);
    });

    it('ExportJQuery should be false by default', () => {
        const source = { appName: 'a', vendors: ['b', 'c'], entryFile: 'e' };
        const conf = new Conf(source);

        expect(conf.json().exportJQuery).toBe(false)
    });

    it('No Karma files by default', () => {
        const source = { appName: 'a', vendors: ['b', 'c'], entryFile: 'e' };
        const conf = new Conf(source);
        const karma = conf.karmaBase();
        expect(conf.json().karmaFiles.length).toBe(0);
        expect(karma.files.length).toBe(10);
    });

    it('Karma file as string', () => {
        const source = { appName: 'a', vendors: ['b', 'c'], entryFile: 'e', karmaFiles: ['a.f'] };
        const conf = new Conf(source);

        expect(conf.json().karmaFiles.length).toBe(1);
        expect(conf.json().karmaFiles[0]).toBe('a.f');

        const karma = conf.karmaBase();
        expect(karma.files.length).toBe(11);
        expect(karma.files.indexOf('a.f') >= 0).toBe(true);
    });

    it('Karma test runs on Chrome', () => {
        const source = { appName: 'a', vendors: ['b', 'c'], entryFile: 'e', karmaFiles: ['a.f'] };
        const conf = new Conf(source);
        const karma = conf.karmaTest();
        expect(karma.browsers.length).toBe(1);
        expect(karma.browsers[0]).toBe('Chrome');
        expect(karma.customLaunchers).toBeUndefined();
    });

    it('Karma headless runs on Chrome Headless', () => {
        const source = { appName: 'a', vendors: ['b', 'c'], entryFile: 'e', karmaFiles: ['a.f'] };
        const conf = new Conf(source);
        const karma = conf.karmaHeadless();
        expect(karma.browsers.length).toBe(1);
        expect(karma.browsers[0]).toBe('ChromeHeadless');
        expect(karma.customLaunchers).toBeDefined();
        expect(karma.customLaunchers.ChromeHeadless).toBeDefined();
    });
});