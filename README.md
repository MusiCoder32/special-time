注意事项：
1. 需具备uniCloud相关知识，绑定云函数空间，上传云函数，上传DB schema;
2. 需在微信公众平台注册一个小程序；
3. 全局搜索'自己的appid'与'自己的secret'，替换成自己的；
4. 由于激励视频与小程序appid绑定，且会导致小程序无法启动，故代码中将该部分注释了。可在申请了自己的激励视频appid后放开，想体验激励视频效果可扫下方二维码，在个人中心中点击时光币；
5. hbuilder中使用vue3版本，vue2有点问题；
6. 不要更新uni_modules，uni-forms在vue3环境下存在异常，本人做了些调整。如果更新，可能会存在bug;
7. wx4a5ed7f7fc719f98 d84b16d5dae43c848d7260e4d6e22159

### uniModule中更改代码记录
1. uni-id-pages中uni_modules/uni-id-pages/common/store.js中第42行增加了my_invite_code,userType,id存在userInfo中
2. uni_modules/uni-id-pages/components/uni-id-pages-fab-login/uni-id-pages-fab-login.vue中注释335行附近的uni.showLoading

### 待开发任务
