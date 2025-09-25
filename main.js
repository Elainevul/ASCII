import * as THREE from 'three';
import { AsciiEffect } from 'three/addons/effects/AsciiEffect.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

let camera, controls, scene, renderer, effect;

let asciiText, plane;

const start = Date.now();

// 鼠标跟随动画相关变量
let mouseTrail = []; // 存储鼠标轨迹点
let mouseTrailGroup = new THREE.Group(); // 鼠标轨迹组
let raycaster = new THREE.Raycaster(); // 添加射线检测器
let mouse = new THREE.Vector2(); // 添加鼠标位置

// 画笔效果相关变量
let brushGroup = new THREE.Group(); // 画笔轨迹组
let brushPoints = []; // 存储画笔点
let isDrawing = false; // 是否正在绘制
let lastBrushPoint = null; // 上一个画笔点
let brushEffect; // 画笔专用的AsciiEffect

// 鼠标悬停效果相关变量
let isHovering = false; // 是否正在悬停
let hoverTarget = null; // 悬停的目标
let originalPosition = new THREE.Vector3(); // 原始位置
let targetPosition = new THREE.Vector3(); // 目标位置
let hoverStartTime = 0; // 悬停开始时间
let hoverDuration = 1000; // 悬停动画持续时间（毫秒）
let hoverDetectionPlane = null; // 悬停检测平面
let originalRotation = new THREE.Euler(); // 原始旋转状态
let hoverRotation = new THREE.Euler(); // 悬停时的旋转状态
let hoverEndTime = 0; // 悬停结束时间
let recoveryDelay = 300; // 恢复延迟时间（毫秒）

init();

function init() {

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.y = 150;
	camera.position.z = 500;

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0, 0, 0 );

	// 添加鼠标轨迹组到场景
	scene.add(mouseTrailGroup);
	
	// 添加画笔组到场景
	scene.add(brushGroup);
	
	// 初始化时间显示
	updateTime();
	setInterval(updateTime, 1000);

	const pointLight1 = new THREE.PointLight( 0xffffff, 3, 0, 0 );
	pointLight1.position.set( 500, 500, 500 );
	scene.add( pointLight1 );

	const pointLight2 = new THREE.PointLight( 0xffffff, 1, 0, 0 );
	pointLight2.position.set( - 500, - 500, - 500 );
	scene.add( pointLight2 );

	// 加载字体并创建3D ASCII文字
	const fontLoader = new FontLoader();
	fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
		// 创建3D ASCII文字几何体
		const textGeometry = new TextGeometry('ASCII', {
			font: font,
			size: 250, // 从300调整到250
			height: 100, // 从120调整到100
			curveSegments: 12,
			bevelEnabled: true,
			bevelThickness: 10, // 从12调整到10
			bevelSize: 5, // 从6调整到5
			bevelOffset: 0,
			bevelSegments: 5
		});
		
		// 计算几何体的中心点
		textGeometry.computeBoundingBox();
		const centerOffsetX = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
		const centerOffsetY = -0.5 * (textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y);
		const centerOffsetZ = -0.5 * (textGeometry.boundingBox.max.z - textGeometry.boundingBox.min.z);
		
		// 将几何体移动到原点
		textGeometry.translate(centerOffsetX, centerOffsetY, centerOffsetZ);
		
		asciiText = new THREE.Mesh( textGeometry, new THREE.MeshPhongMaterial( { flatShading: true } ) );
		// 现在文字已经在场景中心，旋转会以文字中心为轴心
		// asciiText.rotation.z = -Math.PI / 6; // 向左倾斜30度
		scene.add( asciiText );
		
		// 保存原始位置和旋转状态
		originalPosition.copy(asciiText.position);
		originalRotation.copy(asciiText.rotation);
		
		// 创建悬停检测平面 - 比文字稍大一些
		const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
		const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
		const textDepth = textGeometry.boundingBox.max.z - textGeometry.boundingBox.min.z;
		
		hoverDetectionPlane = new THREE.Mesh(
			new THREE.BoxGeometry(textWidth * 1.2, textHeight * 1.2, textDepth * 1.2),
			new THREE.MeshBasicMaterial({ 
				transparent: true, 
				opacity: 0, // 完全透明
				side: THREE.DoubleSide
			})
		);
		hoverDetectionPlane.position.copy(asciiText.position);
		hoverDetectionPlane.visible = false; // 在开发时可以设为true来调试
		scene.add(hoverDetectionPlane);
	});

	// Plane - 改为屏幕墙，放在文字后面
	plane = new THREE.Mesh( new THREE.PlaneGeometry( 3000, 2000 ), new THREE.MeshBasicMaterial( { color: 0x404040 } ) );
	plane.position.z = -200; // 放在文字后面更远
	plane.position.y = 0; // 与文字同高度
	plane.rotation.y = Math.PI /30; // 稍微倾斜一点
	scene.add( plane );

	// 添加半透明紫色平面
	const purplePlane = new THREE.Mesh( 
		new THREE.PlaneGeometry( 3000, 2000 ), 
		new THREE.MeshBasicMaterial( { 
			color: 0x800080, // 紫色
			transparent: true,
			opacity: 0.3 // 30%透明度
		} ) 
	);
	purplePlane.position.z = -50; // 放在灰色平面前面
	purplePlane.position.y = 0;
	purplePlane.rotation.y = Math.PI /30; // 与灰色平面相同的倾斜角度
	scene.add( purplePlane );

	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setAnimationLoop( animate );

	effect = new AsciiEffect( renderer, ' .:-+*=%@#', { invert: true } );
	effect.setSize( window.innerWidth, window.innerHeight );
	effect.domElement.style.color = 'magenta'; // 洋红色文字
	effect.domElement.style.backgroundColor = 'yellow'; // 黄色背景
	effect.domElement.style.fontFamily = 'monospace';
	effect.domElement.style.fontSize = '28px'; // 从32px调整到28px
	effect.domElement.style.lineHeight = '28px'; // 从32px调整到28px
	effect.domElement.style.letterSpacing = '1px'; // 添加字符间距
	
	// 创建画笔专用的AsciiEffect
	brushEffect = new AsciiEffect( renderer, ' █▓▒░', { invert: false } );
	brushEffect.setSize( window.innerWidth, window.innerHeight );
	brushEffect.domElement.style.position = 'absolute';
	brushEffect.domElement.style.top = '0';
	brushEffect.domElement.style.left = '0';
	brushEffect.domElement.style.color = 'magenta'; // 改为洋红色
	brushEffect.domElement.style.backgroundColor = 'transparent';
	brushEffect.domElement.style.fontFamily = 'monospace';
	brushEffect.domElement.style.fontSize = '28px'; // 从32px调整到28px
	brushEffect.domElement.style.lineHeight = '28px'; // 从32px调整到28px
	brushEffect.domElement.style.letterSpacing = '1px'; // 添加字符间距
	brushEffect.domElement.style.pointerEvents = 'none'; // 不阻挡鼠标事件

	// Special case: append effect.domElement, instead of renderer.domElement.
	// AsciiEffect creates a custom domElement (a div container) where the ASCII elements are placed.

	document.body.appendChild( effect.domElement );
	document.body.appendChild( brushEffect.domElement );

	controls = new TrackballControls( camera, effect.domElement );
	
	// 完全禁用所有控制功能
	controls.enablePan = false; // 禁用平移
	controls.enableZoom = false; // 禁用缩放
	controls.enableRotate = false; // 禁用旋转
	controls.enabled = false; // 完全禁用控制器

	// 添加鼠标移动事件监听器
	effect.domElement.addEventListener('mousemove', onMouseMove);
	effect.domElement.addEventListener('mouseenter', onMouseEnter);
	effect.domElement.addEventListener('mouseleave', onMouseLeave);

	//

	window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
	effect.setSize( window.innerWidth, window.innerHeight );
	brushEffect.setSize( window.innerWidth, window.innerHeight );
	
	// 确保颜色和字体设置保持不变
	effect.domElement.style.color = 'magenta';
	effect.domElement.style.backgroundColor = 'yellow';
	effect.domElement.style.fontSize = '28px';
	effect.domElement.style.lineHeight = '28px';
	effect.domElement.style.letterSpacing = '1px';
	
	brushEffect.domElement.style.color = 'magenta'; // 改为洋红色
	brushEffect.domElement.style.fontSize = '28px';
	brushEffect.domElement.style.lineHeight = '28px';
	brushEffect.domElement.style.letterSpacing = '1px';

}

function onMouseMove(event) {
	// 计算鼠标位置
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	
	// 检测鼠标是否悬停在ASCII文字上
	checkHoverOnText();
	
	// 创建鼠标跟随动画
	createMouseTrail();
	
	// 创建画笔效果
	createBrushStroke();
}

function onMouseEnter(event) {
	// 鼠标进入画布时开始检测悬停
	checkHoverOnText();
}

function onMouseLeave(event) {
	// 鼠标离开画布时不再停止悬停效果
	// 移除了所有停止悬停的代码
}

function checkHoverOnText() {
	if (!asciiText) return;
	
	// 使用射线检测器检测鼠标是否悬停在文字上
	raycaster.setFromCamera(mouse, camera);
	
	// 检测文字本身
	const intersects = raycaster.intersectObject(asciiText);
	
	// 检测悬停检测平面
	let intersectsPlane = false;
	if (hoverDetectionPlane) {
		const planeIntersects = raycaster.intersectObject(hoverDetectionPlane);
		intersectsPlane = planeIntersects.length > 0;
	}
	
	// 获取文字的包围盒
	const boundingBox = new THREE.Box3().setFromObject(asciiText);
	
	// 创建射线来检测包围盒
	const ray = raycaster.ray;
	const intersectsBox = ray.intersectBox(boundingBox, new THREE.Vector3());
	
	if (intersects.length > 0 || intersectsBox || intersectsPlane) {
		// 鼠标悬停在文字上（包括洞内）
		if (!isHovering) {
			isHovering = true;
			hoverTarget = asciiText;
			hoverStartTime = Date.now();
		}
		
		// 计算目标位置 - 让文字跟随鼠标移动
		const offsetX = (mouse.x * 100); // 水平偏移
		const offsetY = (mouse.y * 50);  // 垂直偏移
		
		targetPosition.set(
			originalPosition.x + offsetX,
			originalPosition.y + offsetY,
			originalPosition.z
		);
	}
	// 移除了else分支，不再停止悬停效果
}

function animate() {

	const timer = Date.now() - start;

	// 检查是否暂停
	if (window.isPaused) {
		requestAnimationFrame(animate);
		return;
	}

	// 获取动画速度
	const animationSpeed = window.animationSpeed || 1;

	if (asciiText) {
		// 只有在没有悬停时才进行有规律的旋转
		if (!isHovering) {
			// 有规律的旋转：在固定角度范围内来回摆动，应用速度控制
			asciiText.rotation.y = Math.sin(timer * 0.001 * animationSpeed) * Math.PI / 4; // Y轴在-45°到+45°之间摆动
			asciiText.rotation.z = Math.sin(timer * 0.0008 * animationSpeed) * Math.PI / 6; // Z轴在-30°到+30°之间摆动
		}
		// 如果正在悬停，旋转由updateHoverEffect函数控制
	}
	
	// 更新鼠标轨迹动画
	updateMouseTrail();
	
	// 更新画笔效果动画
	updateBrushEffect();

	// 更新鼠标悬停动画
	updateHoverEffect();

	// 渲染主场景
	effect.render( scene, camera );
	
	// 渲染画笔场景
	brushEffect.render( brushGroup, camera );

}

function createMouseTrail() {
	// 创建射线检测鼠标在3D空间中的位置
	raycaster.setFromCamera(mouse, camera);
	
	// 创建一个虚拟平面来获取鼠标的3D位置
	const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
	const intersection = new THREE.Vector3();
	raycaster.ray.intersectPlane(plane, intersection);
	
	// 创建彩色的"%"符号
	const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff8800, 0x8800ff];
	const randomColor = colors[Math.floor(Math.random() * colors.length)];
	
	// 创建"%"符号的简单表示（两个圆点加一条斜线）
	const group = new THREE.Group();
	
	// 上面的圆点
	const topDot = new THREE.Mesh(
		new THREE.SphereGeometry(12, 16, 12), // 从8增加到12
		new THREE.MeshBasicMaterial({ color: randomColor, transparent: true, opacity: 0.8 })
	);
	topDot.position.set(-25, 25, 0); // 从-15,15增加到-25,25
	group.add(topDot);
	
	// 下面的圆点
	const bottomDot = new THREE.Mesh(
		new THREE.SphereGeometry(12, 16, 12), // 从8增加到12
		new THREE.MeshBasicMaterial({ color: randomColor, transparent: true, opacity: 0.8 })
	);
	bottomDot.position.set(25, -25, 0); // 从15,-15增加到25,-25
	group.add(bottomDot);
	
	// 中间的斜线
	const line = new THREE.Mesh(
		new THREE.BoxGeometry(40, 6, 6), // 从25,4,4增加到40,6,6
		new THREE.MeshBasicMaterial({ color: randomColor, transparent: true, opacity: 0.8 })
	);
	line.rotation.z = Math.PI / 4; // 45度角
	group.add(line);
	
	// 设置组的位置
	group.position.copy(intersection);
	group.position.z = 50; // 放在前面一点
	
	// 添加到轨迹组
	mouseTrailGroup.add(group);
	
	// 存储轨迹点信息
	mouseTrail.push({
		mesh: group,
		createdAt: Date.now()
	});
	
	// 限制轨迹点数量
	if (mouseTrail.length > 20) {
		const oldPoint = mouseTrail.shift();
		mouseTrailGroup.remove(oldPoint.mesh);
	}
}

function updateMouseTrail() {
	const currentTime = Date.now();
	
	// 更新每个轨迹点
	for (let i = mouseTrail.length - 1; i >= 0; i--) {
		const point = mouseTrail[i];
		const age = currentTime - point.createdAt;
		
		// 如果轨迹点太老，删除它
		if (age > 10) { // 2秒后删除
			mouseTrailGroup.remove(point.mesh);
			mouseTrail.splice(i, 1);
			continue;
		}
		
		// 添加淡出效果
		const opacity = Math.max(0, 1 - age / 10);
		
		// 遍历Group中的所有子对象，设置透明度
		point.mesh.children.forEach(child => {
			if (child.material) {
				child.material.opacity = opacity;
			}
		});
		
		// 添加轻微的浮动效果
		point.mesh.position.y += Math.sin(age * 0.01) * 0.1;
		point.mesh.rotation.z += 0.02;
	}
}

function createBrushStroke() {
	// 创建射线检测鼠标在3D空间中的位置
	raycaster.setFromCamera(mouse, camera);
	
	// 创建一个虚拟平面来获取鼠标的3D位置
	const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
	const intersection = new THREE.Vector3();
	raycaster.ray.intersectPlane(plane, intersection);
	
	// 设置画笔位置
	intersection.z = 100; // 放在前面一点
	
	// 创建画笔点 - 使用立方体而不是球体，在ASCII中更明显
	const brushPoint = new THREE.Mesh(
		new THREE.BoxGeometry(6, 6, 6), // 立方体
		new THREE.MeshBasicMaterial({ 
			color: 0xff00ff, // 改为洋红色
			transparent: true,
			opacity: 0.9 // 增加不透明度
		})
	);
	brushPoint.position.copy(intersection);
	
	// 添加到画笔组
	brushGroup.add(brushPoint);
	
	// 存储画笔点信息
	brushPoints.push({
		mesh: brushPoint,
		createdAt: Date.now()
	});
	
	// 如果有点，创建连接线 - 使用更粗的线条
	if (lastBrushPoint) {
		const lineGeometry = new THREE.BufferGeometry().setFromPoints([
			lastBrushPoint.position,
			intersection
		]);
		const lineMaterial = new THREE.LineBasicMaterial({ 
			color: 0xff00ff, // 改为洋红色
			transparent: true,
			opacity: 0.8, // 增加不透明度
			linewidth: 3 // 注意：在WebGL中linewidth可能不生效
		});
		const line = new THREE.Line(lineGeometry, lineMaterial);
		brushGroup.add(line);
		
		// 存储线条信息
		brushPoints.push({
			mesh: line,
			createdAt: Date.now()
		});
	}
	
	// 更新上一个点
	lastBrushPoint = brushPoint;
	
	// 限制画笔点数量
	if (brushPoints.length > 100) {
		const oldPoint = brushPoints.shift();
		brushGroup.remove(oldPoint.mesh);
	}
}

function updateBrushEffect() {
	const currentTime = Date.now();
	
	// 更新每个画笔点
	for (let i = brushPoints.length - 1; i >= 0; i--) {
		const point = brushPoints[i];
		const age = currentTime - point.createdAt;
		
		// 如果画笔点太老，删除它
		if (age > 500) { // 0.5秒后删除
			brushGroup.remove(point.mesh);
			brushPoints.splice(i, 1);
			continue;
		}
		
		// 添加淡出效果
		const opacity = Math.max(0, 1 - age / 500);
		
		// 设置透明度
		if (point.mesh.material) {
			point.mesh.material.opacity = opacity;
		}
		
		// 为画笔点添加轻微的浮动效果
		if (point.mesh.geometry instanceof THREE.BoxGeometry) {
			point.mesh.position.y += Math.sin(age * 0.02) * 0.2;
			point.mesh.rotation.y += 0.05;
			point.mesh.rotation.x += 0.03;
		}
	}
}

function updateHoverEffect() {
	if (!isHovering || !hoverTarget) return;

	const currentTime = Date.now();
	const elapsed = currentTime - hoverStartTime;

	// 使用缓动函数实现平滑的跟随效果
	const easing = 0.05; // 缓动系数，值越小移动越平滑
	
	// 计算当前位置到目标位置的插值
	hoverTarget.position.lerp(targetPosition, easing);
	
	// 让检测平面也跟随移动
	if (hoverDetectionPlane) {
		hoverDetectionPlane.position.copy(hoverTarget.position);
	}
	
	// 添加累积旋转效果 - 让旋转更明显
	const rotationSpeed = 0.01; // 增加旋转速度
	hoverTarget.rotation.x += mouse.y * rotationSpeed;
	hoverTarget.rotation.y += mouse.x * rotationSpeed;
	
	// 检测平面也跟随旋转
	if (hoverDetectionPlane) {
		hoverDetectionPlane.rotation.copy(hoverTarget.rotation);
	}
}

function updateTime() {
	const timeDisplay = document.getElementById('timeDisplay');
	if (timeDisplay) {
		const now = new Date();
		const timeString = now.toLocaleTimeString('en-US', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
		timeDisplay.textContent = timeString;
	}
}