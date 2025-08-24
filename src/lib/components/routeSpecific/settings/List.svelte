<script lang="ts">
	import { enhance } from '$app/forms';
	import { beforeNavigate } from '$app/navigation';
	import { Submit } from '$lib/components/buttons';
  import type { API } from '$lib/types';


	interface Props {
		class?: string;
		action: string;
		confirmAction?: ((f: FormData) => boolean) | string | null;
		form?: API.Form.Type | null;
		submitting?: boolean;
		unsavedChanges?: boolean;
		title?: import('svelte').Snippet;
		description?: import('svelte').Snippet;
		button?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
	}

	let {
		class: classExport = '',
		action,
		confirmAction = null,
		form = null,
		submitting = $bindable(false),
		unsavedChanges = $bindable(false),
		title,
		description,
		button,
		children
	}: Props = $props();

	export const update = () => {
		unsavedChanges = true;
	};


	const clearChangesFlag = () => {
		if (form?.ok === false && form?.action === action)
			unsavedChanges = true;
		else unsavedChanges = false;
	};

	$effect(() => {
		form?.ok;
		clearChangesFlag();
	});
</script>

<form
	method="POST"
	{action}
	use:enhance={({ cancel, formData }) => {
		if (confirmAction !== null) {
			if (typeof confirmAction === 'string' && !confirm(`Are you sure?\n\n${confirmAction}`)) {
				cancel();
				return;
			}
			if (typeof confirmAction === 'function' && !confirmAction(formData)) {
				cancel();
				return;
			}
		}
		submitting = true;
		return async ({ update }) => {
			submitting = false;
			clearChangesFlag();
			update({
				reset: false
			});
		};
	}}
>
	<div class="{classExport} border-b">
		<div class="flex items-center gap-x-2">
			<div class="max-w-md">
				<h2 class="text-lg font-semibold leading-7 text-gray-900 dark:text-white">
					{#if title}{@render title()}{:else}Settings{/if}
					{#if unsavedChanges === true}
						<span class="text-gray-400 text-xxs uppercase ml-2"> Unsaved Changes </span>
					{/if}
				</h2>
				<p class="mt-1 text-sm leading-6 text-gray-500">
					{@render description?.()}
				</p>
			</div>
			<div class="grow"></div>
			<div class="sm:mr-3 inline-flex gap-2 relative">
				{@render button?.()}
				<Submit
					class="w-full sm:w-auto"
					theme={{ primary: 'white', done: 'white', fail: 'white' }}
					actionText={unsavedChanges ? 'Save' : 'Saved'}
					doneText="Saved"
					disabled={!unsavedChanges}
					hoverTitle={!unsavedChanges ? 'No changes to save' : ''}
					actionTextInProgress="Saving"
					{submitting}
					failed={form?.ok === false && form?.action === action}
				/>
				{#if unsavedChanges === true}
					<span class="absolute flex h-3 w-3 -mt-1 -right-1">
						<span
							class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"
						></span>
						<span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
					</span>
				{/if}
			</div>
		</div>
		<dl class="mt-6 space-y-6 divide-y divide-gray-100 dark:divide-zinc-800 border-t border-gray-200 dark:border-zinc-800 text-sm leading-6">
			{@render children?.()}
		</dl>
	</div>
</form>
