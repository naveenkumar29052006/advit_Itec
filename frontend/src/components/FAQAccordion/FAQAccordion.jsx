import { useState } from "react";

/**
 * FAQAccordion Component
 * 
 * Collapsible FAQ items that support both plain text and HTML/JSX content.
 * Each question can be expanded to reveal its answer.
 * 
 * @param {Array} faqs - List of question/answer pairs to display
 */
const FAQAccordion = ({ faqs }) => {
    // Track which FAQ item is currently open (null if none)
    const [openIndex, setOpenIndex] = useState(null);

    /**
     * Toggle expansion of a FAQ item
     * @param {number} index - Index of the FAQ item to toggle
     */
    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    /**
     * Render answer content based on its type
     * @param {string|JSX.Element} answer - Answer content which might be string or JSX
     * @returns {JSX.Element} Rendered answer
     */
    const renderAnswer = (answer) => {
        if (typeof answer === 'string') {
            // Handle HTML string content
            if (answer.startsWith('<div>')) {
                return <div dangerouslySetInnerHTML={{ __html: answer }} />;
            }
            // Plain text answer
            return <div>{answer}</div>;
        }
        // JSX content
        return answer;
    };

    return (
        <div className="faq-accordion">
            {faqs.map((faq, index) => (
                <div key={index} className="faq-item">
                    {/* Clickable question with expand/collapse indicator */}
                    <div className="faq-question" onClick={() => toggleFAQ(index)}>
                        {faq.question}
                        <span>{openIndex === index ? "−" : "+"}</span>
                    </div>

                    {/* Conditionally render answer when item is expanded */}
                    {openIndex === index && (
                        <div className="faq-answer">
                            {renderAnswer(faq.answer)}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default FAQAccordion;
