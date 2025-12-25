import React from 'react'
import { Link } from 'react-router-dom'
import './Legal.css'

const PrivacyPolicy = () => {
  return (
    <div className="legal-page">
      <div className="container">
        {/* Header */}
        <div className="legal-header">
          <Link to="/" className="back-link">
            <i className="bi bi-arrow-left me-2"></i>
            Back to Home
          </Link>
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: December 25, 2024</p>
        </div>

        {/* Content */}
        <div className="legal-content">
          {/* Introduction */}
          <section className="legal-section">
            <h2>1. Introduction</h2>
            <p>
              Welcome to SXO6LUXE ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and make purchases from our online store.
            </p>
            <p>
              By using our website, you consent to the data practices described in this policy. If you do not agree with the terms of this privacy policy, please do not access or use our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            
            <h3>2.1 Personal Information</h3>
            <p>We collect personal information that you voluntarily provide to us when you:</p>
            <ul>
              <li>Register for an account</li>
              <li>Make a purchase</li>
              <li>Subscribe to our newsletter</li>
              <li>Contact our customer support</li>
              <li>Participate in surveys or promotions</li>
            </ul>
            
            <p>This information may include:</p>
            <ul>
              <li>Name and contact information (email address, phone number)</li>
              <li>Shipping and billing addresses</li>
              <li>Payment information (processed securely through Paystack)</li>
              <li>Account credentials (username and encrypted password)</li>
              <li>Purchase history and preferences</li>
              <li>Communication preferences</li>
            </ul>

            <h3>2.2 Automatically Collected Information</h3>
            <p>When you visit our website, we automatically collect certain information about your device and browsing actions, including:</p>
            <ul>
              <li>IP address and browser type</li>
              <li>Device information and operating system</li>
              <li>Referring URLs and pages viewed</li>
              <li>Date and time of visits</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section className="legal-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            
            <h3>3.1 Order Processing and Fulfillment</h3>
            <ul>
              <li>Process and fulfill your orders</li>
              <li>Send order confirmations and shipping notifications</li>
              <li>Handle returns, exchanges, and customer service requests</li>
              <li>Process payments securely through Paystack</li>
            </ul>

            <h3>3.2 Account Management</h3>
            <ul>
              <li>Create and manage your user account</li>
              <li>Authenticate your identity</li>
              <li>Provide personalized shopping experience</li>
              <li>Save your preferences and order history</li>
            </ul>

            <h3>3.3 Communication</h3>
            <ul>
              <li>Send you updates about your orders</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Send promotional emails (with your consent)</li>
              <li>Notify you about changes to our services or policies</li>
            </ul>

            <h3>3.4 Business Operations</h3>
            <ul>
              <li>Analyze website usage and improve our services</li>
              <li>Prevent fraud and ensure security</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce our terms</li>
            </ul>
          </section>

          {/* Payment Processing */}
          <section className="legal-section">
            <h2>4. Payment Processing</h2>
            <p>
              We use Paystack as our payment processor for Nigerian customers. Payment information is processed directly by Paystack and is subject to their privacy policy and security measures. We do not store complete payment card information on our servers.
            </p>
            <p>
              For more information about Paystack's data practices, please visit: <a href="https://paystack.com/privacy" target="_blank" rel="noopener noreferrer">https://paystack.com/privacy</a>
            </p>
          </section>

          {/* Data Sharing */}
          <section className="legal-section">
            <h2>5. How We Share Your Information</h2>
            <p>We may share your information in the following circumstances:</p>

            <h3>5.1 Service Providers</h3>
            <p>We share information with third-party service providers who assist us in:</p>
            <ul>
              <li>Payment processing (Paystack)</li>
              <li>Shipping and delivery services</li>
              <li>Email communication (Resend)</li>
              <li>Website hosting and maintenance</li>
              <li>Analytics and marketing services</li>
            </ul>

            <h3>5.2 Legal Requirements</h3>
            <p>We may disclose your information when required to:</p>
            <ul>
              <li>Comply with applicable laws and regulations</li>
              <li>Respond to legal process or government requests</li>
              <li>Protect our rights, property, or safety</li>
              <li>Prevent fraud or illegal activities</li>
            </ul>

            <h3>5.3 Business Transfers</h3>
            <p>
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new owner. We will notify you of any such change in ownership or control of your personal information.
            </p>
          </section>

          {/* Data Security */}
          <section className="legal-section">
            <h2>6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul>
              <li>Encryption of sensitive data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security assessments and updates</li>
              <li>Employee training on data protection</li>
            </ul>
            <p>
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Your Rights */}
          <section className="legal-section">
            <h2>7. Your Privacy Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal information:</p>
            
            <h3>7.1 Access and Portability</h3>
            <p>You have the right to request access to your personal information and receive a copy in a structured, commonly used format.</p>

            <h3>7.2 Correction</h3>
            <p>You have the right to request correction of inaccurate or incomplete personal information.</p>

            <h3>7.3 Deletion</h3>
            <p>You have the right to request deletion of your personal information, subject to certain exceptions (e.g., legal obligations, ongoing transactions).</p>

            <h3>7.4 Objection and Restriction</h3>
            <p>You have the right to object to or request restriction of certain processing of your personal information.</p>

            <h3>7.5 Withdrawal of Consent</h3>
            <p>Where we rely on your consent to process your information, you have the right to withdraw that consent at any time.</p>

            <p>To exercise any of these rights, please contact us at <a href="mailto:privacy@sxo6luxe.com">privacy@sxo6luxe.com</a></p>
          </section>

          {/* Cookies */}
          <section className="legal-section">
            <h2>8. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and understand user preferences. You can control cookies through your browser settings.
            </p>
            
            <h3>Types of Cookies We Use:</h3>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for basic site functionality</li>
              <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our site</li>
              <li><strong>Functionality Cookies:</strong> Remember your preferences and settings</li>
              <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (with your consent)</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section className="legal-section">
            <h2>9. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.
            </p>
            <p>Typical retention periods:</p>
            <ul>
              <li>Account information: Until account deletion or 3 years of inactivity</li>
              <li>Order history: 7 years for tax and accounting purposes</li>
              <li>Marketing communications: Until you unsubscribe</li>
              <li>Support tickets: 3 years after resolution</li>
            </ul>
          </section>

          {/* International Transfers */}
          <section className="legal-section">
            <h2>10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. We ensure appropriate safeguards are in place to protect your information during such transfers.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="legal-section">
            <h2>11. Children's Privacy</h2>
            <p>
              Our services are not intended for children under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="legal-section">
            <h2>12. Changes to This Privacy Policy</h2>
            <p>
              We may update this privacy policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. The updated policy will be posted on this page with a new "Last Updated" date. We encourage you to review this policy periodically.
            </p>
            <p>
              For significant changes, we will notify you via email or through a prominent notice on our website.
            </p>
          </section>

          {/* Contact Information */}
          <section className="legal-section">
            <h2>13. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this privacy policy or our data practices, please contact us:
            </p>
            <div className="contact-info">
              <p><strong>SXO6LUXE</strong></p>
              <p>Email: <a href="mailto:privacy@sxo6luxe.com">privacy@sxo6luxe.com</a></p>
              <p>Support: <a href="mailto:support@sxo6luxe.com">support@sxo6luxe.com</a></p>
              <p>Phone: +234 XXX XXX XXXX</p>
            </div>
          </section>

          {/* GDPR / CCPA Compliance */}
          <section className="legal-section">
            <h2>14. Regional Specific Rights</h2>
            
            <h3>14.1 For European Union Residents (GDPR)</h3>
            <p>If you are a resident of the European Union, you have additional rights under the General Data Protection Regulation (GDPR), including:</p>
            <ul>
              <li>Right to be informed about data collection</li>
              <li>Right to access your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Rights related to automated decision-making</li>
            </ul>

            <h3>14.2 For California Residents (CCPA)</h3>
            <p>If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA), including:</p>
            <ul>
              <li>Right to know what personal information is collected</li>
              <li>Right to know if personal information is sold or disclosed</li>
              <li>Right to opt-out of the sale of personal information</li>
              <li>Right to request deletion of personal information</li>
              <li>Right to non-discrimination for exercising CCPA rights</li>
            </ul>
          </section>
        </div>

        {/* Footer Links */}
        <div className="legal-footer">
          <Link to="/terms">Terms of Service</Link>
          <span className="separator">•</span>
          <Link to="/contact">Contact Us</Link>
          <span className="separator">•</span>
          <Link to="/">Return Home</Link>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy