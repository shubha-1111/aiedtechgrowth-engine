import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE credentials in .env.local");
  process.exit(1);
}

if (!globalThis.WebSocket) {
  globalThis.WebSocket = class WebSocket {
    constructor() {}
    close() {}
    send() {}
  };
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const defaultRunInstructions = "1. Save the backend code as main.py\n2. Run `pip install fastapi uvicorn groq`\n3. Start the backend with `uvicorn main:app --reload`\n4. Ensure you set the GROQ_API_KEY and GROQ_MODEL environment variables in your terminal.\n5. Save the frontend code as index.html\n6. Open index.html in your browser (or use a local server like `npx serve`).\n7. For free deployment, you can use Render or Hugging Face Spaces for the backend, and Vercel for the frontend.";

const templates = [
  // CAREERS
  {
    slug: "resume-analyzer",
    title: "[DEMO] Resume Analyzer",
    interest: "careers",
    level: "beginner",
    branches: ["cse", "it", "ece", "other"],
    time_minutes: 30,
    free_tools: ["FastAPI", "Groq", "Vercel"],
    steps: {
      description: "Build a tool that reviews a resume snippet and suggests improvements.",
      steps: [
        "Set up a FastAPI server.",
        "Create an endpoint that takes resume text and sends it to Groq.",
        "Build a simple HTML frontend to paste text and display feedback."
      ],
      tools: ["FastAPI", "Groq", "HTML"],
      why_it_helps_resume: "Shows you can build a basic AI integration and understand simple text processing pipelines."
    },
    run_instructions: defaultRunInstructions,
    starter_code: {
      backend: {
        path: "main.py",
        code: "import os\nfrom fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom pydantic import BaseModel\nfrom groq import Groq\n\napp = FastAPI()\napp.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])\n\nclient = Groq(api_key=os.environ.get('GROQ_API_KEY'))\nmodel = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')\n\nclass ResumeInput(BaseModel):\n    text: str\n\n@app.post('/analyze')\ndef analyze_resume(req: ResumeInput):\n    completion = client.chat.completions.create(\n        messages=[\n            {'role': 'system', 'content': 'You are an expert recruiter. Suggest 3 improvements for the resume snippet.'},\n            {'role': 'user', 'content': req.text}\n        ],\n        model=model,\n    )\n    return {'feedback': completion.choices[0].message.content}\n"
      },
      frontend: {
        path: "index.html",
        code: "<!DOCTYPE html>\n<html>\n<head>\n    <title>Resume Analyzer</title>\n    <style>body { font-family: sans-serif; padding: 20px; } textarea { width: 100%; height: 100px; }</style>\n</head>\n<body>\n    <h1>Resume Analyzer</h1>\n    <textarea id='resumeText' placeholder='Paste resume bullet point here...'></textarea>\n    <button onclick='analyze()'>Analyze</button>\n    <pre id='result'></pre>\n    <script>\n        async function analyze() {\n            const text = document.getElementById('resumeText').value;\n            document.getElementById('result').innerText = 'Loading...';\n            const res = await fetch('http://127.0.0.1:8000/analyze', {\n                method: 'POST',\n                headers: { 'Content-Type': 'application/json' },\n                body: JSON.stringify({ text })\n            });\n            const data = await res.json();\n            document.getElementById('result').innerText = data.feedback;\n        }\n    </script>\n</body>\n</html>"
      }
    }
  },
  {
    slug: "interview-question-generator",
    title: "[DEMO] Interview Question Generator",
    interest: "careers",
    level: "intermediate",
    branches: ["cse", "it", "ece", "aiml_ds"],
    time_minutes: 45,
    free_tools: ["FastAPI", "Groq", "Render"],
    steps: {
      description: "Generates role-specific technical interview questions.",
      steps: [
        "Create an API accepting job role and experience level.",
        "Prompt Groq to generate 3 tailored technical questions.",
        "Build a frontend with dropdowns for role and level."
      ],
      tools: ["FastAPI", "Groq", "Vanilla JS"],
      why_it_helps_resume: "Demonstrates prompt engineering and state management in a client-server architecture."
    },
    run_instructions: defaultRunInstructions,
    starter_code: {
      backend: {
        path: "main.py",
        code: "import os\nfrom fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom pydantic import BaseModel\nfrom groq import Groq\n\napp = FastAPI()\napp.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])\n\nclient = Groq(api_key=os.environ.get('GROQ_API_KEY'))\nmodel = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')\n\nclass JobInput(BaseModel):\n    role: str\n    level: str\n\n@app.post('/generate')\ndef generate_questions(req: JobInput):\n    prompt = f'Generate 3 technical interview questions for a {req.level} {req.role} position.'\n    completion = client.chat.completions.create(\n        messages=[{'role': 'user', 'content': prompt}],\n        model=model,\n    )\n    return {'questions': completion.choices[0].message.content}\n"
      },
      frontend: {
        path: "index.html",
        code: "<!DOCTYPE html>\n<html>\n<head><title>Interview Qs</title></head>\n<body>\n    <h1>Generate Interview Questions</h1>\n    <input id='role' placeholder='e.g. Frontend Developer' />\n    <select id='level'><option>Junior</option><option>Senior</option></select>\n    <button onclick='generate()'>Generate</button>\n    <pre id='output'></pre>\n    <script>\n        async function generate() {\n            const role = document.getElementById('role').value;\n            const level = document.getElementById('level').value;\n            const res = await fetch('http://127.0.0.1:8000/generate', {\n                method: 'POST',\n                headers: { 'Content-Type': 'application/json' },\n                body: JSON.stringify({ role, level })\n            });\n            const data = await res.json();\n            document.getElementById('output').innerText = data.questions;\n        }\n    </script>\n</body>\n</html>"
      }
    }
  },
  {
    slug: "career-path-mapper",
    title: "[DEMO] Career Path Mapper",
    interest: "careers",
    level: "advanced",
    branches: ["cse", "it", "aiml_ds", "other"],
    time_minutes: 60,
    free_tools: ["FastAPI", "Groq", "JSON Mode"],
    steps: {
      description: "Maps a sequence of roles to reach a target dream job.",
      steps: [
        "Prompt the LLM to output a JSON array of career steps.",
        "Parse the structured output in the frontend.",
        "Render a timeline or step-by-step list."
      ],
      tools: ["FastAPI", "Groq JSON Mode", "HTML/CSS"],
      why_it_helps_resume: "Highlights ability to work with structured LLM outputs and render complex UI components."
    },
    run_instructions: defaultRunInstructions,
    starter_code: {
      backend: {
        path: "main.py",
        code: "import os, json\nfrom fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom pydantic import BaseModel\nfrom groq import Groq\n\napp = FastAPI()\napp.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])\n\nclient = Groq(api_key=os.environ.get('GROQ_API_KEY'))\nmodel = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')\n\nclass PathInput(BaseModel):\n    current: str\n    target: str\n\n@app.post('/map')\ndef map_path(req: PathInput):\n    completion = client.chat.completions.create(\n        messages=[\n            {'role': 'system', 'content': 'Output JSON with a \"steps\" array mapping the path.'},\n            {'role': 'user', 'content': f'Path from {req.current} to {req.target}.'}\n        ],\n        model=model,\n        response_format={'type': 'json_object'}\n    )\n    return json.loads(completion.choices[0].message.content)\n"
      },
      frontend: {
        path: "index.html",
        code: "<!DOCTYPE html>\n<html>\n<body>\n    <h2>Career Mapper</h2>\n    <input id='current' placeholder='Current Role' />\n    <input id='target' placeholder='Target Role' />\n    <button onclick='mapPath()'>Map</button>\n    <ul id='list'></ul>\n    <script>\n        async function mapPath() {\n            const current = document.getElementById('current').value;\n            const target = document.getElementById('target').value;\n            const res = await fetch('http://127.0.0.1:8000/map', {\n                method: 'POST',\n                headers: { 'Content-Type': 'application/json' },\n                body: JSON.stringify({ current, target })\n            });\n            const data = await res.json();\n            const list = document.getElementById('list');\n            list.innerHTML = '';\n            (data.steps || []).forEach(step => {\n                const li = document.createElement('li');\n                li.innerText = JSON.stringify(step);\n                list.appendChild(li);\n            });\n        }\n    </script>\n</body>\n</html>"
      }
    }
  },
  {
    slug: "password-strength-coach",
    title: "[DEMO] Password Strength Coach",
    interest: "security",
    level: "beginner",
    branches: ["cyber", "cse", "it"],
    time_minutes: 30,
    free_tools: ["FastAPI", "Groq", "Vercel"],
    steps: {
      description: "Analyzes password strength and gives AI coaching on how to improve it.",
      steps: [
        "Send password characteristics (not the password itself) or a dummy password to Groq.",
        "Get actionable advice on making it more secure.",
        "Display the advice in a simple UI."
      ],
      tools: ["FastAPI", "Groq", "HTML"],
      why_it_helps_resume: "Shows awareness of security principles and ability to sanitize inputs before AI processing."
    },
    run_instructions: defaultRunInstructions,
    starter_code: {
      backend: {
        path: "main.py",
        code: "import os\nfrom fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom pydantic import BaseModel\nfrom groq import Groq\n\napp = FastAPI()\napp.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])\n\nclient = Groq(api_key=os.environ.get('GROQ_API_KEY'))\nmodel = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')\n\nclass PassInput(BaseModel):\n    length: int\n    has_special: bool\n    has_numbers: bool\n\n@app.post('/coach')\ndef coach_password(req: PassInput):\n    prompt = f'A user has a password of length {req.length}, special chars: {req.has_special}, numbers: {req.has_numbers}. Give 2 short tips to improve it.'\n    completion = client.chat.completions.create(\n        messages=[{'role': 'user', 'content': prompt}],\n        model=model,\n    )\n    return {'advice': completion.choices[0].message.content}\n"
      },
      frontend: {
        path: "index.html",
        code: "<!DOCTYPE html>\n<html>\n<body>\n    <h2>Password Coach</h2>\n    <input type='password' id='pwd' placeholder='Enter password' onkeyup='check()' />\n    <p id='advice'></p>\n    <script>\n        async function check() {\n            const val = document.getElementById('pwd').value;\n            if(val.length < 3) return;\n            const res = await fetch('http://127.0.0.1:8000/coach', {\n                method: 'POST',\n                headers: { 'Content-Type': 'application/json' },\n                body: JSON.stringify({ \n                    length: val.length, \n                    has_special: /[^A-Za-z0-9]/.test(val),\n                    has_numbers: /[0-9]/.test(val)\n                })\n            });\n            const data = await res.json();\n            document.getElementById('advice').innerText = data.advice;\n        }\n    </script>\n</body>\n</html>"
      }
    }
  },
  {
    slug: "phishing-message-classifier",
    title: "[DEMO] Phishing Message Classifier",
    interest: "security",
    level: "intermediate",
    branches: ["cyber", "cse", "it", "ece"],
    time_minutes: 45,
    free_tools: ["FastAPI", "Groq JSON"],
    steps: {
      description: "Classifies if an email or SMS is likely phishing and explains why.",
      steps: [
        "Create a system prompt to act as a cybersecurity expert.",
        "Force JSON output with a boolean 'is_phishing' and a 'reason'.",
        "Show a red/green indicator in the UI based on the response."
      ],
      tools: ["FastAPI", "Groq", "JS"],
      why_it_helps_resume: "Proves you can use AI for classification tasks and map structured data to UI states."
    },
    run_instructions: defaultRunInstructions,
    starter_code: {
      backend: {
        path: "main.py",
        code: "import os, json\nfrom fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom pydantic import BaseModel\nfrom groq import Groq\n\napp = FastAPI()\napp.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])\n\nclient = Groq(api_key=os.environ.get('GROQ_API_KEY'))\nmodel = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')\n\nclass MsgInput(BaseModel):\n    message: str\n\n@app.post('/classify')\ndef classify(req: MsgInput):\n    completion = client.chat.completions.create(\n        messages=[\n            {'role': 'system', 'content': 'Analyze if the message is phishing. Output JSON with \"is_phishing\" (bool) and \"reason\".'},\n            {'role': 'user', 'content': req.message}\n        ],\n        model=model,\n        response_format={'type': 'json_object'}\n    )\n    return json.loads(completion.choices[0].message.content)\n"
      },
      frontend: {
        path: "index.html",
        code: "<!DOCTYPE html>\n<html>\n<body>\n    <h2>Phishing Detector</h2>\n    <textarea id='msg'></textarea><button onclick='check()'>Check</button>\n    <div id='res' style='padding:10px; margin-top:10px;'></div>\n    <script>\n        async function check() {\n            const message = document.getElementById('msg').value;\n            const res = await fetch('http://127.0.0.1:8000/classify', {\n                method: 'POST',\n                headers: {'Content-Type': 'application/json'},\n                body: JSON.stringify({ message })\n            });\n            const data = await res.json();\n            const div = document.getElementById('res');\n            div.style.backgroundColor = data.is_phishing ? 'red' : 'green';\n            div.style.color = 'white';\n            div.innerText = data.reason;\n        }\n    </script>\n</body>\n</html>"
      }
    }
  },
  {
    slug: "log-anomaly-explainer",
    title: "[DEMO] Log Anomaly Explainer",
    interest: "security",
    level: "advanced",
    branches: ["cyber", "cse"],
    time_minutes: 60,
    free_tools: ["FastAPI", "Groq"],
    steps: {
      description: "Translates cryptic server logs into plain English security alerts.",
      steps: [
        "Take a raw Apache/Nginx or syslog line.",
        "Prompt Groq to identify the attack vector (e.g., SQLi, XSS).",
        "Generate a remediation suggestion."
      ],
      tools: ["FastAPI", "Groq"],
      why_it_helps_resume: "Demonstrates practical DevSecOps knowledge and log parsing abilities."
    },
    run_instructions: defaultRunInstructions,
    starter_code: {
      backend: {
        path: "main.py",
        code: "import os\nfrom fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom pydantic import BaseModel\nfrom groq import Groq\n\napp = FastAPI()\napp.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])\n\nclient = Groq(api_key=os.environ.get('GROQ_API_KEY'))\nmodel = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')\n\nclass LogInput(BaseModel):\n    log_line: str\n\n@app.post('/explain')\ndef explain_log(req: LogInput):\n    completion = client.chat.completions.create(\n        messages=[\n            {'role': 'system', 'content': 'You are a SOC analyst. Explain the security threat in this log line and suggest a fix.'},\n            {'role': 'user', 'content': req.log_line}\n        ],\n        model=model,\n    )\n    return {'explanation': completion.choices[0].message.content}\n"
      },
      frontend: {
        path: "index.html",
        code: "<!DOCTYPE html>\n<html>\n<body>\n    <h2>Log Explainer</h2>\n    <input id='log' style='width: 80%' placeholder='Paste log line...' />\n    <button onclick='explain()'>Explain</button>\n    <pre id='out'></pre>\n    <script>\n        async function explain() {\n            const log_line = document.getElementById('log').value;\n            const res = await fetch('http://127.0.0.1:8000/explain', {\n                method: 'POST',\n                headers: {'Content-Type': 'application/json'},\n                body: JSON.stringify({ log_line })\n            });\n            const data = await res.json();\n            document.getElementById('out').innerText = data.explanation;\n        }\n    </script>\n</body>\n</html>"
      }
    }
  },
  {
    slug: "health-faq-bot",
    title: "[DEMO] Health FAQ Bot",
    interest: "healthcare_info",
    level: "beginner",
    branches: ["cse", "it", "aiml_ds"],
    time_minutes: 30,
    free_tools: ["FastAPI", "Groq", "Vercel"],
    steps: {
      description: "A basic bot answering health questions with a strict 'not medical advice' disclaimer.",
      steps: [
        "Set up the system prompt to ALWAYS include a medical disclaimer.",
        "Pass user query to Groq.",
        "Display the response clearly showing the disclaimer."
      ],
      tools: ["FastAPI", "Groq", "HTML"],
      why_it_helps_resume: "Highlights ability to enforce safety and compliance constraints in AI prompts."
    },
    run_instructions: defaultRunInstructions,
    starter_code: {
      backend: {
        path: "main.py",
        code: "import os\nfrom fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom pydantic import BaseModel\nfrom groq import Groq\n\napp = FastAPI()\napp.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])\n\nclient = Groq(api_key=os.environ.get('GROQ_API_KEY'))\nmodel = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')\n\nclass QInput(BaseModel):\n    question: str\n\n@app.post('/ask')\ndef ask(req: QInput):\n    completion = client.chat.completions.create(\n        messages=[\n            {'role': 'system', 'content': 'You are a helpful assistant. Always start your response with \"DISCLAIMER: This is not medical advice.\"'},\n            {'role': 'user', 'content': req.question}\n        ],\n        model=model,\n    )\n    return {'answer': completion.choices[0].message.content}\n"
      },
      frontend: {
        path: "index.html",
        code: "<!DOCTYPE html>\n<html>\n<body>\n    <h2>Health FAQ</h2>\n    <input id='q' placeholder='Ask a general health question...' />\n    <button onclick='ask()'>Ask</button>\n    <p id='ans' style='color: #333; font-weight: bold;'></p>\n    <script>\n        async function ask() {\n            const question = document.getElementById('q').value;\n            const res = await fetch('http://127.0.0.1:8000/ask', {\n                method: 'POST',\n                headers: {'Content-Type': 'application/json'},\n                body: JSON.stringify({ question })\n            });\n            const data = await res.json();\n            document.getElementById('ans').innerText = data.answer;\n        }\n    </script>\n</body>\n</html>"
      }
    }
  },
  {
    slug: "symptom-triage-helper",
    title: "[DEMO] Symptom Triage Helper",
    interest: "healthcare_info",
    level: "intermediate",
    branches: ["cse", "it", "ece"],
    time_minutes: 45,
    free_tools: ["FastAPI", "Groq JSON"],
    steps: {
      description: "Extracts mentioned symptoms from a text block and categorizes severity.",
      steps: [
        "Prompt Groq to extract symptoms into a JSON array.",
        "Assign a rough severity score based on keywords.",
        "Display the structured triage information."
      ],
      tools: ["FastAPI", "Groq", "JS"],
      why_it_helps_resume: "Shows entity extraction capabilities and working with structured data formats."
    },
    run_instructions: defaultRunInstructions,
    starter_code: {
      backend: {
        path: "main.py",
        code: "import os, json\nfrom fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom pydantic import BaseModel\nfrom groq import Groq\n\napp = FastAPI()\napp.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])\n\nclient = Groq(api_key=os.environ.get('GROQ_API_KEY'))\nmodel = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')\n\nclass SInput(BaseModel):\n    text: str\n\n@app.post('/triage')\ndef triage(req: SInput):\n    completion = client.chat.completions.create(\n        messages=[\n            {'role': 'system', 'content': 'Extract symptoms. Output JSON with \"symptoms\" array and \"severity\" (Low/Medium/High).'},\n            {'role': 'user', 'content': req.text}\n        ],\n        model=model,\n        response_format={'type': 'json_object'}\n    )\n    return json.loads(completion.choices[0].message.content)\n"
      },
      frontend: {
        path: "index.html",
        code: "<!DOCTYPE html>\n<html>\n<body>\n    <h2>Triage Helper</h2>\n    <textarea id='text' placeholder='I have a headache and slight fever...'></textarea>\n    <button onclick='analyze()'>Analyze</button>\n    <pre id='res'></pre>\n    <script>\n        async function analyze() {\n            const text = document.getElementById('text').value;\n            const res = await fetch('http://127.0.0.1:8000/triage', {\n                method: 'POST',\n                headers: {'Content-Type': 'application/json'},\n                body: JSON.stringify({ text })\n            });\n            const data = await res.json();\n            document.getElementById('res').innerText = JSON.stringify(data, null, 2);\n        }\n    </script>\n</body>\n</html>"
      }
    }
  },
  {
    slug: "medical-jargon-simplifier",
    title: "[DEMO] Medical Jargon Simplifier",
    interest: "healthcare_info",
    level: "advanced",
    branches: ["cse", "it", "aiml_ds"],
    time_minutes: 60,
    free_tools: ["FastAPI", "Groq", "Vercel"],
    steps: {
      description: "Translates complex medical text into an 8th-grade reading level summary.",
      steps: [
        "Take a paragraph of medical jargon.",
        "Prompt Groq to simplify it using analogies.",
        "Highlight simplified terms in the UI."
      ],
      tools: ["FastAPI", "Groq"],
      why_it_helps_resume: "Demonstrates text summarization and tailoring AI output for accessibility."
    },
    run_instructions: defaultRunInstructions,
    starter_code: {
      backend: {
        path: "main.py",
        code: "import os\nfrom fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom pydantic import BaseModel\nfrom groq import Groq\n\napp = FastAPI()\napp.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])\n\nclient = Groq(api_key=os.environ.get('GROQ_API_KEY'))\nmodel = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')\n\nclass TInput(BaseModel):\n    text: str\n\n@app.post('/simplify')\ndef simplify(req: TInput):\n    completion = client.chat.completions.create(\n        messages=[\n            {'role': 'system', 'content': 'Explain this medical text so an 8th grader can understand it. Use simple analogies.'},\n            {'role': 'user', 'content': req.text}\n        ],\n        model=model,\n    )\n    return {'simple_text': completion.choices[0].message.content}\n"
      },
      frontend: {
        path: "index.html",
        code: "<!DOCTYPE html>\n<html>\n<body>\n    <h2>Jargon Simplifier</h2>\n    <textarea id='txt' placeholder='Myocardial infarction...'></textarea>\n    <button onclick='run()'>Simplify</button>\n    <p id='out'></p>\n    <script>\n        async function run() {\n            const text = document.getElementById('txt').value;\n            const res = await fetch('http://127.0.0.1:8000/simplify', {\n                method: 'POST',\n                headers: {'Content-Type': 'application/json'},\n                body: JSON.stringify({ text })\n            });\n            const data = await res.json();\n            document.getElementById('out').innerText = data.simple_text;\n        }\n    </script>\n</body>\n</html>"
      }
    }
  },
  {
    slug: "expense-categoriser",
    title: "[DEMO] Expense Categoriser",
    interest: "finance",
    level: "beginner",
    branches: ["cse", "it", "ece"],
    time_minutes: 30,
    free_tools: ["FastAPI", "Groq"],
    steps: {
      description: "Automatically categorizes a transaction description (e.g. 'Uber Eats') into standard buckets.",
      steps: [
        "Send a transaction string to Groq.",
        "Prompt for a single-word category (Food, Transport, Utilities).",
        "Display the categorized result."
      ],
      tools: ["FastAPI", "Groq", "HTML"],
      why_it_helps_resume: "Proves you can build a basic classification microservice useful for fintech."
    },
    run_instructions: defaultRunInstructions,
    starter_code: {
      backend: {
        path: "main.py",
        code: "import os\nfrom fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom pydantic import BaseModel\nfrom groq import Groq\n\napp = FastAPI()\napp.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])\n\nclient = Groq(api_key=os.environ.get('GROQ_API_KEY'))\nmodel = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')\n\nclass EInput(BaseModel):\n    description: str\n\n@app.post('/categorize')\ndef categorize(req: EInput):\n    completion = client.chat.completions.create(\n        messages=[\n            {'role': 'system', 'content': 'Reply ONLY with one category: Food, Transport, Utilities, Entertainment, or Other.'},\n            {'role': 'user', 'content': req.description}\n        ],\n        model=model,\n    )\n    return {'category': completion.choices[0].message.content.strip()}\n"
      },
      frontend: {
        path: "index.html",
        code: "<!DOCTYPE html>\n<html>\n<body>\n    <h2>Expense Categoriser</h2>\n    <input id='desc' placeholder='e.g. Starbucks' />\n    <button onclick='cat()'>Categorize</button>\n    <h3 id='cat'></h3>\n    <script>\n        async function cat() {\n            const description = document.getElementById('desc').value;\n            const res = await fetch('http://127.0.0.1:8000/categorize', {\n                method: 'POST',\n                headers: {'Content-Type': 'application/json'},\n                body: JSON.stringify({ description })\n            });\n            const data = await res.json();\n            document.getElementById('cat').innerText = data.category;\n        }\n    </script>\n</body>\n</html>"
      }
    }
  },
  {
    slug: "emi-explainer",
    title: "[DEMO] EMI Explainer",
    interest: "finance",
    level: "intermediate",
    branches: ["cse", "it", "ece"],
    time_minutes: 45,
    free_tools: ["FastAPI", "Groq"],
    steps: {
      description: "Calculates EMI and explains the interest burden in simple terms.",
      steps: [
        "Calculate the EMI mathematically in the backend.",
        "Pass the numbers to Groq to generate a plain-English explanation.",
        "Show both the number and the summary."
      ],
      tools: ["FastAPI", "Groq", "Math"],
      why_it_helps_resume: "Highlights ability to combine deterministic logic (math) with non-deterministic AI generation."
    },
    run_instructions: defaultRunInstructions,
    starter_code: {
      backend: {
        path: "main.py",
        code: "import os\nfrom fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom pydantic import BaseModel\nfrom groq import Groq\n\napp = FastAPI()\napp.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])\n\nclient = Groq(api_key=os.environ.get('GROQ_API_KEY'))\nmodel = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')\n\nclass LoanInput(BaseModel):\n    principal: float\n    rate_annual: float\n    months: int\n\n@app.post('/emi')\ndef calc_emi(req: LoanInput):\n    r = req.rate_annual / 12 / 100\n    emi = req.principal * r * ((1+r)**req.months) / (((1+r)**req.months) - 1)\n    total_paid = emi * req.months\n    \n    prompt = f'Loan: {req.principal}, EMI: {emi:.2f}, Total Paid: {total_paid:.2f}. Explain the interest impact simply.'\n    completion = client.chat.completions.create(\n        messages=[{'role': 'user', 'content': prompt}],\n        model=model,\n    )\n    return {'emi': round(emi, 2), 'explanation': completion.choices[0].message.content}\n"
      },
      frontend: {
        path: "index.html",
        code: "<!DOCTYPE html>\n<html>\n<body>\n    <h2>EMI Explainer</h2>\n    P: <input id='p' value='100000' /><br>\n    R(%): <input id='r' value='10' /><br>\n    Months: <input id='m' value='12' /><br>\n    <button onclick='calc()'>Calculate</button>\n    <h3>EMI: <span id='emi'></span></h3>\n    <p id='exp'></p>\n    <script>\n        async function calc() {\n            const principal = parseFloat(document.getElementById('p').value);\n            const rate_annual = parseFloat(document.getElementById('r').value);\n            const months = parseInt(document.getElementById('m').value);\n            const res = await fetch('http://127.0.0.1:8000/emi', {\n                method: 'POST',\n                headers: {'Content-Type': 'application/json'},\n                body: JSON.stringify({ principal, rate_annual, months })\n            });\n            const data = await res.json();\n            document.getElementById('emi').innerText = data.emi;\n            document.getElementById('exp').innerText = data.explanation;\n        }\n    </script>\n</body>\n</html>"
      }
    }
  },
  {
    slug: "investment-risk-analyzer",
    title: "[DEMO] Investment Risk Analyzer",
    interest: "finance",
    level: "advanced",
    branches: ["aiml_ds", "cse", "other"],
    time_minutes: 60,
    free_tools: ["FastAPI", "Groq JSON"],
    steps: {
      description: "Analyzes news headlines to gauge risk for a specific asset.",
      steps: [
        "Pass a list of dummy news headlines to Groq.",
        "Prompt for JSON output with a 'risk_score' and 'reasoning'.",
        "Render a risk dashboard."
      ],
      tools: ["FastAPI", "Groq", "JSON Mode"],
      why_it_helps_resume: "Shows you can build AI tools for sentiment analysis and risk assessment."
    },
    run_instructions: defaultRunInstructions,
    starter_code: {
      backend: {
        path: "main.py",
        code: "import os, json\nfrom fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom pydantic import BaseModel\nfrom groq import Groq\n\napp = FastAPI()\napp.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])\n\nclient = Groq(api_key=os.environ.get('GROQ_API_KEY'))\nmodel = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')\n\nclass NInput(BaseModel):\n    headlines: str\n\n@app.post('/risk')\ndef risk(req: NInput):\n    completion = client.chat.completions.create(\n        messages=[\n            {'role': 'system', 'content': 'Analyze risk from these headlines. Output JSON with \"risk_score\" (1-100) and \"summary\".'},\n            {'role': 'user', 'content': req.headlines}\n        ],\n        model=model,\n        response_format={'type': 'json_object'}\n    )\n    return json.loads(completion.choices[0].message.content)\n"
      },
      frontend: {
        path: "index.html",
        code: "<!DOCTYPE html>\n<html>\n<body>\n    <h2>Risk Analyzer</h2>\n    <textarea id='news' placeholder='Company X faces lawsuit...'></textarea>\n    <button onclick='analyze()'>Analyze</button>\n    <pre id='out'></pre>\n    <script>\n        async function analyze() {\n            const headlines = document.getElementById('news').value;\n            const res = await fetch('http://127.0.0.1:8000/risk', {\n                method: 'POST',\n                headers: {'Content-Type': 'application/json'},\n                body: JSON.stringify({ headlines })\n            });\n            const data = await res.json();\n            document.getElementById('out').innerText = JSON.stringify(data, null, 2);\n        }\n    </script>\n</body>\n</html>"
      }
    }
  },
  {
    slug: "flashcard-generator",
    title: "[DEMO] Flashcard Generator",
    interest: "education",
    level: "beginner",
    branches: ["cse", "it", "ece", "other"],
    time_minutes: 30,
    free_tools: ["FastAPI", "Groq JSON"],
    steps: {
      description: "Generates study flashcards from a paragraph of text.",
      steps: [
        "Prompt Groq to extract Q&A pairs from text.",
        "Output as a JSON array.",
        "Display them in simple HTML cards."
      ],
      tools: ["FastAPI", "Groq", "HTML"],
      why_it_helps_resume: "Proves ability to extract structured educational content using LLMs."
    },
    run_instructions: defaultRunInstructions,
    starter_code: {
      backend: {
        path: "main.py",
        code: "import os, json\nfrom fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom pydantic import BaseModel\nfrom groq import Groq\n\napp = FastAPI()\napp.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])\n\nclient = Groq(api_key=os.environ.get('GROQ_API_KEY'))\nmodel = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')\n\nclass FInput(BaseModel):\n    topic_text: str\n\n@app.post('/flashcards')\ndef generate_cards(req: FInput):\n    completion = client.chat.completions.create(\n        messages=[\n            {'role': 'system', 'content': 'Extract 3 flashcards. Output JSON with a \"cards\" array containing \"q\" and \"a\" keys.'},\n            {'role': 'user', 'content': req.topic_text}\n        ],\n        model=model,\n        response_format={'type': 'json_object'}\n    )\n    return json.loads(completion.choices[0].message.content)\n"
      },
      frontend: {
        path: "index.html",
        code: "<!DOCTYPE html>\n<html>\n<body>\n    <h2>Flashcards</h2>\n    <textarea id='txt'></textarea><button onclick='gen()'>Generate</button>\n    <ul id='list'></ul>\n    <script>\n        async function gen() {\n            const topic_text = document.getElementById('txt').value;\n            const res = await fetch('http://127.0.0.1:8000/flashcards', {\n                method: 'POST',\n                headers: {'Content-Type': 'application/json'},\n                body: JSON.stringify({ topic_text })\n            });\n            const data = await res.json();\n            const list = document.getElementById('list');\n            list.innerHTML = '';\n            data.cards.forEach(c => {\n                const li = document.createElement('li');\n                li.innerHTML = '<b>Q:</b> ' + c.q + ' <br> <b>A:</b> ' + c.a;\n                list.appendChild(li);\n            });\n        }\n    </script>\n</body>\n</html>"
      }
    }
  },
  {
    slug: "notes-summarizer",
    title: "[DEMO] Notes Summarizer",
    interest: "education",
    level: "intermediate",
    branches: ["cse", "it", "ece", "aiml_ds"],
    time_minutes: 45,
    free_tools: ["FastAPI", "Groq"],
    steps: {
      description: "Condenses long lecture notes into key bullet points.",
      steps: [
        "Take a long string of notes.",
        "Prompt Groq for a concise bulleted summary.",
        "Display the summary in a clean format."
      ],
      tools: ["FastAPI", "Groq", "CSS"],
      why_it_helps_resume: "Highlights prompt tuning for brevity and summarization."
    },
    run_instructions: defaultRunInstructions,
    starter_code: {
      backend: {
        path: "main.py",
        code: "import os\nfrom fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom pydantic import BaseModel\nfrom groq import Groq\n\napp = FastAPI()\napp.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])\n\nclient = Groq(api_key=os.environ.get('GROQ_API_KEY'))\nmodel = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')\n\nclass NInput(BaseModel):\n    notes: str\n\n@app.post('/summarize')\ndef summarize(req: NInput):\n    completion = client.chat.completions.create(\n        messages=[\n            {'role': 'system', 'content': 'Summarize the notes into 3 concise bullet points.'},\n            {'role': 'user', 'content': req.notes}\n        ],\n        model=model,\n    )\n    return {'summary': completion.choices[0].message.content}\n"
      },
      frontend: {
        path: "index.html",
        code: "<!DOCTYPE html>\n<html>\n<body>\n    <h2>Summarizer</h2>\n    <textarea id='notes' rows='10' cols='50'></textarea><br>\n    <button onclick='sum()'>Summarize</button>\n    <pre id='out'></pre>\n    <script>\n        async function sum() {\n            const notes = document.getElementById('notes').value;\n            const res = await fetch('http://127.0.0.1:8000/summarize', {\n                method: 'POST',\n                headers: {'Content-Type': 'application/json'},\n                body: JSON.stringify({ notes })\n            });\n            const data = await res.json();\n            document.getElementById('out').innerText = data.summary;\n        }\n    </script>\n</body>\n</html>"
      }
    }
  },
  {
    slug: "concept-explainer",
    title: "[DEMO] Concept Explainer (ELI5)",
    interest: "education",
    level: "advanced",
    branches: ["cse", "aiml_ds", "other"],
    time_minutes: 60,
    free_tools: ["FastAPI", "Groq JSON"],
    steps: {
      description: "Explains a complex topic at three different difficulty levels.",
      steps: [
        "Prompt Groq for JSON output with 'beginner', 'intermediate', and 'expert' explanations.",
        "Build a UI with tabs or toggles to switch levels.",
        "Handle the state changes in vanilla JS."
      ],
      tools: ["FastAPI", "Groq", "JS"],
      why_it_helps_resume: "Demonstrates advanced prompting (multi-perspective) and UI state management."
    },
    run_instructions: defaultRunInstructions,
    starter_code: {
      backend: {
        path: "main.py",
        code: "import os, json\nfrom fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\nfrom pydantic import BaseModel\nfrom groq import Groq\n\napp = FastAPI()\napp.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])\n\nclient = Groq(api_key=os.environ.get('GROQ_API_KEY'))\nmodel = os.environ.get('GROQ_MODEL', 'llama3-8b-8192')\n\nclass CInput(BaseModel):\n    topic: str\n\n@app.post('/explain')\ndef explain(req: CInput):\n    completion = client.chat.completions.create(\n        messages=[\n            {'role': 'system', 'content': 'Explain the topic. Output JSON with keys \"beginner\", \"intermediate\", \"expert\".'},\n            {'role': 'user', 'content': req.topic}\n        ],\n        model=model,\n        response_format={'type': 'json_object'}\n    )\n    return json.loads(completion.choices[0].message.content)\n"
      },
      frontend: {
        path: "index.html",
        code: "<!DOCTYPE html>\n<html>\n<body>\n    <h2>ELI5 Explainer</h2>\n    <input id='topic' placeholder='e.g. Quantum Computing' />\n    <button onclick='exp()'>Explain</button>\n    <div style='margin-top:20px;'>\n        <button onclick='show(\"beginner\")'>Beginner</button>\n        <button onclick='show(\"intermediate\")'>Intermediate</button>\n        <button onclick='show(\"expert\")'>Expert</button>\n    </div>\n    <p id='out'></p>\n    <script>\n        let explanations = {};\n        async function exp() {\n            const topic = document.getElementById('topic').value;\n            const res = await fetch('http://127.0.0.1:8000/explain', {\n                method: 'POST',\n                headers: {'Content-Type': 'application/json'},\n                body: JSON.stringify({ topic })\n            });\n            explanations = await res.json();\n            show('beginner');\n        }\n        function show(level) {\n            document.getElementById('out').innerText = explanations[level] || '';\n        }\n    </script>\n</body>\n</html>"
      }
    }
  }
];

async function seed() {
  for (const template of templates) {
    const { error } = await supabase
      .from("project_templates")
      .upsert(template, { onConflict: "slug" });
      
    if (error) {
      console.error(`Failed to upsert ${template.slug}:`, error);
    } else {
      console.log(`Upserted ${template.slug}`);
    }
  }
}

seed().then(() => console.log("Done."));
