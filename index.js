class Scene {
  constructor() {
    this.canvas = document.getElementById("renderCanvas");
    this.objects = {};
    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true
    });

    this.scene = new BABYLON.Scene(this.engine);
    this.fillScene();
  }

  fillScene() {
    let camera = new BABYLON.FreeCamera(
      "camera1",
      new BABYLON.Vector3(0, 1.5, -7),
      this.scene
    );

    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(this.canvas, true);

    let light = new BABYLON.HemisphericLight(
      "light1",
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );

    light.intensity = 1;
  }

  async render() {
    this.engine.runRenderLoop(() => {
      if (this.scene) {
        this.scene.render();
      }
    });

    window.addEventListener("resize", () => {
      this.engine.resize();
    });
  }

  loadSuzan() {
    BABYLON.SceneLoader.ImportMesh(
      "Suzanne",
      "Assets/",
      "suzan.babylon",
      this.scene,
      (meshes, particleSystems) => {
        this.objects.suzane = meshes[0];

        this.scene.registerBeforeRender(() => {
            for (let i = 0; i < 360; i+= 0.001) {
                i = i % 360;
                let mesh = this.objects.suzane;
                if (mesh) mesh.rotate(BABYLON.Axis.Y, i, BABYLON.Space.LOCAL);
              }
        })
      }
    );
  }
}

let s = new Scene();
s.loadSuzan();
s.render();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Moving routine
// async function func() {
//     while(true) {
//         //console.log('Taking a break...');
//         await sleep(10);
//         cube.position.x += 0.001
//         // var direction = prompt("Left,Right,Up,Down,Front,Back?")

//         // switch (direction) {
//         //     case "Left":
//         //         cube.position.x -= 1;
//         //         break;
//         //     case "Right":
//         //         cube.position.x += 1;
//         //         break;
//         //     case "Down":
//         //         cube.position.y -= 1;
//         //         break;
//         //     case "Up":
//         //         cube.position.y += 1;
//         //         break;
//         //     case "Front":
//         //         cube.position.z -= 1;
//         //         break;
//         //     case "Back":
//         //         cube.position.z += 1;
//         //         break;
//         // }
//     }
// }
// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }
