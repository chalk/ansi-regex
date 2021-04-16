import test from 'ava';
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
	t.regex('\u001B]8;k=v;https://example-a.com/?a_b=1&c=2#tit%20le\u0007click\u001B]8;;\u0007', ansiRegex());
	t.regex('\u001B]8;;mailto:no-replay@mail.com\u0007mail\u001B]8;;\u0007', ansiRegex());
	t.deepEqual('\u001B]8;k=v;https://example-a.com/?a_b=1&c=2#tit%20le\u0007click\u001B]8;;\u0007'.match(ansiRegex()), [
		'\u001B]8;k=v;https://example-a.com/?a_b=1&c=2#tit%20le\u0007',
		'\u001B]8;;\u0007'
	]);
	t.deepEqual('\u001B]8;;mailto:no-reply@mail.com\u0007mail-me\u001B]8;;\u0007'.match(ansiRegex()), [
		'\u001B]8;;mailto:no-reply@mail.com\u0007',
		'\u001B]8;;\u0007'
	]);
});

test('match "change icon name and window title" in string', t => {
	t.is('\u001B]0;sg@tota:~/git/\u0007\u001B[01;32m[sg@tota\u001B[01;37m misc-tests\u001B[01;32m]$'.match(ansiRegex())[0], '\u001B]0;sg@tota:~/git/\u0007');
});

// Testing against extended codes (excluding codes ending in 0-9)
for (const codeSet of Object.keys(ansiCodes)) {
	for (const [code, codeInfo] of ansiCodes[codeSet]) {
		const skip = /\d$/.test(code);
		const skipText = skip ? '[SKIP] ' : '';
		const ecode = `\u001B${code}`;

		test(`${codeSet} - ${skipText}${code} → ${codeInfo[0]}`, t => {
			if (skip) {
				t.pass();
				return;
			}

			const string = `hel${ecode}lo`;
			t.regex(string, ansiRegex());
			t.is(string.match(ansiRegex())[0], ecode);
			t.is(string.replace(ansiRegex(), ''), 'hello');
		});

		test(`${codeSet} - ${skipText}${code} should not overconsume`, t => {
			if (skip) {
				t.pass();
				return;
			}

			for (const c of consumptionCharacters) {
				const string = ecode + c;
				t.regex(string, ansiRegex());
				t.is(string.match(ansiRegex())[0], ecode);
				t.is(string.replace(ansiRegex(), ''), c);
			}
		});
	}
}
