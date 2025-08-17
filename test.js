import test from 'ava';
import ansiEscapes from 'ansi-escapes';
import * as ansiCodes from './fixtures/ansi-codes.js';
import ansiRegex from './index.js';

const consumptionCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+1234567890-=[]{};\':"./>?,<\\|';

// Testing against codes found at: http://ascii-table.com/ansi-escape-sequences-vt-100.php
test('match ansi code in a string', t => {
	t.regex('foo\u001B[4mcake\u001B[0m', ansiRegex());
	t.regex('\u001B[4mcake\u001B[0m', ansiRegex());
	t.regex('foo\u001B[4mcake\u001B[0m', ansiRegex());
	t.regex('\u001B[0m\u001B[4m\u001B[42m\u001B[31mfoo\u001B[39m\u001B[49m\u001B[24mfoo\u001B[0m', ansiRegex());
	t.regex('foo\u001B[mfoo', ansiRegex());
});

test('match ansi code from ls command', t => {
	t.regex('\u001B[00;38;5;244m\u001B[m\u001B[00;38;5;33mfoo\u001B[0m', ansiRegex());
});

test('match reset;setfg;setbg;italics;strike;underline sequence in a string', t => {
	t.regex('\u001B[0;33;49;3;9;4mbar\u001B[0m', ansiRegex());
	t.is('foo\u001B[0;33;49;3;9;4mbar'.match(ansiRegex())[0], '\u001B[0;33;49;3;9;4m');
});

test('match clear tabs sequence in a string', t => {
	t.regex('foo\u001B[0gbar', ansiRegex());
	t.is('foo\u001B[0gbar'.match(ansiRegex())[0], '\u001B[0g');
});

test('match clear line from cursor right in a string', t => {
	t.regex('foo\u001B[Kbar', ansiRegex());
	t.is('foo\u001B[Kbar'.match(ansiRegex())[0], '\u001B[K');
});

test('match clear screen in a string', t => {
	t.regex('foo\u001B[2Jbar', ansiRegex());
	t.is('foo\u001B[2Jbar'.match(ansiRegex())[0], '\u001B[2J');
});

test('match only first', t => {
	t.is('foo\u001B[4mcake\u001B[0m'.match(ansiRegex({onlyFirst: true})).length, 1);
});

test('match terminal link', t => {
	for (const ST of ['\u0007', '\u001B\u005C', '\u009C']) {
		t.regex(`\u000B]8;k=v;https://example-a.com/?a_b=1&c=2#tit%20le${ST}click\u001B]8;;${ST}`, ansiRegex());
		t.regex(`\u001B]8;;mailto:no-replay@mail.com${ST}mail\u001B]8;;${ST}`, ansiRegex());
		t.deepEqual(`\u001B]8;k=v;https://example-a.com/?a_b=1&c=2#tit%20le${ST}click\u001B]8;;${ST}`.match(ansiRegex()), [
			`\u001B]8;k=v;https://example-a.com/?a_b=1&c=2#tit%20le${ST}`,
			`\u001B]8;;${ST}`,
		]);
		t.deepEqual(`\u001B]8;;mailto:no-reply@mail.com${ST}mail-me\u001B]8;;${ST}`.match(ansiRegex()), [
			`\u001B]8;;mailto:no-reply@mail.com${ST}`,
			`\u001B]8;;${ST}`,
		]);
	}
});

test('match "change icon name and window title" in string', t => {
	t.is('\u001B]0;sg@tota:~/git/\u0007\u001B[01;32m[sg@tota\u001B[01;37m misc-tests\u001B[01;32m]$'.match(ansiRegex())[0], '\u001B]0;sg@tota:~/git/\u0007');
});

test('match colon-separated sequence arguments', t => {
	t.regex('\u001B[38:2:68:68:68:48:2:0:0:0m', ansiRegex());
	t.is('\u001B[38:2:68:68:68:48:2:0:0:0m'.match(ansiRegex())[0], '\u001B[38:2:68:68:68:48:2:0:0:0m');
});

test('match colon-separated underline variants', t => {
	for (const code of ['\u001B[4:0m', '\u001B[4:1m', '\u001B[4:2m', '\u001B[4:3m', '\u001B[4:4m', '\u001B[4:5m']) {
		t.regex(code, ansiRegex());
		t.is(code.match(ansiRegex())[0], code);
	}
});

test('match colon-separated indexed color (38:5)', t => {
	const code = '\u001B[38:5:123m';
	t.regex(code, ansiRegex());
	t.is(code.match(ansiRegex())[0], code);
});

test('match colon-separated indexed background color (48:5)', t => {
	const code = '\u001B[48:5:200m';
	t.regex(code, ansiRegex());
	t.is(code.match(ansiRegex())[0], code);
});

test('match colon-separated underline color palette index (58:5)', t => {
	const code = '\u001B[58:5:200m';
	t.regex(code, ansiRegex());
	t.is(code.match(ansiRegex())[0], code);
});

test('match colon-separated RGB colors (38:2::R:G:B and 48:2::R:G:B)', t => {
	for (const code of ['\u001B[38:2::12:34:56m', '\u001B[48:2::200:201:202m']) {
		t.regex(code, ansiRegex());
		t.is(code.match(ansiRegex())[0], code);
	}
});

test('match colon-separated underline color RGB (58:2::R:G:B)', t => {
	const code = '\u001B[58:2::255:0:0m';
	t.regex(code, ansiRegex());
	t.is(code.match(ansiRegex())[0], code);
});

test('match colon-separated RGBA foreground/background (38:6, 48:6)', t => {
	for (const code of ['\u001B[38:6::255:0:0:128m', '\u001B[48:6::0:0:0:64m']) {
		t.regex(code, ansiRegex());
		t.is(code.match(ansiRegex())[0], code);
	}
});

test('colon-separated sequences should not overconsume', t => {
	const samples = [
		'\u001B[4:5mX',
		'\u001B[38:5:123mX',
		'\u001B[58:2::255:0:0mX',
		'\u001B[38:2::12:34:56mX',
		'\u001B[48:2::200:201:202mX',
	];

	for (const inputString of samples) {
		const match = inputString.match(ansiRegex())[0];
		t.truthy(match);
		t.is(inputString.replace(ansiRegex(), ''), 'X');
	}
});

test('does not match bracketed text without ESC', t => {
	const samples = [
		'[38:2:68:68:68m',
		'[4:5m',
		'some [0m text',
		'plain [58:2::255:0:0m words',
	];
	for (const inputString of samples) {
		t.is(inputString.match(ansiRegex()), null);
	}
});

test('does not match incomplete CSI', t => {
	const inputString = '\\u001B[';
	t.is(inputString.match(ansiRegex()), null);
});

test('does not match ESC followed by unsupported final', t => {
	const inputString = 'pre\\u001B`post';
	t.is(inputString.match(ansiRegex()), null);
});

// Testing against extended codes (excluding codes ending in 0-9)
for (const [codeSetKey, codeSetValue] of Object.entries(ansiCodes)) {
	for (const [code, codeInfo] of codeSetValue) {
		const shouldSkip = /\d$/.test(code);
		const skipText = shouldSkip ? '[SKIP] ' : '';
		const ecode = `\u001B${code}`;

		test(`${codeSetKey} - ${skipText}${code} → ${codeInfo[0]}`, t => {
			if (shouldSkip) {
				t.pass();
				return;
			}

			const string = `hel${ecode}lo`;
			t.regex(string, ansiRegex());
			t.is(string.match(ansiRegex())[0], ecode);
			t.is(string.replace(ansiRegex(), ''), 'hello');
		});

		test(`${codeSetKey} - ${skipText}${code} should not overconsume`, t => {
			if (shouldSkip) {
				t.pass();
				return;
			}

			for (const character of consumptionCharacters) {
				const string = ecode + character;
				t.regex(string, ansiRegex());
				t.is(string.match(ansiRegex())[0], ecode);
				t.is(string.replace(ansiRegex(), ''), character);
			}
		});
	}
}

const escapeCodeFunctionArguments = [1, 2];
const escapeCodeIgnoresList = new Set(['beep', 'image', 'iTerm']);
const escapeCodeResultMap = new Map([['link', escapeCodeFunctionArguments[0]]]);

for (const [key, escapeCode] of Object.entries(ansiEscapes)) {
	if (escapeCodeIgnoresList.has(key)) {
		continue;
	}

	const escapeCodeValue = typeof escapeCode === 'function'
		? escapeCode(...escapeCodeFunctionArguments)
		: escapeCode;

	test(`ansi-escapes ${key}`, t => {
		for (const character of consumptionCharacters) {
			const string = escapeCodeValue + character;
			const result = (escapeCodeResultMap.get(key) || '') + character;

			t.is(string.replace(ansiRegex(), ''), result);
		}
	});
}
