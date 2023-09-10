// // xkcd-api.d.ts

// declare module 'xkcd-api' {
//     export interface XKCDComic {
//       safe_title(safe_title: any): unknown;
//       num: number;
//       title: string;
//       alt: string;
//       img: string;
//       // Add other properties as needed
//     }
//     export function latest(callback: (error: any, comic: XKCDComic) => void): void;
//     export function get(comicNumber: number, callback: (error: any, comic: XKCDComic) => void): void;
//     export function random(callback: (error: any, comic: XKCDComic) => void): void;
// }