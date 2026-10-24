<script lang="ts">
	import Button from './Button.svelte';
	import Modal from './Modal.svelte';

	interface Props {
		open: boolean;
		title: string;
		text: string;
		confirmLabel?: string;
		onconfirm: () => void;
	}

	let { open = $bindable(), title, text, confirmLabel = 'Eliminar', onconfirm }: Props = $props();
</script>

<Modal bind:open {title} description={text} size="sm">
	{#snippet footer()}
		<Button variant="secondary" block onclick={() => (open = false)}>Cancelar</Button>
		<Button
			variant="danger"
			block
			onclick={() => {
				open = false;
				onconfirm();
			}}>{confirmLabel}</Button
		>
	{/snippet}
</Modal>
