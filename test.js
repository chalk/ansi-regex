import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import process from 'node:process';
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

// A sequence must be stripped whole or left alone. A partial strip is the worst outcome: it leaves the
// final byte behind as visible text, so `ESC [ 5 d` became a bare `d` rather than disappearing or staying put.
const ESCAPE = String.fromCodePoint(27);
const BEL = String.fromCodePoint(7);
const STRING_TERMINATOR = ESCAPE + String.fromCodePoint(92);

const partialStrips = [];

for (let finalByte = 0x40; finalByte <= 0x7E; finalByte++) {
	const sequence = `${ESCAPE}[5${String.fromCodePoint(finalByte)}`;
	const output = sequence.replaceAll(ansiRegex(), '');
	if (output !== '' && output !== sequence) {
		partialStrips.push(`0x${finalByte.toString(16)}: ${JSON.stringify(output)}`);
	}
}

test('never partially strips a sequence', () => {
	assert.deepEqual(partialStrips, []);
});

test('never partially strips a sequence with a private parameter marker', () => {
	// `= < >` are final bytes in the two byte VT52 escapes but parameter bytes in a CSI, so the device
	// attributes reply is the case where reading one as a final byte leaves the rest behind as text.
	for (const code of [`${ESCAPE}[>0;276;0c`, `${ESCAPE}[>0c`, `${ESCAPE}[>c`, `${ESCAPE}[<u`, `${ESCAPE}[=c`, `${String.fromCodePoint(0x9B)}>0;276;0c`]) {
		assert.equal((code + 'visible').replaceAll(ansiRegex(), ''), 'visible', JSON.stringify(code));
	}

	// The VT52 escapes the marker comes from are still matched on their own and do not overconsume.
	for (const code of [`${ESCAPE}<`, `${ESCAPE}=`, `${ESCAPE}>`]) {
		assert.deepEqual((code + 'visible').match(ansiRegex()), [code]);
	}
});

test('match private-parameter CSI sequences', () => {
	for (const introducer of ['\u{001B}[', '\u{009B}']) {
		for (const parameters of ['<35;59;1M', '>0;276;0c', '>c', '=5h', '>4;2m', '>1u', '<0c', '>0h']) {
			const sequence = introducer + parameters;
			const input = `before${sequence}after${sequence}`;
			assert.deepEqual(input.match(ansiRegex()), [sequence, sequence]);
			assert.equal(input.replace(ansiRegex(), ''), 'beforeafter');
			assert.equal(input.match(ansiRegex({onlyFirst: true}))[0], sequence);
			assert.equal(input.replace(ansiRegex({onlyFirst: true}), ''), `beforeafter${sequence}`);
		}
	}
});

test('preserves numeric text after bare ESC sequences', () => {
	const samples = [
		['\u{001B}[?1h\u{001B}=123 tests passed', '123 tests passed'],
		['\u{001B}[?1l\u{001B}>42 files', '42 files'],
		['\u{001B}<10 items', '10 items'],
	];

	for (const [input, expected] of samples) {
		assert.equal(input.replace(ansiRegex(), ''), expected);
	}
});

test('handles adversarial inputs without excessive backtracking', () => {
	// A subprocess timeout can interrupt a synchronous regex that blocks the event loop.
	const result = spawnSync(process.execPath, ['fixtures/redos.js'], {
		cwd: import.meta.dirname,
		timeout: 10_000,
		encoding: 'utf8',
	});
	assert.equal(result.status, 0, result.error?.message ?? result.stderr);
});

test('never partially strips a long parameter run', () => {
	const sequence = `${ESCAPE}[12345678m`;
	const output = sequence.replaceAll(ansiRegex(), '');
	assert.ok(output === '' || output === sequence, `partially stripped to ${JSON.stringify(output)}`);
});

test('strips a sequence it recognises', () => {
	assert.equal(`${ESCAPE}[31m`.replaceAll(ansiRegex(), ''), '');
	assert.equal(`${ESCAPE}[38;2;255;131;0m`.replaceAll(ansiRegex(), ''), '');
});

// A string with no escape sequence in it must survive stripping byte for byte.
test('leaves text without an escape sequence untouched', () => {
	const samples = [
		'',
		'plain text',
		'brackets [like] and (parens) and {braces}',
		'a#b?c;d:e',
		'camelCaseValue and kebab-case-value and snake_case_value',
		`emoji: ${String.fromCodePoint(0x1_F6_00)} and CJK: ${String.fromCodePoint(0x4E_2D)}${String.fromCodePoint(0x65_87)}`,
		'tabs\tand\nnewlines\rand separators',
		'0.5s 1.5h #42 100%',
	];

	for (const sample of samples) {
		assert.equal(sample.replaceAll(ansiRegex(), ''), sample, JSON.stringify(sample));
	}
});

// No code point is an escape sequence on its own, so every one of them must survive.
test('leaves every lone code point untouched', () => {
	const altered = [];

	for (let codePoint = 0; codePoint <= 0x10_FF_FF; codePoint++) {
		// Lone surrogates are not characters.
		if (codePoint >= 0xD8_00 && codePoint <= 0xDF_FF) {
			continue;
		}

		const character = String.fromCodePoint(codePoint);
		if (character.replaceAll(ansiRegex(), '') !== character) {
			altered.push(codePoint.toString(16));
		}
	}

	assert.deepEqual(altered, []);
});

// Whatever a sequence strips to must be stable under a second strip.
test('stripping is idempotent', () => {
	const sequences = [
		ESCAPE + '[31m',
		ESCAPE + '[38;2;255;131;0m',
		ESCAPE + '[38:5:196m',
		ESCAPE + '[2K',
		ESCAPE + '[A',
		ESCAPE + ']0;a title' + BEL,
		ESCAPE + ']8;;https://example.com' + STRING_TERMINATOR,
		ESCAPE + '[1;2;3;4;5H',
	];

	for (const sequence of sequences) {
		const once = sequence.replaceAll(ansiRegex(), '');
		assert.equal(once.replaceAll(ansiRegex(), ''), once, JSON.stringify(sequence));
	}
});

// Only the sequence itself may be removed, never the text around it.
test('preserves the text around a sequence', () => {
	assert.equal(('before' + ESCAPE + '[31mafter').replaceAll(ansiRegex(), ''), 'beforeafter');
	assert.equal(('a' + ESCAPE + '[1mb' + ESCAPE + '[0mc').replaceAll(ansiRegex(), ''), 'abc');
	assert.equal(('x' + ESCAPE + ']0;t' + BEL + 'y').replaceAll(ansiRegex(), ''), 'xy');
});
