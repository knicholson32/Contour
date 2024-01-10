<script lang="ts">
  import { browser } from "$app/environment";
  import Switch from "$lib/components/buttons/Switch.svelte";
  import type { API } from "$lib/types";
  import { onMount } from "svelte";
  import Frame from "./Frame.svelte";

  export let value: boolean = false;
  export let updatedValue: boolean | null = null;
	export let name: string;
  export let title: string;
	export let disabled: boolean = false;
  export let action: string = '?/default';
  export let form: null | API.Form.Type = null

  export let update: () => void = () => {};

  const _update = () => {
    if (uid !== null) {
      updatedValue = value;
      localStorage.setItem(uid + '.' + name, value ? 'true' : 'false');
      localStorage.setItem(uid + '.unsaved', 'true');
    }
    update();
  }

  let focus: () => void;

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
    if (savedValue !== null && (savedValue === 'true' || savedValue === 'false')) value = savedValue === 'true';
  }

  /**
   * Check for a storage update. If the update matches the key and is not null,
   * use that value
   */
  const checkStorageUpdate = (e: StorageEvent) => {
    if (uid === null) return;
    if (e.key !== uid + '.' + name || e.newValue === null || (e.newValue !== 'true' && e.newValue !== 'false')) return;
    value = e.newValue === 'true';
    updatedValue = value;
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


<Frame {name} {action} {form} required={false} bind:title focus={focus} bind:disabled>
  <Switch type="submit" bind:click={focus} disableClick={true} bind:value changed={_update} bind:valueName={name} {disabled} />
</Frame>