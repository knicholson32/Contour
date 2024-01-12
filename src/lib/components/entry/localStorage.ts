import { browser } from "$app/environment";
import { onMount } from "svelte";
import { get, writable, type Readable, type Writable } from "svelte/store";
import { page } from '$app/stores';
import { uid, form } from "./entryStore";
import { unsaved } from "$lib/stores";
import type API from "$lib/types/api";
import { invalidateAll } from "$app/navigation";

/**
 * Geth whether or not there are unsaved items used by the current uid
 * @returns 
 */
export const getUnsaved = () => localStorage.getItem(get(uid) + '.unsaved') === 'true';

/**
 * Remove local storage starting with the specified UID
 * @param uid the UID to remove
 */
export const clearUID = (invalidate = true) => {
  const uidResolved = get(uid);
  console.log('REMOVING ALL LOCAL STORAGE', uidResolved);
  // Nothing to do if server-side or no UID
  if (!browser || uidResolved === null || uidResolved === undefined) return;
  // Create an array to hold the keys to remove
  const keysToRemove: string[] = [];
  // Loop through the keys
  for (let i = 0; i < localStorage.length; i++) {
    // Get the key
    const key = localStorage.key(i);
    // If it is not null and starts with the UID, add it to be removed.
    // We can't remove it here because then our for loop gets out of sync.
    if (key !== null && key.startsWith(uidResolved)) keysToRemove.push(key)
  }
  // Remove all the items that should be removed
  for (const key of keysToRemove) localStorage.removeItem(key);
  for (const manager of LocalStorageManager.instances) manager._clear();

  // Invalidate all data and trigger a reload
  if (invalidate) invalidateAll();
}


/**
 * Clear the local storage if the form was a success
 */
export const clearFormIfSuccess = () => {
  if (get(form)?.ok === true) {
    clearUID();
  }
}

export class FormManager {

  static unsavedChanges: Writable<boolean> = writable(false);
  static unsavedUIDs: Writable<string[]> = writable([]);
  static unsavedUIDsLocal: string[] = [];

  currentPathname: string;

  constructor( options: { autoClearOnFormSuccess?: boolean } ) {

    // Initialize unsaved changes as false
    FormManager.unsavedChanges.set(false);

    // Initialize the current pathname
    this.currentPathname = get(page).url.pathname;

    // Set up an onMount that will be executed when the page loads, and destructed when the page unloads
    onMount(() => {
      // Create an unsubscribe array that we can add destructor functions to
      const unsubscribe: (() => void)[] = [];

      // Subscribe to autoClear
      if (options.autoClearOnFormSuccess === true) {
        // If the user has elected to auto-clear on form success, set that up
        unsubscribe.push(form.subscribe((formVal) => {
          if (formVal?.ok !== true) {
            clearUID(false);
          }
        }));
      }

      // Subscribe to local unsavedChanges and propagate that to the menu bar
      unsubscribe.push(FormManager.unsavedChanges.subscribe((val) => unsaved.set(val)));

      // Subscribe to UID changes
      unsubscribe.push(uid.subscribe((u) => {
        if (!browser) return;
        FormManager.unsavedUIDsLocal = [];
        // We do the bulk of the work when the page loads. Get every unsaved key except the UID we are
        // currently at. We will append or remove that one from the end as needed later
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)?.split('.');
          if (key === undefined || key.length === 0 || key[0] === u) continue;
          if (!FormManager.unsavedUIDsLocal.includes(key[0])) FormManager.unsavedUIDsLocal.push(key[0]);
        }
      }));

      // $page.url.pathname;
      // formManager.updateUID(data.type?.id ?? 'new-type');
      // Subscribe to pathname changes
      unsubscribe.push(page.subscribe((p) => {
        if (p.url.pathname !== this.currentPathname) {
          this.currentPathname = p.url.pathname;
          uid.set(get(uid));
        }
      }));

      return () => {
        // Run every unsubscribe function on page unload
        for (const u of unsubscribe) u();
      }
    });
  }

  // TODO: This could subscribe to the unsavedChanges writable for each LocalStorageManager and use reactivity to calculate (instead of the for loop)
  static _checkUnsaved() {
    // Check if there are any unsaved entry components
    let anyUnsaved = false;
    // Loop through each instance
    for (const man of LocalStorageManager.instances) {
      // Get whether or not there are unsaved changes
      if (get(man.unsavedChanges) === true) {
        // There are, we don't need to go farther.
        anyUnsaved = true;
        break;
      }
    }

    // Assign whether or not there are any unsaved for this UID
    FormManager.unsavedChanges.set(anyUnsaved);
    
    // Get the currentUID for use
    const u = get(uid);
    // Check if there is unsaved data and there is a UID
    if (anyUnsaved && u !== null) {
      // There is, so we should append this UID to our list of unsaved UIDs
      FormManager.unsavedUIDs.set(FormManager.unsavedUIDsLocal.concat([u]));
    } else {
      // There is not, so just do the default list without this UID included
      FormManager.unsavedUIDs.set(FormManager.unsavedUIDsLocal);
    }
  }

  getUnsavedChangesStore() {
    return FormManager.unsavedChanges;
  }

  getUnsavedUIDsStore() { 
    return FormManager.unsavedUIDs;
  }

  updateForm (f: API.Form.Type | null) {
    form.set(f);
  }
    
  updateUID (u: string | null) {
    uid.set(u);
  }

  clearUID (invalidate = true) {
    clearUID(invalidate);
  }
    
}

/**
 * Class to assist entry elements with local storage
 */
export class LocalStorageManager {

  /**
   * Notes related to data flow with respect to form inputs
   * 
   * External Props:
   * - Initial value: Data that came directly from the server. This is what is ~currently~ in the DB
   * - Value: The current state of this input after local storage and user modification
   * 
   * Data Hierarchy:
   * 1. Current value (which should always be written to local storage as it is edited)
   * 2. Initial value (if no local storage exists or if cleared)
   * 
   * When to trigger changes:
   * - When the `name` changes - Reload based on data hierarchy
   * - When `uid` changes - Reload based on data hierarchy
   * - When `form` changes - Reload based on data hierarchy
   * - When `defaultValue` changes - Reload based on data hierarchy
   * - When localStorage updates - Assign the current value to the local storage changed value
   */


  static instances: LocalStorageManager[] = [];

  onUpdate: (t: string | null) => void;
  onClear: () => void = () => {};
  uid: string | null;
  name: string;
  unsavedChanges: Writable<boolean>;
  default: string | null;
  initialLoad: boolean;

  constructor(name: Readable<string>, def: string | null, onUpdate: (t: string | null) => void, onClear?: () => void) {
    this.onUpdate = onUpdate
    if (onClear !== undefined) this.onClear = onClear;
    this.uid = get(uid);
    this.unsavedChanges = writable<boolean>(false);
    this.default = def;
    this.name = get(name);

    this.initialLoad = true;

    // Subscribe to the stores
    const unsubscribeName = name.subscribe((name: string) => this.name = name);
    const unsubscribeUID = uid.subscribe((uid: string | null) => {
      this.uid = uid;
      // console.log('uid assigned', uid, this);
      // Delay because the UID is updated before the default value does, and we want to
      // run this even if the default value does not change so we have to set a timeout.
      // Don't love this solution.
      setTimeout(() => this._forceCheck(), 1);
    });

    const unsubscribeForm = form.subscribe(() => {
      // console.log('Form-triggered update');
      // Delay because the Form is updated before the default value does, and we want to
      // run this even if the default value does not change so we have to set a timeout.
      // Don't love this solution.
      setTimeout(() => this._forceCheck(), 1);
    });

    /**
     * Attach a handler to listen for the storage event, which is emitted when
     * local storage changes. Remove if off mount.
     */
    onMount(() => {
      // Subscribe to the local storage event (wrapped so 'this' stays defined)
      window.addEventListener('storage', (e) => this._localStoreUpdate(e))
      LocalStorageManager.instances.push(this);
      return () => {
        // Unsubscribe from the local storage event (wrapped so 'this' stays defined)
        window.removeEventListener('storage', (e) => this._localStoreUpdate(e))
        // Unsubscribe from the stores
        unsubscribeName();
        unsubscribeUID();
        unsubscribeForm();
        LocalStorageManager.instances = LocalStorageManager.instances.filter((e) => e !== this);
      }
    });
  }

  // Private functions -----------------------------------------------------------------
  _localStoreUpdate(e: StorageEvent) {
    if (!browser || this.uid === null) return;
    if (e.key !== this.uid + '.' + this.name) return;
    // console.log('_localStoreUpdate', e.newValue);
    this.onUpdate(e.newValue);
  }

  _clear() {
    this._forceCheck();
    this.onClear();
  }

  _forceCheck() {
    this.onUpdate(this.check());
  }

  // Public functions ------------------------------------------------------------------


  getUnsavedStore() {
    return this.unsavedChanges;
  }

  /**
   * Set the default value, which prevents assignment of this value to local storage
   * @param value the default value
   */
  setDefault(value: string | null): void {
    this.default = value;
    // console.log('setDefault', this.name, value);
    this._forceCheck();
  }

  /**
   * Set the local storage value
   * @param value the value to set
   */
  set (value: string | null): void {
    if (!browser || this.uid === null) return;
    if (value !== null && value !== this.default) {
      localStorage.setItem(this.uid + '.' + this.name, value);
      // localStorage.setItem(this.uid + '.unsaved', 'true');
      this.unsavedChanges.set(true);
      FormManager._checkUnsaved();
    } else this.clear();
  }

  /**
   * Clear the local storage value
   */
  clear (forceUpdate = false): void {
    if (!browser || this.uid === null) return;
    localStorage.removeItem(this.uid + '.' + this.name);
    this.unsavedChanges.set(false);
    FormManager._checkUnsaved();
    if(forceUpdate) this.onUpdate(null);
  }

  /**
   * Manually force a local storage fetch and update
   * @returns the value stored to local storage
   */
  check (_?: any): string | null {
    if (!browser || this.uid === null) return null;
    const savedValue = localStorage.getItem(this.uid + '.' + this.name);
    this.unsavedChanges.set((savedValue === null) ? false : ((savedValue === this.default) ? false : true));
    FormManager._checkUnsaved();
    return savedValue
  }
}