import { ref } from 'vue'
export function debounce(func, wait) {
    let timer
    wait = wait || 500
    return function () {
        let context = this
        let args = arguments
        if (timer) clearTimeout(timer)
        let callNow = !timer
        timer = setTimeout(() => {
            timer = null
        }, wait)
        if (callNow) func.apply(context, args)
    }
}

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
