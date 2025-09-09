const formData = new FormData();
if (resumeFile) {
  formData.append("resume", resumeFile);
} else {
  formData.append("text", resumeText);
}

try {
  const response = await fetch("http://127.0.0.1:5000/analyze", {
    method: "POST",
    body: resumeFile ? formData : JSON.stringify({ text: resumeText }),
    headers: resumeFile ? {} : { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data = await response.json();
  console.log("✅ Backend returned:", data);

  // Safely check if fields exist
  let html = "";

  if (data.detected_skills && data.detected_skills.length > 0) {
    html += `<h3>Detected Skills:</h3><ul>${data.detected_skills.map(s => `<li>${s}</li>`).join("")}</ul>`;
  }

  if (data.missing_skills && data.missing_skills.length > 0) {
    html += `<h3>Missing Skills:</h3><ul>${data.missing_skills.map(s => `<li>${s}</li>`).join("")}</ul>`;
  }

  if (data.resources && data.resources.length > 0) {
    html += `<h3>Resources:</h3><ul>${data.resources.map(r => `<li>${r.skill}: <a href="${r.resource}" target="_blank">${r.resource}</a></li>`).join("")}</ul>`;
  }

  if (!html) {
    html = "No skills detected.";
  }

  outputDiv.innerHTML = html; // ✅ Display properly
} catch (error) {
  console.error("❌ Error:", error);
  outputDiv.textContent = "Error analyzing resume.";

}
