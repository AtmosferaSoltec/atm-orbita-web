<script lang="ts">
	import { TONE_SOFT, type IconComponent, type Tone } from './types';

	interface Props {
		icon: IconComponent;
		tone?: Tone;
		size?: 'sm' | 'md' | 'lg';
		/** Custom color (e.g. a service color); overrides the tone. */
		color?: string;
	}

	let { icon: Icon, tone = 'primary', size = 'md', color }: Props = $props();

	const SIZES = {
		sm: 'size-9 rounded-xl',
		md: 'size-11 rounded-[14px]',
		lg: 'size-12 rounded-2xl'
	};
	const ICON = { sm: 17, md: 20, lg: 22 };
</script>

<span
	class="inline-flex shrink-0 items-center justify-center {SIZES[size]} {color
		? ''
		: TONE_SOFT[tone]}"
	style={color ? `background:${color}1a;color:${color}` : undefined}
	aria-hidden="true"
>
	<Icon size={ICON[size]} strokeWidth={1.9} />
</span>
