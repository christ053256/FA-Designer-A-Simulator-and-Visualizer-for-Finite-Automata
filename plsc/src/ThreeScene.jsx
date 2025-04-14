import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './ThreeScene.css';

// HelpModal Component
const HelpModal = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Language Rules Information</h2>
        <p>
          This modal explains the rules for identifiers recognized by the DFA:
        </p>
        <p>
          <strong>Language:</strong> Variable names that start with a letter or underscore, followed by letters, digits, and underscores.
        </p>
        <br />
        <ul>
          <li>
            The first character must be a letter (a–z or A–Z) or an underscore (_).
          </li>
          <li>
            All subsequent characters may be letters, digits (0–9), or underscores.
          </li>
          <li>
            Any input string not following these rules is rejected.
          </li>
        </ul>
        <footer>
          <p>Built by Isiderio, Christian A. 📌</p>
        </footer>
        <button className="close-button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const ThreeScene = () => {
  const canvasRef = useRef(null);
  const [inputString, setInputString] = useState('');
  const [currentState, setCurrentState] = useState('q0');
  const [isAccepted, setIsAccepted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentChar, setCurrentChar] = useState('');
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [animationFrameId, setAnimationFrameId] = useState(null);
  const [arrows, setArrows] = useState({});
  const [sceneObjects, setSceneObjects] = useState({});
  const [isHelpOpen, setIsHelpOpen] = useState(false); // For modal toggle

  // DFA Transition function
  const transition = (state, input) => {
    if (state === 'q0') {
      // From initial state
      if ((input >= 'a' && input <= 'z') || 
          (input >= 'A' && input <= 'Z') || 
          input === '_') {
        return 'q1'; // Accept if first char is letter or underscore
      } else {
        return 'q2'; // Reject state
      }
    } else if (state === 'q1') {
      // Already in accept state
      if ((input >= 'a' && input <= 'z') || 
          (input >= 'A' && input <= 'Z') || 
          (input >= '0' && input <= '9') || 
          input === '_') {
        return 'q1'; // Stay in accept state
      } else {
        return 'q2'; // Reject state
      }
    } else {
      // Once in reject state, stay there
      return 'q2';
    }
  };

  // Get transition name for arrow mapping
  const getTransitionKey = (fromState, toState, input) => {
    if (fromState === 'q0' && toState === 'q1') {
      return 'q0-q1';
    } else if (fromState === 'q0' && toState === 'q2') {
      return 'q0-q2';
    } else if (fromState === 'q1' && toState === 'q1') {
      return 'q1-q1';
    } else if (fromState === 'q1' && toState === 'q2') {
      return 'q1-q2';
    } else if (fromState === 'q2' && toState === 'q2') {
      return 'q2-q2';
    }
    return input[input.length];
  };

  // Process input string through DFA with animation
  const processInputStep = async () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setCurrentState('q0'); // Reset to initial state
    setCurrentIndex(-1);
    setCurrentChar('');
    setIsAccepted(true);
    
    // Reset arrow colors
    Object.keys(arrows).forEach(key => {
      const arrow = arrows[key];
      if (arrow && arrow.material) {
        arrow.material.color.set(arrow.originalColor);
      }
      if (arrow && arrow.head && arrow.head.material) {
        arrow.head.material.color.set(arrow.originalColor);
      }
    });
    
    if (inputString.length === 0) {
      setIsAccepted(false);
      setIsAnimating(false);
      return;
    }
    
    let state = 'q0';
    
    // Process each character with delay
    for (let i = 0; i < inputString.length; i++) {
      const char = inputString[i];
      const nextState = transition(state, char);
      
      // Update UI
      setCurrentIndex(i);
      setCurrentChar(char);
      
      // Get the transition key and highlight the arrow
      const transitionKey = getTransitionKey(state, nextState, char);
      
      // Highlight the current arrow
      if (arrows[transitionKey]) {
        // Flash the arrow
        if (arrows[transitionKey].material) {
          arrows[transitionKey].material.color.set(0xffff00); // Yellow highlight
        }
        if (arrows[transitionKey].head && arrows[transitionKey].head.material) {
          arrows[transitionKey].head.material.color.set(0xffff00);
        }
        
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Reset this arrow color
        if (arrows[transitionKey].material) {
          arrows[transitionKey].material.color.set(arrows[transitionKey].originalColor);
        }
        if (arrows[transitionKey].head && arrows[transitionKey].head.material) {
          arrows[transitionKey].head.material.color.set(arrows[transitionKey].originalColor);
        }
      }
      
      state = nextState;
      setCurrentState(state);
      
      // Wait between transitions
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Final state
    setIsAccepted(state === 'q1');
    setIsAnimating(false);
  };

  const handleInputChange = (e) => {
    const newInput = e.target.value;
    setInputString(newInput);
  };

  // Toggle modal visibility
  const toggleHelpModal = () => {
    setIsHelpOpen(!isHelpOpen);
  };

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    camera.position.z = 10;
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // States as spheres
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    
    // q0 - Initial state (blue)
    const q0Material = new THREE.MeshPhongMaterial({ 
      color: 0x3498db,
      transparent: true,
      opacity: 0.8
    });
    const q0Sphere = new THREE.Mesh(sphereGeometry, q0Material);
    q0Sphere.position.set(-10, 0, 0);
    scene.add(q0Sphere);
    
    // q1 - Accept state (green)
    const q1Material = new THREE.MeshPhongMaterial({ 
      color: 0x2ecc71,
      transparent: true,
      opacity: 0.8
    });
    const q1Sphere = new THREE.Mesh(sphereGeometry, q1Material);
    q1Sphere.position.set(0, 0, 0);
    scene.add(q1Sphere);
    
    // q2 - Reject state (red)
    const q2Material = new THREE.MeshPhongMaterial({ 
      color: 0xe74c3c,
      transparent: true,
      opacity: 0.8
    });
    const q2Sphere = new THREE.Mesh(sphereGeometry, q2Material);
    q2Sphere.position.set(-5, -5, 0);
    scene.add(q2Sphere);
    
    // Create double circle for accept state (q1)
    const ringGeometry = new THREE.TorusGeometry(1.3, 0.1, 16, 50);
    const ringMaterial = new THREE.MeshPhongMaterial({ color: 0x2ecc71 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.copy(q1Sphere.position);
    scene.add(ring);
    
    // Add text labels for states
    const createTextLabel = (text, position) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;  
      const context = canvas.getContext('2d');
      context.font = 'Bold 60px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.fillText(text, 128, 128);
      
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.position.y += 1.3;
      sprite.scale.set(2, 1, 1);
      scene.add(sprite);
    };
    
    createTextLabel('q0', q0Sphere.position);
    createTextLabel('q1', q1Sphere.position);
    createTextLabel('q2', q2Sphere.position);
    
    // Create character label that will follow the transition
    const charCanvas = document.createElement('canvas');
    charCanvas.width = 256;
    charCanvas.height = 256;
    const charContext = charCanvas.getContext('2d');
    charContext.font = 'Bold 72px Arial';
    charContext.fillStyle = 'white';
    charContext.textAlign = 'center';
    
    const charTexture = new THREE.CanvasTexture(charCanvas);
    const charMaterial = new THREE.SpriteMaterial({ 
      map: charTexture,
      transparent: true,
      opacity: 0.9
    });
    const charLabel = new THREE.Sprite(charMaterial);
    charLabel.scale.set(3, 2, 1);
    charLabel.position.set(0, 5, 0); // Initially position it above the scene
    scene.add(charLabel);
    
    // Store character label in scene objects
    const sceneObjectsRef = {
      charLabel
    };
    setSceneObjects(sceneObjectsRef);
    
    // Create arrows for transitions with references to be animated
    const arrowsRef = {};
    
    const createArrow = (from, to, color, yOffset = 0, label = '', key = '') => {
      const direction = new THREE.Vector3().subVectors(to, from).normalize();
      const length = from.distanceTo(to) - 2.2; // Subtract sphere radii plus a bit
      
      const start = new THREE.Vector3().copy(from).addScaledVector(direction, 1.1);
      
      // Curve the path by adding an offset
      const midPoint = new THREE.Vector3().copy(start).addScaledVector(direction, length / 2);
      midPoint.y += yOffset;
      
      // Create curve
      const curve = new THREE.QuadraticBezierCurve3(
        start,
        midPoint,
        new THREE.Vector3().copy(to).addScaledVector(direction, -1.1)
      );
      
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color,
        linewidth: 2
      });
      const line = new THREE.Line(geometry, material);
      scene.add(line);
      
      // Add arrowhead
      const arrowGeometry = new THREE.ConeGeometry(0.2, 0.5, 32);
      const arrowMaterial = new THREE.MeshBasicMaterial({ color });
      const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
      
      // Position at the end of the curve and orient along the curve
      const endPoint = points[points.length - 1];
      const endDirection = new THREE.Vector3().subVectors(
        points[points.length - 1],
        points[points.length - 2]
      ).normalize();
      
      arrow.position.copy(endPoint);
      arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), endDirection);
      scene.add(arrow);
      
      // Store references for animation
      if (key) {
        arrowsRef[key] = {
          line,
          material,
          head: arrow,
          originalColor: color,
          midPoint: midPoint.clone()
        };
      }
      
      // Add label for the transition
      if (label) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        context.font = 'Bold 24px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText(label, 128, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        // Position label at midpoint of the curve
        sprite.position.copy(midPoint);
        sprite.position.y += 0.5;
        sprite.scale.set(2, 1, 1);
        scene.add(sprite);
      }
    };
    
    // Create transitions with their keys for animation
    createArrow(q0Sphere.position, q1Sphere.position, 0x3498db, 1, '^[a-zA-Z_][a-zA-Z0-9_]*$', 'q0-q1');
    createArrow(q0Sphere.position, q2Sphere.position, 0xe74c3c, -1, 'other', 'q0-q2');
    createArrow(q1Sphere.position, q1Sphere.position, 0x2ecc71, 2, '^[a-zA-Z_][a-zA-Z0-9_]*$', 'q1-q1');
    createArrow(q1Sphere.position, q2Sphere.position, 0xe74c3c, 0, 'other', 'q1-q2');
    
    // Self-loop for q2
    const q2SelfLoop = new THREE.TorusGeometry(1.5, 0.05, 16, 50);
    const q2LoopMaterial = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
    const q2Loop = new THREE.Mesh(q2SelfLoop, q2LoopMaterial);
    q2Loop.position.copy(q2Sphere.position);
    q2Loop.position.y += 2;
    q2Loop.rotation.x = Math.PI / 2;
    scene.add(q2Loop);
    
    // Store reference for q2 self-loop (if needed in the arrowsRef)
    arrowsRef['q2-q2'] = {
      material: q2LoopMaterial,
      originalColor: 0xe74c3c,
      midPoint: new THREE.Vector3().copy(q2Sphere.position).add(new THREE.Vector3(0, 3, 0))
    };
    
    // Label for q2 self-loop
    const q2LoopLabel = document.createElement('canvas');
    q2LoopLabel.width = 256;
    q2LoopLabel.height = 128;
    const q2LoopContext = q2LoopLabel.getContext('2d');
    q2LoopContext.font = 'Bold 24px Arial';
    q2LoopContext.fillStyle = 'white';
    q2LoopContext.textAlign = 'center';
    q2LoopContext.fillText('any', 128, 64);
    
    const q2LoopTexture = new THREE.CanvasTexture(q2LoopLabel);
    const q2LoopSpriteMaterial = new THREE.SpriteMaterial({ map: q2LoopTexture });
    const q2LoopSprite = new THREE.Sprite(q2LoopSpriteMaterial);
    q2LoopSprite.position.copy(q2Sphere.position);
    q2LoopSprite.position.y += 3.5;
    q2LoopSprite.scale.set(2, 1, 1);
    scene.add(q2LoopSprite);
    
    // --- Add revolving arrow on q2 loop ---
    const q2LoopCenter = new THREE.Vector3().copy(q2Sphere.position);
    q2LoopCenter.y += 2;
    const loopRadius = 1.5;  // Same as the torus radius
    let theta = 0;  // Initial angle for the revolving arrow on q2
    
    const loopArrowGeometry = new THREE.ConeGeometry(0.2, 0.5, 32);
    const loopArrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const loopArrow = new THREE.Mesh(loopArrowGeometry, loopArrowMaterial);
    // Set initial position along the circle
    loopArrow.position.set(
      q2LoopCenter.x + loopRadius * Math.cos(theta),
      q2LoopCenter.y,
      q2LoopCenter.z + loopRadius * Math.sin(theta)
    );
    let tangent = new THREE.Vector3(-Math.sin(theta), 0, Math.cos(theta));
    loopArrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    scene.add(loopArrow);
    // --- End revolving arrow on q2 loop ---
    
    // --- Add static loop and revolving arrow on q1 ---
    // Create a static loop above q1 (separate from the double circle already drawn)
    const q1SelfLoop = new THREE.TorusGeometry(1.5, 0.05, 16, 50);
    const q1LoopMaterial = new THREE.MeshBasicMaterial({ color: 0x2ecc71 });
    const q1LoopMesh = new THREE.Mesh(q1SelfLoop, q1LoopMaterial);
    q1LoopMesh.position.copy(q1Sphere.position);
    q1LoopMesh.position.y += 2;
    q1LoopMesh.rotation.x = Math.PI / 2;
    scene.add(q1LoopMesh);
    
    // Create revolving arrow for q1 loop
    const q1LoopCenter = new THREE.Vector3().copy(q1Sphere.position);
    q1LoopCenter.y += 2;
    const q1LoopRadius = 1.5;
    let theta1 = 0;  // Initial angle for q1 revolving arrow
    const q1LoopArrowGeometry = new THREE.ConeGeometry(0.2, 0.5, 32);
    const q1LoopArrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const q1LoopArrow = new THREE.Mesh(q1LoopArrowGeometry, q1LoopArrowMaterial);
    q1LoopArrow.position.set(
      q1LoopCenter.x + q1LoopRadius * Math.cos(theta1),
      q1LoopCenter.y,
      q1LoopCenter.z + q1LoopRadius * Math.sin(theta1)
    );
    let q1Tangent = new THREE.Vector3(-Math.sin(theta1), 0, Math.cos(theta1));
    q1LoopArrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q1Tangent);
    scene.add(q1LoopArrow);
    // --- End revolving arrow on q1 loop ---
    
    // Add cone to mark the entry point
    const entryGeometry = new THREE.ConeGeometry(0.3, 0.8, 32);
    const entryMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const entryMarker = new THREE.Mesh(entryGeometry, entryMaterial);
    entryMarker.position.copy(q0Sphere.position);
    entryMarker.position.x -= 2;
    entryMarker.rotation.z = -(Math.PI / 2);
    createTextLabel('Start', entryMarker.position);
    scene.add(entryMarker);
    
    // Add indicator arrow to show current state
    const indicatorGeometry = new THREE.ConeGeometry(0.3, 0.8, 32);
    const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.position.copy(q0Sphere.position);
    indicator.position.y += 3;
    indicator.rotation.x = Math.PI;
    scene.add(indicator);
    
    // Store arrows for animation
    setArrows(arrowsRef);

    // Function to update position of indicator
    const updateIndicator = () => {
      let targetPosition;
      if (currentState === 'q0') {
        targetPosition = q0Sphere.position.clone();
      } else if (currentState === 'q1') {
        targetPosition = q1Sphere.position.clone();
      } else {
        targetPosition = q2Sphere.position.clone();
      }
      
      // Adjust y position to be above the sphere
      targetPosition.y += 3;
      indicator.position.lerp(targetPosition, 0.1);
    };
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      const frameId = requestAnimationFrame(animate);
      setAnimationFrameId(frameId);
      
      // Make rings rotate
      ring.rotation.x += 0.01;
      ring.rotation.y += 0.01;
      q2Loop.rotation.z += 0.01;
      
      // Update current state indicator
      updateIndicator();
      
      // Update controls
      controls.update();
      
      // Update revolving arrow on q2 loop
      theta += 0.05;
      const newX = q2LoopCenter.x + loopRadius * Math.cos(theta);
      const newZ = q2LoopCenter.z + loopRadius * Math.sin(theta);
      loopArrow.position.set(newX, q2LoopCenter.y, newZ);
      tangent.set(-Math.sin(theta), 0, Math.cos(theta));
      loopArrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
      
      // Update revolving arrow on q1 loop
      theta1 += 0.05;
      const newQ1X = q1LoopCenter.x + q1LoopRadius * Math.cos(theta1);
      const newQ1Z = q1LoopCenter.z + q1LoopRadius * Math.sin(theta1);
      q1LoopArrow.position.set(newQ1X, q1LoopCenter.y, newQ1Z);
      q1Tangent.set(-Math.sin(theta1), 0, Math.cos(theta1));
      q1LoopArrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q1Tangent);
      
      // Render scene
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      controls.dispose();
      scene.clear();
    };
  }, [currentState]);
  
  return (
    <div className="three-scene-container">
      <canvas ref={canvasRef} className="canvas" />
      <div className="controls">
        <div className="input-container">
          <label htmlFor="dfa-input">Test string:</label>
          <input
            id="dfa-input"
            type="text"
            value={inputString}
            onChange={handleInputChange}
            placeholder="Enter a string to test"
            disabled={isAnimating}
          />
          <button 
            className="check-button"
            onClick={processInputStep}
            disabled={isAnimating}
          >
            {isAnimating ? 'Processing...' : 'Check Validity'}
          </button>
          <button 
            className="help-button"
            onClick={toggleHelpModal}
          >
            Help / Info
          </button>
        </div>
        <div className="state-info">
          <p>Current State: <span className={`state ${currentState}`}>{currentState}</span></p>
          <p>Status: <span className={isAccepted ? "accepted" : "rejected"}>
            {isAccepted ? "Accepted" : "Rejected"}
          </span></p>
          {currentIndex >= 0 && (
            <p>Processing: <span className="current-char">
              Character at position {currentIndex}: "{currentChar}"
            </span></p>
          )}
        </div>
      </div>
      {isHelpOpen && <HelpModal onClose={toggleHelpModal} />}
    </div>
  );
};

export default ThreeScene;
