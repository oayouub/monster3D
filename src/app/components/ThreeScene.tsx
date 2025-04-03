"use client"

import React, { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { TextureLoader } from "three"
import { ExposureShader } from "three/examples/jsm/Addons.js"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js"
import { GlitchPass } from "three/examples/jsm/postprocessing/GlitchPass.js"

export type AnimationDirection = "idle" | "left" | "up" | "down" | "right" | "miss"

interface ThreeSceneProps {
  currentAnimation: AnimationDirection
  onLoaded?: () => void
}

const ThreeScene: React.FC<ThreeSceneProps> = ({ currentAnimation, onLoaded }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const composerRef = useRef<EffectComposer | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const fbxLoaderRef = useRef(new FBXLoader())
  const glitchPassRef = useRef<GlitchPass | null>(null)

  const modelsRef = useRef<{ [key in AnimationDirection]?: THREE.Group }>({})
  const mixersMapRef = useRef<{ [key in AnimationDirection]?: THREE.AnimationMixer }>({})

  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [isPlayingSequence, setIsPlayingSequence] = useState(false)
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0)

  const animationSequence: AnimationDirection[] = ["left", "up", "down", "right", "miss", "idle"]

  useEffect(() => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color("#eae0d5")
    sceneRef.current = scene

    const canvas = canvasRef.current!
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer

    const containerWidth = window.innerWidth
    const containerHeight = window.innerHeight
    const aspectRatio = containerWidth / containerHeight
    const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000)
    camera.position.set(0, 7, 10)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

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
    const groundTexture = textureLoader.load("/assets/cartooneGround.png")
    groundTexture.colorSpace = THREE.SRGBColorSpace
    groundTexture.wrapS = THREE.RepeatWrapping
    groundTexture.wrapT = THREE.RepeatWrapping
    groundTexture.repeat.set(8, 8)
    const wallTexture = textureLoader.load("/assets/wall.png")
    wallTexture.colorSpace = THREE.SRGBColorSpace
    wallTexture.wrapS = THREE.ClampToEdgeWrapping
    wallTexture.wrapT = THREE.ClampToEdgeWrapping

    const wallGeometry = new THREE.PlaneGeometry(1500, 700)
    const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture, side: THREE.DoubleSide })
    const wall = new THREE.Mesh(wallGeometry, wallMaterial)
    wall.position.set(0, 0, -250)
    wall.receiveShadow = true
    scene.add(wall)

    const planeGeometry = new THREE.PlaneGeometry(1500, 500)
    const planeMaterial = new THREE.MeshStandardMaterial({
      map: groundTexture,
      side: THREE.DoubleSide,
      roughness: 0.8,
      metalness: 0.1,
    })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotation.x = -Math.PI / 2
    plane.position.y = -90
    plane.receiveShadow = true
    scene.add(plane)

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x8d6e63, 5)
    scene.add(hemisphereLight)

    // Configuration du composer et des passes de post-traitement
    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)
    const shader = new ShaderPass(ExposureShader)
    composer.addPass(shader)

    // Création du GlitchPass, désactivé par défaut
    const glitchPass = new GlitchPass()
    glitchPass.enabled = false
    glitchPassRef.current = glitchPass
    composer.addPass(glitchPass)

    composerRef.current = composer

    const clock = new THREE.Clock()
    const animate = () => {
      requestAnimationFrame(animate)
      if (mixerRef.current) {
        const delta = clock.getDelta()
        mixerRef.current.update(delta)
      }
      composer.render()
    }
    animate()

    const handleResize = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight
      const newAspectRatio = newWidth / newHeight
      if (cameraRef.current) {
        cameraRef.current.aspect = newAspectRatio
        cameraRef.current.updateProjectionMatrix()
      }
      renderer.setSize(newWidth, newHeight)
      composer.setSize(newWidth, newHeight)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (!sceneRef.current) return

    const modelMapping: { [key in AnimationDirection]: string } = {
      idle: "/assets/idleBoy.fbx",
      left: "/assets/leftAnimation.fbx",
      up: "/assets/upAnimation.fbx",
      down: "/assets/downAnimation.fbx",
      right: "/assets/rightAnimation.fbx",
      miss: "/assets/falling.fbx",
    }

    const loadModel = (direction: AnimationDirection, filePath: string) => {
      return new Promise<{ direction: AnimationDirection; object: THREE.Group }>((resolve, reject) => {
        fbxLoaderRef.current.load(
          filePath,
          (object) => {
            const box = new THREE.Box3().setFromObject(object)
            const center = new THREE.Vector3()
            box.getCenter(center)
            object.position.y -= center.y
            object.position.x = 150
            object.rotation.y = -Math.PI / 4
            object.visible = false

            object.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true
                child.receiveShadow = true
                const material = child.material as THREE.MeshStandardMaterial | THREE.MeshPhongMaterial
                if (material.map) material.map.colorSpace = THREE.SRGBColorSpace
              }
            })

            resolve({ direction, object })
          },
          undefined,
          (error) => {
            console.error("Erreur de chargement pour", filePath, error)
            reject(error)
          }
        )
      })
    }

    const loadAllModels = async () => {
      try {
        const entries = Object.entries(modelMapping) as [AnimationDirection, string][]
        const models = await Promise.all(entries.map(([direction, path]) => loadModel(direction, path)))
        models.forEach(({ direction, object }) => {
          sceneRef.current!.add(object)
          modelsRef.current[direction] = object

          const mixer = new THREE.AnimationMixer(object)
          mixersMapRef.current[direction] = mixer

          if (object.animations && object.animations.length > 0) {
            const action = mixer.clipAction(object.animations[0])
            if (direction === "miss") {
              action.setLoop(THREE.LoopOnce, 1)
              action.clampWhenFinished = true
            } else {
              action.play()
            }
          }
          if (direction === "miss") {
            mixerRef.current = mixer
          }
        })
        setModelsLoaded(true)
      } catch (error) {
        console.error("Erreur lors du chargement des modèles", error)
      }
    }
    loadAllModels()
  }, [])

  useEffect(() => {
    if (modelsLoaded && !isPlayingSequence) {
      setIsPlayingSequence(true)
      setCurrentSequenceIndex(0)
    }
  }, [modelsLoaded])

  useEffect(() => {
    if (isPlayingSequence && modelsLoaded) {
      const currentDirection = animationSequence[currentSequenceIndex]
      
      Object.keys(modelsRef.current).forEach((key) => {
        const direction = key as AnimationDirection
        const model = modelsRef.current[direction]
        if (model) {
          model.visible = direction === currentDirection
        }
      })

      mixerRef.current = mixersMapRef.current[currentDirection] || null

      if (currentDirection === "miss") {
        const mixer = mixersMapRef.current["miss"]
        const missModel = modelsRef.current["miss"]
        if (mixer && missModel && missModel.animations && missModel.animations.length > 0) {
          const action = mixer.clipAction(missModel.animations[0])
          action.reset()
          action.play()
        }
      }

      const activeModel = modelsRef.current[currentDirection]
      if (activeModel && cameraRef.current) {
        const size = new THREE.Vector3()
        new THREE.Box3().setFromObject(activeModel).getSize(size)
        const maxDim = Math.max(size.x, size.y, size.z)
        const fov = cameraRef.current.fov * (Math.PI / 180)
        const cameraZ = maxDim / (2 * Math.tan(fov / 2))
        cameraRef.current.position.set(0, 0, cameraZ * 1.5)
        cameraRef.current.lookAt(0, 0, 0)
      }

      const timer = setTimeout(() => {
        if (currentSequenceIndex < animationSequence.length - 1) {
          setCurrentSequenceIndex(prev => prev + 1)
        } else {
          setIsPlayingSequence(false)
        }
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [isPlayingSequence, currentSequenceIndex, modelsLoaded])

  useEffect(() => {
    if (!isPlayingSequence && modelsLoaded) {
      Object.keys(modelsRef.current).forEach((key) => {
        const direction = key as AnimationDirection
        const model = modelsRef.current[direction]
        if (model) {
          model.visible = direction === currentAnimation
        }
      })

      mixerRef.current = mixersMapRef.current[currentAnimation] || null

      if (currentAnimation === "miss") {
        const mixer = mixersMapRef.current["miss"]
        const missModel = modelsRef.current["miss"]
        if (mixer && missModel && missModel.animations && missModel.animations.length > 0) {
          const action = mixer.clipAction(missModel.animations[0])
          action.reset()
          action.play()
        }
      }

      const activeModel = modelsRef.current[currentAnimation]
      if (activeModel && cameraRef.current) {
        const size = new THREE.Vector3()
        new THREE.Box3().setFromObject(activeModel).getSize(size)
        const maxDim = Math.max(size.x, size.y, size.z)
        const fov = cameraRef.current.fov * (Math.PI / 180)
        const cameraZ = maxDim / (2 * Math.tan(fov / 2))
        cameraRef.current.position.set(0, 0, cameraZ * 1.5)
        cameraRef.current.lookAt(0, 0, 0)
      }
    }
  }, [currentAnimation, modelsLoaded, isPlayingSequence])

  // Activation de l'effet glitch uniquement lorsque currentAnimation est "miss"
  useEffect(() => {
    if (glitchPassRef.current) {
      if (currentAnimation === "miss") {
        glitchPassRef.current.enabled = true
        glitchPassRef.current.goWild = true
        setTimeout(() => {
          if (glitchPassRef.current) {
            glitchPassRef.current.enabled = false
            glitchPassRef.current.goWild = false
          }
        }, 500) // Durée de l'effet glitch
      } else {
        glitchPassRef.current.enabled = false
        glitchPassRef.current.goWild = false
      }
    }
  }, [currentAnimation])

  useEffect(() => {
    if (modelsLoaded && onLoaded) {
      onLoaded()
    }
  }, [modelsLoaded, onLoaded])

  return (
    <>
      {(!modelsLoaded || isPlayingSequence) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            fontSize: "5rem",
            color: "yellow",
            backgroundImage: "url('/assets/loading.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          Loading
        </div>
      )}
      <canvas 
        id="canvas" 
        ref={canvasRef} 
        style={{ display: (modelsLoaded && !isPlayingSequence) ? "block" : "none" }} 
      />
    </>
  )
}

export default ThreeScene
