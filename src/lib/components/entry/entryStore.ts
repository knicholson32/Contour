import type { API } from "$lib/types";
import { writable } from "svelte/store";

export const uid = writable<string | null>(null);
export const form = writable<API.Form.Type | null>(null);


export const updateForm = (f: API.Form.Type | null) => form.set(f);
export const updateUID = (u: string | null) => uid.set(u);