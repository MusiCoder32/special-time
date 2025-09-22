import App from './App'
import { createSSRApp } from 'vue'

export function createApp() {
    const app = createSSRApp(App)
    return { app }
}

//  appId: 'wxaa7dc591ce7b3ea0',
//     secret: 'ff481854d47c9dfcb93528231464ab21',


