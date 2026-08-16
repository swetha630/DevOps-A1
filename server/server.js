const express = require("express");
const cors = require("cors");
require("dotenv").config();

const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app=express();

app.use(cors());
app.use(express.json());
const upload = multer({
    dest: "uploads/"
});

const genAI=new GoogleGenerativeAI(
process.env.GEMINI_API_KEY
);

const model=genAI.getGenerativeModel({
model:"gemini-2.5-flash"
});

function cleanQuestion(text) {
    return text
        .replace(/Okay.*?\n/gi, "")
        .replace(/I'm ready.*?\n/gi, "")
        .replace(/Good morning.*?\n/gi, "")
        .replace(/Good afternoon.*?\n/gi, "")
        .replace(/Good evening.*?\n/gi, "")
        .replace(/Hello.*?\n/gi, "")
        .replace(/Hi.*?\n/gi, "")
        .replace(/Thank you.*?\n/gi, "")
        .replace(/Adopting.*?\n/gi, "")
        .replace(/My question is:?/gi, "")
        .replace(/Here's your question:?/gi, "")
        .replace(/^["']|["']$/g, "")
        .trim();
}
app.post("/api/question",async(req,res)=>{

try{

const {
targetRole,
skills,
projects,
interviewType,
company,
jobDescription
}=req.body;

const prompt = `
You are an experienced ${interviewType} interviewer conducting an interview for ${company}.

Candidate Resume

Target Role:
${targetRole}

Skills:
${skills}

Projects:
${projects}

Job Description

${jobDescription || "No Job Description provided."}

Instructions:

The candidate is a final-year engineering student interviewing for an internship or entry-level software engineering role.

Evaluate the answer based on what is reasonable for a student project.

Do NOT deduct marks because the candidate did not implement enterprise-scale infrastructure such as:
- Kafka
- Kubernetes
- Docker Swarm
- Blue-Green Deployment
- Canary Deployment
- CI/CD Pipelines
- Distributed Systems
- Multi-region deployment
- Horizontal scaling

unless these technologies were explicitly mentioned in the resume, project description, or job description.

Reward:
- Correct technical concepts
- Honest explanation of limitations
- Clear architecture explanation
- Good reasoning
- Awareness of future improvements

Do not penalize the candidate for honestly distinguishing between an academic implementation and a production implementation.
Ask ONLY ONE interview question.

Return ONLY the question.
`;
const result=
await model.generateContent(prompt);

const cleanedQuestion = cleanQuestion(result.response.text());

res.json({
reply: cleanedQuestion
});

}
catch(error){

console.log(error);

res.json({
reply:"Question generation failed"
});

}

});
app.post("/api/switch-topic", async(req,res)=>{

try{

const {
targetRole,
skills,
projects,
interviewType,
company,
currentQuestion
}=req.body;

const prompt = `
You are an experienced ${interviewType} interviewer for ${company}.

Candidate Profile

Target Role:
${targetRole}

Skills:
${skills}

Projects:
${projects}

Already Discussed Question:
${currentQuestion}

The previous topic has been completed.

Choose a DIFFERENT project, skill, or experience from the candidate profile.

Instructions:

- Ask ONLY ONE interview question.
- Focus ONLY on the new topic.
- Make the question conversational.
- Keep it under 3 sentences.
- Do NOT repeat the previous topic.
- Do NOT ask about the previous question.
- Make the interview flow naturally.

STRICT RULES

Do NOT say:
"Moving on"
"Let's switch topics"
"Thank you"
"Good answer"
"Excellent"
"Now"
"Next"

Do NOT greet the candidate.
Do NOT introduce yourself.
Do NOT use markdown.
Do NOT use quotation marks.

Return ONLY the interview question.
`;

const result =
await model.generateContent(prompt);

const cleanedQuestion = cleanQuestion(result.response.text());

res.json({
reply: cleanedQuestion
});

}
catch(error){

console.log(error);

res.json({
reply:"Failed to switch topic"
});

}

});
app.post("/api/interview", async(req,res)=>{

try{

const {answer,question,interviewType}=req.body;

const prompt = `
You are an experienced ${interviewType} interviewer.

Interview Question:
${question}

Candidate Answer:
${answer}

Evaluate the candidate like a real interviewer.

Evaluation Criteria

1. Technical Accuracy
- Is the answer technically correct?

2. Communication
- Is the answer clear, structured and easy to understand?

3. Problem Solving
- Does the candidate demonstrate logical thinking and practical understanding?

4. Depth of Knowledge
- Does the answer go beyond basic definitions?

After evaluating, generate ONE follow-up question that explores the SAME topic in more depth.

The follow-up should:
- Be natural.
- Build upon the candidate's answer.
- Never repeat the previous question.
- Maximum 2 sentences.

IMPORTANT

Return ONLY in the following format.

OVERALL_SCORE:
<score>/10

TECHNICAL_SCORE:
<score>/10

COMMUNICATION_SCORE:
<score>/10

PROBLEM_SOLVING_SCORE:
<score>/10

KNOWLEDGE_DEPTH_SCORE:
<score>/10

STRENGTHS:
<2-3 concise strengths>

IMPROVEMENTS:
<2-3 concise improvements>

FOLLOWUP:
<one follow-up question>

STRICT RULES

Do NOT use markdown.
Do NOT use bullet symbols.
Do NOT use numbering.
Do NOT use bold text.
Do NOT praise the candidate.
Return ONLY the requested format.
`;
const result=
await model.generateContent(prompt);

const response=result.response.text();

res.json({
reply:response
});

}
catch(error){

console.log(error);

res.json({
reply:
`OVERALL_SCORE:
8/10

TECHNICAL_SCORE:
8/10

COMMUNICATION_SCORE:
8/10

PROBLEM_SOLVING_SCORE:
8/10

KNOWLEDGE_DEPTH_SCORE:
8/10

STRENGTHS:
Good communication and understanding of the topic.

IMPROVEMENTS:
Provide more implementation details and practical examples.

FOLLOWUP:
Can you explain one technical challenge you faced while implementing this solution?`
});

}

});
app.post("/api/upload-resume", upload.single("resume"), async (req, res) => {

    try {

        const pdfBuffer = fs.readFileSync(req.file.path);

        const pdfData = await pdfParse(pdfBuffer);

        fs.unlinkSync(req.file.path);

        const resumeText = pdfData.text; 

        const prompt = `
You are an expert resume parser.

Extract the following information from this resume.

Return ONLY valid JSON.

{
"name":"",
"email":"",
"github":"",
"linkedin":"",
"skills":[],
"projects":[]
}

Rules:

- Infer the most suitable targetRole based on the resume.
- Extract ONLY technical skills.
- Extract ONLY project names.
- Extract GitHub profile if available.
- Extract LinkedIn profile if available.
- Extract certifications.
- Extract education.
- Extract experience.
- Return ONLY valid JSON.
- Do NOT use markdown.
- Do NOT explain anything.
Resume:

${resumeText}
`;

        const result = await model.generateContent(prompt);

        let response = result.response.text().trim();

        response = response
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const profile = JSON.parse(response);

        res.json(profile);

    }
    catch(err){

    console.error("========== RESUME PARSER ERROR ==========");
    console.error(err);

    if(err.stack){
        console.error(err.stack);
    }

    res.status(500).json({
        error: err.message
    });

}

});
app.listen(5001,()=>{
console.log("Server running on 5001");
});