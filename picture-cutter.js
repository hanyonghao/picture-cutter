;(function() {

	class PictureCutter {

		get hasContainer() {
			return !!this.$el;
		}

		get hasCanvas() {
			return !!this.$canvas;
		}

		get hasImage() {
			return !!this.$image;
		}

		get isReady() {
			return this.hasContainer && this.hasCanvas && this.hasImage && !!this.drawParams;
		}

		get isTouching() {
			return !!this.touchParams;
		}

		// 构造函数
		constructor(el) {

			// 为了让this指向该实例，用箭头函数封装了一层，同时也便于移除事件监听
			this.touchStartHandler = (e) => this._touchStart(e);
			this.touchMoveHandler = (e) => this._touchMove(e);
			this.touchEndHandler = (e) => this._touchEnd(e);

			this._setContainer(el); // 设置容器

			this._install();
		}

		// 创建canvas，添加事件监听
		_install() {

			if (!this.hasContainer || this.hasCanvas) {
				return;
			}

			// 创建canvas节点
			this.$canvas = document.createElement('canvas');

			this.$canvas.width = this.canvasWidth = this.$el.clientWidth;
			this.$canvas.height = this.canvasHeight = this.$el.clientHeight;

			this.$el.appendChild(this.$canvas);

			// 保存画布
			this.canvasContext = this.$canvas.getContext('2d');

			// 添加事件监听
			this.$canvas.addEventListener('touchstart', this.touchStartHandler);
			document.addEventListener('touchmove', this.touchMoveHandler);
			document.addEventListener('touchend', this.touchEndHandler);

		}

		// 初始化画布
		_init() {

			if (!(this.hasCanvas && this.hasImage)) {
				return;
			}

			let self = this;

			// 计算最小缩放率
			let minScale = this._computeMinScale();

			// 画布参数
			this.drawParams = {
				scale: minScale,
				minScale: minScale,
				maxX: 0,
				maxY: 0,
				get computeWidth() {
					return self.drawParams.scale * self.imgWidth;
				},
				get computeHeight() {
					return self.drawParams.scale * self.imgHeight;
				},
				get minX() {
					return -(self.drawParams.computeWidth - self.canvasWidth);
				},
				get minY() {
					return -(self.drawParams.computeHeight - self.canvasHeight);
				}
			};

			// 让图像初始显示为居中
			this.drawParams.x = this.drawParams.minX / 2;
			this.drawParams.y = this.drawParams.minY / 2;

			this._draw();
		}

		// 更新canvas
		_draw() {

			if (!this.isReady) {
				return;
			}

			// 不允许小于最小缩放率
			if (this.drawParams.scale < this.drawParams.minScale) {
				this.drawParams.scale = this.drawParams.minScale;
			}

			// 不允许移除图片x坐标范围
			if (this.drawParams.x > this.drawParams.maxX) {
				this.drawParams.x = this.drawParams.maxX;
			} else if (this.drawParams.x < this.drawParams.minX) {
				this.drawParams.x = this.drawParams.minX;
			}

			// 不允许移除图片y坐标范围
			if (this.drawParams.y > this.drawParams.maxY) {
				this.drawParams.y = this.drawParams.maxY;
			} else if (this.drawParams.y < this.drawParams.minY) {
				this.drawParams.y = this.drawParams.minY;
			}

			// 清空画布
			this.canvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

			// 绘制图画
			this.canvasContext.drawImage(this.$image, this.drawParams.x, this.drawParams.y, this.drawParams.computeWidth, this.drawParams.computeHeight);
		}

		// 设置容器
		_setContainer(el) {
			// 必须要一个容器节点，如果传入的是选择器，则查找节点
			if (!el) {
				throw new Error('EmptyError: no element.');
			} else if (typeof el === 'string') {
				el = document.querySelector(el);
			}

			this.$el = el; // 保存当前容器

		}

		// 计算两点之间的中点
		_computeCenter(pointA, pointB, offsetX = -this.$canvas.offsetTop, offsetY = -this.$canvas.offsetLeft) {
			return {
				x: (pointA.x + pointB.x) / 2 + (offsetX || 0),
				y: (pointA.y + pointB.y) / 2 + (offsetY || 0)
			};
		}

		// 计算两点之间的距离
		_computeDistance(pointA, pointB) {
			return Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2));
		}

		// 计算最小缩放率
		_computeMinScale() {
			let widthScale = this.canvasWidth / this.imgWidth;
			let heightScale = this.canvasHeight / this.imgHeight;
			return widthScale > heightScale ? widthScale : heightScale;
		}

		// 开始触摸事件，同时也用于更新触摸点参数
		_touchStart(e) {

			if (!this.isReady) {
				return;
			}

			// 防止移动图片同时触发滚动条滚动
			if (e.type === 'touchstart') {
				e.preventDefault();
			}

			this.touchParams = {
				count: e.targetTouches.length, // 触摸点数
				touches: e.targetTouches, // 触摸点对象
				positions: [...e.targetTouches].map((touch) => {
					return {
						x: touch.clientX,
						y: touch.clientY
					};
				}) // 触摸点位置，targetTouches不属于数组对象，因此需要重新合并
			};

			// 如果是双指触摸
			if (this.touchParams.count === 2) {
				// 两点的中心点
				this.touchParams.center = this._computeCenter(this.touchParams.positions[0], this.touchParams.positions[1]);

				// 两点的距离
				this.touchParams.distance = this._computeDistance(this.touchParams.positions[0], this.touchParams.positions[1]);
			}

		}

		// 触摸移动事件
		_touchMove(e) {

			if (!this.isTouching) {
				return;
			}

			// 单指拖动
			if (this.touchParams.count === 1) {
				let touch = e.targetTouches[0];
				let newPosition = {
					x: touch.clientX,
					y: touch.clientY
				};
				let oldPosition = this.touchParams.positions[0];

				// 设置新位置
				this.drawParams.x += newPosition.x - oldPosition.x;
				this.drawParams.y += newPosition.y - oldPosition.y;

			} else if (this.touchParams.count === 2) {
				let newPositions = [...e.targetTouches].map((touch) => {
					return {
						x: touch.clientX,
						y: touch.clientY
					};
				});
				let distance = this._computeDistance(newPositions[0], newPositions[1]);
				let center = this._computeCenter(newPositions[0], newPositions[1]);

				// 本次变化的缩放率
				let scale = distance / this.touchParams.distance;

				// 新位置 = 本次缩放率 * 之前的坐标 + 缩放中心坐标 * (1 - 本次缩放率) + 中心点的偏移
				this.drawParams.x = scale * this.drawParams.x + center.x * (1 - scale) + (center.x - this.touchParams.center.x);
				this.drawParams.y = scale * this.drawParams.y + center.y * (1 - scale) + (center.y - this.touchParams.center.y);

				// 合并新的缩放率
				this.drawParams.scale *= scale;

			}

			this._touchStart(e); // 重置当前触摸参数

			this._draw();
		}

		_touchEnd(e) {
			if (e.targetTouches.length === 0) { // 如果没有触摸点则清空触摸参数
				this.touchParams = null;
			} else { // 还有其他触摸点，则重置当前触摸参数
				this._touchStart(e);
			}
		}

		// 设置画布中的图片，可传base64或URL链接
		setImageData(data) {
			let img = new Image();
			img.src = data;
			img.onload = () => {
				this.setImage(img);
			};
		}

		// 设置画布中的图片，传imageElement
		setImage(img) {
			this.$image = img;
			this.imgWidth = img.width;
			this.imgHeight = img.height;
			this._init();
		}

		// 获取base64
		getImageData() {
			if (this.isReady) {
				return this.$canvas.toDataURL('image/png');
			}
		}

		// 获取imageElement
		getImage() {
			let src = this.getImageData();
			if (src) {
				let img = new Image();
				img.src = src;
				return img;
			}
		}

		// 重新安装，可选择更换容器
		reinstall(el) {
			if (el) {
				this.destroy();
				this._setContainer(el);
			}
			this._install();
		}

		// 重置图片位置和缩放率
		reset() {
			if (this.isReady) {
				this._init();
			}
		}

		// 清空图片数据和画布
		clear() {
			if (this.isReady) {
				this.$image = null;
				this.drawParams = null;
				this.canvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
			}
		}

		// 销毁
		destroy() {
			this.clear();

			document.removeEventListener('touchmove', this.touchMoveHandler);
			document.removeEventListener('touchend', this.touchEndHandler);

			if (this.hasCanvas) {
				this.$canvas.removeEventListener('touchstart', this.touchStartHandler);
				this.$canvas.remove();
				this.$canvas = null;
				this.canvasContext = null;
			}

		}

		// 重置尺寸
		resize() {
			if (this.hasCanvas && this.hasContainer) {
				this.$canvas.width = this.canvasWidth = this.$el.clientWidth;
				this.$canvas.height = this.canvasHeight = this.$el.clientHeight;

				if (this.isReady) {
					this.drawParams.minScale = this._computeMinScale();
					this._draw();
				}

			}
		}

	}

	// 兼容cmd、cmd、commonjs和原生使用
	if (typeof module !== 'undefined' && typeof exports === 'object') {
		module.exports = PictureCutter;
	} else if (typeof define === 'function' && (define.amd || define.cmd)) {
		define(function() {
			return PictureCutter;
		});
	} else if (window) {
		window.PictureCutter = PictureCutter;
	}
})();