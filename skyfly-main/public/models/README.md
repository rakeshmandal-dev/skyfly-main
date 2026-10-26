# 3D Humanoid Teacher Model Guide (EduVault AI)

EduVault AI supports **realistic rigged GLB 3D avatars** (such as Ready Player Me, Mixamo, VRoid, or Blender humanoids) with full **visemes / facial blend shapes lip-sync** and **skeletal bone lecturing animations**.

---

## 🚀 Recommended Free & Commercial-Ready Avatars

### 1. Ready Player Me (Recommended)
- **Website**: [readyplayer.me](https://readyplayer.me)
- **License**: Free for commercial & educational use (Ready Player Me Studio Terms).
- **Features**: Includes standard ARKit & Oculus 52 facial blend shapes (Visemes) for 100% accurate mouth lip-sync, blinking, and emotion smiles.
- **Exporting Instructions**:
  1. Create or customize your professional teacher avatar on [readyplayer.me](https://readyplayer.me).
  2. Copy the `.glb` download URL with morph targets:
     ```
     https://models.readyplayer.me/<YOUR_AVATAR_ID>.glb?morphTargets=ARKit,Oculus+Visemes
     ```
  3. Save the downloaded `.glb` file as:
     - `public/models/teacher.glb`
     - `apps/web/public/models/teacher.glb`

---

### 2. Mixamo / Adobe 3D Humanoids
- **Website**: [mixamo.com](https://www.mixamo.com)
- **License**: Royalty-free for commercial use with Adobe account.
- **Standard Bones supported**: `Hips`, `Spine`, `Chest`, `Neck`, `Head`, `RightArm`, `RightForeArm`, `RightHand`, `LeftArm`, `LeftForeArm`, `LeftHand`.

---

## ⚡ Fallback Mechanism
If `teacher.glb` is not present or is loading, EduVault AI automatically displays the **high-detail stylized procedural teacher avatar** so the classroom never crashes or stays blank.
