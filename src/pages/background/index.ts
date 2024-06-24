import * as browser from 'webextension-polyfill';
import addDomainPermissionToggle from 'webext-permission-toggle';
import 'webext-dynamic-content-scripts/including-active-tab.js';

import { displayLookup } from '@src/shared/lookup';
import { checkPermissions } from '@src/shared/permissions';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';

import { initContextMenu } from './contextMenu';

browser.permissions.onAdded.addListener(() => checkPermissions('onAdded'));
browser.permissions.onRemoved.addListener(() => checkPermissions('onRemoved'));
// browser.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
//   checkPermissions('tab activated')
// });
// browser.tabs.onUpdated.addListener(async (tabId, { status }, { url, active }) => {
//   checkPermissions('tab updated');
// });

checkPermissions('init');
addDomainPermissionToggle();

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');

browser.runtime.onInstalled.addListener(details => {
  // FIXME: Figure out how to use this totally undocumented enum
  // in a cross-platform way with webextension-polyfill:
  //
  //if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
  //
  // In the meantime, just hardcode the value:
  if (details.reason === 'install') {
    browser.tabs.create({ url: browser.runtime.getURL('src/pages/options/index.html') });
  }
});

// FIXME: Can we improve on the any type here?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
browser.runtime.onMessage.addListener(function (msg, sender, sendResponse: (data: any) => void) {
  // console.debug('background received msg: ', msg, 'from sender tab', sender.tab);
  switch (msg.text) {
    case 'get tab.id':
      sendResponse({ tabId: sender.tab.id });
      break;
    case 'setBadgeText':
      if (msg.count > 0) {
        const data = { tabId: sender.tab.id, text: String(msg.count) };
        // console.debug(`setBadgeText()`, data);
        browser.action.setBadgeText(data);
      }
      break;
  }
});

browser.commands.onCommand.addListener(
  (
    command: string,

    // For some reason this parameter doesn't get passed on Firefox:
    tab: browser.Tabs.Tab,
    // despite it being clearly documented that it should:
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/commands/onCommand#addlistener_syntax
  ) => {
    if (tab) {
      displayLookup(tab.id);
      return;
    }

    // However if we don't have it on Firefox, we can get the active tab this way instead:
    chrome.tabs.query({ active: true }).then(tabs => {
      const firstActiveTab = tabs[0];
      console.debug('rolod0x: firstActiveTab', firstActiveTab);
      displayLookup(firstActiveTab.id);
    });
  },
);

initContextMenu();

console.log('background service worker finished loading');
