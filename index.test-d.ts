import {expectType} from 'tsd';
import ansiRegex = require('.');

expectType<RegExp>(ansiRegex());
expectType<RegExp>(ansiRegex({onlyFirst: true}));
