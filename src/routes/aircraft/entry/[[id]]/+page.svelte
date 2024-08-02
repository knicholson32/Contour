<script lang="ts">
  import { enhance } from '$app/forms';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import TwoColumn from '$lib/components/scrollFrames/TwoColumn.svelte';
  import { icons } from '$lib/components';
  import { page } from '$app/stores';
  import Badge from '$lib/components/decorations/Badge.svelte';
  import * as MenuForm from '$lib/components/menuForm';
  import Stats from '$lib/components/decorations/Stats.svelte';
  import Tag from '$lib/components/decorations/Tag.svelte';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import * as Entry from '$lib/components/entry';
    import MenuElement from '$lib/components/menuForm/MenuElement.svelte';
    import type { API } from '$lib/types';
    import { ListOrdered, Search } from 'lucide-svelte';

  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  const formManager = new FormManager();
  const unsavedChanges = formManager.getUnsavedChangesStore();
  const unsavedUIDs = formManager.getUnsavedUIDsStore();
  $: formManager.updateUID(data.aircraft?.id ?? 'new-reg');
  $: formManager.updateForm(form);

  /**
   * Trigger whenever the page URL is updated
   */
  $:{
    $page.url.pathname;
    data.aircraft?.id;
    // if (data.aircraft?.id !== undefined) updateDefaults(data.aircraft.registration);
    checkRegistrationExists();
  }


  let urlActiveParam: string;
  let isMobileSize: boolean;

  let selectedReg: string | null;
  let registrationExists = false;

  // const lookupYear = data.lookupYear;
  // const lookupSerial = data.lookupSerial;

  const checkRegistrationExists = async () => {
    if (selectedReg !== null && selectedReg !== undefined && selectedReg.trim().toUpperCase() !== data.aircraft?.registration && data.tails.includes(selectedReg.trim().toUpperCase())) {
      registrationExists = true;
    } else {
      registrationExists = false;
    }

    if (reg !== null) {
      if (selectedReg !== undefined && selectedReg !== null) {
        const res = await (await fetch(`/api/aircraft/faa/${selectedReg}`)).json() as API.Response;
        if (res.ok === true) {
          const regInfo = res as API.FAAReg;
          data.lookupYear = regInfo.aircraft.manufactureYear.toFixed(0);
          data.lookupSerial = regInfo.aircraft.serial;
        }
      } else {
        data.lookupYear = null;
        data.lookupSerial = null;
      }
    }
  }

  const validate = (text: string): boolean => {
    return /^[0-9]?[0-9]?[0-9]?[0-9]?$/.test(text)
  }

  let submitting = false;
  let deleting = false;

  $:ref = $page.url.searchParams.get('ref');
  $:reg = $page.url.searchParams.get('reg');

  let sim: boolean;



</script>

<TwoColumn {ref} menu="scroll" form="scroll" bind:urlActiveParam bind:isMobileSize backText="Back">

  <!-- Menu Side -->
  <nav slot="menu" class="flex-shrink dark:divide-zinc-800" aria-label="Directory">
    <MenuForm.Title title="Aircraft Definitions" />
    {#if ref !== null}
      <MenuForm.Link href={ref} icon={icons.chevronLeft} text="Go Back" type={'left'} />
    {/if}
    <MenuForm.Link href={'/aircraft/type' + $page.url.search} icon={icons.circleStack} text="View Aircraft Types" type={'right'} selected={$page.url.pathname.endsWith('type/new') && !isMobileSize} />
    {#if data.orderGroups.length === 0}
      <MenuForm.BlankMenu href={'/aircraft/entry/new?' + urlActiveParam} title="No aircraft" subtitle="Get started by creating a new aircraft." buttonText="New Aircraft" />
    {:else}
      <MenuForm.Link href={'/aircraft/entry/new?' + urlActiveParam} icon={icons.plus} text="Create a new aircraft" type={'right'} selected={$page.url.pathname.endsWith('entry/new') && !isMobileSize} />
      <MenuForm.SearchBar />
      {#each data.orderGroups as group (group.typeCode)}
        <Section title={group.typeCode} subtitle={`${group.regs.length} Aircraft`} collapsable={true} >
          {#each group.regs as ac (ac.id)}
            <MenuElement href="/aircraft/entry/{ac.id}?{urlActiveParam}" selected={ac.id === data.params.id && !isMobileSize}>
              {#if ac.imageId !== null}
                <div class="h-6 w-6 flex-none flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 dark:bg-transparent">
                  <Badge class="h-full">{ac._count.legs}</Badge>
                </div>
              {:else if ac.type.imageId !== null}
                <div class="h-6 w-6 flex-none flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 dark:bg-transparent">
                  <Badge class="h-full">{ac._count.legs}</Badge>
                </div>
              {:else}
                <div class="h-6 w-6 flex-shrink-0 rounded-lg bg-gray-300 text-black uppercase font-mono text-xxs overflow-hidden text-ellipsis whitespace-nowrap flex items-center justify-center">
                  {ac.registration.substring(0, (ac.registration.length < 2 ? ac.registration.length : 3))}
                </div>
              {/if}
              <div class="flex flex-col gap-0.5 overflow-hidden flex-initial">
                <div class="uppercase inline-flex items-center gap-1 font-bold text-xs overflow-hidden whitespace-nowrap text-ellipsis">
                  {ac.registration}
                  {#if $unsavedUIDs.includes(ac.id)}
                    <Tag>UNSAVED</Tag>
                  {:else if ac.simulator === true}
                    <Tag>SIM</Tag>
                  {/if}
                </div>
              </div>
              <div class="flex-grow"></div>
              <span class="text-xxs text-gray-400">{data.aircraftTimes[ac.id]}hr</span>
              <svg class="h-4 w-4 shrink-0 flex-nowrap" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
                {@html icons.chevronRight}
              </svg>
            </MenuElement>
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
        setTimeout(() => {
          if (form?.ok !== false) formManager.clearUID(false);
        }, 1);
      };
    }}>


      {#if data.aircraft !== null}
        <MenuForm.FormHeader title={`${data.aircraft.registration} - ${data.aircraft.type.make} ${data.aircraft.type.model}`}>
          <Stats values={[
            {title: 'Total Legs', value: data.aircraft._count.legs.toLocaleString(), href: `/entry/leg?active=form&search=${data.aircraft.registration}`},
            {title: 'Total Flight Time', value: data.aircraftTimes[data.aircraft.id] + ' hr'},
            {title: 'Avg. Leg Length', value: data.avgLegLen.toFixed(1) + ' hr'},
            {title: 'Diversion %', value: (data.diversionPercent * 100).toFixed(0) + '%'}
          ]}/>
          <MenuForm.Link theme='FormHeader' href={`/aircraft/type/${data.aircraft.type.id}?active=form&ref=/aircraft/entry/${data.aircraft.id}?active=form`} icon={icons.circleStack} text={`Edit ${data.aircraft.type.make} ${data.aircraft.type.model} Type`} />
          <MenuForm.Link theme='FormHeader' href={`/entry/leg?active=form&search=${data.aircraft.registration}`} text={`See Legs for this Aircraft`}>
            <Search class="w-3 h-3 text-white"/>
          </MenuForm.Link>
        </MenuForm.FormHeader>
      {/if}

      <Section title="General" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
        <Entry.Select required={true} title="Type" name="type" options={data.typeOptions} placeholder={"Unset"} defaultValue={data.aircraft?.aircraftTypeId ?? null} />
        <Entry.Input required={true} title="Tail Number" name="tail" placeholder="N4321J" uppercase={true} error={registrationExists ? 'Already exists' : ''} update={checkRegistrationExists} bind:value={selectedReg} defaultValue={(data.aircraft === null && reg !== null) ? reg : data.aircraft?.registration ?? null} />
        <Entry.Input title="Year" name="year" placeholder={data.lookupYear ?? 'Unknown'} validator={validate} useNumberPattern={true} defaultValue={data.aircraft?.year === null || data.aircraft?.year === undefined ? (reg === null ? null : data.lookupYear) : String(data.aircraft?.year)} />
        <Entry.Input title="Serial" name="serial" placeholder={data.lookupSerial ?? 'Unknown'} defaultValue={data.aircraft?.serial ?? (reg === null ? null : data.lookupSerial)} />
      </Section>
      <Section title="Configuration">
        <Entry.Switch title="Simulator" name="sim" defaultValue={data.aircraft?.simulator ?? false} bind:value={sim} />
        {#if sim}
          <Entry.Select required={true} title="Sim Type" name="sim-type" options={data.simTypeOptions} defaultValue={data.aircraft?.simulatorType ?? 'ATD'} />
        {/if}
      </Section>
      <Section title="Aircraft Image" error={form !== null && form.ok === false && form.action === '?/default' && form.name === 'image' ? form.message : null}>
        <Entry.ImageUpload name="image" imageRequired={data.aircraft === null} initialImageId={data.aircraft?.imageId ?? null} maxMB={data.MAX_MB}/>
      </Section>
      <Section title="Notes">
        <Entry.TextField name="notes" placeholder="Enter Notes" defaultValue={data.aircraft?.notes ?? null} />
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
                if (form?.ok !== false) formManager.clearUID(false);
              };
            }
          }}>
            <input type="hidden" name="id" value={data.aircraft?.id} />
            <Submit class="w-full" failed={form?.ok === false && form.action === '?/default'} submitting={deleting} theme={{primary: 'red'}} actionText={'Delete'} actionTextInProgress={'Deleting'} />
          </form>
        {/if}
        {#if $unsavedChanges || data.params.id === 'new'}
          <button type="button" on:click={() => clearUID()} class="flex-grow w-full md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Clear</button>
          <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" disabled={registrationExists} failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText={data.aircraft !== null ? 'Update' : 'Create'} actionTextInProgress={data.aircraft !== null ? 'Updating' : 'Creating'} />
        {/if}
      </div>
    </form>
  </div>

</TwoColumn>
