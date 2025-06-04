import FAQAccordion from "../FAQAccordion/FAQAccordion";
import { ChatbotIcon } from "../icons/Icons";

/**
 * HomeSection Component
 * 
 * Landing page of the chat interface with welcome message and FAQ.
 * This section is accessible to all users regardless of authentication.
 * 
 * @param {Array} faqData - List of frequently asked questions with answers
 */
const HomeSection = ({ faqData }) => {
    return (
        <div className="home-section">
            {/* Welcome message and company introduction */}
            <div className="welcome-container">
                <h2>Welcome to Advith iTec Support</h2>
                <div className="introduction">
                    <p>
                        We're here to help you with any questions about our services.
                        Browse through our frequently asked questions below or start a
                        conversation with our support team.
                    </p>
                </div>
            </div>

            {/* FAQ section with collapsible items */}
            <div className="faq-section">
                <h3>Generally Asked Questions</h3>
                <FAQAccordion faqs={faqData} />
            </div>
        </div>
    );
};

export default HomeSection;
