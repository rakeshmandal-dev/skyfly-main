import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import teacherAsset from "@/assets/teacher.glb.asset.json";
export type TeacherProps = { speaking: boolean; thinking?: boolean | undefined; listening?: boolean | undefined; nodAt?: number | undefined; mouthLevel?: React.RefObject<number> | undefined };
function Human(props: TeacherProps) {
  const gltf = useGLTF(teacherAsset.url);
  const scene = useMemo(() => clone(gltf.scene), [gltf.scene]);
  const root = useRef<THREE.Group>(null);
  const rig = useMemo(() => {
    const meshes: THREE.Mesh[] = [];
    scene.traverse(o => { if (o instanceof THREE.Mesh && o.morphTargetDictionary) meshes.push(o); });
    const head = scene.getObjectByName("Head");
    return { meshes, head, initial: head?.quaternion.clone() };
  }, [scene]);
  const blink = useRef({ next: 2, start: -10 });
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    if (t > blink.current.next) { blink.current.start = t; blink.current.next = t + 2.7 + Math.random() * 3; }
    const closed = Math.max(0, 1 - Math.abs(t - blink.current.start - .09) / .09);
    // Live audio amplitude drives mouth opening; device speech uses boundary-driven level when supplied.
    const mouth = props.speaking ? (props.mouthLevel?.current ?? .25) : 0;
    const values: Record<string, number> = { eyeBlinkLeft: closed, eyeBlinkRight: closed, jawOpen: mouth * .65, viseme_aa: mouth * .55, mouthSmileLeft: props.thinking ? .06 : .18, mouthSmileRight: props.thinking ? .06 : .18, browInnerUp: props.thinking ? .2 : props.listening ? .12 : .02, eyeLookOutLeft: Math.max(0, Math.sin(t * .45)) * .12, eyeLookInRight: Math.max(0, Math.sin(t * .45)) * .12 };
    for (const mesh of rig.meshes) for (const [key, target] of Object.entries(values)) {
      const index = mesh.morphTargetDictionary?.[key];
      if (index !== undefined && mesh.morphTargetInfluences) mesh.morphTargetInfluences[index] = THREE.MathUtils.damp(mesh.morphTargetInfluences[index] ?? 0, target, 20, delta);
    }
    if (rig.head && rig.initial) {
      rig.head.quaternion.copy(rig.initial);
      const nod = props.nodAt && (Date.now() - props.nodAt) < 1500 ? Math.sin((Date.now() - props.nodAt) / 200) * .045 : 0;
      rig.head.rotateX(Math.sin(t * .7) * .012 + nod); rig.head.rotateY(Math.sin(t * .38) * .035); rig.head.rotateZ(props.thinking ? .035 : Math.sin(t * .4) * .012);
    }
    if (root.current) root.current.position.y = -1.13 + Math.sin(t * 1.7) * .002;
  });
  return <group ref={root} position={[0, -1.13, 0]}><primitive object={scene} /></group>;
}
export function HumanTeacher(props: TeacherProps) {
  return <Canvas camera={{ position: [0, .46, 1.4], fov: 29 }} onCreated={({ camera }) => { camera.lookAt(0, .46, 0); }} dpr={[1, 1.5]} gl={{ antialias: true }}><color attach="background" args={["#101826"]} /><ambientLight intensity={1.7} /><directionalLight position={[2, 3, 3]} intensity={3} /><directionalLight position={[-2, 1, 2]} intensity={1.5} /><Suspense fallback={null}><Human {...props} /></Suspense></Canvas>;
}
