# llm/generate.py
from langchain_ollama.llms import OllamaLLM
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

SYSTEM_PROMPT = """
You are an AI assistant that optimizes resumes based on a job description. 
Enhance the candidate's resume by aligning it with the required skills, experience, and responsibilities.
Make it concise, professional, and ATS-friendly.
"""
LLM_Model = OllamaLLM(model="deepseek-r1:1.5b")

def optimize_resume(current_resume, job_description):
    prompt = f"{SYSTEM_PROMPT}\n\nJob Description:\n{job_description}\n\nCurrent Resume:\n{current_resume}\n\nOptimized Resume:"
    response = LLM_Model.invoke(prompt)
    return response

@app.route('/api/ai2/optimize-resume', methods=['POST'])
def optimize():
    data = request.json
    current_resume = data.get("resumeContent")
    job_description = data.get("jobDescription")

    if not current_resume or not job_description:
        return jsonify({"error": "Missing resume or job description"}), 400

    optimized_text = optimize_resume(current_resume, job_description)

    # Assuming the LLM returns optimized content and skills
    # You may need to parse or extract them properly
    optimized_resume, extracted_skills = extract_resume_details(optimized_text)

    return jsonify({
        "content": optimized_resume,
        "skills": extracted_skills
    })

def extract_resume_details(optimized_text):
    """
    This function extracts skills from the optimized resume.
    Modify this based on how the LLM returns the output.
    """
    lines = optimized_text.split("\n")
    resume_content = "\n".join(lines[:-1])  # All but last line
    skills = lines[-1].replace("Skills:", "").strip().split(", ") if "Skills:" in lines[-1] else []

    return resume_content, skills

if __name__ == '__main__':
    app.run(debug=True)