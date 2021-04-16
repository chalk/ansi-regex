import {expectType} from 'tsd';
import ansiRegex from './index.js';

expectType<RegExp>(ansiRegex());
expectType<RegExp>(ansiRegex({onlyFirst: true}));
