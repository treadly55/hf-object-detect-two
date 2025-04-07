document.addEventListener('DOMContentLoaded', () => {

    const statusElement = document.getElementById('status');
    const imageElement = document.getElementById('test-image');
    const detectButton = document.getElementById('detect-button');
    const imageContainer = document.getElementById('image-container');
    const fileInput = document.getElementById('image-upload');
    const detectionListElement = document.getElementById('detection-list'); // Corrected ID

    let detector = null;

    function clearBoundingBoxes() {
        const existingBoxes = imageContainer.querySelectorAll('.bounding-box');
        existingBoxes.forEach(box => box.remove());
    }

    function drawObjectBox(detectedObject) {
        const { label, score, box } = detectedObject;
        const { xmax, xmin, ymax, ymin } = box;
        const color = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, 0);
        const boxElement = document.createElement('div');
        boxElement.className = 'bounding-box';
        Object.assign(boxElement.style, {
            borderColor: color,
            left: (100 * xmin) + '%',
            top: (100 * ymin) + '%',
            width: (100 * (xmax - xmin)) + '%',
            height: (100 * (ymax - ymin)) + '%',
        });
        const labelElement = document.createElement('span');
        labelElement.textContent = `${label}: ${Math.floor(score * 100)}%`;
        labelElement.className = 'bounding-box-label';
        labelElement.style.backgroundColor = color;
        boxElement.appendChild(labelElement);
        imageContainer.appendChild(boxElement);
    }

    function handleImageUpload(event) {
        const file = event.target.files[0];
        // Hide list on new upload attempt? This might not be desired UX. Consider removing.
        // detectionListElement.style.display = "none";

        if (!file) {
            statusElement.textContent = 'No file selected.';
            return;
        }
        if (!file.type.startsWith('image/')) {
            statusElement.textContent = 'Error: Please select an image file.';
            alert('Error: Please select an image file.');
            fileInput.value = '';
            return;
        }
        clearBoundingBoxes();
        if (detectionListElement) { // Check if element exists before clearing
             detectionListElement.innerHTML = '';
        }
        statusElement.textContent = 'Loading image...';
        detectButton.disabled = true;
        const reader = new FileReader();
        reader.onload = (e) => {
            imageElement.src = e.target.result;
            statusElement.textContent = 'Image loaded. Ready to detect.';
            if (detector) {
                detectButton.disabled = false;
            }
        };
        reader.onerror = (e) => {
            console.error("File reading error:", e);
            statusElement.textContent = 'Error reading file.';
            detectButton.disabled = true;
        };
        reader.readAsDataURL(file);
    }

    async function loadModel() {
        detectButton.disabled = true;
        statusElement.textContent = 'Loading model... (may take a few seconds)';
        try {
            const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1');
            env.allowLocalModels = false;
            detector = await pipeline('object-detection', 'Xenova/yolos-tiny');
            statusElement.textContent = 'Model loaded. Ready to detect initial image or upload.'; // Plan A Change
            console.log('Detector loaded:', detector);
            detectButton.disabled = false; // Plan A Change: Enable button now
        } catch (error) {
            console.error('Error loading model:', error);
            statusElement.textContent = 'Failed to load model. See console for details.';
        }
    }

    fileInput.addEventListener('change', handleImageUpload);

    detectButton.addEventListener('click', async () => {
        if (!detector) {
            statusElement.textContent = 'Detector not ready. Please wait or reload.';
            return;
        }
        // Plan A Change: Check if image src is valid and image has loaded dimensions
        if (!imageElement.src || imageElement.naturalWidth === 0) {
             statusElement.textContent = 'No image loaded or ready for detection.'; // Plan A Change: Updated message
             return;
        }

        statusElement.textContent = 'Detecting objects...';
        detectButton.disabled = true;
        clearBoundingBoxes();
        if (detectionListElement) { // Check if element exists before clearing
            detectionListElement.innerHTML = '';
        }

        try {
            const imageSrc = imageElement.src;
            // Log slightly differently depending on source? Optional.
            console.log(`Running detection on ${imageSrc.startsWith('data:image/') ? 'uploaded' : 'initial'} image...`);

            const output = await detector(imageSrc, { threshold: 0.5, percentage: true });
            console.log('Detection Output:', output);

            const limitedOutput = output.slice(0, 10);

            if (limitedOutput.length > 0) {
                limitedOutput.forEach(detectedObject => {
                    drawObjectBox(detectedObject);
                    const { label, score } = detectedObject;
                    const listItem = document.createElement('li');
                    listItem.textContent = `${label}: ${Math.floor(score * 100)}%`;
                    if (detectionListElement) { // Check if element exists before appending
                        detectionListElement.appendChild(listItem);
                    }
                });
                 // Consider setting display style for list element here if needed, outside the loop
                 // if (detectionListElement) detectionListElement.style.display = "block"; // Or remove if CSS handles it
            } else {
                 if (detectionListElement) { // Check if element exists before appending
                     const listItem = document.createElement('li');
                     listItem.textContent = 'No objects detected above threshold.';
                     detectionListElement.appendChild(listItem);
                     // Consider setting display style here too
                     // detectionListElement.style.display = "block"; // Or remove if CSS handles it
                 }
            }

            if (output.length > 0) {
                 statusElement.textContent = `Detection complete. Displaying top ${limitedOutput.length} of ${output.length} objects found.`;
            } else {
                 statusElement.textContent = `Detection complete. No objects found.`;
            }

        } catch (error) {
            console.error('Error during detection:', error);
            statusElement.textContent = 'Detection failed. See console for details.';
             if (detectionListElement) { // Check if element exists before clearing
                detectionListElement.innerHTML = '<li>Error during detection.</li>';
             }
        } finally {
            detectButton.disabled = false;
        }
    });

    loadModel();

});