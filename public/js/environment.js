let myMesh;
let water, sun, sky;
let pmremGenerator;
let myModel;
let fontgeo;
let sundata;
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
  setup();
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

  function updateSunData(scene) {
    // console.log("update sun!");

    const theta = Math.PI * (sundata - 0.5);
    const phi = 2 * Math.PI * (parameters.azimuth - 0.5);

    sun.x = Math.cos(phi);
    sun.y = Math.sin(phi) * Math.sin(theta);
    sun.z = Math.sin(phi) * Math.cos(theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    scene.environment = pmremGenerator.fromScene(sky).texture;

  }


}


function updateEnvironment() {
  // myMesh.position.x += 0.01;
  const time = performance.now() * 0.001;
  water.rotation.x = - Math.PI / 2;
  water.material.uniforms['time'].value += 1.0 / 60.0;
  if (myModel) {
    myModel.rotation.x += 0.001;
    myModel.rotation.z += 0.001;
  }

}

function loadModel(scene) {
  // model
  const onProgress = function (xhr) {
    if (xhr.lengthComputable) {
      const percentComplete = (xhr.loaded / xhr.total) * 100;
      console.log(Math.round(percentComplete, 2) + "% downloaded");
    }
  };

  const onError = function () { };

  const manager = new THREE.LoadingManager();

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
            console.log("load model");
            myModel = object;
            object.position.set(-50, 0, -50);
            object.rotation.y = Math.PI / 3;
            object.rotation.x = Math.PI / 12;
            scene.add(object);
          },
          onProgress,
          onError
        );
    });
}

function createFonts(scene,data) {
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

    let myMaterial = new THREE.MeshPhongMaterial({color: fontdata.color});
    let myFontgeo = new THREE.Mesh(fontgeo, myMaterial);

    scene.add(myFontgeo);
    myFontgeo.position.set(fontdata.positionX+2,fontdata.positionY+2,fontdata.positionZ);
    // myFontgeo.scale.set(0.02,0.02,0.02);
    
    myFontgeo.userData.interactable = true;
    myFontgeo.userData.link = "https://en.wikipedia.org/wiki/" +fontdata.text ;

    // addAPI(myFontgeo,link);
 
  });

  // fontgeo.position.set(30,2,30);

}

function addAPI(linkMesh,link) {
  console.log("add API to mesh");
  linkMesh.userData.interactable = true;
  linkMesh.userData.link = link;

}
