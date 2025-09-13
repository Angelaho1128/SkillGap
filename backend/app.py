import os
import PyPDF2
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import google.ai.generativelanguage as glm
import json
import re

app = Flask(__name__)
CORS(app)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-flash")

# Define schema
response_schema = glm.Schema(
    type=glm.Type.OBJECT,
    properties={
        "detected_skills": glm.Schema(
            type=glm.Type.ARRAY,
            items=glm.Schema(type=glm.Type.STRING),
            description="List of skills detected in the resume text."
        ),
        "missing_skills": glm.Schema(
            type=glm.Type.ARRAY,
            items=glm.Schema(type=glm.Type.STRING),
            description="List of suggested skills that are missing from the resume."
        ),
        "resources": glm.Schema(
            type=glm.Type.ARRAY,
            items=glm.Schema(
                type=glm.Type.OBJECT,
                properties={
                    "skill": glm.Schema(type=glm.Type.STRING),
                    "resource": glm.Schema(type=glm.Type.STRING)
                }
            ),
            description="List of resources to learn the missing skills."
        )
    }
)

def safe_json_parse(output):
    """Clean and safely parse JSON returned by Gemini."""
    try:
        return json.loads(output)
    except json.JSONDecodeError:
        cleaned = re.sub(r'[\x00-\x1f\x7f]', '', output)  # remove control chars
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            print("Still invalid JSON after cleaning:", e)
            print("Raw output was:", output[:500])
            return None

def extract_text_from_pdf(file):
    """Extracts text from a PDF file."""
    try:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

@app.route("/analyze", methods=["POST"])
def analyze_resume():
    print("/analyze endpoint called")
    try:
        text = ""
        job_field = ""

        # File upload
        if "resume" in request.files and request.files["resume"].filename:
            file = request.files["resume"]
            text = extract_text_from_pdf(file)
            job_field = request.form.get("job_field", "")
        else:  # JSON request
            data = request.get_json(silent=True)
            if data and "text" in data:
                text = data["text"]
                job_field = data.get("job_field", "")

        print("Extracted resume text:", text[:500])
        print("Target job field:", job_field)

        if not text.strip():
            return jsonify({
                "detected_skills": [],
                "missing_skills": [],
                "resources": [],
                "error": "No text could be extracted from the resume."
            }), 400

        prompt = f"""
        You are a resume analysis AI. Carefully analyze the resume text below and the target job field.
        Target job field: "{job_field}"
        Resume text: \"\"\"{text}\"\"\"
        
        Rules:
        1. Extract SKILLS EXPLICITLY listed in the resume (e.g., from a "Skills" section) AND infer ADDITIONAL skills from the candidate's EXPERIENCES (work, projects, volunteering, coursework), and return them as "detected_skills".
        Example: "Built a web app using React and Node" → ["React", "Node.js", "Web Development"].
        Example: "Led a 5-person team" → ["Leadership", "Team Management"].
        2. Based on the provided target job field: list 8 "missing_skills" that are commonly expected for that field but are NOT present in detected_skills.
        - Do NOT include any skill in missing_skills if it appears in detected_skills (explicit OR inferred).
        3. For each missing skill, add exactly ONE resource link (URL):
        - Must be a direct learning link (not a search results page).
        - Allowed domains: official docs (example: developer.mozilla.org, docs.python.org), course sites (example: coursera.org, udemy.com, freecodecamp.org, w3schools.com, khanacademy.org, edx.org).
        - Forbidden: google.com, search results, shortened/redirected links.
        4. If no skills are detected, return empty lists.
        5. Ensure JSON is strictly valid:
        - All strings use double quotes.
        - No trailing commas.
        - No extra text outside JSON.

        You must return ONLY valid JSON following this structure:
        {{
          "detected_skills": ["..."],
          "missing_skills": ["..."],
          "resources": [
            {{ "skill": "missing skill 1", "resource": "https://example.com" }}
          ]
        }}
        No commentary, no extra text — JSON only.
        """

        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )

        raw_output = response.text.strip()
        print("Gemini raw response:")
        print(raw_output)

        # Try parsing JSON safely
        try:
            analysis = json.loads(raw_output)
        except Exception:
            import re
            # Extract first JSON object from response
            match = re.search(r"\{.*\}", raw_output, re.DOTALL)
            if match:
                analysis = json.loads(match.group(0))
            else:
                raise ValueError("Failed to parse Gemini output.")

        return jsonify(analysis)

    except Exception as e:
        return jsonify({
            "detected_skills": [],
            "missing_skills": [],
            "resources": [],
            "error": str(e)
        }), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)
