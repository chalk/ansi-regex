'use strict';
var assert = require('assert');
var ansiRegex = require('./');

it('should match ansi code in a string', function () {
	assert(ansiRegex().test('foo\u001b[4mcake\u001b[0m'));
	assert(ansiRegex().test('\u001b[4mcake\u001b[0m'));
	assert(ansiRegex().test('foo\u001b[4mcake\u001b[0m'));
	assert(ansiRegex().test('\u001b[0m\u001b[4m\u001b[42m\u001b[31mfoo\u001b[39m\u001b[49m\u001b[24mfoo\u001b[0m'));
	assert(ansiRegex().test('foo\u001b[mfoo'));
});

it('should match ansi code from ls command', function () {
	assert(ansiRegex().test('\u001b[00;38;5;244m\u001b[m\u001b[00;38;5;33mfoo\u001b[0m'));
});

it('should match reset;setfg;setbg;italics;strike;underline sequence in a string', function () {
	assert(ansiRegex().test('\u001b[0;33;49;3;9;4mbar\u001b[0m'));
});
