const MIRROR_AR = true;
const FILTER_STRENGTH = 0.6;

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
    let camera = new BABYLON.FreeCamera(
      "FreeCamera",
      new BABYLON.Vector3(0, 0, 30),
      this.scene
    );

    camera.setTarget(BABYLON.Vector3.Zero());

    let light = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 0, 250), this.scene);
    light.intensity = 5;
    light.range = 400;

    let material = new BABYLON.StandardMaterial("material", this.scene);
    material.wireframe = true;
    this.model.material = material;
    this.model.rotationQuaternion = BABYLON.Quaternion.Identity();

    // let ground = BABYLON.Mesh.CreatePlane("ground1", 220, this.scene);
    // this.ground = ground;
    // ground.position.z = 1000;
    // ground.scaling.x = MIRROR_AR ? -4 : 4;
    // ground.scaling.y = -3; // Handedness

    // let mat = new BABYLON.StandardMaterial("mat", this.scene);
    // ground.material = mat;
  }

  loadSuzan() {
    BABYLON.SceneLoader.ImportMesh(
      "",
      "static/models/", //TODO change path
      "suzane_anim.babylon",
      this.scene,
      (meshes, particleSystems, skeletons) => {
        meshes[0].position.x = 0;
        meshes[0].position.y = 0;
        meshes[0].position.z = 0;
        meshes[0].rotationQuaternion = BABYLON.Quaternion.Identity();
        // meshes[0].rotate(BABYLON.Axis.Y, Math.PI * 5 / 4, BABYLON.Space.WORLD);
        this.scene.beginAnimation(skeletons[0], 0, 180, true, 1.0);
        this.suzane = meshes[0];
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

function moveModel(model, coordinates) { }

var socket = io.connect("http://localhost:5000");
socket.on("coordinates", coordinates => {
  coords = JSON.parse(coordinates);
  // console.log("x: ", coords.x);
  // console.log("y: ", coords.y);
  // console.log("z: ", coords.z);
  // console.log("rx: ", coords.rx);
  // console.log("ry: ", coords.ry);
  // console.log("rz: ", coords.rz);
  // preview.model.position.x = coords.tx;
  // preview.model.position.y = coords.ty;
  // preview.model.position.z = coords.tz;
  // preview.model.rotation.x = coords.rx;
  // preview.model.rotation.y = coords.ry;
  // preview.model.rotation.z = coords.rz;
  moveObjWithAruco(preview.suzane, coords);
});

function moveObjWithAruco(obj, coords) {
  let ftx = MIRROR_AR ? -coords.tx : coords.tx;
  let fty = -coords.ty; // Handedness.
  let ftz = coords.tz;
  let frx = coords.rx;
  let fry = coords.ry;
  let frz = coords.rz;

  // Convert rotations from Rodrigues to quaternion and filter noise.
  // TODO: The noise on the rotation looks like it toggles between right answers and wrong answers.
  // User a median filter to improve the quality.
  let rot = new BABYLON.Vector3(-frx, fry, -frz);
  let theta = rot.length();
  rot.scaleInPlace(1.0 / theta);
  if (theta !== 0.0) {
      let quat = BABYLON.Quaternion.RotationAxis(rot, theta);
      console.log(obj);
      obj.rotationQuaternion = BABYLON.Quaternion.Slerp(obj.rotationQuaternion, quat, 1.0 - FILTER_STRENGTH);
  }

  obj.position.x *= FILTER_STRENGTH;
  obj.position.x += (1.0 - FILTER_STRENGTH) * ftx;
  // console.log("x:", obj.position.x)
  obj.position.y *= FILTER_STRENGTH;
  obj.position.y += (1.0 - FILTER_STRENGTH) * fty;
  // console.log("y:", obj.position.y)
  // obj.position.z *= FILTER_STRENGTH;
  // obj.position.z += (1.0 - FILTER_STRENGTH) * ftz;

  // obj.position.y = fty/50*40;
  // obj.position.x = (-ftx)/50*40;
  // console.log("fty:", )



  // const Z_STRENGHT = 0.1
  // console.log("ftz:",1/ftz*35000)
  // obj.position.x = 0
  // obj.position.y = 0
  obj.position.z = 1/ftz*3000
  // console.log("z:", obj.position.z)
}

//func(preview.model);
