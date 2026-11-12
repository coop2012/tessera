// Browser bundle: CAD worker client + three.js viewer + export packaging.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import JSZip from "jszip";

async function loadWasm(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load the CAD kernel (${res.status}).`);
  const total = +res.headers.get("content-length") || 7205596;
  const reader = res.body.getReader();
  let got = 0;
  const counted = new ReadableStream({
    async pull(ctl) {
      const { done, value } = await reader.read();
      if (done) { ctl.close(); return; }
      got += value.byteLength;
      onProgress?.(Math.min(1, got / total));
      ctl.enqueue(value);
    },
  });
  return new Uint8Array(await new Response(counted.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
}

/** Runs CAD in a worker. A build that runs past the time limit is killed and the kernel restarted. */
class Engine {
  constructor(workerUrl, wasm) { this.url = workerUrl; this.wasm = wasm; this.seq = 0; this.pending = new Map(); }
  async start() {
    this.worker?.terminate();
    this.worker = new Worker(this.url, { type: "module" });
    this.worker.onmessage = ({ data }) => {
      const p = this.pending.get(data.id); if (!p) return;
      this.pending.delete(data.id); clearTimeout(p.timer);
      data.ok ? p.resolve(data.result) : p.reject(new Error(data.error));
    };
    this.worker.onerror = (e) => { for (const p of this.pending.values()) p.reject(new Error(e.message || "CAD worker crashed")); this.pending.clear(); };
    this.ready = this.call("init", { wasm: this.wasm.slice(0) }, 120000);
    return this.ready;
  }
  call(type, payload = {}, timeout = 90000) {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        this.pending.delete(id);
        reject(new Error(`Build took longer than ${timeout / 1000} s and was stopped. Simplify the geometry: fewer boolean operations, fewer fillets.`));
        await this.start(); // fresh kernel for the next build
      }, timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.worker.postMessage({ id, type, ...payload });
    });
  }
  async run(code, params) { await this.ready; return this.call("run", { code, params }); }
  async exportFiles() { await this.ready; return this.call("export", {}, 120000); }
}

const VIEWS = {
  iso: [0.55, -0.7, 0.48], front: [0.12, -1, 0.32], side: [1, 0.12, 0.32], top: [0.001, -0.001, 1],
  back: [-0.6, 0.7, 0.42], low: [-0.7, -0.6, -0.25],
};

class Viewer {
  constructor(el) {
    this.el = el;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.5, 10000);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(160, -200, 140);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x404858, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(200, -150, 300); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.7); rim.position.set(-220, 200, 120); this.scene.add(rim);
    this.group = new THREE.Group(); this.scene.add(this.group);
    this.edges = true; this.meshes = [];
    new ResizeObserver(() => this.resize()).observe(el);
    this.resize();
    const tick = () => { this.controls.update(); this.renderer.render(this.scene, this.camera); requestAnimationFrame(tick); };
    tick();
  }
  resize() {
    const w = this.el.clientWidth || 1, h = this.el.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    Object.assign(this.renderer.domElement.style, { width: "100%", height: "100%" });
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  setTheme(dark) { this.gridColor = dark ? 0x353c45 : 0xcfd5dc; this.grid?.material.color.setHex(this.gridColor); }
  show(meshes, visibility = {}) {
    for (const c of [...this.group.children]) { c.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); }); this.group.remove(c); }
    const box = new THREE.Box3();
    this.meshes = [];
    for (const m of meshes) {
      let geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(m.vertices, 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(m.normals, 3));
      geo.setIndex(new THREE.BufferAttribute(m.triangles, 1));
      const mat = new THREE.MeshPhysicalMaterial({
        color: m.color, metalness: 0, roughness: 0.55, clearcoat: 0.15,
        transparent: m.reference, opacity: m.reference ? 0.5 : 1, depthWrite: !m.reference,
        polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = m.name;
      const edgeGeo = new THREE.EdgesGeometry(mergeVertices(geo.clone().deleteAttribute("normal")), 28);
      const lines = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.3 }));
      lines.visible = this.edges;
      mesh.add(lines);
      mesh.visible = visibility[m.name] !== false;
      this.group.add(mesh); this.meshes.push(mesh);
      geo.computeBoundingBox(); box.union(geo.boundingBox);
    }
    if (this.grid) { this.scene.remove(this.grid); this.grid.geometry.dispose(); }
    if (!box.isEmpty()) {
      const size = box.getSize(new THREE.Vector3());
      const g = Math.ceil((Math.max(size.x, size.y, size.z, 10) * 2) / 10) * 10;
      this.grid = new THREE.GridHelper(g, g / 10, this.gridColor ?? 0xcfd5dc, this.gridColor ?? 0xcfd5dc);
      this.grid.rotation.x = Math.PI / 2; this.grid.position.z = box.min.z - 0.01;
      this.scene.add(this.grid);
      this.lastBox = box;
      if (!this.framed) this.frame(box);
    }
  }
  placeCamera(dir, box = this.lastBox, aspect = this.camera.aspect) {
    const c = box.getCenter(new THREE.Vector3());
    const r = box.getSize(new THREE.Vector3()).length() / 2 || 50;
    const dist = ((r / Math.sin((this.camera.fov * Math.PI) / 360)) * 1.08) / Math.min(1, aspect);
    this.camera.position.copy(c).addScaledVector(new THREE.Vector3(...dir).normalize(), dist);
    this.controls.target.copy(c);
    this.camera.near = dist / 100; this.camera.far = dist * 20; this.camera.updateProjectionMatrix();
    this.camera.lookAt(c);
  }
  frame(box = this.lastBox) { if (!box) return; this.placeCamera(VIEWS.iso, box); this.framed = true; }
  setVisible(name, v) { const m = this.meshes.find((x) => x.name === name); if (m) m.visible = v; }
  setEdges(v) { this.edges = v; this.meshes.forEach((m) => { m.children[0].visible = v; }); }
  /** Render named views to PNG blobs (used for Claude's visual review). */
  async views(names = ["iso", "back", "front", "side", "top"], px = 640) {
    if (!this.lastBox) return [];
    const saved = { pos: this.camera.position.clone(), target: this.controls.target.clone(), aspect: this.camera.aspect, near: this.camera.near, far: this.camera.far };
    const size = this.renderer.getSize(new THREE.Vector2()), ratio = this.renderer.getPixelRatio();
    this.renderer.setPixelRatio(1); this.renderer.setSize(px, px, false);
    this.camera.aspect = 1;
    const edges = this.edges; this.setEdges(true);
    const out = [];
    for (const n of names) {
      this.placeCamera(VIEWS[n], this.lastBox, 1);
      this.renderer.render(this.scene, this.camera);
      out.push(await new Promise((res) => this.renderer.domElement.toBlob(res, "image/png")));
    }
    this.setEdges(edges);
    this.renderer.setPixelRatio(ratio); this.renderer.setSize(size.x, size.y, false);
    Object.assign(this.renderer.domElement.style, { width: "100%", height: "100%" });
    this.camera.aspect = saved.aspect; this.camera.position.copy(saved.pos); this.controls.target.copy(saved.target);
    this.camera.near = saved.near; this.camera.far = saved.far; this.camera.updateProjectionMatrix();
    return out;
  }
  async glb() {
    const clone = this.group.clone(true);
    const strip = []; clone.traverse((o) => { if (o.isLineSegments) strip.push(o); }); strip.forEach((o) => o.parent.remove(o));
    clone.rotation.x = -Math.PI / 2; clone.scale.setScalar(0.001); // Z-up mm -> Y-up m
    const scene = new THREE.Scene(); scene.add(clone);
    return new GLTFExporter().parseAsync(scene, { binary: true });
  }
}

async function buildZip({ engine, code, cadquery, notes, slug, viewer }) {
  const zip = new JSZip();
  const { stls, step } = await engine.exportFiles();
  for (const s of stls) zip.file(`stl/${s.name}.stl`, s.buf);
  zip.file(`${slug}.step`, step);
  zip.file(`${slug}.glb`, await viewer.glb());
  zip.file(`source/${slug}.replicad.js`, code);
  if (cadquery) zip.file(`source/${slug}.cadquery.py`, cadquery);
  zip.file("README.md", notes);
  return zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

window.CAD = { loadWasm, Engine, Viewer, buildZip, THREE };
