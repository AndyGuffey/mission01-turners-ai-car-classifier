import { useState } from "react";
import axios from "axios";
import "./App.css";
import Header from "./components/Header";

function App() {
  // TODO: Fill in Azure custom Vision endpoint & prediction key
  const baseEndpoint = import.meta.env.VITE_CUSTOM_VISION_BASE_ENDPOINT;
  const predictionKey = import.meta.env.VITE_CUSTOM_VISION_PREDICTION_KEY;

  //? === USESTATES ===
  // State for either or selection
  const [inputType, setInputType] = useState("file"); // File or URL
  // store the selected file
  const [file, setFile] = useState(null);
  // IMG URl
  const [imageUrl, setImageUrl] = useState("");
  // IMG preview
  const [preview, setPreview] = useState(null);
  // store the classification result
  const [result, setResult] = useState(null);
  // Show loading status
  const [loading, setLoading] = useState(false);

  // Handle raido change
  const handleInputTypeChange = (event) => {
    setInputType(event.target.value);
    setFile(null);
    setImageUrl("");
    setPreview(null);
    setResult(null);
  };

  // Handle file input change
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      setPreview(URL.createObjectURL(selectedFile)); // Create img preview
    } else {
      setPreview(null);
    }
  };

  // Handle image URL input change
  const handleUrlChange = (event) => {
    const url = event.target.value;
    setImageUrl(url);
    setPreview(url || null);
    setFile(null);
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent page reload
    setLoading(true); // Show loading indicator
    setResult(null); // Clear previous results

    try {
      let res;
      if (inputType === "file" && file) {
        // Use /image endpoint for file upload
        const endpoint = `${baseEndpoint}/image`;
        // Convert file to ArrayBuffer for binary upload
        const imageData = await file.arrayBuffer();
        // Send POST request to Azure Custom Vision API
        res = await axios.post(endpoint, imageData, {
          headers: {
            "Content-Type": "application/octet-stream",
            "Prediction-Key": predictionKey,
          },
        });
      } else if (inputType === "url" && imageUrl) {
        // Use /url endpoint for image URL
        const endpoint = `${baseEndpoint}/url`;
        res = await axios.post(
          endpoint,
          { Url: imageUrl },
          {
            headers: {
              "Content-Type": "application/json",
              "Prediction-Key": predictionKey,
            },
          }
        );
      } else {
        setLoading(false);
        return;
      }

      // Store the result from Azure
      setResult(res.data);
    } catch (err) {
      // Store error message if request fails
      setResult({ error: err.message });
    }
    setLoading(false); // Hide loading indicator
  };

  // Get the top prediction if available
  const topPrediction =
    result && result.predictions && result.predictions.length > 0
      ? result.predictions.reduce((max, p) =>
          p.probability > max.probability ? p : max
        )
      : null;

  return (
    <>
      <Header />
      <div className="container">
        <h1 className="title">Tina Bot's Car Classifier</h1>
        <form className="classifier-form" onSubmit={handleSubmit}>
          <div className="input-type-group">
            <label className="input-type-label">
              <input
                type="radio"
                value="file"
                checked={inputType === "file"}
                onChange={handleInputTypeChange}
              />
              Upload File
            </label>
            <label className="input-type-label">
              <input
                type="radio"
                value="url"
                checked={inputType === "url"}
                onChange={handleInputTypeChange}
              />
              Paste Image Url
            </label>
          </div>
          {inputType === "file" && (
            <input
              className="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          )}

          {inputType === "url" && (
            <input
              className="url-input"
              type="text"
              placeholder="Paste image URL"
              value={imageUrl}
              onChange={handleUrlChange}
              style={{ width: "300px" }}
            />
          )}
          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? "Classifying..." : "Upload & Classify"}
          </button>
        </form>

        {/* Show image preview */}
        {preview && (
          <div className="preview-container" style={{ margin: "20px 0" }}>
            <img
              className="preview-img"
              src={preview}
              alt="Preview"
              style={{ maxWidth: "400px", borderRadius: "8px" }}
            />
          </div>
        )}

        {/* Show top prediction in a Cleaner way */}
        {topPrediction && (
          <div className="prediction-container">
            <h2 className="prediction-title">Tina Bot's Prediction:</h2>
            <p className="prediction-result">
              <strong>{topPrediction.tagName}</strong> (
              {(topPrediction.probability * 100).toFixed(2)}%)
            </p>
          </div>
        )}

        {/* Show error or raw result if needed */}
        {result && result.error && (
          <div className="error-message" style={{ color: "red" }}>
            <strong>Error:</strong> {result.error}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
