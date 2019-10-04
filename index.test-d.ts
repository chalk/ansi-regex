import {expectType} from 'tsd';
import ansiRegex from '.';

expectType<RegExp>(ansiRegex());
expectType<RegExp>(ansiRegex({onlyFirst: true}));
