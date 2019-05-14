const MIRROR_AR = false;
const ARUCO_MODULE_NAME = "acuroModule";
const ARUCO_MODULE_LOCATION =
  "https://syntheticmagus.github.io/webpiled-aruco-ar/v0.01/webpiled-aruco-ar.js";
const FILTER_STRENGTH = 0.4;

class ModelPreview {
  constructor() {
    this.canvas = document.getElementById("renderCanvas");
    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true
    });

    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
    this.fillScene();
  }

  fillScene() {
    let camera = new BABYLON.UniversalCamera(
      "UniversalCamera",
      new BABYLON.Vector3(0, 0, 0),
      this.scene
    );
    // camera.setTarget(BABYLON.Vector3.Zero());

    let light = new BABYLON.HemisphericLight(
      "hemiLight",
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );
    light.intensity = 4.5;
    light.range = 100;

    let feed = BABYLON.Mesh.CreatePlane("feed", 220, this.scene);
    feed.position.z = 900;
    feed.scaling.x = MIRROR_AR ? -4 : 4;
    feed.scaling.y = -3;
    this.feed = feed;

    let material = new BABYLON.StandardMaterial("material", this.scene);
    feed.material = material;
    this.material = material;
  }

  loadSuzan() {
    BABYLON.SceneLoader.ImportMesh(
      "",
      "static/models/", //TODO change path
      "suzane_anim.babylon",
      this.scene,
      (meshes, particleSystems, skeletons) => {
        let suzzane = meshes[0];
        suzzane.position.z = 10;
        suzzane.position.y = -2;
        // suzzane.position.x = -5;
        // suzzane.rotate(BABYLON.Axis.Y, Math.PI * 5 / 4, BABYLON.Space.WORLD);
        this.scene.beginAnimation(skeletons[0], 0, 180, true, 1.0);
        suzzane.rotationQuaternion = BABYLON.Quaternion.Identity();
        this.suzzane = suzzane;

        BABYLON.VideoTexture.CreateFromWebCam(
          this.scene,
          videoTexture => {
            this.material.diffuseTexture = videoTexture;

            ensureAruco();
            setTimeout(() => {
              Module._reset();

              let ftx = 0.0;
              let fty = 0.0;
              let ftz = 0.0;
              let frx = 0.0;
              let fry = 0.0;
              let frz = 0.0;
              let framesSinceSeen = 0;

              this.scene.onAfterRenderObservable.add(() => {
                let numMarkers = findMarkersInImage(
                  videoTexture,
                  (id, tx, ty, tz, rx, ry, rz) => {
                    console.log("id: ", id);

                    ftx = MIRROR_AR ? -tx : tx;
                    fty = -ty;
                    ftz = tz;

                    frx = rx;
                    fry = ry;
                    frx = rz;
                  }
                );

                let rot = new BABYLON.Vector3(-frx, fry, -frz);
                let theta = rot.length();
                rot.scaleInPlace(1.0 / theta);
                if (theta !== 0.0) {
                  let quat = BABYLON.Quaternion.RotationAxis(rot, theta);
                  this.suzzane.rotationQuaternion = BABYLON.Quaternion.Slerp(
                    this.suzzane.rotationQuaternion,
                    quat,
                    1.0 - FILTER_STRENGTH
                  );
                }

                if (numMarkers === 0) {
                  framesSinceSeen += 1;
                } else {
                  framesSinceSeen = 0;
                }

                this.suzzane.position.x *= FILTER_STRENGTH;
                this.suzzane.position.x += (1.0 - FILTER_STRENGTH) * ftx;
                this.suzzane.position.y *= FILTER_STRENGTH;
                this.suzzane.position.y += (1.0 - FILTER_STRENGTH) * fty;
                this.suzzane.position.z *= FILTER_STRENGTH;
                this.suzzane.position.z += (1.0 - FILTER_STRENGTH) * ftz;

                if (
                  framesSinceSeen < 10 ||
                  Math.abs(this.suzzane.position.x - ftx) > 0.01
                ) {
                  this.suzzane.visibility = 1;
                } else {
                  this.suzzane.visibility = 0;
                }
              });
            }, 2000);
          },
          { maxWidth: 640 * 2, maxHeight: 480 * 2 }
        );
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

function ensureAruco() {
  if (document.getElementById(ARUCO_MODULE_NAME) === null) {
    var moduleScript = document.createElement("script");
    moduleScript.id = ARUCO_MODULE_NAME;
    moduleScript.src = ARUCO_MODULE_LOCATION;
    document.body.appendChild(moduleScript);
  }
}

function findMarkersInImage(videoTexture, callback) {
  var width = videoTexture.getSize().width;
  var height = videoTexture.getSize().height;
  var imageData = videoTexture.readPixels();

  var buf = Module._malloc(imageData.length * imageData.BYTES_PER_ELEMENT);
  Module.HEAPU8.set(imageData, buf);
  var numMarkers = Module._process_image(width, height, buf, 1);
  Module._free(buf);

  for (var markerIdx = 0; markerIdx < numMarkers; markerIdx++) {
    var ptr = Module._get_tracked_marker(0);

    var offset = 0;
    var id = Module.getValue(ptr + offset, "i32");
    offset += 12;
    var tx = Module.getValue(ptr + offset, "double");
    offset += 8;
    var ty = Module.getValue(ptr + offset, "double");
    offset += 8;
    var tz = Module.getValue(ptr + offset, "double");
    offset += 8;
    var rx = Module.getValue(ptr + offset, "double");
    offset += 8;
    var ry = Module.getValue(ptr + offset, "double");
    offset += 8;
    var rz = Module.getValue(ptr + offset, "double");

    if (callback) {
      callback(id, tx, ty, tz, rx, ry, rz);
    }
  }

  return numMarkers;
}
