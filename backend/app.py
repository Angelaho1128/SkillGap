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
    try:
        if "resume" in request.files:
            file = request.files["resume"]
            text = extract_text_from_pdf(file)
        else:
            data = request.get_json()
            text = data.get("text", "")

        if not text.strip():
            return jsonify({"error": "No resume text provided"}), 400

        prompt = f"""
        Analyze this resume text and identify missing skills compared to typical industry requirements.
        Suggest online resources (Coursera, YouTube, free courses) to help the candidate improve.
        Resume:
        {text}
        """

        response = model.generate_content(prompt)

        return jsonify({"analysis": response.text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)
