<template>
	<picker-view :indicator-style="indicatorStyle" :value="value" @change="dateChange" :style="`height:${height}rpx`"
		class="picker-view">
		<picker-view-column>
			<view class="item" v-for="(item,index) in years" :key="index">{{item}}年</view>
		</picker-view-column>
		<picker-view-column>
			<view class="item" v-for="(item,index) in months" :key="index">{{item}}月</view>
		</picker-view-column>
		<picker-view-column>
			<view class="item" v-for="(item,index) in days" :key="index">{{item}}日</view>
		</picker-view-column>
	</picker-view>
</template>

<script setup>
	import {
		onMounted,
		reactive,
		ref
	} from "vue";
	const emit = defineEmits(['change'])
	const prop = defineProps({
		height: {
			type: Number,
			default: 400
		},
		yearLength:{
			type:Number,
			default:-100
		}
	})

	const date = new Date()
	const years = []
	
	const months = []
	let month = date.getMonth() + 1
	const days = []
	let day = date.getDate()

	if(prop.yearLength>0) {
		for (let i = date.getFullYear(); i <= date.getFullYear()+prop.yearLength; i++) {
			years.push(i)
		}
	} else {
		for (let i = date.getFullYear() +prop.yearLength; i <= date.getFullYear(); i++) {
			years.push(i)
		}
	}

	let year = years.slice(-1)[0]

	for (let i = 1; i <= 12; i++) {
		months.push(i)
	}
	for (let i = 1; i <= 31; i++) {
		days.push(i)
	}

	let value = ref([])
	const indicatorStyle = `height: 50px;`


	onMounted(() => {
		value.value = [year - 1, month - 1, day - 1]
		emit('change', {
			year,
			month,
			day
		})
	})

	function dateChange(e) {
		const val = e.detail.value
		year = years[val[0]]
		month = months[val[1]]
		day = days[val[2]]
		emit('change', {
			year,
			month,
			day
		})
	}
</script>

<style>
	.picker-view {
		width: 100%;
		margin-top: 20rpx;
	}

	.item {
		height: 50px;
		line-height: 50px;
		text-align: center;
	}
</style>
