import { Formatter } from '@src/shared/formatter';
import { DEFAULT_OPTIONS, Rolod0xOptions, optionsStorage } from '@src/shared/options-storage';
import { Parser, ParseError } from '@src/shared/parser';
import { Mapper } from '@src/shared/mapper';

import { replaceInNode, startObserver } from './replacer';

async function initReplacer(): Promise<void> {
  const options: Rolod0xOptions = await optionsStorage.getAll();
  const parser = new Parser();
  try {
    parser.parseMultiline(options.labels);
  } catch (err: unknown) {
    if (err instanceof ParseError) {
      console.log('rolod0x:', err);
    } else {
      console.error('rolod0x:', err);
    }
  }

  // console.debug(`rolod0x: extracted ${parser.parsedEntries.length} parseable lines`);

  const exactFormatter = new Formatter(
    options.displayLabelFormat || DEFAULT_OPTIONS.displayLabelFormat,
  );
  const guessFormatter = new Formatter(
    options.displayGuessFormat || DEFAULT_OPTIONS.displayGuessFormat,
  );
  const mapper = new Mapper(exactFormatter, guessFormatter);
  mapper.importParsed(parser.parsedEntries);

  // console.time('rolod0x: initial replacement');
  const count = replaceInNode(document.body, mapper.labelMap);
  // console.debug('initial replacements: ', count);
  const counter = { count };
  chrome.runtime.sendMessage({ text: 'setBadgeText', count });
  // console.timeEnd('rolod0x: initial replacement');

  startObserver(document.body, mapper.labelMap, counter);
}

void initReplacer();
