import ansiRegex from '.';
import {expectType} from 'tsd';

expectType<RegExp>(ansiRegex());
