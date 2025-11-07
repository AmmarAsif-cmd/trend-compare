// types/third-party.d.ts
declare module "leo-profanity" {
  const leo: {
    add?: (list: string[]) => void;
    load?: (lang?: string) => void;
    check: (text: string) => boolean;
    clean?: (text: string) => string;
  };
  export = leo;
}

declare module "is-url-superb" {
  function isUrl(input: string): boolean;
  export default isUrl;
}

declare module "remove-accents" {
  function removeAccents(input: string): string;
  export default removeAccents;
}
