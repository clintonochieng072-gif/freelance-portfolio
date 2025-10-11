import React from "react";

function Portfolio() {
  const skills = ["React", "JavaScript", "CSS", "HTML", "Node.js"];
  const projects = [
    {
      id: 1,
      title: "Project One",
      description: "Description for project one.",
    },
    {
      id: 2,
      title: "Project Two",
      description: "Description for project two.",
    },
  ];

  return (
    <div>
      <h1>My Portfolio</h1>

      {/* Skills Section */}
      <section>
        <h2>Skills</h2>
        <ul>
          {skills.map((skill, index) => (
            <li key={index}>{skill}</li>
          ))}
        </ul>
      </section>

      {/* Projects Section */}
      <section>
        <h2>Projects</h2>
        {projects.map((project) => (
          <div
            key={project.id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            <h3>{project.title}</h3>
            <p>{project.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default Portfolio;
