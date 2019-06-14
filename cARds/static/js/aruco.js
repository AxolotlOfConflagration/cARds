const MIRROR_AR = false;
const ARUCO_MODULE_NAME = "acuroModule";
const ARUCO_MODULE_LOCATION = "https://syntheticmagus.github.io/webpiled-aruco-ar/v0.01/webpiled-aruco-ar.js";
const FILTER_STRENGTH = 0.2;

const CHARMANDER_ID = 0;
const PIKACHU_ID = 2;
const BULBASAUR_ID = 3;

class ModelPreview {
    constructor() {
        this.canvas = document.getElementById("renderCanvas");
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.engine = new BABYLON.Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true
        });

        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

        this.models = {};
        this.framesSinceSeen = {};
        this.fillScene();
    }

    fillScene() {
        let camera = new BABYLON.UniversalCamera(
            "UniversalCamera",
            new BABYLON.Vector3(0, 0, 0),
            this.scene
        );
        // camera.setTarget(BABYLON.Vector3.Zero());

        let light = new BABYLON.HemisphericLight('hemiLight', new BABYLON.Vector3(0, 1, 0), this.scene);
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

        BABYLON.VideoTexture.CreateFromWebCam(this.scene, (videoTexture) => {
            this.material.diffuseTexture = videoTexture;

            ensureAruco();
            setTimeout(() => {
                Module._reset();

                this.scene.onAfterRenderObservable.add(() => {
                    findMarkersInImage(videoTexture, this.models, this.framesSinceSeen, translateRotateMesh);
                });

            }, 3000);
        }, { maxWidth: 640 * 2, maxHeight: 480 * 2 });
    }

    prepareMesh(meshId) {
        let mesh = this.models[meshId];
        mesh.rotationQuaternion = BABYLON.Quaternion.Identity();
        mesh.position.z = 10;
        mesh.position.y = 0;
        mesh.visibility = 0;
        mesh.scaling = new BABYLON.Vector3(2, 2, 2);;
    }

    loadMesh(path) {
        BABYLON.SceneLoader.ImportMesh(
            "",
            "static/models/", //TODO change path
            path,
            // "suzane_anim.babylon",
            this.scene,
            (meshes, particleSystems, skeletons) => {
                // this.scene.beginAnimation(skeletons[0], 0, 180, true, 1.0);
                meshes.forEach(mesh => {
                    console.log(mesh.id)
                    switch (mesh.id) {
                        case "Charmander":
                            this.models[CHARMANDER_ID] = mesh;
                            this.prepareMesh(CHARMANDER_ID)
                            break;
                        case "Pikachu":
                            this.models[PIKACHU_ID] = mesh;
                            this.prepareMesh(PIKACHU_ID);
                            break;
                        case "Bulbasaur":
                            this.models[BULBASAUR_ID] = mesh;
                            this.prepareMesh(BULBASAUR_ID);
                            break;
                    }
                });
                
                skeletons.forEach(skeleton => {
                    console.log(skeleton);
                    this.scene.beginAnimation(skeleton, 0, 290, true, 1.0);
                });
            }
        );
    }

    loadMeshes() {
        this.loadMesh("all_pokemons.babylon");
        this.loadMesh("bulbasaur.babylon");
        this.loadMesh("charmander_2.babylon");
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
preview.loadMeshes();
preview.render();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function ensureAruco() {
    if (document.getElementById(ARUCO_MODULE_NAME) === null) {
        let moduleScript = document.createElement("script");
        moduleScript.id = ARUCO_MODULE_NAME;
        moduleScript.src = ARUCO_MODULE_LOCATION;
        document.body.appendChild(moduleScript);
    }
}

function findMarkersInImage(videoTexture, meshes, framesSinceSeen, callback) {
    let width = videoTexture.getSize().width;
    let height = videoTexture.getSize().height;
    let imageData = videoTexture.readPixels();

    let buf = Module._malloc(imageData.length * imageData.BYTES_PER_ELEMENT);
    Module.HEAPU8.set(imageData, buf);
    let numMarkers = Module._process_image(width, height, buf, 1);
    Module._free(buf);

    for (let key in framesSinceSeen) {
        if (!framesSinceSeen[key]) {
            framesSinceSeen[key] = 0;
        }
        framesSinceSeen[key] += 1;
    }

    for (let markerIdx = 0; markerIdx < numMarkers; markerIdx++) {
        let ptr = Module._get_tracked_marker(markerIdx);

        let t = new BABYLON.Vector3();
        let r = new BABYLON.Vector3();

        let offset = 0;
        let id = Module.getValue(ptr + offset, "i32");
        offset += 12;

        t.x = Module.getValue(ptr + offset, "double");
        offset += 8;
        t.y = Module.getValue(ptr + offset, "double");
        offset += 8;
        t.z = Module.getValue(ptr + offset, "double");
        offset += 8;

        r.x = Module.getValue(ptr + offset, "double");
        offset += 8;
        r.y = Module.getValue(ptr + offset, "double");
        offset += 8;
        r.z = Module.getValue(ptr + offset, "double");

        let mesh = meshes[id];

        if (callback && mesh) {
            framesSinceSeen[id] = 0;
            mesh.visibility = 1;
            callback(id, framesSinceSeen[id], mesh, t, r);
        }
    }

    for (let key in framesSinceSeen) {
        let frames = framesSinceSeen[key];
        if (frames > 10 && meshes[key]) {
            meshes[key].visibility = 0;
        }
    }

    return numMarkers;
}

function translateRotateMesh(id, framesSinceSeen, mesh, t, r) {
    let ftx = MIRROR_AR ? - t.x : t.x;
    let fty = -t.y;
    let ftz = t.z;
    let frx = r.x;
    let fry = r.y;
    let frz = r.z;

    let rot = new BABYLON.Vector3(-frx, fry, -frz);
    let theta = rot.length();
    rot.scaleInPlace(1.0 / theta);
    if (theta !== 0.0) {
        let quat = BABYLON.Quaternion.RotationAxis(rot, theta);
        mesh.rotationQuaternion = BABYLON.Quaternion.Slerp(mesh.rotationQuaternion, quat, 1.0 - FILTER_STRENGTH);
        mesh.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);
    }

    mesh.position.x *= FILTER_STRENGTH;
    mesh.position.x += (1.0 - FILTER_STRENGTH) * ftx;
    mesh.position.y *= FILTER_STRENGTH;
    mesh.position.y += (1.0 - FILTER_STRENGTH) * fty;
    mesh.position.z *= FILTER_STRENGTH;
    mesh.position.z += (1.0 - FILTER_STRENGTH) * ftz;

    if (framesSinceSeen < 10, Math.abs(mesh.position.x - ftx) > 0.01) {
        mesh.visibility = 1;
    }
}