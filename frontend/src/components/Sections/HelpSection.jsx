import HelpCategoryDropdown from "../HelpCategoryDropdown/HelpCategoryDropdown";

/**
 * HelpSection Component
 * 
 * Displays help documentation organized by categories.
 * Each category can be expanded to show related articles.
 * 
 * @param {Array} helpData - Help articles organized by category
 */
const HelpSection = ({ helpData }) => {
    return (
        <div className="help-section">
            <h2>Help Center</h2>

            {/* Render each help category as a collapsible dropdown */}
            {helpData.map((item, index) => (
                <HelpCategoryDropdown
                    key={index}
                    category={item.category}
                    articles={item.articles}
                />
            ))}
        </div>
    );
};

export default HelpSection;
