import { useState } from "react";

/**
 * HelpCategoryDropdown Component
 * 
 * Collapsible container for help articles grouped by category.
 * Each category can be expanded to show related articles.
 * 
 * @param {string} category - Name of the help category
 * @param {Array} articles - List of articles in this category
 */
const HelpCategoryDropdown = ({ category, articles }) => {
    // Track whether this category is expanded
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="help-category">
            {/* Category header with toggle control */}
            <div className="help-category-header" onClick={() => setIsOpen(!isOpen)}>
                <h3>{category}</h3>
                <span>{isOpen ? "−" : "+"}</span>
            </div>

            {/* Articles grid, displayed only when category is expanded */}
            {isOpen && (
                <div className="help-articles">
                    {articles.map((article, index) => (
                        <div key={index} className="help-article">
                            <h4>{article.title}</h4>
                            <p>{article.excerpt}</p>
                            <a href="#" className="read-more">
                                Read More
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HelpCategoryDropdown;
