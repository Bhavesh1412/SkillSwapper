const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    /**
     * Send email to user who sent connection request (when request is accepted)
     * @param {Object} requester - User who sent the request
     * @param {Object} accepter - User who accepted the request
     * @param {Object} matchDetails - Details about the match
     */
    async sendConnectionAcceptedToRequester(requester, accepter, matchDetails) {
        const mailOptions = {
            from: `"SkillSwapper" <${process.env.SMTP_USER}>`,
            to: requester.email,
            subject: `🎉 Your connection request was accepted by ${accepter.name}!`,
            html: this.getConnectionAcceptedToRequesterTemplate(requester, accepter, matchDetails)
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email sent to requester:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Error sending email to requester:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send email to user who accepted connection request
     * @param {Object} accepter - User who accepted the request
     * @param {Object} requester - User who sent the request
     * @param {Object} matchDetails - Details about the match
     */
    async sendConnectionAcceptedToAccepter(accepter, requester, matchDetails) {
        const mailOptions = {
            from: `"SkillSwapper" <${process.env.SMTP_USER}>`,
            to: accepter.email,
            subject: `🤝 You've connected with ${requester.name} on SkillSwapper!`,
            html: this.getConnectionAcceptedToAccepterTemplate(accepter, requester, matchDetails)
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email sent to accepter:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('Error sending email to accepter:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Email template for requester (person who sent the request)
     */
    getConnectionAcceptedToRequesterTemplate(requester, accepter, matchDetails) {
        const skillsYouCanTeach = matchDetails.skillsYouCanTeachThem || [];
        const skillsYouCanLearn = matchDetails.skillsTheyCanTeachYou || [];
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Connection Request Accepted</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .highlight { background: #e8f4fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
                .skills-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .skill-tag { background: #667eea; color: white; padding: 5px 10px; border-radius: 15px; margin: 5px; display: inline-block; font-size: 12px; }
                .contact-info { background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                .btn { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Great News!</h1>
                    <h2>Your connection request was accepted!</h2>
                </div>
                
                <div class="content">
                    <p>Hi <strong>${requester.name}</strong>,</p>
                    
                    <div class="highlight">
                        <h3>🎯 ${accepter.name} has accepted your connection request!</h3>
                        <p>You can now start exchanging skills and learning from each other.</p>
                    </div>

                    <div class="contact-info">
                        <h4>📧 Contact Information</h4>
                        <p><strong>Name:</strong> ${accepter.name}</p>
                        <p><strong>Email:</strong> ${accepter.email}</p>
                        ${accepter.location ? `<p><strong>Location:</strong> ${accepter.location}</p>` : ''}
                    </div>

                    ${skillsYouCanTeach.length > 0 ? `
                    <div class="skills-section">
                        <h4>🎓 Skills you can teach ${accepter.name}:</h4>
                        ${skillsYouCanTeach.map(skill => `<span class="skill-tag">${skill.name}</span>`).join('')}
                    </div>
                    ` : ''}

                    ${skillsYouCanLearn.length > 0 ? `
                    <div class="skills-section">
                        <h4>📚 Skills you can learn from ${accepter.name}:</h4>
                        ${skillsYouCanLearn.map(skill => `<span class="skill-tag">${skill.name}</span>`).join('')}
                    </div>
                    ` : ''}

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/matches" class="btn">
                            View Your Connections
                        </a>
                    </div>

                    <p><strong>Next Steps:</strong></p>
                    <ul>
                        <li>Reach out to ${accepter.name} via email to introduce yourself</li>
                        <li>Discuss your learning goals and teaching preferences</li>
                        <li>Plan your first skill exchange session</li>
                        <li>Share your availability and preferred communication methods</li>
                    </ul>

                    <p>Happy learning and teaching!</p>
                    <p>The SkillSwapper Team</p>
                </div>

                <div class="footer">
                    <p>This email was sent because you have an account with SkillSwapper.</p>
                    <p>If you no longer wish to receive these emails, you can update your notification preferences in your account settings.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Email template for accepter (person who accepted the request)
     */
    getConnectionAcceptedToAccepterTemplate(accepter, requester, matchDetails) {
        const skillsYouCanTeach = matchDetails.skillsTheyCanTeachYou || [];
        const skillsYouCanLearn = matchDetails.skillsYouCanTeachThem || [];
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Connection Made</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .highlight { background: #e8f4fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
                .skills-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .skill-tag { background: #667eea; color: white; padding: 5px 10px; border-radius: 15px; margin: 5px; display: inline-block; font-size: 12px; }
                .contact-info { background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                .btn { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🤝 New Connection!</h1>
                    <h2>You've successfully connected with ${requester.name}</h2>
                </div>
                
                <div class="content">
                    <p>Hi <strong>${accepter.name}</strong>,</p>
                    
                    <div class="highlight">
                        <h3>🎯 You've accepted a connection request from ${requester.name}!</h3>
                        <p>You can now start exchanging skills and learning from each other.</p>
                    </div>

                    <div class="contact-info">
                        <h4>📧 Contact Information</h4>
                        <p><strong>Name:</strong> ${requester.name}</p>
                        <p><strong>Email:</strong> ${requester.email}</p>
                        ${requester.location ? `<p><strong>Location:</strong> ${requester.location}</p>` : ''}
                    </div>

                    ${skillsYouCanTeach.length > 0 ? `
                    <div class="skills-section">
                        <h4>🎓 Skills you can teach ${requester.name}:</h4>
                        ${skillsYouCanTeach.map(skill => `<span class="skill-tag">${skill.name}</span>`).join('')}
                    </div>
                    ` : ''}

                    ${skillsYouCanLearn.length > 0 ? `
                    <div class="skills-section">
                        <h4>📚 Skills you can learn from ${requester.name}:</h4>
                        ${skillsYouCanLearn.map(skill => `<span class="skill-tag">${skill.name}</span>`).join('')}
                    </div>
                    ` : ''}

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/matches" class="btn">
                            View Your Connections
                        </a>
                    </div>

                    <p><strong>Next Steps:</strong></p>
                    <ul>
                        <li>Wait for ${requester.name} to reach out to you via email</li>
                        <li>Be ready to discuss your teaching and learning preferences</li>
                        <li>Plan your first skill exchange session together</li>
                        <li>Share your availability and preferred communication methods</li>
                    </ul>

                    <p>Happy learning and teaching!</p>
                    <p>The SkillSwapper Team</p>
                </div>

                <div class="footer">
                    <p>This email was sent because you have an account with SkillSwapper.</p>
                    <p>If you no longer wish to receive these emails, you can update your notification preferences in your account settings.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Test email configuration
     */
    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('Email service is ready to send emails');
            return { success: true };
        } catch (error) {
            console.error('Email service configuration error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService();

