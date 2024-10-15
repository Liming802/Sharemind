import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import gsap from "gsap";
import * as CANNON from 'cannon-es';


import { ref, set, onValue } from "firebase/database";
import { db } from "./firebase"; // 正确导入 Firebase 数据库实例



const app3 = document.querySelector("#app");

// renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app3.appendChild(renderer.domElement);

// scene
const scene = new THREE.Scene();
scene.background = new THREE.Color("black");

// perspective camera
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 1, 500);
camera.position.set(5, 30, 20);
camera.lookAt(-10, 20, 0);

// ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.enableRotate = true;
controls.rotateSpeed = 0.5;
controls.enableZoom = true;

//限制左右旋转
controls.minAzimuthAngle = -Math.PI / 6;
controls.maxAzimuthAngle = Math.PI / 6;
controls.minPolarAngle = Math.PI / 2.5;
controls.maxPolarAngle = Math.PI / 2.5;
controls.minDistance = 10; 
controls.maxDistance = 30;
controls.minZoom = 1.0; 
controls.maxZoom = 5; 
controls.target = new THREE.Vector3(0, 4, 0); 

// directional light
const directionalLight = new THREE.DirectionalLight("white", 2);
directionalLight.position.set(50, 18, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 200;
directionalLight.shadow.camera.top = 40; 
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;

// Instantiate a loader
const loader = new GLTFLoader();
const bananaGroup = new THREE.Group();
scene.add(bananaGroup);

const clothesRef = ref(db, 'clothes');

const existingClothIds = new Set(); // 用于存储已加载的衣服ID

onValue(clothesRef, (snapshot) => {
  const data = snapshot.val();
  
  if (data) {
    Object.keys(data).forEach((clothId) => {
      if (!existingClothIds.has(clothId)) { 
        const clothData = data[clothId];
        loadCloth(clothId, clothData);
        existingClothIds.add(clothId); 
      }
    });
  }
});

let cloths = [];

function loadCloth(clothId, clothData) {
  loader.load("/1cloth-good.glb", function (gltf) {
    const cloth = gltf.scene;
    bananaGroup.add(cloth);
    cloth.scale.setScalar(0.3);

    // Set position and rotation
    cloth.position.set(clothData.position[0], clothData.position[1], clothData.position[2]);
    cloth.rotation.set(clothData.rotation[0], clothData.rotation[1], clothData.rotation[2]);

    // Set cloth material color safely
    cloth.traverse(function (el) {
      if (el.isMesh && el.material) {
        const color = new THREE.Color(clothData.color);
        el.material.color.set(color);
      }
    });

    // Add cloth to the scene
    scene.add(cloth);

    // Create a corresponding Cannon.js physics body
    const clothShape = new CANNON.Box(new CANNON.Vec3(1, 0.2, 1));
    const clothBody = new CANNON.Body({
      mass: 0.7,
      position: new CANNON.Vec3(clothData.position[0], clothData.position[1], clothData.position[2]),
    });
    
    // Set the quaternion for rotation safely
    clothBody.quaternion.setFromEuler(clothData.rotation[0], clothData.rotation[1], clothData.rotation[2]);
    
    // Add shape to the physics body
    clothBody.addShape(clothShape);
    world.addBody(clothBody);

    // Record cloth data into the cloths array
    cloths.push({ mesh: cloth, body: clothBody });
  });
}


let mixer; 

loader.load(
  "/female.glb",
  function (gltf) {
    bananaGroup.add(gltf.scene);
    gltf.scene.position.set(5, 0, 0);
    gltf.scene.rotation.y = Math.PI / 2;
    gltf.scene.scale.setScalar(2);

    gltf.scene.traverse(function (el) {
      if (el.isMesh) {
        el.castShadow = true;
      }
    });

    mixer = new THREE.AnimationMixer(gltf.scene);
    const action = mixer.clipAction(gltf.animations[0]);
    action.play();
    action.timeScale = 0.7;

    gsap.fromTo(
      gltf.scene.position,
      { x: -17, z: 10 }, 
      {
        x: 12,
        z: 10,
        duration: 36,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        onStart: () => {
          gltf.scene.rotation.y = Math.PI / 2; 
        },
        onRepeat: () => {
          gsap.to(gltf.scene.rotation, {
            y: gltf.scene.rotation.y + Math.PI, 
            duration: 0.5,
            ease: "power1.inOut",
          });
        }
      }
    );
  }
);

let mixer2;

loader.load(
  "/people.glb",
  function (gltf) {
    bananaGroup.add(gltf.scene);
    gltf.scene.position.set(6, 0, 0); // 更改位置以避免重叠
    gltf.scene.rotation.y = Math.PI / 2;
    gltf.scene.scale.setScalar(2);

    gltf.scene.traverse(function (el) {
      if (el.isMesh) {
        el.castShadow = true;
      }
    });

    console.log(gltf.scene);
    console.log(gltf.animations);

    mixer2 = new THREE.AnimationMixer(gltf.scene);
    const action = mixer2.clipAction(gltf.animations[0]); 
    action.play();
    action.timeScale = 0.7;

    gsap.fromTo(
      gltf.scene.position,
      { x: 12, z: 9 },
      {
        x: -17,
        z: 9,
        duration: 38,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut", 
        onStart: () => {
          gltf.scene.rotation.y = -Math.PI / 2; 
        },
        onRepeat: () => {
          gsap.to(gltf.scene.rotation, {
            y: gltf.scene.rotation.y + Math.PI, 
            duration: 0.5,
            ease: "power1.inOut",
          });
        }
      }
    );
    
  }
);

// 创建 Cannon.js 物理世界
const world = new CANNON.World();
world.gravity.set(0, -9.00, 0); // 重力设置

// 地面
const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body({ mass: 0 });
floorBody.addShape(floorShape);
floorBody.position.set(0, 0, 0);
floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(floorBody);


// 为地面创建Three.js网格
const floorGeometry = new THREE.PlaneGeometry(200, 200);
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load('/road.jpg', (texture) => {
  texture.wrapS = THREE.RepeatWrapping; 
  texture.wrapT = THREE.RepeatWrapping; 
  texture.repeat.set(10, 10); 
});
const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; 
floor.position.y = 0;
floor.receiveShadow = true; 
scene.add(floor);

// 加载模型 base2 和 city
loader.load("/base2.glb", function (gltf) {
  bananaGroup.add(gltf.scene);
  gltf.scene.position.set(-5, 0, -1); // Three.js 模型的位置
  gltf.scene.scale.setScalar(0.4);
  gltf.scene.rotation.y = -Math.PI / 2;

  gltf.scene.traverse(function (el) {
    if (el.isMesh) {
      el.castShadow = true; // 确保有阴影
  
      // 创建一个 (3, 3, 3) 的 CANNON.Box
      const halfExtents = new CANNON.Vec3(4, 4, 4); // 长宽高的一半
      const baseShape = new CANNON.Box(halfExtents);
  
      // 创建物理体，质量可根据需要调整
      const baseBody = new CANNON.Body({ mass: 1000 }); 
      baseBody.addShape(baseShape);
  
      // 将物理体位置设置在坐标原点 (0, 0, 0)
      baseBody.position.set(0, 0, 0); 
  
      // 如果需要同步旋转，可设置：
      baseBody.quaternion.set(0, 0, 0, 1); // 不旋转
  
      // 将物理体添加到物理世界
      world.addBody(baseBody);
    }
  });
  
  
  
  directionalLight.target = gltf.scene;
  scene.add(directionalLight.target);
});



loader.load("/city.glb", function (gltf) {
  bananaGroup.add(gltf.scene);
  gltf.scene.position.set(-20, 0, -4);
  gltf.scene.rotation.y = Math.PI / 2;
  gltf.scene.scale.setScalar(2);

  gltf.scene.traverse(function (el) {
    if (el.isMesh) {
      el.castShadow = true;
    }
  });

  directionalLight.target = gltf.scene;
  scene.add(directionalLight.target);
});


let clothPos = [
  [-4, 20, 2],
  [-3, 20, 4],
  [-6, 20, 5],
  [-5, 20, 3]
];

import { enableCamera, captureAndIdentifyColor } from './camera.js';


enableCamera();

let localCloths =[];

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    
    // 拍照并识别颜色
    const identifiedColor = captureAndIdentifyColor();

    loader.load("/1cloth-good.glb", function (gltf) {
      const cloth = gltf.scene;
      cloth.scale.setScalar(0.3);

      // 随机选择位置
      const randomPos = clothPos[Math.floor(Math.random() * clothPos.length)];
      cloth.position.set(randomPos[0], randomPos[1], randomPos[2]);
      const randomRotation = Math.random() * Math.PI * 2;
      cloth.rotation.y = randomRotation;
      
      const color = new THREE.Color(identifiedColor);// 将识别到的 RGB 字符串转换为 THREE.Color 对象
      // 设置衣服材质颜色
      cloth.traverse(function (el) {
        if (el.isMesh) {
          el.material.color.set(color); 
        }
      });

      scene.add(cloth);
      
      const clothShape = new CANNON.Box(new CANNON.Vec3(1, 0.2, 1));
      const clothBody = new CANNON.Body({
        mass: 0.7,
        position: new CANNON.Vec3(randomPos[0], randomPos[1], randomPos[2]),
      });
      clothBody.addShape(clothShape);
      clothBody.quaternion.setFromEuler(0, randomRotation, 0);
      world.addBody(clothBody);

      // 记录衣服数据
      const clothData = {
        position: cloth.position.toArray(),
        rotation: cloth.rotation.toArray(),
        color: color.getStyle(),  // 获取颜色的字符串表示
      };
      console.log("keydowned");
      const clothId = `cloth_${Date.now()}`; 
      set(ref(db, 'clothes/' + clothId), clothData);

      localCloths.push({ mesh: cloth, body: clothBody });
    });
  }
});

// 更新物理世界与渲染
const clock = new THREE.Clock();
const timeStep = 1 / 60;

const animate = () => {
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  if (mixer2) mixer2.update(delta);

  // 更新物理世界
  world.step(timeStep);

  // 同步 cloths 的物理体和 Three.js 的网格
  cloths.forEach(({ mesh, body }) => {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  });
 
  localCloths.forEach(({ mesh, body }) => {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  });


  // 渲染场景和更新控制
  renderer.render(scene, camera);
  controls.update();
};


renderer.setAnimationLoop(animate);

// resize
const onResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

window.addEventListener("resize", onResize);
