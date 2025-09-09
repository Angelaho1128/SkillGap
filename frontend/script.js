async function analyzeResume() {
  const resumeFile = document.getElementById("resumeFile").files[0];
  const resumeText = document.getElementById("resumeInput").value.trim();
  const outputDiv = document.getElementById("results");

  if (!outputDiv) {
    alert("❌ Could not find #results div in HTML.");
    return;
  }

  outputDiv.textContent = "⏳ Analyzing resume...";

  try {
    let response;

    if (resumeFile) {
      const formData = new FormData();
      formData.append("resume", resumeFile);

      response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        body: formData
      });
    } else if (resumeText) {
      response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: resumeText })
      });
    } else {
      outputDiv.textContent = "⚠️ Please upload a resume or paste text.";
      return;
    }

    console.log("📡 Raw response:", response);

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Backend returned JSON:", data);

    // 🔎 Debug: show raw JSON on the page too
    outputDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;

    // --- Now render nicely ---
    let html = "";

    if (Array.isArray(data.detected_skills) && data.detected_skills.length > 0) {
      html += `<h3>Detected Skills:</h3><ul>${data.detected_skills.map(s => `<li>${s}</li>`).join("")}</ul>`;
    }

    if (Array.isArray(data.missing_skills) && data.missing_skills.length > 0) {
      html += `<h3>Missing Skills:</h3><ul>${data.missing_skills.map(s => `<li>${s}</li>`).join("")}</ul>`;
    }

    if (Array.isArray(data.resources) && data.resources.length > 0) {
      html += `<h3>Resources:</h3><ul>${data.resources.map(r => `<li>${r.skill}: <a href="${r.resource}" target="_blank">${r.resource}</a></li>`).join("")}</ul>`;
    }

    if (!html) {
      html = "No skills detected.";
    }

    outputDiv.innerHTML = html;
  } catch (err) {
    console.error("❌ Error analyzing resume:", err);

    // Show detailed error on page too
    outputDiv.innerHTML = `
      <p><b>Error analyzing resume.</b></p>
      <pre>${err.message}</pre>
    `;
  }
}
