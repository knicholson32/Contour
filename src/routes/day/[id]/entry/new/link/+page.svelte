<script lang="ts">
  import OneColumn from '$lib/components/scrollFrames/OneColumn.svelte';
  import * as Entry from '$lib/components/entry';
  import { FormManager, clearUID } from '$lib/components/entry/localStorage';
  import Section from '$lib/components/Section.svelte';
  import Submit from '$lib/components/buttons/Submit.svelte';
  import { enhance } from '$app/forms';
  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  let submitting = false;

  const formManager = new FormManager();
  $: formManager.updateUID('new-day-leg');
  $: formManager.updateForm(form);

  let noCache: boolean;

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

      <Section title="Flight Aware Link" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : null}>
        <Entry.Switch title="No Cache" name="no-cache" bind:value={noCache} defaultValue={false} />
        <Entry.Input required={noCache} uppercase={true} title="Flight ID" name="flight-id" placeholder="EJA762" defaultValue={null} />
        <Entry.Input required={true} title="Link" name="fa-link" placeholder="https://www.flightaware.com/live/flight/EJA762/history/20240114/1400Z/KAPF/KVNY" defaultValue={null} />
      </Section>

      <div class="inline-flex -mt-[2px] py-3 px-5 w-full flex-row gap-3 justify-end sticky bottom-0 z-10">
      <Submit class="flex-grow w-full md:w-48 md:flex-grow-0" failed={form?.ok === false && (form.action === '?/default' || form?.action === '*')} {submitting} theme={{primary: 'white'}} actionText="Next" actionTextInProgress="Creating" />
      </div>
    </form>
  </div>

</OneColumn>