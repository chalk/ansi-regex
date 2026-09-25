import {test} from 'node:test';
import assert from 'node:assert/strict';
import ansiEscapes from 'ansi-escapes';
import * as ansiCodes from './fixtures/ansi-codes.js';
import ansiRegex from './index.js';

const consumptionCharacters = String.raw`abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+1234567890-=[]{};':"./>?,<\|`;

// Testing against codes found at: http://ascii-table.com/ansi-escape-sequences-vt-100.php
test('match ansi code in a string', () => {
	assert.match('foo\u{001B}[4mcake\u{001B}[0m', ansiRegex());
	assert.match('\u{001B}[4mcake\u{001B}[0m', ansiRegex());
	assert.match('foo\u{001B}[4mcake\u{001B}[0m', ansiRegex());
	assert.match('\u{001B}[0m\u{001B}[4m\u{001B}[42m\u{001B}[31mfoo\u{001B}[39m\u{001B}[49m\u{001B}[24mfoo\u{001B}[0m', ansiRegex());
	assert.match('foo\u{001B}[mfoo', ansiRegex());
});

test('match ansi code from ls command', () => {
	assert.match('\u{001B}[00;38;5;244m\u{001B}[m\u{001B}[00;38;5;33mfoo\u{001B}[0m', ansiRegex());
});

test('match reset;setfg;setbg;italics;strike;underline sequence in a string', () => {
	assert.match('\u{001B}[0;33;49;3;9;4mbar\u{001B}[0m', ansiRegex());
	assert.equal('foo\u{001B}[0;33;49;3;9;4mbar'.match(ansiRegex())[0], '\u{001B}[0;33;49;3;9;4m');
});

test('match clear tabs sequence in a string', () => {
	assert.match('foo\u{001B}[0gbar', ansiRegex());
	assert.equal('foo\u{001B}[0gbar'.match(ansiRegex())[0], '\u{001B}[0g');
});

test('match clear line from cursor right in a string', () => {
	assert.match('foo\u{001B}[Kbar', ansiRegex());
	assert.equal('foo\u{001B}[Kbar'.match(ansiRegex())[0], '\u{001B}[K');
});

test('match clear screen in a string', () => {
	assert.match('foo\u{001B}[2Jbar', ansiRegex());
	assert.equal('foo\u{001B}[2Jbar'.match(ansiRegex())[0], '\u{001B}[2J');
});

test('match only first', () => {
	assert.equal('foo\u{001B}[4mcake\u{001B}[0m'.match(ansiRegex({onlyFirst: true})).length, 1);
});

test('match terminal link', () => {
	for (const ST of ['\u{0007}', '\u{001B}\u{005C}', '\u{009C}']) {
		assert.match(`\u{001B}]8;k=v;https://example-a.com/?a_b=1&c=2#tit%20le${ST}click\u{001B}]8;;${ST}`, ansiRegex());
		assert.match(`\u{001B}]8;;mailto:no-replay@mail.com${ST}mail\u{001B}]8;;${ST}`, ansiRegex());
		assert.deepEqual(`\u{001B}]8;k=v;https://example-a.com/?a_b=1&c=2#tit%20le${ST}click\u{001B}]8;;${ST}`.match(ansiRegex()), [
			`\u{001B}]8;k=v;https://example-a.com/?a_b=1&c=2#tit%20le${ST}`,
			`\u{001B}]8;;${ST}`,
		]);
		assert.deepEqual(`\u{001B}]8;;mailto:no-reply@mail.com${ST}mail-me\u{001B}]8;;${ST}`.match(ansiRegex()), [
			`\u{001B}]8;;mailto:no-reply@mail.com${ST}`,
			`\u{001B}]8;;${ST}`,
		]);
	}
});

test('match terminal link with plus in URL', () => {
	for (const ST of ['\u{0007}', '\u{001B}\u{005C}', '\u{009C}']) {
		const seqOpen = `\u{001B}]8;;https://www.example.com/?q=hello+world${ST}`;
		const seqClose = `\u{001B}]8;;${ST}`;
		const value = `${seqOpen}hello${seqClose}`;
		assert.deepEqual(value.match(ansiRegex()), [seqOpen, seqClose]);
		assert.equal(value.replace(ansiRegex(), ''), 'hello');
	}
});

test('match "change icon name and window title" in string', () => {
	assert.equal('\u{001B}]0;sg@tota:~/git/\u{0007}\u{001B}[01;32m[sg@tota\u{001B}[01;37m misc-tests\u{001B}[01;32m]$'.match(ansiRegex())[0], '\u{001B}]0;sg@tota:~/git/\u{0007}');
});

test('match colon-separated sequence arguments', () => {
	assert.match('\u{001B}[38:2:68:68:68:48:2:0:0:0m', ansiRegex());
	assert.equal('\u{001B}[38:2:68:68:68:48:2:0:0:0m'.match(ansiRegex())[0], '\u{001B}[38:2:68:68:68:48:2:0:0:0m');
});

test('match colon-separated underline variants', () => {
	for (const code of ['\u{001B}[4:0m', '\u{001B}[4:1m', '\u{001B}[4:2m', '\u{001B}[4:3m', '\u{001B}[4:4m', '\u{001B}[4:5m']) {
		assert.match(code, ansiRegex());
		assert.equal(code.match(ansiRegex())[0], code);
	}
});

test('match colon-separated indexed color (38:5)', () => {
	const code = '\u{001B}[38:5:123m';
	assert.match(code, ansiRegex());
	assert.equal(code.match(ansiRegex())[0], code);
});

test('match colon-separated indexed background color (48:5)', () => {
	const code = '\u{001B}[48:5:200m';
	assert.match(code, ansiRegex());
	assert.equal(code.match(ansiRegex())[0], code);
});

test('match colon-separated underline color palette index (58:5)', () => {
	const code = '\u{001B}[58:5:200m';
	assert.match(code, ansiRegex());
	assert.equal(code.match(ansiRegex())[0], code);
});

test('match colon-separated RGB colors (38:2::R:G:B and 48:2::R:G:B)', () => {
	for (const code of ['\u{001B}[38:2::12:34:56m', '\u{001B}[48:2::200:201:202m']) {
		assert.match(code, ansiRegex());
		assert.equal(code.match(ansiRegex())[0], code);
	}
});

test('match colon-separated underline color RGB (58:2::R:G:B)', () => {
	const code = '\u{001B}[58:2::255:0:0m';
	assert.match(code, ansiRegex());
	assert.equal(code.match(ansiRegex())[0], code);
});

test('match colon-separated RGBA foreground/background (38:6, 48:6)', () => {
	for (const code of ['\u{001B}[38:6::255:0:0:128m', '\u{001B}[48:6::0:0:0:64m']) {
		assert.match(code, ansiRegex());
		assert.equal(code.match(ansiRegex())[0], code);
	}
});

test('colon-separated sequences should not overconsume', () => {
	const samples = [
		'\u{001B}[4:5mX',
		'\u{001B}[38:5:123mX',
		'\u{001B}[58:2::255:0:0mX',
		'\u{001B}[38:2::12:34:56mX',
		'\u{001B}[48:2::200:201:202mX',
	];

	for (const inputString of samples) {
		const match = inputString.match(ansiRegex())[0];
		assert.ok(match);
		assert.equal(inputString.replace(ansiRegex(), ''), 'X');
	}
});

test('does not match bracketed text without ESC', () => {
	const samples = [
		'[38:2:68:68:68m',
		'[4:5m',
		'some [0m text',
		'plain [58:2::255:0:0m words',
	];
	for (const inputString of samples) {
		assert.equal(inputString.match(ansiRegex()), null);
	}
});

test('does not match incomplete CSI', () => {
	const inputString = '\u{001B}[';
	assert.equal(inputString.match(ansiRegex()), null);
});

test('does not match ESC followed by unsupported final', () => {
	const inputString = 'pre\u{001B}`post';
	assert.equal(inputString.match(ansiRegex()), null);
});

test('an unterminated OSC sequence does not consume a later one', () => {
	// The payload used to scan ahead for a terminator, so an unterminated `ESC ]` swallowed everything up to the next sequence's terminator, deleting the visible text in between.
	const inputString = '\u{001B}]0;unterminated text \u{001B}]8;;https://example.com\u{0007}link';
	assert.ok(inputString.replace(ansiRegex(), '').includes('text'));
	assert.ok(!inputString.replace(ansiRegex(), '').includes('https://example.com'));
});

test('an OSC sequence does not consume a later sequence after an unexpected ESC', () => {
	const inputString = '\u{001B}]:payload\u{001B}[31mvisible\u{001B}]8;;https://example.com\u{0007}';
	assert.deepEqual(inputString.match(ansiRegex()), [
		'\u{001B}[31m',
		'\u{001B}]8;;https://example.com\u{0007}',
	]);
	assert.equal(inputString.replace(ansiRegex(), ''), '\u{001B}]:payloadvisible');
});

test('match OSC sequences containing non-terminator control characters', () => {
	for (const terminator of ['\u{0007}', '\u{001B}\u{005C}', '\u{009C}']) {
		const inputString = `\u{001B}]0;title\u{0000}\u{0008}\n\u{000B}\u{000C}\u{000D}${terminator}`;
		assert.equal(inputString.match(ansiRegex())[0], inputString);
	}
});

test('match OSC sequences using the C1 introducer', () => {
	for (const terminator of ['\u{0007}', '\u{001B}\u{005C}', '\u{009C}']) {
		const sequence = `\u{009D}0;title${terminator}`;
		assert.deepEqual(`${sequence}hello`.match(ansiRegex()), [sequence]);
		assert.equal(`${sequence}hello`.replace(ansiRegex(), ''), 'hello');
	}
});

test('an unterminated C1 OSC sequence does not consume a later one', () => {
	const inputString = '\u{009D}0;unterminated text \u{009D}8;;https://example.com\u{0007}link';
	assert.deepEqual(inputString.match(ansiRegex()), ['\u{009D}8;;https://example.com\u{0007}']);
});

test('an OSC sequence does not consume a later sequence after an unexpected C1 introducer', () => {
	const inputString = '\u{001B}]:payload\u{009D}8;;https://example.com\u{0007}';
	assert.deepEqual(inputString.match(ansiRegex()), ['\u{009D}8;;https://example.com\u{0007}']);
	assert.equal(inputString.replace(ansiRegex(), ''), '\u{001B}]:payload');
});

// Testing against extended codes (excluding codes ending in 0-9)
for (const [codeSetKey, codeSetValue] of Object.entries(ansiCodes)) {
	for (const [code, codeInfo] of codeSetValue) {
		const shouldSkip = /\d$/v.test(code);
		const skipText = shouldSkip ? '[SKIP] ' : '';
		const ecode = `\u{001B}${code}`;

		test(`${codeSetKey} - ${skipText}${code} → ${codeInfo[0]}`, () => {
			if (shouldSkip) {
				return;
			}

			const string = `hel${ecode}lo`;
			assert.match(string, ansiRegex());
			assert.equal(string.match(ansiRegex())[0], ecode);
			assert.equal(string.replace(ansiRegex(), ''), 'hello');
		});

		test(`${codeSetKey} - ${skipText}${code} should not overconsume`, () => {
			if (shouldSkip) {
				return;
			}

			for (const character of consumptionCharacters) {
				const string = ecode + character;
				assert.match(string, ansiRegex());
				assert.equal(string.match(ansiRegex())[0], ecode);
				assert.equal(string.replace(ansiRegex(), ''), character);
			}
		});
	}
}

const escapeCodeFunctionArguments = [1, 2];
const escapeCodeIgnoresList = new Set(['beep', 'image', 'iTerm']);
const escapeCodeResultMap = new Map([
	['link', escapeCodeFunctionArguments[0]],
	['synchronizedOutput', escapeCodeFunctionArguments[0]],
]);

for (const [key, escapeCode] of Object.entries(ansiEscapes)) {
	// Some exports group codes in an object instead of being a single escape code, for example `ConEmu`.
	if (escapeCodeIgnoresList.has(key) || (typeof escapeCode !== 'string' && typeof escapeCode !== 'function')) {
		continue;
	}

	const escapeCodeValue = typeof escapeCode === 'function'
		? escapeCode(...escapeCodeFunctionArguments)
		: escapeCode;

	test(`ansi-escapes ${key}`, () => {
		for (const character of consumptionCharacters) {
			const string = escapeCodeValue + character;
			const result = (escapeCodeResultMap.get(key) || '') + character;

			assert.equal(string.replace(ansiRegex(), ''), result);
		}
	});
}
