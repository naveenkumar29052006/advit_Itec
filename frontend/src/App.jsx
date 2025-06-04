import { useState } from "react";
import "./App.css";
import { authService } from "./services/api";

import LaunchButton from "./components/LaunchButton/LaunchButton";
import ModalWindow from "./components/ModalWindow/ModalWindow";

/**
 * Main Application Component
 * 
 * Controls the chat interface visibility and manages global application state.
 * Serves as the entry point for the chat widget functionality.
 */
function App() {
  // ======== STATE MANAGEMENT ========

  // Control visibility of chat modal window
  const [isOpen, setIsOpen] = useState(false);

  // Track which tab is currently active in the modal
  const [activeTab, setActiveTab] = useState("home");

  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('token');
  });
  
  // Current user data
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // ======== SAMPLE DATA ========
  // Note: In production, this would be fetched from an API

  // FAQ questions and answers for the Home section
  const faqData = [
    {
      question: "What is Advith iTec?",
      answer: `<div>
        Advith ITeC is a tech-enabled consulting firm that integrates financial expertise with advanced technology to streamline financial operations. Established in 2020 and headquartered in Udupi, Karnataka, the company offers remote, process-driven solutions designed to enhance efficiency, compliance, and scalability for businesses worldwide.
      </div>`
    },
    {
      question: "What services do you offer?",
      answer: <div>
        <p>Advith ITeC provides a comprehensive suite of FinOps (Financial Operations) services, including:</p>
        <ul>
          <li>Bookkeeping and Accounting</li>
          <li>Payroll Management</li>
          <li>Tax Compliance and Regulatory Filings</li>
          <li>Audit Support</li>
          <li>Data Analytics and MIS Reporting</li>
          <li>Corporate Law Compliance</li>
          <li>Digital Process Automation</li>
        </ul>
        <p>These services are delivered through their Global Delivery Centre (GDC), Global Capability Centre (GCC), and Centre of Excellence (CoE), ensuring tailored solutions for diverse business needs.</p>
      </div>
    },
    {
      question: "What are your business hours?",
      answer: `<div>We are available 24/7 for your support needs.</div>`
    }
  ];

  // Sample conversation data for the Messages section
  const messageData = [
    {
      sender: "system",
      senderName: "Chatbot",
      time: "10:30 AM",
      content: "Hello! How can I assist you today?",
    },
    {
      sender: "user",
      senderName: "You",
      time: "10:32 AM",
      content: "I need help with my account settings.",
    },
    {
      sender: "system",
      senderName: "Chatbot",
      time: "10:33 AM",
      content: "Sure, what specific setting are you looking for?",
    },
  ];

  // Help center articles organized by category
  const helpData = [
    {
      category: "GST Filing",
      articles: [
        {
          title: "GST Registration Process",
          excerpt: "Step-by-step guide for GST registration.",
        },
        {
          title: "Monthly GST Returns",
          excerpt: "How to file GSTR-1 and GSTR-3B returns.",
        },
        {
          title: "Input Tax Credit",
          excerpt: "Understanding and claiming input tax credit.",
        },
      ],
    },
    {
      category: "Income Tax",
      articles: [
        {
          title: "ITR Filing Guide",
          excerpt: "Complete guide to filing your income tax returns.",
        },
        {
          title: "Tax Deductions",
          excerpt: "List of available tax deductions under various sections.",
        },
        {
          title: "Form 16 & TDS",
          excerpt: "Understanding Form 16 and TDS compliance.",
        },
      ],
    },
    {
      category: "Corporate Tax",
      articles: [
        {
          title: "Corporate Tax Filing",
          excerpt: "Guide for filing corporate tax returns.",
        },
        {
          title: "Tax Planning",
          excerpt: "Strategic tax planning for businesses.",
        },
        {
          title: "International Taxation",
          excerpt: "Understanding cross-border tax implications.",
        },
      ],
    },
    {
      category: "Documentation",
      articles: [
        {
          title: "Required Documents",
          excerpt: "List of documents needed for various tax filings.",
        },
        {
          title: "Compliance Calendar",
          excerpt: "Important tax deadlines and compliance dates.",
        },
      ],
    },
  ];

  /**
   * Toggle chat window visibility
   * Called when the floating launch button is clicked
   */
  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  // ======== AUTHENTICATION HANDLERS ========

  /**
   * Handle successful login
   * @param {Object} userData - User data from successful login/signup
   */
  const handleAuthSuccess = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setUser(null);
    setActiveTab("auth"); // Always show auth screen after logout
  };

  // ======== COMPONENT RENDERING ========
  return (
    <div className="app-container">
      {/* Render the chat modal window when isOpen is true */}
      {isOpen && (
        <ModalWindow
          toggleModal={toggleModal}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          faqData={faqData}
          messageData={messageData}
          helpData={helpData}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
          onAuthSuccess={handleAuthSuccess}
          onLogout={handleLogout}
          user={user}
        />
      )}

      {/* Floating button that opens the chat interface */}
      <LaunchButton onClick={toggleModal} />
    </div>
  );
}

export default App;
