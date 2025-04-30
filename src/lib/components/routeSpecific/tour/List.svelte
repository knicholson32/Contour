<script lang="ts">
  import icons from '$lib/components/icons';


	interface Props {
		class?: string;
		action: string;
		confirmAction?: ((f: FormData) => boolean) | string | null;
		form?: { success: boolean; action: string; invalidatedParams?: boolean } | null;
		id?: string | null;
		remove?: (id: string) => void;
		submitting?: boolean;
		unsavedChanges?: boolean;
		title?: import('svelte').Snippet;
		description?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
	}

	let {
		class: classExport = '',
		action,
		confirmAction = null,
		form = null,
		id = null,
		remove = (id: string) => {},
		submitting = false,
		unsavedChanges = $bindable(false),
		title,
		description,
		children
	}: Props = $props();

	export const update = () => {
		unsavedChanges = true;
	};


	const clearChangesFlag = () => {
		if (form?.success === false && form?.action === action && form?.invalidatedParams !== false)
			unsavedChanges = true;
		else unsavedChanges = false;
	};
	
	$effect(() => {
		form?.success;
		clearChangesFlag();
	});
</script>

<!-- <form
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
> -->
	<div class="{classExport} border-b pb-6">
		<div class="flex items-center gap-x-2">
			<div class="max-w-md">
				<h2 class="text-lg font-semibold leading-7 text-gray-900">
					{#if title}{@render title()}{:else}Settings{/if}
					<!-- {#if unsavedChanges === true}
						<span class="text-gray-400 text-xxs uppercase ml-2"> Unsaved Changes </span>
					{/if} -->
				</h2>
				<p class="mt-1 text-sm leading-6 text-gray-500">
					{@render description?.()}
				</p>
			</div>
			<div class="flex-grow"></div>
			<div class="sm:mr-3 inline-flex gap-2 relative">				
				{#if id !== null}
					<button onclick={() => remove(id ?? '')} class="text-gray-400 ring-1 ring-gray-300 rounded-md p-1 hover:text-gray-800 hover:ring-gray-600">
						<svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" >
							{@html icons.x}
						</svg>
					</button>
				{/if}
				<!-- <slot name="button" />
				<Submit
					class="w-full sm:w-auto"
					theme={{ primary: 'white', done: 'white', fail: 'white' }}
					actionText={unsavedChanges ? 'Save' : 'Saved'}
					doneText="Saved"
					disabled={!unsavedChanges}
					hoverTitle={!unsavedChanges ? 'No changes to save' : ''}
					actionTextInProgress="Saving"
					{submitting}
					failed={form?.success === false && form?.action === action}
				/>
				{#if unsavedChanges === true}
					<span class="absolute flex h-3 w-3 -mt-1 -right-1">
						<span
							class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"
						/>
						<span class="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
					</span>
				{/if} -->
			</div>
		</div>
		<dl class="mt-6 xs:space-y-6 divide-y divide-gray-100 xs:border-t border-gray-200 text-sm leading-6">
			{@render children?.()}
		</dl>
	</div>
<!-- </form> -->
