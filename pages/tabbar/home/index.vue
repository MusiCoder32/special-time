<template>
	<view>
		<view>{{a}}</view>
	</view>
</template>

<script setup>
	import guide from './guide.vue'
	import {
		ref
	} from 'vue'

	const a = ref('hellow')
</script>
<style>
</style>
