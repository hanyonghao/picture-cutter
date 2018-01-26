# picture-cutter v1.0

- 支持AMD、CMD、CommenJS和直接引用
- 画布宽高等同于实例化时容器的宽高
- 目前只支持画布内的图片移动和缩放手势

## 使用方法

### 实例化

```
// 实例化时支持直接传入节点或者CSS选择器
let pc = new PictureCutter(Element); // 添加画布和事件绑定
```

### 实例方法

- pc.setImageData(Base64); // 通过base64设置图片
- pc.setImage(ImageElement); // 通过图片节点设置图片
- pc.getImageData(); // 获取图片的base64
- pc.getImage(); // 获取图片节点
- pc.reset(); // 重置图片位置和缩放率
- pc.clear(); // 清除图片
- pc.resize(); // 重置画布尺寸
- pc.destroy(); // 移除画布，解除事件绑定
- pc.reinstall(Element); // Element为容器节点（可选），不传则默认为实例化节点，重新安装画布和事件绑定

## 下个版本

- 自定义裁剪宽高
- 图片可旋转
- 打包编译ES6
- 发布到npm上