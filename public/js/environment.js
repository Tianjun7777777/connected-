let myMesh;
let water, sun, sky;
let pmremGenerator;

function createEnvironment(scene,renderer) {
  console.log("Adding environment");

  let texture = new THREE.TextureLoader().load("../assets/texture.png");
  let myGeometry = new THREE.SphereGeometry(3, 12, 12);
  let myMaterial = new THREE.MeshBasicMaterial({ map: texture });
  myMesh = new THREE.Mesh(myGeometry, myMaterial);
  myMesh.position.set(5, 2, 5);
  scene.add(myMesh);

  sun = new THREE.Vector3();

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
  console.log("sky material:"+ sky.material);

  skyUniforms['turbidity'].value = 10;
  skyUniforms['rayleigh'].value = 2;
  skyUniforms['mieCoefficient'].value = 0.005;
  skyUniforms['mieDirectionalG'].value = 0.8;
  
  const parameters = {
    inclination: 0.49,
    azimuth: 0.205
  };

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
 
    const theta = Math.PI * (parameters.inclination - 0.5);
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

}

