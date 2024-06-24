import * as browser from 'webextension-polyfill';
import { getTabUrl } from 'webext-tools';
// import { isContentScriptRegistered } from 'webext-dynamic-content-scripts/utils.js';

const CONTEXT_MENU_ID = 'rolod0x-context-menu';

const CONTEXT_MENU_TITLES = {
  loaded: 'rolod0x: add entry to address book',
  loading: 'rolod0x: loading',
  absent: 'Activate rolod0x for this domain',
} as const;

type ContentScriptStatus = keyof typeof CONTEXT_MENU_TITLES;

function debugClickEvent(
  message: string,
  info: browser.Menus.OnClickData,
  tab: browser.Tabs.Tab,
): void {
  console.log(message);
  console.log('Context menu OnClickData:', info);
  console.log('Tab info:', tab || '<tab undefined>');
}

async function tabContentScriptStatus(tabId: number): Promise<ContentScriptStatus> {
  // There are various ways to detect from the background service
  // worker whether the tab has our content script loaded; however
  // most are problematic.

  // canAccessTab() from webext-tools relies on empirical detection:
  // try executeFunction() and see if it works:
  //
  //   const enabled = await canAccessTab(tab.id);
  //
  // However this only shows whether execution is possible, not whether
  // our content script is loaded, so it seems to be racy when used
  // straight after the user has invoked activeTab via right-click.

  // Another way is browser.permissions.contains():
  //
  //   const origin = new URL(url).origin + '/*';
  //   const permissionData = {
  //     origins: [origin],
  //   };
  //   const permitted = await browser.permissions.contains(permissionData);
  //
  // but this doesn't take activeTab into account, and again could
  // return true before the content script has loaded.

  // isContentScriptRegistered(url) from webext-dynamic-content-scripts/utils.js
  // doesn't take activeTab into account, which means that it won't be defined
  // when this function is called by the handler for the first right-click on a
  // site on which rolod0x isn't enabled:
  //
  //   const isRegistered = tabUrl && (await isContentScriptRegistered(tabUrl));

  // Same is true of the native API:
  //
  //   const registeredScripts = await browser.scripting.getRegisteredContentScripts();

  const url = await getTabUrl(tabId);
  const tabDescr = `tab ${tabId}` + (url ? ` (${url})` : '');
  // The most reliable way is to install a message handler as the last thing in
  // the injected content script which responds to a simple ping.
  try {
    console.log(`Sending ping to ${tabDescr}`);
    const response = await browser.tabs.sendMessage(tabId, 'rolod0x content script status');
    console.log(`Got response from ${tabDescr} to content script status request: `, response);
    return response?.status || 'absent';
  } catch (err: unknown) {
    console.log(
      `Got error from pinging ${tabDescr}; assuming content script not loaded.\n` + `Error was:`,
      err,
    );
    return 'absent';
  }
}

// Horrible hack to work around https://issues.chromium.org/issues/40375229 -
// see https://stackoverflow.com/questions/7703697/how-to-retrieve-the-element-where-a-contextmenu-has-been-executed
async function handleContextMenuClick(
  info: browser.Menus.OnClickData,
  tab: browser.Tabs.Tab,
): Promise<void> {
  if (info.menuItemId !== CONTEXT_MENU_ID) {
    debugClickEvent('Update address book handler ignoring other context menu click', info, tab);
    return;
  }

  const url = info.pageUrl;
  if (!url) {
    // This could happen if there's no activeTab permission and the extension hasn't been granted
    // permission to the tab's site.
    debugClickEvent("Can't send update address book message to unknown frame", info, tab);
    return;
  }

  if (url.match(new RegExp('(moz|chrome)-extension://'))) {
    debugClickEvent('NOT sending update address book message to browser extension', info, tab);
    return;
  }

  const status = await tabContentScriptStatus(tab.id);
  if (status === 'absent') {
    // Since we rely on the content script to track which element was
    // right-clicked, we can't popup the add entry modal immediately
    // after content script injection, because that happens after the
    // click so we don't yet know which element was clicked.
    //
    // Therefore we have to get the user to first activate the extension
    // and then right-click again to add an entry.
    console.log(
      `Need to register content script before sending update address book message to tab ${tab.id}`,
    );

    // Somewhat annoyingly we're not allowed to call this here, even
    // though it's technically from a user gesture:
    //
    //   await browser.permissions['request'](permissionData);
    //
    // Presumably we would have to pop up a modal asking the user to
    // click a button to grant permissions to rolod0x for this site.
    //
    // But anyway perhaps the user wants to add an address via
    // right-click without permanently enabling rolod0x on that
    // domain.
    //
    // Instead we rely on the import in ./index.ts of
    // webext-dynamic-content-scripts/including-active-tab.js to
    // automatically inject the content script as soon as activeTab is
    // activated.  That injection may race with this code, so call
    // updateContextMenu() with an extra parameter to tell it to assume
    // the activeTab injection worked fine.
    //
    // FIXME: can we change this so that the menu is updated by the
    // content script messaging this background worker when it's
    // loaded?  Would have to ensure it only updates the menu item when
    // the tab is active, which may not be easy or even possible.
    updateContextMenu(tab.id, 'loaded');
    return;
  }

  console.log('Sending update address book message to tab', info, tab);
  browser.tabs.sendMessage(
    tab.id,
    'rolod0x update address book', // see src/pages/content/contextMenu.ts
    { frameId: info.frameId },
    // handleResponse
  );
}

// We don't need this since we'll handle the right-click in the content script in the tab:
//
// function handleResponse(data): void {
//   console.log('data: ', data);
// }

// Update the context menu item to reflect whether rolod0x is already
// enabled on the current tab.  The challenge here is that we have to
// do this from this background worker script, but only the tab has
// accurate knowledge of whether the content script has been injected
// there.
async function updateContextMenu(tabId: number, status?: ContentScriptStatus): Promise<void> {
  const scriptStatus = status ?? (await tabContentScriptStatus(tabId));
  console.log(`updateContextMenu: content script status ${scriptStatus}`);
  const title = CONTEXT_MENU_TITLES[scriptStatus || 'absent'];
  browser.contextMenus.update(CONTEXT_MENU_ID, {
    title,
    // This is how we could grey out this menu item if we chose
    // a different approach to the UX:
    // enabled: false
  });
  console.debug(`updateContextMenu: updated item to ${title}`);
}

export function initContextMenu(): void {
  browser.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: CONTEXT_MENU_TITLES.absent,
    contexts: ['page', 'selection', 'link'],
    // For some weird reason this can't be set from the service worker; see
    //
    // https://developer.chrome.com/docs/extensions/reference/api/contextMenus#type-CreateProperties
    //
    // onclick: handleContextMenuClick,
  });

  // So we set the handler like this instead:
  browser.contextMenus.onClicked.addListener(handleContextMenuClick);

  console.log('added context menu item and listener');
}

browser.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  console.log(`tab ${tabId} activated in window ${windowId}`);
  await updateContextMenu(tabId);
});
browser.tabs.onUpdated.addListener(async (tabId, { status }, { url, active }) => {
  console.log(`tab ${tabId} updated, status ${status}, url ${url}, active ${active}`);
  await updateContextMenu(tabId);
});
