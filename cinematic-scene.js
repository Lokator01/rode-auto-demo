import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

const smooth = (a, b, value) => THREE.MathUtils.smoothstep(value, a, b);

async function loadAsset(loader, url, report) {
  if (!('DecompressionStream' in window))
    return loader.loadAsync(url, (event) => report(event.loaded / (event.total || event.loaded)));
  const response = await fetch(url + '.gz');
  if (!response.ok) throw new Error('Model download failed');
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  const length = Number(response.headers.get('Content-Length'));
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    if (length) report(received / length);
  }
  const stream = new Blob(chunks).stream().pipeThrough(new DecompressionStream('gzip'));
  const bytes = await new Response(stream).arrayBuffer();
  report(1);
  return loader.parseAsync(bytes, '/rode-auto-demo/assets/models/');
}

function lightBeam(origin, target, color) {
  const delta = target.clone().sub(origin);
  const length = delta.length();
  const material = new THREE.ShaderMaterial({
    uniforms: {
      origin: { value: origin },
      axis: { value: delta.normalize() },
      beamLength: { value: length },
      strength: { value: 0.15 },
      viewport: { value: new THREE.Vector2(1, 1) },
      tint: { value: new THREE.Color(color) }
    },
    vertexShader:
      'varying vec3 point; void main(){vec4 world=modelMatrix*vec4(position,1.0);point=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}',
    fragmentShader: `varying vec3 point; uniform vec3 origin,axis,tint; uniform float beamLength,strength; uniform vec2 viewport;
      void main(){vec3 ray=point-cameraPosition;float distance=length(ray);vec3 direction=normalize(ray);float density=0.0;
        for(int i=0;i<16;i++){vec3 p=cameraPosition+direction*(distance*(float(i)+0.5)/16.0);vec3 local=p-origin;float along=dot(local,axis);
          float q=along/beamLength;float radius=max(0.03,q*2.0);float radial=length(local-axis*along)/radius;
          density+=pow(max(0.0,1.0-radial*radial),2.0)*smoothstep(0.0,0.12,q)*(1.0-smoothstep(0.75,1.0,q));}
        vec2 screen=gl_FragCoord.xy/viewport;
        float edge=smoothstep(0.0,0.08,screen.x)*(1.0-smoothstep(0.92,1.0,screen.x))*smoothstep(0.0,0.05,screen.y)*(1.0-smoothstep(0.95,1.0,screen.y));
        gl_FragColor=vec4(tint,min(0.10,density*distance/16.0*0.025*strength)*edge);}`,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending
  });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(2, length, 40, 1, true), material);
  beam.position.copy(origin).addScaledVector(delta, length / 2);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), delta);
  return beam;
}

function headlightAccents(car) {
  const accents = new THREE.Group();
  const positions = [];
  const normals = [];
  car.traverse((object) => {
    if (!object.isMesh || object.material.name !== 'mesh_11__0') return;
    const geometry = object.geometry;
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    const index = geometry.index;
    for (let triangle = 0; triangle < (index?.count || position.count); triangle += 3) {
      const ids = [0, 1, 2].map((offset) => (index ? index.getX(triangle + offset) : triangle + offset));
      if (
        !ids.every(
          (id) =>
            position.getZ(id) > 1.78 &&
            position.getY(id) > 0.78 &&
            position.getY(id) < 0.96 &&
            Math.abs(position.getX(id)) > 0.45
        )
      )
        continue;
      for (const id of ids) {
        for (let axis = 0; axis < 3; axis++) {
          const n = normal?.getComponent(id, axis) || 0;
          positions.push(position.getComponent(id, axis) + n * 0.002);
          normals.push(n);
        }
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  const material = new THREE.MeshStandardMaterial({
    color: 0xd3e9f3,
    emissive: 0xb9e1fa,
    emissiveIntensity: 0,
    roughness: 0.5,
    transparent: true,
    opacity: 0
  });
  accents.add(new THREE.Mesh(geometry, material));
  car.add(accents);
  return material;
}

export async function createCarScene(element, { onRevealComplete, onProgress, opened = false } = {}) {
  RectAreaLightUniformsLib.init();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = element.clientWidth < 500;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030a07, 0.025);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setClearColor(0x030a07, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  element.prepend(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(5.5, 3.1, 7.8);
  const inputCamera = camera.clone();
  const controls = new OrbitControls(inputCamera, renderer.domElement);
  controls.target.set(0, 0.9, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = Math.PI * 0.34;
  controls.maxPolarAngle = Math.PI * 0.45;
  controls.rotateSpeed = 0.45;
  controls.enabled = false;
  controls.update();
  const initialOrbit = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  const hemi = new THREE.HemisphereLight(0xe4eeed, 0x121d15, 0.25);
  const key = new THREE.SpotLight(0xfff3dc, 30, 25, 0.5, 0.8, 2);
  key.position.set(-4, 7, 5);
  key.target.position.set(0, 0.7, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.025;
  const second = new THREE.SpotLight(0xd5e5f5, 15, 24, 0.46, 0.85, 2);
  second.position.set(4, 6, -2);
  second.target.position.set(0, 0.7, 0);
  const rim = new THREE.DirectionalLight(0xc6dbdf, 0.4);
  rim.position.set(3, 4, -5);
  const fill = new THREE.RectAreaLight(0xe8f3f4, 0.4, 7, 3);
  fill.position.set(0, 5, 1);
  fill.lookAt(0, 0, 0);
  scene.add(hemi, key, key.target, second, second.target, rim, fill);
  const beams = [
    lightBeam(key.position.clone(), key.target.position.clone(), 0xdbe0d6),
    lightBeam(second.position.clone(), second.target.position.clone(), 0xa1bcca)
  ];
  scene.add(...beams);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.4 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  scene.add(floor);
  const podium = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(2.7, 2.74, 0.17, 128),
    new THREE.MeshStandardMaterial({ color: 0x0e1712, roughness: 0.5, metalness: 0.3 })
  );
  base.position.y = 0.085;
  base.receiveShadow = true;
  base.castShadow = true;
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(2.7, 2.7, 0.014, 128),
    new THREE.MeshStandardMaterial({ color: 0x070d09, roughness: 0.6, metalness: 0.25, envMapIntensity: 0.25 })
  );
  top.position.y = 0.177;
  top.receiveShadow = true;
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(2.704, 0.006, 8, 128),
    new THREE.MeshStandardMaterial({ color: 0x8d7956, metalness: 0.7, roughness: 0.4 })
  );
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.17;
  podium.add(base, top, lip);
  scene.add(podium);

  const progress = [0, 0];
  const report = (index) => (value) => {
    progress[index] = value;
    onProgress?.((progress[0] * 0.78 + progress[1] * 0.22) * 0.92);
  };
  const loader = new GLTFLoader();
  let carAsset, clothAsset;
  try {
    [carAsset, clothAsset] = await Promise.all([
      loadAsset(loader, '/rode-auto-demo/assets/models/bmw-x1-supplied-white.glb', report(0)),
      loadAsset(loader, '/rode-auto-demo/assets/models/bmw-x1-rear-cover.glb', report(1))
    ]);
  } catch (error) {
    controls.dispose();
    environment.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    throw error;
  }
  const car = carAsset.scene;
  const cloth = clothAsset.scene;
  const group = new THREE.Group();
  const bounds = new THREE.Box3().setFromObject(car);
  const center = bounds.getCenter(new THREE.Vector3());
  group.position.set(-center.x, 0.185 - bounds.min.y, -center.z);
  group.add(car, cloth);
  scene.add(group);
  group.updateMatrixWorld(true);
  const framing = [];
  const clothMaterials = new Set();
  for (const root of [car, cloth])
    root.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const position = object.geometry.attributes.position;
      const step = Math.max(1, Math.floor(position.count / 200));
      for (let index = 0; index < position.count; index += step)
        framing.push(new THREE.Vector3().fromBufferAttribute(position, index).applyMatrix4(object.matrixWorld));
      if (root !== cloth) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        material.side = THREE.DoubleSide;
        material.transparent = true;
        material.color.setRGB(0.055, 0.07, 0.06);
        material.roughness = 0.58;
        material.envMapIntensity = 0.45;
        material.onBeforeCompile = (shader) => {
          shader.vertexShader = 'varying float fabricDepth;\n' + shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace(
            '#include <project_vertex>',
            'fabricDepth=(modelMatrix*vec4(transformed,1.0)).z;\n#include <project_vertex>'
          );
          shader.fragmentShader = 'varying float fabricDepth;\n' + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <alphatest_fragment>',
            'diffuseColor.a*=smoothstep(-5.4,-2.5,fabricDepth);\n#include <alphatest_fragment>'
          );
        };
        clothMaterials.add(material);
      }
    });
  for (let index = 0; index < 48; index++) {
    const angle = (index * Math.PI * 2) / 48;
    framing.push(new THREE.Vector3(Math.cos(angle) * 2.74, 0, Math.sin(angle) * 2.74));
  }
  const headlights = headlightAccents(car);
  const mixer = new THREE.AnimationMixer(cloth);
  const clip = clothAsset.animations.find((item) => item.name === 'Unveil');
  if (!clip) throw new Error('Rear reveal animation missing');
  const reveal = mixer.clipAction(clip).setLoop(THREE.LoopOnce, 1);
  reveal.clampWhenFinished = true;
  const status = element.closest('.scene-shell').querySelector('#scene-status');
  let mode = 'covered';
  let elapsed = 0;
  let stageElapsed = 0;
  let disposed = false;
  let visible = true;
  let dirty = true;
  let frameId;
  let lastTime = performance.now();
  let lightLevel = 0.15;
  let previousLightLevel = -1;
  function state(next) {
    mode = next;
    element.dataset.sceneState = next;
    element.dataset.rotationEnabled = String(next === 'interactive');
    controls.enabled = next === 'interactive';
    status.textContent =
      next === 'interactive'
        ? 'Потяните влево или вправо, чтобы осмотреть'
        : next === 'revealing'
          ? 'Знакомство с BMW X1'
          : next === 'presenting'
            ? 'Ваш автомобиль. Наше имя.'
            : 'Готовим презентацию';
    dirty = true;
  }
  function lighting(level) {
    if (Math.abs(level - previousLightLevel) < 0.00001) return;
    previousLightLevel = level;
    scene.environmentIntensity = 0.18 + level * 0.48;
    hemi.intensity = 0.15 + level * 0.65;
    key.intensity = 30 + level * 180;
    second.intensity = 15 + level * 150;
    rim.intensity = 0.35 + level * 2.1;
    fill.intensity = 0.4 + level * 2.6;
    for (const beam of beams) beam.material.uniforms.strength.value = 0.12 + level * 0.88;
    headlights.opacity = smooth(0.6, 1, level) * 0.72;
    headlights.emissiveIntensity = smooth(0.6, 1, level) * 1.3;
    renderer.shadowMap.needsUpdate = true;
  }
  function present(immediate = false) {
    cloth.visible = false;
    car.visible = true;
    state(immediate ? 'interactive' : 'presenting');
    stageElapsed = 0;
    onRevealComplete?.();
    if (immediate) {
      lightLevel = 1;
      lighting(1);
    }
  }
  mixer.addEventListener('finished', () => present());
  function startIntro() {
    if (mode !== 'covered') return;
    if (opened || reduced.matches) {
      present(true);
      return;
    }
    elapsed = 0;
    reveal.reset().play();
    car.visible = true;
    state('revealing');
  }
  function resize() {
    if (!element.clientWidth || !element.clientHeight) return;
    renderer.setSize(element.clientWidth, element.clientHeight, false);
    for (const beam of beams) renderer.getDrawingBufferSize(beam.material.uniforms.viewport.value);
    camera.aspect = element.clientWidth / element.clientHeight;
    camera.fov = THREE.MathUtils.clamp(
      THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(Math.PI / 6) / camera.aspect)),
      28,
      46
    );
    camera.zoom = 1;
    camera.updateProjectionMatrix();
    // Fit the fixed starting view once per layout size; dragging never changes distance.
    const saved = camera.position.clone();
    camera.position.set(5.5, 3.1, 7.8);
    camera.lookAt(controls.target);
    camera.updateMatrixWorld();
    let extent = 0;
    for (const point of framing) {
      const projected = point.clone().project(camera);
      extent = Math.max(extent, Math.abs(projected.x), Math.abs(projected.y));
    }
    camera.zoom = Math.min(2.4, 1.0 / extent);
    camera.position.copy(saved);
    camera.lookAt(controls.target);
    camera.updateProjectionMatrix();
    dirty = true;
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(element);
  const intersection = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      dirty = true;
    },
    { rootMargin: '100px' }
  );
  intersection.observe(element);
  const keys = (event) => {
    if (!controls.enabled || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const spherical = new THREE.Spherical().setFromVector3(inputCamera.position.clone().sub(controls.target));
    spherical.theta += event.key === 'ArrowLeft' ? -0.12 : event.key === 'ArrowRight' ? 0.12 : 0;
    spherical.phi += event.key === 'ArrowUp' ? -0.04 : event.key === 'ArrowDown' ? 0.04 : 0;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi, controls.minPolarAngle, controls.maxPolarAngle);
    inputCamera.position.copy(new THREE.Vector3().setFromSpherical(spherical).add(controls.target));
    controls.update();
    dirty = true;
  };
  const motion = () => {
    if (reduced.matches && mode !== 'interactive') {
      reveal.stop();
      present(true);
    }
  };
  element.addEventListener('keydown', keys);
  reduced.addEventListener('change', motion);
  controls.addEventListener('change', () => {
    const orbit = new THREE.Spherical().setFromVector3(inputCamera.position.clone().sub(controls.target));
    car.rotation.y = initialOrbit.theta - orbit.theta;
    camera.position.copy(
      new THREE.Vector3()
        .setFromSpherical(new THREE.Spherical(initialOrbit.radius, orbit.phi, initialOrbit.theta))
        .add(controls.target)
    );
    camera.lookAt(controls.target);
    renderer.shadowMap.needsUpdate = true;
    dirty = true;
  });
  function animate(time) {
    if (disposed) return;
    const dt = Math.min((time - lastTime) / 1000, 0.08);
    lastTime = time;
    if (visible && !document.hidden) {
      controls.update();
      if (mode === 'revealing') {
        elapsed += dt;
        mixer.update(dt);
        lightLevel = 0.15 + smooth(0.1, clip.duration, elapsed) * 0.3;
        dirty = true;
      } else if (mode === 'presenting') {
        stageElapsed += dt;
        lightLevel = 0.45 + smooth(0, 1, stageElapsed) * 0.55;
        if (stageElapsed >= 1) state('interactive');
        dirty = true;
      }
      if (dirty) {
        lighting(lightLevel);
        renderer.render(scene, camera);
        dirty = false;
      }
    }
    frameId = requestAnimationFrame(animate);
  }
  state('covered');
  lighting(lightLevel);
  resize();
  onProgress?.(0.96);
  await renderer.compileAsync(scene, camera);
  const target = new THREE.WebGLRenderTarget(64, 64);
  renderer.setRenderTarget(target);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  target.dispose();
  car.visible = false;
  element.querySelector('.scene-loading')?.remove();
  onProgress?.(1);
  lastTime = performance.now();
  frameId = requestAnimationFrame(animate);
  return {
    startIntro,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersection.disconnect();
      mixer.stopAllAction();
      controls.dispose();
      element.removeEventListener('keydown', keys);
      reduced.removeEventListener('change', motion);
      const textures = new Set();
      scene.traverse((object) => {
        object.geometry?.dispose();
        for (const material of Array.isArray(object.material)
          ? object.material
          : object.material
            ? [object.material]
            : []) {
          for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
          material.dispose();
        }
      });
      for (const texture of textures) texture.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}
