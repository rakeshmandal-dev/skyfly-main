import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";

interface DesksInstancedProps {
  onDeskSelect?: (deskIndex: number) => void;
  selectedDesk?: number | null;
}

// 5 Columns x 8 Rows = 40 Student Desks & Chairs
export const DESK_COLUMNS = [-5.2, -2.6, 0, 2.6, 5.2]; // 5 columns
export const DESK_ROWS = [-3.2, -1.2, 0.8, 2.8, 4.8, 6.8, 8.8, 10.8]; // 8 rows
export const TOTAL_DESKS = DESK_COLUMNS.length * DESK_ROWS.length; // 40

export function DesksInstanced({ onDeskSelect, selectedDesk }: DesksInstancedProps) {
  const deskTopsRef = useRef<THREE.InstancedMesh>(null);
  const deskLegsRef = useRef<THREE.InstancedMesh>(null);
  const chairSeatsRef = useRef<THREE.InstancedMesh>(null);
  const chairBacksRef = useRef<THREE.InstancedMesh>(null);
  const chairLegsRef = useRef<THREE.InstancedMesh>(null);
  const notebooksRef = useRef<THREE.InstancedMesh>(null);
  const tabletsRef = useRef<THREE.InstancedMesh>(null);

  // Pre-calculate positions and transform matrices for all 40 student stations
  const deskPositions = useMemo(() => {
    const list: { x: number; y: number; z: number; index: number; rotY: number }[] = [];
    let idx = 0;
    for (const r of DESK_ROWS) {
      for (const c of DESK_COLUMNS) {
        // Natural human micro-variation in desk alignment
        const jitterX = (Math.sin(idx * 7.1) * 0.03);
        const jitterZ = (Math.cos(idx * 4.3) * 0.03);
        const jitterRot = (Math.sin(idx * 3.7) * 0.02);
        list.push({
          x: c + jitterX,
          y: 0,
          z: r + jitterZ,
          index: idx,
          rotY: jitterRot,
        });
        idx++;
      }
    }
    return list;
  }, []);

  // Update instance transformation matrices
  useEffect(() => {
    const tempObj = new THREE.Object3D();

    deskPositions.forEach((pos, i) => {
      // 1. Desk Top Matrix (Desktop table surface)
      tempObj.position.set(pos.x, 0.74, pos.z);
      tempObj.rotation.set(0, pos.rotY, 0);
      tempObj.scale.set(1, 1, 1);
      tempObj.updateMatrix();
      deskTopsRef.current?.setMatrixAt(i, tempObj.matrix);

      // 2. Desk Metal Frame & Legs
      tempObj.position.set(pos.x, 0.37, pos.z);
      tempObj.rotation.set(0, pos.rotY, 0);
      tempObj.scale.set(1, 1, 1);
      tempObj.updateMatrix();
      deskLegsRef.current?.setMatrixAt(i, tempObj.matrix);

      // 3. Chair Seat (tucked right behind the desk at z + 0.58)
      tempObj.position.set(pos.x, 0.44, pos.z + 0.58);
      tempObj.rotation.set(0, pos.rotY + (i % 2 === 0 ? 0.03 : -0.02), 0);
      tempObj.scale.set(1, 1, 1);
      tempObj.updateMatrix();
      chairSeatsRef.current?.setMatrixAt(i, tempObj.matrix);

      // 4. Chair Backrest
      tempObj.position.set(pos.x, 0.78, pos.z + 0.78);
      tempObj.rotation.set(-0.06, pos.rotY + (i % 2 === 0 ? 0.03 : -0.02), 0);
      tempObj.scale.set(1, 1, 1);
      tempObj.updateMatrix();
      chairBacksRef.current?.setMatrixAt(i, tempObj.matrix);

      // 5. Chair Legs
      tempObj.position.set(pos.x, 0.22, pos.z + 0.58);
      tempObj.rotation.set(0, pos.rotY, 0);
      tempObj.scale.set(1, 1, 1);
      tempObj.updateMatrix();
      chairLegsRef.current?.setMatrixAt(i, tempObj.matrix);

      // 6. Student Notebook
      tempObj.position.set(pos.x - 0.25, 0.765, pos.z - 0.02);
      tempObj.rotation.set(0, pos.rotY + 0.12 * (i % 3 - 1), 0);
      tempObj.scale.set(1, 1, 1);
      tempObj.updateMatrix();
      notebooksRef.current?.setMatrixAt(i, tempObj.matrix);

      // 7. Student Digital Tablet / EduVault Pad
      tempObj.position.set(pos.x + 0.32, 0.762, pos.z - 0.03);
      tempObj.rotation.set(0, pos.rotY - 0.08, 0);
      tempObj.scale.set(1, 1, 1);
      tempObj.updateMatrix();
      tabletsRef.current?.setMatrixAt(i, tempObj.matrix);
    });

    deskTopsRef.current && (deskTopsRef.current.instanceMatrix.needsUpdate = true);
    deskLegsRef.current && (deskLegsRef.current.instanceMatrix.needsUpdate = true);
    chairSeatsRef.current && (chairSeatsRef.current.instanceMatrix.needsUpdate = true);
    chairBacksRef.current && (chairBacksRef.current.instanceMatrix.needsUpdate = true);
    chairLegsRef.current && (chairLegsRef.current.instanceMatrix.needsUpdate = true);
    notebooksRef.current && (notebooksRef.current.instanceMatrix.needsUpdate = true);
    tabletsRef.current && (tabletsRef.current.instanceMatrix.needsUpdate = true);
  }, [deskPositions]);

  // Geometries for instancing
  const deskTopGeo = useMemo(() => new THREE.BoxGeometry(1.25, 0.045, 0.65), []);
  const deskLegsGeo = useMemo(() => {
    // Combined steel frame for 1 desk (2 side frames + foot rest bar)
    const g = new THREE.BoxGeometry(1.15, 0.72, 0.55);
    return g;
  }, []);
  const chairSeatGeo = useMemo(() => new THREE.BoxGeometry(0.48, 0.04, 0.44), []);
  const chairBackGeo = useMemo(() => new THREE.BoxGeometry(0.46, 0.3, 0.035), []);
  const chairLegsGeo = useMemo(() => new THREE.CylinderGeometry(0.018, 0.018, 0.44, 8), []);
  const notebookGeo = useMemo(() => new THREE.BoxGeometry(0.26, 0.012, 0.34), []);
  const tabletGeo = useMemo(() => new THREE.BoxGeometry(0.24, 0.01, 0.3), []);

  return (
    <group>
      {/* 1. Desk Wooden Tops (Rich Teak / Oak Wood Finish) */}
      <instancedMesh
        ref={deskTopsRef}
        args={[deskTopGeo, undefined, TOTAL_DESKS]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#b07d4b"
          roughness={0.65}
          metalness={0.05}
        />
      </instancedMesh>

      {/* 2. Desk Metal Frame Structure */}
      <instancedMesh
        ref={deskLegsRef}
        args={[deskLegsGeo, undefined, TOTAL_DESKS]}
        castShadow
      >
        <meshStandardMaterial
          color="#222834"
          roughness={0.4}
          metalness={0.8}
          wireframe={false}
        />
      </instancedMesh>

      {/* 3. Chair Seats (Comfort Ergonomic Wood/Padded) */}
      <instancedMesh
        ref={chairSeatsRef}
        args={[chairSeatGeo, undefined, TOTAL_DESKS]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#9a6538"
          roughness={0.7}
          metalness={0.05}
        />
      </instancedMesh>

      {/* 4. Chair Backrests */}
      <instancedMesh
        ref={chairBacksRef}
        args={[chairBackGeo, undefined, TOTAL_DESKS]}
        castShadow
      >
        <meshStandardMaterial
          color="#9a6538"
          roughness={0.7}
          metalness={0.05}
        />
      </instancedMesh>

      {/* 5. Chair Steel Legs */}
      <instancedMesh
        ref={chairLegsRef}
        args={[chairLegsGeo, undefined, TOTAL_DESKS]}
        castShadow
      >
        <meshStandardMaterial
          color="#1e2430"
          roughness={0.4}
          metalness={0.85}
        />
      </instancedMesh>

      {/* 6. Open Notebooks on each desk */}
      <instancedMesh
        ref={notebooksRef}
        args={[notebookGeo, undefined, TOTAL_DESKS]}
      >
        <meshStandardMaterial
          color="#fdfbf7"
          roughness={0.8}
        />
      </instancedMesh>

      {/* 7. EduVault Digital Tablets on each desk */}
      <instancedMesh
        ref={tabletsRef}
        args={[tabletGeo, undefined, TOTAL_DESKS]}
      >
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.2}
          metalness={0.7}
        />
      </instancedMesh>

      {/* Interactive Clickable invisible colliders and floor marker for each student seat */}
      {deskPositions.map((pos) => {
        const isSelected = selectedDesk === pos.index;
        return (
          <group key={pos.index}>
            {/* Clickable transparent volume for desk & seat */}
            <mesh
              position={[pos.x, 0.6, pos.z + 0.2]}
              onClick={(e) => {
                e.stopPropagation();
                onDeskSelect?.(pos.index);
              }}
            >
              <boxGeometry args={[1.3, 1.1, 1.2]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Glowing Floor Seat Ring when desk is selected */}
            {isSelected && (
              <mesh position={[pos.x, 0.015, pos.z + 0.58]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.35, 0.48, 32]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#0ea5e9"
                  emissiveIntensity={2.0}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
