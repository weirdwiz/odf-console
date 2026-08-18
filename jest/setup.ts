import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { configure } from '@testing-library/react';
import i18n from 'i18next';
import { isString } from 'lodash-es';
import { initReactI18next } from 'react-i18next';

// SAFETY: Node's util.TextEncoder is API-compatible with the web
// TextEncoder, but its type signature differs slightly.
global.TextEncoder = TextEncoder as typeof global.TextEncoder;
// SAFETY: Node's util.TextDecoder is API-compatible with the web
// TextDecoder, but its type signature differs slightly.
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

configure({ testIdAttribute: 'data-test-id' });

i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {},
  showSupportNotice: false,
});

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock required window properties.
window['SERVER_FLAGS'] = {
  basePath: '/tests/',
};
// @TODO: delete this warning suppression once @patternfly/react-topology & @patternfly/react-table address this.
const originalConsole = global.console;
global.console = {
  ...global.console,
  warn: (...args) => {
    if (
      isString(args[0]) &&
      (args[0].includes(
        '[mobx-react-lite] importing batchingForReactDom is no longer needed'
      ) ||
        args[0].includes('Th: Table headers must have an accessible name.'))
    ) {
      return true;
    }

    originalConsole.error(...args);
  },
};
