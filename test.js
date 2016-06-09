import test from 'ava';
import ansiCodes from './fixtures/ansi-codes';
import m from './';

const consumptionChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+1234567890-=[]{};\':"./>?,<\\|';

// testing against codes found at: http://ascii-table.com/ansi-escape-sequences-vt-100.php
test('match ansi code in a string', t => {
	t.true(m().test('foo\u001b[4mcake\u001b[0m'));
	t.true(m().test('\u001b[4mcake\u001b[0m'));
	t.true(m().test('foo\u001b[4mcake\u001b[0m'));
	t.true(m().test('\u001b[0m\u001b[4m\u001b[42m\u001b[31mfoo\u001b[39m\u001b[49m\u001b[24mfoo\u001b[0m'));
	t.true(m().test('foo\u001b[mfoo'));
});

test('match ansi code from ls command', t => {
	t.true(m().test('\u001b[00;38;5;244m\u001b[m\u001b[00;38;5;33mfoo\u001b[0m'));
});

test('match reset;setfg;setbg;italics;strike;underline sequence in a string', t => {
	t.true(m().test('\u001b[0;33;49;3;9;4mbar\u001b[0m'));
	t.is('foo\u001b[0;33;49;3;9;4mbar'.match(m())[0], '\u001b[0;33;49;3;9;4m');
});

test('match clear tabs sequence in a string', t => {
	t.true(m().test('foo\u001b[0gbar'));
	t.is('foo\u001b[0gbar'.match(m())[0], '\u001b[0g');
});

test('match clear line from cursor right in a string', t => {
	t.true(m().test('foo\u001b[Kbar'));
	t.is('foo\u001b[Kbar'.match(m())[0], '\u001b[K');
});

test('match clear screen in a string', t => {
	t.true(m().test('foo\u001b[2Jbar'));
	t.is('foo\u001b[2Jbar'.match(m())[0], '\u001b[2J');
});

// testing against extended codes (excluding codes ending in 0-9)
for (const codeSet in ansiCodes) {
	for (var code in ansiCodes[codeSet]) {
		const codeInfo = ansiCodes[codeSet][code];
		const skip = /[0-9]$/.test(code);
		const skipText = skip ? '[SKIP] ' : '';
		const ecode = '\u001b' + code;

		test(skipText + code + ' -> ' + codeInfo[0], t => {
			if (skip) {
				return;
			}

			const string = 'hel' + ecode + 'lo';

			t.true(m().test(string));
			t.is(string.match(m())[0], ecode);
			t.is(string.replace(m(), ''), 'hello');
		});

		test(skipText + code + ' should not overconsume', t => {
			if (skip) {
				return;
			}

			for (var i = 0; i < consumptionChars.length; i++) {
				const c = consumptionChars[i];
				const string = ecode + c;

				t.true(m().test(string));
				t.is(string.match(m())[0], ecode);
				t.is(string.replace(m(), ''), c);
			}
		});
	}
}
