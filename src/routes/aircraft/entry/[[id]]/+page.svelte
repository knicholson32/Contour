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
  import Button from '$lib/components/entry/Button.svelte';
  import TextField from '$lib/components/entry/TextField.svelte';
  import * as MenuForm from '$lib/components/menuForm';
    import Stats from '$lib/components/decorations/Stats.svelte';

  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  let deleting = false;
  let unsavedChanges = false;
  let unsavedKeys: string[] = [];

  const clearUnsaved = () => {
    console.log('clear!');
    removeLocalStorage(data.aircraft?.id ?? 'new-reg');
    invalidateAll();
  }

  const clearLocalStorageIfSuccess = () => {
    if (form?.ok !== false) removeLocalStorage(data.aircraft?.id ?? 'new-reg');
  }

  /**
   * Trigger whenever the type ID is updated (new selected page)
   */
  $:{
    if(browser) unsavedChanges = localStorage.getItem((data.aircraft?.id ?? 'new-reg') + '.unsaved') === 'true';
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


  const update = () => {
    console.log('update on page');
    unsavedChanges = true;

    if (!unsavedKeys.includes(data.aircraft?.id ?? 'new-reg')) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(data.aircraft?.id ?? 'new-reg')) {
          unsavedKeys.push(data.aircraft?.id ?? 'new-reg');
          unsavedKeys = unsavedKeys;
          break;
        }
      }
    }
  }

  const validate = (text: string): boolean => {
    console.log(text);
    return /^[0-9]?[0-9]?[0-9]?[0-9]?$/.test(text)
  }

  let submitting = false;

  const ref = $page.url.searchParams.get('ref');
  const reg = $page.url.searchParams.get('reg');

</script>

<TwoColumn {ref} menu="scroll" form="scroll" bind:urlActiveParam bind:isMobileSize backText="Back" defaultRatio={0.33} >

  <!-- Menu Side -->
  <nav slot="menu" class="flex-shrink" aria-label="Directory">
    <MenuForm.Title title="Aircraft Definitions" />
    {#if ref !== null}
      <MenuForm.Link href={ref} icon={icons.chevronLeft} text="Go Back" type={'left'} />
    {/if}
    <MenuForm.Link href={'/aircraft/type'} icon={icons.circleStack} text="View Aircraft Types" type={'right'} selected={$page.url.pathname.endsWith('type/new') && !isMobileSize} />
    {#if data.orderGroups.length === 0}
      <MenuForm.BlankMenu href={'/aircraft/entry/new?' + urlActiveParam} title="No aircraft" subtitle="Get started by creating a new aircraft." buttonText="New Aircraft" />
    {:else}
      <MenuForm.Link href={'/aircraft/entry/new?' + urlActiveParam} icon={icons.plus} text="Create a new aircraft" type={'right'} selected={$page.url.pathname.endsWith('entry/new') && !isMobileSize} />
      {#each data.orderGroups as group (group.typeCode)}
        <Section title={group.typeCode}>
          {#each group.regs as ac (ac.id)}
            <a href="/aircraft/entry/{ac.id}?{urlActiveParam}" class="relative select-none flex flex-row justify-left items-center gap-2 pl-2 pr-6 py-2 {ac.id === data.params.id && !isMobileSize ? 'bg-gray-200' : 'betterhover:hover:bg-gray-200 betterhover:hover:text-black'}">
              {#if ac.imageId !== null}
                <div class="h-8 w-8 flex-none flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                  <Image id={ac.imageId} size={32} class="aspect-1 object-cover w-full h-full" alt="Icon for the {ac.registration}, {ac.type.make} {ac.type.model}"/>
                  <Badge class="absolute top-[4px] left-[4px]">{ac._count.legs}</Badge>
                </div>
              {:else if ac.type.imageId !== null}
                <div class="h-8 w-8 flex-none flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                  <Image id={ac.type.imageId} size={32} class="aspect-1 object-cover w-full h-full" alt="Icon for the {ac.registration}, {ac.type.make} {ac.type.model}"/>
                  <Badge class="absolute top-[4px] left-[4px]">{ac._count.legs}</Badge>
                </div>
              {:else}
                <div class="h-8 w-8 flex-shrink-0 rounded-lg bg-gray-300 text-black uppercase font-mono text-xxs overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
                  {ac.registration.substring(0, (ac.registration.length < 2 ? ac.registration.length : 3))}
                </div>
              {/if}
              <div class="flex flex-col gap-0.5 overflow-hidden flex-initial">
                <div class="uppercase font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">
                  {ac.registration} - {ac.type.typeCode}
                  {#if unsavedKeys.includes(ac.id)}
                    <span class="font-mono text-xxs px-2 rounded-full bg-sky-600 text-white font-bold">UNSAVED</span>
                  {/if}
                </div>
                <div class="text-xs overflow-hidden uppercase whitespace-nowrap text-ellipsis inline-flex gap-2 items-baseline">{ac.type.make} - {ac.type.model}</div>
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


      {#if data.aircraft !== null}
        <MenuForm.FormHeader title={`${data.aircraft.registration} - ${data.aircraft.type.make} ${data.aircraft.type.model}`}>
          <Stats values={[
            {title: 'Total Legs', value: data.aircraft._count.legs.toLocaleString()},
            {title: 'Avg. Leg Length', value: '00:00'},
            {title: 'Diversion %', value: '0%'}
          ]}/>
          <MenuForm.Link theme='FormHeader' href={`/aircraft/type/${data.aircraft.type.id}?active=form&ref=/aircraft/entry/${data.aircraft.id}?active=form`} icon={icons.circleStack} text={`Edit ${data.aircraft.type.make} ${data.aircraft.type.model} Type`} />
        </MenuForm.FormHeader>
      {/if}


      <Section title="General" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
        <Select {form} uid={data.aircraft?.id ?? 'new-reg'} required={true} title="Type" name="type" options={data.typeOptions} placeholder={"Unset"} value={data.aircraft?.aircraftTypeId} update={update} />
        <Input {form} uid={data.aircraft?.id ?? 'new-reg'} required={true} title="Tail Number" name="tail" placeholder="N4321J" uppercase={true} update={update} value={(data.aircraft === null && reg !== null) ? reg :  data.aircraft?.registration} />
        <Input {form} uid={data.aircraft?.id ?? 'new-reg'} title="Year" name="year" placeholder="1969" update={update} validator={validate} useNumberPattern={true} value={data.aircraft?.year === null || data.aircraft?.year === undefined ? null : String(data.aircraft?.year)} />
        <Input {form} uid={data.aircraft?.id ?? 'new-reg'} title="Serial" name="serial" placeholder="1969-0-2-22" update={update} value={data.aircraft?.serial} />
      </Section>
      <Section title="Configuration">
        <Switch {form} uid={data.aircraft?.id ?? 'new-reg'} title="Simulator" name="sim" value={data.aircraft?.simulator ?? false} update={update} />
      </Section>
      <Section title="Aircraft Image" error={form !== null && form.ok === false && form.action === '?/default' && form.name === 'image' ? form.message : null}>
        <ImageUpload uid={data.aircraft?.id ?? 'new-reg'} name="image" imageRequired={data.aircraft === null} initialImageId={data.aircraft?.imageId ?? null} maxMB={data.MAX_MB} update={update}/>
      </Section>
      <Section title="Notes">
        <TextField uid={data.aircraft?.id ?? 'new-reg'} name="notes" placeholder="Enter Notes" value={data.aircraft?.notes} update={update} />
      </Section>

      <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
        {#if data.aircraft !== null}
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
            <input type="hidden" name="id" value={data.aircraft?.id} />
            <Submit class="w-full" failed={form?.ok === false && form.action === '?/default'} submitting={deleting} theme={{primary: 'red'}} actionText={'Delete'} actionTextInProgress={'Deleting'} />
          </form>
        {/if}
        {#if unsavedChanges}
          <button type="button" on:click={clearUnsaved} class="flex-grow w-full md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Clear</button>
          <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText={data.aircraft !== null ? 'Update' : 'Create'} actionTextInProgress={data.aircraft !== null ? 'Updating' : 'Creating'} />
        {/if}
      </div>
    </form>
  </div>

</TwoColumn>
