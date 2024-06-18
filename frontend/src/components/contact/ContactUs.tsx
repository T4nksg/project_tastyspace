import { useEffect, useState } from 'react';
import './ContactUs.css';

const BACKEND_URL = "http://localhost:5000";

export default function ContactUs() {
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/admin_email`)
      .then(response => response.json())
      .then(data => {
        if (data.email) {
          setAdminEmail(data.email);
        }
      })
      .catch(error => console.error('Error fetching admin email:', error));
  }, []);

  return (
    <div className="contact-us-card common-card">
      <h3 className="text-center">Contact Us</h3>
      <p className="contact-us-text">
        If you have any questions or comments about the application, you can contact the application administrator via email at <strong className="highlight">{adminEmail}</strong>.
      </p>
      <p className="contact-us-text">
        You can also contact the administrator to register as a moderator and help us develop the application.
      </p>
    </div>
  );
}
