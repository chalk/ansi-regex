import test from 'ava';
import ansiCodes from './fixtures/ansi-codes';
import m from '.';

const consumptionChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+1234567890-=[]{};\':"./>?,<\\|';

// Testing against codes found at: http://ascii-table.com/ansi-escape-sequences-vt-100.php
test('match ansi code in a string', t => {
	t.regex('foo\u001B[4mcake\u001B[0m', m());
	t.regex('\u001B[4mcake\u001B[0m', m());
	t.regex('foo\u001B[4mcake\u001B[0m', m());
	t.regex('\u001B[0m\u001B[4m\u001B[42m\u001B[31mfoo\u001B[39m\u001B[49m\u001B[24mfoo\u001B[0m', m());
	t.regex('foo\u001B[mfoo', m());
});

test('match ansi code from ls command', t => {
	t.regex('\u001B[00;38;5;244m\u001B[m\u001B[00;38;5;33mfoo\u001B[0m', m());
});

test('match reset;setfg;setbg;italics;strike;underline sequence in a string', t => {
	t.regex('\u001B[0;33;49;3;9;4mbar\u001B[0m', m());
	t.is('foo\u001B[0;33;49;3;9;4mbar'.match(m())[0], '\u001B[0;33;49;3;9;4m');
});

test('match clear tabs sequence in a string', t => {
	t.regex('foo\u001B[0gbar', m());
	t.is('foo\u001B[0gbar'.match(m())[0], '\u001B[0g');
});

test('match clear line from cursor right in a string', t => {
	t.regex('foo\u001B[Kbar', m());
	t.is('foo\u001B[Kbar'.match(m())[0], '\u001B[K');
});

test('match clear screen in a string', t => {
	t.regex('foo\u001B[2Jbar', m());
	t.is('foo\u001B[2Jbar'.match(m())[0], '\u001B[2J');
});

test('match only first', t => {
	t.is('foo\u001B[4mcake\u001B[0m'.match(m(true)).length, 1);
});

test.failing('match "change icon name and window title" in string', t => {
	t.is('\u001B]0;sg@tota:~/git/\u0007\u001B[01;32m[sg@tota\u001B[01;37m misc-tests\u001B[01;32m]$'.match(m())[0], '\u001B]0;sg@tota:~/git/\u0007');
});

// Testing against extended codes (excluding codes ending in 0-9)
for (const codeSet of Object.keys(ansiCodes)) {
	for (const el of ansiCodes[codeSet]) {
		const code = el[0];
		const codeInfo = el[1];
		const skip = /\d$/.test(code);
		const skipText = skip ? '[SKIP] ' : '';
		const ecode = `\u001B${code}`;

		test(`${skipText}${code} → ${codeInfo[0]}`, t => {
			if (skip) {
				t.pass();
				return;
			}

			const string = `hel${ecode}lo`;
			t.regex(string, m());
			t.is(string.match(m())[0], ecode);
			t.is(string.replace(m(), ''), 'hello');
		});

		test(`${skipText}${code} should not overconsume`, t => {
			if (skip) {
				t.pass();
				return;
			}

			for (const c of consumptionChars) {
				const string = ecode + c;
				t.regex(string, m());
				t.is(string.match(m())[0], ecode);
				t.is(string.replace(m(), ''), c);
			}
		});
	}
}
