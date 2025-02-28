const { runLocalLLM } = require('./server');

async function testDeepseek() {
  // Multiple test cases
  const tests = [
    {
      resume: `
        Senior Software Engineer with 7 years of experience
        Expert in: React, Node.js, Python, TypeScript, Docker, AWS
        Led team of 5 developers on cloud migration project
        Implemented CI/CD pipelines reducing deployment time by 60%
      `,
      job: `
        Principal Software Engineer
        Required: 8+ years in software architecture
        Must have: Cloud expertise, team leadership
        Tech stack: AWS, React, Node.js, Python
      `
    },
    {
      resume: `
        Frontend Developer | 2 years experience
        Technologies: React, JavaScript, HTML, CSS
        Built responsive web applications
        Worked in agile development teams
      `,
      job: `
        Senior Frontend Engineer
        Required: 4+ years of frontend development
        Must know: React, TypeScript, Testing
        Nice to have: GraphQL, Next.js
      `
    }
  ];

  for (const test of tests) {
    try {
      console.log('\n=== Testing Resume Analysis ===');
      console.log('Resume:', test.resume);
      console.log('Job:', test.job);
      
      const prompt = `
      Analyze this resume for the job posting. Provide specific improvements:
      RESUME: ${test.resume}
      JOB: ${test.job}
      `;
      
      const result = await runLocalLLM(prompt);
      console.log('\nLLM Analysis:', result);
    } catch (error) {
      console.error('Test failed:', error.message);
    }
  }
}

testDeepseek();