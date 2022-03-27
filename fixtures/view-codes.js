/* eslint-disable guard-for-in */
'use strict';
const ansiRegex = require('..');
const ansiCodes = require('./ansi-codes');

const allCodes = {};
const supported = [];
const unsupported = [];

function addCodesToTest(codes) {
	for (const code in codes) {
		allCodes[code] = codes[code];
	}
}

function identifySupportedCodes() {
	let codeSupport = {};

	for (const code in allCodes) {
		codeSupport = {
			code,
			matches: `\u001B${code}`.match(ansiRegex()),
			description: allCodes[code][0]
		};

		if (codeSupport.matches !== null && codeSupport.matches[0] === `\u001B${code}`) {
			supported.push(codeSupport);
		} else {
			unsupported.push(codeSupport);
		}
	}
}

function displaySupport() {
	process.stdout.write('\u001B[32m');

	console.log('SUPPORTED');
	for (const el of supported) {
		console.log(el);
	}

	process.stdout.write('\u001B[31m');
	console.log('UNSUPPORTED');

	for (const el of unsupported) {
		console.log(el);
	}

	process.stdout.write('\u001B[0m');
}

addCodesToTest(ansiCodes.vt52Codes);
addCodesToTest(ansiCodes.ansiCompatible);
addCodesToTest(ansiCodes.commonCodes);
addCodesToTest(ansiCodes.otherCodes);

identifySupportedCodes();
displaySupport();
