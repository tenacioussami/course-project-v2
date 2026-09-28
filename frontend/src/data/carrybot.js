/*
 * Built-in CarryBot overview.
 * Used instantly on first paint (no waiting for the server), and as the
 * fallback for any field left empty in the database. Anything you edit
 * on the website overrides these texts.
 */
export const DEFAULT_PROJECT = {
  title: 'CarryBot: Vision-Guided Human-Following and Luggage Assistant Robot',

  problemStatement:
    'Carrying shopping bags or luggage while moving through crowded indoor environments such as shopping malls can be inconvenient, especially when a user needs to carry multiple items. Existing carts normally require manual pushing and cannot automatically follow a specific user or avoid obstacles. Therefore, a low-cost robotic system is needed that can identify its assigned user, follow the user automatically, carry items, and safely avoid obstacles.',

  objectives:
    "The main objective of CarryBot is to develop a mobile robot that can automatically follow a specific user while carrying shopping items or luggage. The robot will use a unique smart token to identify the assigned user, determine the user's direction, detect obstacles using vision and distance sensors, maintain a safe following distance, avoid obstacles, and continue following the same user after passing an obstacle.",

  proposedSolution: [
    'CarryBot will use a small BLE + Coded IR Smart Token carried by the user. The token will contain an ESP32-C3, which will provide a unique BLE identity so CarryBot can recognize its assigned user. Coded IR signals will help CarryBot determine whether the user is on the left, center, or right side.',
    'A camera will be used for vision-based detection of people and obstacles, while ultrasonic sensors will measure the distance of nearby obstacles. CarryBot will use two geared DC motors with encoders for movement and a basket or load platform for carrying shopping items or luggage.',
    'Two processing configurations are being considered. In the first configuration, the ESP32-S3 N16R8 will handle sensor processing, lightweight vision processing, navigation, and motor control. In the second configuration, a Raspberry Pi Zero 2 W will be added for camera processing and high-level navigation, while the ESP32-S3 will handle real-time sensor reading and motor control. We will select the final configuration after testing based on performance, cost, and processing requirements.',
  ].join('\n'),

  methodology: [
    "First, the CarryBot smart user token will be developed using ESP32-C3, BLE, and coded IR LEDs. CarryBot will identify the assigned user using the token's unique BLE identity. Multiple IR receivers mounted on CarryBot will receive the coded IR signal and help determine whether the user is positioned on the left, center, or right side.",
    'A camera will continuously observe the environment and help detect people and common obstacles. Three ultrasonic sensors will be placed at the front-left, front-center, and front-right positions to measure obstacle distance. CarryBot will combine user-direction information, camera data, and ultrasonic sensor readings to decide whether it should move forward, turn left or right, slow down, stop, or avoid an obstacle.',
    "Two geared DC motors with encoders will provide differential-drive movement. After avoiding an obstacle, CarryBot will search for the assigned user's token signal again and continue following the same user.",
  ].join('\n'),

  expectedOutcomes: [
    'The expected outcome is a functional CarryBot prototype that can identify and follow a specific user while carrying lightweight shopping items or luggage. CarryBot is expected to maintain a suitable following distance, detect nearby obstacles, avoid collisions, and continue following the assigned user after completing obstacle avoidance.',
    'The project is also expected to demonstrate a lower-cost human-following solution compared with systems that depend on more expensive technologies such as UWB.',
  ].join('\n'),

  technologiesUsed: [
    'CarryBot will use ESP32-S3 N16R8, ESP32-C3, BLE, coded infrared communication, camera-based computer vision, ultrasonic sensors, geared DC motors with encoders, motor drivers, and embedded programming.',
    'For vision processing, lightweight technologies such as OpenCV, TensorFlow Lite, ESP-DL, or similar lightweight computer-vision techniques may be used.',
    'Option 1 – ESP32-S3 Only: ESP32-S3 N16R8 + Camera + ESP32-C3 Smart Token + IR Receivers + Ultrasonic Sensors + Motor Driver + Motors.',
    'Option 2 – Raspberry Pi Zero 2 W + ESP32-S3: Raspberry Pi Zero 2 W + Camera for vision and high-level processing, while ESP32-S3 N16R8 handles IR and ultrasonic sensor readings, wheel encoders, and motor control. ESP32-C3 will remain the controller for the CarryBot user smart token.',
  ].join('\n'),

  timeline: [
    'Week 1: Literature review and CarryBot project planning. Relevant papers on human-following robots, obstacle avoidance, smart carts, and vision-based navigation will be studied.',
    'Week 2: Component selection and system design. The controller, camera, ultrasonic sensors, motors, motor driver, battery, and smart-token components will be finalized.',
    'Week 3: CarryBot smart token development using ESP32-C3, BLE, and coded IR LEDs. Basic user identification and directional signal testing will be performed.',
    'Week 4: Robot chassis and motor assembly. Wheels, motors, motor driver, battery, and frame will be connected and basic movement will be tested.',
    'Week 5: Ultrasonic obstacle-detection system development. Front-left, front-center, and front-right obstacle-distance sensing will be implemented.',
    'Week 6: Camera and vision-system development. The camera will be integrated and lightweight object/obstacle detection will be tested.',
    'Week 7: Human-following system integration. BLE identification, IR direction detection, and robot movement will be combined.',
    'Week 8: Obstacle-avoidance integration. Vision, ultrasonic sensing, and motor control will be combined so CarryBot can avoid obstacles while following the user.',
    'Week 9: Full system testing and improvement. CarryBot will be tested in different indoor environments, and tracking, movement, and obstacle-avoidance problems will be improved.',
    'Week 10: Final testing, documentation, and demonstration preparation. The complete CarryBot prototype will be prepared for final presentation and demonstration.',
  ].join('\n'),

  description: [
    'CarryBot is a smart autonomous mobile robot designed to assist users by carrying shopping items or personal luggage while automatically following them. The user will carry a unique smart token that allows CarryBot to identify the correct user even when several people are nearby.',
    'CarryBot will use vision and ultrasonic sensing to understand the surrounding environment and detect obstacles. It will follow the assigned user, avoid obstacles when necessary, and then continue following the same user. Depending on the required vision-processing performance, CarryBot will either use the ESP32-S3 N16R8 independently or combine it with a Raspberry Pi Zero 2 W. The main goal is to build a practical, low-cost, and easy-to-develop human-following assistant robot for indoor environments such as shopping malls.',
  ].join('\n'),

  progress: 0,
};

/** DB values win, but empty strings fall back to the built-in overview. */
export const withDefaults = (p) => {
  if (!p) return { ...DEFAULT_PROJECT, _fromDefaults: true };
  const out = { ...DEFAULT_PROJECT, ...p };
  Object.keys(DEFAULT_PROJECT).forEach((k) => {
    if (p[k] === '' || p[k] == null) out[k] = DEFAULT_PROJECT[k];
  });
  return out;
};

/** "Week 3: Something. More." → [{ week: 3, title: 'Something', detail: 'More.' }] */
export const parseTimeline = (text = '') =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^week\s*(\d+)\s*[:\-–]\s*(.*)$/i);
      if (!m) return null;
      const rest = m[2];
      const dot = rest.indexOf('. ');
      return {
        week: Number(m[1]),
        title: dot > -1 ? rest.slice(0, dot) : rest.replace(/\.$/, ''),
        detail: dot > -1 ? rest.slice(dot + 2) : '',
      };
    })
    .filter(Boolean);

/** Split "Option N – Name: body" lines out of the technologies text. */
export const parseTech = (text = '') => {
  const paras = [];
  const options = [];
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line) => {
      const m = line.match(/^option\s*(\d+)\s*[–\-:]\s*([^:]+):\s*(.*)$/i);
      if (m) options.push({ n: Number(m[1]), name: m[2].trim(), body: m[3].trim() });
      else if (!/^two possible processing configurations/i.test(line)) paras.push(line);
    });
  return { paras, options };
};

export const paragraphs = (text = '') => text.split('\n').map((l) => l.trim()).filter(Boolean);

export const TECH_STACK = [
  'ESP32-S3 N16R8', 'ESP32-C3', 'BLE', 'Coded IR', 'Camera CV', 'Ultrasonic ×3',
  'Geared DC + Encoders', 'Motor Driver', 'OpenCV', 'TensorFlow Lite', 'ESP-DL', 'Raspberry Pi Zero 2 W',
];
