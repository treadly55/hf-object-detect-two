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
     * Handles the event when a user selects a file using the file input.
     * Reads the file as a Data URL and displays it in the image element.
     * @param {Event} event - The 'change' event object from the file input.
     */
    function handleImageUpload(event) {
        const file = event.target.files[0]; // Get the selected file (first file if multiple allowed)

        // Exit if no file was selected
        if (!file) {
            statusElement.textContent = 'No file selected.';
            return;
        }

        // Check if the selected file is an image
        if (!file.type.startsWith('image/')) {
            statusElement.textContent = 'Error: Please select an image file.';
            alert('Error: Please select an image file.'); // User feedback
            fileInput.value = ''; // Reset file input to allow re-selection of the same file if needed
            return;
        }

        // Clear any old bounding boxes from previous image/detection
        clearBoundingBoxes();
        statusElement.textContent = 'Loading image...';
        detectButton.disabled = true; // Disable button while loading new image

        const reader = new FileReader();

        // This function runs when the FileReader successfully reads the file
        reader.onload = (e) => {
            // e.target.result contains the image data as a base64 Data URL
            imageElement.src = e.target.result;
            statusElement.textContent = 'Image loaded. Ready to detect.';
            // Enable the detect button ONLY if the model has also loaded
            if (detector) {
                detectButton.disabled = false;
            }
        };

        // Handle potential errors during file reading
        reader.onerror = (e) => {
            console.error("File reading error:", e);
            statusElement.textContent = 'Error reading file.';
            detectButton.disabled = true; // Keep button disabled on error
        };

        // Initiate the file reading process
        reader.readAsDataURL(file);
    }

    // --- 4. Main Async Function to Load the AI Model ---
    async function loadModel() {
        detectButton.disabled = true; // Keep button disabled initially
        statusElement.textContent = 'Loading model... (may take a few seconds)';
        try {
            // Dynamically import the pipeline function and env object from the CDN
            const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1');

            // Disable checks for local models to prevent 404s
            env.allowLocalModels = false;

            // Load the object detection pipeline
            detector = await pipeline('object-detection', 'Xenova/yolos-tiny');

            statusElement.textContent = 'Model loaded. Please upload an image.';
            console.log('Detector loaded:', detector);
            // Keep button disabled here; enable it only after an image is loaded successfully
            // detectButton.disabled = false;

        } catch (error) {
            console.error('Error loading model:', error);
            statusElement.textContent = 'Failed to load model. See console for details.';
            // Keep button disabled if model loading fails
        }
    }

    // --- 5. Add Event Listeners ---

    // Add listener to the file input to handle user selection
    fileInput.addEventListener('change', handleImageUpload);

    // Add listener to the detect button
    detectButton.addEventListener('click', async () => {
        // Ensure the detector is ready
        if (!detector) {
            statusElement.textContent = 'Detector not ready. Please wait or reload.';
            return;
        }
        // Ensure there is a valid image source loaded (not the initial state or placeholder)
        // Check specifically for Data URLs starting with 'data:image/'
        if (!imageElement.src || !imageElement.src.startsWith('data:image/')) {
             statusElement.textContent = 'Please upload an image first.';
             return;
        }

        statusElement.textContent = 'Detecting objects...';
        detectButton.disabled = true; // Disable button during detection
        clearBoundingBoxes(); // Clear any previous boxes before running detection

        try {
            const imageSrc = imageElement.src; // Src will be the Data URL from file upload
            console.log(`Running detection on uploaded image...`);

            // Run the object detection pipeline
            const output = await detector(imageSrc, { threshold: 0.9, percentage: true });

            console.log('Detection Output:', output); // Log results to console
            statusElement.textContent = `Detection complete. Found ${output.length} objects. Check console for details.`;

            // --- Placeholder for Drawing Bounding Boxes ---
            // Later, we will loop through 'output' here and draw boxes visually.
            // e.g., output.forEach(obj => drawObjectBox(obj));
            // ---------------------------------------------

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