<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/routeSpecific/entry/framing/Section.svelte';
  import Input from '$lib/components/routeSpecific/entry/Input.svelte';
  import Select from '$lib/components/routeSpecific/entry/Select.svelte';
  import Switch from '$lib/components/routeSpecific/entry/Switch.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';

  export let data: import('./$types').PageData;
	export let form: import('./new/$types').ActionData;

  let submitting = false;

  const update = () => {
    console.log('update');
  }

</script>

<div class="grid grid-cols-1">

  <a href="/aircraft/type">Types</a>

  {window.devicePixelRatio}

  {#each data.aircraft as aircraft}
    <div class="inline-flex">
      {#if aircraft.imageId !== null}
        <img class="w-[128px]" loading="lazy" 
          srcset="
            /api/image/{aircraft.imageId}/512 512w
            /api/image/{aircraft.imageId}/256 256w
            /api/image/{aircraft.imageId}/128w 128w
            /api/image/{aircraft.imageId}/56 56w
          "
          src="/api/image/{aircraft.imageId}" 
          alt="An image of {aircraft.registration}, a {aircraft.type.make} {aircraft.type.model}">
      {:else if aircraft.type.imageId !== null}
        <img class="w-[128px]" loading="lazy" 
          srcset="
            /api/image/{aircraft.type.imageId}/512 512w
            /api/image/{aircraft.type.imageId}/256 256w
            /api/image/{aircraft.type.imageId}/128w 128w
            /api/image/{aircraft.type.imageId}/56 56w
          "
          src="/api/image/{aircraft.type.imageId}" 
          alt="An image of {aircraft.registration}, a {aircraft.type.make} {aircraft.type.model}">
      {/if}
      {#if aircraft.imageBase64 !== undefined}
        <img class="w-[128px]" src="{aircraft.imageBase64}" alt="An image of {aircraft.registration}, a {aircraft.type.make} {aircraft.type.model}">
      {:else}
        <div class="">No image</div>
      {/if}
      <span>{aircraft.registration} - ({aircraft.type.make} {aircraft.type.model})</span>
    </div>
  {/each}

</div>