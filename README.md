# SkillGap  

SkillGap is a web app that helps users identify skills from their resumes, compare them with a target job role, and find resources to close their skill gaps.  

---

## Features  
- Parse resumes (PDF) to extract explicit skills.  
- Infer additional skills from experiences and projects.  
- Compare detected skills against target career roles.  
- Provide resources for missing skills.  
- Clean and responsive UI built with React + Tailwind CSS.  

---

## Tech Stack  
- **Frontend:** React, Tailwind CSS  
- **Backend:** Flask (Python)  
- **AI:** Google Gemini API (for skill extraction & recommendations)  
- **PDF Handling:** PyPDF2  
- **Other Tools:** Flask-CORS  

---

## Project Structure  

``` yaml
SkillGap/
│── frontend/ 
| ├── index.html
| ├── script.js
│── backend/ 
│ ├── app.py
│── requirements.txt
│── README.md
```

---

## Installation  

### 1. Clone the repository  
```bash
git clone https://github.com/Angelaho1128/SkillGap
cd SkillGap
```

### 2. Backend setup + Run backend server
```bash
cd backend
..\venv\bin\activate
pip install -r requirements.txt
python app.py
```

### 3. Frontend setup
No extra build steps needed. Open `index.html` in your browser (or serve it with any static server).

--- 

### Environment Variables
Create a `.env` file in the backend directory and add your Gemini API key:
```bash
setx GEMINI_API_KEY "your_api_key_here"
```

---

### Usage
1. Start the backend server.
2. Open the frontend in a browser.
3. Upload your resume and enter your target career role.
4. View extracted skills, missing skills, and recommended resources.

### Requirements
- Python 3.9+
- Flask
- Flask-CORS
- PyPDF2 
- google-generativeai