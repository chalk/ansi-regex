import ansiRegex from '../index.js';

const length = 1_000_000;
const digits = '1'.repeat(length);
const parameters = '1;2:'.repeat(length / 4);

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
];

for (const introducer of ['\u{001B}[', '\u{009B}']) {
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
