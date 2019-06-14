class ModelPreview {
  constructor() {
    this.canvas = document.getElementById("renderCanvas");
    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true
    });

    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
    this.model = BABYLON.Mesh.CreateBox("Box", 4.0, this.scene);
    this.fillScene();
  }

  fillScene() {
    let camera = new BABYLON.UniversalCamera(
      "UniversalCamera",
      new BABYLON.Vector3(0, 0, 100),
      this.scene
    );

    camera.setTarget(BABYLON.Vector3.Zero());
    
    let light = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 0, 100), this.scene);
    light.intensity = 2.4;
    light.range = 100;

    let material = new BABYLON.StandardMaterial("material", this.scene);
    material.wireframe = true;
    this.model.material = material;
  }

  loadSuzan() {
    BABYLON.SceneLoader.ImportMesh(
      "",
      "static/models/", //TODO change path
      "suzane_anim.babylon",
      this.scene,
      (meshes, particleSystems, skeletons) => {
        meshes[0].position.z = 90;
        meshes[0].position.y = -2;
        meshes[0].position.x = -5;
        meshes[0].rotate(BABYLON.Axis.Y, Math.PI * 5/4, BABYLON.Space.WORLD);
        this.scene.beginAnimation(skeletons[0], 0, 180, true, 1.0);
      }
    );
  }

  render() {
    this.engine.runRenderLoop(() => {
      if (this.scene) {
        this.scene.render();
      }
    });
    window.addEventListener("resize", () => {
      this.engine.resize();
    });
  }
}

let preview = new ModelPreview();
preview.loadSuzan();
preview.render();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function func(cube) {
  let direction = "0 0 0 0 0 0";

  while (true) {
    await sleep(1000);
    direction = prompt("Podaj współrzędne", direction);

    coord = direction.split(" ");

    cube.position.x = coord[0];
    cube.position.y = coord[1];
    cube.position.z = coord[2];
    cube.rotation.x = coord[3];
    cube.rotation.y = coord[4];
    cube.rotation.z = coord[5];
    // console.log(cube.position);
  }
}

function moveModel(model, coordinates) {}

var socket = io.connect("http://localhost:5000");
socket.on("coordinates", coordinates => {
  coords = JSON.parse(coordinates);
  // console.log("x: ", coords.x);
  // console.log("y: ", coords.y);
  // console.log("z: ", coords.z);
  // console.log("rx: ", coords.rx);
  // console.log("ry: ", coords.ry);
  // console.log("rz: ", coords.rz);
  preview.model.position.x = coords.x;
  preview.model.position.y = coords.y;
  preview.model.position.z = coords.z;
  preview.model.rotation.x = coords.rx;
  preview.model.rotation.y = coords.ry;
  preview.model.rotation.z = coords.rz;
});

//func(preview.model);
