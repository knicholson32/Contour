<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/Section.svelte';
  import Input from '$lib/components/routeSpecific/entry/Input.svelte';
  import Select from '$lib/components/routeSpecific/entry/Select.svelte';
  import Switch from '$lib/components/routeSpecific/entry/Switch.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import Image from '$lib/components/Image.svelte';
  import TwoColumn from '$lib/components/scrollFrames/TwoColumn.svelte';
  import { icons } from '$lib/components';
  import ImageUpload from '$lib/components/routeSpecific/entry/ImageUpload.svelte';
  import { removeLocalStorage } from '$lib/helpers';
  import { page } from '$app/stores';
  import { fade, fly, slide } from 'svelte/transition';
  import { cubicIn } from 'svelte/easing';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto, invalidate, invalidateAll } from '$app/navigation';
  import { unsaved } from '$lib/stores';
    import Badge from '$lib/components/decorations/Badge.svelte';

  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  let submitting = false;
  let deleting = false;

  let unsavedChanges = false;
  const update = () => {
    console.log('update on page');
    unsavedChanges = true;
    if (data.type?.id !== undefined && !unsavedKeys.includes(data.type.id)) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(data.type.id)) {
          unsavedKeys.push(data.type.id);
          unsavedKeys = unsavedKeys;
          break;
        }
      }
    }
  }

  let unsavedKeys: string[] = [];

  const clearUnsaved = () => {
    console.log('clear!');
    removeLocalStorage(data.type?.id);
    invalidateAll();
  }

  const clearLocalStorageIfSuccess = () => {
    if (form?.ok !== false) {
      // clear the saved values if there are any
      removeLocalStorage(data.type?.id ?? 'new-type');
    }
  }

  /**
   * Trigger whenever the type ID is updated (new selected page)
   */
  $:{
    if(browser && data.type?.id !== undefined) unsavedChanges = localStorage.getItem(data.type.id + '.unsaved') === 'true';
    $unsaved = unsavedChanges;
  }

  /**
   * Trigger whenever the page URL is updated
   */
  $:{
    $page.url.pathname;
    if (browser) {
      unsavedKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)?.split('.')[0];
        if (key !== undefined) unsavedKeys.push(key);
      }
    }
  }

  let ratio = 0.33;

  let urlActiveParam: string;
  let isMobileSize: boolean;

  const onMenuBack = () => {
    goto('/aircraft');
  }

</script>

<TwoColumn menu="scroll" form="scroll" bind:urlActiveParam bind:isMobileSize backText="Back" onMenuBack={onMenuBack} defaultRatio={0.50} bind:ratio >

  <!-- Menu Side -->
  <nav slot="menu" class="flex-shrink" aria-label="Directory">
    <a href="/aircraft" class="hidden md:flex h-11 border-b relative flex-row justify-left items-center gap-2 pl-2 pr-6 py-2 betterhover:hover:bg-gray-200 betterhover:hover:text-black">
      <!-- <div class="h-7 w-7 mx-2.5 flex-shrink-0 rounded-full bg-gray-600 text-black uppercase font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
        Back
      </div> -->
      <div class="h-7 w-12 flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
        <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
          {@html icons.chevronLeft}
        </svg>
      </div>
      <div class="flex flex-col gap-1 overflow-hidden flex-initial">
        <div class="uppercase font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">Go Back</div>
      </div>
    </a>
    {#if data.orderGroups.length === 0}
      <!-- No Aircraft -->
      <div class="absolute top-0 bottom-24 text-center w-full flex flex-col justify-center items-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        <h3 class="mt-2 text-sm font-semibold text-gray-900">No aircraft types</h3>
        <p class="mt-1 text-sm text-gray-500">Get started by creating a new aircraft type.</p>
        <div class="mt-6">
          <a href="/aircraft/type/new?{urlActiveParam}" type="button" class="inline-flex items-center rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-sm betterhover:hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500">
            <svg class="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            New Aircraft
          </a>
        </div>
      </div>
    {:else}
      <!-- New Aircraft -->
      <a href="/aircraft/type/new?{urlActiveParam}" class="relative flex flex-row justify-left items-center gap-2 pl-2 pr-6 py-2 {$page.url.pathname.endsWith('new') && !isMobileSize ? 'bg-gray-200' : 'betterhover:hover:bg-gray-200 betterhover:hover:text-black'}">
        <div class="h-7 w-12 flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
          <div class="h-7 w-7 flex-shrink-0 rounded-full bg-gray-600 text-black uppercase font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
            <svg class="h-4 w-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
              {@html icons.plus}
            </svg>
          </div>
        </div>
        <div class="flex flex-col gap-1 overflow-hidden flex-initial">
          <div class="uppercase font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">Create a new aircraft type</div>
        </div>
        <div class="absolute right-1">
          <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
            {@html icons.chevronRight}
          </svg>
        </div>
      </a>
      <!-- Existing Aircraft -->
      {#each data.orderGroups as group (group.make)}
        <Section title={group.make}>
          {#each group.types as type (type.id)}
            <a href="/aircraft/type/{type.id}?{urlActiveParam}" class="relative flex flex-row justify-left items-center gap-2 pl-2 pr-6 py-2 {type.id === data.params.id && !isMobileSize ? 'bg-gray-200' : 'betterhover:hover:bg-gray-200 betterhover:hover:text-black'}">
              {#if type.imageId !== null}
                <div class="h-12 w-12 flex-none flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                  <Image id={type.imageId} size={48} class="aspect-1 object-cover w-full h-full" alt="Icon for the {type.make} {type.model}"/>
                  <Badge class="absolute top-[4px] left-[4px]">{type._count.aircraft}</Badge>
                </div>
              {:else}
                <div class="h-12 w-12 flex-shrink-0 rounded-lg bg-gray-300 text-black uppercase font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
                  {type.typeCode.substring(0, (type.typeCode.length < 4 ? type.typeCode.length : 5))}
                  <Badge class="absolute top-[4px] left-[4px]">{type._count.aircraft}</Badge>
                </div>
              {/if}
              <div class="flex flex-col gap-1 overflow-hidden flex-initial">
                <div class="uppercase font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">{type.make} {type.model}</div>
                <div class="text-xs overflow-hidden uppercase whitespace-nowrap text-ellipsis inline-flex gap-2 items-baseline">
                  {type.catClass} - {type.typeCode}
                  {#if unsavedKeys.includes(type.id)}
                    <span class="font-mono text-xxs px-2 rounded-full bg-sky-600 text-white font-bold">UNSAVED</span>
                  {/if}
                </div>
              </div>
              <div class="absolute right-1">
                <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
                  {@html icons.chevronRight}
                </svg>
              </div>
            </a>
          {/each}
        </Section>  
      {/each}
    {/if}
  </nav>
  
  <!-- Form Side -->
  <div slot="form" class="flex-shrink">
    <form action="?/createOrModify" method="post" enctype="multipart/form-data" use:enhance={() => {
      submitting = true;
      return async ({ update }) => {
        await update({ reset: false });
        submitting = false;
        setTimeout(clearLocalStorageIfSuccess, 1);
      };
    }}>
      {#if data.type !== null}
      <Section title="General" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
          <Input {form} uid={data.type.id} required={true} title="Type Code" name="typeCode" value={data.type?.typeCode} placeholder="CL30" uppercase={true} update={update} />
          <Input {form} uid={data.type.id} required={false} title="Sub Code" name="subCode" value={data.type?.subCode} placeholder="350" uppercase={true} update={update} />
          <Input {form} uid={data.type.id} required={true} title="Make" name="make" value={data.type?.make} placeholder="Bombardier" uppercase={false} update={update} />
          <Input {form} uid={data.type.id} required={true} title="Model" name="model" value={data.type?.model} placeholder="Challenger 350" uppercase={false} update={update} />
        </Section>

        <Section title="Type">
          <Select {form} uid={data.type.id} required={true} title="Category / Class" options={data.enums.categoryClass} placeholder="Unset" name="catClass" value={data.type?.catClass} update={update} />
          <Select {form} uid={data.type.id} required={true} title="Gear Type" options={data.enums.gearType} name="gear" value={data.type?.gear} placeholder="Unset" update={update} />
          <Select {form} uid={data.type.id} required={true} title="Engine Type" options={data.enums.engineType} placeholder="Unset" name="engine" value={data.type?.engine} update={update} />
          <Switch {form} uid={data.type.id} title="Complex" name="complex" value={data.type?.complex} update={update} />
          <Switch {form} uid={data.type.id} title="Technically Advanced" name="taa" value={data.type?.taa} update={update} />
          <Switch {form} uid={data.type.id} title="High Performance" name="highPerformance" value={data.type?.highPerformance} update={update} />
          <Switch {form} uid={data.type.id} title="Pressurized" name="pressurized" value={data.type?.pressurized} update={update} />
        </Section>

        <Section title="Generic Type Image" error={form !== null && form.ok === false && form.action === '?/default' && form.name === 'image' ? form.message : null}>
          <ImageUpload uid={data.type.id} name="image" initialImageId={data.type?.imageId ?? null} maxMB={data.MAX_MB} update={update}/>
        </Section>
      {:else}
        <Section title="General" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
          <Input {form} uid="new-type" required={true} title="Type Code" name="typeCode" placeholder="CL30" uppercase={true} update={update} />
          <Input {form} uid="new-type" required={false} title="Sub Code" name="subCode" placeholder="350" uppercase={true} update={update} />
          <Input {form} uid="new-type" required={true} title="Make" name="make" placeholder="Bombardier" uppercase={false} update={update} />
          <Input {form} uid="new-type" required={true} title="Model" name="model" placeholder="Challenger 350" uppercase={false} update={update} />
        </Section>

        <Section title="Type">
          <Select {form} uid="new-type" required={true} title="Category / Class" options={data.enums.categoryClass} placeholder="Unset" name="catClass" update={update} />
          <Select {form} uid="new-type" required={true} title="Gear Type" options={data.enums.gearType} name="gear" placeholder="Unset" update={update} />
          <Select {form} uid="new-type" required={true} title="Engine Type" options={data.enums.engineType} placeholder="Unset" name="engine" update={update} />
          <Switch {form} uid="new-type" title="Complex" name="complex" update={update} />
          <Switch {form} uid="new-type" title="Technically Advanced" name="taa" update={update} />
          <Switch {form} uid="new-type" title="High Performance" name="highPerformance" update={update} />
          <Switch {form} uid="new-type" title="Pressurized" name="pressurized" update={update} />
        </Section>

        <Section title="Generic Type Image" error={form !== null && form.ok === false && form.action === '?/default' && form.name === 'image' ? form.message : null}>
          <ImageUpload uid="new-type" name="image" maxMB={data.MAX_MB} update={update}/>
        </Section>
      {/if}

      <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
        <form class="flex-grow max-w-[33%] md:w-48 md:flex-grow-0 flex items-start" action="?/delete" method="post" use:enhance={({ cancel }) => {
          const answer = confirm('Are you sure you want to delete this Aircraft Type? This action cannot be undone.');
          if (!answer) cancel();
          else {
            deleting = true;
            return async ({ update }) => {
              await update({ invalidateAll: true });
              deleting = false;
              setTimeout(clearLocalStorageIfSuccess, 1);
            };
          }
        }}>
          <input type="hidden" name="id" value={data.type?.id} />
          <Submit class="w-full" failed={form?.ok === false && form.action === '?/default'} submitting={deleting} theme={{primary: 'red'}} actionText={'Delete'} actionTextInProgress={'Deleting'} />
        </form>
        {#if unsavedChanges}
          <button type="button" on:click={clearUnsaved} class="flex-grow w-full md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Clear</button>
          <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText={data.type !== null ? 'Update' : 'Create'} actionTextInProgress={data.type !== null ? 'Updating' : 'Creating'} />
        {/if}
      </div>
    </form>
  </div>

</TwoColumn>
