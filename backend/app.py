import os
import PyPDF2
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")

def extract_text_from_pdf(file):
    reader = PyPDF2.PdfReader(file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text

@app.route("/analyze", methods=["POST"])
def analyze_resume():
    print("✅ /analyze endpoint called")
    try:
        # --- Get resume text ---
        if "resume" in request.files:
            file = request.files["resume"]
            text = extract_text_from_pdf(file)
        else:
            data = request.get_json()
            text = data.get("text", "")

        print("📄 Extracted resume text:")
        print(text[:500])  # show first 500 chars

        if not text.strip():
            return jsonify({
                "detected_skills": [],
                "missing_skills": [],
                "resources": []
            })

        # --- Prompt for Gemini ---
        prompt = f"""
        You are a career coach AI. Analyze the following resume text.

        Rules:
        - Return ONLY valid JSON.
        - If no skills found, return empty lists.
        - JSON structure:
        {{
          "detected_skills": ["skill1", "skill2"],
          "missing_skills": ["skill3", "skill4"],
          "resources": [
            {{"skill": "skill3", "resource": "https://example.com"}}
          ]
        }}

        Resume text:
        {text}
        """

        response = model.generate_content(prompt)

        print("🔥 Gemini raw response:")
        print(response.text)  # debug output

        raw_output = response.text.strip()

        # --- Try parsing as JSON ---
        import json, re
        analysis = None
        try:
            analysis = json.loads(raw_output)
        except:
            match = re.search(r"\{.*\}", raw_output, re.S)
            if match:
                try:
                    analysis = json.loads(match.group(0))
                except:
                    pass

        # --- If parsing still fails, return raw output safely ---
        if not analysis:
            analysis = {
                "detected_skills": [],
                "missing_skills": [],
                "resources": [],
                "raw_output": raw_output
            }

        return jsonify(analysis)

    except Exception as e:
        # Never crash — always return valid JSON
        return jsonify({
            "detected_skills": [],
            "missing_skills": [],
            "resources": [],
            "error": str(e)
        })


if __name__ == "__main__":
    app.run(port=5000, debug=True)
