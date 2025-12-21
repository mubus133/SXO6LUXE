import React, { useState } from 'react'
import toast from 'react-hot-toast'
import './Contact.css'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [sending, setSending] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)

    // Simulate sending (you can integrate with email service later)
    setTimeout(() => {
      toast.success('Message sent successfully! We\'ll get back to you soon.')
      setFormData({ name: '', email: '', subject: '', message: '' })
      setSending(false)
    }, 1500)
  }

  return (
    <div className="contact-page">
      <div className="container">
        {/* Header */}
        <div className="contact-header">
          <h1>Get In Touch</h1>
          <p>Have questions? We'd love to hear from you.</p>
        </div>

        <div className="row g-5">
          {/* Contact Form */}
          <div className="col-lg-7">
            <div className="contact-form-card">
              <h2>Send Us a Message</h2>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Your Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Your Email *</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      className="form-control"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Message *</label>
                    <textarea
                      name="message"
                      className="form-control"
                      rows="6"
                      value={formData.message}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>
                  <div className="col-12">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg"
                      disabled={sending}
                    >
                      {sending ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="col-lg-5">
            <div className="contact-info-card">
              <h2>Contact Information</h2>
              
              <div className="contact-info-item">
                <i className="bi bi-geo-alt"></i>
                <div>
                  <h3>Address</h3>
                  <p>123 Luxury Avenue<br/>Port Harcourt, Rivers State<br/>Nigeria</p>
                </div>
              </div>

              <div className="contact-info-item">
                <i className="bi bi-envelope"></i>
                <div>
                  <h3>Email</h3>
                  <p><a href="mailto:support@sxo6luxe.com">support@sxo6luxe.com</a></p>
                </div>
              </div>

              <div className="contact-info-item">
                <i className="bi bi-telephone"></i>
                <div>
                  <h3>Phone</h3>
                  <p><a href="tel:+2348012345678">+234 801 234 5678</a></p>
                </div>
              </div>

              <div className="contact-info-item">
                <i className="bi bi-clock"></i>
                <div>
                  <h3>Business Hours</h3>
                  <p>Monday - Friday: 9:00 AM - 6:00 PM<br/>Saturday: 10:00 AM - 4:00 PM<br/>Sunday: Closed</p>
                </div>
              </div>

              <div className="contact-social">
                <h3>Follow Us</h3>
                <div className="social-links">
                  <a href="#" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
                  <a href="#" aria-label="Facebook"><i className="bi bi-facebook"></i></a>
                  <a href="#" aria-label="Twitter"><i className="bi bi-twitter"></i></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact