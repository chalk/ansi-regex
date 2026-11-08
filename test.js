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

test('match CSI sequences with intermediate bytes', () => {
	for (const introducer of ['\u{001B}[', '\u{009B}']) {
		for (const body of ['2 q', '!p', '0"q', '?25$p']) {
			const sequence = introducer + body;
			const input = `before${sequence}after${sequence}`;
			assert.deepEqual(input.match(ansiRegex()), [sequence, sequence]);
			assert.equal(input.replace(ansiRegex(), ''), 'beforeafter');
			assert.equal(input.replace(ansiRegex({onlyFirst: true}), ''), `beforeafter${sequence}`);
		}
	}
});

test('match CSI erase, repeat, and positioning sequences', () => {
	for (const introducer of ['\u{001B}[', '\u{009B}']) {
		for (const finalByte of ['X', 'b', 'd', '`', 'a', 'e']) {
			for (const parameters of ['', '5']) {
				const sequence = introducer + parameters + finalByte;
				assert.deepEqual(`before${sequence}after`.match(ansiRegex()), [sequence]);
				assert.equal(`before${sequence}after`.replace(ansiRegex(), ''), 'beforeafter');
			}
		}
	}
});

test('CSI support does not widen bare ESC matching or strip incomplete sequences', () => {
	for (const body of ['X', 'b', 'd', '`', 'a', 'e', '[', '[2 ', '[!']) {
		const input = `\u{001B}${body}`;
		assert.equal(input.match(ansiRegex()), null);
	}
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

// Testing against extended codes
for (const [codeSetKey, codeSetValue] of Object.entries(ansiCodes)) {
	for (const [code, codeInfo] of codeSetValue) {
		const ecode = `\u{001B}${code}`;

		test(`${codeSetKey} - ${code} → ${codeInfo[0]}`, () => {
			const string = `hel${ecode}lo`;
			assert.match(string, ansiRegex());
			assert.equal(string.match(ansiRegex())[0], ecode);
			assert.equal(string.replace(ansiRegex(), ''), 'hello');
		});

		test(`${codeSetKey} - ${code} should not overconsume`, () => {
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

// `ESC 7` and `ESC ( 0` end in a digit, which is never a CSI final byte, so they need their own form. They must also not be read as a CSI with the digit as a parameter, which ate the next letter: `hel ESC 7 lo` stripped to `helo`.
test('strips an escape whose final byte is a digit', () => {
	for (const code of [`${ESCAPE}7`, `${ESCAPE}8`, `${ESCAPE}(0`, `${ESCAPE})0`, `${ESCAPE}#8`]) {
		assert.equal(`hel${code}lo`.replaceAll(ansiRegex(), ''), 'hello', JSON.stringify(code));
		assert.equal(`${code}${ESCAPE}[31mX`.replaceAll(ansiRegex(), ''), 'X', JSON.stringify(code));
		assert.equal(`a${code} b`.replaceAll(ansiRegex(), ''), 'a b', JSON.stringify(code));
	}
});

// Character-set and encoding selections used by xterm and the Linux console.
const characterSetSequences = new Map([
	['UTF-8 encoding', '%G'],
	['default encoding', '%@'],
	['G2 ASCII character set', '*B'],
	['G3 ASCII character set', '+B'],
	['G1 Latin-1 character set', '-A'],
	['G2 Latin-1 character set', '.A'],
	['G3 Latin-1 character set', '/A'],
	['multibyte character set', '$B'],
	['extended character set', '(%5'],
	['seven-bit controls', ' F'],
	['eight-bit controls', ' G'],
	['G3 locking shift', 'o'],
	['G2 right locking shift', '}'],
	['G3 right locking shift', '|'],
]);

for (const [name, body] of characterSetSequences) {
	test(`match ${name}`, () => {
		const sequence = ESCAPE + body;
		for (const character of consumptionCharacters) {
			assert.deepEqual(`${sequence}${character}`.match(ansiRegex()), [sequence]);
			assert.equal(`before${sequence}${character}`.replace(ansiRegex(), ''), `before${character}`);
		}
	});
}

// Vim uses DECRQSS and XTGETTCAP; sixel and Kitty graphics use the same opaque string envelopes.
const controlStringBodies = new Map([
	['DCS cursor-style query', ['P', '\u{0090}', '$q q']],
	['DCS rendition query', ['P', '\u{0090}', '$qm']],
	['DCS terminfo query', ['P', '\u{0090}', '+q544e;436f']],
	['DCS status reply', ['P', '\u{0090}', '1$r0m']],
	['DCS sixel image', ['P', '\u{0090}', '0;0q"1;1;1;1#0;2;0;0;0~']],
	['APC Kitty image', ['_', '\u{009F}', 'Gf=24,s=1,v=1;AAAA']],
	['APC Kitty image deletion', ['_', '\u{009F}', 'Ga=d']],
	['APC Kitty reply', ['_', '\u{009F}', 'Gi=31;OK']],
	['privacy message', ['^', '\u{009E}', 'private message']],
	['start of string', ['X', '\u{0098}', 'opaque data']],
	['screen window title', ['k', undefined, 'build window']],
]);

for (const [name, [escapeIntroducer, c1Introducer, body]] of controlStringBodies) {
	test(`match ${name}`, () => {
		const introducers = c1Introducer ? [ESCAPE + escapeIntroducer, c1Introducer] : [ESCAPE + escapeIntroducer];

		for (const introducer of introducers) {
			for (const terminator of [STRING_TERMINATOR, '\u{009C}']) {
				const sequence = introducer + body + terminator;
				const input = `before${sequence}after${sequence}`;
				assert.deepEqual(input.match(ansiRegex()), [sequence, sequence]);
				assert.equal(input.replace(ansiRegex(), ''), 'beforeafter');
				assert.equal(input.replace(ansiRegex({onlyFirst: true}), ''), `beforeafter${sequence}`);
			}
		}
	});
}

test('match Linux console palette controls without a string terminator', () => {
	for (const body of [']R', ']P1ff8040', ']PAbBcCdD']) {
		const sequence = ESCAPE + body;
		assert.deepEqual(`${sequence}visible`.match(ansiRegex()), [sequence]);
		assert.equal(`${sequence}visible`.replace(ansiRegex(), ''), 'visible');
	}
});

test('cancelled OSC strings do not swallow visible text', () => {
	for (const cancellation of ['\u{0018}', '\u{001A}']) {
		for (const introducer of [`${ESCAPE}]`, '\u{009D}']) {
			const input = `${introducer}0;aborted${cancellation}visible${BEL}${ESCAPE}[31mred`;
			assert.deepEqual(input.match(ansiRegex()), [`${ESCAPE}[31m`]);
			assert.equal(input.replace(ansiRegex(), ''), `${introducer}0;aborted${cancellation}visible${BEL}red`);
		}
	}
});

const terminalProtocols = new Map([
	['bracketed paste start', '[200~'],
	['bracketed paste end', '[201~'],
	['focus gained', '[I'],
	['focus lost', '[O'],
	['SGR mouse press', '[<0;12;5M'],
	['SGR mouse release', '[<0;12;5m'],
	['Kitty keyboard subparameters', '[97;5:2;97:65u'],
	['private mode status request', '[?2026$p'],
	['rectangular attribute change', '[1;2;3;4;0$r'],
	['xterm color stack', '[#P'],
	['working directory', ']7;file://host/home/user\u{0007}'],
	['clipboard', ']52;c;aGVsbG8=\u{0007}'],
	['shell prompt marker', ']133;A\u{0007}'],
	['VS Code command marker', ']633;E;echo hello;nonce\u{0007}'],
	['iTerm inline image', ']1337;File=name=aW1hZ2U=;inline=1:AAAA\u{0007}'],
	['Windows Terminal progress', ']9;4;1;50\u{0007}'],
	['color palette', ']4;0;rgb:00/11/22;1;rgb:ff/ee/dd\u{0007}'],
	['foreground color query', ']10;?\u{0007}'],
]);

for (const [name, body] of terminalProtocols) {
	test(`match terminal protocol: ${name}`, () => {
		const sequence = ESCAPE + body;
		assert.deepEqual(`before${sequence}after`.match(ansiRegex()), [sequence]);
		assert.equal(`before${sequence}after`.replace(ansiRegex(), ''), 'beforeafter');
	});
}

test('match every CSI final and intermediate byte without consuming adjacent text', () => {
	for (const introducer of [`${ESCAPE}[`, '\u{009B}']) {
		for (let intermediateByte = 0x1F; intermediateByte <= 0x2F; intermediateByte++) {
			const intermediate = intermediateByte === 0x1F ? '' : String.fromCodePoint(intermediateByte);
			const sequences = [];
			for (let finalByte = 0x40; finalByte <= 0x7E; finalByte++) {
				sequences.push(`${introducer}?123;456${intermediate}${String.fromCodePoint(finalByte)}`);
			}

			const input = sequences.join('🌈');
			assert.deepEqual(input.match(ansiRegex()), sequences);
			assert.equal(input.replace(ansiRegex(), ''), '🌈'.repeat(sequences.length - 1));
		}
	}
});

test('match omitted, long, and multiple-intermediate CSI parameters', () => {
	for (const body of [';m', ';;;;m', '65535;65535H', '12345678901234567890m', '?1;2 $p']) {
		for (const introducer of [`${ESCAPE}[`, '\u{009B}']) {
			const sequence = introducer + body;
			assert.deepEqual(`${sequence}text`.match(ansiRegex()), [sequence]);
			assert.equal(`${sequence}text`.replace(ansiRegex(), ''), 'text');
		}
	}
});

test('preserve truncated CSI parameters and intermediates', () => {
	for (const body of ['', '?', '>', '123', '38:2::', '2 ', '?25$', '1;2 $']) {
		for (const introducer of [`${ESCAPE}[`, '\u{009B}']) {
			const sequence = introducer + body;
			assert.equal(sequence.replace(ansiRegex(), ''), sequence);
		}
	}
});

test('a BEL inside an ST-terminated control string is part of the payload', () => {
	for (const introducer of [`${ESCAPE}P`, `${ESCAPE}_`, '\u{0090}', '\u{009F}']) {
		const sequence = `${introducer}payload${BEL}more payload${STRING_TERMINATOR}`;
		assert.deepEqual(`${sequence}visible`.match(ansiRegex()), [sequence]);
		assert.equal(`${sequence}visible`.replace(ansiRegex(), ''), 'visible');
	}
});

test('control strings end at the first terminator', () => {
	for (const introducer of [`${ESCAPE}]`, `${ESCAPE}P`, `${ESCAPE}_`, `${ESCAPE}k`, '\u{0090}', '\u{009D}', '\u{009F}']) {
		for (const terminator of [STRING_TERMINATOR, '\u{009C}']) {
			const sequence = `${introducer}payload${terminator}`;
			assert.deepEqual(`${sequence}visible${terminator}`.match(ansiRegex()), [sequence]);
			assert.equal(`${sequence}visible${terminator}`.replace(ansiRegex(), ''), `visible${terminator}`);
		}
	}
});

test('an unterminated C1 control string cannot consume a later control string', () => {
	const introducers = ['\u{0090}', '\u{0098}', '\u{009D}', '\u{009E}', '\u{009F}'];
	for (const first of introducers) {
		for (const second of introducers) {
			const incomplete = `${first}unterminated text `;
			const complete = `${second}payload${STRING_TERMINATOR}`;
			const input = `${incomplete}${complete}visible`;
			assert.deepEqual(input.match(ansiRegex()), [complete]);
			assert.equal(input.replace(ansiRegex(), ''), `${incomplete}visible`);
		}
	}
});

test('cancelled C1 control strings preserve subsequent text and sequences', () => {
	for (const introducer of ['\u{0090}', '\u{0098}', '\u{009E}', '\u{009F}']) {
		for (const cancellation of ['\u{0018}', '\u{001A}']) {
			const prefix = `${introducer}aborted${cancellation}visible${STRING_TERMINATOR}`;
			const input = `${prefix}${ESCAPE}[31mred`;
			assert.deepEqual(input.match(ansiRegex()), [`${ESCAPE}[31m`]);
			assert.equal(input.replace(ansiRegex(), ''), `${prefix}red`);
		}
	}
});

test('a C1 CSI interrupts an OSC or ST-terminated control string', () => {
	for (const introducer of [`${ESCAPE}]`, '\u{0090}', '\u{0098}', '\u{009D}', '\u{009E}', '\u{009F}']) {
		for (const terminator of [STRING_TERMINATOR, '\u{009C}']) {
			const incomplete = `${introducer}0;unfinished `;
			const sequence = '\u{009B}31m';
			const input = `${incomplete}${sequence}visible${terminator}`;
			assert.deepEqual(input.match(ansiRegex()), [sequence]);
			assert.equal(input.replace(ansiRegex(), ''), `${incomplete}visible${terminator}`);
		}
	}
});

test('a standalone C1 control interrupts an OSC without deleting subsequent text', () => {
	const introducersAndTerminator = new Set([0x90, 0x98, 0x9B, 0x9C, 0x9D, 0x9E, 0x9F]);
	for (let codePoint = 0x80; codePoint <= 0x9F; codePoint++) {
		if (introducersAndTerminator.has(codePoint)) {
			continue;
		}

		const control = String.fromCodePoint(codePoint);
		for (const introducer of [`${ESCAPE}]`, '\u{009D}']) {
			const input = `${introducer}0;unfinished${control}visible${BEL}`;
			assert.equal(input.replace(ansiRegex(), ''), input);
		}
	}
});

test('an unexpected ESC ends a control string before the next sequence', () => {
	for (const introducer of [`${ESCAPE}P`, `${ESCAPE}_`, '\u{0090}', '\u{009F}']) {
		const input = `${introducer}aborted text ${ESCAPE}[31mvisible${STRING_TERMINATOR}`;
		const output = input.replace(ansiRegex(), '');
		assert.ok(output.includes('aborted text '));
		assert.ok(output.endsWith(`visible${STRING_TERMINATOR}`));
	}
});

test('Linux palette controls do not consume text before a later BEL', () => {
	for (const body of [']R', ']P0abcdef']) {
		assert.equal(`${ESCAPE}${body}visible${BEL}`.replace(ansiRegex(), ''), `visible${BEL}`);
	}
});

test('match terminated iTerm palette commands as a whole', () => {
	for (const introducer of [`${ESCAPE}]`, '\u{009D}']) {
		for (const color of ['0', 'f', 'g', 'm']) {
			for (const terminator of [BEL, STRING_TERMINATOR, '\u{009C}']) {
				const sequence = `${introducer}P${color}aabbcc${terminator}`;
				assert.deepEqual(`before${sequence}after`.match(ansiRegex()), [sequence]);
				assert.equal(`before${sequence}after`.replace(ansiRegex(), ''), 'beforeafter');
				assert.equal(`${sequence}after${sequence}`.replace(ansiRegex({onlyFirst: true}), ''), `after${sequence}`);
			}
		}
	}
});

test('palette matching preserves subsequent hexadecimal text', () => {
	for (const terminator of ['', BEL, STRING_TERMINATOR, '\u{009C}']) {
		const sequence = `${ESCAPE}]P0abcdef${terminator}`;
		assert.deepEqual(`${sequence}deadbeef`.match(ansiRegex()), [sequence]);
		assert.equal(`${sequence}deadbeef`.replace(ansiRegex(), ''), 'deadbeef');
	}
});

test('palette terminators do not consume adjacent control sequences', () => {
	for (const terminator of ['', BEL, STRING_TERMINATOR, '\u{009C}']) {
		const palette = `${ESCAPE}]P1abcdef${terminator}`;
		const title = `${ESCAPE}]0;new title${BEL}`;
		assert.deepEqual(`${palette}${title}visible`.match(ansiRegex()), [palette, title]);
		assert.equal(`${palette}${title}visible`.replace(ansiRegex(), ''), 'visible');
	}
});

test('literal representations of escape sequences remain untouched', () => {
	for (const input of [String.raw`\x1b[31mred`, String.raw`\u001B[31mred`, '^[[31mred', '[31mred', String.raw`\e_Ga=d\e\\`]) {
		assert.equal(input.replace(ansiRegex(), ''), input);
	}
});

test('single-shift escapes preserve the following character', () => {
	for (const body of ['N', 'O']) {
		assert.equal(`${ESCAPE}${body}A`.replace(ansiRegex(), ''), 'A');
		assert.equal(`${ESCAPE}${body}🌈`.replace(ansiRegex(), ''), '🌈');
	}
});

test('each regex has independent lastIndex state', () => {
	const first = ansiRegex();
	const input = `${ESCAPE}[31mred${ESCAPE}[0m`;
	assert.equal(first.exec(input)[0], `${ESCAPE}[31m`);
	const second = ansiRegex();
	assert.notEqual(first, second);
	assert.equal(second.lastIndex, 0);
	assert.equal(second.exec(input)[0], `${ESCAPE}[31m`);
	assert.equal(first.exec(input)[0], `${ESCAPE}[0m`);
	assert.equal(ansiRegex({onlyFirst: true}).global, false);
});

test('matchAll exposes exact sequence offsets without capturing groups', () => {
	const first = `${ESCAPE}[31m`;
	const second = `${ESCAPE}]8;;https://example.com${BEL}`;
	const matches = `A${first}B${second}C`.matchAll(ansiRegex()).toArray();
	assert.deepEqual(matches.map(match => match[0]), [first, second]);
	assert.deepEqual(matches.map(match => match.index), [1, first.length + 2]);
	assert.deepEqual(matches.map(match => match.length), [1, 1]);
});

const terminalTranscripts = new Map([
	['shell prompt', [`${ESCAPE}]133;A${BEL}${ESCAPE}[32muser@host${ESCAPE}[0m $ ${ESCAPE}]133;B${BEL}ls\r\n${ESCAPE}]133;C${BEL}file\r\n${ESCAPE}]133;D;0${BEL}`, 'user@host $ ls\r\nfile\r\n']],
	['editor startup and shutdown', [`${ESCAPE}[?1049h${ESCAPE}=${ESCAPE}(B${ESCAPE}P$q q${STRING_TERMINATOR}${ESCAPE}[2 qfile.txt${ESCAPE}[?1049l${ESCAPE}>`, 'file.txt']],
	['ConPTY erase and positioning', [`hello${ESCAPE}[5X${ESCAPE}[3dworld${ESCAPE}[2b!`, 'helloworld!']],
	['colored Unicode hyperlink', [`${ESCAPE}[34m${ESCAPE}]8;;https://example.com/日本語${STRING_TERMINATOR}日本語 🌈 e\u{0301}${ESCAPE}]8;;${BEL}${ESCAPE}[0m`, '日本語 🌈 e\u{0301}']],
	['chunked Kitty image upload', [`before${ESCAPE}_Gf=24,s=1,v=1,m=1;AAAA${STRING_TERMINATOR}${ESCAPE}_Gm=0;BBBB${STRING_TERMINATOR}after`, 'beforeafter']],
	['sixel mixed with clipboard and text', [`${ESCAPE}]52;c;aGVsbG8=${BEL}hello${ESCAPE}P0;0q"1;1;1;1#0;2;0;0;0~${STRING_TERMINATOR}\nworld`, 'hello\nworld']],
	['Unicode window titles and encoding selections', [`${ESCAPE}%G${ESCAPE}]2;日本語 🌈${BEL}${ESCAPE}kbuild 🌈${STRING_TERMINATOR}visible${ESCAPE}%@`, 'visible']],
	['Linux palette reset and standalone controls', [`${ESCAPE}c${ESCAPE}]R${ESCAPE}]P0aabbccready\t${BEL}\r\n`, 'ready\t\u{0007}\r\n']],
]);

for (const [name, [input, expected]] of terminalTranscripts) {
	test(`preserve visible text in ${name}`, () => {
		assert.equal(input.replace(ansiRegex(), ''), expected);
	});
}

test('non-ASCII and DEL characters cannot complete CSI or ESC intermediate sequences', () => {
	for (const character of ['\u{007F}', 'é', '中', '🌈']) {
		for (const prefix of [`${ESCAPE}[12`, '\u{009B}12', `${ESCAPE}%`]) {
			const input = `${prefix}${character}visible`;
			assert.equal(input.replace(ansiRegex(), ''), input);
		}
	}
});

test('match every ESC intermediate and final byte without consuming adjacent text', () => {
	for (let intermediateByte = 0x20; intermediateByte <= 0x2F; intermediateByte++) {
		for (let finalByte = 0x30; finalByte <= 0x7E; finalByte++) {
			const sequence = ESCAPE + String.fromCodePoint(intermediateByte, finalByte);
			assert.deepEqual(`before${sequence}after`.match(ansiRegex()), [sequence]);
			assert.equal(`before${sequence}after`.replace(ansiRegex(), ''), 'beforeafter');
		}
	}
});

test('every CSI parameter byte remains incomplete without a final byte', () => {
	for (const introducer of [`${ESCAPE}[`, '\u{009B}']) {
		for (let parameterByte = 0x30; parameterByte <= 0x3F; parameterByte++) {
			const sequence = introducer + String.fromCodePoint(parameterByte);
			assert.equal(sequence.replace(ansiRegex(), ''), sequence);
		}
	}
});

test('adjacent control-string families remain separate matches', () => {
	const introducers = [`${ESCAPE}]`, `${ESCAPE}P`, `${ESCAPE}X`, `${ESCAPE}^`, `${ESCAPE}_`, `${ESCAPE}k`, '\u{0090}', '\u{0098}', '\u{009D}', '\u{009E}', '\u{009F}'];
	for (const firstIntroducer of introducers) {
		for (const secondIntroducer of introducers) {
			const first = `${firstIntroducer}first${STRING_TERMINATOR}`;
			const second = `${secondIntroducer}second\u{009C}`;
			const input = `before${first}between${second}after`;
			assert.deepEqual(input.match(ansiRegex()), [first, second]);
			assert.equal(input.replace(ansiRegex(), ''), 'beforebetweenafter');
			assert.equal(input.replace(ansiRegex({onlyFirst: true}), ''), `beforebetween${second}after`);
		}
	}
});

const additionalAnsiEscapes = new Map([
	['inline image', ansiEscapes.image(Uint8Array.of(0x89, 0x50, 0x4E, 0x47))],
	['resized inline image', ansiEscapes.image(Uint8Array.of(0x89, 0x50, 0x4E, 0x47), {width: '50%', height: 2, preserveAspectRatio: false})],
	['visible annotation', ansiEscapes.iTerm.annotation('build finished', {length: 14})],
	['positioned hidden annotation', ansiEscapes.iTerm.annotation('build finished', {
		length: 14,
		x: 2,
		y: 3,
		isHidden: true,
	})],
]);

for (const [name, sequence] of additionalAnsiEscapes) {
	test(`ansi-escapes ${name}`, () => {
		assert.deepEqual(`before${sequence}after`.match(ansiRegex()), [sequence]);
		assert.equal(`before${sequence}after`.replace(ansiRegex(), ''), 'beforeafter');
	});
}

test('strip mixed semicolon and colon colors from copied iTerm output', () => {
	// https://github.com/chalk/ansi-regex/issues/50
	const input = [
		'\u{001B}[0;101minterface\u{001B}[0m \u{001B}[0;104;1mTextPaneProps\u{001B}[0m \u{001B}[46;1;104;0m{\u{001B}[0m',
		'  \u{001B}[0;104;1mlabel\u{001B}[0m: \u{001B}[0;38:5:121mstring\u{001B}[0;101m;\u{001B}[0m',
		'\u{001B}[46;1;104;0m}',
	].join('\n');
	assert.equal(input.replace(ansiRegex(), ''), 'interface TextPaneProps {\n  label: string;\n}');
});

test('mixed generated protocol streams preserve every visible fragment', () => {
	const sequences = [
		`${ESCAPE}[0;38:2::12:34:56m`,
		'\u{009B}?25l',
		`${ESCAPE}7`,
		`${ESCAPE}8`,
		`${ESCAPE}(B`,
		`${ESCAPE}%G`,
		`${ESCAPE}]8;;https://example.com/?a=1&b=2${BEL}`,
		'\u{009D}7;file://host/home/user\u{009C}',
		`${ESCAPE}P$q q${STRING_TERMINATOR}`,
		'\u{0090}+q544e;436f\u{009C}',
		`${ESCAPE}_Gf=24,s=1,v=1;AAAA${STRING_TERMINATOR}`,
		'\u{009F}Ga=d\u{009C}',
		`${ESCAPE}Xopaque string${STRING_TERMINATOR}`,
		'\u{009E}private message\u{009C}',
		`${ESCAPE}kbuild window${STRING_TERMINATOR}`,
		`${ESCAPE}]P0abcdef`,
		`${ESCAPE}]P1abcdef${STRING_TERMINATOR}`,
	];
	const fragments = ['', 'plain text', ' ', '\t', '\r\n', '[31m;1:2]', String.raw`C:\tmp\file.txt`, '日本語 🌈', 'e\u{0301}', '.*+?^$(){}[]|'];
	let seed = 42;
	const choose = items => {
		seed = (seed * 48_271) % 2_147_483_647;
		return items[seed % items.length];
	};

	for (let sample = 0; sample < 256; sample++) {
		const prefix = choose(fragments);
		let input = prefix;
		let expectedText = prefix;
		const expectedSequences = [];
		for (let position = 0; position < 32; position++) {
			const sequence = choose(sequences);
			const fragment = choose(fragments);
			input += sequence + fragment;
			expectedText += fragment;
			expectedSequences.push(sequence);
		}

		assert.deepEqual(input.match(ansiRegex()), expectedSequences, `sample ${sample}`);
		assert.equal(input.replace(ansiRegex(), ''), expectedText, `sample ${sample}`);
		assert.equal(input.replace(ansiRegex({onlyFirst: true}), ''), prefix + input.slice(prefix.length + expectedSequences[0].length), `sample ${sample}`);
	}
});
