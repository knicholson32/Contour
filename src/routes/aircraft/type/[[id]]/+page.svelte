<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/Section.svelte';
  import Input from '$lib/components/entry/Input.svelte';
  import Select from '$lib/components/entry/Select.svelte';
  import Switch from '$lib/components/entry/Switch.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import Image from '$lib/components/Image.svelte';
  import TwoColumn from '$lib/components/scrollFrames/TwoColumn.svelte';
  import { icons } from '$lib/components';
  import ImageUpload from '$lib/components/entry/ImageUpload.svelte';
  import { removeLocalStorage } from '$lib/helpers';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { goto, invalidateAll } from '$app/navigation';
  import { unsaved } from '$lib/stores';
  import Badge from '$lib/components/decorations/Badge.svelte';
  import * as MenuForm from '$lib/components/menuForm';
    import Tag from '$lib/components/decorations/Tag.svelte';

  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  let submitting = false;
  let deleting = false;

  let unsavedChanges = false;
  const update = () => {
    console.log('update on page');
    unsavedChanges = true;
    if (!unsavedKeys.includes(data.type?.id ?? 'new-type')) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(data.type?.id ?? 'new-type')) {
          unsavedKeys.push(data.type?.id ?? 'new-type');
          unsavedKeys = unsavedKeys;
          break;
        }
      }
    }
  }

  let unsavedKeys: string[] = [];

  const clearUnsaved = () => {
    console.log('clear!');
    removeLocalStorage(data.type?.id ?? 'new-type');
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
    if(browser) unsavedChanges = localStorage.getItem((data.type?.id ?? 'new-type') + '.unsaved') === 'true';
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

  let urlActiveParam: string;
  let isMobileSize: boolean;

  const ref = $page.url.searchParams.get('ref');

  const onMenuBack = () => {
    if (ref === null) goto('/aircraft');
    else goto(ref);
  }

</script>

<TwoColumn menu="scroll" {ref} form="scroll" bind:urlActiveParam bind:isMobileSize backText="Back" onMenuBack={onMenuBack} defaultRatio={0.33} >

  <!-- Menu Side -->
  <nav slot="menu" class="flex-shrink" aria-label="Directory">
    <MenuForm.Title title="Aircraft Types" />
    <MenuForm.Link href={ref ?? '/aircraft'} type="left" text="Go Back" />
    {#if data.orderGroups.length === 0}
      <MenuForm.BlankMenu href={'/aircraft/type/new?' + urlActiveParam} title="No aircraft types" subtitle="Get started by creating a new aircraft type." buttonText="New Aircraft"/>
    {:else}
      <MenuForm.Link href={'/aircraft/type/new?' + urlActiveParam} selected={$page.url.pathname.endsWith('new') && !isMobileSize} icon={icons.plus} text="Create a new aircraft type" type="right"/>
      <MenuForm.SearchBar />
      <!-- Existing Aircraft -->
      {#each data.orderGroups as group (group.make)}
        <Section title={group.make}>
          {#each group.types as type (type.id)}
            <a href="/aircraft/type/{type.id}?{urlActiveParam}" class="relative select-none flex flex-row justify-left items-center gap-2 pl-2 pr-6 py-2 {type.id === data.params.id && !isMobileSize ? 'bg-gray-200' : 'betterhover:hover:bg-gray-200 betterhover:hover:text-black'}">
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
                    <Tag>UNSAVED</Tag>
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
    <form action="?/createOrModify&{$page.url.search}" method="post" enctype="multipart/form-data" use:enhance={() => {
      submitting = true;
      return async ({ update }) => {
        await update({ reset: false });
        submitting = false;
        setTimeout(clearLocalStorageIfSuccess, 1);
      };
    }}>

      <Section title="General" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
        <Input {form} uid={data.type?.id ?? 'new-type'} required={true} title="Type Code" name="typeCode" value={data.type?.typeCode ?? null} placeholder="CL30" uppercase={true} update={update} />
        <Input {form} uid={data.type?.id ?? 'new-type'} required={false} title="Sub Code" name="subCode" value={data.type?.subCode ?? null} placeholder="350" uppercase={true} update={update} />
        <Input {form} uid={data.type?.id ?? 'new-type'} required={true} title="Make" name="make" value={data.type?.make ?? null} placeholder="Bombardier" uppercase={false} update={update} />
        <Input {form} uid={data.type?.id ?? 'new-type'} required={true} title="Model" name="model" value={data.type?.model ?? null} placeholder="Challenger 350" uppercase={false} update={update} />
      </Section>

      <Section title="Type">
        <Select {form} uid={data.type?.id ?? 'new-type'} required={true} title="Category / Class" options={data.enums.categoryClass ?? null} placeholder="Unset" name="catClass" value={data.type?.catClass} update={update} />
        <Select {form} uid={data.type?.id ?? 'new-type'} required={true} title="Gear Type" options={data.enums.gearType ?? null} name="gear" value={data.type?.gear} placeholder="Unset" update={update} />
        <Select {form} uid={data.type?.id ?? 'new-type'} required={true} title="Engine Type" options={data.enums.engineType ?? null} placeholder="Unset" name="engine" value={data.type?.engine} update={update} />
        <Switch {form} uid={data.type?.id ?? 'new-type'} title="Complex" name="complex" value={data.type?.complex ?? false} update={update} />
        <Switch {form} uid={data.type?.id ?? 'new-type'} title="Technically Advanced" name="taa" value={data.type?.taa ?? false} update={update} />
        <Switch {form} uid={data.type?.id ?? 'new-type'} title="High Performance" name="highPerformance" value={data.type?.highPerformance ?? false} update={update} />
        <Switch {form} uid={data.type?.id ?? 'new-type'} title="Pressurized" name="pressurized" value={data.type?.pressurized ?? false} update={update} />
      </Section>

      <Section title="Generic Type Image" error={form !== null && form.ok === false && form.action === '?/default' && form.name === 'image' ? form.message : null}>
        <ImageUpload uid={data.type?.id ?? 'new-type'} name="image" initialImageId={data.type?.imageId ?? null} maxMB={data.MAX_MB} update={update}/>
      </Section>

      <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
        {#if data.type !== null}
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
        {/if}
        {#if unsavedChanges}
          <button type="button" on:click={clearUnsaved} class="flex-grow w-full md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Clear</button>
          <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText={data.type !== null ? 'Update' : 'Create'} actionTextInProgress={data.type !== null ? 'Updating' : 'Creating'} />
        {/if}
      </div>
    </form>
  </div>

</TwoColumn>
