<script lang="ts">
  import Section from '$lib/components/Section.svelte';
  import TextField from '$lib/components/routeSpecific/entry/TextField.svelte';
  import Select from '$lib/components/routeSpecific/entry/Select.svelte';
  import Input from '$lib/components/routeSpecific/entry/Input.svelte';
  import Switch from '$lib/components/routeSpecific/entry/Switch.svelte';
  import Button from '$lib/components/routeSpecific/entry/Button.svelte';
  import ImageUpload from '$lib/components/routeSpecific/entry/ImageUpload.svelte';
  import { Submit } from '$lib/components/buttons';
  import { enhance } from '$app/forms';
    import OneColumn from '$lib/components/scrollFrames/OneColumn.svelte';

  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  let submitting = false;

  const validate = (text: string): boolean => {
    console.log(text);
    return /^[0-9]?[0-9]?[0-9]?[0-9]?$/.test(text)
  }

  const update = () => {
    console.log('update');
  };

  let tail: string;

</script>

<OneColumn>

  <form method="post" use:enhance={() => {
    submitting = true;
    return async ({ update }) => {
      await update({ reset: false });
      submitting = false;
    };
  }}>

    <Section title="General" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : ''}>
      <Select {form} required={false} title="Type" name="type" options={['Unset']} placeholder={"Unset"} update={update} />
      <Input {form} required={false} title="Tail Number" name="tail" placeholder="N4321J" uppercase={true} update={update} bind:value={tail} />
      <Input {form} title="Year" name="year" placeholder="1969" update={update} validator={validate} useNumberPattern={true} />
      <Input {form} title="Serial" name="serial" placeholder="1969-0-2-22" update={update} />
    </Section>

    <Section title="Configuration">
      <Switch {form} title="Simulator" name="sim" update={update} />
    </Section>

    <Section title="Aircraft Image" error={form !== null && form.ok === false && form.action === '?/default' && form.name === 'image' ? form.message : null}>
      <ImageUpload name="image" maxMB={data.MAX_MB} initialImageId={'myDefaultImageID'} />
    </Section>

    <Section title="Notes">
      <TextField name="notes" placeholder="Enter Notes" />
    </Section>
    <Section title="Notes">
      <TextField name="notes" placeholder="Enter Notes" />
    </Section>
    <Section title="Notes">
      <TextField name="notes" placeholder="Enter Notes" />
    </Section>
    <Section title="Notes">
      <TextField name="notes" placeholder="Enter Notes" />
    </Section>

    <div class="w-full h-10 bg-gray-100"></div>

    <div class="flex -mt-[2px] py-4 px-5 gap-4 w-full border-t flex-row justify-center sticky bottom-0 bg-white">
      <a href="/aircraft" class="touch-manipulation text-center flex-grow select-none px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ring-1 ring-inset ring-gray-300 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Cancel</a>
      <Submit failed={form?.ok === false} class="flex-grow" {submitting} theme={{primary: 'white'}} actionText="Create" actionTextInProgress="Creating" />
    </div>

  </form>

</OneColumn>