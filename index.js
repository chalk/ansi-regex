'use strict';
module.exports = function () {
  return /(\x1b\[|\x9b)[^@-_]*[@-_]|\x1b[@-_]/gi;
};
