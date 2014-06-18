'use strict';
module.exports = function () {
	return /\u001b\[(?:[0-9]{1,3}(?:;[0-9]{1,3})*)?[m|K]/g;
  // return /(\x1b\[|\x9b)[^@-_]*[@-_]|\x1b[@-_]/gi;
};
