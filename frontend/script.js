async function analyzeResume() {
  const fileInput = document.getElementById("resumeFile");
  const textInput = document.getElementById("resumeInput").value;
  let response;

  try {
    if (fileInput.files.length > 0) {
      const formData = new FormData();
      formData.append("file", fileInput.files[0]);

      response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        body: formData
      });
    } else {
      response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput })
      });
    }

    const data = await response.json();
    displayResults(data);

  } catch (err) {
    document.getElementById("results").innerHTML = "<p>⚠️ Error analyzing resume.</p>";
  }
}

function displayResults(data) {
  let resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  if (data.error) {
    resultsDiv.innerHTML = `<p>⚠️ ${data.error}</p>`;
    return;
  }

  if (data.resume_skills && data.resume_skills.length > 0) {
    resultsDiv.innerHTML += `<h3>✅ Skills Found:</h3><ul>` +
      data.resume_skills.map(skill => `<li>${skill}</li>`).join("") +
      `</ul>`;
  } else {
    resultsDiv.innerHTML += `<p>No skills detected from resume.</p>`;
  }

  if (data.missing_skills && data.missing_skills.length > 0) {
    resultsDiv.innerHTML += `<h3>📌 Suggested Skills to Learn:</h3><ul>` +
      data.missing_skills.map(
        item => `<li>${item.skill} → ${item.resources.map(
          r => `<a href="${r}" target="_blank">Learn</a>`
        ).join(", ")}</li>`
      ).join("") +
      `</ul>`;
  } else {
    resultsDiv.innerHTML += `<p>🎉 You already have most in-demand skills!</p>`;
  }
}
