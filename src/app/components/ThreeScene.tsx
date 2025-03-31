"use client"

import React, { useEffect } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"

const ThreeScene: React.FC = () => {
  useEffect(() => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color("#eae0d5")

    const planeGeometry = new THREE.PlaneGeometry(500, 500)
    const planeMaterial = new THREE.MeshStandardMaterial({ 
      color: 'red',
      side: THREE.DoubleSide 
    })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotation.x = -Math.PI / 2 
    plane.position.y = 0 
    scene.add(plane)

    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector("#canvas") as HTMLCanvasElement,
    })
    renderer.setPixelRatio(window.devicePixelRatio)

    const containerWidth = window.innerWidth / 2
    const containerHeight = window.innerHeight
    const aspectRatio = containerWidth / containerHeight

    const camera = new THREE.PerspectiveCamera(
      75,
      aspectRatio,
      0.1,
      1000
    )
    camera.position.z = 5

    renderer.setSize(containerWidth, containerHeight)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableZoom = false
    controls.enablePan = false
    controls.target.set(0, 0, 0)

    const ambientLight = new THREE.AmbientLight(0xffffff, 2)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 5)
    directionalLight.position.set(10, 10, 3)
    scene.add(directionalLight)

    let mixer: THREE.AnimationMixer
    const clock = new THREE.Clock()

    const fbxLoader = new FBXLoader()
    fbxLoader.load("/assets/RumbaDancing.fbx", (object) => {
      const box = new THREE.Box3().setFromObject(object)
      const center = new THREE.Vector3()
      const size = new THREE.Vector3()
      box.getCenter(center)
      box.getSize(size)
      object.position.y -= center.y
      scene.add(object)

      mixer = new THREE.AnimationMixer(object)
      if (object.animations && object.animations.length > 0) {
        const action = mixer.clipAction(object.animations[0])
        action.play()
      }

      const maxDim = Math.max(size.x, size.y, size.z)
      const fov = camera.fov * (Math.PI / 180)
      const cameraZ = maxDim / (2 * Math.tan(fov / 2))
      camera.position.set(0, 0, cameraZ * 1.5)
      camera.lookAt(0, 0, 0)

      controls.target.set(0, 0, 0)
      controls.update()
    })

    function animate() {
      requestAnimationFrame(animate)
      const delta = clock.getDelta()
      if (mixer) mixer.update(delta)
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      const newWidth = window.innerWidth / 2
      const newHeight = window.innerHeight
      const newAspectRatio = newWidth / newHeight
      
      camera.aspect = newAspectRatio
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <canvas id="canvas">Loading...</canvas>
}

export default ThreeScene
