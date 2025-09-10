async function analyzeResume() {
  const resumeFile = document.getElementById("resumeFile").files[0];
  const resumeText = document.getElementById("resumeInput").value.trim();
  const jobField = document.getElementById("jobField")
    ? document.getElementById("jobField").value.trim()
    : "";
  const outputDiv = document.getElementById("results");
  const analyzeButton = document.getElementById("analyzeButton");

  if (!resumeFile && !resumeText) {
    outputDiv.innerHTML =
      '<p class="text-red-500 text-center">⚠️ Please upload a resume or paste text.</p>';
    return;
  }

  outputDiv.innerHTML =
    '<p class="text-blue-500 text-center animate-pulse">⏳ Analyzing resume...</p>';
  if (analyzeButton) {
    analyzeButton.disabled = true;
    analyzeButton.textContent = "Analyzing...";
  }

  try {
    let response;

    if (resumeFile) {
      // 🔹 If PDF file uploaded
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("job_field", jobField);

      response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        body: formData,
      });
    } else {
      // 🔹 If text pasted
      response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: resumeText,
          job_field: jobField,
        }),
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server returned ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Backend returned:", data);

    // --- Render results ---
    let html = "";
    if (data.detected_skills && data.detected_skills.length > 0) {
      html += `<h3 class="text-xl font-semibold mt-6 mb-2 text-gray-700">✅ Detected Skills:</h3><ul class="list-disc list-inside space-y-1 text-gray-600">${data.detected_skills.map(
        (s) => `<li>${s}</li>`
      ).join("")}</ul>`;
    }
    if (data.missing_skills && data.missing_skills.length > 0) {
      html += `<h3 class="text-xl font-semibold mt-6 mb-2 text-gray-700">💡 Missing Skills Suggestions:</h3><ul class="list-disc list-inside space-y-1 text-gray-600">${data.missing_skills.map(
        (s) => `<li>${s}</li>`
      ).join("")}</ul>`;
    }
    if (data.resources && data.resources.length > 0) {
      html += `<h3 class="text-xl font-semibold mt-6 mb-2 text-gray-700">📚 Learning Resources:</h3><ul class="list-disc list-inside space-y-1 text-blue-600">${data.resources.map(
        (r) =>
          `<li>${r.skill}: <a href="${r.resource}" target="_blank" class="hover:underline">${r.resource}</a></li>`
      ).join("")}</ul>`;
    }
    if (!html) {
      html =
        '<p class="text-gray-500 text-center">No relevant skills were detected in the resume text.</p>';
    }
    outputDiv.innerHTML = html;
  } catch (err) {
    console.error("❌ Error analyzing resume:", err);
    outputDiv.innerHTML = `<p class="text-red-500 text-center">❌ Error analyzing resume: ${err.message}</p>`;
  } finally {
    if (analyzeButton) {
      analyzeButton.disabled = false;
      analyzeButton.textContent = "Analyze Resume";
    }
  }
}
