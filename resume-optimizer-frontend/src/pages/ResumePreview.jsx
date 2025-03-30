import '../styling/ResumePreview.css';

const ResumePreview = ({ formData, templateStyle = 'classic' }) => {
  // Parse education entries
  const educationEntries = formData.education
    .split('\n')
    .filter(line => line.trim())
    .map(edu => {
      const [degree, institution, year] = edu.split(',').map(item => item.trim());
      return { degree, institution, year };
    });

  // Parse experience entries
  const experienceEntries = [];
  const expEntries = formData.experience.split('\n\n');
  for (const entry of expEntries) {
    if (!entry.trim()) continue;
    const lines = entry.split('\n');
    const firstLine = lines[0].split(',').map(item => item.trim());
    const position = firstLine[0] || '';
    const company = firstLine[1] || '';
    const period = firstLine[2] || '';
    const description = lines.slice(1).join('\n').trim();
    experienceEntries.push({ position, company, period, description });
  }

  // Parse projects entries
  const projectEntries = [];
  const projEntries = formData.projects.split('\n\n');
  for (const entry of projEntries) {
    if (!entry.trim()) continue;
    const lines = entry.split('\n');
    const firstLine = lines[0].split(',').map(item => item.trim());
    const name = firstLine[0] || '';
    const date = firstLine[1] || '';
    const description = lines.slice(1).join('\n').trim();
    projectEntries.push({ name, date, description });
  }

  // Parse skills
  const skills = formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);

  // LaTeX Classic Template
  if (templateStyle === 'classic') {
    return (
      <div className="resume-preview latex-template">
        <div className="latex-header">
          <div className="latex-title">{formData.title || 'Your Name'}</div>
          <div className="latex-contact">
            123-456-7890 | <a href="mailto:your@email.com" className="no-underline">your@email.com</a> | <a href="https://linkedin.com/in/yourprofile" className="no-underline">linkedin.com/in/yourprofile</a> | <a href="https://github.com/yourusername" className="no-underline">github.com/yourusername</a>
          </div>
        </div>

        <div className="latex-section">
          <div className="latex-section-title">Education</div>
          <div className="latex-section-line"></div>
          {educationEntries.length > 0 ? (
            <div className="latex-section-content">
              {educationEntries.map((edu, index) => (
                <div key={index} className="latex-entry">
                  <div className="latex-entry-header">
                    <span className="latex-entry-title">{edu.institution}</span>
                    <span className="latex-entry-date">{edu.year}</span>
                  </div>
                  <div className="latex-entry-subtitle">{edu.degree}</div>
                </div>
              ))}
            </div>
          ) : (
            <p>No education entries provided.</p>
          )}
        </div>

        <div className="latex-section">
          <div className="latex-section-title">Experience</div>
          <div className="latex-section-line"></div>
          {experienceEntries.length > 0 ? (
            <div className="latex-section-content">
              {experienceEntries.map((exp, index) => (
                <div key={index} className="latex-entry">
                  <div className="latex-entry-header">
                    <span className="latex-entry-title">{exp.position}</span>
                    <span className="latex-entry-date">{exp.period}</span>
                  </div>
                  <div className="latex-entry-subtitle">{exp.company}</div>
                  {exp.description && (
                    <ul className="latex-entry-details">
                      {exp.description.split('\n').map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No experience entries provided.</p>
          )}
        </div>

        <div className="latex-section">
          <div className="latex-section-title">Projects</div>
          <div className="latex-section-line"></div>
          {projectEntries.length > 0 ? (
            <div className="latex-section-content">
              {projectEntries.map((proj, index) => (
                <div key={index} className="latex-entry">
                  <div className="latex-entry-header">
                    <span className="latex-entry-title">{proj.name}</span>
                    <span className="latex-entry-date">{proj.date}</span>
                  </div>
                  {proj.description && (
                    <ul className="latex-entry-details">
                      {proj.description.split('\n').map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No project entries provided.</p>
          )}
        </div>

        <div className="latex-section">
          <div className="latex-section-title">Technical Skills</div>
          <div className="latex-section-line"></div>
          {skills.length > 0 ? (
            <div className="latex-skills">
              <p><strong>Languages:</strong> {skills.join(', ')}</p>
            </div>
          ) : (
            <p>No skills provided.</p>
          )}
        </div>
      </div>
    );
  }

  // LaTeX Modern Template
  if (templateStyle === 'modern') {
    return (
      <div className="resume-preview latex-modern-template">
        <div className="latex-modern-header">
          <div className="latex-modern-name">{formData.title || 'Your Name'}</div>
          <div className="latex-modern-contact">
            <span>123-456-7890</span> | 
            <span><a href="mailto:your@email.com" className="no-underline">your@email.com</a></span> | 
            <span><a href="https://linkedin.com/in/yourprofile" className="no-underline">linkedin.com/in/yourprofile</a></span> | 
            <span><a href="https://github.com/yourusername" className="no-underline">github.com/yourusername</a></span>
          </div>
        </div>

        <div className="latex-modern-section">
          <div className="latex-modern-section-title">Skills</div>
          <div className="latex-modern-section-line"></div>
          {skills.length > 0 ? (
            <div className="latex-modern-skills">
              <div className="latex-modern-skills-grid">
                <div className="latex-modern-skill-category">
                  <span className="latex-modern-skill-category-name">Category 1:</span>
                  <span className="latex-modern-skill-list">{skills.slice(0, Math.ceil(skills.length/2)).join(', ')}</span>
                </div>
                {skills.length > Math.ceil(skills.length/2) && (
                  <div className="latex-modern-skill-category">
                    <span className="latex-modern-skill-category-name">Category 2:</span>
                    <span className="latex-modern-skill-list">{skills.slice(Math.ceil(skills.length/2)).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p>No skills provided.</p>
          )}
        </div>

        <div className="latex-modern-section">
          <div className="latex-modern-section-title">Experience</div>
          <div className="latex-modern-section-line"></div>
          {experienceEntries.length > 0 ? (
            <div className="latex-modern-experience">
              {experienceEntries.map((exp, index) => (
                <div key={index} className="latex-modern-experience-entry">
                  <div className="latex-modern-experience-header">
                    <div className="latex-modern-company-name">{exp.company}</div>
                    <div className="latex-modern-experience-period">{exp.period}</div>
                  </div>
                  <div className="latex-modern-job-title">{exp.position}</div>
                  {exp.description && (
                    <ul className="latex-modern-job-details">
                      {exp.description.split('\n').map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No experience entries provided.</p>
          )}
        </div>

        <div className="latex-modern-section">
          <div className="latex-modern-section-title">Projects</div>
          <div className="latex-modern-section-line"></div>
          {projectEntries.length > 0 ? (
            <div className="latex-modern-experience">
              {projectEntries.map((proj, index) => (
                <div key={index} className="latex-modern-experience-entry">
                  <div className="latex-modern-experience-header">
                    <div className="latex-modern-company-name">{proj.name}</div>
                    <div className="latex-modern-experience-period">{proj.date}</div>
                  </div>
                  {proj.description && (
                    <ul className="latex-modern-job-details">
                      {proj.description.split('\n').map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No project entries provided.</p>
          )}
        </div>

        <div className="latex-modern-section">
          <div className="latex-modern-section-title">Education</div>
          <div className="latex-modern-section-line"></div>
          {educationEntries.length > 0 ? (
            <div className="latex-modern-education">
              {educationEntries.map((edu, index) => (
                <div key={index} className="latex-modern-education-entry">
                  <div className="latex-modern-education-header">
                    <div className="latex-modern-institution">{edu.institution}</div>
                    <div className="latex-modern-year">{edu.year}</div>
                  </div>
                  <div className="latex-modern-degree">{edu.degree}</div>
                </div>
              ))}
            </div>
          ) : (
            <p>No education entries provided.</p>
          )}
        </div>
      </div>
    );
  }

  // LaTeX Minimal Template
  if (templateStyle === 'minimal') {
    return (
      <div className="resume-preview latex-minimal-template">
        <div className="latex-minimal-header">
          <div className="latex-minimal-name">{formData.title || 'Your Name'}</div>
          <div className="latex-minimal-contact">
            <span>123-456-7890</span> | 
            <span><a href="mailto:your@email.com" className="no-underline">your@email.com</a></span> | 
            <span><a href="https://linkedin.com/in/yourprofile" className="no-underline">linkedin.com/in/yourprofile</a></span> | 
            <span><a href="https://github.com/yourusername" className="no-underline">github.com/yourusername</a></span>
          </div>
        </div>

        <div className="latex-minimal-section">
          <div className="latex-minimal-section-title">Experience</div>
          {experienceEntries.length > 0 ? (
            <div className="latex-minimal-entries">
              {experienceEntries.map((exp, index) => (
                <div key={index} className="latex-minimal-entry">
                  <div className="latex-minimal-entry-header">
                    <span className="latex-minimal-entry-company">{exp.company}</span>
                    <span className="latex-minimal-entry-date">{exp.period}</span>
                  </div>
                  <div className="latex-minimal-entry-title">{exp.position}</div>
                  {exp.description && (
                    <ul className="latex-minimal-entry-details">
                      {exp.description.split('\n').map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No experience entries provided.</p>
          )}
        </div>

        <div className="latex-minimal-section">
          <div className="latex-minimal-section-title">Projects</div>
          {projectEntries.length > 0 ? (
            <div className="latex-minimal-entries">
              {projectEntries.map((proj, index) => (
                <div key={index} className="latex-minimal-entry">
                  <div className="latex-minimal-entry-header">
                    <span className="latex-minimal-entry-company">{proj.name}</span>
                    <span className="latex-minimal-entry-date">{proj.date}</span>
                  </div>
                  {proj.description && (
                    <ul className="latex-minimal-entry-details">
                      {proj.description.split('\n').map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No project entries provided.</p>
          )}
        </div>

        <div className="latex-minimal-section">
          <div className="latex-minimal-section-title">Education</div>
          {educationEntries.length > 0 ? (
            <div className="latex-minimal-entries">
              {educationEntries.map((edu, index) => (
                <div key={index} className="latex-minimal-entry">
                  <div className="latex-minimal-entry-header">
                    <span className="latex-minimal-entry-degree">{edu.degree}</span>
                    <span className="latex-minimal-entry-date">{edu.year}</span>
                  </div>
                  <div className="latex-minimal-entry-institution">{edu.institution}</div>
                </div>
              ))}
            </div>
          ) : (
            <p>No education entries provided.</p>
          )}
        </div>

        <div className="latex-minimal-section">
          <div className="latex-minimal-section-title">Skills</div>
          {skills.length > 0 ? (
            <div className="latex-minimal-skills">
              {skills.join(' • ')}
            </div>
          ) : (
            <p>No skills provided.</p>
          )}
        </div>
      </div>
    );
  }

  // Default to LaTeX Classic if no valid template is selected
  return (
    <div className="resume-preview latex-template">
      <div className="latex-header">
        <div className="latex-title">{formData.title || 'Your Name'}</div>
        <div className="latex-contact">
          123-456-7890 | <a href="mailto:your@email.com" className="no-underline">your@email.com</a> | <a href="https://linkedin.com/in/yourprofile" className="no-underline">linkedin.com/in/yourprofile</a> | <a href="https://github.com/yourusername" className="no-underline">github.com/yourusername</a>
        </div>
      </div>

      <div className="latex-section">
        <div className="latex-section-title">Education</div>
        <div className="latex-section-line"></div>
        {educationEntries.length > 0 ? (
          <div className="latex-section-content">
            {educationEntries.map((edu, index) => (
              <div key={index} className="latex-entry">
                <div className="latex-entry-header">
                  <span className="latex-entry-title">{edu.institution}</span>
                  <span className="latex-entry-date">{edu.year}</span>
                </div>
                <div className="latex-entry-subtitle">{edu.degree}</div>
              </div>
            ))}
          </div>
        ) : (
          <p>No education entries provided.</p>
        )}
      </div>

      <div className="latex-section">
        <div className="latex-section-title">Experience</div>
        <div className="latex-section-line"></div>
        {experienceEntries.length > 0 ? (
          <div className="latex-section-content">
            {experienceEntries.map((exp, index) => (
              <div key={index} className="latex-entry">
                <div className="latex-entry-header">
                  <span className="latex-entry-title">{exp.position}</span>
                  <span className="latex-entry-date">{exp.period}</span>
                </div>
                <div className="latex-entry-subtitle">{exp.company}</div>
                {exp.description && (
                  <ul className="latex-entry-details">
                    {exp.description.split('\n').map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No experience entries provided.</p>
        )}
      </div>

      <div className="latex-section">
        <div className="latex-section-title">Projects</div>
        <div className="latex-section-line"></div>
        {projectEntries.length > 0 ? (
          <div className="latex-section-content">
            {projectEntries.map((proj, index) => (
              <div key={index} className="latex-entry">
                <div className="latex-entry-header">
                  <span className="latex-entry-title">{proj.name}</span>
                  <span className="latex-entry-date">{proj.date}</span>
                </div>
                {proj.description && (
                  <ul className="latex-entry-details">
                    {proj.description.split('\n').map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No project entries provided.</p>
        )}
      </div>

      <div className="latex-section">
        <div className="latex-section-title">Technical Skills</div>
        <div className="latex-section-line"></div>
        {skills.length > 0 ? (
          <div className="latex-skills">
            <p><strong>Languages:</strong> {skills.join(', ')}</p>
          </div>
        ) : (
          <p>No skills provided.</p>
        )}
      </div>
    </div>
  );
};

export default ResumePreview;