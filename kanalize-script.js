// Variables
const players = [];
const team1 = [];
const team2 = [];
let currentTeam = 1;
let isSpinning = false;
let remainingPlayers = [];
let currentAnimation = null;
let wheelStopped = false;
let spinningStartTime = 0;
let rotationSpeed = 3; // 3 rotations per second
let wheelAnimationId = null;
let isTransitioning = false;

// Audio variables
const bgMusic = document.getElementById('bgMusic');
const selectSound = document.getElementById('selectSound');
const finishSound = document.getElementById('finishSound');
const resetSound = document.getElementById('resetSound');
let isMuted = false;
let bgMusicStarted = false;
let selectSoundStarted = false;

// DOM Elements
const playerInput = document.getElementById('playerInput');
const addPlayerBtn = document.getElementById('addPlayerBtn');
const playersList = document.getElementById('playersList');
const spinBtn = document.getElementById('spinBtn');
const resetBtn = document.getElementById('resetBtn');
const wheel = document.getElementById('wheel');
const selectedPlayer = document.getElementById('selectedPlayer');
const team1List = document.getElementById('team1List');
const team2List = document.getElementById('team2List');
const vsContainer = document.getElementById('vsContainer');
const muteButton = document.getElementById('muteButton');

// Audio Functions
function toggleMute() {
    isMuted = !isMuted;
    
    // Update all audio elements
    bgMusic.muted = isMuted;
    selectSound.muted = isMuted;
    finishSound.muted = isMuted;
    resetSound.muted = isMuted;
    
    // Update mute button icon
    const soundOn = muteButton.querySelector('.sound-on');
    const soundOff = muteButton.querySelector('.sound-off');
    
    if (isMuted) {
        soundOn.style.display = 'none';
        soundOff.style.display = 'block';
    } else {
        soundOn.style.display = 'block';
        soundOff.style.display = 'none';
    }
}

// Function to fade out background music
function fadeOutBgMusic(duration, callback) {
    if (bgMusic.paused || isMuted || bgMusic.volume === 0) {
        if (callback) callback();
        return;
    }
    
    const originalVolume = bgMusic.volume || 1;
    const fadeSteps = 20; // Number of steps in the fade
    const fadeInterval = duration / fadeSteps;
    const volumeStep = originalVolume / fadeSteps;
    
    let currentStep = 0;
    
    const fadeOutInterval = setInterval(() => {
        currentStep++;
        const newVolume = originalVolume - (volumeStep * currentStep);
        
        if (currentStep >= fadeSteps || newVolume <= 0) {
            clearInterval(fadeOutInterval);
            bgMusic.pause();
            bgMusic.volume = originalVolume; // Reset volume for next play
            if (callback) callback();
        } else {
            bgMusic.volume = newVolume;
        }
    }, fadeInterval);
}

function addPlayer() {
    const playerName = playerInput.value.trim();
    if (playerName) {
        // Start background music on first player add
        if (!bgMusicStarted && !isMuted) {
            bgMusic.play().catch(error => console.log("Background music play failed:", error));
            bgMusicStarted = true;
        }
        
        players.push(playerName);
        remainingPlayers.push(playerName); // Also add to remaining players
        const li = document.createElement('li');
        li.className = 'player-item';
        li.innerHTML = `
                    <span>${playerName}</span>
                    <button class="remove-player" data-index="${players.length - 1}">×</button>
                `;
        playersList.appendChild(li);
        playerInput.value = '';
        updateWheel(); // Update wheel when player is added
    }
}

function removePlayer(index) {
    const playerName = players[index];
    players.splice(index, 1);

    // Also remove from remaining players if present
    const remainingIndex = remainingPlayers.indexOf(playerName);
    if (remainingIndex !== -1) {
        remainingPlayers.splice(remainingIndex, 1);
    }

    updatePlayersList();
    updateWheel();
}

function updatePlayersList() {
    playersList.innerHTML = '';
    players.forEach((player, index) => {
        const li = document.createElement('li');
        li.className = 'player-item';
        li.innerHTML = `
                    <span>${player}</span>
                    <button class="remove-player" data-index="${index}">×</button>
                `;
        playersList.appendChild(li);
    });
}

function updateWheel() {
    wheel.innerHTML = '';

    if (remainingPlayers.length === 0) {
        spinBtn.disabled = true;
        return;
    } else {
        spinBtn.disabled = false;
    }

    const sliceAngle = 360 / remainingPlayers.length;
    const wheelRadius = 320 / 2; // Match the wheel container size

    // Create a single SVG element for better performance
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");

    // Define vibrant professional colors with gradients
    const colorPairs = [
        { main: '#3b5998', light: '#4967a3', dark: '#2a4073' }, // Deep Blue
        { main: '#8b0000', light: '#a52a2a', dark: '#6b0000' }, // Maroon
        { main: '#556b2f', light: '#6b8e23', dark: '#3a4d1f' }, // Olive
        { main: '#8b4513', light: '#a0522d', dark: '#6b3811' }, // Saddle Brown
        { main: '#483d8b', light: '#5f4f9e', dark: '#372c6b' }, // Dark Slate Blue
        { main: '#4b5320', light: '#5c652a', dark: '#363d18' }, // Army Green
        { main: '#704214', light: '#8b4f19', dark: '#5c3511' }, // Brown
        { main: '#2f4f4f', light: '#3d6666', dark: '#1e3333' }  // Dark Slate Gray
    ];

    // Add a circular background
    const background = document.createElementNS(svgNS, "circle");
    background.setAttribute("cx", "50");
    background.setAttribute("cy", "50");
    background.setAttribute("r", "50");
    background.setAttribute("fill", "#121212");
    svg.appendChild(background);

    // Create each slice individually
    remainingPlayers.forEach((player, index) => {
        // Calculate angles for this slice
        const startAngle = index * sliceAngle;
        const endAngle = (index + 1) * sliceAngle;

        // Create color gradient for this slice
        const colorIndex = index % colorPairs.length;
        const colorSet = colorPairs[colorIndex];

        // Define a gradient
        const gradientId = `gradient-${index}`;
        const gradient = document.createElementNS(svgNS, "radialGradient");
        gradient.setAttribute("id", gradientId);
        gradient.setAttribute("cx", "50%");
        gradient.setAttribute("cy", "50%");
        gradient.setAttribute("r", "70%");

        // Add gradient stops
        const stop1 = document.createElementNS(svgNS, "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", colorSet.light);

        const stop2 = document.createElementNS(svgNS, "stop");
        stop2.setAttribute("offset", "70%");
        stop2.setAttribute("stop-color", colorSet.main);

        const stop3 = document.createElementNS(svgNS, "stop");
        stop3.setAttribute("offset", "100%");
        stop3.setAttribute("stop-color", colorSet.dark);

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        gradient.appendChild(stop3);

        // Add the gradient to defs
        const defs = document.createElementNS(svgNS, "defs");
        defs.appendChild(gradient);
        svg.appendChild(defs);

        // Calculate the coordinates for the SVG path
        const x1 = 50;
        const y1 = 50;
        const x2 = 50 + 50 * Math.cos((startAngle - 90) * Math.PI / 180);
        const y2 = 50 + 50 * Math.sin((startAngle - 90) * Math.PI / 180);
        const x3 = 50 + 50 * Math.cos((endAngle - 90) * Math.PI / 180);
        const y3 = 50 + 50 * Math.sin((endAngle - 90) * Math.PI / 180);

        // Define the SVG path for a perfect slice
        const largeArcFlag = sliceAngle > 180 ? 1 : 0;
        const pathData = [
            `M ${x1},${y1}`,
            `L ${x2},${y2}`,
            `A 50,50 0 ${largeArcFlag},1 ${x3},${y3}`,
            "Z"
        ].join(" ");

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pathData);
        path.setAttribute("fill", `url(#${gradientId})`);
        path.setAttribute("stroke", "#000");
        path.setAttribute("stroke-width", "0.5");

        // Add shine effect with a subtle overlay
        const shine = document.createElementNS(svgNS, "path");
        shine.setAttribute("d", pathData);
        shine.setAttribute("fill", "rgba(255, 255, 255, 0.1)");
        shine.setAttribute("stroke", "none");

        svg.appendChild(path);
        svg.appendChild(shine);

        // Add text for the player name
        const text = document.createElementNS(svgNS, "text");

        // Position the text in the middle of the slice
        const textAngle = startAngle + (sliceAngle / 2);
        const textRadius = 34; // Position text at about 34% from the center
        const textX = 50 + textRadius * Math.cos((textAngle - 90) * Math.PI / 180);
        const textY = 50 + textRadius * Math.sin((textAngle - 90) * Math.PI / 180);

        text.setAttribute("x", textX);
        text.setAttribute("y", textY);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("fill", "#fff"); // White text
        text.setAttribute("font-size", "3.5px");
        text.setAttribute("font-weight", "bold");
        text.setAttribute("transform", `rotate(${textAngle}, ${textX}, ${textY})`);

        // Create a path for curved text if needed
        if (sliceAngle < 30) { // For small slices, use curved text
            // For curved text path
            const textPathId = `textPath-${index}`;
            const radius = 34;
            const textStartAngle = textAngle - 5; // Start a bit before
            const textEndAngle = textAngle + 5; // End a bit after

            const textArcX1 = 50 + radius * Math.cos((textStartAngle - 90) * Math.PI / 180);
            const textArcY1 = 50 + radius * Math.sin((textStartAngle - 90) * Math.PI / 180);
            const textArcX2 = 50 + radius * Math.cos((textEndAngle - 90) * Math.PI / 180);
            const textArcY2 = 50 + radius * Math.sin((textEndAngle - 90) * Math.PI / 180);

            const textArc = document.createElementNS(svgNS, "path");
            textArc.setAttribute("id", textPathId);
            textArc.setAttribute("d", `M ${textArcX1},${textArcY1} A ${radius},${radius} 0 0,1 ${textArcX2},${textArcY2}`);
            textArc.setAttribute("fill", "none");
            defs.appendChild(textArc);

            const textPath = document.createElementNS(svgNS, "textPath");
            textPath.setAttribute("href", `#${textPathId}`);
            textPath.setAttribute("startOffset", "50%");
            textPath.setAttribute("text-anchor", "middle");
            textPath.textContent = player;

            text.textContent = "";
            text.appendChild(textPath);
        } else {
            // For straight text
            text.textContent = player;
        }

        // Add a shadow effect for the text
        const textShadow = document.createElementNS(svgNS, "filter");
        textShadow.setAttribute("id", `shadow-${index}`);
        const feDropShadow = document.createElementNS(svgNS, "feDropShadow");
        feDropShadow.setAttribute("dx", "0");
        feDropShadow.setAttribute("dy", "0");
        feDropShadow.setAttribute("stdDeviation", "0.5");
        feDropShadow.setAttribute("flood-color", "#000");
        textShadow.appendChild(feDropShadow);
        defs.appendChild(textShadow);

        text.setAttribute("filter", `url(#shadow-${index})`);
        svg.appendChild(text);
    });

    wheel.appendChild(svg);

    // Add a glossy overlay effect for the entire wheel
    const glossOverlay = document.createElement('div');
    glossOverlay.className = 'wheel-gloss';
    glossOverlay.style.position = 'absolute';
    glossOverlay.style.top = '0';
    glossOverlay.style.left = '0';
    glossOverlay.style.width = '100%';
    glossOverlay.style.height = '100%';
    glossOverlay.style.borderRadius = '50%';
    glossOverlay.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0) 100%)';
    glossOverlay.style.pointerEvents = 'none'; // Make it non-interactive
    wheel.appendChild(glossOverlay);

    // Add wheel marks/divisions between slices for a more professional look
    const marks = document.createElementNS(svgNS, "svg");
    marks.setAttribute("width", "100%");
    marks.setAttribute("height", "100%");
    marks.setAttribute("viewBox", "0 0 100 100");
    marks.setAttribute("style", "position: absolute; top: 0; left: 0;");

    // Add divider lines between slices
    remainingPlayers.forEach((_, index) => {
        const angle = index * sliceAngle;
        const x2 = 50 + 50 * Math.cos((angle - 90) * Math.PI / 180);
        const y2 = 50 + 50 * Math.sin((angle - 90) * Math.PI / 180);

        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", "50");
        line.setAttribute("y1", "50");
        line.setAttribute("x2", x2.toString());
        line.setAttribute("y2", y2.toString());
        line.setAttribute("stroke", "#000");
        line.setAttribute("stroke-width", "0.75");

        marks.appendChild(line);
    });

    wheel.appendChild(marks);
}

function spin() {
    if (isSpinning || remainingPlayers.length === 0) return;
    
    // Fade out background music if it's playing and mark it as stopped
    fadeOutBgMusic(1000);
    bgMusicStarted = false; // Mark as stopped so it doesn't restart
    
    // Play select sound on first spin
    if (!selectSoundStarted && !isMuted) {
        selectSound.play().catch(error => console.log("Select sound play failed:", error));
        selectSoundStarted = true;
    }
    
    isSpinning = true;
    spinBtn.disabled = true; // Initially disable the button
    wheelStopped = false;
    
    // Change button text and appearance for stopping
    spinBtn.textContent = "Çarkı Durdur";
    spinBtn.classList.add("stop");
    spinBtn.classList.add("disabled"); // Add disabled class
    resetBtn.classList.add("disabled");
    
    // FIX: Properly change button functionality
    // First remove both possible event listeners to prevent duplicates
    spinBtn.removeEventListener('click', spin);
    spinBtn.removeEventListener('click', stopWheel);
    
    // Add the stopWheel event listener
    spinBtn.addEventListener('click', stopWheel);

    // Add a 1-second delay before enabling the stop button
    setTimeout(() => {
        if (isSpinning && !isTransitioning) {
            spinBtn.disabled = false;
            spinBtn.classList.remove("disabled");
        }
    }, 1000);

    // Start from 0 rotation
    wheel.style.transform = 'rotate(0deg)';
    wheel.style.transition = 'none';
    let startTime = null;
    let lastTimestamp = 0;
    let currentRotation = 0;

    // Clear any existing animation
    if (wheelAnimationId) {
        cancelAnimationFrame(wheelAnimationId);
    }

    // Acceleration animation function
    function accelerate(timestamp) {
        if (!startTime) startTime = timestamp;

        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / 1000, 1); // 1 second acceleration

        // Calculate current speed as a function of progress (0 to 1)
        // Cubic easing for smooth acceleration
        const currentSpeed = rotationSpeed * progress * progress * (3 - 2 * progress);

        // Calculate how much to rotate since last frame
        const deltaTime = timestamp - lastTimestamp;
        const deltaRotation = (currentSpeed * deltaTime) / 1000 * 360; // Convert to degrees

        // Update rotation
        currentRotation += deltaRotation;
        wheel.style.transform = `rotate(${currentRotation}deg)`;

        lastTimestamp = timestamp;

        if (progress < 1) {
            // Continue acceleration
            wheelAnimationId = requestAnimationFrame(accelerate);
        } else {
            // Acceleration complete, switch to constant speed
            wheel.style.transition = 'none';

            // Extract current rotation modulo 360 to avoid large numbers
            const baseRotation = currentRotation % 360;
            wheel.style.transform = `rotate(${baseRotation}deg)`;

            // Add spinning class for constant speed rotation
            setTimeout(() => {
                wheel.classList.add('spinning');

                // Enable stop button
                spinBtn.classList.remove("disabled");
                isTransitioning = false;

                // Create particle effect
                createParticles(12);
            }, 20);
        }
    }

    // Start acceleration
    wheelAnimationId = requestAnimationFrame(accelerate);
}

function stopWheel() {
    if (!isSpinning || isTransitioning) return;

    console.log("stopWheel function called"); // Debug log
    
    isTransitioning = true;
    
    // Disable the button during deceleration to ensure consistent experience
    spinBtn.disabled = true;
    spinBtn.classList.add("disabled");
    resetBtn.classList.add("disabled");
    
    // Get current rotation
    const computedStyle = window.getComputedStyle(wheel);
    const matrix = new DOMMatrix(computedStyle.transform);
    let currentAngle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
    if (currentAngle < 0) currentAngle += 360;

    // Remove spinning class
    wheel.classList.remove('spinning');

    // Set current position
    wheel.style.transform = `rotate(${currentAngle}deg)`;
    wheel.style.transition = 'none';

    // Select random player
    const sliceAngle = 360 / remainingPlayers.length;
    const selectedIndex = Math.floor(Math.random() * remainingPlayers.length);

    // UPDATED: Calculate target angle for right-side pointer (0 degrees in standard coordinates)
    // For the right pointer, we want the value to be at 0 degrees (right)
    const targetAngle = 0 - ((selectedIndex * sliceAngle) + (sliceAngle / 2));

    // Calculate total rotation during deceleration
    // Start from current rotation speed (3 rotations per second)
    // Decelerate to 0 over 1 second, which means 1.5 rotations on average
    const decelerationDistance = 1.5 * 360; // 1.5 rotations during deceleration

    // Calculate final target including deceleration distance and adjustment to reach target player
    // We need to normalize angles to ensure we're rotating in the correct direction
    const currentMod360 = currentAngle % 360;
    // Make sure we're always going clockwise for a more natural feel
    let adjustmentToTarget = (targetAngle - currentMod360) % 360;
    if (adjustmentToTarget < 0) adjustmentToTarget += 360;

    const finalRotation = currentAngle + decelerationDistance + adjustmentToTarget;

    // Start deceleration animation
    const startTime = Date.now();
    const startRotation = currentAngle;
    const rotationDistance = finalRotation - startRotation;
    const decelDuration = 1000; // 1 second deceleration

    function decelerate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / decelDuration, 1);

        // Cubic easing for smooth deceleration (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const newRotation = startRotation + (rotationDistance * easedProgress);

        wheel.style.transform = `rotate(${newRotation}deg)`;

        if (progress < 1) {
            requestAnimationFrame(decelerate);
        } else {
            // Deceleration complete, add small bounce effect
            wheel.style.transition = 'transform 0.15s ease-out';
            wheel.style.transform = `rotate(${finalRotation - 5}deg)`;

            setTimeout(() => {
                wheel.style.transition = 'transform 0.15s ease-in-out';
                wheel.style.transform = `rotate(${finalRotation}deg)`;

                // Wait for final bounce to complete
                setTimeout(() => {
                    handleWheelStop(selectedIndex);
                }, 150);
            }, 150);
        }
    }

    requestAnimationFrame(decelerate);
}

function handleWheelStop(selectedIndex) {
    // Don't reset isTransitioning yet - we'll reset it after wheel updates
    // Keep the button disabled until the player is fully removed from wheel

    // Get the selected player name
    const selectedPlayerName = remainingPlayers[selectedIndex];
    showSelectedPlayer(selectedPlayerName);

    // Add the selected player to the appropriate team
    if (currentTeam === 1) {
        team1.push(selectedPlayerName);
        currentTeam = 2;
    } else {
        team2.push(selectedPlayerName);
        currentTeam = 1;
    }

    // Special case: If there were exactly 2 players remaining, assign the other one automatically
    if (remainingPlayers.length === 2) {
        // Find the index of the other player
        const otherIndex = selectedIndex === 0 ? 1 : 0;
        const otherPlayerName = remainingPlayers[otherIndex];
        
        // Add the other player to the appropriate team
        if (currentTeam === 1) {
            team1.push(otherPlayerName);
            currentTeam = 2;
        } else {
            team2.push(otherPlayerName);
            currentTeam = 1;
        }
        
        // Clear the remaining players list
        remainingPlayers = [];
        
        // Update team displays with both new players
        updateTeamDisplay();
        
        // Change button text back
        spinBtn.textContent = "Çarkı Çevir";
        spinBtn.classList.remove("stop");
        spinBtn.classList.add("disabled"); // Keep disabled as we're done
        spinBtn.disabled = true;
        
        // Reset event listeners
        spinBtn.removeEventListener('click', stopWheel);
        spinBtn.addEventListener('click', spin);
        
        resetBtn.classList.remove("disabled");
        isTransitioning = false;
        isSpinning = false;
        
        // Clear the wheel as all players are assigned
        wheel.innerHTML = '';
        
        // After a delay to show the first selected player, show VS animation and play finish sound
        setTimeout(() => {
            // Show VS animation and play finish sound
            showVsAnimation();
            
            // Play finish sound when all selections are complete
            if (!isMuted) {
                finishSound.play().catch(error => console.log("Finish sound play failed:", error));
            }
        }, 1500);
        
        return; // Exit early as special case handled
    }

    // Update team displays immediately
    updateTeamDisplay();

    // Remove the player from the remaining list
    remainingPlayers.splice(selectedIndex, 1);

    // Check if all players have been assigned
    if (remainingPlayers.length === 0) {
        // Change button text back
        spinBtn.textContent = "Çarkı Çevir";
        spinBtn.classList.remove("stop");
        spinBtn.classList.add("disabled"); // Keep disabled as we're done
        spinBtn.disabled = true;
        
        // FIX: Properly reset event listeners
        spinBtn.removeEventListener('click', stopWheel);
        spinBtn.addEventListener('click', spin);
        
        resetBtn.classList.remove("disabled");
        isTransitioning = false;
        isSpinning = false;
        
        // Clear the wheel as all players are assigned
        wheel.innerHTML = '';
        
        // Show VS animation and play finish sound
        showVsAnimation();
        
        // Play finish sound when all selections are complete
        if (!isMuted) {
            finishSound.play().catch(error => console.log("Finish sound play failed:", error));
        }
    } else {
        // Wait for the selected player animation before updating wheel
        // This ensures the button remains disabled until the player is fully removed
        setTimeout(() => {
            // Reset button state ONLY after wheel is updated
            spinBtn.textContent = "Çarkı Çevir";
            spinBtn.classList.remove("stop");
            
            // FIX: Properly reset event listeners
            spinBtn.removeEventListener('click', stopWheel);
            spinBtn.addEventListener('click', spin);
            
            // Update the wheel with remaining players
            updateWheel();
            
            // Finally enable buttons and reset states
            resetBtn.classList.remove("disabled");
            spinBtn.classList.remove("disabled");
            spinBtn.disabled = false;  // Explicitly enable the button
            isTransitioning = false;
            isSpinning = false;
        }, 2000); // Increased from 500ms to 2000ms (2 seconds) to keep the name visible longer
    }
}

function showSelectedPlayer(playerName) {
    // Clear previous content and add a span for better styling
    selectedPlayer.innerHTML = `<span>${playerName}</span>`;
    
    // Remove active class first
    selectedPlayer.classList.remove('active');
    
    // Reset opacity to ensure animation works properly each time
    selectedPlayer.style.opacity = '0';
    
    // Force a reflow before adding the active class to ensure animation triggers
    void selectedPlayer.offsetWidth;
    
    // Add active class to start the animation
    setTimeout(() => {
        selectedPlayer.classList.add('active');
    }, 50);

    // Add particles effect
    createParticles(30);
}

function updateTeamDisplay() {
    team1List.innerHTML = '';
    team2List.innerHTML = '';

    // Display Team 1 players
    team1.forEach((player, index) => {
        const li = document.createElement('li');
        li.className = 'team-player';
        li.style.opacity = '1'; // Make it visible immediately
        li.textContent = player;
        team1List.appendChild(li);

        // Only animate the newest player
        if (index === team1.length - 1 && currentTeam === 2) {
            anime({
                targets: li,
                backgroundColor: [
                    'rgba(52, 152, 219, 0.4)',
                    'rgba(255, 255, 255, 0.1)'
                ],
                duration: 1000
            });
        }
    });

    // Display Team 2 players
    team2.forEach((player, index) => {
        const li = document.createElement('li');
        li.className = 'team-player';
        li.style.opacity = '1'; // Make it visible immediately
        li.textContent = player;
        team2List.appendChild(li);

        // Only animate the newest player
        if (index === team2.length - 1 && currentTeam === 1) {
            anime({
                targets: li,
                backgroundColor: [
                    'rgba(231, 76, 60, 0.4)',
                    'rgba(255, 255, 255, 0.1)'
                ],
                duration: 1000
            });
        }
    });
}

function showVsAnimation() {
    // Show VS section with animation
    anime({
        targets: vsContainer,
        opacity: 1,
        translateY: [20, 0],
        duration: 800,
        easing: 'easeOutQuad'
    });

    // Extra particles for final animation
    createParticles(50);
}

function resetGame() {
    if (isTransitioning) return;
    
    // Play reset sound
    if (!isMuted) {
        resetSound.play().catch(error => console.log("Reset sound play failed:", error));
    }

    // Cancel any active animations
    if (wheelAnimationId) {
        cancelAnimationFrame(wheelAnimationId);
        wheelAnimationId = null;
    }

    // Reset all data
    players.length = 0;
    team1.length = 0;
    team2.length = 0;
    remainingPlayers.length = 0;
    currentTeam = 1;
    isSpinning = false;
    wheelStopped = false;

    // Reset UI
    playersList.innerHTML = '';
    team1List.innerHTML = '';
    team2List.innerHTML = '';
    selectedPlayer.textContent = '';
    selectedPlayer.style.opacity = '0';

    // Reset audio state - allow bg music to play again from beginning when adding new players
    bgMusicStarted = false;
    selectSoundStarted = false;
    
    // Reset buttons and UI - FIX: Make sure to remove disabled class and attribute
    spinBtn.disabled = false;
    spinBtn.textContent = "Çarkı Çevir";
    spinBtn.classList.remove("stop");
    spinBtn.classList.remove("disabled"); // Make sure to remove disabled class
    
    // FIX: Properly reset event listeners
    spinBtn.removeEventListener('click', stopWheel);
    spinBtn.addEventListener('click', spin);

    // Hide VS section
    vsContainer.style.opacity = '0';

    // Clear wheel
    wheel.innerHTML = '';

    // Remove any spinning animation and reset all transitions
    wheel.classList.remove('spinning');
    wheel.style.transition = 'none';
    wheel.style.transform = 'rotate(0deg)';
}

// Particle effects
function createParticles(count) {
    const particlesContainer = document.querySelector('.particles');

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Random size between 2px and 6px
        const size = 2 + Math.random() * 4;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Random position around the wheel
        const wheelRect = wheel.getBoundingClientRect();
        const centerX = wheelRect.left + wheelRect.width / 2;
        const centerY = wheelRect.top + wheelRect.height / 2;

        // Start from center of wheel
        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;

        particlesContainer.appendChild(particle);

        // Animate particles with more speed
        anime({
            targets: particle,
            left: centerX + (Math.random() - 0.5) * 300,
            top: centerY + (Math.random() - 0.5) * 300,
            opacity: [1, 0],
            duration: 800 + Math.random() * 600, // Faster particles
            easing: 'easeOutExpo',
            complete: () => {
                particlesContainer.removeChild(particle);
            }
        });
    }
}

// Initialize event listeners
function initEventListeners() {
    // Add player button
    addPlayerBtn.addEventListener('click', addPlayer);
    
    // Press Enter to add player
    playerInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addPlayer();
        }
    });
    
    // Spin button - make sure we're only adding it once
    spinBtn.removeEventListener('click', spin); 
    spinBtn.removeEventListener('click', stopWheel); // Remove any stopWheel listeners too
    spinBtn.addEventListener('click', spin);
    
    // Reset button
    resetBtn.addEventListener('click', resetGame);
    
    // Mute button
    muteButton.addEventListener('click', toggleMute);
    
    // Remove player buttons
    playersList.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-player')) {
            const index = parseInt(e.target.dataset.index);
            removePlayer(index);
        }
    });
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    updateWheel();
    
    // Initialize sound-off icon to be hidden at start
    const soundOff = muteButton.querySelector('.sound-off');
    if (soundOff) {
        soundOff.style.display = 'none';
    }
});

// Create background particles
function createBackgroundParticles() {
    const particlesContainer = document.querySelector('.particles');

    for (let i = 0; i < 20; i++) { // Reduced count for performance
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Random size between 1px and 3px
        const size = 1 + Math.random() * 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Random position
        const posX = Math.random() * window.innerWidth;
        const posY = Math.random() * window.innerHeight;

        particle.style.left = `${posX}px`;
        particle.style.top = `${posY}px`;
        particle.style.opacity = 0.3 + Math.random() * 0.5;

        particlesContainer.appendChild(particle);

        // Animate floating particles
        anime({
            targets: particle,
            translateX: anime.random(-100, 100),
            translateY: anime.random(-100, 100),
            opacity: [
                { value: 0.1, duration: anime.random(1000, 3000) },
                { value: 0.6, duration: anime.random(1000, 3000) }
            ],
            scale: [
                { value: 0.8, duration: anime.random(1000, 2000) },
                { value: 1.2, duration: anime.random(1000, 2000) }
            ],
            delay: anime.random(0, 2000),
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine'
        });
    }
}

// Initialize
createBackgroundParticles();

// Apply glowing animation to wheel
anime({
    targets: '.wheel',
    boxShadow: [
        '0 0 5px rgba(139, 109, 67, 0.5), 0 0 10px rgba(139, 109, 67, 0.3)',
        '0 0 20px rgba(139, 109, 67, 0.8), 0 0 30px rgba(139, 109, 67, 0.5)',
        '0 0 5px rgba(139, 109, 67, 0.5), 0 0 10px rgba(139, 109, 67, 0.3)'
    ],
    duration: 2000,
    easing: 'easeInOutSine',
    loop: true
});