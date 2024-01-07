import { getAddress } from 'ethers';

import { AddressData, LabelMap } from './types';
import { ABBREVIATION_FUNCTIONS } from './abbreviators';

function addLabel(labelMap: LabelMap, i: number, line: string, address: string, label: string, comment?: string) {
  const addresses = [address];
  let canonical: string;
  try {
    canonical = getAddress(address);
  } catch (err: unknown) {
    if (err instanceof Error && err.message.match(/bad address checksum/)) {
      throw new Error(`Bad address checksum on line ${i + 1}:\n` + line);
    }
    throw err;
  }
  if (address === canonical) {
    addresses.push(canonical.toLowerCase());
  } else {
    addresses.push(canonical);
  }

  for (const a of addresses) {
    labelMap.set(a, { label, comment });

    // The abbreviated form has a small risk of collisions,
    // so technically this is "just" a well-educated guess,
    // and we append a suffix to indicate the uncertainty.
    const guess = { label: label + '?', comment };
    for (const func of ABBREVIATION_FUNCTIONS) {
      for (const abbrev of func(a)) {
        labelMap.set(abbrev, guess);
      }
    }
  }
}

export class ParseError extends Error {}

export function parseLabels(labels: string): [number, LabelMap] {
  const labelMap: LabelMap = new Map<string, AddressData>();
  const labelLineRe = /^s*(0x[\da-f]{40})\s+(.+?)(?:\s+\/\/\s*(.*?)\s*)?$/i;
  const lines = labels.split('\n');
  let linesParsed = 0;
  lines.forEach((line, i) => {
    if (/^\s*(\/\/|$)/.test(line)) {
      // Comment or blank line; ignore
      return;
    }

    const m = labelLineRe.exec(line);
    if (m) {
      const [_all, address, label, comment] = m;
      if (address && label) {
        addLabel(labelMap, i, line, address, label, comment);
        linesParsed++;
        return;
      }

      throw new Error(
        `BUG: parsing issue with line ${i + 1}; ` +
          `address=${address ?? 'undefined'}, ` +
          `label=${label ?? 'undefined'}:\n` +
          line,
      );
    }

    throw new ParseError(`Failed to parse line ${i + 1}:\n` + line);
  });

  return [linesParsed, labelMap];
}
