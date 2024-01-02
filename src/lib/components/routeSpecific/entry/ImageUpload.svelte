<script lang="ts">
  import { EscapeOrClickOutside } from "$lib/components/events";
  import icons from "$lib/components/icons";
  import Frame from "./framing/Frame.svelte";

  export let initialImageId: string | null = null;
	export let name: string;
  export let title: string;
	export let disabled: boolean = false;
  export let uppercase: boolean = false;
  export let placeholder = '';

  export let update: () => void = () => {};

  let input: HTMLInputElement;

  let dialogOpen = false;
  let dialog: HTMLElement;
  let profilePicturePreview: HTMLImageElement;
  let profilePictureInput: HTMLInputElement;
  let openDialog = () => {
    dialogOpen = true;
    document.body.classList.add('overflow-hidden', 'xs:overflow-auto');
  }

  let closeDialog = () => {
    dialogOpen = false;
    document.body.classList.remove('overflow-hidden', 'xs:overflow-auto');
  }

  let profilePictureChanged = () => {
    console.log('changed');
  }

</script>

<!-- 
<div class="w-full relative inline-flex items-center px-3 py-1 gap-2 {disabled ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}">
  <button tabindex="-1" type="button" title="" on:click={openDialog} class="touch-manipulation w-full {disabled ? 'cursor-not-allowed' : 'cursor-default'} inline-flex items-center gap-2 ring-0 focus-within:ring-0">
    <dd class="flex-grow flex items-center overflow-hidden text-sky-500 font-bold h-9 justify-center">
      Upload Image
    </dd>
  </button>

  {#if dialogOpen}
    <div bind:this={dialog} use:EscapeOrClickOutside={{ callback: closeDialog }} class="fixed xs:absolute z-10 -right-1 -left-1 top-16 bottom-0 xs:top-10 xs:bottom-auto xs:right-3 xs:left-auto py-3 px-4 xs:px-3 xs:w-96 origin-top-right xs:rounded-md bg-white shadow-lg ring-1 ring-gray-300 ring-inset focus:outline-none flex flex-col gap-3" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
      <button type="button" on:click={closeDialog} class="absolute top-3 right-5 xs:top-2 xs:right-2 betterhover:hover:text-gray-800 text-gray-400">
        <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
          {@html icons.x}
        </svg>
      </button>
      <span class="font-medium text-md text-gray-900">Upload an Image</span>
      <hr class="mb-1"/>
      <div class="shrink-0">
        {#if initialImageId === null}
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 class="mt-2 text-sm font-semibold text-gray-900">No image</h3>
            <p class="mt-1 text-sm text-gray-500">Upload an image.</p>
          </div>
        {:else}
				  <img bind:this={profilePicturePreview} class="w-full object-cover" src="" alt="Current image"/>
        {/if}
			</div>
      <label class="mt-10 inline-flex items-center justify-center w-full">
        <span class="sr-only">Choose profile photo</span>
        <input required={true} type="file" bind:this={profilePictureInput} on:change={profilePictureChanged} accept="image/*" name="image" class="block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:cursor-pointer file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"/>
      </label>
    </div>
  {/if}

</div> -->

<div class="w-full relative inline-flex items-center px-3 py-1 gap-2 {disabled ? 'cursor-not-allowed bg-gray-50 text-gray-500' : ''}">
  <div class="col-span-full w-full">
    <div class="my-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
      <div class="text-center">
        <svg class="mx-auto h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clip-rule="evenodd" />
        </svg>
        <div class="mt-4 flex text-sm leading-6 text-gray-600">
          <label for="file-upload" class="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500">
            <span>Upload a file</span>
            <input id="file-upload" name="file-upload" type="file" class="sr-only">
          </label>
          <p class="pl-1">or drag and drop</p>
        </div>
        <p class="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 10MB</p>
      </div>
    </div>
  </div>
</div>