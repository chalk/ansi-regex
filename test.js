'use strict';
var assert = require('assert');
var ansiRegex = require('./');

it('should match ansi code in a string', function () {
	assert(ansiRegex.test('\x1b[4mcake\x1b[0m'));
	assert(ansiRegex.test('\x1b[0m\x1b[4m\x1b[42m\x1b[31mfoo\x1b[39m\x1b[49m\x1b[24mfoo\x1b[0m'));
});

it('should match ansi code from ls command', function () {
    assert(ansiRegex.test('\x1b[00;38;5;244m\x1b[m\x1b[00;38;5;33mfoo\x1b[0m'));
});

it('should match reset;setfg;setbg;italics;strike;underline sequence in a string', function () {
	assert(ansiRegex.test('\x1b[0;33;49;3;9;4mbar\x1b[0m'));
});
