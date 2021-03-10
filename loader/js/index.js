let glScene

window.onload = async () => {
    console.log("Window loaded.");
    console.log("Creating three.js scene...");
    glScene = new Scene();
};



class Scene {
    constructor() {
        this.scene = new THREE.Scene();

        this.width = window.innerWidth;
        this.height = window.innerHeight - 100;
        this.pixelRatio = window.devicePixelRatio;

        this.camera = new THREE.PerspectiveCamera(
            50,
            this.width / this.height,
            0.1,
            5000
        );
        this.camera.position.set(0, 3, 6);
        this.scene.add(this.camera);

        this.renderer = new THREE.WebGLRenderer(
            { antialiasing: true, }
        );
        this.renderer.setClearColor(new THREE.Color("black"));
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(this.pixelRatio);

        //Push the canvas to the DOM
        let domElement = document.getElementById("canvas-container");
        domElement.append(this.renderer.domElement);

        window.addEventListener("resize", (e) => this.onWindowResize(e), false);


        // Helpers
        this.scene.add(new THREE.GridHelper(500, 500));
        this.scene.add(new THREE.AxesHelper(10));
        this.addLights();


        createEnvironment(this.scene);

        // Start the loop
        this.frameCount = 0;
        this.update();

    }


    addLights() {
        console.log("addlights");
        this.scene.add(new THREE.AmbientLight(0xffffe6, 0.7));
    }

    update() {
        // console.log("update environments");
        requestAnimationFrame(() => this.update());
        this.frameCount++;

        updateEnvironment();
        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize(e) {
        this.width = window.innerWidth;
        this.height = Math.floor(window.innerHeight - window.innerHeight * 0.3);
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
      }
}

let myModel;

function createEnvironment(scene) {
    console.log("Adding environment");
    loadModel(scene);
}

function updateEnvironment() {

//put loops here
    if (myModel) {
        myModel.rotation.x += 0.001;
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

    const onError = function () {
        console.log("got errors");
    };

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
                        object.position.set(0, 0, -20);
                        object.rotation.y = Math.PI / 3;
                        object.rotation.x = Math.PI / 12;
                        scene.add(object);
                    },
                    onProgress,
                    onError
                );
        });
}

