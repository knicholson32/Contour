<script lang="ts">
  import type { API } from "$lib/types";
    import { onMount } from "svelte";
  import Frame from "./Frame.svelte";
  import { browser } from "$app/environment";
  import id from "date-fns/locale/id";

  export let value: string | null = null;
  export let action: string = '?/default';
  export let form: null | API.Form.Type = null
	export let name: string;
  export let error='';
  export let title: string;
	export let disabled: boolean = false;
  export let uppercase: boolean = false;
  export let validator: ((text: string) => boolean) | null = null;
  export let useNumberPattern = false;
  export let required: boolean = false;
  export let placeholder = '';

  export let update: () => void = () => {};


  let lastValue = value;
  export let _update = () => {
    if (validator !== null && input.value !== null) {
      if (!validator(input.value)) {
        input.value = lastValue ?? '';
      }
    }
    lastValue = input.value;
    if (uid !== null) {
      localStorage.setItem(uid + '.' + name, lastValue);
      localStorage.setItem(uid + '.unsaved', 'true');
    }
    update();
    return true;
  }

  let input: HTMLInputElement;
  let focus = () => input.focus();

  // ----------------------------------------------------------------------------
  // Local Storage Support
  // ----------------------------------------------------------------------------
  export let uid: string | null = null;
  /**
   * Check local storage. If it exists and is not null, use that value
   */
  const checkLocalStorage = () => {
    if (!browser) return;
    const savedValue = localStorage.getItem(uid + '.' + name);
    if (savedValue !== null) value = savedValue;
  }

  /**
   * Check for a storage update. If the update matches the key and is not null,
   * use that value
   */
  const checkStorageUpdate = (e: StorageEvent) => {
    if (uid === null) return;
    if (e.key !== uid + '.' + name || e.newValue === null) return;
    value = e.newValue;
  }

  /**
   * If uid or name changes, the entry element has been re-assigned. Check local
   * storage and assign if required
   */
  $:{
    name;
    if (uid !== null) checkLocalStorage();
  }

  /**
   * Attach a handler to listen for the storage event, which is emitted when
   * local storage changes. Remove if off mount.
   */
  onMount(() => {
    window.addEventListener('storage', checkStorageUpdate)
    return () => window.removeEventListener('storage', checkStorageUpdate)
  });

</script>


<Frame {name} {action} {form} {error} {required} bind:title focus={focus} bind:disabled>
  <input bind:this={input} {required} disabled={disabled} on:input={_update} pattern={useNumberPattern ? '[0-9]*' : undefined} type="text" style="{uppercase ? 'text-transform:uppercase' : ''}" bind:value={value} placeholder={placeholder} name={name}
    class="w-full text-ellipsis px-0 text-sm font-mono font-bold text-right flex-shrink border-0 bg-transparent py-1.5 placeholder:text-gray-300 placeholder:text-xs focus:ring-0 sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:text-gray-500">
</Frame>