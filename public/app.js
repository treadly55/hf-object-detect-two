// Wait for the DOM to be fully loaded before running the script
// (Good practice, though type="module" often defers execution anyway)
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Get References to HTML Elements ---
    const statusElement = document.getElementById('status');
    const imageElement = document.getElementById('test-image');
    const detectButton = document.getElementById('detect-button');
    // const imageContainer = document.getElementById('image-container'); // We don't need this yet, but will later for drawing

    // Reference to the AI model pipeline
    let detector = null;

    // --- 2. Load the AI Model ---
    async function loadModel() {
        statusElement.textContent = 'Loading model... (may take a few seconds)';
        try {
            // Dynamically import the pipeline function from the CDN
            const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1');

            // Load the object detection pipeline with the specific model
            // This downloads the model to the browser cache
            detector = await pipeline('object-detection', 'Xenova/yolos-tiny');

            statusElement.textContent = 'Model loaded. Ready to detect!';
            detectButton.disabled = false; // Enable the button now
            console.log('Detector loaded:', detector);
        } catch (error) {
            console.error('Error loading model:', error);
            statusElement.textContent = 'Failed to load model. See console for details.';
        }
    }

    // --- 3. Add Button Click Handler ---
    detectButton.addEventListener('click', async () => {
        if (!detector) {
            statusElement.textContent = 'Detector not ready. Please wait or reload.';
            return; // Exit if the model isn't loaded
        }

        statusElement.textContent = 'Detecting objects...';
        detectButton.disabled = true; // Disable button during detection

        try {
            const imageSrc = imageElement.src;
            if (!imageSrc) {
                throw new Error("Image source is missing.");
            }

            console.log(`Running detection on: ${imageSrc.substring(0, 100)}...`); // Log part of src

            // Run detection. Threshold=0.9 means 90% confidence needed.
            // percentage=true gives box coordinates as percentages (useful later).
            const output = await detector(imageSrc, { threshold: 0.9, percentage: true });

            console.log('Detection Output:', output); // Log the results array
            statusElement.textContent = `Detection complete. Found ${output.length} objects. Check console for details.`;

        } catch (error) {
            console.error('Error during detection:', error);
            statusElement.textContent = 'Detection failed. See console for details.';
        } finally {
            // Re-enable the button whether detection succeeded or failed
            detectButton.disabled = false;
        }
    });

    // --- 4. Start Model Loading Immediately ---
    loadModel();

}); // End of DOMContentLoaded listener