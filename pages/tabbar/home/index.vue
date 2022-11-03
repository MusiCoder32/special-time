<template>
	<view>
		<unicloud-db v-slot:default="{data, loading, error, options}" collection="start-end-time" where="user_id==$cloudEnv_uid">
			<view v-if="error">{{error.message}}</view>
			<view v-else>
				{{data}}
			</view>
		</unicloud-db>
	</view>
</template>

<script setup>
	import {
		onBeforeMount,
		onMounted,
		reactive,
		ref
	} from 'vue'
	const prop = defineProps({
		data: {
			type: String,
		}
	})

	console.log(111, prop.data);
	const info = reactive(null)
	// init()
	async function init() {
		const db = uniCloud.database();
		uni.showLoading({
			mask: true
		})
		const {
			result: {
				errCode,
				data
			}
		} = await db.collection('start-end-time').where({
			user_id: db.getCloudEnv('$cloudEnv_uid')
		}).get()
		uni.hideLoading()
		if (errCode == 0) {
			if (data.length === 0) {
				uni.redirectTo({
					url: '/pages/tabbar/home/guide'
				});
			} else {
				info = data[0]
			}
		} else {
			uni.showToast({
				icon: 'none',
				title: errCode
			})
		}
	}
</script>
<style>
</style>
