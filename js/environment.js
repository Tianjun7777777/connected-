let myMesh;
let water, sun, sky;
let pmremGenerator;
let myDModel;
let myCModel;
let myFModel;
let mySModel;
let myBModel;
let fontgeo;
let sundata;
let collideObj;
let markGroup = new THREE.Group();
const parameters = {
  inclination: 0.49,
  azimuth: 0.205
};


function createEnvironment(scene, renderer) {
  //////////////////////////////////////////////adding ble
  // advertised service UUID of the  to search for:
  const serviceUuid = '19b10010-e8f2-537e-4f6c-d104768a1214';
  // DOM elements to interact with:
  let connectButton;
  let dataDiv;
  let deviceDiv;
  let myDevice;
  // setup();
  // this function is called when the page is loaded. 
  // event listener functions are initialized here:
  function setup() {
    // put the DOM elements into global variables:
    connectButton = document.getElementById('connect');
    connectButton.addEventListener('click', connectToBle);
    deviceDiv = document.getElementById('device');
    dataDiv = document.getElementById('data');
    // connect to the peripheral:
    function connectToBle() {
      // options let you filter for a peripheral 
      // with a particular service UUID:
      let options = {
        filters: [{
          services: [serviceUuid]
        }]
      };
      // start scanning:
      navigator.bluetooth.requestDevice(options)
        // when you get a device:
        .then(device => {
          myDevice = device;
          deviceDiv.innerHTML = "Device name: " + device.name;
          deviceDiv.innerHTML += "<br>Service UUID: " + serviceUuid;
          return device.gatt.connect();
        })
        // get the primary service:
        .then(server => server.getPrimaryService(serviceUuid))
        .then(service => service.getCharacteristics())
        // get the characteristics of the service:
        .then(characteristics => readCharacteristics(characteristics))
        // if there's an error:
        .catch(error => console.log('Connection failed!', error));

      function readCharacteristics(characteristics) {
        // add the characterisitic UUID to the device div:
        deviceDiv.innerHTML += "<br>characteristic UUID: " + characteristics[3].uuid;
        // subscribe to the button characteristic:
        characteristics[3].addEventListener('characteristicvaluechanged', readData);
        characteristics[3].startNotifications();
        // Get an initial value:
        return characteristics[3].readValue();
      }
    }

    // read incoming data:
    function readData(event, error) {
      if (error) {
        console.log('error: ', error);
        return;
      }
      // get the data  from the peripheral.
      // it's declared as a byte in the Arduino sketch,
      // so look for an unsigned int, 8 bits (Uint8):
      let sensorVal = event.target.value.getFloat32(0, true);
      // let sensorVal = event.target.value.getFloat32(0, true);
      dataDiv.innerHTML = 'value: ' + sensorVal;
      sundata = sensorVal;
      updateSunData(scene);
      console.log(sundata);
    }

  }


  /////////////////////////////////////////////////////////////////////////////adding environment
  console.log("Adding environment");

  let texture = new THREE.TextureLoader().load("../assets/texture.png");
  let myGeometry = new THREE.SphereGeometry(3, 12, 12);
  let myMaterial = new THREE.MeshBasicMaterial({ map: texture });
  myMesh = new THREE.Mesh(myGeometry, myMaterial);
  myMesh.position.set(5, 2, 5);
  myMesh.userData.interactable = true;
  myMesh.userData.link = "https://editor.p5js.org/Tianjun7777777/present/fQPzYxmN_";
  myMesh.userData.nolongerAdd = true;
  scene.add(myMesh);

  // let Text = new THREE.TextGeometry('Hello!', {
  //   font: new THREE.FontLoader().load('../assets/fonts/helvetiker_regular.typeface.json'),
  //   size: 80,
  //   height: 5,
  //   curveSegments: 12,
  //   bevelEnabled: true,
  //   bevelThickness: 10,
  //   bevelSize: 8,
  //   bevelOffset: 0,
  //   bevelSegments: 5
  // });

  // scene.add(Text);

  sun = new THREE.Vector3();

  //load model
  loadModel(scene);

  // Water

  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

  water = new THREE.Water(
    waterGeometry,
    {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {

        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

      }),
      alpha: 1.0,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined
    }
  );

  water.rotation.x = - Math.PI / 2;
  scene.add(water);

  // Skybox

  const sky = new THREE.Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;
  // console.log("sky material:"+ JSON.stringify(sky.material));

  skyUniforms['turbidity'].value = 10;
  skyUniforms['rayleigh'].value = 2;
  skyUniforms['mieCoefficient'].value = 0.005;
  skyUniforms['mieDirectionalG'].value = 0.8;


  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  updateSun(scene);

  //GUI

  const gui = new dat.GUI();

  const folderSky = gui.addFolder('Sky');
  folderSky.add(parameters, 'inclination', 0, 0.5, 0.0001).onChange(updateSun);
  folderSky.add(parameters, 'azimuth', 0, 1, 0.0001).onChange(updateSun);
  folderSky.open();

  const waterUniforms = water.material.uniforms;

  const folderWater = gui.addFolder('Water');
  folderWater.add(waterUniforms.distortionScale, 'value', 0, 8, 0.1).name('distortionScale');
  folderWater.add(waterUniforms.size, 'value', 0.1, 10, 0.1).name('size');
  folderWater.add(waterUniforms.alpha, 'value', 0.9, 1, .001).name('alpha');
  folderWater.open();

  // add life to scene
  let liveStatus = false;
  document.getElementById('live').addEventListener('click', liveSun);

  function liveSun() {
    liveStatus = !liveStatus;
    if (liveStatus) {
      document.getElementById('live').value = "live!";
      console.log("live!");
      setInterval(toliveSun, 1000);
    }
    else {
      document.getElementById('live').value = "unlive";
      console.log("want live!");
      clearInterval(toliveSun);
      //back to init value
      updateSun(scene);
    }

  }

  const toliveSun = () => {
    if (liveStatus) {
      liveSunData(scene)
    };
  };

  const liveSunData = (scene) => {
    const time = performance.now() * 0.000002;

    //inclination
    const theta = Math.PI * (parameters.inclination - 0.5);
    //azimuth
    const phi = 2 * Math.PI * (time - 0.5);
    // console.log(time);
    sun.x = Math.cos(phi);
    sun.y = Math.sin(phi) * Math.sin(theta);
    sun.z = Math.sin(phi) * Math.cos(theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    scene.environment = pmremGenerator.fromScene(sky).texture;
  };


  function updateSun(scene) {
    // console.log("update sun!");

    const theta = Math.PI * (parameters.inclination - 0.5);
    const phi = 2 * Math.PI * (parameters.azimuth - 0.5);

    sun.x = Math.cos(phi);
    sun.y = Math.sin(phi) * Math.sin(theta);
    sun.z = Math.sin(phi) * Math.cos(theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    scene.environment = pmremGenerator.fromScene(sky).texture;

  }

  //WiFi sync data
  let connectStatus = false;
  document.getElementById('data').addEventListener('change', console.log("changed!"));
  document.getElementById('connect').addEventListener('click', syncData);
  function syncData() {
    connectStatus = !connectStatus;
    if (connectStatus) {
      document.getElementById('connect').value = "connected";
      console.log("connected!");
      setInterval(toUptate, 2000);
    }
    else {
      document.getElementById('connect').value = "connect";
      console.log("want to connect!");
      clearInterval(toUptate);
      updateSun(scene);
    }
  }

  const toUptate = () => {
    if (connectStatus) {
      updateSunData(scene);
    }
  };

  const updateSunData = (scene) => {
    if (connectStatus) {
      console.log("update sun!");
      let sundata = document.getElementById('data').innerHTML;
      const theta = Math.PI * (sundata / 20 - 0.5);
      const phi = 2 * Math.PI * (parameters.azimuth - 0.5);

      sun.x = Math.cos(phi);
      sun.y = Math.sin(phi) * Math.sin(theta);
      sun.z = Math.sin(phi) * Math.cos(theta);

      sky.material.uniforms['sunPosition'].value.copy(sun);
      water.material.uniforms['sunDirection'].value.copy(sun).normalize();

      scene.environment = pmremGenerator.fromScene(sky).texture;
    }
  };


  //add fog decay


  const addfog = (scene) => {
    console.log("adding fog");
    const color = 0xFFFFFF;
    const near = 0;
    const far = 6000;
    scene.fog = new THREE.Fog(color, near, far);
  };

  // addfog(scene);
}


function updateEnvironment(scene) {
  // myMesh.position.x += 0.01;
  const time = performance.now() * 0.001;
  water.rotation.x = - Math.PI / 2;
  water.material.uniforms['time'].value += 1.0 / 60.0;
  if (myDModel) {
    myDModel.rotation.x += 0.001;
    myDModel.rotation.z += 0.001;
  }

  if (markGroup.userData.isExist) {
    // console.log(markGroup);
  }

  if (collideObj) {
    //  console.log("updating collideObj");
    scene.add(collideObjGroup);
    //  console.log(collideObjGroup.children);
    collideObjGroup.position.y += 0.002;
    //  for(i=0; i< Object.keys(collideObjGroup).length; i++){
    //   collideObjGroup[i].position.y += 0.01;
    //  }
    // collideObj.position.y +=0.01;
  }

}

//callbacks for loadModel
const onProgress = function (xhr) {
  if (xhr.lengthComputable) {
    const percentComplete = (xhr.loaded / xhr.total) * 100;
    console.log(Math.round(percentComplete, 2) + "% downloaded");
  }
};

const onError = function () { };
const manager = new THREE.LoadingManager();

function loadModel(scene) {
  // dolphin model
  new THREE.MTLLoader(manager)
    .setPath("../assets/Dolphin/")
    .load("Dolphin.mtl", function (materials) {
      materials.preload();

      new THREE.OBJLoader(manager)
        .setMaterials(materials)
        .setPath("../assets/Dolphin/")
        .load(
          "Dolphin.obj",
          function (object) {
            console.log("load dolphin model");
            myDModel = object;
            object.position.set(-50, 0, -50);
            object.rotation.y = Math.PI / 3;
            object.rotation.x = Math.PI / 12;
            scene.add(object);
          },
          onProgress,
          onError
        );
    });
  //crystal
  new THREE.MTLLoader(manager)
    .setPath("../assets/crystal/")
    .load("crystal.mtl", function (materials) {
      materials.preload();
      new THREE.OBJLoader(manager)
        .setMaterials(materials)
        .setPath("../assets/crystal/")
        .load(
          "crystal.obj",
          function (object) {
            console.log("load crystal model");
            // scene.add(object);
            myCModel = object;
          },
          onProgress,
          onError
        );
    });

  //myFModel
  new THREE.MTLLoader(manager)
    .setPath("../assets/flower/")
    .load("flower.mtl", function (materials) {
      materials.preload();
      materials.materials.color_15708628.transparent = true;
      materials.materials.color_15708628.opacity = 0.5;
      materials.materials.color_15708628.emissive = { r: 250, g: 169, b: 252, isColor: true }
      // materials.materials.color_15708628.emissiveIntensity=10;
      new THREE.OBJLoader(manager)
        .setMaterials(materials)
        .setPath("../assets/flower/")
        .load(
          "flower.obj",
          function (object) {
            //   if ( Array.isArray( object.material ) ) {
            //     object.material.transparent = true;
            //     object.material.opacity = 0.5;
            // }
            // console.log(materials.materials.color_15708628);
            console.log("load flower model");
            // scene.add(object);
            myFModel = object;
          },
          onProgress,
          onError
        );
    });

  //mySModel
  new THREE.MTLLoader(manager)
    .setPath("../assets/star/")
    .load("star.mtl", function (materials) {
      materials.preload();
      new THREE.OBJLoader(manager)
        .setMaterials(materials)
        .setPath("../assets/star/")
        .load(
          "star.obj",
          function (object) {
            console.log("load star model");
            mySModel = object;
            console.log(materials);
          },
          onProgress,
          onError
        );
    });

  //myBModel
  new THREE.MTLLoader(manager)
    .setPath("../assets/Balloon/")
    .load("Balloon.mtl", function (materials) {
      materials.preload();
      new THREE.OBJLoader(manager)
        .setMaterials(materials)
        .setPath("../assets/Balloon/")
        .load(
          "Balloon.obj",
          function (object) {
            console.log("load balloon model");
            myBModel = object;

          },
          onProgress,
          onError
        );
    });


}


function createMarks(scene, data) {
  let markObj;
  if (data.time < 0) {
    markObj = mySModel.clone();
    scene.add(markObj);
    markObj.scale.set(0.01, 0.01, 0.01);
  }
  else {
    markObj = myCModel.clone();
    scene.add(markObj);
    markObj.scale.set(0.5, 0.5, 0.5);
  }

  markObj.position.set(data.positionX + 2, data.positionY, data.positionZ);
  // markObj.rotation.y = -Math.PI / 3;
  markObj.rotation.x = Math.random() * 2 - 1;
  markObj.rotation.y = Math.random() * 2 - 1;

  // markGroup.add(markObj);
  // markGroup.userData.isExist=true;
}

function createTraces(scene, data) {
  let tObj = myFModel.clone();
  scene.add(tObj);
  tObj.position.set(data.positionX + Math.random(), data.positionY + Math.random(), data.positionZ + Math.random());
  tObj.rotation.x = Math.random() * 2 - 1;
  tObj.rotation.y = Math.random() * 2 - 1;
  tObj.rotation.z = Math.random() * 2 - 1;
  let sizeScale = Math.random();
  tObj.scale.set(0.01 * sizeScale, 0.01 * sizeScale, 0.01 * sizeScale);
  //add to group
}

function createFonts(scene, data) {
  const loader = new THREE.FontLoader();
  let fontdata = data;
  console.log("loading fonts..");

  loader.load('../assets/fonts/helvetiker_regular.typeface.json', function (font) {

    // fontgeo = new THREE.TextGeometry(fontdata.text, {
    //   font: font,
    //   size: 80,
    //   height: 5,
    //   curveSegments: 12,
    //   bevelEnabled: true,
    //   bevelThickness: 10,
    //   bevelSize: 8,
    //   bevelOffset: 0,
    //   bevelSegments: 5
    // });

    fontgeo = new THREE.TextGeometry(fontdata.text, {
      font: font,
      size: 3,
      height: 1,
      curveSegments: 12
    });

    let myMaterial = new THREE.MeshPhongMaterial({ color: fontdata.color });
    let myFontgeo = new THREE.Mesh(fontgeo, myMaterial);

    scene.add(myFontgeo);
    console.log("adding fonts to scene");
    myFontgeo.position.set(fontdata.positionX + 2, fontdata.positionY + 2, fontdata.positionZ);
    // myFontgeo.scale.set(0.02,0.02,0.02);

    myFontgeo.userData.interactable = true;

    //get interactable query results
    // let res = getFirstPage(fontdata.text);
    // console.log(res);

    myFontgeo.userData.link = "https://en.wikipedia.org/wiki/" + fontdata.text;
    myFontgeo.userData.query = fontdata.text;

    // addAPI(myFontgeo,link);

  });

  // fontgeo.position.set(30,2,30);

}

async function getFirstPage(text) {
  let query = text;
  let url = `https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrnamespace=0&gsrlimit=35&gsrsearch='${query}'`;


  fetch(url, {
    method: 'GET'
    // mode: 'cors',
    // headers: {
    //   'Content-Type': 'application/json'
    //   // 'Content-Type': 'application/x-www-form-urlencoded',
    // }
  }).then(response => response.text())
  .then(result => JSON.parse(result))
  .then(result => result.query)
  .then(result => result.pages)
  .then(result => getPage(result))
  .catch(error => console.log('error', error));

  async function getPage(data){
    for (var i in data) {
      // console.log(data[i]);
      let title = data[i].title.replace(/[\s]/g, "_"); // Replace whitespaces with underscores
      return title;
    }
  }
}

let collideObjGroup = new THREE.Group();
function addCollideMark(scene, data) {
  collideObj = myBModel.clone();

  collideObj.position.set(data.x, data.y, data.z);
  collideObjGroup.add(collideObj);

  // scene.add(collideObj);
  // collideObj.scale.set(0.5, 0.5, 0.5);
  // setInterval(scene.remove(collideObj),10000);
}

function addAPI(linkMesh, link) {
  console.log("add API to mesh");
  linkMesh.userData.interactable = true;
  linkMesh.userData.link = link;

}