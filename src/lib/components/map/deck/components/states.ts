import { writable } from 'svelte/store';
export const useGlobeGlobal = writable<boolean | null>(null);