import "./Styles/OptionBar.css"
import Config from "./Config";
function OptionBar({ isAuthenticated, actors, selectedActor, setSelectedActor, sortOrder, setSortOrder, owned, setOwned, selectedCategory,setSelectedCategory }) {

    const filteredCategories = Config.categories.filter(cate=>
        (!isAuthenticated&&cate == "AdultVideo") ? false:true
    )

    return (
        <div className="option-bar">
           
                <select className="option-item" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                    <option value="">All</option>
                    {filteredCategories.map((cate,index) => 
                            (<option key={index} value={cate}>
                                {cate}
                            </option>)
                        )}
                </select>
            
                <select className="option-item"  value={selectedActor} onChange={e => setSelectedActor(e.target.value)}>
                    <option value="">All Actors</option>
                    {actors.map(actor => (
                    <option key={actor._id} value={actor.name}>
                                    {actor.name}
                                </option>
                    ))}
                </select>
           
                <select className="option-item" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                    <option value="asc">Release Date: Ascending</option>
                    <option value="desc">Release Date: Descending</option>
                </select>
            
                <select className="option-item"  value={owned} onChange={e => setOwned(e.target.value)}>
                    <option value="all">All</option>
                    <option value="plex">Owned(Plex)</option>
                    <option value="web">Owned(Web)</option>
                    <option value="false">Not Owned</option>
                </select>
            
        </div>
    );
}

export default OptionBar;