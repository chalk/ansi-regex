'use strict';
module.exports = function () {
  return /(\u001b\[|\u009b)([0-\?]*)?([0-;]*)?([" "-\/]*)?[@-~]|\u001b[@-_]/gi;
};
