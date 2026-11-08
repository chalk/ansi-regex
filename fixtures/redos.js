import ansiRegex from '../index.js';

const length = 1_000_000;
const digits = '1'.repeat(length);
const parameters = '1;2:'.repeat(length / 4);
const incompleteControlSequence = `\u{009B}${'1;2:'.repeat(128)}`;
const stringIntroducers = ['\u{001B}]', '\u{009D}', '\u{001B}P', '\u{0090}', '\u{001B}X', '\u{0098}', '\u{001B}^', '\u{009E}', '\u{001B}_', '\u{009F}', '\u{001B}k'];
const mixedIntroducers = stringIntroducers.join('');

const inputs = [
	digits,
	`\u{001B}[${'['.repeat(length)}!`,
	`\u{009B}${'?'.repeat(length)}!`,
	`\u{001B}[${';'.repeat(length)}!`,
	`\u{001B}[${parameters}!`,
	`\u{001B}[1${':'.repeat(length)}!`,
	`\u{001B}]${digits}`,
	`\u{001B}]${'\u{001B}]'.repeat(length / 2)}`,
	`\u{009D}${'\u{009D}'.repeat(length)}`,
	`\u{009D}${incompleteControlSequence.repeat(Math.ceil(length / incompleteControlSequence.length))}`,
	// The old CSI-like fallback exhausted the regex stack on a large unterminated parameter list.
	`\u{009B}${'1;2:'.repeat(length * 4)}`,
	`\u{001B}${'/'.repeat(length)}`,
	`\u{001B}P${'\\'.repeat(length)}\u{001B}`,
	`\u{001B}_${'\u{001B}/'.repeat(length / 2)}`,
	`\u{001B}P${'\u{001B}'.repeat(length)}\\`,
	mixedIntroducers.repeat(length / mixedIntroducers.length),
	`\u{001B}]P${'f'.repeat(length)}`,
	`\u{001B}]${'Pffffffg'.repeat(length / 8)}\u{0007}`,
	'\u{001B}]R'.repeat(length / 3),
	'\u{001B}]P0123456'.repeat(length / 10),
	'\u{001B}]P0abcdef\u{001B}\\'.repeat(length / 12),
	'\u{001B}]P0abcdef\u{0007}'.repeat(length / 11),
	'\u{001B}]P0abcdef\u{001B}'.repeat(length / 11),
];

for (const introducer of stringIntroducers) {
	inputs.push(
		`${introducer}${digits}\u{001B}\\`,
		`${introducer}${digits}`,
		`${introducer}${digits}\u{0018}${digits}\u{0007}`,
		`${introducer}${digits}\u{001A}${digits}\u{009C}`,
		introducer.repeat(length / introducer.length),
	);
}

for (const introducer of ['\u{001B}[', '\u{009B}']) {
	inputs.push(`${introducer}${digits}`, `${introducer}${' '.repeat(length)}`, `${introducer}${parameters}${'/'.repeat(length)}m`);

	for (const marker of ['<', '=', '>']) {
		for (const payload of [digits, parameters]) {
			inputs.push(`${introducer}${marker}${payload}!`, `${introducer}${marker}${payload}m`);
		}

		inputs.push(`${introducer}${marker}`.repeat(length / 4));
	}
}

for (const onlyFirst of [false, true]) {
	for (const input of inputs) {
		input.replace(ansiRegex({onlyFirst}), '');
	}
}
