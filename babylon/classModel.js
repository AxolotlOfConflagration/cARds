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

    let light = new BABYLON.HemisphericLight(
      "light1",
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );

    light.intensity = 1;

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
  while (true) {
    console.log("Taking a break...");
    await sleep(1000);
    var direction = prompt("Podaj współrzędne", "0 0 0 0 0 0");

    coord = direction.split(" ");

    cube.position = [coord[0], coord[1], coord[2]];
    cube.rotation = [coord[3], coord[4], coord[5]];
  }
}

func(preview.model);
