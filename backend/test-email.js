// Test script for email functionality
require('dotenv').config();
const emailService = require('./src/services/emailService');

async function testEmailService() {
    console.log('Testing email service configuration...');
    
    // Test connection
    const connectionTest = await emailService.testConnection();
    if (!connectionTest.success) {
        console.error('❌ Email service connection failed:', connectionTest.error);
        console.log('\nPlease check your email configuration in .env file:');
        console.log('- SMTP_HOST');
        console.log('- SMTP_PORT');
        console.log('- SMTP_USER');
        console.log('- SMTP_PASS');
        return;
    }
    
    console.log('✅ Email service connection successful!');
    
    // Test email sending (only if SMTP credentials are configured)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log('\nTesting email sending...');
        
        const testRequester = {
            name: 'John Doe',
            email: process.env.SMTP_USER, // Send to yourself for testing
            location: 'New York'
        };
        
        const testAccepter = {
            name: 'Jane Smith',
            email: 'test@example.com',
            location: 'California'
        };
        
        const testMatchDetails = {
            skillsYouCanTeachThem: [
                { name: 'JavaScript', proficiency: 'advanced' },
                { name: 'React', proficiency: 'intermediate' }
            ],
            skillsTheyCanTeachYou: [
                { name: 'Python', proficiency: 'expert' },
                { name: 'Machine Learning', proficiency: 'advanced' }
            ]
        };
        
        try {
            const result = await emailService.sendConnectionAcceptedToRequester(
                testRequester, 
                testAccepter, 
                testMatchDetails
            );
            
            if (result.success) {
                console.log('✅ Test email sent successfully!');
                console.log('Message ID:', result.messageId);
            } else {
                console.error('❌ Failed to send test email:', result.error);
            }
        } catch (error) {
            console.error('❌ Error sending test email:', error.message);
        }
    } else {
        console.log('\n⚠️  SMTP credentials not configured. Skipping email sending test.');
        console.log('Add SMTP_USER and SMTP_PASS to your .env file to test email sending.');
    }
}

// Run the test
testEmailService()
    .then(() => {
        console.log('\nEmail service test completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Test failed:', error);
        process.exit(1);
    });







