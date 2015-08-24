'use strict';
var assert = require('assert');
var ansiRegex = require('../');
var ansiCodes = require('./ansiCodes.js');

var consumptionChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+1234567890-=[]{};\':"./>?,<\\|';

// testing against codes found at: http://ascii-table.com/ansi-escape-sequences-vt-100.php
describe('practical tests', function () {
	it('should match ansi code in a string', function () {
		assert.equal(ansiRegex().test('foo\u001b[4mcake\u001b[0m'), true);
		assert.equal(ansiRegex().test('\u001b[4mcake\u001b[0m'), true);
		assert.equal(ansiRegex().test('foo\u001b[4mcake\u001b[0m'), true);
		assert.equal(ansiRegex().test('\u001b[0m\u001b[4m\u001b[42m\u001b[31mfoo\u001b[39m\u001b[49m\u001b[24mfoo\u001b[0m'), true);
		assert.equal(ansiRegex().test('foo\u001b[mfoo'), true);
	});

	it('should match ansi code from ls command', function () {
		assert.equal(ansiRegex().test('\u001b[00;38;5;244m\u001b[m\u001b[00;38;5;33mfoo\u001b[0m'), true);
	});

	it('should match reset;setfg;setbg;italics;strike;underline sequence in a string', function () {
		assert.equal(ansiRegex().test('\u001b[0;33;49;3;9;4mbar\u001b[0m'), true);
		assert.equal('foo\u001b[0;33;49;3;9;4mbar'.match(ansiRegex())[0], '\u001b[0;33;49;3;9;4m');
	});

	it('should match clear tabs sequence in a string', function () {
		assert.equal(ansiRegex().test('foo\u001b[0gbar'), true);
		assert.equal('foo\u001b[0gbar'.match(ansiRegex())[0], '\u001b[0g');
	});

	it('should match clear line from cursor right in a string', function () {
		assert.equal(ansiRegex().test('foo\u001b[Kbar'), true);
		assert.equal('foo\u001b[Kbar'.match(ansiRegex())[0], '\u001b[K');
	});

	it('should match clear screen in a string', function () {
		assert.equal(ansiRegex().test('foo\u001b[2Jbar'), true);
		assert.equal('foo\u001b[2Jbar'.match(ansiRegex())[0], '\u001b[2J');
	});
});

// testing against extended codes (excluding codes ending in 0-9)
describe('extended tests', function () {
	for (var codeSet in ansiCodes) {
		describe(codeSet, function () {
			for (var code in ansiCodes[codeSet]) {
				var codeInfo = ansiCodes[codeSet][code];
				var skip = /[0-9]$/.test(code);
				var skipText = skip ? '[SKIP] ' : '';
				var ecode = '\u001b' + code;

				it(skipText + code + ' -> ' + codeInfo[0], function (ecode, skip) {
					if (skip) {
						return;
					}

					var string = 'hel' + ecode + 'lo';
					assert.equal(ansiRegex().test(string), true);
					assert.equal(string.match(ansiRegex())[0], ecode);
					assert.equal(string.replace(ansiRegex(), ''), 'hello');
				}.bind(null, ecode, skip));

				it(skipText + code + ' should not overconsume', function (ecode, skip) {
					if (skip) {
						return;
					}

					for (var i = 0; i < consumptionChars.length; i++) {
						var c = consumptionChars[i];
						var string = ecode + c;
						assert.equal(ansiRegex().test(string), true);
						assert.equal(string.match(ansiRegex())[0], ecode);
						assert.equal(string.replace(ansiRegex(), ''), c);
					}
				}.bind(null, ecode, skip));
			}
		});
	}
});
