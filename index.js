'use strict';
module.exports = function () {
  return /(\x1b\[|\x9b)([0-\?]*)?([0-;]*)?([" "-\/]*)?[@-~]|\x1b[@-_]/gi;
};
