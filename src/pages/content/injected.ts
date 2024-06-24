import { getMapper } from '@src/shared/address-book';

import { replaceInNodeAndCount, startObserver } from './replacer';
import { initContextMenu } from './contextMenu';

let status = 'loading';

// This message handler used by the background service worker to
// determine whether a tab has our content script loaded.  We install
// it last in the content script, so that if we get a response from
// it, we know that the content script is fully loaded.
chrome.runtime.onMessage.addListener((event, _sender, sendResponse) => {
  // see src/pages/background/contextMenu.ts
  if (event === 'rolod0x content script status') {
    sendResponse({ status });
  }
});

async function initReplacer(): Promise<void> {
  const mapper = await getMapper();

  replaceInNodeAndCount(document.body, mapper.labelMap);
  startObserver(document.body, mapper.labelMap);
}

void initReplacer();
void initContextMenu();

status = 'loaded';
