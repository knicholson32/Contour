import { writable } from 'svelte/store';

export const backArrow = writable(false);
export const unsaved = writable(true);
export const backText = writable('Back');
export const backButtonClicked = writable(() => { });