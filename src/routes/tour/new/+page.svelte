<script lang="ts">
  import OneColumn from '$lib/components/scrollFrames/OneColumn.svelte';
  import * as Entry from '$lib/components/entry';
  import * as MenuForm from '$lib/components/menuForm';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  let submitting = false;

  const formManager = new FormManager();
  const unsavedChanges = formManager.getUnsavedChangesStore();
  // const unsavedUIDs = formManager.getUnsavedUIDsStore();
  $: formManager.updateUID('new-tour');
  $: formManager.updateForm(form);

  let showAirportTZ: string | null;
  let apt: string | null;

</script>

<OneColumn>

  <div class="flex-shrink">
    <form method="post" enctype="multipart/form-data" use:enhance={() => {
      submitting = true;
      return async ({ update }) => {
        await update({ reset: false });
        submitting = false;
        setTimeout(() => {
          if (form?.ok !== false) formManager.clearUID(false);
        }, 1);
      };
    }}>

      <MenuForm.Title title="New Tour" />

      <Section title="General" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
        <Entry.AirportPicker required={true} title="Show Airport" name="show-airport" airports={data.airports} bind:value={apt} bind:tz={showAirportTZ} defaultValue={data.tourSettings['tour.defaultStartApt']} />
        <Entry.TimePicker required={true} title="Show Time" name="show-time" dateOnly={false} bind:autoTZ={showAirportTZ} defaultValue={null} />
      </Section>

      <Section title="Details">
        <Entry.Select required={true} title="Company" options={['NetJets']} placeholder="Unset" name="company" defaultValue={'NetJets'} />
        <Entry.Switch required={true} title="Line Check" name="line-check" defaultValue={false} />
      </Section>
      <Section title="Notes">
        <Entry.TextField name="notes" placeholder="Enter Notes" defaultValue={null} />
      </Section>

      <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
        {#if $unsavedChanges}
          <button type="button" on:click={() => clearUID(true)} class="flex-grow w-full md:w-48 md:flex-grow-0 touch-manipulation select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Clear</button>
        {/if}
        <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText="Create" actionTextInProgress="Creating" />
      </div>
    </form>
  </div>

</OneColumn>