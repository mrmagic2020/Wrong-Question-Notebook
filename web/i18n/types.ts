import messages from '../messages/en.json';

type Messages = typeof messages;

declare module 'use-intl' {
  interface AppConfig {
    Messages: Messages;
  }
}

/**
 * Permissive translator type for components/functions that receive
 * `t` as a prop rather than calling useTranslations() directly.
 * Type safety is enforced at the useTranslations() call site.
 */

export type TranslatorProp = (key: any, values?: any) => any;
