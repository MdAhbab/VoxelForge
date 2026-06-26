// VoxelForge — WebGL viewport (Three.js / R3F).
//
// Memory & on-device discipline (this is the heavy path, kept deliberately lean):
//  • frameloop="demand" by default — the GPU is idle unless something actually
//    animates (auto-rotate, an in-progress print, or user orbit). No always-on RAF.
//  • DPR capped at 2; one context per canvas; geometry disposed on change/unmount.
//  • Theme colours resolved once per theme (passed in as plain hex), never per frame.
//  • Mounted lazily and only when scrolled into view (see Viewport3D wrapper).
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import { type Mesh, meshTris, decimate, cross, sub, norm, type Vec3 } from "../../lib/geometry";
import type { ViewMode } from "./Viewport3D";

export interface ForgeColors {
  base: string; danger: string; warn: string; inkDim: string;
  signal: string; blueprint: string; grid: string;
}

export interface ForgeViewportProps {
  mesh: Mesh;
  mode?: ViewMode;
  tint?: string;
  heatmap?: boolean;
  flaggedTags?: string[];
  showOverhangs?: boolean;
  printProgress?: number;
  autoRotate?: boolean;
  interactive?: boolean;
  colors: ForgeColors;
  active: boolean; // false when off-screen — stop rendering entirely
}

/** Build a non-indexed BufferGeometry from the part's triangles, with optional
 *  per-vertex heatmap colours. Decimated so huge uploads stay smooth. */
function buildGeometry(
  mesh: Mesh, heatmap: boolean, flaggedTags: string[], showOverhangs: boolean, colors: ForgeColors,
): THREE.BufferGeometry {
  const tris = decimate(meshTris(mesh));
  const positions = new Float32Array(tris.length * 9);
  const cols = heatmap ? new Float32Array(tris.length * 9) : null;

  const cDanger = new THREE.Color(colors.danger);
  const cWarn = new THREE.Color(colors.warn);
  const cBase = new THREE.Color(colors.inkDim);

  for (let i = 0; i < tris.length; i++) {
    const t = tris[i];
    const verts = [t.a, t.b, t.c];
    for (let v = 0; v < 3; v++) {
      const o = i * 9 + v * 3;
      positions[o] = verts[v][0]; positions[o + 1] = verts[v][1]; positions[o + 2] = verts[v][2];
    }
    if (cols) {
      const n = norm(cross(sub(t.b, t.a), sub(t.c, t.a)) as Vec3);
      const thin = flaggedTags.includes(t.tag);
      const overhang = showOverhangs && n[1] < -0.35;
      const c = thin ? cDanger : overhang ? cWarn : cBase;
      for (let v = 0; v < 3; v++) {
        const o = i * 9 + v * 3;
        cols[o] = c.r; cols[o + 1] = c.g; cols[o + 2] = c.b;
      }
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  if (cols) g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  // Centre on the bounding-box origin so every part (catalog parts extend
  // asymmetrically in Z/Y) frames consistently and spins about its true centre.
  g.center();
  g.computeVertexNormals();
  return g;
}

function Part({
  mesh, mode = "solid", tint, heatmap = false, flaggedTags = [], showOverhangs = false,
  printProgress, colors,
}: Omit<ForgeViewportProps, "active" | "autoRotate" | "interactive">) {
  const geom = useMemo(
    () => buildGeometry(mesh, heatmap, flaggedTags, showOverhangs, colors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mesh, heatmap, flaggedTags.join(","), showOverhangs, colors],
  );
  useEffect(() => () => geom.dispose(), [geom]);

  // Layer-reveal clipping plane in the build (Y) direction: keep y <= clipY.
  const clip = useMemo(() => {
    if (printProgress == null) return null;
    const clipY = -mesh.bbox[1] / 2 + printProgress * mesh.bbox[1];
    return [new THREE.Plane(new THREE.Vector3(0, -1, 0), clipY)];
  }, [printProgress, mesh.bbox]);

  const material = useMemo(() => {
    const base = tint ?? colors.inkDim;
    if (mode === "wireframe") {
      return new THREE.MeshBasicMaterial({ color: colors.blueprint, wireframe: true, clippingPlanes: clip ?? undefined });
    }
    if (mode === "xray") {
      return new THREE.MeshStandardMaterial({
        color: base, transparent: true, opacity: 0.16, depthWrite: false,
        emissive: new THREE.Color(colors.signal), emissiveIntensity: 0.25,
        roughness: 0.6, metalness: 0.1, clippingPlanes: clip ?? undefined,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: heatmap ? 0xffffff : base, vertexColors: heatmap,
      roughness: 0.52, metalness: 0.12, clippingPlanes: clip ?? undefined,
    });
  }, [mode, tint, heatmap, colors, clip]);
  useEffect(() => () => material.dispose(), [material]);

  const printY = printProgress != null && printProgress < 0.999
    ? -mesh.bbox[1] / 2 + printProgress * mesh.bbox[1] : null;
  const span = Math.max(mesh.bbox[0], mesh.bbox[1], mesh.bbox[2]);

  return (
    <group>
      <mesh geometry={geom} material={material} castShadow />
      {mode === "solid" && !heatmap && (
        // subtle edge overlay for the "technical drawing" feel
        <lineSegments>
          <edgesGeometry args={[geom, 35]} />
          <lineBasicMaterial color={colors.grid} transparent opacity={0.35} clippingPlanes={clip ?? undefined} />
        </lineSegments>
      )}
      {printY != null && (
        // print-head sweep: a thin glowing layer plane at the current build height
        <mesh position={[0, printY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[span * 1.4, span * 1.4]} />
          <meshBasicMaterial color={colors.signal} transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

/** Turntable: spins its children around Y in world space, frame-rate independent.
 *  Decoupled from OrbitControls so it works even when controls are disabled
 *  (the hero / showcase viewports are non-interactive). */
function Turntable({ spin, children }: { spin: boolean; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (spin && ref.current) ref.current.rotation.y += Math.min(delta, 0.05) * 0.45;
  });
  return <group ref={ref}>{children}</group>;
}

const VIEW_DIR = new THREE.Vector3(1.15, 0.9, 1.7).normalize();
const FOV = 35;

/** Distance at which a bounding sphere of `radius` fits inside the FOV for a
 *  given canvas aspect ratio — fits portrait (mobile) and landscape alike. */
function fitDistance(radius: number, aspect: number) {
  const vFov = (FOV * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  return (radius / Math.sin(Math.min(vFov, hFov) / 2)) * 1.15;
}

function Rig({ interactive, radius }: { interactive: boolean; radius: number }) {
  const { camera, size } = useThree();
  const controls = useRef<any>(null);
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const dist = fitDistance(radius, size.width / Math.max(1, size.height));
    cam.position.copy(VIEW_DIR.clone().multiplyScalar(dist));
    cam.near = Math.max(0.1, dist / 100);
    cam.far = dist * 10;
    cam.updateProjectionMatrix();
    // Re-sync OrbitControls to the repositioned camera (it caches spherical coords
    // from the camera's position at mount, so without this it snaps back).
    if (controls.current) { controls.current.target.set(0, 0, 0); controls.current.update(); }
    else cam.lookAt(0, 0, 0);
  }, [camera, size.width, size.height, radius]);
  // OrbitControls handles only manual orbit; the part's own spin is the Turntable.
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={interactive}
      enablePan={false}
      enableZoom={interactive}
      enableDamping
      minDistance={radius * 1.4}
      maxDistance={radius * 6}
      target={[0, 0, 0]}
    />
  );
}

export default function ForgeViewport(props: ForgeViewportProps) {
  const {
    mesh, autoRotate = false, interactive = true, printProgress, active, colors,
  } = props;
  const span = Math.max(mesh.bbox[0], mesh.bbox[1], mesh.bbox[2]) || 1;
  const radius = 0.5 * Math.hypot(mesh.bbox[0], mesh.bbox[1], mesh.bbox[2]) || 1;
  const animating = active && (autoRotate || printProgress != null);
  const dirLight = useRef<THREE.DirectionalLight>(null);
  // Sensible initial camera position (landscape assumption) so OrbitControls
  // initialises from the right distance; the Rig effect refines it per aspect.
  const initialPos = VIEW_DIR.clone().multiplyScalar(fitDistance(radius, 1.4)).toArray() as [number, number, number];

  return (
    <Canvas
      frameloop={!active ? "never" : animating ? "always" : "demand"}
      dpr={[1, 2]}
      camera={{ fov: FOV, position: initialPos, near: 0.1, far: span * 12 }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
      onCreated={({ gl }) => { gl.localClippingEnabled = true; }}
      style={{ width: "100%", height: "100%", display: "block", cursor: interactive ? "grab" : "default" }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight ref={dirLight} position={[span, span * 1.6, span * 0.8]} intensity={1.4} />
      <directionalLight position={[-span, span * 0.4, -span]} intensity={0.4} color={colors.blueprint} />
      <Grid
        args={[span * 4, span * 4]}
        position={[0, -mesh.bbox[1] / 2 - 0.5, 0]}
        cellSize={span / 8}
        sectionSize={span / 2}
        cellColor={colors.grid}
        sectionColor={colors.blueprint}
        fadeDistance={span * 6}
        fadeStrength={1.5}
        infiniteGrid={false}
      />
      <Turntable spin={!!autoRotate && active}>
        <Part
          mesh={mesh}
          mode={props.mode}
          tint={props.tint}
          heatmap={props.heatmap}
          flaggedTags={props.flaggedTags}
          showOverhangs={props.showOverhangs}
          printProgress={printProgress}
          colors={colors}
        />
      </Turntable>
      <Rig interactive={interactive} radius={radius} />
    </Canvas>
  );
}
