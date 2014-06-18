'use strict';

// testing against codes found at: http://ascii-table.com/ansi-escape-sequences-vt-100.php

var assert = require('assert');
var ansiRegex = require('../');

var supportedCodes = {

  "[176A": ["Move cursor up n lines", "CUU"],
  "[176B": ["Move cursor down n lines", "CUD"],
  "[176C": ["Move cursor right n lines", "CUF"],
  "[176D": ["Move cursor left n lines", "CUB"],
  "[176;176H": ["Move cursor to screen location v,h", "CUP"],
  "[176;176f": ["Move cursor to screen location v,h", "CUP"],

  "[?1;1760c": ["Response: terminal type code n", "DA"],

  "[20h": ["Set new line mode", "LMN"],
  "[?1h": ["Set cursor key to application", "DECCKM"],
  "[?3h": ["Set number of columns to 132", "DECCOLM"],
  "[?4h": ["Set smooth scrolling", "DECSCLM"],
  "[?5h": ["Set reverse video on screen", "DECSCNM"],
  "[?6h": ["Set origin to relative", "DECOM"],
  "[?7h": ["Set auto-wrap mode", "DECAWM"],
  "[?8h": ["Set auto-repeat mode", "DECARM"],
  "[?9h": ["Set interlacing mode", "DECINLM"],
  "[20l": ["Set line feed mode", "LMN"],
  "[?1l": ["Set cursor key to cursor", "DECCKM"],
  "[?2l": ["Set VT52 (versus ANSI)", "DECANM"],
  "[?3l": ["Set number of columns to 80", "DECCOLM"],
  "[?4l": ["Set jump scrolling", "DECSCLM"],
  "[?5l": ["Set normal video on screen", "DECSCNM"],
  "[?6l": ["Set origin to absolute", "DECOM"],
  "[?7l": ["Reset auto-wrap mode", "DECAWM"],
  "[?8l": ["Reset auto-repeat mode", "DECARM"],
  "[?9l": ["Reset interlacing mode", "DECINLM"],

  "N": ["Set single shift 2", "SS2"],
  "O": ["Set single shift 3", "SS3"],

  "[m": ["Turn off character attributes", "SGR0"],
  "[0m": ["Turn off character attributes", "SGR0"],
  "[1m": ["Turn bold mode on", "SGR1"],
  "[2m": ["Turn low intensity mode on", "SGR2"],
  "[4m": ["Turn underline mode on", "SGR4"],
  "[5m": ["Turn blinking mode on", "SGR5"],
  "[7m": ["Turn reverse video on", "SGR7"],
  "[8m": ["Turn invisible text mode on", "SGR8"],

  "[9m": ["strikethrough on", "--"],
  "[22m": ["bold off (see below)", "--"],
  "[23m": ["italics off", "--"],
  "[24m": ["underline off", "--"],
  "[27m": ["inverse off", "--"],
  "[29m": ["strikethrough off", "--"],
  "[30m": ["set foreground color to black", "--"],
  "[31m": ["set foreground color to red", "--"],
  "[32m": ["set foreground color to green", "--"],
  "[33m": ["set foreground color to yellow", "--"],
  "[34m": ["set foreground color to blue", "--"],
  "[35m": ["set foreground color to magenta (purple)", "--"],
  "[36m": ["set foreground color to cyan", "--"],
  "[37m": ["set foreground color to white", "--"],
  "[39m": ["set foreground color to default (white)", "--"],
  "[40m": ["set background color to black", "--"],
  "[41m": ["set background color to red", "--"],
  "[42m": ["set background color to green", "--"],
  "[43m": ["set background color to yellow", "--"],
  "[44m": ["set background color to blue", "--"],
  "[45m": ["set background color to magenta (purple)", "--"],
  "[46m": ["set background color to cyan", "--"],
  "[47m": ["set background color to white", "--"],
  "[49m": ["set background color to default (black)", "--"],

  "[H": ["Move cursor to upper left corner", "cursorhome"],
  "[;H": ["Move cursor to upper left corner", "cursorhome"],
  "[f": ["Move cursor to upper left corner", "hvhome"],
  "[;f": ["Move cursor to upper left corner", "hvhome"],
  "D": ["Move/scroll window up one line", "IND"],
  "M": ["Move/scroll window down one line", "RI"],
  "E": ["Move to next line", "NEL"],

  "H": ["Set a tab at the current column", "HTS"],
  "[g": ["Clear a tab at the current column", "TBC"],
  "[0g": ["Clear a tab at the current column", "TBC"],
  "[3g": ["Clear all tabs", "TBC"],

  "[K": ["Clear line from cursor right", "EL0"],
  "[0K": ["Clear line from cursor right", "EL0"],
  "[1K": ["Clear line from cursor left", "EL1"],
  "[2K": ["Clear entire line", "EL2"],
  "[J": ["Clear screen from cursor down", "ED0"],
  "[0J": ["Clear screen from cursor down", "ED0"],
  "[1J": ["Clear screen from cursor up", "ED1"],
  "[2J": ["Clear entire screen", "ED2"],

  "[c": ["Identify what terminal type", "DA"],
  "[0c": ["Identify what terminal type (another)", "DA"],
  "c": ["Reset terminal to initial state", "RIS"],
  "[2;1y": [ "Confidence power up test", "DECTST"],
  "[2;2y": [ "Confidence loopback test", "DECTST"],
  "[2;9y": [ "Repeat power up test", "DECTST"],
  "[2;10y": [ "Repeat loopback test", "DECTST"],
  "[0q": ["Turn off all four leds", "DECLL0"],
  "[1q": ["Turn on LED #1", "DECLL1"],
  "[2q": ["Turn on LED #2", "DECLL2"],
  "[3q": ["Turn on LED #3", "DECLL3"],
  "[4q": ["Turn on LED #4", "DECLL4"]
};

var unsupportedCodes = {

  "7": ["Save cursor position and attributes", "DECSC"],
  "8": ["Restore cursor position and attributes", "DECSC"],

  "[176;176": ["Set top and bottom lines of a window", "DECSTBM"],
  "176;176R": ["Response: cursor is at v,h", "CPR"],

  "=": ["Set alternate keypad mode", "DECKPAM"],
  ">": ["Set numeric keypad mode", "DECKPNM"],

  "(A": ["Set United Kingdom G0 character set", "setukg0"],
  ")A": ["Set United Kingdom G1 character set", "setukg1"],
  "(B": ["Set United States G0 character set", "setusg0"],
  ")B": ["Set United States G1 character set", "setusg1"],
  "(0": ["Set G0 special chars. & line set", "setspecg0"],
  ")0": ["Set G1 special chars. & line set", "setspecg1"],
  "(1": ["Set G0 alternate character ROM", "setaltg0"],
  ")1": ["Set G1 alternate character ROM", "setaltg1"],
  "(2": ["Set G0 alt char ROM and spec. graphics", "setaltspecg0"],
  ")2": ["Set G1 alt char ROM and spec. graphics", "setaltspecg1"],

  "#3": ["Double-height letters, top half", "DECDHL"],
  "#4": ["Double-height letters, bottom half", "DECDHL"],
  "#5": ["Single width, single height letters", "DECSWL"],
  "#6": ["Double width, single height letters", "DECDWL"],
  "#8": ["Screen alignment display", "DECALN"],

  "5n": ["Device status report", "DSR"],
  "0n": ["Response: terminal is OK", "DSR"],
  "3n": ["Response: terminal is not OK", "DSR"],
  "6n": ["Get cursor position", "DSR"]
};



describe("ANSI Matching", function () {

  it('should match ansi code in a string', function (done) {
    assert.equal(ansiRegex().test('foo\u001b[4mcake\u001b[0m'), true);
    assert.equal(ansiRegex().test('\u001b[4mcake\u001b[0m'), true);
    assert.equal(ansiRegex().test('foo\u001b[4mcake\u001b[0m'), true);
    assert.equal(ansiRegex().test('\u001b[0m\u001b[4m\u001b[42m\u001b[31mfoo\u001b[39m\u001b[49m\u001b[24mfoo\u001b[0m'), true);
    assert.equal(ansiRegex().test('foo\u001b[mfoo'), true);
    done();
  });

  it('should match ansi code from ls command', function (done) {
    assert.equal(ansiRegex().test('\u001b[00;38;5;244m\u001b[m\u001b[00;38;5;33mfoo\u001b[0m'), true);
    done();
  });

  it('should match reset;setfg;setbg;italics;strike;underline sequence in a string', function (done) {
    assert.equal(ansiRegex().test('\u001b[0;33;49;3;9;4mbar\u001b[0m'), true);
    // console.log('\u001b[0;33;49;3;9;4mbar\u001b[0m'.match(ansiRegex()) );
    done();
  });

  it('should match a list of all supported codes', function (done) {
    for (var code in supportedCodes) {
      if(supportedCodes.hasOwnProperty(code)){
        // assert.equal(("\u001b"+code).match( ansiRegex() )[0], "\u001b"+code );
        assert.equal(ansiRegex().test("\u001b"+code), true, supportedCodes[code][0]);
        // console.log(code, ("\u001b"+code).match( ansiRegex() ) ) ;
      }
    }

    done();

  });

});



