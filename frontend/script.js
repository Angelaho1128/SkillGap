function clearInput() {
  document.getElementById("resumeFile").value = null;
  document.getElementById("resumeInput").value = "";
  document.getElementById("jobField").value = "";
  document.getElementById("summaryText").textContent = 'Your analysis will appear here after you click "Analyze".';
  document.getElementById("detectedList").innerHTML = '<li class="text-gray-400">No results yet.</li>';
  document.getElementById("missingList").innerHTML = '<li class="text-gray-400">No results yet.</li>';
  document.getElementById("resourcesList").innerHTML = '<li class="text-gray-400">No resources yet.</li>';
}

async function analyzeResume() {
  const resumeFile = document.getElementById("resumeFile").files[0];
  const resumeText = document.getElementById("resumeInput").value.trim();
  const jobField = document.getElementById("jobField") ? document.getElementById("jobField").value.trim() : "";
  const analyzeButton = document.getElementById("analyzeButton");

  // UI elements
  const summaryText = document.getElementById("summaryText");
  const detectedList = document.getElementById("detectedList");
  const missingList = document.getElementById("missingList");
  const resourcesList = document.getElementById("resourcesList");

  // Validate input
  if (!resumeFile && !resumeText) {
    summaryText.innerHTML = '<span class="text-red-500 font-medium">⚠️ Please upload a resume or paste text.</span>';
    return;
  }

  // Loading state
  summaryText.innerHTML = '<span class="text-blue-500 animate-pulse">⏳ Analyzing resume...</span>';
  detectedList.innerHTML = '';
  missingList.innerHTML = '';
  resourcesList.innerHTML = '';
  if (analyzeButton) {
    analyzeButton.disabled = true;
    analyzeButton.textContent = "Analyzing...";
  }

  try {
    let response;

    if (resumeFile) {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("job_field", jobField);

      response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        body: formData,
      });
    } else {
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server returned ${response.status}`);
    }

    const data = await response.json();

    // Update summary
    const detectedCount = Array.isArray(data.detected_skills) ? data.detected_skills.length : 0;
    const missingCount = Array.isArray(data.missing_skills) ? data.missing_skills.length : 0;
    summaryText.innerHTML = `<span class="font-medium text-gray-700">${detectedCount} detected • ${missingCount} suggested gaps</span>
      <div class="text-sm text-gray-500 mt-1">${jobField ? `Target: ${jobField}` : 'No target field specified'}</div>`;

    // Fill detected skills
    if (data.detected_skills && data.detected_skills.length > 0) {
      detectedList.innerHTML = data.detected_skills.map(s => `<li>${escapeHtml(s)}</li>`).join('');
    } else {
      detectedList.innerHTML = '<li class="text-gray-400">No detected skills.</li>';
    }

    // Fill missing skills
    if (data.missing_skills && data.missing_skills.length > 0) {
      missingList.innerHTML = data.missing_skills.map(s => `<li>${escapeHtml(s)}</li>`).join('');
    } else {
      missingList.innerHTML = '<li class="text-gray-400">No missing skills suggested.</li>';
    }

    // Fill resources
    if (data.resources && data.resources.length > 0) {
      resourcesList.innerHTML = data.resources.map(r => {
        const skill = escapeHtml(r.skill || '');
        const link = escapeHtml(r.resource || '');
        return `<li><strong>${skill}</strong>: <a href="${link}" target="_blank" class="text-blue-600 hover:underline">${link}</a></li>`;
      }).join('');
    } else {
      resourcesList.innerHTML = '<li class="text-gray-400">No resources provided.</li>';
    }

  } catch (err) {
    console.error("❌ Error analyzing resume:", err);
    summaryText.innerHTML = `<span class="text-red-500 font-medium">❌ Error analyzing resume: ${escapeHtml(err.message || String(err))}</span>`;
    detectedList.innerHTML = '<li class="text-gray-400">—</li>';
    missingList.innerHTML = '<li class="text-gray-400">—</li>';
    resourcesList.innerHTML = '<li class="text-gray-400">—</li>';
  } finally {
    if (analyzeButton) {
      analyzeButton.disabled = false;
      analyzeButton.textContent = "Analyze Resume";
    }
  }
}

// small helper to avoid injecting raw HTML (basic escaping)
function escapeHtml(str) {
  if (!str) return '';
  return str.replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
}
