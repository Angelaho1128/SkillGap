// Helper: escape HTML to avoid injected markup
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Helper: shorten visible URL text (keeps full href clickable)
function shortenUrl(url) {
  try {
    const u = new URL(url);
    let host = u.hostname.replace(/^www\./, "");
    return `${host}/…`;
  } catch {
    return url.length > 40 ? url.slice(0, 40) + "…" : url;
  }
}

function renderResults(data) {
  const oldError = document.getElementById("errorMessage");
  if (oldError) oldError.remove();

  const detectedList = document.getElementById("detectedList");
  const missingList = document.getElementById("missingList");

  // detected skills
  if (Array.isArray(data.detected_skills) && data.detected_skills.length > 0) {
    detectedList.innerHTML = data.detected_skills
      .map(s => `<li>${escapeHtml(s)}</li>`)
      .join("");
  } else {
    detectedList.innerHTML = '<li class="text-gray-400">No detected skills.</li>';
  }

  // missing skills + resource below each skill
  if (Array.isArray(data.missing_skills) && data.missing_skills.length > 0) {
    missingList.innerHTML = data.missing_skills.map(skill => {
      // try case-insensitive exact match first, else partial match
      const resources = Array.isArray(data.resources) ? data.resources : [];
      const skillLower = String(skill).toLowerCase();

      let resource = resources.find(r => (r.skill || "").toLowerCase() === skillLower)
        || resources.find(r => (r.skill || "").toLowerCase().includes(skillLower))
        || resources.find(r => (r.resource || "").toLowerCase().includes(skillLower));

      // Build resource HTML (single link under the skill)
      const resourceHtml = resource && resource.resource
        ? `<div class="ml-4 text-sm text-blue-600 break-words mt-1">
             🔗 <a href="${escapeHtml(resource.resource)}" target="_blank" class="hover:underline">
               ${escapeHtml(shortenUrl(resource.resource))}
             </a>
           </div>`
        : "";

      return `<li>
                <div class="font-medium">${escapeHtml(skill)}</div>
                ${resourceHtml}
              </li>`;
    }).join("");
  } else {
    missingList.innerHTML = '<li class="text-gray-400">No missing skills suggested.</li>';
  }
}

function clearInput() {
  // clear text input + textarea + file upload
  document.getElementById("jobField").value = "";
  document.getElementById("resumeInput").value = "";
  document.getElementById("resumeFile").value = "";

  // clear results lists
  document.getElementById("detectedList").innerHTML =
    '<li class="text-gray-400">No results yet.</li>';
  document.getElementById("missingList").innerHTML =
    '<li class="text-gray-400">No results yet.</li>';

  // clear any error messages
  const oldError = document.getElementById("errorMessage");
  if (oldError) oldError.remove();
}


// Main function: called by button
async function analyzeResume() {
  const resumeFile = document.getElementById("resumeFile").files[0];
  const resumeText = document.getElementById("resumeInput").value.trim();
  const jobFieldInput = document.getElementById("jobField");
  const jobField = jobFieldInput ? jobFieldInput.value.trim() : "";
  const analyzeButton = document.getElementById("analyzeButton");

  // remove any existing inline error
  const oldError = document.getElementById("errorMessage");
  if (oldError) oldError.remove();

  // validate
  if (!resumeFile && !resumeText) {
    const err = document.createElement("p");
    err.id = "errorMessage";
    err.className = "text-red-500 text-center mt-2";
    err.textContent = "⚠️ Please upload a resume or paste text.";
    analyzeButton.insertAdjacentElement("afterend", err);
    return;
  }

  // set loading state on button only
  const originalText = analyzeButton.textContent;
  analyzeButton.disabled = true;
  analyzeButton.textContent = "⏳ Analyzing resume...";

  // clear previous results while keeping cards present
  document.getElementById("detectedList").innerHTML = "";
  document.getElementById("missingList").innerHTML = "";

  try {
    let response;
    if (resumeFile) {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("job_field", jobField);

      response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        body: formData
      });
    } else {
      response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: resumeText, job_field: jobField })
      });
    }

    if (!response.ok) {
      // try to parse error body (if JSON)
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `Server returned ${response.status}`);
    }

    const data = await response.json();
    // data expected: { detected_skills: [...], missing_skills: [...], resources: [...] }
    renderResults(data);

  } catch (err) {
    console.error("❌ Error analyzing resume:", err);
    // show error right below button
    const errorEl = document.createElement("p");
    errorEl.id = "errorMessage";
    errorEl.className = "text-red-500 text-center mt-2";
    errorEl.textContent = `❌ Error analyzing resume: ${err.message || String(err)}`;
    analyzeButton.insertAdjacentElement("afterend", errorEl);
    // keep results cleared or show placeholders
    document.getElementById("detectedList").innerHTML = '<li class="text-gray-400">—</li>';
    document.getElementById("missingList").innerHTML = '<li class="text-gray-400">—</li>';
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.textContent = originalText;
  }
}
