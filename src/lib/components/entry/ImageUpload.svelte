<script lang="ts">
  import { browser } from "$app/environment";
  import { page } from "$app/stores";
  import Image from "$lib/components/Image.svelte";
  import { ImageUploadState } from "$lib/types";
  import hi from "date-fns/locale/hi";
  import { onMount } from "svelte";

  export let initialImageId: string | null = 'unset';
	export let name: string;
	export let disabled: boolean = false;
  export let maxMB = 10;

  export let update: () => void = () => {};

  /**
   * Specifies whether or not an image must be provided. If true, the user will not be able to clear
   * the image if there is is no default provided image, and will never be able to delete the default
   * image from the server
   */
  export let imageRequired = false;

  let _initialImageId: string | null = initialImageId;
  // This funky couple lines is done so when the initialImageId changes (IE. page change) we can detect
  // it even it it doesn't actually change to a different value, since this component's version of it
  // is immortally cleared.
  const initialImageIDChange = () => {
    _initialImageId = initialImageId;
    initialImageId = 'unset';
  }

  /**
   * Variables:
   * 
   * 1. Provided an image on load or not
   * 2. Upload and image to update or not
   * 3. Clear the uploaded image and go back to provided image or not
   * 4. Delete the provided image from the server
   * 
   * 
   * If clear is clicked:
   *  Clear the uploaded image and go back to the default one
   *  If there is no uploaded image, delete the default one
   * 
   * 
   * Result State Options:
   * A. No change
   * B. Update image
   * C. Delete default image from server
   * 
   */

  let currentState: ImageUploadState = ImageUploadState.NO_CHANGE;


  let imageInput: HTMLInputElement;
  let profilePictureTooBigWarningVisible = false;

  let previewString = '';
  let errorMessage = '';
  let uploadedSizeMB = 0;
  let isURL = false;

  let isDefault = true;

  const _update = () => {
    localStorage.setItem(uid + '.unsaved', 'true');
    localStorage.setItem(uid + '.' + name, 'updated');
    update();
  }

	const imageChanged = () => {
		if (imageInput.files === null || imageInput.files.length !== 1) return;
		const file = imageInput.files[0];
    errorMessage = '';

    isURL = false;
    isDefault = false;


    uploadedSizeMB = file.size / 1000000;
		if (file.size / 1000000 > maxMB) {
			profilePictureTooBigWarningVisible = true;
			return;
		} else profilePictureTooBigWarningVisible = false;

		const reader = new FileReader();
		reader.addEventListener('load', function () {
			if (reader.result === null || typeof reader.result !== 'string') return;
      previewString = reader.result;
      forceImageDisplay = true;
      imageInput.blur();
      currentState = ImageUploadState.UPDATE;
      localStorage.removeItem(uid + '.' + name + '.url');
      _update();
		});
		reader.readAsDataURL(file);
	};

  let dragging = false;
  let dragCounter = 0;
  const startDrag = (e: DragEvent) => {
    dragging = true;
    dragCounter ++;
    console.log('start drag', e.target, e.eventPhase);
  }

  const endDrag = (e: DragEvent) => {
    dragCounter --;
    if (dragCounter < 0) dragCounter = 0;
    console.log('end drag', e.target, e.eventPhase);
    if (dragCounter === 0) {
      dragging = false;
    }
  }

  const clearUpload = () => {
    previewString = '';
    if (imageInput !== undefined) imageInput.value = '';
    currentState = ImageUploadState.NO_CHANGE;
  }

  const deleteImage = () => {
    currentState = ImageUploadState.DELETE;
    _update();
  }

  const restoreImage = () => {
    currentState = ImageUploadState.NO_CHANGE;
    forceImageDisplay = true;
  }

  let forceImageDisplay = false;
  const mouseLeave = () => {
    forceImageDisplay = false;
    forceShowMenu = false;
    console.log('mouseLeave');
  }

  const handleDrop = async (e: DragEvent) => {
    dragging = false;
    console.log('drop', e);
    e.preventDefault();

    errorMessage = '';

    if (e.dataTransfer?.types.includes('Files')) {
      // The user uploaded a file, this is easy. Just assign the files to the input element
      if (e.dataTransfer?.files !== undefined) imageInput.files = e.dataTransfer.files;
      forceImageDisplay = true;
      isDefault = false;
      currentState = ImageUploadState.UPDATE;
      imageChanged();
    } else if (e.dataTransfer?.types.includes('text/html')) {
      // The user has dragged in an HTML element, probably an image from another web-page
      // Parse the html and extract the first image src
      const el = document.createElement('html');
      el.innerHTML = `<html><head></head><body>${e.dataTransfer?.getData('text/html')}</body></html>`;
      const src = el.querySelector('img')?.getAttribute('src');
      
      // Error if there is no image src
      if (src === undefined || src === null) {
        errorMessage = 'Invalid source file';
      } else {
        try {
          // Create a new URL object. If the src is invalid, this will throw an error
          const u = new URL(src);
          // Assign the preview as the img src
          previewString = src;
          // Set that this is now an image url that the server will have to download
          isURL = true;
          imageInput.value = '';
          forceImageDisplay = true;
          isDefault = false;
          currentState = ImageUploadState.UPDATE;
          localStorage.setItem(uid + '.' + name + '.url', previewString);
          _update();
          return;
        } catch (e) {
          // The URL was not valid
          errorMessage = 'Invalid file';
        }
      }
    }
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
    console.log('Image checking local storage');
    const url = localStorage.getItem(uid + '.' + name + '.url');
    if (url !== null) {
      previewString = url;
      isURL = true;
      isDefault = false;
      currentState = ImageUploadState.UPDATE;
    }
  }

  /**
   * Check for a storage update. If the update matches the key and is not null,
   * use that value
   */
  const checkStorageUpdate = (e: StorageEvent) => {
    if (uid === null) return;
    if (e.key !== uid + '.' + name) return;
  }

  /**
   * If uid or name changes, the entry element has been re-assigned. Check local
   * storage and assign if required
   */
  $:{
    name;
    initialImageId;
    initialImageIDChange();
    clearUpload();
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

  let forceShowMenu = false;
  const clickedArea = () => {
    forceShowMenu = !forceShowMenu;
  }


</script>

<li>
  {#if isURL}
    <input {name} type="hidden" bind:value={previewString} />
  {/if}
  <input name={name + '-state'} type="hidden" bind:value={currentState} />
  <!-- <input name={name + '-isDefault'} type="hidden" bind:value={isDefault} /> -->

  <div class="w-full relative my-2 flex flex-col items-center px-3 py-1 gap-1 {disabled ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}">
    <div class="col-span-full w-full">
      <div role="presentation" class=" group relative mx-auto flex justify-center rounded-lg max-w-sm" on:click={clickedArea} on:mouseleave={mouseLeave} on:dragenter={startDrag} on:dragleave={endDrag} on:dragover={(e) => e.preventDefault()} on:drop={handleDrop}>
        <!-- Dashed Image Menu (appears when hover) -->
        <div class="bg-gray-100 {((_initialImageId === null && previewString === '') || dragging || currentState === ImageUploadState.DELETE || forceShowMenu) && !forceImageDisplay ? 'opacity-100' : 'opacity-0'} {forceImageDisplay ? '' : 'betterhover:group-hover:opacity-100'} transition-opacity text-center absolute inset-0 flex flex-col items-center justify-center rounded-lg border-dashed border-gray-300 {dragging ? 'border-sky-400 border-2' : 'border'}">
          <svg class="mx-auto h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clip-rule="evenodd" />
          </svg>
          <div class="mt-4 flex justify-center text-sm leading-6 text-gray-600">
            <label for="file-upload" class="relative cursor-pointer rounded-md font-semibold text-sky-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-600 focus-within:ring-offset-2 hover:text-sky-500">
              <span>Upload an image</span>
              <input name={name + (isURL ? '-unused' : '')} id="file-upload" bind:this={imageInput} on:change={imageChanged} accept="image/*" type="file" class="sr-only">
            </label>
            <p class="pl-1">or drag and drop</p>
          </div>
          <p class="text-xs leading-5 text-gray-600">
            PNG, JPG, GIF up to {maxMB}MB
          </p>
          <div class="relative w-full justify-center inline-flex">
            {#if previewString !== '' || _initialImageId !== null}
              {#if currentState === ImageUploadState.UPDATE}
                <button class="text-sky-600 text-sm focus-within:outline-none font-semibold focus-within:ring-0 hover:text-sky-500" type="button" on:click={clearUpload}>Clear Upload</button>
              {:else if imageRequired === false}
                {#if currentState === ImageUploadState.NO_CHANGE}
                  <button class="text-sky-600 text-sm focus-within:outline-none font-semibold focus-within:ring-0 hover:text-sky-500" type="button" on:click={deleteImage}>Delete Image</button>
                {:else if currentState === ImageUploadState.DELETE}
                  <button class="text-sky-600 text-sm focus-within:outline-none font-semibold focus-within:ring-0 hover:text-sky-500" type="button" on:click={restoreImage}>Restore Default</button>
                {/if}
              {/if}
            {/if}
          </div>
        </div>

        <!-- Image options -->
        {#if previewString !== ''}
          <!-- Updated image (src or base64) -->
          <img class="w-full rounded-lg group-hover:rounded-xl transition-all mx-auto flex justify-center object-cover max-w-sm min-h-48" src={previewString} alt="Current aircraft"/>
        {:else if _initialImageId === null || currentState === ImageUploadState.DELETE}
          <!-- No image -->
          <div class="w-full min-h-48 mx-auto"></div>
        {:else}
          <!-- Default image -->
          <Image class="w-full rounded-lg group-hover:rounded-xl transition-all mx-auto flex justify-center object-cover max-w-sm min-h-48" size={384} id={_initialImageId} alt="Current aircraft"/>
        {/if}
      </div>
    </div>
    {#if profilePictureTooBigWarningVisible}
      <span class="text-red-500 text-xs">Uploaded image is too large. Maximum size of {maxMB}MB permitted.</span>
      <span class="text-red-500 text-xs">Uploaded image is {uploadedSizeMB.toPrecision(2)}MB</span>
    {/if}
    {#if errorMessage !== ''}
      <span class="text-red-500 text-xs">{errorMessage}</span>
    {/if}
  </div>
</li>