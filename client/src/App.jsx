import axios from "axios";
import { useState } from "react";
import "./App.css";

function App(){

const [targetRole,setTargetRole]=useState("");
const [skills,setSkills]=useState("");
const [projects,setProjects]=useState("");
const [interviewType,setInterviewType]=useState("HR");
const [company,setCompany]=useState("");

const [question,setQuestion]=useState("");
const [answer,setAnswer]=useState("");

const [feedback,setFeedback]=useState("");
const [followUp,setFollowUp]=useState("");

const [loading,setLoading]=useState(false);
const [resume,setResume]=useState(null);
const [uploading,setUploading]=useState(false);
const [parsedResume, setParsedResume] = useState(null);
const [jobDescription, setJobDescription] = useState("");

const handleStartInterview=async()=>{

try{

setLoading(true);

const res=await axios.post(
"http://127.0.0.1:5001/api/question",
{
targetRole,
skills,
projects,
interviewType,
company
}
);

setQuestion(res.data.reply);

setAnswer("");
setFeedback("");
setFollowUp("");

}
catch(error){

console.log(error);
alert("Request failed");

}
finally{
setLoading(false);
}

};



const submitAnswer=async()=>{

if(!answer){
alert("Enter answer first");
return;
}

try{

setLoading(true);

const res=await axios.post(
"http://127.0.0.1:5001/api/interview",
{
answer,
question,
interviewType
}
);

const aiReply=res.data.reply;

setFeedback(aiReply);

let extractedFollowUp = "";

if(aiReply.includes("FOLLOWUP:")){

extractedFollowUp =
aiReply.split("FOLLOWUP:")[1].trim();

}

else if(aiReply.includes("Follow-up")){

extractedFollowUp =
aiReply.split("Follow-up")[1].trim();

}

setFollowUp(extractedFollowUp);

}
catch(error){

console.log(error);
alert("Request failed");

}
finally{
setLoading(false);
}

};



const continueInterview=()=>{

if(!followUp){
alert("No follow-up question found");
return;
}

setQuestion(followUp);

setAnswer("");

setFeedback("");

setFollowUp("");

window.scrollTo({
top:0,
behavior:"smooth"
});

};

const switchTopic = async()=>{

try{

setLoading(true);

const res = await axios.post(
"http://127.0.0.1:5001/api/switch-topic",
{
targetRole,
skills,
projects,
interviewType,
company,
jobDescription
}
);

setQuestion(res.data.reply);

setAnswer("");
setFeedback("");
setFollowUp("");

window.scrollTo({
top:0,
behavior:"smooth"
});

}
catch(error){

console.log(error);
alert("Failed to switch topic");

}
finally{

setLoading(false);

}

};
const uploadResume = async () => {

if(!resume){
alert("Please choose a PDF resume.");
return;
}

try{

setUploading(true);

const formData = new FormData();

formData.append("resume", resume);

const res = await axios.post(
"http://127.0.0.1:5001/api/upload-resume",
formData,
{
headers:{
"Content-Type":"multipart/form-data"
}
}
);

const data = res.data;
setParsedResume(data);


console.log("Parsed Resume:", data);
setSkills((data.skills || []).join(", "));
setProjects((data.projects || []).join("\n"));

alert("Resume parsed successfully!");

}
catch(error){

    console.log(error);

    alert(error.response?.data?.error || "Resume parsing failed.");

}
finally{

setUploading(false);

}

};
return(
<div className="container">

<h1 className="title">
AI Interview Coach
</h1>

<h2 className="subtitle">
Personalized Mock Interview Simulator
</h2>



<div className="card">

    <h2 className="section-title">
        Upload Resume
    </h2>

    <input
        className="input"
        type="file"
        accept=".pdf"
        onChange={(e) => setResume(e.target.files[0])}
    />

    <button
        className="button"
        onClick={uploadResume}
        disabled={uploading}
    >
        {uploading ? "Parsing Resume..." : "Upload Resume"}
    </button>

    {parsedResume && (
        <div
            style={{
                marginTop: "15px",
                padding: "12px",
                background: "#eef7ff",
                borderRadius: "8px"
            }}
        >


            <b>Name:</b> {parsedResume.name || "Not Found"}

            <br />

            <b>Email:</b> {parsedResume.email || "Not Found"}


        </div>
    )}

    <hr style={{ margin: "25px 0" }} />

    <h2 className="section-title">
        Candidate Profile
    </h2>

    <input
        className="input"
        type="text"
        placeholder="Target Role (Example: SDE Intern)"
        value={targetRole}
        onChange={(e) => setTargetRole(e.target.value)}
    />

    <textarea
        className="textarea"
        rows="4"
        placeholder="Skills (Python, React, ML...)"
        value={skills}
        onChange={(e) => setSkills(e.target.value)}
    />

    <textarea
        className="textarea"
        rows="4"
        placeholder="Projects"
        value={projects}
        onChange={(e) => setProjects(e.target.value)}
    />

    <select
        className="select"
        value={interviewType}
        onChange={(e) => setInterviewType(e.target.value)}
    >
        <option>HR</option>
        <option>Technical</option>
        <option>DSA</option>
        <option>System Design</option>
        <option>Machine Learning</option>
    </select>

    <input
        className="input"
        type="text"
        placeholder="Target Company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
    />
    <textarea
        className="textarea"
        rows="8"
        placeholder="Paste the Job Description here (Optional)"
        value={jobDescription}
        onChange={(e)=>setJobDescription(e.target.value)}
    />

    <button
        className="button"
        onClick={handleStartInterview}
    >
        {loading ? "Generating..." : "Start Interview"}
    </button>

</div>


{question && (
<div className="card">

<h2 className="section-title">
Current Interview Question
</h2>

<div className="question-box">
{question}
</div>

<br/>

<h2 className="section-title">
Your Answer
</h2>

<textarea
className="textarea"
rows="8"
placeholder="Write your answer..."
value={answer}
onChange={(e)=>setAnswer(e.target.value)}
/>

<button
className="button"
onClick={submitAnswer}
>
Submit Answer
</button>

</div>
)}



{feedback && (
<div className="card">

<h2 className="section-title">
AI Feedback
</h2>

<div className="feedback-box">
{feedback}
</div>

<div
style={{
display:"flex",
gap:"10px",
marginTop:"20px"
}}
>

<button
className="button continue-btn"
onClick={continueInterview}
>
Continue Current Topic
</button>

<button
className="button"
onClick={switchTopic}
>
Switch Topic
</button>

</div>

</div>
)}

</div>
)

}

export default App;