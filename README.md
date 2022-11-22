1. uni-id-pages-avatar.vue
```javascript
  //66行
setAvatarFile(avatar_file) {
    // 使用 clientDB 提交数据
    mutations.updateUserInfo({avatar_file,avatarUpdated:true})
}
```
2. uni-forms/components/uni-forms/uni-forms.vue删除setRule方法
3. uni-id-pages/common/store.js 44行增加avatarUpdate返回字段
