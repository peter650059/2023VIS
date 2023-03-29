import * as THREE from "three";
import * as d3 from "d3";
import { randomExponential } from "d3";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import * as dat from "lil-gui";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "stats-js/build/stats.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { BoxLineGeometry } from "three/examples/jsm/geometries/BoxLineGeometry.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import {
  SVGRenderer,
  SVGObject,
} from "three/examples/jsm/renderers/SVGRenderer.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import * as TWEEN from "@tweenjs/tween.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

// generate bloom voxel
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

// WEBXR
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import WebXRPolyfill from "webxr-polyfill";

if (!navigator.xr) {
  console.log("Using the polyfill");
  const polyfill = new WebXRPolyfill();
}

import { XRControllerModelFactory } from "three/examples/jsm/webxr/XRControllerModelFactory";
// import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory';

// mesh ui plane
import ThreeMeshUI from "three-mesh-ui";
// import VRControl from "./js/utils/VRControl.js";
import ShadowedLight from "./js/utils/ShadowedLight.js";
import { HTMLMesh } from "three/examples/jsm/interactive/HTMLMesh.js";
import { InteractiveGroup } from "three/examples/jsm/interactive/InteractiveGroup.js";

import FontJSON from "./assets/Roboto-msdf.json";
import FontImage from "./assets/Roboto-msdf.png";
import Backspace from "./assets/backspace.png";
import Enter from "./assets/enter.png";
import Shift from "./assets/shift.png";

import coord from "../static/data/coord.json";
import region from "../static/data/region.json";
import pearson from "../static/data/pearson_digit.json";
import region_coord from "../static/data/regionc.json";
import path from "../static/data/path_92.json";
import region_bold from "../static/data/region_bold.json";
import record2 from "../static/data/record_12_18.json";
import record1 from "../static/data/record_2_22.json";
import record from "../static/data/record_11_28.json";
import inverted_index from "../static/data/invert_index.json";
import world_coord from "../static/data/world_coord.json";
// console.log(world_coord);
import sim_bold from "../static/data/sim_bold.json";
import { time_sum } from "./time_sum.js";
import region_boldsum from "../static/data/region_boldsum.json";
// console.log(time_sum)
// import test_data from '../static/data/coordinate_probability_2_json_matched2.json'
// console.log(test_data)

// Import Icons
import PlayIcon from "../static/icons/play.png";
import PauseIcon from "../static/icons/pause.png";
import FFIcon from "../static/icons/fast-forward.png";
import RewIcon from "../static/icons/rewind.png";
import ResetIcon from "../static/icons/reset.png";
import WideIcon from "../static/icons/wide.png";
import StarIcon from "../static/icons/star.png";
import TargetIcon from "../static/icons/target.png";
import WebsiteIcon from "../static/icons/website.png";
import FolderIcon from "../static/icons/folder.png";
import SliceIcon from "../static/icons/slice.png";
import RegionIcon from "../static/icons/region.png";

// Import textures
// import dirt from '../static/textures/dirt.png'
// import dirt2 from '../static/textures/dirt2.jpg'
// import grass from '../static/textures/grass.jpg'
// import sand from '../static/textures/sand.jpg'
// import envmap from '../static/textures/envmap.hdr'

// console.log(region)
// console.log(coord)
// window.addEventListener( 'load', init );

let camera, scene, renderer, controls, object, stats, statsMesh, orbit_control;
let planes,
  planeObjects = [],
  planeHelpers;
let clock;
let keyboard,
  userText,
  currentLayoutButton,
  intersectionRoom,
  layoutOptions,
  points_base,
  pickingData = [],
  allData,
  pointGroup = new THREE.Group(),
  all_voxel_index = [],
  composer,
  vrControl,
  templength,
  vr_mode = false,
  everyXframesUpdateProgBar = 0,
  everyXframesUpdateProgBarInt = 0,
  progressBar,
  RegionData = [],
  SliceData = [],
  HighBoldData = [],
  pickingData_timeslice = [],
  world_Coord_meshgroup = [],
  RegionSumBold,
  maxbold,
  minbold,
  region_index = [],
  region_pointGroup = new THREE.Group(),
  RegionBoldData = [],
  slicingData,
  regionNum = 1,
  crosshair,
  interest_data = [],
  regionbold_mode = false,
  interest_mode = false,
  region_boldsum_ = boldSum_Region(region_boldsum);

let color = new THREE.Color();
let CursorSize = 0.07; // 屏幕中心的光标大小
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
let prevTime = performance.now();
var velocity = new THREE.Vector3(); //移动速度变量
var direction = new THREE.Vector3(); //移动的方向变量
let option = document.getElementById("option");

let PLAYERPANELMAXWIDTH = 3.5;
let PROGRESSPANELMAXWIDTH = PLAYERPANELMAXWIDTH - 0.2;
let PROGRESSPANELHEIGHT = 0.12;
let PROGRESSPANELMINWIDTH = 0.01;
let SETTINGSPANELMAXWIDTH = PLAYERPANELMAXWIDTH / 2;
let playMenuObjsToTest = [];
let play = false;

let tooltip_css =
  "position: absolute;padding: 7px;font-size: 0.9em;pointer-events: none;background: #fff;border: 1px solid #ccc;" +
  "border-radius: 4px;-moz-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none" +
  "-webkit-box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);box-shadow: 3px 3px 10px 0px rgba(0, 0, 0, 0.25);display:none";

let vertex = /* glsl */ `
    #define PHONG
    varying vec3 vViewPosition;
    attribute vec4 ca;
    varying vec4 vColor;
    #include <common>
    #include <uv_pars_vertex>
    #include <uv2_pars_vertex>
    #include <displacementmap_pars_vertex>
    #include <envmap_pars_vertex>
    #include <color_pars_vertex>
    #include <fog_pars_vertex>
    #include <normal_pars_vertex>
    #include <morphtarget_pars_vertex>
    #include <skinning_pars_vertex>
    #include <shadowmap_pars_vertex>
    #include <logdepthbuf_pars_vertex>
    #include <clipping_planes_pars_vertex>
    void main() {
        #include <uv_vertex>
        #include <uv2_vertex>
        #include <color_vertex>
        #include <morphcolor_vertex>
        #include <beginnormal_vertex>
        #include <morphnormal_vertex>
        #include <skinbase_vertex>
        #include <skinnormal_vertex>
        #include <defaultnormal_vertex>
        #include <normal_vertex>
        #include <begin_vertex>
        #include <morphtarget_vertex>
        #include <skinning_vertex>
        #include <displacementmap_vertex>
        #include <project_vertex>
        #include <logdepthbuf_vertex>
        #include <clipping_planes_vertex>
        vViewPosition = - mvPosition.xyz;
        vColor = ca;
        #include <worldpos_vertex>
        #include <envmap_vertex>
        #include <shadowmap_vertex>
        #include <fog_vertex>
    }`;

let fragment = `#define PHONG
    varying vec4 vColor;
    uniform vec3 diffuse;
    uniform vec3 emissive;
    uniform vec3 specular;
    uniform float shininess;
    uniform float opacity;
    #include <common>
    #include <packing>
    #include <dithering_pars_fragment>
    #include <color_pars_fragment>
    #include <uv_pars_fragment>
    #include <uv2_pars_fragment>
    #include <map_pars_fragment>
    #include <alphamap_pars_fragment>
    #include <alphatest_pars_fragment>
    #include <aomap_pars_fragment>
    #include <lightmap_pars_fragment>
    #include <emissivemap_pars_fragment>
    #include <envmap_common_pars_fragment>
    #include <envmap_pars_fragment>
    #include <fog_pars_fragment>
    #include <bsdfs>
    #include <lights_pars_begin>
    #include <normal_pars_fragment>
    #include <lights_phong_pars_fragment>
    #include <shadowmap_pars_fragment>
    #include <bumpmap_pars_fragment>
    #include <normalmap_pars_fragment>
    #include <specularmap_pars_fragment>
    #include <logdepthbuf_pars_fragment>
    #include <clipping_planes_pars_fragment>
    void main() {
        #include <clipping_planes_fragment>
        
        vec4 diffuseColor = vColor;
        ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
        vec3 totalEmissiveRadiance = emissive;
        #include <logdepthbuf_fragment>
        #include <map_fragment>
        #include <color_fragment>
        #include <alphamap_fragment>
        #include <alphatest_fragment>
        #include <specularmap_fragment>
        #include <normal_fragment_begin>
        #include <normal_fragment_maps>
        #include <emissivemap_fragment>
        // accumulation
        #include <lights_phong_fragment>
        #include <lights_fragment_begin>
        #include <lights_fragment_maps>
        #include <lights_fragment_end>
        // modulation
        #include <aomap_fragment>
        vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
        #include <envmap_fragment>
        #include <output_fragment>
        #include <tonemapping_fragment>
        #include <encodings_fragment>
        #include <fog_fragment>
        #include <premultiplied_alpha_fragment>
        #include <dithering_fragment>
        
    }`;

let vertexshader = `
    varying vec2 vUv;

    void main() {

        vUv = uv;

        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`;

let fragmentshader = `
    uniform sampler2D baseTexture;
    uniform sampler2D bloomTexture;

    varying vec2 vUv;

    void main() {

        gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );

    }`;

let colck = null,
  divided_point = 21017,
  FPS = 30,
  singleFrameTime = 1 / 30,
  timeStamp = 0,
  min = 0.9,
  start = false,
  play_colormap_update = false,
  timepoint = 0,
  time = Date.now(),
  interval = 600,
  delta = null,
  // sim_bold = [],
  real_bold = [],
  colors_ = [],
  dataindex = false,
  update = false,
  colormap = null,
  near = 1, //最小范围
  fov = 75,
  far = 1000,
  pro = 0.75,
  // widthData:[],
  // three相关参数
  startcolor = "#FFFF00",
  endcolor = "#006400",
  controls_brain = null,
  plane = null,
  orbitControl = null,
  voxel_group = new THREE.Group(),
  region_group = new THREE.Group(),
  toolTip = null,
  raycaster = new THREE.Raycaster(),
  pointer = new THREE.Vector2(),
  INTERSECTED = null,
  lines_group = new THREE.Group(),
  testtext = new THREE.Group(),
  left_path_group = new THREE.Group(),
  right_path_group = new THREE.Group(),
  real_points = null,
  sim_points = null,
  tween = null,
  response_data = null,
  point = null,
  point1 = null,
  braingroup = new THREE.Group(),
  // 相关模型

  // ambientLight:null,
  // pointLight:null,
  brainmodel = null,
  brainmodel2 = null,
  animationMap = null,
  model = null,
  // path_group:new THREE.Group(),
  // 模型相关参数
  bubble_size = 2,
  // 相关变量:
  width = 500,
  height = 400,
  padding = 30,
  proportion = 1 / 5,
  Colorscale = d3.scaleLinear().domain([0, 91]).range(["#87CEFA", "#00FF00"]),
  heightscale = null,
  linecolorscale = null,
  widthscale = null,
  Xscale = null,
  Yscale = null;

const objsToTest = [];
const canvas = document.querySelector("#webgl");
main();

var params = {
  animate: false,

  timepoint: 0,

  regionNum: {
    constant: 1,
    process: function () {
      scene.remove(scene.getObjectByName("meshgroup"));
      scene.remove(scene.getObjectByName("highlightmeshgroup"));
      scene.remove(scene.getObjectByName("focusplane"));
      document.removeEventListener("mousemove", hoverhighlightmeshgroup, false);
      document.removeEventListener("click", clickhighlightmesh_region, false);
      document.removeEventListener("click", clickhighlightmeshgroup, false);

      select_regionNum(Math.floor(regionNum));
    },
  },

  planeX: {
    constant: 3.5,
    negated: false,
    displayHelper: false,
  },

  planeY: {
    constant: 5.5,
    negated: false,
    displayHelper: false,
  },

  planeZ: {
    constant: -3.5,
    negated: false,
    displayHelper: false,
  },

  sphere: {
    radius: 2.85,
    // negated: false,
    displayHelper: false,
  },

  slicing: function () {
    select_slice_pos();
  },

  button: function () {},
  visible: false,
  evisible: true,
  proportion: 1 / 3,
  rotate: Math.PI / 6,
  pro: 0.7,
};

// Colors

const colors_ui = {
  keyboardBack: 0x858585,
  panelBack: 0x262626,
  button: 0x363636,
  // hovered: 0x1c1c1c,
  hovered: 0x999999,
  selected: 0x109c5d,
};

// compute mouse position in normalized device coordinates
// (-1 to +1) for both directions.
// Used to raycasting against the interactive elements
// const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();
mouse.x = mouse.y = null;

let selectState = false;
let touchState = false;

window.addEventListener("pointermove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("pointerdown", () => {
  selectState = true;
});

window.addEventListener("pointerup", () => {
  selectState = false;
});

window.addEventListener("touchstart", (event) => {
  touchState = true;
  mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("touchend", () => {
  touchState = false;
  mouse.x = null;
  mouse.y = null;
});

init();
// makePanel();
makeUI();
makeTextPanel();
makeplaymenu();
let controllers = buildControllers();
initXR();
initpolygen();
// initBrainObj();
animate();

function createPlaneStencilGroup(geometry, plane, renderOrder) {
  var group = new THREE.Group();
  var baseMat = new THREE.MeshBasicMaterial();
  baseMat.depthWrite = false;
  baseMat.depthTest = false;
  baseMat.colorWrite = false;
  baseMat.stencilWrite = true;
  baseMat.stencilFunc = THREE.AlwaysStencilFunc;

  // back faces
  var mat0 = baseMat.clone();
  mat0.side = THREE.BackSide;
  mat0.clippingPlanes = [plane];
  mat0.stencilFail = THREE.IncrementWrapStencilOp;
  mat0.stencilZFail = THREE.IncrementWrapStencilOp;
  mat0.stencilZPass = THREE.IncrementWrapStencilOp;

  var mesh0 = new THREE.Mesh(geometry, mat0);
  mesh0.renderOrder = renderOrder;
  group.add(mesh0);

  // front faces
  var mat1 = baseMat.clone();
  mat1.side = THREE.FrontSide;
  mat1.clippingPlanes = [plane];
  mat1.stencilFail = THREE.DecrementWrapStencilOp;
  mat1.stencilZFail = THREE.DecrementWrapStencilOp;
  mat1.stencilZPass = THREE.DecrementWrapStencilOp;

  var mesh1 = new THREE.Mesh(geometry, mat1);
  mesh1.renderOrder = renderOrder;

  group.add(mesh1);

  return group;
}

function init() {
  clock = new THREE.Clock();

  scene = new THREE.Scene();
  // scene.background = new THREE.Color( 0x7A7B7B );

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  camera.position.set(0, 2, 5.5);
  // camera.rotateX = 90 * Math.PI / 180
  camera.name = "camera";
  camera.lookAt(0, -1.5, -7.5);
  scene.add(camera);

  //////////////////////////////////////////////////////
  //                        Light
  //////////////////////////////////////////////////////
  // let ambientLight = new THREE.AmbientLight(0xcccccc,0.6);
  // scene.add(ambientLight);

  // var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
  // scene.add( dirLight );

  const light = ShadowedLight({
    z: -10,
    width: 6,
    bias: -0.0001,
  });

  const hemLight = new THREE.HemisphereLight(0x808080, 0x606060);

  scene.add(light, hemLight);

  //////////////////////////////////////////////////////
  //                        Room
  //////////////////////////////////////////////////////
  const room = new THREE.LineSegments(
    new BoxLineGeometry(80, 80, 80, 10, 10, 10).translate(0, 20, -20),
    new THREE.LineBasicMaterial({ color: 0x808080 })
  );

  intersectionRoom = new THREE.Mesh(
    new THREE.BoxGeometry(80, 80, 80, 10, 10, 10).translate(0, 20, -20),
    new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    })
  );

  scene.add(room, intersectionRoom);
  objsToTest.push(intersectionRoom);

  //Create a ground
  // var geometry = new THREE.PlaneGeometry( 1000, 1000, 1, 1 );
  // var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
  // var floor = new THREE.Mesh( geometry, material );
  // floor.material.side = THREE.FrontSide;
  // floor.rotation.x = - Math.PI / 2;
  // floor.position.y = -10;
  // scene.add( floor );
  // objsToTest.push(floor);

  // var gridHelper = new THREE.GridHelper( 1000, 250, 0x2C2C2C, 0x888888 );
  // gridHelper.position.y = -10;
  // scene.add(gridHelper);

  //Create a sphere
  // var geometry = new THREE.SphereGeometry( 200, 10, 10);
  // var appearence = new THREE.MeshBasicMaterial ({
  // 	color: 0xa2a7a9,
  // 	wireframe: true
  // });

  // //Add the sphere
  // let meshsphere = new THREE.Mesh(geometry, appearence);
  // scene.add(meshsphere);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    canvas: canvas,
    antialias: true,
  });
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0x46494a);
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = Math.pow(1.0, 4.0);
  window.addEventListener("resize", onWindowResize, false);
  // document.body.appendChild( renderer.domElement );
  renderer.localClippingEnabled = true;

  renderer.setAnimationLoop(animate);

  const renderScene = new RenderPass(scene, camera);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  bloomPass.threshold = 0;
  bloomPass.strength = 1.5;
  bloomPass.radius = 0;

  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  // InteractiveGroup for HTMLMesh
  const group = new InteractiveGroup(renderer, camera);
  scene.add(group);

  orbit_control = new OrbitControls(camera, canvas);
  // controls.target = new THREE.Vector3(0, 0, -7);
  orbit_control.target.set(0, 1.5, -7.5);
  // controls.update();

  controls = new PointerLockControls(camera, canvas);

  // Add stats.js
  stats = new Stats();
  stats.dom.style.width = "80px";
  stats.dom.style.height = "48px";
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);
  stats.dom.style.visibility = "hidden";

  statsMesh = new HTMLMesh(stats.dom);
  statsMesh.position.x = -2.8;
  statsMesh.position.y = 5;
  statsMesh.position.z = -9;
  // statsMesh.rotation.y = Math.PI / 8;
  statsMesh.scale.setScalar(20);
  group.add(statsMesh);
  objsToTest.push(statsMesh);

  // 光标mesh
  crosshair = new THREE.Mesh(
    new THREE.RingBufferGeometry(0.75 * CursorSize, CursorSize, 32),
    new THREE.MeshPhongMaterial({
      color: color.setHSL(0.27, 0.54, 0.71),
      emissive: color.setHSL(0, 0.15, 0.9),
      specular: color.setHSL(0, 0, 1),
    })
  );
  crosshair.position.z = -3;

  // GUI
  var gui = new GUI();

  var folder1 = gui.addFolder("Overview Animation");

  folder1
    .add(params, "timepoint")
    .name("Timepoint")
    .min(1)
    .max(166)
    .step(1)
    .onChange(function (d) {
      timepoint = d - 1;
      const data = [
        sim_bold.map((item) => item[timepoint]),
        real_bold.map((item) => item[timepoint]),
      ].reduce(function (a, b) {
        return a.concat(b);
      });

      let t = pro + 0.1 > 1 ? 1 : pro + 0.1;
      const colorsc = d3
        .scaleQuantize()
        .domain([d3.min(data), d3.max(data) * t])
        .range(colormap);

      updateBold_v3(colorsc, d3.max(data));

      if (scene.getObjectByName("brain_obj")) {
        display_region_colormap_update(slicingData);
      }
    });

  folder1
    .add(params, "proportion", 0.1, 1)
    .name("Sampling_proportion")
    .onChange(function (e) {
      proportion = e;
    });

  folder1
    .add(params, "pro", 0.1, 1)
    .name("Max")
    .onChange(function (e) {
      pro = e;
    });

  folder1
    .add(params, "button")
    .name("Animation Play")
    .onChange(function () {
      start = !start;
      play_colormap_update = !play_colormap_update;
    });

  folder1
    .add(params, "button")
    .name("Reset")
    .onChange(() => {
      const n = brainmodel.geometry.attributes.position.array;
      let colors = [];
      timepoint = 0;
      document.getElementById("p1").innerHTML =
        "timepoint_bold:" + (timepoint + 1).toString();
      for (let i = 0; i < n.length / 3; i++) {
        let index = record1[parseInt(i)];
        let color_ = new THREE.Color(Colorscale(region[index]));
        // positions.push(n[3*i],n[3*i+1],n[3*i+2])
        colors.push(color_.r * 255, color_.g * 255, color_.b * 255, 0.6 * 255);
        // color1.toArray( colors, i * 3 );
      }
      let colorAttribute = new THREE.Uint8BufferAttribute(colors, 4);
      colorAttribute.normalized = true;
      brainmodel.geometry.setAttribute("ca", colorAttribute);
      brainmodel2.geometry.setAttribute("ca", colorAttribute);
    });

  folder1.open();

  var folder2 = gui.addFolder("Select Region Number 1~92");

  folder2
    .add(params.regionNum, "constant")
    .name("Region Num")
    .min(1)
    .max(92)
    .step(1)
    .onChange((d) => (regionNum = Math.floor(d)));

  folder2.add(params.regionNum, "process").name("Display Region Bold");

  folder2.open();

  var folder3 = gui.addFolder("Slicing Plane");

  folder3
    .add(params.planeX, "constant")
    .name("Sagittal Plane")
    .min(-3.5)
    .max(3.5)
    .onChange(function (d) {
      if (scene.getObjectByName("brain_obj")) planes[0].constant = d;
    });

  folder3
    .add(params.planeY, "constant")
    .name("Horizontal Plane")
    .min(-1)
    .max(5.5)
    .onChange(function (d) {
      if (scene.getObjectByName("brain_obj")) planes[1].constant = d;
    });

  folder3
    .add(params.planeZ, "constant")
    .name("Coronal Plane")
    .min(-12.5)
    .max(-3.5)
    .onChange(function (d) {
      if (scene.getObjectByName("brain_obj")) planes[2].constant = d;
    });

  folder3.add(params, "slicing").name("Display Slice Plane Bold");

  folder3.open();

  gui.domElement.style.visibility = "hidden";

  const mesh = new HTMLMesh(gui.domElement);
  mesh.position.x = -6;
  mesh.position.y = 1.2;
  mesh.position.z = -6.5;
  mesh.rotation.y = Math.PI / 8;
  mesh.scale.set(18, 25, 18);
  group.add(mesh);
  // objsToTest.push(gui.domElement);

  let colors = require("colormap");
  colormap = colors({
    colormap: "jet",
    nshades: 20,
    format: "hex",
    alpha: 1,
  });
  let compute = d3.scaleQuantize().domain([0, 20]).range(colormap);

  d3.select("#legend1")
    .selectAll("rect")
    .data(d3.range(20))
    .enter()
    .append("rect")
    .attr("x", (d, i) => i * 20)
    .attr("y", 0)
    .attr("width", 20)
    .attr("height", 10)
    .style("fill", (d) => compute(d));

  for (let i = 0; i < 92; i++) {
    colors_.push(
      "#" +
        ("00000" + ((Math.random() * 0x1000000) << 0).toString(16)).substr(-6)
    );
  }
  const used_pearson = pearson
    .reduce(function (a, b) {
      return a.concat(b);
    })
    .filter((item) => {
      return item > min;
    });
  heightscale = d3
    .scaleLinear()
    .domain([d3.min(used_pearson), d3.max(used_pearson)])
    .range([25, 350]);
  widthscale = d3
    .scaleLinear()
    .domain([d3.min(used_pearson), d3.max(used_pearson)])
    .range([1, 10]);
  linecolorscale = d3
    .scaleLinear()
    .domain([d3.min(used_pearson), d3.max(used_pearson)])
    .range(["#FFFF00", "#FF0000"]);
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//                                       Controllers
//
///////////////////////////////////////////////////////////////////////////////

function VRControl(renderer) {
  const controllers = [];
  const controllerGrips = [];

  const controllerModelFactory = new XRControllerModelFactory();

  //////////////////
  // Lines helpers
  //////////////////

  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    alphaMap: new THREE.CanvasTexture(generateRayTexture()),
    transparent: true,
  });

  const geometry = new THREE.BoxBufferGeometry(0.004, 0.004, 0.35);

  geometry.translate(0, 0, -0.15);

  const uvAttribute = geometry.attributes.uv;

  for (let i = 0; i < uvAttribute.count; i++) {
    let u = uvAttribute.getX(i);
    let v = uvAttribute.getY(i);

    [u, v] = (() => {
      switch (i) {
        case 0:
          return [1, 1];
        case 1:
          return [0, 0];
        case 2:
          return [1, 1];
        case 3:
          return [0, 0];
        case 4:
          return [0, 0];
        case 5:
          return [1, 1];
        case 6:
          return [0, 0];
        case 7:
          return [1, 1];
        case 8:
          return [0, 0];
        case 9:
          return [0, 0];
        case 10:
          return [1, 1];
        case 11:
          return [1, 1];
        case 12:
          return [1, 1];
        case 13:
          return [1, 1];
        case 14:
          return [0, 0];
        case 15:
          return [0, 0];
        default:
          return [0, 0];
      }
    })();

    uvAttribute.setXY(i, u, v);
  }

  const linesHelper = new THREE.Mesh(geometry, material);
  linesHelper.renderOrder = Infinity;

  /////////////////
  // Point helper
  /////////////////

  const spriteMaterial = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(generatePointerTexture()),
    sizeAttenuation: false,
    depthTest: false,
  });

  const pointer = new THREE.Sprite(spriteMaterial);

  pointer.scale.set(0.015, 0.015, 1);
  pointer.renderOrder = Infinity;

  ////////////////
  // Controllers
  ////////////////

  const controller1 = renderer.xr.getController(0);
  const controller2 = renderer.xr.getController(1);

  controller1.name = "controller-right";
  controller2.name = "controller-left";

  const controllerGrip1 = renderer.xr.getControllerGrip(0);
  const controllerGrip2 = renderer.xr.getControllerGrip(1);

  if (controller1) controllers.push(controller1);
  if (controller2) controllers.push(controller2);

  if (controllerGrip1) controllerGrips.push(controllerGrip1);
  if (controllerGrip2) controllerGrips.push(controllerGrip2);

  controllers.forEach((controller) => {
    const ray = linesHelper.clone();
    const point = pointer.clone();

    controller.add(ray, point);
    controller.ray = ray;
    controller.point = point;
  });

  controllerGrips.forEach((controllerGrip) => {
    controllerGrip.add(
      controllerModelFactory.createControllerModel(controllerGrip)
    );
  });

  //////////////
  // Functions
  //////////////

  const dummyMatrix = new THREE.Matrix4();

  // Set the passed ray to match the given controller pointing direction

  function setFromController(controllerID, ray) {
    const controller = controllers[controllerID];

    // Position the intersection ray

    dummyMatrix.identity().extractRotation(controller.matrixWorld);

    ray.origin.setFromMatrixPosition(controller.matrixWorld);
    ray.direction.set(0, 0, -1).applyMatrix4(dummyMatrix);
  }

  // Position the chosen controller's pointer at the given point in space.
  // Should be called after raycaster.intersectObject() found an intersection point.

  function setPointerAt(controllerID, vec) {
    const controller = controllers[controllerID];
    const localVec = controller.worldToLocal(vec);

    controller.point.position.copy(localVec);
    controller.point.visible = true;
  }

  //

  return {
    controllers,
    controllerGrips,
    setFromController,
    setPointerAt,
  };
}

//////////////////////////////
// CANVAS TEXTURE GENERATION
//////////////////////////////

// Generate the texture needed to make the intersection ray fade away

function generateRayTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 64, 0);
  gradient.addColorStop(0, "black");
  gradient.addColorStop(1, "white");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  return canvas;
}

// Generate the texture of the point helper sprite

function generatePointerTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;

  const ctx = canvas.getContext("2d");

  ctx.beginPath();
  ctx.arc(32, 32, 29, 0, 2 * Math.PI);
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = "white";
  ctx.fill();

  return canvas;
}

// adding a line to the controller so you can see which direction it's pointing
// presumed that controllers have at least 2 buttons, a primary action button and a primary squeeze action button.
function buildControllers() {
  const controllers = [];

  // const geometry = new THREE.BufferGeometry();
  // geometry.setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 20 ) ] );

  // const controller1 = renderer.xr.getController( 0 );
  // controller1.add( new THREE.Line( geometry ) );
  // scene.add( controller1 );
  // controllers.push(controller1);

  // const controller2 = renderer.xr.getController( 1 );
  // controller2.add( new THREE.Line( geometry ) );
  // scene.add( controller2 );
  // controllers.push(controller2);

  // const controllerModelFactory = new XRControllerModelFactory();

  // const controllerGrip1 = renderer.xr.getControllerGrip( 0 );
  // controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
  // scene.add( controllerGrip1 );

  // const controllerGrip2 = renderer.xr.getControllerGrip( 1 );
  // controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
  // scene.add( controllerGrip2 );

  vrControl = VRControl(renderer, camera, scene);

  scene.add(vrControl.controllerGrips[0], vrControl.controllers[0]);
  scene.add(vrControl.controllerGrips[1], vrControl.controllers[1]);
  controllers.push(vrControl.controllers[0]);
  controllers.push(vrControl.controllers[1]);

  return controllers;
}

function initXR() {
  renderer.xr.enabled = true;
  const vr_button = VRButton.createButton(renderer);
  vr_button.style.top = "10px";
  vr_button.style.bottom = "";
  document.body.appendChild(vr_button);

  function onSelectStart() {
    // this refers to the controller
    // this.children[0].scale.z = 10;
    this.userData.selectPressed = true;
    selectState = true;
  }

  function onSelectEnd() {
    // this refers to the controller
    // this.children[0].scale.z = 0;
    this.userData.selectPressed = false;
    selectState = false;
  }

  function onSqueezeStart() {
    this.userData.squeezePressed = true;
  }

  function onSqueezeEnd() {
    this.userData.squeezePressed = false;
  }

  let dolly = new THREE.Object3D();
  dolly.position.z = 0;
  dolly.add(camera);
  scene.add(dolly);
  dolly.name = "dolly";

  controllers.forEach((controller) => {
    controller.addEventListener("selectstart", onSelectStart);
    controller.addEventListener("selectend", onSelectEnd);
    controller.addEventListener("squeezestart", onSqueezeStart);
    controller.addEventListener("squeezeend", onSqueezeEnd);
  });

  // vrControl.controllers[0].addEventListener('selectstart', onSelectStart);
  // vrControl.controllers[0].addEventListener('selectend', onSelectEnd);
  // vrControl.controllers[0].addEventListener('squeezestart', onSqueezeStart);
  // vrControl.controllers[0].addEventListener('squeezeend', onSqueezeEnd);

  // vrControl.controllers[1].addEventListener('selectstart', onSelectStart);
  // vrControl.controllers[1].addEventListener('selectend', onSelectEnd);
  // vrControl.controllers[1].addEventListener('squeezestart', onSqueezeStart);
  // vrControl.controllers[1].addEventListener('squeezeend', onSqueezeEnd);
}

let vrbutton_click = document.getElementById("VRButton");
// 点击进入第一视角锁定模式
vrbutton_click.addEventListener(
  "click",
  function (event) {
    vr_mode = true;
    // let user = new THREE.Group();
    // user.add(camera);
    // // user.add(controllers[0].children[0]);
    // // user.add(controllers[0].children[1]);
    // // user.add(controllers[1].children[0]);
    // // user.add(controllers[1].children[1]);
    // user.position.set(0, 0, 0);
    // scene.add(user);
    // console.log(camera.posiiton);
    // console.log(controllers);

    camera.position.set(0, 0, 0);
    let dummyCam = new THREE.Object3D();
    camera.add(dummyCam);
    dummyCam.name = "dummyCam";
  },
  false
);

function handleController(controller, hand, dt) {
  // Select pressed
  const rotationMatrix = new THREE.Matrix4();
  rotationMatrix.extractRotation(controller.matrixWorld);
  const raycaster = new THREE.Raycaster();
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(rotationMatrix);

  let points = scene.getObjectByName("points_base");
  let highlightmesh = scene.getObjectByName("highlightmesh");
  let meshgroup = scene.getObjectByName("meshgroup");
  let highlightmeshgroup = scene.getObjectByName("highlightmeshgroup");

  let dolly = scene.getObjectByName("dolly");
  let dummyCam = camera.getObjectByName("dummyCam");

  if (points) {
    var intersects_points = [];
    if (points) {
      intersects_points = raycaster.intersectObjects(points.children);
    }

    if (intersects_points.length > 0) {
      let id = intersects_points[0].object.name;
      let data = pickingData[id];
      highlightmesh.position.copy(data.position);
      highlightmesh.geometry = new THREE.ExtrudeGeometry(data.shape, {
        steps: 2,
        depth: 16,
        // bevelSize: 50,
        bevelOffset: 80,
      });
      highlightmesh.material = new THREE.MeshStandardMaterial({
        color: data.color,
      });
      if (scene.getObjectByName("highlightmesh")) {
        highlightmesh.visible = true;
      }
      document.body.style.cursor = "pointer";
    } else {
      if (scene.getObjectByName("highlightmesh")) {
        highlightmesh.visible = false;
      }
      document.body.style.cursor = "default";
    }
  }

  // console.log(controller.userData.selectPressed)
  // console.log(controller.userData.squeezePressed)

  if (controller.userData.squeezePressed) {
    if (points) {
      var intersects_points = [];
      if (points) {
        intersects_points = raycaster.intersectObjects(points.children);
      }

      let highlightmesh = scene.getObjectByName("highlightmesh");

      if (intersects_points.length > 0) {
        let click_name = intersects_points[0].object.name;
        let value = intersects_points[0].object.value;
        let coord = intersects_points[0].object.coord;
        let region = intersects_points[0].object.region;
        let meanbold = intersects_points[0].object.meanbold;

        userText.set({
          content:
            "Point Label:  " +
            String(click_name) +
            "\n" +
            "Region: " +
            String(region) +
            "\n" +
            " MeanBold: " +
            String(meanbold),
          fontColor: new THREE.Color(d3.interpolateSinebow(0.3)),
        });

        // const pointGeom = new THREE.IcosahedronGeometry( 2, 15 );
        // const pointMat = new THREE.MeshBasicMaterial( { color: 'red' } );
        const pointGeom = new THREE.SphereGeometry(3.5, 30, 30);
        const pointMat = new THREE.MeshPhongMaterial({ color: "red" });
        const point = new THREE.Mesh(pointGeom, pointMat);
        // point.layers.enable(1);
        if (coord) {
          point.position.set(coord[0], coord[1], coord[2]);
        }
        // pointGroup.add(point);

        // scene.add(pointGroup);

        if (all_voxel_index.includes(click_name)) {
          let index = all_voxel_index.indexOf(click_name);
          all_voxel_index.splice(index, 1);
          pointGroup.children.splice(index, 1);
          console.log("remove a voxel");
        } else {
          all_voxel_index.push(click_name);
          pointGroup.add(point);
          pointGroup.rotation.x = Math.PI / 2;
          pointGroup.rotation.y = Math.PI;
          // pointGroup.scale.set(0.04,0.04,0.04);
          // pointGroup.position.set(0,-0.7,0.7);
          pointGroup.position.set(0, 1.5, -7.5);
          pointGroup.scale.set(0.05, 0.048, 0.046);
          scene.add(pointGroup);
          pointGroup.name = "key_point";
          console.log("add a voxel");
        }
      }
    }
    if (points & regionbold_mode) {
      var intersects_points = raycaster.intersectObjects(points.children);

      if (intersects_points.length > 0) {
        let click_name = intersects_points[0].object.name;
        let value = intersects_points[0].object.value;
        let coord = intersects_points[0].object.coord;
        let region = intersects_points[0].object.region;
        let meanbold = intersects_points[0].object.meanbold;

        const RegionData = select_from_region(allData, click_name);
        // console.log(RegionData);
        templength = RegionData.length;

        userText.set({
          content:
            "Region: " +
            String(click_name) +
            "\n" +
            "Total " +
            String(templength) +
            " Points" +
            "\n" +
            "MeanBold: " +
            String(meanbold),
          fontColor: new THREE.Color(d3.interpolateSinebow(0.3)),
        });

        display_region(RegionData);
      }
    }

    if (meshgroup) {
      var meshgroup_intersect = scene.getObjectByName("meshgroup");
      // console.log(meshgroup)

      var intersects_points = raycaster.intersectObjects(
        meshgroup_intersect.children
      );

      if (intersects_points.length > 0) {
        let click_name = intersects_points[0].object.name;
        let coord = intersects_points[0].object.coord;
        let value = intersects_points[0].object.value;
        let region = intersects_points[0].object.region;

        userText.set({
          content:
            "Point Label:  " +
            String(click_name) +
            "\n" +
            "Region: " +
            String(region) +
            "\n" +
            "Bold at timepoint " +
            String(timepoint + 1) +
            ": " +
            String(value),
          fontColor: new THREE.Color(d3.interpolateSinebow(0.3)),
        });

        const pointGeom = new THREE.SphereGeometry(3.5, 30, 30);
        const pointMat = new THREE.MeshPhongMaterial({ color: "red" });
        const point = new THREE.Mesh(pointGeom, pointMat);
        if (coord) {
          point.position.set(coord[0], coord[1], coord[2]);
        }
        if (all_voxel_index.includes(click_name)) {
          let index = all_voxel_index.indexOf(click_name);
          all_voxel_index.splice(index, 1);
          pointGroup.children.splice(index, 1);
          console.log("remove a voxel");
        } else {
          all_voxel_index.push(click_name);
          pointGroup.add(point);
          pointGroup.rotation.x = Math.PI / 2;
          pointGroup.rotation.y = Math.PI;
          // pointGroup.scale.set(0.04,0.04,0.04);
          // pointGroup.position.set(0,-0.7,0.7);
          pointGroup.position.set(0, 1.5, -7.5);
          pointGroup.scale.set(0.05, 0.048, 0.046);
          scene.add(pointGroup);
          pointGroup.name = "key_point";
          console.log("add a voxel");
        }
      }
    }
  }

  // if (!controller.userData.squeezePressed) {
  //   document.removeEventListener("click", clickhighlightmesh, false);
  //   document.removeEventListener("click", clickhighlightmesh_region, false);
  //   document.removeEventListener("click", clickhighlightmeshgroup, false);
  // }

  if (hand) {
    if (controller.userData.squeezePressed) {
      let pos = dolly.position.clone();
      pos.y += 1;

      const speed = 1;
      const quaternion = dolly.quaternion.clone();
      const target = new THREE.Quaternion();
      dummyCam.getWorldQuaternion(target);
      dolly.quaternion.copy(target);

      const workingVector = new THREE.Vector3();
      dolly.getWorldDirection(workingVector);
      workingVector.negate();

      dolly.translateZ(-dt * speed);
      dolly.position.y = 0;
      dolly.quaternion.copy(quaternion);
    }

    // if (controller.userData.selectrPressed) {
    //   let pos = dolly.position.clone();
    //   pos.y += 1;

    //   const speed = 1;
    //   const quaternion = dolly.quaternion.clone();
    //   const target = new THREE.Quaternion();
    //   dummyCam.getWorldQuaternion(target);
    //   dolly.quaternion.copy(target);

    //   const workingVector = new THREE.Vector3();
    //   dolly.getWorldDirection(workingVector);
    //   workingVector.negate();

    //   dolly.translateZ(-dt * speed);
    //   dolly.position.y = 0;
    //   dolly.quaternion.copy(quaternion);
    // }
  }
}

////////////////////////////////////////////////
//            UI contruction
////////////////////////////////////////////////
function makePanel() {
  // Container block, in which we put the two buttons.
  // We don't define width and height, it will be set automatically from the children's dimensions
  // Note that we set contentDirection: "row-reverse", in order to orient the buttons horizontally

  const container = new ThreeMeshUI.Block({
    justifyContent: "center",
    contentDirection: "row-reverse",
    fontFamily: FontJSON,
    fontTexture: FontImage,
    fontSize: 0.07,
    padding: 0.02,
    borderRadius: 0.11,
  });

  container.position.set(7, -5, -6);
  // container.rotation.x = -0.55;
  // container.rotation.y = Math.PI/8;
  container.scale.setScalar(4);
  scene.add(container);
  container.name = "makepanel";

  // BUTTONS

  // We start by creating objects containing options that we will use with the two buttons,
  // in order to write less code.

  const buttonOptions = {
    width: 0.4,
    height: 0.15,
    justifyContent: "center",
    offset: 0.05,
    margin: 0.02,
    borderRadius: 0.075,
  };

  // Options for component.setupState().
  // It must contain a 'state' parameter, which you will refer to with component.setState( 'name-of-the-state' ).

  const hoveredStateAttributes = {
    state: "hovered",
    attributes: {
      offset: 0.035,
      backgroundColor: new THREE.Color(0x999999),
      backgroundOpacity: 1,
      fontColor: new THREE.Color(0xffffff),
    },
    onSet: () => {
      document.body.style.cursor = "pointer";
    },
  };

  const idleStateAttributes = {
    state: "idle",
    attributes: {
      offset: 0.035,
      backgroundColor: new THREE.Color(0x666666),
      backgroundOpacity: 0.3,
      fontColor: new THREE.Color(0xffffff),
    },
    onSet: () => {
      document.body.style.cursor = "default";
    },
  };

  // Buttons creation, with the options objects passed in parameters.

  const buttonNext = new ThreeMeshUI.Block(buttonOptions);
  const buttonPrevious = new ThreeMeshUI.Block(buttonOptions);

  // Add text to buttons

  buttonNext.add(new ThreeMeshUI.Text({ content: "cut" }));

  buttonPrevious.add(new ThreeMeshUI.Text({ content: "visible" }));

  // Create states for the buttons.
  // In the loop, we will call component.setState( 'state-name' ) when mouse hover or click

  const selectedAttributes = {
    offset: 0.02,
    backgroundColor: new THREE.Color(0x109c5d),
    fontColor: new THREE.Color(0x222222),
  };

  buttonNext.setupState({
    state: "selected",
    attributes: selectedAttributes,
    onSet: () => {
      let tempTimeSlice = [];
      let allBold = [];
      scene.remove(scene.getObjectByName("meshgroup"));
      scene.remove(scene.getObjectByName("highlightmeshgroup"));
      scene.remove(scene.getObjectByName("focusplane"));

      const SortedBoldData = RegionData.sort((a, b) =>
        d3.descending(a.Values[timepoint].Bold, b.Values[timepoint].Bold)
      );

      for (let i = 0; i < SortedBoldData.length; i++) {
        allBold.push(SortedBoldData[i].Values[timepoint].Bold);
      }

      const bold_scale = d3
        .scaleLinear()
        .domain([d3.min(allBold), d3.max(allBold)])
        .range([0.05, 0.95]);

      for (let i = 0; i < SortedBoldData.length; i++) {
        const Data = {
          Label: SortedBoldData[i].Label,
          timepoint: timepoint + 1,
          Values: SortedBoldData[i].Values[timepoint].Bold,
          Bold_scale: bold_scale(SortedBoldData[i].Values[timepoint].Bold),
          Coord: SortedBoldData[i].Coord,
          Region: SortedBoldData[i].Region,
          MeanBold: SortedBoldData[i].MeanBold,
        };
        // console.log(Data.Bold_scale)
        tempTimeSlice.push(Data);
      }

      slice_render3dChart(tempTimeSlice);
      const plane_time = draw_plane(timepoint, SortedBoldData.length);
      plane_time.name = "focusplane";
      scene.add(plane_time);
      // document.addEventListener("mousemove", hoverhighlightmeshgroup, false);
      // document.addEventListener("click", clickhighlightmeshgroup, false);
    },
  });
  buttonNext.setupState(hoveredStateAttributes);
  buttonNext.setupState(idleStateAttributes);

  //

  buttonPrevious.setupState({
    state: "selected",
    attributes: selectedAttributes,
    onSet: () => {
      var points = scene.getObjectByName("points_base");
    },
  });
  buttonPrevious.setupState(hoveredStateAttributes);
  buttonPrevious.setupState(idleStateAttributes);

  //

  container.add(buttonNext, buttonPrevious);
  objsToTest.push(buttonNext, buttonPrevious);
}

function makeUI() {
  const container = new THREE.Group();
  container.position.set(0, 6.78, -9);
  container.scale.set(7.2, 9, 7);
  // container.rotation.x = -0.15;
  scene.add(container);

  //////////////
  // TEXT PANEL
  //////////////

  const textPanel = new ThreeMeshUI.Block({
    fontFamily: FontJSON,
    fontTexture: FontImage,
    width: 1,
    height: 0.25,
    backgroundColor: new THREE.Color(colors_ui.panelBack),
    backgroundOpacity: 1,
  });

  textPanel.position.set(0, 0, 0);
  // textPanel.scale.setScalar( 5 );
  container.add(textPanel);

  //
  const title = new ThreeMeshUI.Block({
    width: 1,
    height: 0.1,
    justifyContent: "center",
    fontSize: 0.03,
    padding: 0.001,
    backgroundOpacity: 0,
  }).add(
    new ThreeMeshUI.Text({
      content:
        "DTBivt: Visual Analytics Toolkit for Brain-Inspired Research" +
        "\n" +
        "Bold Signal: max(0.043) min(0.014) median(0.024)",
    })
  );

  userText = new ThreeMeshUI.Text({ content: "" });

  const textField = new ThreeMeshUI.Block({
    width: 1,
    height: 0.15,
    fontSize: 0.035,
    padding: 0.001,
    backgroundOpacity: 0,
  }).add(userText);

  textPanel.add(title, textField);

  ////////////////////////
  // LAYOUT OPTIONS PANEL
  ////////////////////////

  // BUTTONS

  let layoutButtons = [
    ["English", "eng"],
    ["Nordic", "nord"],
    ["German", "de"],
    ["Spanish", "es"],
    ["French", "fr"],
    ["Russian", "ru"],
    ["Greek", "el"],
  ];

  layoutButtons = layoutButtons.map((options) => {
    const button = new ThreeMeshUI.Block({
      height: 0.06,
      width: 0.2,
      margin: 0.012,
      justifyContent: "center",
      backgroundColor: new THREE.Color(colors_ui.button),
      backgroundOpacity: 1,
    }).add(
      new ThreeMeshUI.Text({
        offset: 0,
        fontSize: 0.035,
        content: options[0],
      })
    );

    button.setupState({
      state: "idle",
      attributes: {
        offset: 0.02,
        backgroundColor: new THREE.Color(colors_ui.button),
        backgroundOpacity: 1,
      },
    });

    button.setupState({
      state: "hovered",
      attributes: {
        offset: 0.02,
        backgroundColor: new THREE.Color(colors_ui.hovered),
        backgroundOpacity: 1,
      },
    });

    button.setupState({
      state: "selected",
      attributes: {
        offset: 0.01,
        backgroundColor: new THREE.Color(colors_ui.selected),
        backgroundOpacity: 1,
      },
      onSet: () => {
        // enable intersection checking for the previous layout button,
        // then disable it for the current button

        if (currentLayoutButton) objsToTest.push(currentLayoutButton);

        if (keyboard) {
          clear(keyboard);

          keyboard.panels.forEach((panel) => clear(panel));
        }

        currentLayoutButton = button;

        makeKeyboard(options[1]);
      },
    });

    objsToTest.push(button);

    // Set English button as selected from the start

    if (options[1] === "eng") {
      button.setState("selected");

      currentLayoutButton = button;
    }

    return button;
  });

  // CONTAINER

  // layoutOptions = new ThreeMeshUI.Block( {
  // 	fontFamily: FontJSON,
  // 	fontTexture: FontImage,
  // 	height: 0.25,
  // 	width: 1,
  // 	offset: 0,
  // 	backgroundColor: new THREE.Color( colors_ui.panelBack ),
  // 	backgroundOpacity: 1
  // } ).add(
  // 	new ThreeMeshUI.Block( {
  // 		height: 0.1,
  // 		width: 0.6,
  // 		offset: 0,
  // 		justifyContent: 'center',
  // 		backgroundOpacity: 0
  // 	} ).add(
  // 		new ThreeMeshUI.Text( {
  // 			fontSize: 0.04,
  // 			content: 'Select a keyboard layout :'
  // 		} )
  // 	),

  // 	new ThreeMeshUI.Block( {
  // 		height: 0.075,
  // 		width: 1,
  // 		offset: 0,
  // 		contentDirection: 'row',
  // 		justifyContent: 'center',
  // 		backgroundOpacity: 0
  // 	} ).add(
  // 		layoutButtons[ 0 ],
  // 		layoutButtons[ 1 ],
  // 		layoutButtons[ 2 ],
  // 		layoutButtons[ 3 ]
  // 	),

  // 	new ThreeMeshUI.Block( {
  // 		height: 0.075,
  // 		width: 1,
  // 		offset: 0,
  // 		contentDirection: 'row',
  // 		justifyContent: 'center',
  // 		backgroundOpacity: 0
  // 	} ).add(
  // 		layoutButtons[ 4 ],
  // 		layoutButtons[ 5 ],
  // 		layoutButtons[ 6 ]
  // 	)
  // );

  // layoutOptions.position.set( 0, 0.2, 0 );
  // container.add( layoutOptions );
  // objsToTest.push( layoutOptions );
}

/*
Create a keyboard UI with three-mesh-ui, and assign states to each keys.
Three-mesh-ui strictly provides user interfaces, with tools to manage
UI state (component.setupState and component.setState).
It does not handle interacting with the UI. The reason for that is simple :
with webXR, the number of way a mesh can be interacted had no limit. Therefore,
this is left to the user. three-mesh-ui components are THREE.Object3Ds, so
you might want to refer to three.js documentation to know how to interact with objects.
If you want to get started quickly, just copy and paste this example, it manages
mouse and touch interaction, and VR controllers pointing rays.
*/

function makeKeyboard(language) {
  keyboard = new ThreeMeshUI.Keyboard({
    language: language,
    fontFamily: FontJSON,
    fontTexture: FontImage,
    fontSize: 0.035, // fontSize will propagate to the keys blocks
    backgroundColor: new THREE.Color(colors_ui.keyboardBack),
    backgroundOpacity: 1,
    backspaceTexture: Backspace,
    shiftTexture: Shift,
    enterTexture: Enter,
  });

  keyboard.position.set(0, -5, -7);
  keyboard.scale.setScalar(6);
  keyboard.rotation.x = -0.55;
  // scene.add(keyboard);

  //

  keyboard.keys.forEach((key) => {
    objsToTest.push(key);

    key.setupState({
      state: "idle",
      attributes: {
        offset: 0,
        backgroundColor: new THREE.Color(colors_ui.button),
        backgroundOpacity: 1,
      },
      onSet: () => {
        document.body.style.cursor = "default";
      },
    });

    key.setupState({
      state: "hovered",
      attributes: {
        offset: 0,
        backgroundColor: new THREE.Color(colors_ui.hovered),
        backgroundOpacity: 1,
      },
      onSet: () => {
        document.body.style.cursor = "pointer";
      },
    });

    key.setupState({
      state: "selected",
      attributes: {
        offset: -0.009,
        backgroundColor: new THREE.Color(colors_ui.selected),
        backgroundOpacity: 1,
      },
      // triggered when the user clicked on a keyboard's key
      onSet: () => {
        // if the key have a command (eg: 'backspace', 'switch', 'enter'...)
        // special actions are taken
        if (key.info.command) {
          switch (key.info.command) {
            // switch between panels
            case "switch":
              keyboard.setNextPanel();
              break;

            // switch between panel charsets (eg: russian/english)
            case "switch-set":
              keyboard.setNextCharset();
              break;

            case "enter":
              // select_regionNum(70)
              // select_regionNum(userText.content)
              scene.remove(scene.getObjectByName("meshgroup"));
              scene.remove(scene.getObjectByName("highlightmeshgroup"));
              scene.remove(scene.getObjectByName("focusplane"));
              document.removeEventListener(
                "mousemove",
                hoverhighlightmeshgroup,
                false
              );
              document.removeEventListener(
                "click",
                clickhighlightmesh_region,
                false
              );
              document.removeEventListener(
                "click",
                clickhighlightmeshgroup,
                false
              );
              let rand = function (min = 1, max = 92) {
                if (min == null && max == null) return 0;

                if (max == null) {
                  max = min;
                  min = 0;
                }
                return min + Math.floor(Math.random() * (max - min + 1));
              };
              let randint = rand();
              select_regionNum(randint);

              // userText.set( { content: userText.content + '\n' } );
              break;

            case "space":
              userText.set({ content: userText.content + " " });
              break;

            case "backspace":
              if (!userText.content.length) break;
              userText.set({
                content:
                  userText.content.substring(0, userText.content.length - 1) ||
                  "",
              });
              break;

            case "shift":
              keyboard.toggleCase();
              break;
          }

          // print a glyph, if any
        } else if (key.info.input) {
          userText.set({ content: userText.content + key.info.input });
        }
      },
    });
  });
}

function makeTextPanel() {
  const container = new ThreeMeshUI.Block({
    width: 0.635,
    height: 0.2,
    justifyContent: "center",
    fontFamily: FontJSON,
    fontTexture: FontImage,
    backgroundColor: new THREE.Color(colors_ui.panelBack),
    backgroundOpacity: 1,
  });

  container.position.set(-6, 6.8, -6.5);
  container.scale.setScalar(7);
  container.rotation.y = Math.PI / 8;
  scene.add(container);

  // onAfterUpdate can be set on any component ( Text, Block... ),
  // and get called after any update to the component.

  // container.onAfterUpdate = function () {
  // 	this.frame.layers.set( count % 2 );
  // };

  //

  const text = new ThreeMeshUI.Text({
    content: "Timepoint_Bold: ",
    fontSize: 0.08,
  });

  const counter = new ThreeMeshUI.Text({
    content: "1",
    fontSize: 0.08,
    fontColor: new THREE.Color(d3.interpolateSinebow(timepoint / 165)),
  });

  container.add(text, counter);

  // triggers updates to the component to test onAfterUpdate

  setInterval(() => {
    counter.set({
      content: String(timepoint + 1),
      fontColor: new THREE.Color(d3.interpolateSinebow(timepoint / 165)),
    });
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  const now = Date.now();
  const delta = clock.getDelta();

  // requestAnimationFrame( animate );

  updateButtons();
  updateButtons_panel();
  // Don't forget, ThreeMeshUI must be updated manually.
  // This has been introduced in version 3.0.0 in order
  // to improve performance
  ThreeMeshUI.update();

  tick();

  if (params.animate) {
    object.rotation.x += delta * 0.5;
    object.rotation.y += delta * 0.2;
  }

  // progressbar and duration time
  if (everyXframesUpdateProgBarInt++ >= everyXframesUpdateProgBar) {
    let progressBarLength =
      (PROGRESSPANELMAXWIDTH - (PROGRESSPANELMINWIDTH * 2 - 0.001)) *
      (timepoint / 166);
    progressBar.set({
      width:
        progressBarLength < PROGRESSPANELMINWIDTH
          ? PROGRESSPANELMINWIDTH
          : progressBarLength,
    });
    everyXframesUpdateProgBarInt = 0;
  }

  // vrcontrollers
  // if (vr_mode) {
  //   if (controllers) {
  //     controllers.forEach((controller) => {
  //       handleController(controller, delta);
  //     });
  //   }
  // }

  // // vrcontrollers
  if (vr_mode) {
    if (controllers) {
      handleController(controllers[0], true, delta);
      handleController(controllers[1], false, delta);
    }
  }

  if (scene.getObjectByName("brain_obj")) {
    for (var i = 0; i < planeObjects.length; i++) {
      var plane = planes[i];
      var po = planeObjects[i];
      plane.coplanarPoint(po.position);
      po.lookAt(
        po.position.x - plane.normal.x,
        po.position.y - plane.normal.y,
        po.position.z - plane.normal.z
      );
    }

    if (play_colormap_update) {
      display_region_colormap_update(slicingData);
    }
  }

  // orbit_control.update();

  stats.update();
  statsMesh.material.map.update();

  renderer.render(scene, camera);

  // composer.render();

  // // 更新体素颜色
  document.getElementById("p1").innerHTML =
    "timepoint_bold:" + (timepoint + 1).toString();
  if (start == true) {
    if (timepoint == 165) timepoint = -1;
    const data = [
      sim_bold.map((item) => item[timepoint]),
      real_bold.map((item) => item[timepoint]),
    ].reduce(function (a, b) {
      return a.concat(b);
    });

    let t = pro + 0.1 > 1 ? 1 : pro + 0.1;
    const colorsc = d3
      .scaleQuantize()
      .domain([d3.min(data), d3.max(data) * t])
      .range(colormap);

    updateBold_v3(colorsc, d3.max(data));
    timepoint++;
  }

  if (brainmodel) {
    TWEEN.update();
  }

  time = now - (delta % interval);
}

// Called in the loop, get intersection with either the mouse or the VR controllers,
// then update the buttons states according to result

function updateButtons() {
  // Find closest intersecting object

  let intersect;

  if (renderer.xr.isPresenting) {
    vrControl.setFromController(0, raycaster.ray);

    intersect = raycast();

    // Position the little white dot at the end of the controller pointing ray
    if (intersect) vrControl.setPointerAt(0, intersect.point);
  } else if (mouse.x !== null && mouse.y !== null) {
    raycaster.setFromCamera(mouse, camera);

    intersect = raycast();
  }

  // Update targeted button state (if any)

  if (intersect && intersect.object.isUI) {
    if (
      (selectState && intersect.object.currentState === "hovered") ||
      touchState
    ) {
      // Component.setState internally call component.set with the options you defined in component.setupState
      if (intersect.object.states["selected"])
        intersect.object.setState("selected");
    } else if (!selectState && !touchState) {
      // Component.setState internally call component.set with the options you defined in component.setupState
      if (intersect.object.states["hovered"])
        intersect.object.setState("hovered");
    }
  }

  // Update non-targeted buttons state

  objsToTest.forEach((obj) => {
    if ((!intersect || obj !== intersect.object) && obj.isUI) {
      // Component.setState internally call component.set with the options you defined in component.setupState
      if (obj.states["idle"]) obj.setState("idle");
    }
  });
}

//

function raycast() {
  return objsToTest.reduce((closestIntersection, obj) => {
    // keys in panels that are hidden are not tested
    // if ( !layoutOptions.getObjectById( obj.id ) &&
    // 	!keyboard.getObjectById( obj.id ) &&
    // 	intersectionRoom !== obj
    // ) {

    // 	return closestIntersection;

    // }

    const intersection = raycaster.intersectObject(obj, true);

    // if intersection is an empty array, we skip
    if (!intersection[0]) return closestIntersection;

    // if this intersection is closer than any previous intersection, we keep it
    if (
      !closestIntersection ||
      intersection[0].distance < closestIntersection.distance
    ) {
      // Make sure to return the UI object, and not one of its children (text, frame...)
      intersection[0].object = obj;

      return intersection[0];
    }

    return closestIntersection;
  }, null);
}

// Called in the loop, get intersection with either the mouse or the VR controllers,
// then update the buttons states according to result

function updateButtons_panel() {
  // Find closest intersecting object

  let intersect;

  if (renderer.xr.isPresenting) {
    vrControl.setFromController(0, raycaster.ray);

    intersect = raycasting();

    // Position the little white dot at the end of the controller pointing ray
    if (intersect) vrControl.setPointerAt(0, intersect.point);
  } else if (mouse.x !== null && mouse.y !== null) {
    raycaster.setFromCamera(mouse, camera);

    intersect = raycasting();
  }

  // Update targeted button state (if any)

  if (intersect && intersect.object.isUI) {
    if (selectState) {
      // Component.setState internally call component.set with the options you defined in component.setupState
      intersect.object.setState("selected");
    } else {
      // Component.setState internally call component.set with the options you defined in component.setupState
      intersect.object.setState("hovered");
    }
  }

  // Update non-targeted buttons state

  objsToTest.forEach((obj) => {
    if ((!intersect || obj !== intersect.object) && obj.isUI) {
      // Component.setState internally call component.set with the options you defined in component.setupState
      obj.setState("idle");
    }
  });
}

//

function raycasting() {
  return objsToTest.reduce((closestIntersection, obj) => {
    const intersection = raycaster.intersectObject(obj, true);

    if (!intersection[0]) return closestIntersection;

    if (
      !closestIntersection ||
      intersection[0].distance < closestIntersection.distance
    ) {
      intersection[0].object = obj;

      return intersection[0];
    }

    return closestIntersection;
  }, null);
}

// Remove this ui component cleanly

function clear(uiComponent) {
  scene.remove(uiComponent);

  // We must call this method when removing a component,
  // to make sure it's removed from the update registry.
  uiComponent.clear();

  uiComponent.traverse((child) => {
    if (objsToTest.includes(child))
      objsToTest.splice(objsToTest.indexOf(child), 1);
  });
}

async function select_regionNum(region_num) {
  scene.remove(scene.getObjectByName("focusplane"));
  scene.remove(scene.getObjectByName("meshgroup"));
  scene.remove(scene.getObjectByName("points_base"));
  scene.remove(scene.getObjectByName("highlightmesh"));
  scene.remove(scene.getObjectByName("highlightmeshgroup"));
  document.removeEventListener("click", clickhighlightmesh_region, false);
  document.removeEventListener("click", clickhighlightmeshgroup, false);
  document.removeEventListener("mousemove", hoverhighlightmeshgroup, false);
  pickingData = [];

  const RegionData = select_from_region(allData, region_num);
  console.log(RegionData);
  templength = RegionData.length;
  userText.set({
    content:
      "Region: " +
      String(region_num) +
      "\n" +
      "Total " +
      String(templength) +
      " Points",
    fontColor: new THREE.Color(d3.interpolateSinebow((region_num - 1) / 91)),
  });

  display_region(RegionData);

  // Render 2D Area Charts
  d3.selectAll("svg").remove();
  for (let i = 0; i < RegionData.length; i++) {
    renderAreaChart(RegionData[i]);
  }

  render3dChart(RegionData);
  document.addEventListener("mousemove", hoverhighlightmesh, false);
  document.addEventListener("click", clickhighlightmesh, false);
}

async function select_slice_pos() {
  scene.remove(scene.getObjectByName("focusplane"));
  scene.remove(scene.getObjectByName("meshgroup"));
  scene.remove(scene.getObjectByName("points_base"));
  scene.remove(scene.getObjectByName("highlightmesh"));
  scene.remove(scene.getObjectByName("highlightmeshgroup"));
  document.removeEventListener("mousemove", hoverhighlightmeshgroup, false);
  document.removeEventListener("click", clickhighlightmesh_region, false);
  document.removeEventListener("click", clickhighlightmeshgroup, false);
  pickingData = [];

  slicingData = select_from_slice(allData);
  console.log(slicingData);
  templength = slicingData.length;

  userText.set({
    content:
      "Plane Slicing:" + "\n" + "Total " + String(templength) + " Points",
    fontColor: new THREE.Color(d3.interpolateSinebow(0.3)),
  });

  display_region_colormap(slicingData);

  // Render 2D Area Charts
  d3.selectAll("svg").remove();
  for (let i = 0; i < slicingData.length; i++) {
    renderAreaChart(slicingData[i]);
  }

  render3dChart(slicingData);

  if (scene.getObjectByName("points_base")) {
    document.addEventListener("mousemove", hoverhighlightmesh, false);
    document.addEventListener("click", clickhighlightmesh, false);
  }
}

async function select_highbold_gen(timepoint) {
  scene.remove(scene.getObjectByName("focusplane"));
  scene.remove(scene.getObjectByName("meshgroup"));
  scene.remove(scene.getObjectByName("points_base"));
  scene.remove(scene.getObjectByName("highlightmesh"));
  scene.remove(scene.getObjectByName("highlightmeshgroup"));
  document.removeEventListener("mousemove", hoverhighlightmeshgroup, false);
  document.removeEventListener("mousemove", hoverhighlightmesh, false);
  document.removeEventListener("click", clickhighlightmesh, false);
  document.removeEventListener("click", clickhighlightmesh_region, false);
  document.removeEventListener("click", clickhighlightmeshgroup, false);

  let tempTimeSlice = [];
  let allBold = [];
  let SortedBoldData;

  SortedBoldData = select_from_highbold(allData, timepoint);
  console.log(SortedBoldData);
  templength = SortedBoldData.length;

  for (let i = 0; i < SortedBoldData.length; i++) {
    allBold.push(SortedBoldData[i].Values[timepoint].Bold);
  }

  const bold_scale = d3
    .scaleLinear()
    .domain([d3.min(allBold), d3.max(allBold)])
    .range([0.05, 0.95]);

  for (let i = 0; i < SortedBoldData.length; i++) {
    const Data = {
      Label: SortedBoldData[i].Label,
      timepoint: timepoint + 1,
      Values: SortedBoldData[i].Values[timepoint].Bold,
      Bold_scale: bold_scale(SortedBoldData[i].Values[timepoint].Bold),
      Coord: SortedBoldData[i].Coord,
      Region: SortedBoldData[i].Region,
      MeanBold: SortedBoldData[i].MeanBold,
    };
    // console.log(Data.Bold_scale)
    tempTimeSlice.push(Data);
  }

  display_region(tempTimeSlice);
  slice_render3dChart(tempTimeSlice);

  if (scene.getObjectByName("highlightmeshgroup")) {
    document.addEventListener("mousemove", hoverhighlightmeshgroup, false);
    document.addEventListener("click", clickhighlightmeshgroup, false);
  }
}

async function display_regionSumBold() {
  scene.remove(scene.getObjectByName("focusplane"));
  scene.remove(scene.getObjectByName("meshgroup"));
  scene.remove(scene.getObjectByName("points_base"));
  scene.remove(scene.getObjectByName("highlightmesh"));
  scene.remove(scene.getObjectByName("highlightmeshgroup"));
  document.removeEventListener("mousemove", hoverhighlightmeshgroup, false);
  document.removeEventListener("click", clickhighlightmesh, false);
  document.removeEventListener("click", clickhighlightmeshgroup, false);
  // region_boldsum_ = boldSum_Region(region_boldsum);
  // Render 2D Area Charts
  regionbold_mode = true;
  d3.selectAll("svg").remove();
  for (let i = 0; i < region_boldsum_.length; i++) {
    renderAreaChart(region_boldsum_[i]);
  }

  render3dChart(region_boldsum_);
  document.addEventListener("mousemove", hoverhighlightmesh, false);
  document.addEventListener("click", clickhighlightmesh_region, false);
}

async function main() {
  allData = await formatData("data/bold_sim_ave.csv");
  console.log(allData);

  // RegionSumBold = [];
  // let tempMeanRegion = [];

  // for (let i =1; i<=92; i++) {
  //   let tempPerRegion = [];
  //   const SortedBoldData = allData
  //   .filter((d) => d.Region === i);

  //   for (let j=0; j<=165; j++) {

  //     let tempsum = [];
  //     for (let k = 0; k < SortedBoldData.length; k++) {
  //       let temp = SortedBoldData[k].Values[j].Bold;
  //       tempsum.push(temp)
  //     }
  //     tempPerRegion.push(tempsum.reduce((a, b) => a + b, 0)/SortedBoldData.length)
  //   }
  //   tempMeanRegion[i] = tempPerRegion;
  // }
  // console.log(tempMeanRegion)

  // select_regionNum(70)

  // const RegionData = select_from_region(allData, 70)
  // console.log(RegionData)

  // // Render 2D Area Charts
  // for (let i = 0; i < RegionData.length; i++) {
  //   renderAreaChart(RegionData[i]);
  // }

  // render3dChart(RegionData);
}

// main();

async function formatData(dataPath) {
  let allData = await d3.csv(dataPath);
  let mean = [];

  for (let i = 0; i < allData.length; i++) {
    let bold = [];
    let temp = [];
    for (let j = 0; j < 166; j++) {
      temp.push(allData[i][j]);
      allData[i][j] = {
        Timepoint: j + 1,
        Bold: Number(allData[i][j]),
      };
      bold.push(allData[i][j]);
    }
    mean.push(d3.mean(temp));
    allData[i] = bold;
  }

  allData = allData.map((d, i) => {
    return {
      Label: i,
      Values: d,
      Coord: coord[i],
      world_Coord: world_coord[i],
      Region: region[i],
      MeanBold: mean[i],
    };
  });

  return allData;
}

function select_from_region(data, region_num) {
  let maxmin = [];
  const SortedBoldData = data
    .filter((d) => d.Region === region_num)
    .sort((a, b) => d3.descending(a.MeanBold, b.MeanBold));

  // Create an array of objects for the voxel with the same region_num
  RegionData = [];

  for (let i = 0; i < SortedBoldData.length; i++) {
    const Data = {
      Label: SortedBoldData[i].Label,
      Values: SortedBoldData[i].Values,
      Coord: SortedBoldData[i].Coord,
      Region: SortedBoldData[i].Region,
      MeanBold: SortedBoldData[i].MeanBold,
    };
    for (let j = 0; j < 166; j++) {
      maxmin.push(SortedBoldData[i].Values[j].Bold);
    }
    RegionData.push(Data);
  }

  maxbold = d3.max(maxmin);
  minbold = d3.min(maxmin);
  // console.log(maxbold, minbold)
  return RegionData;
}

function select_from_slice(data) {
  let pos0 = planes[0].constant;
  let pos1 = planes[1].constant;
  let pos2 = planes[2].constant;
  let SortedBoldData;
  let maxmin = [];

  // if (plane_num === 0) {
  //   SortedBoldData = data
  //     .filter(
  //       (d) => (d.world_Coord.x >= pos - 0.06) & (d.world_Coord.x <= pos + 0.06)
  //     )
  //     .sort((a, b) => d3.descending(a.MeanBold, b.MeanBold));
  // } else if (plane_num === 1) {
  //   SortedBoldData = data
  //     .filter(
  //       (d) => (d.world_Coord.y >= pos - 0.06) & (d.world_Coord.y <= pos + 0.06)
  //     )
  //     .sort((a, b) => d3.descending(a.MeanBold, b.MeanBold));
  // } else if (plane_num === 2) {
  //   SortedBoldData = data
  //     .filter(
  //       (d) => (d.world_Coord.z >= pos - 0.06) & (d.world_Coord.z <= pos + 0.06)
  //     )
  //     .sort((a, b) => d3.descending(a.MeanBold, b.MeanBold));
  // }

  let SortedBoldData0 = data.filter(
    (d) => (d.world_Coord.x >= pos0 - 0.06) & (d.world_Coord.x <= pos0 + 0.06)
  );

  let SortedBoldData1 = data.filter(
    (d) => (d.world_Coord.y >= pos1 - 0.06) & (d.world_Coord.y <= pos1 + 0.06)
  );

  let SortedBoldData2 = data.filter(
    (d) => (d.world_Coord.z >= pos2 - 0.07) & (d.world_Coord.z <= pos2 + 0.07)
  );

  let SortedBoldData_all = SortedBoldData0.concat(
    SortedBoldData1,
    SortedBoldData2
  );

  // console.log(SortedBoldData_all)

  SortedBoldData = SortedBoldData_all.filter(
    (d) =>
      (d.world_Coord.x <= pos0 + 0.05) &
      (d.world_Coord.y <= pos1 + 0.03) &
      (d.world_Coord.z <= pos2 + 0.06)
  ).sort((a, b) => d3.descending(a.MeanBold, b.MeanBold));

  // Create an array of objects for voxel with the same slicing plane position
  SliceData = [];

  for (let i = 0; i < SortedBoldData.length; i++) {
    const Data = {
      Label: SortedBoldData[i].Label,
      Values: SortedBoldData[i].Values,
      Coord: SortedBoldData[i].Coord,
      world_Coord: SortedBoldData[i].world_Coord,
      Region: SortedBoldData[i].Region,
      MeanBold: SortedBoldData[i].MeanBold,
    };

    for (let j = 0; j < 166; j++) {
      maxmin.push(SortedBoldData[i].Values[j].Bold);
    }
    SliceData.push(Data);
  }

  maxbold = d3.max(maxmin);
  minbold = d3.min(maxmin);
  console.log(maxbold, minbold);
  return SliceData;
}

function select_from_highbold(data, timepoint) {
  const SortedBoldData = data
    .filter((d) => d.Values[timepoint].Bold > 0.0435 * 0.7)
    .sort((a, b) =>
      d3.descending(a.Values[timepoint].Bold, b.Values[timepoint].Bold)
    );

  // Create an array of objects for the voxel with the same region_num
  HighBoldData = [];

  for (let i = 0; i < SortedBoldData.length; i++) {
    const Data = {
      Label: SortedBoldData[i].Label,
      Values: SortedBoldData[i].Values,
      Coord: SortedBoldData[i].Coord,
      Region: SortedBoldData[i].Region,
      MeanBold: SortedBoldData[i].MeanBold,
    };

    HighBoldData.push(Data);
  }

  return HighBoldData;
}

function boldSum_Region(region_boldsum) {
  let mean = [];
  let maxmin = [];
  RegionBoldData = [];
  for (let i = 1; i <= 92; i++) {
    let bold = [];
    let temp = [];
    for (let j = 0; j < 166; j++) {
      temp.push(region_boldsum[i][j]);
      region_boldsum[i][j] = {
        Timepoint: j + 1,
        Bold: Number(region_boldsum[i][j]),
      };
      bold.push(region_boldsum[i][j]);
      maxmin.push(region_boldsum[i][j].Bold);
    }
    mean.push(d3.mean(temp));
    region_boldsum[i] = bold;

    const Data = {
      Region: i,
      Values: region_boldsum[i],
      MeanBold: mean[i - 1],
      star: 1,
    };

    RegionBoldData.push(Data);
  }
  maxbold = d3.max(maxmin);
  minbold = d3.min(maxmin);
  // console.log(maxbold, minbold)
  RegionBoldData = RegionBoldData.sort((a, b) =>
    d3.descending(a.MeanBold, b.MeanBold)
  );

  return RegionBoldData;
}
// console.log(boldSum_Region(region_boldsum))

function renderAreaChart(data) {
  const allData = data.Values;

  let svg = d3
    .select(".container")
    .append("svg")
    .attr("width", 1000)
    .attr("height", 250);

  const timeParser = d3.timeParse("%L");

  let x = d3.scaleTime().domain([1, 166]).range([0, 1000]);

  //   console.log(d3.extent(allData, (d) => d.Count));

  // let y = d3.scalePow().exponent(1).domain([0.01, 0.0435]).range([500, 0]);
  let y = d3.scalePow().exponent(1).domain([minbold, maxbold]).range([250, 0]);

  svg
    .append("path")
    .datum(allData)
    .attr("fill", "#ffffff")
    .attr(
      "d",
      d3
        .area()
        .x((d) => x(d.Timepoint))
        .y0(y(0))
        .y1((d) => y(d.Bold))
    );
}

function render3dChart(RegionData) {
  // const allColors = [
  //     0xfafa6e, 0xfaf466, 0xfbef5e, 0xfbe956, 0xfce34d, 0xfcde45, 0xfdd83d,
  //     0xfed235, 0xfecc2d, 0xffc624, 0xffbf1a, 0xffb90e, 0xffb300, 0xffac00,
  //     0xffa600, 0xff9f00, 0xff9800, 0xff9100, 0xff8a00, 0xff8200, 0xff7b00,
  //     0xff7300, 0xff6a00, 0xff6200, 0xff5800, 0xff4e00, 0xff4300, 0xff3500,
  //     0xff2400, 0xff0000,
  // ];

  const svgList = document.querySelectorAll("svg");
  const loader = new SVGLoader();
  const fontLoader = new FontLoader();
  const textMaterial = new THREE.MeshStandardMaterial(0xffffff);
  points_base = new THREE.Group();

  // const mycolor = d3.scaleLinear()
  //  .domain([0, svgList.length-1])
  // //  .interpolator(d3.interpolateSpectral)
  //  .interpolator(d3.interpolateRdYlBu)

  const mycolor = d3.interpolateRdYlBu;
  // console.log(new THREE.Color(mycolor(0.5)))

  console.log(svgList.length, RegionData.length);

  for (let i = 0; i < svgList.length; i++) {
    const svgData = loader.parse(svgList[i].outerHTML);
    const shape = svgData.paths[0].toShapes(true)[0];
    let interpolate = i / (svgList.length - 1);

    const geometry2 = new THREE.ExtrudeGeometry(shape, {
      steps: 2,
      depth: 16,
    });

    const cubeMaterial = new THREE.MeshStandardMaterial({
      // color: allColors[svgList.length - i - 1],
      color: new THREE.Color(mycolor(interpolate)),
    });

    let mesh = new THREE.Mesh(geometry2, cubeMaterial);
    mesh.scale.set(0.01, 0.01, 0.01);
    mesh.rotation.set(0, Math.PI, Math.PI);
    mesh.position.set(5, -2, -7 - i / 3);
    if (RegionData[i].Coord) {
      mesh.coord = RegionData[i].Coord;
    }
    mesh.name = RegionData[i].Label;
    mesh.value = RegionData[i].Values;
    mesh.region = RegionData[i].Region;
    mesh.meanbold = RegionData[i].MeanBold;
    if (RegionData[i].star) {
      mesh.name = RegionData[i].Region;
    }

    mesh.castShadow = true; //default is false
    mesh.receiveShadow = true;
    points_base.add(mesh);

    let highlightmesh = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        steps: 2,
        depth: 16,
      }),
      new THREE.MeshStandardMaterial({
        // color: allColors[svgList.length - i - 1],
        color: new THREE.Color(mycolor(interpolate)),
      })
    );
    highlightmesh.scale.set(0.01, 0.01, 0.01);
    highlightmesh.rotation.set(0, Math.PI, Math.PI);
    highlightmesh.position.set(2000, 2000, 20000);
    scene.add(highlightmesh);
    highlightmesh.name = "highlightmesh";

    pickingData[mesh.name] = {
      position: mesh.position,
      // color: allColors[svgList.length - i - 1],
      color: new THREE.Color(mycolor(interpolate)),
      shape: loader.parse(svgList[i].outerHTML).paths[0].toShapes(true)[0],
    };

    //   fontLoader.load("fonts/ibm_plex.json", (font) => {
    //     const textGeometry = new TextGeometry(RegionData[i].Label, {
    //       font: font,
    //       size: 0.15,
    //       height: 0.04,
    //     });

    //     const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    //     textMesh.geometry.computeBoundingBox();
    //     textMesh.geometry.translate(-textMesh.geometry.boundingBox.max.x, 0, 0);
    //     textMesh.rotation.set(-Math.PI / 2, 0, 0);
    //     textMesh.position.set(3.8, -13.9, -6 + i / 3);

    //     scene.add(textMesh);
    //   });

    //   fontLoader.load("fonts/ibm_plex.json", (font) => {
    //     const popuCount = RegionData[i]["Values"][57]["Count"];
    //     console.log(popuCount / 150000000);
    //     const popuCountFormatted = (popuCount / 1000000).toFixed(2) + "M";

    //     const textGeometry = new TextGeometry(popuCountFormatted.toString(), {
    //       font: font,
    //       size: 0.18,
    //       height: 0.01,
    //       curveSegments: 1,
    //     });

    //     const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    //     textMesh.position.set(11, Math.pow(popuCount / 150000, 0.3) - 5, -6 + i / 3);
    //     scene.add(textMesh);
    //   });
  }
  scene.add(points_base);
  points_base.name = "points_base";

  // const allPoints = [
  //   [new THREE.Vector3(-1, 1, -10.2), new THREE.Vector3(0, 1, -10.2)],
  //   [new THREE.Vector3(-1, 5, -10.2), new THREE.Vector3(0, 5, -10.2)],
  //   [new THREE.Vector3(-1, 10, -10.2), new THREE.Vector3(0, 10, -10.2)],
  //   [new THREE.Vector3(-1, 15, -10.2), new THREE.Vector3(3.5, 15, -10.2)],
  //   [new THREE.Vector3(6, 16, -10.2), new THREE.Vector3(6, 16, -3)],
  //   [new THREE.Vector3(5, 5, 0), new THREE.Vector3(5, 5, 1)],
  //   [new THREE.Vector3(5, 2, 0), new THREE.Vector3(5, 2, 1)],
  // ];

  // const lineMaterial = new THREE.LineDashedMaterial({
  //   color: 0xffffff,
  //   linewidth: 1,
  //   dashSize: 0.1,
  //   gapSize: 0.1,
  // });

  // for (let i = 0; i < allPoints.length; i++) {
  //   const dataPoints = allPoints[i];
  //   const lineGeom = new THREE.BufferGeometry().setFromPoints(dataPoints);
  //   const line = new THREE.Line(lineGeom, lineMaterial);
  //   line.computeLineDistances();
  //   scene.add(line);
  // }

  // const normalLineMaterial = new THREE.LineBasicMaterial(0xffffff);
  // // Axis Lines
  // for (let i = 0; i < 11; i++) {
  //   const points = [];
  //   let lineZEnd = i === 0 || i === 10 ? 1.5 : 0.5;
  //   const xOffset = 2;

  //   points.push(new THREE.Vector3(i / xOffset, 0, -0.2));
  //   points.push(new THREE.Vector3(i / xOffset, 0, lineZEnd));

  //   const line = new THREE.Line(
  //     new THREE.BufferGeometry().setFromPoints(points),
  //     normalLineMaterial
  //   );
  //   line.computeLineDistances();
  //   scene.add(line);
  // }
}

function slice_render3dChart(Data) {
  scene.remove(scene.getObjectByName("highlightmesh"));
  scene.remove(scene.getObjectByName("highlightmeshgroup"));
  scene.remove(scene.getObjectByName("focusplane"));
  document.removeEventListener("mousemove", hoverhighlightmeshgroup, false);
  document.removeEventListener("click", clickhighlightmeshgroup, false);
  let pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  let envmap;

  const MAX_HEIGHT = 30;
  (async function () {
    let envmapTexture = await new RGBELoader().loadAsync("textures/envmap.hdr");
    let rt = pmrem.fromEquirectangular(envmapTexture);
    envmap = rt.texture;

    let textures = {
      dirt: await new THREE.TextureLoader().loadAsync("textures/dirt.png"),
      dirt2: await new THREE.TextureLoader().loadAsync("textures/dirt2.jpg"),
      grass: await new THREE.TextureLoader().loadAsync("textures/grass.jpg"),
      sand: await new THREE.TextureLoader().loadAsync("textures/sand.jpg"),
      water: await new THREE.TextureLoader().loadAsync("textures/water.jpg"),
      stone: await new THREE.TextureLoader().loadAsync("textures/stone.png"),
    };

    const STONE_HEIGHT = MAX_HEIGHT * 0.8;
    const DIRT_HEIGHT = MAX_HEIGHT * 0.7;
    const GRASS_HEIGHT = MAX_HEIGHT * 0.5;
    const SAND_HEIGHT = MAX_HEIGHT * 0.3;
    const DIRT2_HEIGHT = MAX_HEIGHT * 0.1;

    let noise;
    let meshgroup = new THREE.Group();
    for (let i = 0; i < Data.length / 15; i++) {
      for (let j = 0; j < 15; j++) {
        let position = tileToPosition(i, j);
        let idx = j + 15 * i;
        if (idx < Data.length) {
          noise = Data[idx].Bold_scale;
        } else {
          break;
        }
        // console.log(noise)

        let height = noise * MAX_HEIGHT;
        let mapTexture;
        if (height > STONE_HEIGHT) {
          mapTexture = textures.stone;
        } else if (height > DIRT_HEIGHT) {
          mapTexture = textures.dirt;
        } else if (height > GRASS_HEIGHT) {
          mapTexture = textures.grass;
        } else if (height > SAND_HEIGHT) {
          mapTexture = textures.sand;
        } else if (height > DIRT2_HEIGHT) {
          mapTexture = textures.dirt2;
        }

        let geo = hexGeometry(height, position);
        let mat = new THREE.MeshPhysicalMaterial({
          envMap: envmap,
          envMapIntensity: 0.135,
          flatShading: true,
          map: mapTexture,
        });
        let mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true; //default is false
        mesh.receiveShadow = true; //default
        meshgroup.add(mesh);

        if (idx < Data.length) {
          mesh.name = Data[idx].Label;
          mesh.value = Data[idx].Values;
          mesh.coord = Data[idx].Coord;
          mesh.region = Data[idx].Region;
          mesh.meanbold = Data[idx].MeanBold;
        }

        pickingData_timeslice[mesh.name] = {
          position: position,
          height: height,
        };
      }
    }

    meshgroup.scale.setScalar(0.25);
    meshgroup.rotateY(-Math.PI / 2);
    meshgroup.position.set(12, -8, -3.5);
    scene.add(meshgroup);
    meshgroup.name = "meshgroup";
    world_Coord_meshgroup = [];
    // console.log(meshgroup)
    meshgroup.children.forEach((d, i) => {
      //该语句默认在threejs渲染的过程中执行  如果想获得世界矩阵属性、世界位置属性等属性，需要手动更新
      scene.updateMatrixWorld(true);
      // 声明一个三维向量用来保存网格模型的世界坐标
      var worldPosition = new THREE.Vector3();
      // 获得世界坐标，执行getWorldPosition方法，提取网格模型的世界坐标结果保存到参数worldPosition中
      d.getWorldPosition(worldPosition);
      // d.wor_pos = worldPosition;
      world_Coord_meshgroup[d.name] = worldPosition;
      // world_Coord_meshgroup.push(worldPosition)
      // pickingData_timeslice[d.name].push({wor_pos: worldPosition})
      // console.log('查看网格模型世界坐标',worldPosition);
    });
    // console.log(pickingData_timeslice)
    // console.log(world_Coord_meshgroup)

    let highlightmesh = new THREE.Mesh(
      new hexGeometry(MAX_HEIGHT, tileToPosition(1000, 1000)),
      new THREE.MeshStandardMaterial({
        color: "white",
      })
    );
    highlightmesh.scale.set(0.01, 0.01, 0.01);
    highlightmesh.rotation.set(0, Math.PI, Math.PI);
    highlightmesh.position.set(2000, 2000, 2000);
    scene.add(highlightmesh);
    highlightmesh.name = "highlightmeshgroup";

    document.addEventListener("mousemove", hoverhighlightmeshgroup, false);
    document.addEventListener("click", clickhighlightmeshgroup, false);
  })();

  function tileToPosition(tileX, tileY) {
    return new THREE.Vector2((tileX + (tileY % 2) * 0.5) * 1.77, tileY * 1.535);
  }

  function hexGeometry(height, position) {
    let geo = new THREE.CylinderGeometry(1, 1, height, 6, 1, false);
    geo.translate(position.x, height * 0.5, position.y);

    return geo;
  }

  let stoneGeo = new THREE.BoxGeometry(0, 0, 0);
  let dirtGeo = new THREE.BoxGeometry(0, 0, 0);
  let dirt2Geo = new THREE.BoxGeometry(0, 0, 0);
  let sandGeo = new THREE.BoxGeometry(0, 0, 0);
  let grassGeo = new THREE.BoxGeometry(0, 0, 0);

  function hex(height, position) {
    let geo = hexGeometry(height, position);

    if (height > STONE_HEIGHT) {
      stoneGeo = mergeBufferGeometries([geo, stoneGeo]);
    } else if (height > DIRT_HEIGHT) {
      dirtGeo = mergeBufferGeometries([geo, dirtGeo]);
    } else if (height > GRASS_HEIGHT) {
      grassGeo = mergeBufferGeometries([geo, grassGeo]);
    } else if (height > SAND_HEIGHT) {
      sandGeo = mergeBufferGeometries([geo, sandGeo]);
    } else if (height > DIRT2_HEIGHT) {
      dirt2Geo = mergeBufferGeometries([geo, dirt2Geo]);
    }
  }

  function hexMesh(geo, map) {
    let mat = new THREE.MeshPhysicalMaterial({
      envMap: envmap,
      envMapIntensity: 0.135,
      flatShading: true,
      map,
    });

    let mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true; //default is false
    mesh.receiveShadow = true; //default

    return mesh;
  }
}

// document.addEventListener('mousemove', hoverhighlightmesh, false);
// document.addEventListener('click', clickhighlightmesh, false);

// 悬浮鼠标高亮__时间切片
function hoverhighlightmeshgroup(event) {
  let getBoundingClientRect = canvas.getBoundingClientRect();
  let x =
      ((event.clientX - getBoundingClientRect.left) / canvas.offsetWidth) * 2 -
      1,
    y =
      -((event.clientY - getBoundingClientRect.top) / canvas.offsetHeight) * 2 +
      1;

  if (controls.isLocked === true) {
    x = 0;
    y = 0;
  }

  var vector = new THREE.Vector3(x, y, 0.5);
  vector = vector.unproject(camera);
  var raycaster = new THREE.Raycaster(
    camera.position,
    vector.sub(camera.position).normalize()
  );

  var meshgroup_intersect = scene.getObjectByName("meshgroup");
  // console.log(meshgroup)
  var highlightmeshgroup = scene.getObjectByName("highlightmeshgroup");
  var intersects_points = raycaster.intersectObjects(
    meshgroup_intersect.children
  );

  if (intersects_points.length > 0) {
    let id = intersects_points[0].object.name;
    let data = pickingData_timeslice[id];

    highlightmeshgroup.geometry = new THREE.CylinderGeometry(
      1,
      1,
      data.height + 1,
      6,
      1,
      false
    );
    // highlightmeshgroup.geometry = new hexGeometry(data.height, data.position);
    highlightmeshgroup.material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
    });
    // highlightmeshgroup.position.copy(world_Coord_meshgroup[id]);
    highlightmeshgroup.position.set(0, 0, -3);
    highlightmeshgroup.visible = true;
    document.body.style.cursor = "pointer";
  } else {
    highlightmeshgroup.visible = false;
    document.body.style.cursor = "default";
  }
}

// 悬浮鼠标高亮__数据流
function hoverhighlightmesh(event) {
  let getBoundingClientRect = canvas.getBoundingClientRect();
  let x =
      ((event.clientX - getBoundingClientRect.left) / canvas.offsetWidth) * 2 -
      1,
    y =
      -((event.clientY - getBoundingClientRect.top) / canvas.offsetHeight) * 2 +
      1;

  if (controls.isLocked === true) {
    x = 0;
    y = 0;
  }

  var vector = new THREE.Vector3(x, y, 0.5);
  vector = vector.unproject(camera);
  var raycaster = new THREE.Raycaster(
    camera.position,
    vector.sub(camera.position).normalize()
  );

  let points = scene.getObjectByName("points_base");
  let highlightmesh = scene.getObjectByName("highlightmesh");
  var intersects_points = [];
  if (points) {
    intersects_points = raycaster.intersectObjects(points.children);
  }

  if (intersects_points.length > 0) {
    let id = intersects_points[0].object.name;
    let data = pickingData[id];
    highlightmesh.position.copy(data.position);
    highlightmesh.geometry = new THREE.ExtrudeGeometry(data.shape, {
      steps: 2,
      depth: 16,
      // bevelSize: 50,
      bevelOffset: 80,
    });
    highlightmesh.material = new THREE.MeshStandardMaterial({
      color: data.color,
    });
    if (scene.getObjectByName("highlightmesh")) {
      highlightmesh.visible = true;
    }
    document.body.style.cursor = "pointer";
  } else {
    if (scene.getObjectByName("highlightmesh")) {
      highlightmesh.visible = false;
    }
    document.body.style.cursor = "default";
  }
}

function clickhighlightmesh(event) {
  let getBoundingClientRect = canvas.getBoundingClientRect();
  let x =
      ((event.clientX - getBoundingClientRect.left) / canvas.offsetWidth) * 2 -
      1,
    y =
      -((event.clientY - getBoundingClientRect.top) / canvas.offsetHeight) * 2 +
      1;

  if (controls.isLocked === true) {
    x = 0;
    y = 0;
  }

  var vector = new THREE.Vector3(x, y, 0.5);
  vector = vector.unproject(camera);
  var raycaster = new THREE.Raycaster(
    camera.position,
    vector.sub(camera.position).normalize()
  );

  var points = scene.getObjectByName("points_base");
  var intersects_points = [];
  if (points) {
    intersects_points = raycaster.intersectObjects(points.children);
  }

  let highlightmesh = scene.getObjectByName("highlightmesh");

  if (intersects_points.length > 0) {
    let click_name = intersects_points[0].object.name;
    let value = intersects_points[0].object.value;
    let coord = intersects_points[0].object.coord;
    let region = intersects_points[0].object.region;
    let meanbold = intersects_points[0].object.meanbold;

    userText.set({
      content:
        "Point Label:  " +
        String(click_name) +
        "\n" +
        "Region: " +
        String(region) +
        "\n" +
        " MeanBold: " +
        String(meanbold),
      fontColor: new THREE.Color(d3.interpolateSinebow(0.3)),
    });

    // const pointGeom = new THREE.IcosahedronGeometry( 2, 15 );
    // const pointMat = new THREE.MeshBasicMaterial( { color: 'red' } );
    const pointGeom = new THREE.SphereGeometry(3.5, 30, 30);
    const pointMat = new THREE.MeshPhongMaterial({ color: "red" });
    const point = new THREE.Mesh(pointGeom, pointMat);
    // point.layers.enable(1);
    if (coord) {
      point.position.set(coord[0], coord[1], coord[2]);
    }
    // pointGroup.add(point);

    // scene.add(pointGroup);

    if (all_voxel_index.includes(click_name)) {
      let index = all_voxel_index.indexOf(click_name);
      all_voxel_index.splice(index, 1);
      pointGroup.children.splice(index, 1);
      console.log("remove a voxel");
    } else {
      all_voxel_index.push(click_name);
      pointGroup.add(point);
      pointGroup.rotation.x = Math.PI / 2;
      pointGroup.rotation.y = Math.PI;
      // pointGroup.scale.set(0.04,0.04,0.04);
      // pointGroup.position.set(0,-0.7,0.7);
      pointGroup.position.set(0, 1.5, -7.5);
      pointGroup.scale.set(0.05, 0.048, 0.046);
      scene.add(pointGroup);
      pointGroup.name = "key_point";
      console.log("add a voxel");
    }
  }
}

async function clickhighlightmesh_region(event) {
  let getBoundingClientRect = canvas.getBoundingClientRect();
  let x =
      ((event.clientX - getBoundingClientRect.left) / canvas.offsetWidth) * 2 -
      1,
    y =
      -((event.clientY - getBoundingClientRect.top) / canvas.offsetHeight) * 2 +
      1;

  if (controls.isLocked === true) {
    x = 0;
    y = 0;
  }

  var vector = new THREE.Vector3(x, y, 0.5);
  vector = vector.unproject(camera);
  var raycaster = new THREE.Raycaster(
    camera.position,
    vector.sub(camera.position).normalize()
  );

  var points = scene.getObjectByName("points_base");
  var intersects_points = raycaster.intersectObjects(points.children);

  if (intersects_points.length > 0) {
    let click_name = intersects_points[0].object.name;
    let value = intersects_points[0].object.value;
    let coord = intersects_points[0].object.coord;
    let region = intersects_points[0].object.region;
    let meanbold = intersects_points[0].object.meanbold;

    const RegionData = select_from_region(allData, click_name);
    // console.log(RegionData);
    templength = RegionData.length;

    userText.set({
      content:
        "Region: " +
        String(click_name) +
        "\n" +
        "Total " +
        String(templength) +
        " Points" +
        "\n" +
        "MeanBold: " +
        String(meanbold),
      fontColor: new THREE.Color(d3.interpolateSinebow(0.3)),
    });

    display_region(RegionData);
  }
}

async function clickhighlightmeshgroup_region(event) {
  let getBoundingClientRect = canvas.getBoundingClientRect();
  let x =
      ((event.clientX - getBoundingClientRect.left) / canvas.offsetWidth) * 2 -
      1,
    y =
      -((event.clientY - getBoundingClientRect.top) / canvas.offsetHeight) * 2 +
      1;

  if (controls.isLocked === true) {
    x = 0;
    y = 0;
  }

  var vector = new THREE.Vector3(x, y, 0.5);
  vector = vector.unproject(camera);
  var raycaster = new THREE.Raycaster(
    camera.position,
    vector.sub(camera.position).normalize()
  );

  var meshgroup_intersect = scene.getObjectByName("meshgroup");
  // console.log(meshgroup)

  var intersects_points = raycaster.intersectObjects(
    meshgroup_intersect.children
  );

  if (intersects_points.length > 0) {
    let click_name = intersects_points[0].object.name;
    let value = intersects_points[0].object.value;
    let coord = intersects_points[0].object.coord;
    let region = intersects_points[0].object.region;
    let meanbold = intersects_points[0].object.meanbold;

    const RegionData = select_from_region(allData, click_name);
    // console.log(RegionData);
    templength = RegionData.length;

    userText.set({
      content:
        "Region: " +
        String(click_name) +
        "\n" +
        "Total " +
        String(templength) +
        " Points" +
        "\n" +
        "Bold at timepoint " +
        String(timepoint + 1) +
        ": " +
        String(value),
      fontColor: new THREE.Color(d3.interpolateSinebow(0.3)),
    });

    display_region(RegionData);
  }
}

function clickhighlightmeshgroup(event) {
  let getBoundingClientRect = canvas.getBoundingClientRect();
  let x =
      ((event.clientX - getBoundingClientRect.left) / canvas.offsetWidth) * 2 -
      1,
    y =
      -((event.clientY - getBoundingClientRect.top) / canvas.offsetHeight) * 2 +
      1;

  if (controls.isLocked === true) {
    x = 0;
    y = 0;
  }

  var vector = new THREE.Vector3(x, y, 0.5);
  vector = vector.unproject(camera);
  var raycaster = new THREE.Raycaster(
    camera.position,
    vector.sub(camera.position).normalize()
  );

  var meshgroup_intersect = scene.getObjectByName("meshgroup");
  // console.log(meshgroup)

  var intersects_points = raycaster.intersectObjects(
    meshgroup_intersect.children
  );

  if (intersects_points.length > 0) {
    let click_name = intersects_points[0].object.name;
    let coord = intersects_points[0].object.coord;
    let value = intersects_points[0].object.value;
    let region = intersects_points[0].object.region;

    userText.set({
      content:
        "Point Label:  " +
        String(click_name) +
        "\n" +
        "Region: " +
        String(region) +
        "\n" +
        "Bold at timepoint " +
        String(timepoint + 1) +
        ": " +
        String(value),
      fontColor: new THREE.Color(d3.interpolateSinebow(0.3)),
    });

    const pointGeom = new THREE.SphereGeometry(3.5, 30, 30);
    const pointMat = new THREE.MeshPhongMaterial({ color: "red" });
    const point = new THREE.Mesh(pointGeom, pointMat);
    if (coord) {
      point.position.set(coord[0], coord[1], coord[2]);
    }
    if (all_voxel_index.includes(click_name)) {
      let index = all_voxel_index.indexOf(click_name);
      all_voxel_index.splice(index, 1);
      pointGroup.children.splice(index, 1);
      console.log("remove a voxel");
    } else {
      all_voxel_index.push(click_name);
      pointGroup.add(point);
      pointGroup.rotation.x = Math.PI / 2;
      pointGroup.rotation.y = Math.PI;
      // pointGroup.scale.set(0.04,0.04,0.04);
      // pointGroup.position.set(0,-0.7,0.7);
      pointGroup.position.set(0, 1.5, -7.5);
      pointGroup.scale.set(0.05, 0.048, 0.046);
      scene.add(pointGroup);
      pointGroup.name = "key_point";
      console.log("add a voxel");
    }
  }
}

function createMaterial() {
  // 通过uniforms属性传递的变量可以在着色器程序中使用
  const uniforms = {
    color: { value: new THREE.Color(0xffffff) },
  };

  //   const element = document.getElementById('container')
  uniforms.resolution.value.x = window.innerWidth;
  uniforms.resolution.value.y = window.innerHeight;
  const meshMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    lights: true,
  });

  return meshMaterial;
}

function initpolygen() {
  var loader = new OBJLoader();

  var phongShader = THREE.ShaderLib.phong;
  var uniforms = THREE.UniformsUtils.clone(phongShader.uniforms);
  let colorAttribute;
  const opacity = 0.5;

  loader.load("model/brain4.obj", function (loadedMesh) {
    //第一个表示模型路径，第二个表示完成导入后的回调函数，一般我们需要在这个回调函数中将导入的模型添加到场景中

    // 加载完obj文件是一个场景组，遍历它的子元素，赋值纹理并且更新面和点的发现了
    loadedMesh.children.forEach(function (child) {
      const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertex,
        fragmentShader: fragment,
        side: THREE.DoubleSide,
        transparent: true,
        lights: true,
        fog: true,
      });
      child.geometry.computeVertexNormals();
      const geometry = new THREE.BufferGeometry();
      geometry.copy(child.geometry);
      const n = geometry.attributes.position.array;
      let colors = [];

      for (let i = 0; i < n.length / 3; i++) {
        let index = record1[parseInt(i)];
        let color_ = new THREE.Color(Colorscale(region[index]));
        // let color_ = new THREE.Color('white')
        // positions.push(n[3*i],n[3*i+1],n[3*i+2])
        colors.push(
          color_.r * 255,
          color_.g * 255,
          color_.b * 255,
          opacity * 255
        );
        // color1.toArray( colors, i * 3 );
      }
      colorAttribute = new THREE.Uint8BufferAttribute(colors, 4);
      colorAttribute.normalized = true;
      geometry.setAttribute("ca", colorAttribute);

      brainmodel = new THREE.Mesh(geometry, material);

      brainmodel.rotation.set(Math.PI / 2, Math.PI, 0);
      brainmodel.position.set(0, 1.5, -7.5);
      brainmodel.scale.set(0.05, 0.05, 0.05);
      scene.add(brainmodel);
      brainmodel.name = "brainmodel";
      // window.console.log(geometry)
    });

    // loadedMesh.position.set(0,0,0)
    let box = new THREE.BufferGeometry();
    box.copy(brainmodel.geometry);
    box.setAttribute("ca", colorAttribute);

    // // let material = new THREE.MeshLambertMaterial()
    brainmodel2 = new THREE.Mesh(
      box,
      new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertex,
        fragmentShader: fragment,
        side: THREE.DoubleSide,
        transparent: true,
        lights: true,
        fog: true,
      })
    );
    brainmodel2.scale.set(0.04, 0.04, 0.04);
    brainmodel2.position.set(-150, -25, 0);

    brainmodel2.rotateY(Math.PI / 2);
    brainmodel2.rotateX(-Math.PI / 2);
    // scene.add(brainmodel2)
  });
}

function initBrainObj() {
  // slicing plane
  planes = [
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), 3.5),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), 5.5),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), -3.5),
  ];

  planeHelpers = planes.map((p) => new THREE.PlaneHelper(p, 8, 0xffffff));

  planeHelpers.forEach((ph) => {
    ph.visible = false;
    scene.add(ph);
  });

  // var geometry = new THREE.SphereGeometry( 2.85, 64, 32 );
  // let material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
  // let spheremesh = new THREE.Mesh( geometry, material );
  // spheremesh.visible = false;
  // scene.add(spheremesh)

  object = new THREE.Group();
  object.rotation.set(Math.PI / 2, Math.PI, 0);
  object.position.set(0, 2.13, -8.215);
  scene.add(object);
  object.name = "brain_obj";
  planeObjects = [];

  var obj_loader = new OBJLoader();

  obj_loader.load("model/brain4.obj", function (obj) {
    obj.scale.set(0.05, 0.05, 0.05);

    let bbox = new THREE.Box3().setFromObject(obj);
    var x = -(bbox.max.x + bbox.min.x) / 2;
    var y = -(bbox.max.y + bbox.min.y) / 2;
    var z = -(bbox.max.z + bbox.min.z) / 2;
    obj.position.set(
      -(bbox.max.x + bbox.min.x) / 2,
      -(bbox.max.y + bbox.min.y) / 2,
      -(bbox.max.z + bbox.min.z) / 2
    );
    obj.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: child.material.color,
          clippingPlanes: planes,
          clipShadows: true,
          shadowSide: THREE.DoubleSide,
        });
        child.castShadow = true;
        child.renderOrder = 6;
        child.material.transparent = true;
        child.material.opacity = 0.75;
      }
    });

    // console.log(obj)
    object.add(obj);

    // Set up clip plane rendering
    var planeGeom = new THREE.PlaneGeometry(20, 20);

    for (let i = 0; i < 3; i++) {
      var poGroup = new THREE.Group();
      var plane = planes[i];

      for (var w = 0; w < obj.children.length; w++) {
        var geometry0 = object.children[0].children[w].geometry.clone();
        geometry0.translate(x / 0.05, y / 0.05, z / 0.05);
        var stencilGroup = createPlaneStencilGroup(geometry0, plane, i + 1);
        stencilGroup.scale.set(0.05, 0.05, 0.05);
        object.add(stencilGroup);
      }

      var planeMat = new THREE.MeshBasicMaterial({
        color: 0xe91e63,
        clippingPlanes: planes.filter((p) => p !== plane),
        stencilWrite: true,
        stencilRef: 0,
        stencilFunc: THREE.NotEqualStencilFunc,
        stencilFail: THREE.ReplaceStencilOp,
        stencilZFail: THREE.ReplaceStencilOp,
        stencilZPass: THREE.ReplaceStencilOp,
      });

      var po = new THREE.Mesh(planeGeom, planeMat);

      po.onAfterRender = function (renderer) {
        renderer.clearStencil();
      };

      po.renderOrder = i + 1.1;
      poGroup.add(po);
      planeObjects.push(po);
      scene.add(poGroup);
    }
  });

  console.log(object);
}

// 根据bold值更新每个脑区material的颜色
function updateBold() {
  const data = region_bold.map((item) => item[timepoint]);
  const colors = d3
    .scaleLinear()
    .domain([d3.min(data), d3.max(data)])
    .range(["#90EE90", "#1E90FF"]);
  region_group.children.forEach((item, i) => {
    if (i % 2 == 0) {
      item.material.color = new THREE.Color(colors(data[parseInt(i / 2)]));
      region_group.children[i + 1].material.color = new THREE.Color(
        colors(data[parseInt(i / 2)])
      );
    }
  });
  timepoint++;
}

// 根据bold值更新每个体素material的颜色
function updateBold_v2(points, colors, bold) {
  const data = bold.map((item) => item[timepoint]);
  const colorattributes = points.geometry.attributes.color.array;

  for (let i = 0; i < colorattributes.length / 3; i++) {
    colorattributes[3 * i] = new THREE.Color(colors(data[i])).r;
    colorattributes[3 * i + 1] = new THREE.Color(colors(data[i])).g;
    colorattributes[3 * i + 2] = new THREE.Color(colors(data[i])).b;
  }
  points.geometry.attributes.color.needsUpdate = true;
}

function updateBold_v3(colorsc, max) {
  const data = sim_bold.map((item) => item[timepoint]);
  const data1 = real_bold.map((item) => item[timepoint]);
  const n = brainmodel.geometry.attributes.ca.array.length / 4;

  let colors = brainmodel.geometry.attributes.ca.array;
  let colors1 = brainmodel2.geometry.attributes.ca.array;
  const opacity = 0.5;
  for (let j = 0; j < parseInt(n * proportion); j++) {
    const i = parseInt(Math.random() * n);
    let index = record1[i];

    let color =
      data[index] >= max * pro
        ? new THREE.Color("red")
        : new THREE.Color(colorsc(data[index]));
    let color1 =
      data1[index] >= max * pro
        ? new THREE.Color("red")
        : new THREE.Color(colorsc(data1[index]));

    colors[4 * i] = color.r * 255;
    colors[4 * i + 1] = color.g * 255;
    colors[4 * i + 2] = color.b * 255;
    colors[4 * i + 3] = opacity * 255;
    colors1[4 * i] = color1.r * 255;
    colors1[4 * i + 1] = color1.g * 255;
    colors1[4 * i + 2] = color1.b * 255;
    colors1[4 * i + 3] = opacity * 255;
  }
  const colorAttribute = new THREE.Uint8BufferAttribute(colors, 4);
  colorAttribute.normalized = true;
  brainmodel.geometry.setAttribute("ca", colorAttribute);

  const colorAttribute1 = new THREE.Uint8BufferAttribute(colors1, 4);
  colorAttribute1.normalized = true;
  brainmodel2.geometry.setAttribute("ca", colorAttribute1);
}

// 初始化平面
function initPlane() {
  path.forEach((item, i) => {
    window.console.log(i);

    if (item.length > 0) {
      region_group.add(drawmesh(item)[0], i);
      region_group.add(drawmesh(item)[1], i);
    }
  });

  scene.add(region_group);
}

function drawmesh(path, index) {
  const meshMaterial = new THREE.MeshLambertMaterial({
    color: new THREE.Color(Colorscale(index)),
    opacity: 0.5,
    transparent: true,
  });

  let vertices = [];
  path.forEach((item) => {
    vertices.push(new THREE.Vector3(item[0], item[1], item[2]));
  });
  // window.console.log(vertices)
  const meshGeometry = new ConvexGeometry(vertices);

  const mesh1 = new THREE.Mesh(meshGeometry, meshMaterial);
  mesh1.material.side = THREE.BackSide; // back faces
  mesh1.renderOrder = 0;

  const mesh2 = new THREE.Mesh(meshGeometry, meshMaterial.clone());
  mesh2.material.side = THREE.FrontSide; // front faces
  mesh2.renderOrder = 1;

  return [mesh1, mesh2];
}

// 初始化脑区平面
function init_path() {
  path.forEach((data, i) => {
    if (data.length >= 3) {
      var rectShape = new THREE.Shape();
      data.forEach((item, j) => {
        if (j == 0 || j == item.length - 1)
          rectShape.moveTo(item[0], item[1], 0);
        else rectShape.lineTo(item[0], item[1], 0);
      });
      let color = "#" + Math.floor(Math.random() * 16777215).toString(16);
      var geometry2 = new THREE.ShapeGeometry(rectShape);
      var material2 = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        side: THREE.DoubleSide,
        opacity: 0.8,
        transparent: true,
      });
      var mesh2 = new THREE.Mesh(geometry2, material2);
      mesh2.name = i.toString();
      drawtext(mesh2.name, region_coord[i][0], region_coord[i][1], i);
      i < 180 ? left_path_group.add(mesh2) : right_path_group.add(mesh2);
    }
  });

  right_path_group.position.set(220, 0, -7);
  left_path_group.position.set(-220, 0, -7);
  scene.add(right_path_group);
  scene.add(left_path_group);
}

// 初始化voxel
// 用到buffergeometryutils版本
function initvoxel_3d() {
  window.console.log("starting");

  // 要用到的变量
  let geometries = [];
  let materials = [];
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const color = new THREE.Color();

  // 给geometry赋颜色

  function applyVertexColors(geometry, color) {
    const position = geometry.attributes.position;
    const colors = [];
    for (let i = 0; i < position.count; i++) {
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  }

  coord.forEach((d, i) => {
    let bubble_material = new THREE.MeshLambertMaterial({
      color: new THREE.Color(colorscale(region[i])),
      // vertexColors: THREE.VertexColors,
      opacity: 0.3,
      transparent: true,
    });
    let geometry1 = new THREE.SphereGeometry(bubble_size, 30, 30);
    const position = new THREE.Vector3();
    position.x = d[0];
    position.y = d[1];
    position.z = d[2];

    const rotation = new THREE.Euler();
    rotation.x = 0;
    rotation.y = 0;
    rotation.z = 0;

    const scale = new THREE.Vector3();
    scale.x = 0.5;
    scale.y = 0.5;
    scale.z = 0.5;

    quaternion.setFromEuler(rotation);
    matrix.compose(position, quaternion, scale);
    geometry1.applyMatrix4(matrix);

    applyVertexColors(
      geometry1,
      color.setHex(new THREE.Color(colorscale(region[i])))
    );

    materials.push(bubble_material);
    geometries.push(geometry1);
  });

  const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(
    geometries,
    true
  );

  const mesh = new THREE.Mesh(mergedGeometry, materials);

  scene.add(mesh);
  scene.add(voxel_group);

  window.console.log("loading done!");
}

function initvoxel_3d_v4() {
  const particles = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(22703 * 3);
  let colors = [];
  for (let i = 0; i < 22703; i++) {
    const x = coord[i][0];
    const y = coord[i][1];
    const z = coord[i][2];

    particlePositions[i * 3] = x;
    particlePositions[i * 3 + 1] = y;
    particlePositions[i * 3 + 2] = z;
    let color = new THREE.Color(colorscale(region[i]));
    colors.push(color.r, color.g, color.b);
  }

  particles.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3).setUsage(
      THREE.DynamicDrawUsage
    )
  );
  particles.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  // create the particle system
  const texture = new THREE.TextureLoader().load("pics/ball.png");
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  const material = new THREE.PointsMaterial({
    vertexColors: true,
  });
  point = new THREE.Points(particles, material);
  point1 = new THREE.Points(particles.clone(), material.clone());

  point.rotateY(Math.PI / 2);
  point.rotateX(-Math.PI / 2);
  point.position.set(100, 0, 0);
  point1.rotateY(Math.PI / 2);
  point1.rotateX(-Math.PI / 2);
  point1.position.set(-100, 0, 0);
  scene.add(point);
  scene.add(point1);
  window.console.log(point);
}

function updateBold_v4(colorsc) {
  const data = sim_bold.map((item) => item[timepoint]);
  const data1 = real_bold.map((item) => item[timepoint]);
  const n = point.geometry.attributes.color.array.length / 3;

  let colors = point.geometry.attributes.color.array;
  let colors1 = point1.geometry.attributes.color.array;

  for (let j = 0; j < parseInt(n); j++) {
    const i = parseInt(Math.random() * n);

    let color = new THREE.Color(colorsc(data[i]));
    let color1 = new THREE.Color(colorsc(data1[i]));
    // colors.splice(i*36*4,36*4,color.r * 255,color.b * 255,color.g * 255,opacity * 255)
    colors[3 * i] = color.r * 255;
    colors[3 * i + 1] = color.g * 255;
    colors[3 * i + 2] = color.b * 255;

    colors1[3 * i] = color1.r * 255;
    colors1[3 * i + 1] = color1.g * 255;
    colors1[3 * i + 2] = color1.b * 255;
  }
  const colorAttribute = new THREE.Uint8BufferAttribute(colors, 3);
  // const positionAttribute = new THREE.Uint8BufferAttribute( positions, 4 );
  colorAttribute.normalized = true;
  point.geometry.setAttribute("color", colorAttribute);
  const colorAttribute1 = new THREE.Uint8BufferAttribute(colors1, 3);
  // const positionAttribute = new THREE.Uint8BufferAttribute( positions, 4 );
  colorAttribute1.normalized = true;
  point1.geometry.setAttribute("color", colorAttribute1);
}

// 不用到buffergeometryutils版本
function initvoxel_3d_v2() {
  let bubble_material = new THREE.MeshLambertMaterial({
    color: "blue",
    // vertexColors: THREE.VertexColors,
    opacity: 0.3,
    transparent: true,
  });
  let geometry1 = new THREE.SphereGeometry(bubble_size, 30, 30);
  const bubble = new THREE.Mesh(geometry1, bubble_material);
  coord.forEach((d, i) => {
    const bubble1 = bubble.clone();
    if (i == 0) window.console.log(bubble1, bubble1.geometry);
    bubble1.material.color = new THREE.Color(colorscale(region[i]));
    bubble1.position.set(d[0], d[1], d[2]);
    bubble1.name = i.toString();
    voxel_group.add(bubble1);
  });

  scene.add(voxel_group);

  window.console.log("loading done!");
}

function initvoxel_2d() {
  // const svg = document.getElementById('voxel')
  Xscale = d3
    .scaleLinear()
    .domain([d3.min(coord, (d) => d[0]), d3.max(coord, (d) => d[0])])
    .range([padding, width - padding]);
  Yscale = d3
    .scaleLinear()
    .domain([d3.min(coord, (d) => d[1]), d3.max(coord, (d) => d[1])])
    .range([padding, height - padding]);
  const colorscale = Colorscale;
  const xscale = Xscale;
  const yscale = Yscale;
  // window.console.log(xscale)
  d3.select("#twod")
    .selectAll(".voxel")
    .attr("transform", `translate(${0},${70})`)
    .selectAll("circle")
    .data(coord)
    .enter()
    .append("circle")
    .attr("cx", (d) => {
      return xscale(d[0]);
    })
    .attr("cy", (d) => {
      return yscale(d[1]);
    })
    .attr("r", 3)
    .attr("id", (d, i) => {
      return "id:" + i.toString();
    })
    .attr("fill", (d, i) => {
      return colorscale(region[i]);
    })
    .attr("stroke-width", 0.7)
    .attr("stroke", "white")
    .style("opacity", 0.7);
  // window.console.log(document.getElementById('twod'))
}

// 使用粒子系统生成voxel点
function initvoxel_points() {
  let particles = model.length / 3;
  // const color = new THREE.Color()
  /* 存放粒子数据的网格 */
  let geometry = new THREE.BufferGeometry();
  let positions = [];
  let colors = [];
  const texture = new THREE.TextureLoader().load("static/pics/ball.png");

  for (let i = 0; i < particles; i++) {
    // 点
    let x = model[3 * i];
    let y = model[3 * i + 1];
    let z = model[3 * i + 2];

    positions.push(x, y, z);

    // color.setRGB(new THREE.Color(colorscale(region[i])));
    let color = new THREE.Color(colorscale(region[record[i]]));
    // if(i==0) window.console.log(new THREE.Color(colorscale(region[i])).r,new THREE.Color(colorscale(region[i])))
    colors.push(color.r, color.g, color.b);
  }
  // 添加点和颜色
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 2.8,
    map: texture,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    depthTest: false,
    opacity: 0.3,
  });
  // material.map = texture;
  /* 批量管理点 */
  sim_points = new THREE.Points(geometry, material);
  sim_points.rotateY(Math.PI / 2 + Math.PI / 6);
  sim_points.rotateX(-Math.PI / 2);
  real_points = sim_points.clone();
  real_points.position.set(-200, 0, 0);
  scene.add(sim_points);
  scene.add(real_points);
}

// 画line
function init_lines() {
  pearson.forEach((d, i) => {
    d.forEach((q, j) => {
      if (q >= min && i != j) drawline(i, j);
    });
  });
  scene.add(lines_group);
}

function drawline(start, end) {
  let material1 = new LineMaterial({
    color: new THREE.Color(linecolorscale(pearson[start][end])),
    linewidth: widthscale(pearson[start][end]),
    opacity: 0.8,
    transparent: true,
  });
  // 保存线宽度

  material1.resolution.set(window.innerWidth, window.innerHeight);
  const start_p = region_coord[start];
  const end_p = region_coord[end];

  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(start_p[0], start_p[1], 0),
      new THREE.Vector3(
        (end_p[0] + start_p[0]) / 2,
        (end_p[1] + start_p[1]) / 2,
        heightscale(pearson[start][end])
      ),
      new THREE.Vector3(end_p[0], end_p[1], 0),
    ],
    false,
    "catmullrom",
    0.5
  );
  // 轨迹线
  let points = curve.getPoints(500).reduce((arr, item) => {
    return arr.concat(item.x, item.y, item.z);
  }, []);

  var geometry1 = new LineGeometry();
  geometry1.setPositions(points);
  const line1 = new Line2(geometry1, material1);
  line1.computeLineDistances();
  line1.name = start.toString() + "," + end.toString();
  // console.log(points)
  lines_group.add(line1);
}

// mouse相关事件
function mouseMove(action, d, index) {
  // window.console.log(action)
  if (action == "over") {
    window.console.log(d3.select(".voxel").selectAll("circle"));
    d3.select(".voxel")
      .selectAll("circle")
      .filter((item, i) => {
        return i == index;
      })
      .attr("r", 6)
      .attr("stroke", "red")
      .attr("opacity", 1);
    d3.select(".voxel")
      .selectAll("circle")
      .filter((item, i) => {
        return i != index;
      })
      .attr("r", 3)
      .attr("opacity", 0.7);
    let focusTooltip = $("#toolTip");
    let focusTooltip_div = $("#toolTip_div");

    focusTooltip_div.css("display", "block");
    focusTooltip.css("x", Xscale(d[0]) - 10);
    focusTooltip.css("y", Yscale(d[1]) + 10);
    focusTooltip_div.html(
      "voxel_id:" + index.toString() + "region_id:" + region[index].toString()
    );
  } else if (action == "out") {
    d3.select(".voxel")
      .selectAll("circle")
      .filter((item, i) => {
        return i == index;
      })
      .attr("r", 3)
      .attr("fill", Colorscale(region[index]))
      .attr("stroke", "none")
      .attr("opacity", 0.7);

    // let focusTooltip = $("#toolTip");
    let focusTooltip_div = $("#toolTip_div");
    focusTooltip_div.css("display", "none");
  }
  // window.console.log(action,d,index)
}

// 鼠标移动
function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// 鼠标点击
function onclick(event) {
  // 记录连接的region的index

  let linesindex = [];
  let container = renderer.domElement;
  let getBoundingClientRect = container.getBoundingClientRect();
  pointer.x =
    ((event.clientX - getBoundingClientRect.left) / container.offsetWidth) * 2 -
    1;
  pointer.y =
    -((event.clientY - getBoundingClientRect.top) / container.offsetHeight) *
      2 +
    1;
  // 恢复初始形态
  lines_group.children.forEach((item) => {
    const start = parseInt(item.name.split(",")[0]);
    const end = parseInt(item.name.split(",")[1]);
    item.material.linewidth = widthscale(pearson[start][end]);
    item.material.opacity = 0.8;
  });

  left_path_group.children.forEach((item) => {
    item.material.opacity = 0.8;
  });

  right_path_group.children.forEach((item) => {
    item.material.opacity = 0.8;
  });

  raycaster.setFromCamera(pointer, camera);
  let intersects1 = raycaster.intersectObjects(left_path_group.children);
  let intersects2 = raycaster.intersectObjects(right_path_group.children);
  let intersects = intersects1.length > 0 ? intersects1 : intersects2;
  if (intersects.length > 0) {
    window.console.log(intersects[0].object.name);
    linesindex.push(intersects[0].object.name);
    // intersects[0].object.material.color = new THREE.Color('red')
    lines_group.children.forEach((item) => {
      if (
        item.name.split(",")[0] == intersects[0].object.name ||
        item.name.split(",")[1] == intersects[0].object.name
      ) {
        item.material.opacity = 0.8;
        // item.material.linewidth = 3
        // if(item.name.split(',')[0]==intersects[0].object.name){
        linesindex.push(item.name.split(",")[0]);
        // }
        // else if(item.name.split(',')[1]==intersects[0].object.name){
        linesindex.push(item.name.split(",")[1]);
        // }
        window.console.log(item.name);
      } else {
        // item.material.linewidth = .8
        item.material.opacity = 0.05;
      }
    });
    // 分别遍历左右脑，判断是否相连，相连的脑区高亮
    left_path_group.children.forEach((item) => {
      if (linesindex.includes(item.name)) {
        item.material.opacity = 0.8;
      } else {
        item.material.opacity = 0.2;
      }
    });

    right_path_group.children.forEach((item) => {
      if (linesindex.includes(item.name)) {
        item.material.opacity = 0.8;
      } else {
        item.material.opacity = 0.2;
      }
    });
  }
}

// 添加脑区文字
function drawtext(name, x, y) {
  const textureLoader = new THREE.TextureLoader();
  const matcapTexture = textureLoader.load("fonts/3.png");
  const fontLoader = new FontLoader();
  fontLoader.load("fonts/helvetiker_regular.typeface.json", (font) => {
    const mat = new THREE.MeshMatcapMaterial({ matcap: matcapTexture });
    const geo = new TextGeometry(name, {
      font: font,
      size: 6,
      height: 1,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: 0.2,
      bevelOffset: 0,
      bevelSegments: 5,
    });
    geo.center();
    const text = new THREE.Mesh(geo, mat);
    text.class = "Text";
    text.name = name;
    text.position.x = x;
    text.position.y = y;
    text.position.z = 10;
    text.rotation.set(0, 0, 0);

    testtext.add(text);
  });
}

function initTween() {
  animationMap = { timepoint: 0 }; //动画变量
  //创建一个动画，它的yScale的值在 5000毫秒 内变为 0
  const tween = new TWEEN.Tween(animationMap)
    .to({ timepoint: 190 }, 80000)
    .onUpdate(onUpdate);
  tween.easing(TWEEN.Easing.Sinusoidal.InOut);

  tween.start();
  // tween.repeat(Infinity)
  //创建另一个动画，它的yScale的值在 5000毫秒 恢复为1
  // const tweenBack = new TWEEN.Tween(animationMap).to(
  //     { yScale: 1 },
  //     5000
  // )
  // tweenBack.easing(TWEEN.Easing.Sinusoidal.InOut)
  // //第一个动画和第二个动画往复调用
  // tween.chain(tweenBack)
  // tweenBack.chain(tween)

  //二个动画更新的回调处理
  update = true;
  // tweenBack.onUpdate(onUpdate)
}

function onUpdate() {
  // 获取导入几何体顶点坐标分量数组
  // if(animationMap.timepoint == 199) animationMap = {timepoint:0}
  // window.console.log(animationMap.timepoint)
  const tp = Math.ceil(animationMap.timepoint);
  const loadedGeometryVerticesArray =
    brainmodel.geometry.attributes.position.array;
  const data = sim_bold.map((item) => item[tp]);
  // const data1 = real_bold.map((item)=>item[tp])
  document.getElementById("p1").innerHTML = "timepoint_Bold:" + tp.toString();
  const colorsc = d3
    .scaleLinear()
    .domain([d3.min(data), d3.max(data)])
    .range(["#87CEEB", "#FF0000"]);
  // 每三个分量确定一个顶点
  const n = loadedGeometryVerticesArray.length / 108;
  let colors = [];
  const opacity = 0.6;
  // let colors1 = []
  for (let i = 0; i < n; i++) {
    let index = record[parseInt(i)];
    let color = new THREE.Color(colorsc(data[index]));
    // let color1 = new THREE.Color(colorsc(data1[index]))
    colors.push(
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255,
      color.r * 255,
      color.b * 255,
      color.g * 255,
      opacity * 255
    );
  }
  // for(let i =0;i<n;i++){
  //     let index = record1[parseInt(i/3)]
  //     let color_ = new THREE.Color(colorsc(data[index]))
  //     // positions.push(n[3*i],n[3*i+1],n[3*i+2])
  //     colors.push( color_.r * 255, color_.g * 255, color_.b * 255, opacity * 255)
  // }
  const colorAttribute = new THREE.Uint8BufferAttribute(colors, 4);
  // const positionAttribute = new THREE.Uint8BufferAttribute( positions, 4 );
  colorAttribute.normalized = true;
  brainmodel.geometry.setAttribute("ca", colorAttribute);
  // brainmodel.geometry.setAttribute('ca', new THREE.Float32BufferAttribute(colors, 3))
  // brainmodel2.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors1, 3))
  // points.sortParticles = true
}

async function get_data() {
  response_data = await d3.csv();
  sim_bold = await d3.csv("data/bold_sim_ave.csv");
  real_bold = await d3.csv("data/real_bold");
  // coord = await d3.csv('data/coord.json');
}

// 要用到的变量
let geometries = [];
let materials = [];
const matrix = new THREE.Matrix4();
const quaternion = new THREE.Quaternion();
// const color = new THREE.Color();

// 给geometry赋颜色

function applyVertexColors(geometry, color) {
  const position = geometry.attributes.position;
  const colors = [];
  for (let i = 0; i < position.count; i++) {
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
}

coord.forEach((d, i) => {
  let bubble_material = new THREE.MeshLambertMaterial({
    color: new THREE.Color(colorscale(region[i])),
    opacity: 0.5,
    transparent: true,
  });
  let geometry1 = new THREE.SphereGeometry(bubble_size, 30, 30);
  const position = new THREE.Vector3();
  position.x = d[0];
  position.y = d[1];
  position.z = d[2];

  const rotation = new THREE.Euler();
  rotation.x = Math.PI / 2;
  rotation.y = Math.PI;
  rotation.z = 0;

  const scale = new THREE.Vector3();
  scale.x = 0.04;
  scale.y = 0.04;
  scale.z = 0.04;

  quaternion.setFromEuler(rotation);
  matrix.compose(position, quaternion, scale);
  geometry1.applyMatrix4(matrix);

  applyVertexColors(
    geometry1,
    color.setHex(new THREE.Color(colorscale(region[i])))
  );

  materials.push(bubble_material);
  const mesh = new THREE.Mesh(geometry1, materials);
  // scene.add(mesh);
});

function xscale() {
  return d3
    .scaleLinear()
    .domain([d3.min(coord, (d) => d[0]), d3.max(coord, (d) => d[0])])
    .range([padding, width - padding]);
}

function yscale() {
  return d3
    .scaleLinear()
    .domain([d3.min(coord, (d) => d[1]), d3.max(coord, (d) => d[1])])
    .range([0, height - padding]);
}

function colorscale() {
  return d3.scaleLinear().domain([1, 92]).range(["#669900", "#00ccff"]);
}

// adjust the position of the coord point and brain4 model
// let geo = [];
// coord.forEach( (d) => {
//     const pointGeom = new THREE.SphereGeometry(1,30,30);
//     pointGeom.translate(d[0], d[1], d[2]);
//     geo.push(pointGeom)

// })
// const geo_group = BufferGeometryUtils.mergeBufferGeometries(geo);
// const pointMat = new THREE.MeshPhongMaterial({color: 'red'});
// const pointmesh = new THREE.Mesh( geo_group, pointMat );
// pointmesh.rotation.x = Math.PI/2;
// pointmesh.rotation.y = Math.PI;
// pointmesh.scale.set(0.04,0.04,0.036);
// pointmesh.position.set(0,0,-7);
// scene.add(pointmesh)

// // adjust the position of the coord point and brain4 model
// coord.forEach( (d) => {
//   const pointGeom = new THREE.SphereGeometry(1,30,30);
//   const pointMat = new THREE.MeshPhongMaterial({color: 'red'});
//   const point = new THREE.Mesh( pointGeom, pointMat );
//   point.position.set( d[0], d[1], d[2] );
//   pointGroup.add(point)
//   pointGroup.rotation.x = Math.PI/2;
//   pointGroup.rotation.y = Math.PI;
//   pointGroup.scale.set(0.05,0.048,0.046);
//   // pointGroup.scale.set(0.039,0.039,0.036);
//   pointGroup.position.set(-0.1, 1.5, -7.5);

// })

// // // get the world position of each coord
// let world_Coord = [];
// pointGroup.children.forEach((d, i) => {
//   //该语句默认在threejs渲染的过程中执行  如果想获得世界矩阵属性、世界位置属性等属性，需要手动更新
//   scene.updateMatrixWorld(true);
//   // 声明一个三维向量用来保存网格模型的世界坐标
//   var worldPosition = new THREE.Vector3();
//   // 获得世界坐标，执行getWorldPosition方法，提取网格模型的世界坐标结果保存到参数worldPosition中
//   d.getWorldPosition(worldPosition)
//   world_Coord.push(worldPosition)
//   // console.log('查看网格模型世界坐标',worldPosition);

// })
// console.log(world_Coord)

function display_region(RegionData) {
  scene.remove(scene.getObjectByName("regiongroup"));
  let regiongroup = new THREE.Group();
  let idx = (RegionData[0].Region - 1) / 91;
  RegionData.forEach((d) => {
    let pointGeom = new THREE.SphereGeometry(2, 30, 30);
    let pointMat = new THREE.MeshBasicMaterial({
      color: d3.interpolateSinebow(idx),
      transparent: true,
      opacity: 0.8,
    });
    let point = new THREE.Mesh(pointGeom, pointMat);
    point.position.set(d.Coord[0], d.Coord[1], d.Coord[2]);
    regiongroup.add(point);
  });
  regiongroup.rotation.x = Math.PI / 2;
  regiongroup.rotation.y = Math.PI;
  // regiongroup.scale.set(0.039,0.039,0.038);
  // regiongroup.position.set(0,-0.7,0.7);
  regiongroup.scale.set(0.05, 0.048, 0.046);
  regiongroup.position.set(0, 1.5, -7.5);
  scene.add(regiongroup);
  regiongroup.name = "regiongroup";
}

function display_region_colormap(RegionData) {
  scene.remove(scene.getObjectByName("regiongroup"));
  let idx_ls = [];
  let maxmin = [];
  let regiongroup = new THREE.Group();
  for (let i = 0; i < RegionData.length; i++) {
    maxmin.push(RegionData[i].Values[timepoint].Bold);
  }

  for (let i = 0; i < RegionData.length; i++) {
    let idx =
      1 -
      (RegionData[i].Values[timepoint].Bold - d3.min(maxmin)) /
        (d3.max(maxmin) - d3.min(maxmin));
    idx_ls.push(idx);
  }

  let promax = 0.9;
  let t = promax + 0.1 > 1 ? 1 : promax + 0.1;
  const colorsc = d3
    .scaleQuantize()
    .domain([d3.min(maxmin), d3.max(maxmin) * t])
    .range(colormap);

  RegionData.forEach((d, i) => {
    let pointGeom = new THREE.SphereGeometry(2, 30, 30);
    let pointMat = new THREE.MeshBasicMaterial({
      color:
        maxmin[i] >= d3.max(maxmin) * promax
          ? new THREE.Color("red")
          : new THREE.Color(colorsc(maxmin[i])),
      transparent: true,
      opacity: 1,
    });
    let point = new THREE.Mesh(pointGeom, pointMat);
    point.position.set(d.Coord[0], d.Coord[1], d.Coord[2]);
    regiongroup.add(point);
  });

  regiongroup.rotation.x = Math.PI / 2;
  regiongroup.rotation.y = Math.PI;
  // regiongroup.scale.set(0.039,0.039,0.038);
  // regiongroup.position.set(0,-0.7,0.7);
  regiongroup.scale.set(0.05, 0.048, 0.046);
  regiongroup.position.set(0, 1.5, -7.5);
  scene.add(regiongroup);
  regiongroup.name = "regiongroup";

  // console.log(regiongroup)
  // console.log(maxmin)
}

function display_region_colormap_update(RegionData) {
  let regiongroup = scene.getObjectByName("regiongroup");
  let idx_ls = [];
  let maxmin = [];

  for (let i = 0; i < RegionData.length; i++) {
    maxmin.push(RegionData[i].Values[timepoint].Bold);
  }

  // for (let i=0; i<RegionData.length; i++) {
  //   let idx = 1 - (RegionData[i].Values[timepoint].Bold - d3.min(maxmin)) / (d3.max(maxmin) - d3.min(maxmin));
  //   idx_ls.push(idx)
  // }

  let promax = 0.9;
  let t = promax + 0.1 > 1 ? 1 : promax + 0.1;
  const colorsc = d3
    .scaleQuantize()
    .domain([d3.min(maxmin), d3.max(maxmin) * t])
    .range(colormap);

  regiongroup.children.forEach((d, i) => {
    d.material.color.set(
      maxmin[i] >= d3.max(maxmin) * promax
        ? new THREE.Color("red")
        : new THREE.Color(colorsc(maxmin[i]))
    );
  });
}

function makeplaymenu() {
  let loader = new THREE.TextureLoader();
  // let PLAYERPANELMAXWIDTH = 3.5;
  // let PROGRESSPANELMAXWIDTH = PLAYERPANELMAXWIDTH - 0.2;
  // let PROGRESSPANELHEIGHT = 0.08;
  // let PROGRESSPANELMINWIDTH = 0.01;
  // let SETTINGSPANELMAXWIDTH = (PLAYERPANELMAXWIDTH / 2);
  // let playMenuObjsToTest = [];
  // let play = false;

  const playerPanel = new ThreeMeshUI.Block({
    justifyContent: "center",
    contentDirection: "row-reverse",
    fontFamily: FontJSON,
    fontTexture: FontImage,
    fontSize: 0.07,
    padding: 0.02,
    borderRadius: 0.11,
  });

  const playMenuContainer = new ThreeMeshUI.Block({
    justifyContent: "center",
    contentDirection: "column-reverse",
    fontFamily: FontJSON,
    fontTexture: FontImage,
    fontSize: 0.07,
    padding: 0.02,
    borderRadius: 0,
    backgroundOpacity: 1,
    width: PLAYERPANELMAXWIDTH,
  });

  playMenuContainer.position.set(0, -3, -8);
  playMenuContainer.scale.set(2.15, 3, 2.15);
  scene.add(playMenuContainer);

  const commonBlockAttributes = {
    justifyContent: "center",
    contentDirection: "row",
    fontFamily: FontJSON,
    fontTexture: FontImage,
    fontSize: 0.07,
    padding: 0.02,
    borderRadius: 0.11,
    backgroundOpacity: 0,
  };

  const playbackContainerAttributes = {
    justifyContent: "center",
    contentDirection: "row",
    fontFamily: FontJSON,
    fontTexture: FontImage,
    fontSize: 0.1,
    padding: 0.01,
    borderRadius: 0.1,
    backgroundOpacity: 0,
    height: 0.1,
    width: PLAYERPANELMAXWIDTH,
  };

  const progressBarAttributes = {
    height: PROGRESSPANELHEIGHT,
    width: 0.001,
    margin: 0,
    borderRadius: 0,
    backgroundColor: new THREE.Color(0x0099ff),
    justifyContent: "center",
    alignItems: "center",
    offset: 0.005,
  };

  const progressBarPointAttributes = {
    height: PROGRESSPANELHEIGHT,
    width: PROGRESSPANELMINWIDTH * 2,
    margin: 0,
    borderRadius: 0,
    backgroundColor: new THREE.Color(0xffffff),
    justifyContent: "center",
    alignItems: "center",
    offset: 0.005,
  };

  const progressBarContainerAttributes = {
    height: PROGRESSPANELHEIGHT,
    width: PROGRESSPANELMAXWIDTH,
    margin: 0.04,
    offset: 0.045,
    borderRadius: 0,
    justifyContent: "start",
    contentDirection: "row",
    backgroundOpacity: 1,
    backgroundColor: new THREE.Color(0x5b5b5b),
  };

  const bigButtonOptions = {
    width: 0.4,
    height: 0.15,
    justifyContent: "center",
    offset: 0.05,
    margin: 0.02,
    backgroundOpacity: 1,
    borderRadius: 0.075,
  };

  const buttonOptions = {
    width: 0.25,
    height: 0.25,
    justifyContent: "center",
    backgroundColor: new THREE.Color(0x999999),
    offset: 0.05,
    margin: 0.02,
    backgroundOpacity: 1,
    borderRadius: 0.08,
  };

  // Options for component.setupState().
  // It must contain a 'state' parameter, which you will refer to with component.setState( 'name-of-the-state' ).

  const hoveredStateAttributes = {
    state: "hovered",
    attributes: {
      offset: 0.035,
      backgroundColor: new THREE.Color(0xffff00),
      backgroundOpacity: 1,
      fontColor: new THREE.Color(0x000000),
    },
    onSet: () => {
      document.body.style.cursor = "pointer";
    },
  };

  const idleStateAttributes = {
    state: "idle",
    attributes: {
      offset: 0.035,
      backgroundColor: new THREE.Color(0x999999),
      backgroundOpacity: 1,
      fontColor: new THREE.Color(0xffffff),
    },
    onSet: () => {
      document.body.style.cursor = "default";
    },
  };

  const selectedAttributes = {
    offset: 0.02,
    backgroundColor: new THREE.Color(0x777777),
    backgroundOpacity: 1,
    fontColor: new THREE.Color(0x222222),
  };

  const iconElementAttributes = {
    width: 0.25,
    height: 0.25,
    justifyContent: "center",
    backgroundOpacity: 0,
    offset: 0,
    margin: 0.02,
    borderRadius: 0.08,
  };

  const centerContainerAttributes = {
    width: 1.5,
    height: 0.25,
    justifyContent: "center",
    contentDirection: "row",
    offset: 0,
    margin: 0,
    backgroundOpacity: 0,
  };

  function textureAttributes(texture) {
    return {
      height: 0.15,
      width: 0.15,
      backgroundTexture: texture,
      borderRadius: 0,
    };
  }

  function playPause() {
    if (play) {
      buttonPlay.remove(pauseIconElement);
      buttonPlay.add(playIconElement);
      play = false;
    } else {
      buttonPlay.remove(playIconElement);
      buttonPlay.add(pauseIconElement);
      play = true;
    }
  }

  function progressBarAndDuration() {
    let progressBarLength =
      ((PROGRESSPANELMAXWIDTH - (PROGRESSPANELMINWIDTH * 2 - 0.001)) *
        ((timepoint * 100) / 166)) /
      100;
    progressBar.set({
      width:
        progressBarLength < PROGRESSPANELMINWIDTH
          ? PROGRESSPANELMINWIDTH
          : progressBarLength,
    });
  }

  // function videoPlaybackFFRew(direction, seconds = 10) {
  //   if (Helpers.videoSrcExists()) {
  //     switch (direction) {
  //       case "FF":
  //         this.videoElement.currentTime += seconds;
  //         break;
  //       case "Rew":
  //         this.videoElement.currentTime -= seconds;
  //         break;
  //       default:
  //         break;
  //     }
  //   }
  // }

  const playMenuContainerButtons = new ThreeMeshUI.Block(commonBlockAttributes);

  playMenuContainer.add(playMenuContainerButtons);

  playMenuContainer.setupState({ state: "selected" });
  playMenuContainer.setupState({ state: "hovered" });
  playMenuContainer.setupState({ state: "idle" });

  // Time elapsed and duration info label
  const playbackContainer = new ThreeMeshUI.Block(playbackContainerAttributes);
  const playbackLabelContainer = new ThreeMeshUI.Text({
    content: "Progress: ",
  });

  const playbackLabelContainer_counter = new ThreeMeshUI.Text({
    content: " 001 / 166 ",
  });

  // triggers updates to the component to test onAfterUpdate
  let len = 3; //显示的长度，如果以001则长度为3

  setInterval(() => {
    let num = timepoint + 1;
    num = num.toString(); //转为字符串
    while (num.length < len) {
      //当字符串长度小于设定长度时，在前面加0
      num = "0" + num;
    }
    playbackLabelContainer_counter.set({
      content: String(num) + " / 166",
    });
  });

  playbackContainer.add(playbackLabelContainer, playbackLabelContainer_counter);
  playMenuContainer.add(playbackContainer);

  const buttonPlay = new ThreeMeshUI.Block(buttonOptions);
  const buttonPause = new ThreeMeshUI.Block(buttonOptions);
  // buttonPause.visible = false;
  const buttonFF = new ThreeMeshUI.Block(buttonOptions);
  const buttonRew = new ThreeMeshUI.Block(buttonOptions);
  const playIconElement = new ThreeMeshUI.Block(iconElementAttributes);
  const pauseIconElement = new ThreeMeshUI.Block(iconElementAttributes);
  const buttonsPlaybackContainer = new ThreeMeshUI.Block(
    centerContainerAttributes
  );

  loader.load(PlayIcon, (texture) => {
    playIconElement.add(
      new ThreeMeshUI.InlineBlock(textureAttributes(texture))
    );
  });

  loader.load(PauseIcon, (texture) => {
    pauseIconElement.add(
      new ThreeMeshUI.InlineBlock(textureAttributes(texture))
    );
  });

  buttonPlay.add(playIconElement);
  buttonPause.add(pauseIconElement);

  loader.load(FFIcon, (texture) => {
    buttonFF.add(new ThreeMeshUI.InlineBlock(textureAttributes(texture)));
  });

  loader.load(RewIcon, (texture) => {
    buttonRew.add(new ThreeMeshUI.InlineBlock(textureAttributes(texture)));
  });

  // Create states for the buttons.
  // In the loop, we will call component.setState( 'state-name' ) when mouse hover or click
  buttonPlay.setupState({
    state: "selected",
    attributes: selectedAttributes,
    onSet: () => {
      start = !start;
      playPause();
      play_colormap_update = !play_colormap_update;
    },
  });
  buttonPlay.setupState(hoveredStateAttributes);
  buttonPlay.setupState(idleStateAttributes);

  buttonPlay.playbackStarted = () => {
    buttonPlay.remove(playIconElement);
    buttonPlay.add(pauseIconElement);
  };

  buttonFF.setupState({
    state: "selected",
    attributes: selectedAttributes,
    onSet: () => {
      // // 更新体素颜色
      document.getElementById("p1").innerHTML =
        "timepoint_bold:" + (timepoint + 1).toString();

      timepoint++;

      if (timepoint == 165) timepoint = -1;
      const data = [
        sim_bold.map((item) => item[timepoint]),
        real_bold.map((item) => item[timepoint]),
      ].reduce(function (a, b) {
        return a.concat(b);
      });

      let t = pro + 0.1 > 1 ? 1 : pro + 0.1;
      const colorsc = d3
        .scaleQuantize()
        .domain([d3.min(data), d3.max(data) * t])
        .range(colormap);

      updateBold_v3(colorsc, d3.max(data));

      if (scene.getObjectByName("brain_obj")) {
        display_region_colormap_update(slicingData);
      }

      // if (brainmodel) {
      //   TWEEN.update();
      // }
    },
  });
  buttonFF.setupState(hoveredStateAttributes);
  buttonFF.setupState(idleStateAttributes);

  //

  buttonRew.setupState({
    state: "selected",
    attributes: selectedAttributes,
    onSet: () => {
      // // 更新体素颜色
      document.getElementById("p1").innerHTML =
        "timepoint_bold:" + (timepoint + 1).toString();

      timepoint--;

      if (timepoint == 0) timepoint = 166;
      const data = [
        sim_bold.map((item) => item[timepoint]),
        real_bold.map((item) => item[timepoint]),
      ].reduce(function (a, b) {
        return a.concat(b);
      });

      let t = pro + 0.1 > 1 ? 1 : pro + 0.1;
      const colorsc = d3
        .scaleQuantize()
        .domain([d3.min(data), d3.max(data) * t])
        .range(colormap);

      updateBold_v3(colorsc, d3.max(data));

      if (scene.getObjectByName("brain_obj")) {
        display_region_colormap_update(slicingData);
      }

      // if (brainmodel) {
      //   TWEEN.update();
      // }
    },
  });
  buttonRew.setupState(hoveredStateAttributes);
  buttonRew.setupState(idleStateAttributes);

  // BUTTONS

  const buttonNext = new ThreeMeshUI.Block(buttonOptions);
  const buttonPrevious = new ThreeMeshUI.Block(buttonOptions);

  // Add icon to buttons

  loader.load(ResetIcon, (texture) => {
    buttonPrevious.add(new ThreeMeshUI.InlineBlock(textureAttributes(texture)));
  });

  loader.load(TargetIcon, (texture) => {
    buttonNext.add(new ThreeMeshUI.InlineBlock(textureAttributes(texture)));
  });

  // Create states for the buttons.
  // In the loop, we will call component.setState( 'state-name' ) when mouse hover or click

  const selectedAttributes_ = {
    offset: 0.02,
    backgroundColor: new THREE.Color(0x109c5d),
    fontColor: new THREE.Color(0x222222),
  };

  buttonNext.setupState({
    state: "selected",
    attributes: selectedAttributes,
    onSet: () => {
      let tempTimeSlice = [];
      let allBold = [];
      scene.remove(scene.getObjectByName("meshgroup"));
      scene.remove(scene.getObjectByName("highlightmeshgroup"));
      scene.remove(scene.getObjectByName("focusplane"));

      let SortedBoldData;
      if (scene.getObjectByName("brainmodel")) {
        SortedBoldData = RegionData.sort((a, b) =>
          d3.descending(a.Values[timepoint].Bold, b.Values[timepoint].Bold)
        );
      }

      if (scene.getObjectByName("brain_obj")) {
        SortedBoldData = SliceData.sort((a, b) =>
          d3.descending(a.Values[timepoint].Bold, b.Values[timepoint].Bold)
        );
      }

      if (regionbold_mode) {
        SortedBoldData = RegionBoldData.sort((a, b) =>
          d3.descending(a.Values[timepoint].Bold, b.Values[timepoint].Bold)
        );
        regionbold_mode = false;
      }

      if (interest_mode) {
        SortedBoldData = interest_data.sort((a, b) =>
          d3.descending(a.Values[timepoint].Bold, b.Values[timepoint].Bold)
        );
        interest_mode = false;
      }

      console.log(SortedBoldData);

      for (let i = 0; i < SortedBoldData.length; i++) {
        allBold.push(SortedBoldData[i].Values[timepoint].Bold);
      }

      const bold_scale = d3
        .scaleLinear()
        .domain([d3.min(allBold), d3.max(allBold)])
        .range([0.05, 0.95]);

      for (let i = 0; i < SortedBoldData.length; i++) {
        const Data = {
          Label: SortedBoldData[i].Label,
          timepoint: timepoint + 1,
          Values: SortedBoldData[i].Values[timepoint].Bold,
          Bold_scale: bold_scale(SortedBoldData[i].Values[timepoint].Bold),
          Coord: SortedBoldData[i].Coord,
          Region: SortedBoldData[i].Region,
          MeanBold: SortedBoldData[i].MeanBold,
        };
        // console.log(Data.Bold_scale)
        tempTimeSlice.push(Data);
      }

      slice_render3dChart(tempTimeSlice);
      const plane_time = draw_plane(timepoint, SortedBoldData.length);
      plane_time.name = "focusplane";
      scene.add(plane_time);
    },
  });
  buttonNext.setupState(hoveredStateAttributes);
  buttonNext.setupState(idleStateAttributes);

  //

  buttonPrevious.setupState({
    state: "selected",
    attributes: selectedAttributes,
    onSet: () => {
      scene.remove(scene.getObjectByName("meshgroup"));
      scene.remove(scene.getObjectByName("highlightmeshgroup"));
      scene.remove(scene.getObjectByName("focusplane"));
      scene.remove(scene.getObjectByName("points_base"));
      scene.remove(scene.getObjectByName("highlightmesh"));
      scene.remove(scene.getObjectByName("regiongroup"));
      scene.remove(scene.getObjectByName("brainmodel"));
      scene.remove(scene.getObjectByName("brain_obj"));
      scene.remove(scene.getObjectByName("key_point"));
      document.removeEventListener("mousemove", hoverhighlightmeshgroup, false);
      document.removeEventListener("mousemove", hoverhighlightmesh, false);
      document.removeEventListener("click", clickhighlightmesh, false);
      document.removeEventListener("click", clickhighlightmesh_region, false);
      document.removeEventListener("click", clickhighlightmeshgroup, false);
      initpolygen();
      timepoint = 0;
    },
  });
  buttonPrevious.setupState(hoveredStateAttributes);
  buttonPrevious.setupState(idleStateAttributes);

  objsToTest.push(buttonNext, buttonPrevious);

  const button1 = new ThreeMeshUI.Block(buttonOptions);
  const button2 = new ThreeMeshUI.Block(buttonOptions);

  loader.load(StarIcon, (texture) => {
    button1.add(new ThreeMeshUI.InlineBlock(textureAttributes(texture)));
  });

  loader.load(WideIcon, (texture) => {
    button2.add(new ThreeMeshUI.InlineBlock(textureAttributes(texture)));
  });

  // Create states for the buttons.
  // In the loop, we will call component.setState( 'state-name' ) when mouse hover or click
  button1.setupState({
    state: "selected",
    attributes: selectedAttributes,
    onSet: () => {
      select_highbold_gen(timepoint);
      userText.set({
        content:
          "High Bold Voxels:" +
          "\n" +
          "Total " +
          String(templength) +
          " Points",
        fontColor: new THREE.Color(d3.interpolateSinebow(0.3)),
      });
    },
  });
  button1.setupState(hoveredStateAttributes);
  button1.setupState(idleStateAttributes);

  button2.setupState({
    state: "selected",
    attributes: selectedAttributes,
    onSet: () => {
      scene.remove(scene.getObjectByName("meshgroup"));
      scene.remove(scene.getObjectByName("highlightmeshgroup"));
      scene.remove(scene.getObjectByName("focusplane"));
      scene.remove(scene.getObjectByName("points_base"));
      scene.remove(scene.getObjectByName("highlightmesh"));
      scene.remove(scene.getObjectByName("regiongroup"));
      scene.remove(scene.getObjectByName("brainmodel"));
      scene.remove(scene.getObjectByName("brain_obj"));
      document.removeEventListener("mousemove", hoverhighlightmeshgroup, false);
      document.removeEventListener("mousemove", hoverhighlightmesh, false);
      document.removeEventListener("click", clickhighlightmesh, false);
      document.removeEventListener("click", clickhighlightmeshgroup, false);
      initBrainObj();
    },
  });
  button2.setupState(hoveredStateAttributes);
  button2.setupState(idleStateAttributes);

  buttonsPlaybackContainer.add(button2);
  buttonsPlaybackContainer.add(buttonPrevious);
  buttonsPlaybackContainer.add(buttonRew, buttonPlay, buttonFF);
  buttonsPlaybackContainer.add(buttonNext);
  buttonsPlaybackContainer.add(button1);

  objsToTest.push(button1, button2);

  const button3 = new ThreeMeshUI.Block(buttonOptions);
  const button4 = new ThreeMeshUI.Block(buttonOptions);

  loader.load(SliceIcon, (texture) => {
    button3.add(new ThreeMeshUI.InlineBlock(textureAttributes(texture)));
  });

  loader.load(WebsiteIcon, (texture) => {
    button4.add(new ThreeMeshUI.InlineBlock(textureAttributes(texture)));
  });

  // Create states for the buttons.
  // In the loop, we will call component.setState( 'state-name' ) when mouse hover or click
  button3.setupState({
    state: "selected",
    attributes: selectedAttributes,
    onSet: () => {
      select_slice_pos();
    },
  });
  button3.setupState(hoveredStateAttributes);
  button3.setupState(idleStateAttributes);

  button4.setupState({
    state: "selected",
    attributes: selectedAttributes,
    onSet: () => {
      scene.remove(scene.getObjectByName("meshgroup"));
      scene.remove(scene.getObjectByName("highlightmeshgroup"));
      scene.remove(scene.getObjectByName("focusplane"));
      scene.remove(scene.getObjectByName("points_base"));
      scene.remove(scene.getObjectByName("highlightmesh"));
      scene.remove(scene.getObjectByName("regiongroup"));

      document.removeEventListener("mousemove", hoverhighlightmeshgroup, false);
      document.removeEventListener("mousemove", hoverhighlightmesh, false);
      document.removeEventListener("click", clickhighlightmesh, false);
      document.removeEventListener("click", clickhighlightmeshgroup, false);

      userText.set({
        content: "Region Comparison ",
        fontColor: new THREE.Color(d3.interpolateSinebow(0.3)),
      });

      display_regionSumBold();
    },
  });
  button4.setupState(hoveredStateAttributes);
  button4.setupState(idleStateAttributes);

  objsToTest.push(button3, button4);

  const button5 = new ThreeMeshUI.Block(buttonOptions);
  const button6 = new ThreeMeshUI.Block(buttonOptions);

  loader.load(FolderIcon, (texture) => {
    button5.add(new ThreeMeshUI.InlineBlock(textureAttributes(texture)));
  });

  loader.load(RegionIcon, (texture) => {
    button6.add(new ThreeMeshUI.InlineBlock(textureAttributes(texture)));
  });

  // Create states for the buttons.
  // In the loop, we will call component.setState( 'state-name' ) when mouse hover or click
  button5.setupState({
    state: "selected",
    attributes: selectedAttributes,
    onSet: () => {
      scene.remove(scene.getObjectByName("meshgroup"));
      scene.remove(scene.getObjectByName("highlightmeshgroup"));
      scene.remove(scene.getObjectByName("focusplane"));
      scene.remove(scene.getObjectByName("points_base"));
      scene.remove(scene.getObjectByName("highlightmesh"));
      scene.remove(scene.getObjectByName("regiongroup"));
      document.removeEventListener("mousemove", hoverhighlightmeshgroup, false);
      document.removeEventListener("mousemove", hoverhighlightmesh, false);
      document.removeEventListener("click", clickhighlightmesh, false);
      document.removeEventListener("click", clickhighlightmesh_region, false);
      document.removeEventListener("click", clickhighlightmeshgroup, false);
      interest_data = select_interest_point(all_voxel_index);
      interest_mode = true;
      console.log(interest_data);
      templength = interest_data.length;
      userText.set({
        content:
          "Interest Points: " +
          "\n" +
          "Total " +
          String(templength) +
          " Points",
        fontColor: new THREE.Color(d3.interpolateSinebow(0)),
      });

      // Render 2D Area Charts
      d3.selectAll("svg").remove();
      for (let i = 0; i < interest_data.length; i++) {
        renderAreaChart(interest_data[i]);
      }

      render3dChart(interest_data);
      document.addEventListener("mousemove", hoverhighlightmesh, false);
      document.addEventListener("click", clickhighlightmesh, false);

      if (!scene.getObjectByName("key_point")) {
        const pointGeom = new THREE.SphereGeometry(3.5, 30, 30);
        const pointMat = new THREE.MeshPhongMaterial({ color: "red" });
        const point = new THREE.Mesh(pointGeom, pointMat);
        for (let i = 0; i < interest_data.length; i++) {
          let coord = interest_data[i].Coord;
          point.position.set(coord[0], coord[1], coord[2]);
          pointGroup.add(point);
        }
        pointGroup.rotation.x = Math.PI / 2;
        pointGroup.rotation.y = Math.PI;
        // pointGroup.scale.set(0.04,0.04,0.04);
        // pointGroup.position.set(0,-0.7,0.7);
        pointGroup.position.set(0, 1.5, -7.5);
        pointGroup.scale.set(0.05, 0.048, 0.046);
        scene.add(pointGroup);
        pointGroup.name = "key_point";
      }
    },
  });
  button5.setupState(hoveredStateAttributes);
  button5.setupState(idleStateAttributes);

  button6.setupState({
    state: "selected",
    attributes: selectedAttributes,
    onSet: () => {
      scene.remove(scene.getObjectByName("meshgroup"));
      scene.remove(scene.getObjectByName("highlightmeshgroup"));
      scene.remove(scene.getObjectByName("focusplane"));
      document.removeEventListener("mousemove", hoverhighlightmeshgroup, false);
      document.removeEventListener("click", clickhighlightmesh_region, false);
      document.removeEventListener("click", clickhighlightmeshgroup, false);

      select_regionNum(Math.floor(regionNum));
    },
  });
  button6.setupState(hoveredStateAttributes);
  button6.setupState(idleStateAttributes);

  buttonsPlaybackContainer.add(buttonPrevious); // Reset
  buttonsPlaybackContainer.add(button2); // change to slice mode
  buttonsPlaybackContainer.add(button3); // slice action
  buttonsPlaybackContainer.add(button5); // interest voxels display comparison
  buttonsPlaybackContainer.add(buttonRew, buttonPlay, buttonFF); // no need to say
  buttonsPlaybackContainer.add(button6); // RegionNum display
  buttonsPlaybackContainer.add(buttonNext); // slice the 3dcharts by timepoint
  buttonsPlaybackContainer.add(button1); // highbold display by timepoint
  buttonsPlaybackContainer.add(button4); // all Region mean bold comparison

  objsToTest.push(button5, button6);

  // Progress Bar

  progressBar = new ThreeMeshUI.Block(progressBarAttributes);
  progressBar.onAfterUpdate = function () {
    // progressBar.frame.layers.set(1);
    // progressBar.frame.layers.enable(2);
  };

  const progressBarPoint = new ThreeMeshUI.Block(progressBarPointAttributes);
  progressBarPoint.onAfterUpdate = function () {
    // progressBarPoint.frame.layers.set(1);
    // progressBarPoint.frame.layers.enable(2);
  };

  const progressBarContainer = new ThreeMeshUI.Block(
    progressBarContainerAttributes
  ).add(progressBar, progressBarPoint);
  progressBarContainer.name = "progressBarContainer";

  progressBarContainer.setupState({
    state: "selected",
    onSet: () => {
      console.log(progressBarContainer);
      // geometry.attributes.uv

      timepoint = Math.floor(118);

      // // 更新体素颜色
      const data = [
        sim_bold.map((item) => item[timepoint]),
        real_bold.map((item) => item[timepoint]),
      ].reduce(function (a, b) {
        return a.concat(b);
      });

      let t = pro + 0.1 > 1 ? 1 : pro + 0.1;
      const colorsc = d3
        .scaleQuantize()
        .domain([d3.min(data), d3.max(data) * t])
        .range(colormap);

      updateBold_v3(colorsc, d3.max(data));

      if (brainmodel) {
        TWEEN.update();
      }
    },
  });
  progressBarContainer.setupState({
    state: "hovered",
    attributes: {
      height: PROGRESSPANELHEIGHT * 1.5,
    },
    onSet: () => {
      document.body.style.cursor = "pointer";
    },
  });
  progressBarContainer.setupState({
    state: "idle",
    attributes: {
      height: PROGRESSPANELHEIGHT,
    },
    onSet: () => {
      document.body.style.cursor = "default";
    },
  });

  playMenuContainer.add(progressBarContainer);

  playMenuContainerButtons.add(buttonsPlaybackContainer);
  playMenuObjsToTest.push(
    buttonRew,
    buttonPlay,
    buttonFF,
    progressBarContainer,
    playMenuContainer
  );
  objsToTest.push(
    buttonRew,
    buttonPlay,
    buttonFF,
    progressBarContainer,
    playMenuContainer
  );
}

function draw_plane(timepoint, length) {
  let color = new THREE.Color();
  const plane_geo = new THREE.PlaneGeometry(length / 3 + 0.3, 6.5, 1, 1);
  const plane_mat = new THREE.MeshBasicMaterial({
    color: color.setHSL(0.6, 0.1, 0.55),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  });
  const plane = new THREE.Mesh(plane_geo, plane_mat);
  let x = 5 + (10 / 165) * timepoint;
  plane.position.set(x, -5, -7 - length / 6);
  plane.rotation.y = Math.PI / 2;
  plane.visible = true;
  return plane;
}

// // 绘出time_sum_bold曲线
// function draw_curve_radi(mesh_lst) {

//   function fill_mesh_data(mesh_lst) {
//     const new_lst = [];
//     mesh_lst.forEach((m, i) => {

//       let  x = i+1,
//         y = m,
//         z = 0;
//       new_lst.push(new THREE.Vector3(x, y, z));
//     });

//     // 按顺序排序
//     new_lst.sort(function (a, b) {
//       return a.x - b.x;
//     });
//     console.log(new_lst)
//     return new_lst;
//   }

//   // 2. 绘出曲线
//   function draw_radius(dlst) {
//     let color = new THREE.Color();
//     const mont_line = new THREE.Group();
//     const curve = new THREE.CatmullRomCurve3(dlst),
//       n = dlst.length;
//     const points = curve.getPoints(n * 10);
//     // console.log(points);
//     const geometry = new THREE.BufferGeometry().setFromPoints(points);

//     // const line = new MeshLine();
//     // line.setGeometry(geometry);
//     // line.setPoints(geometry, p => 2);

//     // const material = new MeshLineMaterial( {
//     //     color: color.setHSL( index/52, 1.0, 0.5 ),
//     //     lineWidth: 3
//     // });

//     const material = new THREE.LineBasicMaterial({
//       color: color.setHSL(0, 1.0, 1.0),
//       linewidth: 3, // 此材质无法变更粗细
//     });

//     // const geometry = new LineGeometry();
//     // geometry.setPositions( points );
//     // const material = new LineMaterial( {
//     //     color: color.setHSL( index/52, 1.0, 0.5 ),
//     //     linewidth: 3, // in world units with size attenuation, pixels otherwise

//     //     //resolution:  // to be set by renderer, eventually
//     //     dashed: false,
//     //     alphaToCoverage: true,
//     // } );

//     const curveObject = new THREE.Line(geometry, material);
//     // const curveObject = new Line2( geometry, material );
//     mont_line.add(curveObject);
//     return mont_line;
//   }

//   const position_lst = fill_mesh_data(mesh_lst);
//   const mont_line = draw_radius(position_lst);
//   return mont_line;
// }

// const time_sum_curve = draw_curve_radi(time_sum);
// console.log(time_sum_curve)
// // time_sum_curve.position.set(4,0,0)
// scene.add(time_sum_curve);

function time_sum_bold(data) {
  let time_sum_data = [];

  for (let i = 0; i < 166; i++) {
    const Data = {
      timepoint: i + 1,
      bold_sum: data[i],
    };

    time_sum_data.push(Data);
  }

  let svg = d3
    .select(".container")
    .append("svg")
    .attr("width", 660)
    .attr("height", 100);

  let x = d3.scaleTime().domain([1, 166]).range([0, 660]);

  let y = d3.scalePow().exponent(1).domain([0.02199, 0.0265]).range([100, 0]);

  svg
    .append("path")
    .datum(time_sum_data)
    .attr("fill", "#ffffff")
    .attr(
      "d",
      d3
        .area()
        .x((d) => x(d.timepoint))
        .y0(y(0))
        .y1((d) => y(d.bold_sum / 22703))
    );

  const svgList = document.querySelectorAll("svg");
  const loader = new SVGLoader();

  const svgData = loader.parse(svgList[0].outerHTML);
  const shape = svgData.paths[0].toShapes(true)[0];

  const geometry2 = new THREE.ExtrudeGeometry(shape, {
    steps: 2,
    depth: 16,
  });

  let planes = [
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), 10),
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 2.3),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), 10),
  ];

  let object_time = new THREE.Group();
  scene.add(object_time);
  for (let i = 0; i < 3; i++) {
    const plane = planes[i];
    const stencilGroup = createPlaneStencilGroup(geometry2, plane, i);
    object_time.add(stencilGroup);
  }

  const cubeMaterial = new THREE.MeshStandardMaterial({
    color: 0x5b5b5b,
    clippingPlanes: planes,
  });

  // add the color
  const clippedColorFront = new THREE.Mesh(geometry2, cubeMaterial);
  clippedColorFront.scale.set(0.01075, 0.01075, 0.01075);
  clippedColorFront.rotation.set(0, Math.PI, Math.PI);
  clippedColorFront.position.set(0, -1, -8);
  clippedColorFront.translateX(-3.55);
  clippedColorFront.castShadow = true;
  clippedColorFront.renderOrder = 6;
  object_time.add(clippedColorFront);
}

time_sum_bold(time_sum);

function select_interest_point(idx_list) {
  let tempData_all = [];
  for (let i = 0; i < idx_list.length; i++) {
    const tempData = allData.filter((d) => d.Label === idx_list[i]);
    tempData_all.push(tempData[0]);
  }
  // console.log(tempData_all)

  tempData_all = tempData_all.sort((a, b) =>
    d3.descending(a.MeanBold, b.MeanBold)
  );

  return tempData_all;
}

// CUSTOM FROM FILE
// const fileLoader = new THREE.FileLoader();
// fileLoader.load( 'models/svg/hexagon.svg', function ( svg ) {

//   const node = document.createElementNS( 'http://www.w3.org/2000/svg', 'g' );
//   const parser = new DOMParser();
//   const doc = parser.parseFromString( svg, 'image/svg+xml' );

//   node.appendChild( doc.documentElement );

//   const object = new SVGObject( node );
//   object.position.x = 500;
//   scene.add( object );

// } );

function launchFullScreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

// 点击进入第一视角锁定模式
option.addEventListener(
  "click",
  function (event) {
    scene.add(controls.getObject());
    controls.lock();
    launchFullScreen(document.body);
    camera.add(crosshair); // 加上屏幕中心光标
    controls.getObject().position.set(0, 0, 7.5); // 锁定时初始到圆心位置
    orbit_control.enabled = false;
  },
  false
);

// Esc退出第一视角锁定
controls.addEventListener("unlock", function () {
  camera.remove(crosshair); // 拿掉屏幕中心光标
  orbit_control.enabled = true;
});

// 键盘按下
function onKeyDown(event) {
  switch (event.code) {
    case "ArrowUp":
    case "KeyW":
      moveForward = true;
      break;

    case "ArrowLeft":
    case "KeyA":
      moveLeft = true;
      break;

    case "ArrowDown":
    case "KeyS":
      moveBackward = true;
      break;

    case "ArrowRight":
    case "KeyD":
      moveRight = true;
      break;
  }
}

// 键盘抬起
function onKeyUp(event) {
  switch (event.code) {
    case "ArrowUp":
    case "KeyW":
      moveForward = false;
      break;

    case "ArrowLeft":
    case "KeyA":
      moveLeft = false;
      break;

    case "ArrowDown":
    case "KeyS":
      moveBackward = false;
      break;

    case "ArrowRight":
    case "KeyD":
      moveRight = false;
      break;
  }
}

// 键盘操作的监听
document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);

function tick() {
  const time_ = performance.now();

  if (controls.isLocked === true) {
    //每一帧的间隔时间,保证相同时间移动相同距离
    const delta_ = (time_ - prevTime) / 1000;

    // x, z方向受到阻力后，速度衰减
    velocity.x -= velocity.x * 10.0 * delta_;
    velocity.z -= velocity.z * 10.0 * delta_;
    // y方向为自由落体
    velocity.y -= 9.8 * 10.0 * delta_;

    // x：右为正 z: 前为正
    //根据boolean值 巧妙判断方向 决定下面移动的值
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // 确保x, z方向的一致运动

    // 给方向赋值
    if (moveLeft || moveRight)
      //按下了前/后
      velocity.x -= direction.x * 50.0 * delta_;
    if (moveForward || moveBackward)
      //按下了左/右
      velocity.z -= direction.z * 50.0 * delta_;

    //计算移动距离
    let rightDistance = -velocity.x * delta_;
    let forwardDistance = -velocity.z * delta_;

    // x, z（前后左右）方向移动
    //设置最终移动值
    if (moveLeft || moveRight) controls.moveRight(rightDistance);

    if (moveForward || moveBackward) controls.moveForward(forwardDistance);
  }

  prevTime = time_;
}
