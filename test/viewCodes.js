'use strict';
var ansiRegex = require('../');
var ansiCodes = require('./ansiCodes');
var allCodes = {};
var supported = [];
var unsupported = [];

function addCodesToTest(codes) {
	for (var code in codes){
		allCodes[code] = codes[code];
	}
}

function identifySupportedCodes() {
	var codeSupport = {};

	for (var code in allCodes) {
		codeSupport = {
			code : code,
			matches: ('\u001b'+code).match( ansiRegex() ),
			description: allCodes[code][0],
			// neighbourDelimitWorks: ('\u001b'+code+'a209ZELLO').match(ansiRegex({vt100: true}))[0] === ('\u001b'+code).match(ansiRegex({vt100: true}))[0],
		};

		if (codeSupport.matches !== null && codeSupport.matches[0] === '\u001b' + code) {
			supported.push(codeSupport);
		} else {
			unsupported.push(codeSupport);
		}

	}
}

function displaySupport() {
	process.stdout.write('\u001b[32m');

	console.log('SUPPORTED');
	for (var i = 0; i < supported.length; i++) {
		console.log(supported[i]);
	}

	process.stdout.write('\u001b[31m');
	console.log('UNSUPPORTED');

	for (var i = 0; i < unsupported.length; i++) {
		console.log(unsupported[i]);
	}

	process.stdout.write('\u001b[0m');
}

addCodesToTest(ansiCodes.vt52Codes);
addCodesToTest(ansiCodes.ansiCompatible);
addCodesToTest(ansiCodes.commonCodes);
addCodesToTest(ansiCodes.otherCodes);

identifySupportedCodes();
displaySupport();
