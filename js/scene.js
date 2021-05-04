
class Scene {
  constructor(_movementCallback) {
    this.movementCallback = _movementCallback;

    //THREE scene
    this.scene = new THREE.Scene();
    this.keyState = {};

    // this.scene.background = new THREE.CubeTextureLoader()
    //   .setPath('../assets/cubeMap/')
    //   .load([
    //     '1.jpg'
    //   ]);

    //Utility
    this.width = window.innerWidth;
    this.height = window.innerHeight * (7.0 / 8.0);
    this.pixelRatio = window.devicePixelRatio;

    //Add Player
    this.addSelf();

    //THREE Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      this.width / this.height,
      0.1,
      5000
    );
    this.camera.position.set(0, 3, 6);
    this.scene.add(this.camera);

    // this.camera = new THREE.PerspectiveCamera(
    //   55,
    //   this.width / this.height,
    //   1,
    //   20000
    // );
    // this.camera.position.set(30, 30, 60);
    // this.scene.add(this.camera);

    // create an AudioListener and add it to the camera
    this.listener = new THREE.AudioListener();
    this.playerGroup.add(this.listener);

    //THREE WebGL renderer
    this.renderer = new THREE.WebGLRenderer({ antialiasing: true, transparent: true });
    this.renderer.setClearColor(new THREE.Color("black"));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.pixelRatio);

    //Push the canvas to the DOM
    let domElement = document.getElementById("canvas-container");
    domElement.append(this.renderer.domElement);
    // add controls:
    this.controls = new THREE.PlayerControls(this.camera, this.playerGroup);

    //Setup event listeners for events and handle the states
    window.addEventListener("resize", (e) => this.onWindowResize(e), false);
    // window.addEventListener("keydown", (e) => this.onKeyDown(e), false);
    // window.addEventListener("keyup", (e) => this.onKeyUp(e), false);

    //text input
    document.getElementById('submitButton').addEventListener('click', () => {
      // Get Input Data
      this.data = {
        text: document.getElementById('textValue').value,
        color: document.getElementById('colorValue').value,
        positionX: this.playerGroup.position.x,
        positionY: this.playerGroup.position.y,
        positionZ: this.playerGroup.position.z,
        id: this.playerGroup.id
      }
      console.log("send:" + this.data);
      socket.emit("send text", this.data);
      // createFonts(this.scene,this.data);
    });

    //leave mark
    document.getElementById('leaveMark').addEventListener('click', () => {
      // Get Input Data
      let time = new Date();
      let timezone = time.getTimezoneOffset();
      this.data = {
        positionX: this.playerGroup.position.x,
        positionY: this.playerGroup.position.y,
        positionZ: this.playerGroup.position.z,
        id: this.playerGroup.id,
        time: timezone
      }
      console.log("send:" + this.data.time);
      socket.emit("send mark", this.data);
    });

    //leave trace
    let traceStatus = false;
    document.getElementById('leaveTrace').addEventListener('click', addTrace);
    function addTrace() {
      traceStatus = !traceStatus;
      if (traceStatus) {
        document.getElementById('leaveTrace').value = "Tracing!";
        console.log("leaveTrace!");
        setInterval(toTrace, 1000);
      }
      else {
        document.getElementById('leaveTrace').value = "no trace";
        console.log("wantTrace!");
        clearInterval(toTrace);
      }
    }

    const toTrace = () => {
      if (traceStatus) {
        this.data = {
          positionX: this.playerGroup.position.x,
          positionY: this.playerGroup.position.y,
          positionZ: this.playerGroup.position.z,
          id: this.playerGroup.id
        }
        // console.log("send:" + this.data);
        socket.emit("send trace", this.data);
      }
    }
    // Helpers
    // this.scene.add(new THREE.GridHelper(500, 500));
    // this.scene.add(new THREE.AxesHelper(10));

    this.addLights();
    createEnvironment(this.scene, this.renderer);

    // set up the raycaster:
    // this.setUpRaycaster();

    this.initRayCaster();

    //URL with wikipedia API
    // document.getElementById('searchButton').addEventListener('click',()=>{
    //   addElementsToScene(this.scene);
    // });

    //still URL
    addURLLinkElement(this.scene);

    // Start the loop
    this.frameCount = 0;
    this.update();
  }

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Lighting 💡

  addLights() {
    this.scene.add(new THREE.AmbientLight(0xffffe6, 0.7));
  }

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Clients 👫

  addSelf() {
    let videoMaterial = makeVideoMaterial("local");

    let _head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), videoMaterial);

    _head.position.set(0, 0, 0);

    // https://threejs.org/docs/index.html#api/en/objects/Group
    this.playerGroup = new THREE.Group();
    this.playerGroup.position.set(0, 0.5, 0);
    this.playerGroup.add(_head);

    // add group to scene
    this.scene.add(this.playerGroup);
  }

  // add a client meshes, a video element and  canvas for three.js video texture
  addClient(_id) {
    let videoMaterial = makeVideoMaterial(_id);

    let _head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), videoMaterial);

    // set position of head before adding to parent object

    _head.position.set(0, 0, 0);

    // https://threejs.org/docs/index.html#api/en/objects/Group
    var group = new THREE.Group();
    group.add(_head);

    // add group to scene
    this.scene.add(group);

    clients[_id].group = group;
    clients[_id].head = _head;
    clients[_id].desiredPosition = new THREE.Vector3();
    clients[_id].desiredRotation = new THREE.Quaternion();
    clients[_id].movementAlpha = 0;
  }

  removeClient(_id) {
    this.scene.remove(clients[_id].group);
  }

  // overloaded function can deal with new info or not
  updateClientPositions(_clientProps) {
    for (let _id in _clientProps) {
      if (_id != id) {
        clients[_id].desiredPosition = new THREE.Vector3().fromArray(
          _clientProps[_id].position
        );
        clients[_id].desiredRotation = new THREE.Quaternion().fromArray(
          _clientProps[_id].rotation
        );
      }
    }
  }

  createFont(data) {
    console.log("receive text" + data);
    createFonts(this.scene, data);
  }

  createMark(data) {
    console.log("receive mark" + data);
    createMarks(this.scene, data);
  }

  createTrace(data) {
    createTraces(this.scene, data);
  }

  createCollideMark(data) {
    addCollideMark(this.scene, data);
  }

  changeSun(data) {
    updateSunData(this.scene, data);
    console.log("updata sun!");
  }

  // snap to position and rotation if we get close
  interpolatePositions() {
    let snapDistance = 0.5;
    let snapAngle = 0.2; // radians
    for (let _id in clients) {
      clients[_id].group.position.lerp(clients[_id].desiredPosition, 0.2);
      clients[_id].group.quaternion.slerp(clients[_id].desiredRotation, 0.2);
      if (
        clients[_id].group.position.distanceTo(clients[_id].desiredPosition) <
        snapDistance
      ) {
        clients[_id].group.position.set(
          clients[_id].desiredPosition.x,
          clients[_id].desiredPosition.y,
          clients[_id].desiredPosition.z
        );
      }
      if (
        clients[_id].group.quaternion.angleTo(clients[_id].desiredRotation) <
        snapAngle
      ) {
        clients[_id].group.quaternion.set(
          clients[_id].desiredRotation.x,
          clients[_id].desiredRotation.y,
          clients[_id].desiredRotation.z,
          clients[_id].desiredRotation.w
        );
      }
    }
  }

  //calculate distance every 25 frame count
  clientDist() {
    // console.log(this.playerGroup.position);
    for (let i = 0; i < Object.keys(clients).length; i++) {
      // console.log(Object.keys(clients)[i]);
      let __id = Object.keys(clients)[i];
      let atEntrance = (this.playerGroup.position.x != 0) || (this.playerGroup.position.z != 0);
      let dist = this.playerGroup.position.distanceTo(clients[__id].group.position);
      let collideDistance = 2;
      if ((dist < collideDistance) && atEntrance) {
        // console.log(this.playerGroup.position);
        socket.emit("addCollideMark", this.playerGroup.position);
        // addCollideMark(this.scene, this.playerGroup.position);
      }

      // console.log(clients[__id].group.position);
      // console.log(dist);
    }
  }

  //collide effect - clientDist 
  // collide() {
  //   let collideDistance = 1;
  //   console.log("collide check");
  //   console.log(clients);
  //   for (let _id in clients) {


  //     for (var i = 0; i < clients.length; i++) {
  //       if (i != _id) {
  //         let minDist = clients[_id].group.position.distanceTo(clients[i].group.position);
  //         console.log(minDist);
  //         if (minDist < collideDistance) {
  //           console.log(clients[_id], clients[i]);
  //         }
  //       }
  //     }

  //   }

  // }

  updateClientVolumes() {
    // console.log(Object.keys(clients));
    for (let _id in clients) {
      let audioEl = document.getElementById(_id + "_audio");
      if (audioEl) {
        let distSquared = this.camera.position.distanceToSquared(
          clients[_id].group.position
        );

        if (distSquared > 500) {
          // console.log('setting vol to 0')
          audioEl.volume = 0;
        } else {
          // from lucasio here: https://discourse.threejs.org/t/positionalaudio-setmediastreamsource-with-webrtc-question-not-hearing-any-sound/14301/29
          let volume = Math.min(1, 10 / distSquared);
          audioEl.volume = volume;
          // console.log('setting vol to',volume)
        }
      }
    }
  }

  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Interaction 🤾‍♀️

  getPlayerPosition() {
    // TODO: use quaternion or are euler angles fine here?
    return [
      [
        this.playerGroup.position.x,
        this.playerGroup.position.y,
        this.playerGroup.position.z,
      ],
      [
        this.playerGroup.quaternion._x,
        this.playerGroup.quaternion._y,
        this.playerGroup.quaternion._z,
        this.playerGroup.quaternion._w,
      ],
    ];
  }

  //new raycaster
  initRayCaster() {
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.getElementById('canvas-container').addEventListener("mouseup", (e) => this.onMouseUp(e));
    //mouse up listener to be added
    console.log("initRayCaster!");
  }

  onMouseMove = (event) => {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    let focusedCube;

    this.mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y = - (event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children,
      true);

    //method1//
    const objecctGroup = this.scene.children;

    for (const currentObj of objecctGroup) {
      currentObj.userData.hover = false;
    }
    if (intersects.length > 0) {
      for (const interset of intersects) {
        interset.object.userData.hover = true;
        // console.log(interset.object);
      }
    }

    for (const currentObj of objecctGroup) {
      currentObj.userData.group = new THREE.Group();

      if (currentObj.userData.hover) {

        if (currentObj.userData.interactable) {

          currentObj.scale.set(2, 2, 2);
   
          //first time get hover or just change hover state
          if (!currentObj.userData.focus) {
            currentObj.userData.focus = true;
            console.log(currentObj.userData + ':focus!');
            console.log(currentObj.userData.link);

            if (currentObj.userData.link) {
              this.activeLink = currentObj.userData.link;
              this.focusedObj = currentObj;
              console.log(this.focusedObj);
            }


            if (!currentObj.userData.nolongerAdd) {

              currentObj.userData.group = addRelatedWords(currentObj.userData.query, currentObj.position, currentObj.userData.group);
              this.scene.add(currentObj.userData.group);
              // console.log(currentObj.userData.group);
              // console.log(currentObj.userData.group.children);
              currentObj.userData.nolongerAdd = true;

            }
          }
        }



      }
      else {

        if (currentObj.userData.interactable) {
          currentObj.scale.set(1, 1, 1);
          
          currentObj.userData.focus = false;
          // this.focusedObj = false;
     
          // if (currentObj.userData.group!==null) {
          //   for (const removeObj of currentObj.userData.group) {
          //     this.scene.remove(removeObj);
          //   }
          // }
          // this.scene.remove(currentObj.userData.group);
          // console.log(currentObj.userData.group);
        }

      }
    }
    //method1 end//

    // //method2//
    // if(intersects.length>0){
    //   const newFocusedCube = intersects[0].object;
    //   if(newFocusedCube.uuid != focusedCube?.uuid){
    //     focusedCube = newFocusedCube;
    //     if (focusedCube.userData.interactable){
    //     focusedCube.scale.set(1.25,1.25,1.25);
    //   }
    //     console.log('got a new object:'+newFocusedCube.uuid );
    //   }
    // }
    // else{
    //   if(focusedCube){
    //     focusedCube.scale.set(1.0,1.0,1.0);
    //   }
    //   focusedCube = undefined;
    // }
    // //method2 ending//

  }


  //old raycaster
  setUpRaycaster() {
    window.addEventListener("mousemove", (e) => this.onMouseMove(e), false);
    window.addEventListener("mouseup", (e) => this.onMouseUp(e), false);
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.previousIntersects = [];
  }

  checkRaycaster() {
    // console.log(this.previousIntersects);
    this.activeLink = false;
    this.activeSpawnPoint = false;
    this.activeSpawnNormal = false;
    for (let i = 0; i < this.previousIntersects.length; i++) {
      let obj = this.previousIntersects[i];
      obj.scale.set(1, 1, 1);
      obj.HoverState = false;
      obj.previousHoverState = obj.HoverState;
    }

    // update the ray with the current camera and mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // calculate objects intersecting the ray
    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true
    );



    for (let i = 0; i < intersects.length && i < 1; i++) {
      let obj = intersects[i].object;

      if (!obj.userData.interactable) continue;

      obj.scale.set(1.25, 1.25, 1.25);

      // console.log(obj.scale.x);

      // obj.hoverOn = true;
      obj.HoverState = true;
      obj.previousHoverState = obj.HoverState;


      // console.log(typeof(obj.userData.link));

      if (obj.userData.link.includes("wiki")) {

        if (obj.shouldChange) {
          // addRelatedWords(obj, obj.userData.link, this.scene);
        };
      };

      // if we've  added a 'link' to the objects user data, set that to our active link
      if (obj.userData.link) {
        this.activeLink = obj.userData.link;
      }

      // if we want to spawn something on the surface of another object, we can store the
      // intersection point and the 'normal' (i.e. the angle of the surface) here:
      if (obj.userData.isSpawnSurface) {
        this.activeSpawnPoint = intersects[i].point;
        this.activeSpawnNormal = intersects[i].face.normal;
      }

      // finally, if we'd like to reset object parameters after we're  done interacting,
      // let's store which object we have interacted with:
      this.previousIntersects.push(obj);


    }

    for (let i = 0; i < intersects.length && i < 1; i++) {
      let obj = intersects[i].object;

      if (obj.previousHoverState != obj.HoverState || obj.previousHoverState == false) {
        obj.shouldChange = true;
        console.log("hoverstate change!");
      }
    };


  }

  // onMouseMove(event) {
  //   // calculate mouse position in normalized device coordinates
  //   // (-1 to +1) for both components

  //   this.mouse.x =
  //     (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
  //   this.mouse.y =
  //     -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
  //   // console.log(this.mouse);
  // }

  onMouseUp(event) {
    console.log("mouseUp: "+this.focusedObj.userData.link);

    if (this.activeLink==this.focusedObj.userData.link) {
      // if(this.focusedObj.userData.link == this.activeLink){
      window.open(this.activeLink);
      console.log("open new page: " + this.activeLink);
      // }
      this.activeLink=false;
    }

    if (this.activeSpawnPoint) {
      console.log()
      let geo = new THREE.TetrahedronGeometry(1, 0);
      let mat = new THREE.MeshBasicMaterial();
      let mesh = new THREE.Mesh(geo, mat);

      mesh.position.copy(this.activeSpawnPoint.x, this.activeSpawnPoint.y, this.activeSpawnPoint.z);
      mesh.lookAt(this.activeSpawnNormal.x, this.activeSpawnNormal.y, this.activeSpawnNormal.z);
      console.log(this.activeSpawnNormal);

      this.scene.add(mesh);
    }
  }


  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Rendering 🎥

  update() {
    // console.log("update environments");
    requestAnimationFrame(() => this.update());
    this.frameCount++;

    updateEnvironment(this.scene);
    // updateSunData(this.scene);


    // this.checkRaycaster();


    if (this.frameCount % 25 === 0) {
      this.updateClientVolumes();
      this.movementCallback();
      this.clientDist();
    }
    this.interpolatePositions();
    this.controls.update();
    this.render();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }



  //////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////
  // Event Handlers 

  onWindowResize(e) {
    this.width = window.innerWidth;
    this.height = Math.floor(window.innerHeight - window.innerHeight * 0.3);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  // // keystate functions from playercontrols
  // onKeyDown(event) {
  //   event = event || window.event;
  //   this.keyState[event.keyCode || event.which] = true;
  // }

  // onKeyUp(event) {
  //   event = event || window.event;
  //   this.keyState[event.keyCode || event.which] = false;
  // }
}

//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
// Utilities

function makeVideoMaterial(_id) {
  let videoElement = document.getElementById(_id + "_video");
  let videoTexture = new THREE.VideoTexture(videoElement);

  let videoMaterial = new THREE.MeshBasicMaterial({
    map: videoTexture,
    overdraw: true,
    // side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5
  });

  return videoMaterial;
}

function addRelatedWords(query, position, group) {
  var xhr = new XMLHttpRequest();
  var url = `https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrnamespace=0&gsrlimit=35&gsrsearch='${query}'`;


  xhr.open("GET", url, true);

  xhr.onload = function () {
    var data = JSON.parse(this.response);

    // console.log(data);
    // console.log(position);

    // console.log(data.query.pages);

    for (var i in data.query.pages) {
      let title = data.query.pages[i].title.replace(/[\s]/g, "_"); // Replace whitespaces with underscores
      // console.log(title);
      let link = "https://en.wikipedia.org/wiki/" + title;
      addLinkElement(title, position, group);
    }

  };

  // Send request to the server
  xhr.send();
  return group;
}

function addLinkElement(title, position, group) {
  const loader = new THREE.FontLoader();
  // console.log("loading linkedEle:"+title);

  loader.load('../assets/fonts/helvetiker_regular.typeface.json', function (font) {

    let linkGeometry = new THREE.TextGeometry(title, {
      font: font,
      size: 2,
      height: 1
    });

    let linkMaterial = new THREE.MeshPhongMaterial({
      color: 'lightblue',
      transparent: true,
      opacity: 0.2
    });

    let linkMesh = new THREE.Mesh(linkGeometry, linkMaterial);

    linkMesh.userData.interactable = false;
    linkMesh.userData.newindow = true;
    linkMesh.userData.link = "https://en.wikipedia.org/wiki/" + title;
    // console.log('link:',link);

    linkMesh.position.set(position.x + Math.random() * 10, position.y + Math.random() * 10, position.z + Math.random() * 10);

    group.add(linkMesh);

  });
}