import React from 'react';
import './Styles/Sidebar.css';
import Config from "./Config";

const Sidebar = ({ 
    isOpen, 
    onClose, 
    isAuthenticated, 
    actors, 
    selectedActor, 
    setSelectedActor, 
    sortOrder, 
    setSortOrder, 
    owned, 
    setOwned, 
    selectedCategory, 
    setSelectedCategory, 
    subscriptExist, 
    setSubscriptExist,
    searchTerm,
    onSearchChange,
    totalCount,
    sortOptions
}) => {
    const filteredCategories = Config.categories.filter(cate =>
        (!isAuthenticated && cate === "AdultVideo") ? false : true
    );

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h3>Filters</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="sidebar-content">
                    <div className="sidebar-stats">
                        <span className="total-count-label">
                            <svg className="total-count-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="10" cy="10" r="10" fill="#1976d2"/>
                                <text x="10" y="15" textAnchor="middle" fontSize="12" fill="#fff" fontWeight="bold">#</text>
                            </svg>
                            <b>Totals</b> <span className="total-count-number">{totalCount}</span> Results
                        </span>
                    </div>

                    <div className="filter-group search-group">
                        <input
                            type="text"
                            value={searchTerm}
                            placeholder="Search by serial number..."
                            onChange={onSearchChange}
                            className="sidebar-search-input"
                        />
                    </div>

                    <div className="filter-group">
                        <label>Category</label>
                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                            <option value="">All</option>
                            {filteredCategories.map((cate, index) => (
                                <option key={index} value={cate}>{cate}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Actor</label>
                        <select value={selectedActor} onChange={e => setSelectedActor(e.target.value)}>
                            <option value="">All Actors</option>
                            {actors.map(actor => (
                                <option key={actor._id} value={actor.name}>{actor.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Sort By</label>
                        <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                            {sortOptions ? (
                                sortOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))
                            ) : (
                                <>
                                    <option value="asc">Release Date: Ascending</option>
                                    <option value="desc">Release Date: Descending</option>
                                    <option value="createdAsc">Created Date: Ascending</option>
                                    <option value="createdDesc">Created Date: Descending</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Subscription</label>
                        <select value={subscriptExist} onChange={e => setSubscriptExist(e.target.value)}>
                            <option value="all">ALL</option>
                            <option value="true">Exist</option>
                            <option value="false">None</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Ownership</label>
                        <select value={owned} onChange={e => setOwned(e.target.value)}>
                            <option value="all">All</option>
                            <option value="plex">Owned(Plex)</option>
                            <option value="web">Owned(Web)</option>
                            <option value="web4k">Owned(Web 4K)</option>
                            <option value="web1080p">Owned(Web FullHD)</option>
                            <option value="false">Not Owned</option>
                        </select>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
