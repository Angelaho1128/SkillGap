import os
import PyPDF2
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import google.ai.generativelanguage as glm
import json

app = Flask(__name__)
# Allow CORS for all origins, necessary for local development
CORS(app)

# Configure the Gemini API with the environment variable
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Use a model that supports structured output
model = genai.GenerativeModel("gemini-1.5-pro")

# Define the schema for the desired JSON output
response_schema = glm.Schema(
    type=glm.Type.ARRAY,
    items=glm.Schema(
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
        },
    )
)

def extract_text_from_pdf(file):
    """
    Extracts text from a PDF file.
    """
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
        
        # Check if the request contains a file
        if "resume" in request.files and request.files["resume"].filename:
            file = request.files["resume"]
            text = extract_text_from_pdf(file)
            job_field = request.form.get("job_field", "")
        # If no file, check if it's a JSON request
        else:
            data = request.get_json(silent=True)
            if data and "text" in data:
                text = data["text"]
                job_field = data.get("job_field", "")

        print("Extracted resume text:")
        print(text[:500])
        print("Target job field:", job_field)

        if not text.strip():
            return jsonify({
                "detected_skills": [],
                "missing_skills": [],
                "resources": [],
                "error": "No text could be extracted from the resume."
            }), 400

        # The prompt is now more specific with the job field.
        prompt = f"""
        You are a career coach AI. Analyze the following resume text.
        The candidate is targeting the field: "{job_field}".
        Based on the content, identify key skills, suggest a few missing skills important for this field,
        and provide a single resource URL for each missing skill.

        Resume text:
        {text}
        """

        # Call the model with the structured response schema
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=response_schema
            )
        )

        raw_output = response.text.strip()
        print("Gemini raw response:")
        print(raw_output)

        analysis = json.loads(raw_output)

        # The API returns a list, so we take the first item
        return jsonify(analysis[0])

    except Exception as e:
        return jsonify({
            "detected_skills": [],
            "missing_skills": [],
            "resources": [],
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(port=5000, debug=True)
