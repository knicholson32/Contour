<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount } from "svelte";

  export let name: string;
  export let disabled: boolean = false;
  export let placeholder = 'Enter comments';
  export let update: () => void = () => {};
  export let required: boolean = false;
  export let value: string | null = null;

  const _update = () => {
    if (uid !== null) {
      localStorage.setItem(uid + '.' + name, value ?? '');
      localStorage.setItem(uid + '.unsaved', 'true');
    }
    update();
  }

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

<li class="w-full relative inline-flex items-center px-3 py-1 {disabled ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}">
  <textarea {required} bind:value={value} on:input={_update} disabled={disabled ? true : undefined} {placeholder} {name} class="m-0 p-0 text-sm font-medium w-full border-0 ring-0 outline-none bg-transparent focus-within:outline-none focus-within:ring-0 placeholder:text-gray-400 placeholder:text-xs disabled:cursor-not-allowed disabled:text-gray-500" rows="5"/>
</li>