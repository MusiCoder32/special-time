1. uni-id-pages-avatar.vue
```javascript
  //66行
setAvatarFile(avatar_file) {
    // 使用 clientDB 提交数据
    mutations.updateUserInfo({avatar_file,avatarUpdated:true})
}
```
2.     手动将微信编译后的uniad改为如下"uni-ad": {
   "version": "1.0.1",
   "provider": "wxf72d316417b6767f"
   },
3. uni-id-pages/common/store.js 44行增加avatarUpdate返回字段
4. uni-id-pages-user-profile.vue 40行增加是否存在avatarUrl的判断
