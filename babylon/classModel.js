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

    let material = new BABYLON.StandardMaterial("material", this.scene);
    material.wireframe = true;
    this.model.material = material;
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
    console.log(cube.position);
  }
}

func(preview.model);
