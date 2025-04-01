"use client"

import React, { useEffect } from "react"
import * as THREE from "three"
import { TextureLoader } from 'three'
import { ExposureShader } from "three/examples/jsm/Addons.js"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js"

const ThreeScene: React.FC = () => {
  useEffect(() => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color("#eae0d5")

    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector("#canvas") as HTMLCanvasElement,
      antialias: true
    })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const containerWidth = window.innerWidth
    const containerHeight = window.innerHeight
    const aspectRatio = containerWidth / containerHeight

    const camera = new THREE.PerspectiveCamera(
      75,
      aspectRatio,
      0.1,
      1000
    )
    camera.position.set(0, 7, 10)
    camera.lookAt(0, 0, 0)

    renderer.setSize(containerWidth, containerHeight)

    const ambientLight = new THREE.AmbientLight(0xffffff, 1)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 8)
    directionalLight.position.set(40, 50, 40)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 4096
    directionalLight.shadow.mapSize.height = 4096
    directionalLight.shadow.camera.near = 0.1
    directionalLight.shadow.camera.far = 500
    directionalLight.shadow.camera.left = -250
    directionalLight.shadow.camera.right = 250
    directionalLight.shadow.camera.top = 250
    directionalLight.shadow.camera.bottom = -250
    directionalLight.shadow.bias = -0.0001
    scene.add(directionalLight)

    const textureLoader = new TextureLoader()
    const groundTexture = textureLoader.load('/assets/asphalt_road_3.jpg')
    groundTexture.colorSpace = THREE.SRGBColorSpace
    const wallTexture = textureLoader.load('/assets/wall.png') 
    wallTexture.colorSpace = THREE.SRGBColorSpace

    groundTexture.wrapS = THREE.RepeatWrapping
    groundTexture.wrapT = THREE.RepeatWrapping
    groundTexture.repeat.set(4, 4)

    wallTexture.wrapS = THREE.ClampToEdgeWrapping
    wallTexture.wrapT = THREE.ClampToEdgeWrapping

    const wallGeometry = new THREE.PlaneGeometry(1500, 700)
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      map: wallTexture,
      side: THREE.DoubleSide,
    })
    const wall = new THREE.Mesh(wallGeometry, wallMaterial)
    wall.position.set(0, 0, -250) 
    wall.receiveShadow = true
    scene.add(wall)

    const planeGeometry = new THREE.PlaneGeometry(1000, 500)
    const planeMaterial = new THREE.MeshStandardMaterial({ 
      map: groundTexture, 
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1
    })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotation.x = -Math.PI / 2
    plane.position.y = -90
    plane.receiveShadow = true
    scene.add(plane)

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x8d6e63, 5)
    scene.add(hemisphereLight)

    let mixer: THREE.AnimationMixer
    const clock = new THREE.Clock()

    const fbxLoader = new FBXLoader()
    fbxLoader.load("/assets/idleBoy.fbx", (object) => {
      const box = new THREE.Box3().setFromObject(object)
      const center = new THREE.Vector3()
      const size = new THREE.Vector3()
      box.getCenter(center)
      box.getSize(size)
      object.position.y -= center.y
      object.position.x = 150
      object.rotation.y = Math.PI / -4
    
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
    
          const material = child.material as THREE.MeshStandardMaterial | THREE.MeshPhongMaterial
          if (material.map) {
            material.map.colorSpace = THREE.SRGBColorSpace
          }
        }
      })
    
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
    })

    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    const shader = new ShaderPass(ExposureShader)
    composer.addPass(shader)

    function animate() {
      requestAnimationFrame(animate)
      
      if (mixer) {
        const delta = clock.getDelta()
        mixer.update(delta)
      }
      
      composer.render()
    }
    animate()

    const handleResize = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight
      const newAspectRatio = newWidth / newHeight
      
      camera.aspect = newAspectRatio
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
      composer.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <canvas id="canvas">Loading...</canvas>
}

export default ThreeScene
