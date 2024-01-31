// It seems this file cannot contain static import statements. See:
//
// - https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/issues/160
// - https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite/issues/306
//
// Also, use of const or class at the top-level will result in:
//
//   Uncaught SyntaxError: Identifier '_MyClass' has already been declared
//
// So until we can import and use nice ESM syntax, we have to use var.  Ugh.

/* eslint-disable no-var */
var CONTAINER_ID = 'chrome-extension-boilerplate-react-vite-lookup-view-root';
var IFRAME_URL = 'src/pages/lookup/ui/index.html';
/* eslint-enable no-var */

function rolod0x_lookup_init(): void {
  if (document.getElementById(CONTAINER_ID)) {
    setIframeVisibility(true);
  } else {
    newContainer();
  }
}

function newContainer() {
  const container: HTMLDivElement = document.createElement('div');
  container.id = CONTAINER_ID;
  container.style.display = 'block';
  container.style.opacity = '1';
  document.body.append(container);

  const ifr = newIframe();
  const shadowRoot = container.attachShadow({ mode: 'open' });
  shadowRoot.appendChild(ifr);

  setupHideHandler();

  return container;
}

function setupHideHandler() {
  window.addEventListener('message', function (event) {
    if (
      // FIXME: Does this break other browsers?  Also, could we discover
      // the full origin to check against?
      // event.origin.startsWith('chrome-extension://') &&
      event.data === 'rolod0x-hide-lookup'
    ) {
      setIframeVisibility(false);
    }
  });
  console.log('setupHideHandler');
}

function newIframe() {
  const frontEndURL = chrome.runtime.getURL(IFRAME_URL);
  const ifr: HTMLIFrameElement = document.createElement('iframe');
  ifr.setAttribute('src', frontEndURL);
  ifr.setAttribute('allow', 'clipboard-write');
  ifr.setAttribute('allowtransparency', 'true');
  ifr.setAttribute('frameborder', '0');
  ifr.setAttribute('scrolling', 'no');
  // ifr.setAttribute('class', '...');
  ifr.setAttribute('title', 'rolod0x address lookup');
  ifr.style.position = 'fixed';
  ifr.style.left = '10%';
  ifr.style.top = '10%';
  ifr.style.width = '80%';
  ifr.style.height = '80%';
  ifr.style.zIndex = '2147483647';
  return ifr;
}

function setIframeVisibility(visible: boolean): void {
  const container: HTMLElement = document.getElementById(CONTAINER_ID);
  if (!container) {
    console.error(`BUG: rolod0x couldn't find lookup shadow container with id ${CONTAINER_ID}`);
    return;
  }
  const ifr = container.shadowRoot.firstChild as HTMLIFrameElement;
  ifr.style.display = visible ? 'block' : 'none';
  // FIXME: need to wait here until iframe is visible before focusing!
  console.log('rolod0x: Changing display of lookup iframe to', ifr.style.display);
  // ifr.style.zIndex = String(2147483647 * (visible ? 1 : -1));
  if (visible) {
    ifr.contentWindow.postMessage('focus-input', '*');
  }
}

void rolod0x_lookup_init();
