import React from "react";

function About() {
  const contactDetails = {
    email: "clinton@example.com", // You can update this later
    phone: "+254745408764", // Kenyan number format with country code
    address: "123 Main Street, City, Country", // Placeholder address
    linkedin: "https://www.linkedin.com/in/clinton-ochieng-706263351/",
    github: "https://github.com/Clintonochieng072-gif",
  };

  return (
    <div>
      {/* Full Name at the top */}
      <h1>CLINTON OCHIENG</h1>

      <p>This is the About page. Your info will go here.</p>

      {/* Contact Details Section */}
      <section>
        <h2>Contact Details</h2>
        <ul>
          <li>
            <strong>Email:</strong> {contactDetails.email}
          </li>
          <li>
            <strong>Phone:</strong> {contactDetails.phone}
          </li>
          <li>
            <strong>Address:</strong> {contactDetails.address}
          </li>
          <li>
            <strong>LinkedIn:</strong>{" "}
            <a
              href={contactDetails.linkedin}
              target="_blank"
              rel="noopener noreferrer"
            >
              {contactDetails.linkedin}
            </a>
          </li>
          <li>
            <strong>GitHub:</strong>{" "}
            <a
              href={contactDetails.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              {contactDetails.github}
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}

export default About;
