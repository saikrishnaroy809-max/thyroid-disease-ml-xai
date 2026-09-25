import React, { useEffect, useState } from "react";
import "./index.css";

const API_URL = "http://localhost:5000";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");

  const [dataset, setDataset] = useState(null);
  const [preprocess, setPreprocess] = useState(null);
  const [models, setModels] = useState([]);
  const [features, setFeatures] = useState([]);

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [login, setLogin] = useState({
    username: "",
    password: "",
  });

  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const res = await fetch(`${API_URL}/api/status`);
      const data = await res.json();

      setDataset(data.dataset);
      setModels(data.models || []);
      setFeatures(data.features || []);

      if (data.features) {
        const initial = {};
        data.features.forEach((f) => {
          initial[f.name] = "";
        });
        setFormData(initial);
      }
    } catch (error) {
      console.log("Backend not connected");
    }
  }

  function handleLogin(e) {
    e.preventDefault();

    if (
      login.username === "admin" &&
      login.password === "admin123"
    ) {
      setLoggedIn(true);
      setMessage("");
    } else {
      setMessage("Invalid username or password");
    }
  }

  async function uploadDataset(e) {
    const file = e.target.files[0];

    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setDataset(data.dataset);
      setFeatures(data.features || []);

      const initial = {};
      (data.features || []).forEach((f) => {
        initial[f.name] = "";
      });

      setFormData(initial);
      setMessage("Dataset uploaded successfully");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function preprocessDataset() {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/preprocess`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setPreprocess(data);
      setMessage("Dataset preprocessing completed");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function trainModels() {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/train`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setModels(data.models || []);
      setMessage("Machine learning models trained successfully");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function predictDisease(e) {
    e.preventDefault();

    setLoading(true);
    setPrediction(null);

    try {
      const res = await fetch(`${API_URL}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setPrediction(data);
      setMessage("Prediction completed");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function updateForm(name, value) {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function logout() {
    setLoggedIn(false);
    setActivePage("dashboard");
  }

  if (!loggedIn) {
    return (
      <div className="
