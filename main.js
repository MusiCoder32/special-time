import App from './App'
import { createSSRApp } from 'vue'
import * as Pinia from 'pinia'
import { pinia } from './utils/stores'

export function createApp() {
    const app = createSSRApp(App)
    app.use(pinia)
    return {
        app,
        Pinia, // 此处必须将 Pinia 返回
    }
}

//  appId: 'wxaa7dc591ce7b3ea0',
//     secret: 'ff481854d47c9dfcb93528231464ab21',
