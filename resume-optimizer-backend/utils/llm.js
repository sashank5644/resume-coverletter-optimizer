// utils/llm.js
const { spawn } = require('child_process');

const runLocalLLM = async (prompt) => {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', ['./llm/generate.py', prompt]);
      
      let result = '';
      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        console.error(`LLM Error: ${data}`);
      });
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(`LLM process exited with code ${code}`);
        } else {
          resolve(result.trim());
        }
      });
    });
};

module.exports = { runLocalLLM };