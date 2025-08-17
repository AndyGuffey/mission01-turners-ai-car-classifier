import { useState } from "react";
import axios from "axios";
import "./App.css";
import Header from "./components/Header";

function App() {
  // TODO: Fill in Azure custom Vision endpoint & prediction key
  // const baseEndpoint = import.meta.env.VITE_CUSTOM_VISION_BASE_ENDPOINT;
  // const predictionKey = import.meta.env.VITE_CUSTOM_VISION_PREDICTION_KEY;

  //? ==================
  //? === USESTATES ===
  //? ==================

  // Track if user is uploading a file or using image URL
  const [inputType, setInputType] = useState("file"); // Default selection is file
  // store the selected file (only if using file upload)
  const [file, setFile] = useState(null);
  // store image url (if using file upload)
  const [imageUrl, setImageUrl] = useState("");
  // Store preview image (file or url)
  const [preview, setPreview] = useState(null);
  // store the classification result from backend
  const [result, setResult] = useState(null);
  // Track loading state for user feedback
  const [loading, setLoading] = useState(false);

  //? =======================
  //? === EVENT HANDLERS ===
  //? =======================

  // Handle switching between file upload and URl input
  const handleInputTypeChange = (event) => {
    setInputType(event.target.value);
    setFile(null);
    setImageUrl("");
    setPreview(null);
    setResult(null);
  };

  // Handle file selection and set preview
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      setPreview(URL.createObjectURL(selectedFile)); // Show preview for selected file
    } else {
      setPreview(null);
    }
  };

  // Handle image URL input and set preview
  const handleUrlChange = (event) => {
    const url = event.target.value;
    setImageUrl(url);
    setPreview(url || null); //Show preview if URL is Present
    setFile(null); // Clear the file if switching to URL
  };

  // =========================
  // == OLD FORM SUBMISSION ==
  // =========================

  // NOTE: Direct to Azure Custom Vision - was unable to use when uploaded to cloud service
  // left for refrence- currently using backend to handle API call & keys

  // // Handle form submission
  // const handleSubmit = async (event) => {
  //   event.preventDefault(); // Prevent page reload
  //   setLoading(true); // Show loading indicator
  //   setResult(null); // Clear previous results

  //   try {
  //     let res;
  //     if (inputType === "file" && file) {
  //       // Use /image endpoint for file upload
  //       const endpoint = `${baseEndpoint}/image`;
  //       // Convert file to ArrayBuffer for binary upload
  //       const imageData = await file.arrayBuffer();
  //       // Send POST request to Azure Custom Vision API
  //       res = await axios.post(endpoint, imageData, {
  //         headers: {
  //           "Content-Type": "application/octet-stream",
  //           "Prediction-Key": predictionKey,
  //         },
  //       });
  //     } else if (inputType === "url" && imageUrl) {
  //       // Use /url endpoint for image URL
  //       const endpoint = `${baseEndpoint}/url`;
  //       res = await axios.post(
  //         endpoint,
  //         { Url: imageUrl },
  //         {
  //           headers: {
  //             "Content-Type": "application/json",
  //             "Prediction-Key": predictionKey,
  //           },
  //         }
  //       );
  //     } else {
  //       setLoading(false);
  //       return;
  //     }

  //     // Store the result from Azure
  //     setResult(res.data);
  //   } catch (err) {
  //     // Store error message if request fails
  //     setResult({ error: err.message });
  //   }
  //   setLoading(false); // Hide loading indicator
  // };
  //* ============================
  //* == CURRENT FORM SUBMISSION ==
  //* ============================
  //* Sends IMG or file to backend, which handles the calls to Azure Custom Vision

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      let res;
      // Backend URL
      const backendUrl =
        "https://m1-backend-api-gbgscre3aubmevhe.newzealandnorth-01.azurewebsites.net/classify";

      if (inputType === "file" && file) {
        // Convert file to base64 for backend
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );
        // POST to backend with the IMGData
        res = await axios.post(backendUrl, { imageData: base64 });
      } else if (inputType === "url" && imageUrl) {
        // POST to backend with IMGUrl
        res = await axios.post(backendUrl, { imageUrl });
      } else {
        setLoading(false);
        return;
      }

      // Store the results from backend (Called Azure)
      setResult(res.data);
    } catch (err) {
      // Store error message if request fails
      setResult({ error: err.message });
    }
    setLoading(false);
  };

  // =========================
  // == PROCESS THE RESULTS ==
  // =========================

  // Get highest probablity from the result
  const topPrediction =
    result && result.predictions && result.predictions.length > 0
      ? result.predictions.reduce((max, p) =>
          p.probability > max.probability ? p : max
        )
      : null;

  //* =================
  //* ==   RENDER    ==
  //* =================

  return (
    <>
      <Header />
      <div className="container">
        <h1 className="title">Tina Bot's Car Classifier</h1>
        {/* Form for file or URL upload */}
        <form className="classifier-form" onSubmit={handleSubmit}>
          <div className="input-type-group">
            {/* Radio button for file upload */}
            <label className="input-type-label">
              <input
                type="radio"
                value="file"
                checked={inputType === "file"}
                onChange={handleInputTypeChange}
              />
              Upload File
            </label>
            {/* Radio button for image URL */}
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
          {/* File input */}
          {inputType === "file" && (
            <input
              className="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          )}

          {/* URL input */}
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
          {/* Submit Button */}
          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? "Classifying..." : "Upload & Classify"}
          </button>
        </form>

        {/* Show image preview if available  */}
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

        {/* Show top prediction for user */}
        {topPrediction && (
          <div className="prediction-container">
            <h2 className="prediction-title">Tina Bot's Prediction:</h2>
            <p className="prediction-result">
              <strong>{topPrediction.tagName}</strong> (
              {(topPrediction.probability * 100).toFixed(2)}%)
            </p>
          </div>
        )}

        {/* Show error if any*/}
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
