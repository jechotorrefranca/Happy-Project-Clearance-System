const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, subject, html } = req.body;

  try {
    const response = await axios.post('https://api.resend.com/emails', {
      from: 'admin@school.com',
      to: email,
      subject: subject,
      html: html,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
};
