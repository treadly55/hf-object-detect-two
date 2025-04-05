// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Get References to HTML Elements ---
    const statusElement = document.getElementById('status');
    const imageElement = document.getElementById('test-image');      // The <img> tag
    const detectButton = document.getElementById('detect-button');   // The <button>
    const imageContainer = document.getElementById('image-container'); // The <div> containing the image
    const fileInput = document.getElementById('image-upload');     // The <input type="file">

    // --- 2. Global variable to hold the loaded model pipeline ---
    let detector = null;

    // --- 3. Helper Functions ---

    /**
     * Removes any previously drawn bounding boxes from the image container.
     */
    function clearBoundingBoxes() {
        // Find all elements with the class 'bounding-box' inside the container
        const existingBoxes = imageContainer.querySelectorAll('.bounding-box');
        // Remove each found box
        existingBoxes.forEach(box => box.remove());
    }

    /**
     * Draws a bounding box and label for a single detected object.
     * @param {object} detectedObject - Object containing label, score, and box coordinates.
     */
    function drawObjectBox(detectedObject) {
        const { label, score, box } = detectedObject;
        const { xmax, xmin, ymax, ymin } = box; // Expecting percentages (0-1)

        // Generate a random color for the box and label background
        const color = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, 0);

        // Create the bounding box div
        const boxElement = document.createElement('div');
        boxElement.className = 'bounding-box'; // CSS class for styling
        Object.assign(boxElement.style, {
            borderColor: color,
            left: (100 * xmin) + '%',
            top: (100 * ymin) + '%',
            width: (100 * (xmax - xmin)) + '%',
            height: (100 * (ymax - ymin)) + '%',
        });

        // Create the label span
        const labelElement = document.createElement('span');
        labelElement.textContent = `${label}: ${Math.floor(score * 100)}%`;
        labelElement.className = 'bounding-box-label'; // CSS class for styling
        labelElement.style.backgroundColor = color; // Match background to border color

        // Append the label to the box, and the box to the main image container
        boxElement.appendChild(labelElement);
        imageContainer.appendChild(boxElement); // Appends the box to the div wrapping the image
    }

    /**
     * Handles the event when a user selects a file using the file input.
     * Reads the file as a Data URL and displays it in the image element.
     * @param {Event} event - The 'change' event object from the file input.
     */
    function handleImageUpload(event) {
        const file = event.target.files[0]; // Get the selected file

        if (!file) {
            statusElement.textContent = 'No file selected.';
            return; // Exit if no file was chosen
        }

        if (!file.type.startsWith('image/')) {
            statusElement.textContent = 'Error: Please select an image file.';
            alert('Error: Please select an image file.');
            fileInput.value = ''; // Reset file input
            return;
        }

        clearBoundingBoxes(); // Clear old boxes before loading new image
        statusElement.textContent = 'Loading image...';
        detectButton.disabled = true; // Disable button while loading new image

        const reader = new FileReader();

        reader.onload = (e) => {
            imageElement.src = e.target.result; // Set image source to Data URL
            statusElement.textContent = 'Image loaded. Ready to detect.';
            // Enable detect button only if the model is also loaded
            if (detector) {
                detectButton.disabled = false;
            }
        };

        reader.onerror = (e) => {
            console.error("File reading error:", e);
            statusElement.textContent = 'Error reading file.';
            detectButton.disabled = true;
        };

        reader.readAsDataURL(file); // Start reading
    }

    // --- 4. Main Async Function to Load the AI Model ---
    async function loadModel() {
        detectButton.disabled = true; // Keep button disabled initially
        statusElement.textContent = 'Loading model... (may take a few seconds)';
        try {
            const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1');
            env.allowLocalModels = false; // Prevent checking local paths -> no 404s
            detector = await pipeline('object-detection', 'Xenova/yolos-tiny');
            statusElement.textContent = 'Model loaded. Please upload an image.';
            console.log('Detector loaded:', detector);
            // Keep button disabled; it will be enabled by handleImageUpload if model is ready

        } catch (error) {
            console.error('Error loading model:', error);
            statusElement.textContent = 'Failed to load model. See console for details.';
            // Keep button disabled if model loading fails
        }
    }

    // --- 5. Add Event Listeners ---

    // Listener for file input changes
    fileInput.addEventListener('change', handleImageUpload);

    // Listener for the detect button click
    detectButton.addEventListener('click', async () => {
        // Guard clauses: Ensure model is loaded and an image is present
        if (!detector) {
            statusElement.textContent = 'Detector not ready. Please wait or reload.';
            return;
        }
        if (!imageElement.src || !imageElement.src.startsWith('data:image/')) {
             statusElement.textContent = 'Please upload an image first.';
             return;
        }

        statusElement.textContent = 'Detecting objects...';
        detectButton.disabled = true; // Disable button during detection
        clearBoundingBoxes(); // Clear any previous boxes before drawing new ones

        try {
            const imageSrc = imageElement.src;
            console.log(`Running detection on uploaded image...`);

            // Perform detection
            const output = await detector(imageSrc, { threshold: 0.9, percentage: true });

            console.log('Detection Output:', output);

            // --- Draw Bounding Boxes (Limit to 10 for MVP) ---
            const limitedOutput = output.slice(0, 10);
            limitedOutput.forEach(detectedObject => {
                drawObjectBox(detectedObject); // Call helper function for each object
            });
            // --- End Bounding Box Drawing ---

            // Update status message based on results
            if (output.length > 0) {
                 statusElement.textContent = `Detection complete. Displaying top ${limitedOutput.length} of ${output.length} objects found.`;
            } else {
                 statusElement.textContent = `Detection complete. No objects found.`;
            }

        } catch (error) {
            console.error('Error during detection:', error);
            statusElement.textContent = 'Detection failed. See console for details.';
        } finally {
            // Re-enable the button regardless of success or failure
            detectButton.disabled = false;
        }
    });

    // --- 6. Initial Load ---
    // Start loading the AI model as soon as the script runs
    loadModel();

}); // End of DOMContentLoaded listener