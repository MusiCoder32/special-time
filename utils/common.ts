import { ref } from 'vue'


export function tipFactory(storage: string, showBool: ref<string>, closeFunctionName: ref<{func:string}>) {
    return function () {
        return new Promise((resolve) => {
            if (!uni.getStorageSync(storage)) {
                showBool.value = 1
                uni.setStorage({
                    key: storage,
                    data: 1,
                })
                closeFunctionName.value.func = () => {
                    showBool.value = false
                    resolve()
                }
            } else {
                resolve()
            }
        })
    }
}
