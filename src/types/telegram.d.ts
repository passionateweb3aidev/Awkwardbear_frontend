interface TelegramWebApp {
  platform: string;
  openLink: (
    url: string,
    options?: {
      try_instant_view?: boolean;
      try_browser?:
        | "google-chrome"
        | "chrome"
        | "mozilla-firefox"
        | "firefox"
        | "microsoft-edge"
        | "edge"
        | "opera"
        | "opera-mini"
        | "brave"
        | "brave-browser"
        | "duckduckgo"
        | "duckduckgo-browser"
        | "samsung"
        | "samsung-browser"
        | "vivaldi"
        | "vivaldi-browser"
        | "kiwi"
        | "kiwi-browser"
        | "uc"
        | "uc-browser"
        | "tor"
        | "tor-browser";
    },
  ) => void;
  expand: () => void;
  disableVerticalSwiping?: () => void;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
    [key: string]: unknown;
  };
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}
