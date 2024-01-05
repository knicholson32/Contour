<script lang="ts">
  import Section from '$lib/components/routeSpecific/entry/framing/Section.svelte';
  import TextField from '$lib/components/routeSpecific/entry/TextField.svelte';
  import Select from '$lib/components/routeSpecific/entry/Select.svelte';
  import Input from '$lib/components/routeSpecific/entry/Input.svelte';
  import Switch from '$lib/components/routeSpecific/entry/Switch.svelte';
  import Button from '$lib/components/routeSpecific/entry/Button.svelte';
  import ImageUpload from '$lib/components/routeSpecific/entry/ImageUpload.svelte';
  import { Submit } from '$lib/components/buttons';
  import { enhance } from '$app/forms';

  export let data: import('./$types').PageData;
	export let form: import('./$types').ActionData;

  const typeDefaults = {
    complex: false,
    taa: false,
    hp: false,
    press: false
  }

  const setDefaults = (selectedItem: typeof data.types[0] | null = null) => {
    if (selectedItem === null) {
        typeDefaults.complex = false;
        typeDefaults.taa = false;
        typeDefaults.hp = false;
        typeDefaults.press = false;
      } else {
        typeDefaults.complex = selectedItem.complex;
        typeDefaults.taa = selectedItem.taa;
        typeDefaults.hp = selectedItem.highPerformance;
        typeDefaults.press = selectedItem.pressurized;
      }
      checkModified();
  }

  let selectedItem: typeof data.types[0] | null = null
  let lastSelectedItem: typeof data.types[0] | null = null
  let modified = false;

  const checkModified = () => {
    if (selectedItem !== null) modified = typeDefaults.complex !== selectedItem.complex || typeDefaults.taa !== selectedItem.taa || typeDefaults.hp !== selectedItem.highPerformance || typeDefaults.press !== selectedItem.pressurized;
  }

  const update = () => {
    console.log('update');
    console.log(aircraftType);
    selectedItem = null;
    for (const t of data.types) {
      if (aircraftType === t.id) {
        selectedItem = t;
        break;
      }
    }

    console.log(selectedItem);

    if (selectedItem !== lastSelectedItem) setDefaults(selectedItem);
    checkModified();

    lastSelectedItem = selectedItem;
  }

  let aircraftType: string = '';
  let advanced = false;
  $:{ 
    if (!advanced) setDefaults(selectedItem);
  }

  const validate = (text: string): boolean => {
    console.log(text);
    return /^[0-9]?[0-9]?[0-9]?[0-9]?$/.test(text)
  }

  let submitting = false;

  let tail: string | null = data.regDefault;


</script>



<form method="post" use:enhance={() => {
  submitting = true;
  return async ({ update }) => {
    await update({ reset: false });
    submitting = false;
  };
}}>

  <Section title="General" error={form !== null && form.ok === false && form.action === '?/default' && form.name === '*' ? form.message : ''}>
    <Select {form} required={true} title="Type" name="type" options={data.typeOptions} placeholder={"Unset"} bind:value={aircraftType} update={update} />
    <Input {form} error={data.tails.includes(tail ?? '') ? 'Registration already exists' : ''} required={true} title="Tail Number" name="tail" placeholder="N4321J" uppercase={true} update={update} bind:value={tail} />
    <Input {form} title="Year" name="year" placeholder="1969" update={update} validator={validate} useNumberPattern={true} />
    <Input {form} title="Serial" name="serial" placeholder="1969-0-2-22" update={update} />
  </Section>

  <Section title="Configuration">
    <Switch {form} title="Simulator" name="sim" update={update} />
    <Switch {form} disabled={selectedItem === null} title="Modify Type Defaults" name="advanced" update={update} bind:value={advanced} />
  </Section>

  <Section title="Type Defaults{modified ? '*' : ''}" visible={advanced}>
    <Switch {form} disabled={advanced === false} title="Complex" name="complex" bind:value={typeDefaults.complex} update={update} />
    <Switch {form} disabled={advanced === false} title="Technically Advanced" name="taa" bind:value={typeDefaults.taa} update={update} />
    <Switch {form} disabled={advanced === false} title="High Performance" name="hp" bind:value={typeDefaults.hp} update={update} />
    <Switch {form} disabled={advanced === false} title="Pressurized" name="press" bind:value={typeDefaults.press} update={update} />
    <Button disabled={advanced === false} title="Reset to Defaults" focus={() => setDefaults(selectedItem)} />
  </Section>  

  <Section title="Aircraft Image" error={form !== null && form.ok === false && form.action === '?/default' && form.name === 'image' ? form.message : null}>
    <ImageUpload name="image" maxMB={data.MAX_MB} initialImageId={selectedItem?.imageId ?? null} />
  </Section>
  <Section title="Notes">
    <TextField name="notes" placeholder="Enter Notes" />
  </Section>

  <div class="w-full h-10 bg-gray-100"></div>

  <div class=" inline-flex -mt-[2px] py-4 px-5 gap-4 w-full border-t flex-row justify-center sticky bottom-0 bg-white">
    <a href="/aircraft" class="touch-manipulation text-center flex-grow select-none transition-colors px-3 py-2 rounded-md text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ring-1 ring-inset ring-gray-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:ring-gray-200 bg-white text-gray-800 betterhover:hover:bg-gray-100 betterhover:hover:text-gray-900 focus-visible:outline-grey-500">Cancel</a>
    <Submit failed={form?.ok === false} class="flex-grow" {submitting} theme={{primary: 'white'}} actionText="Create" actionTextInProgress="Creating" />
  </div>

</form>