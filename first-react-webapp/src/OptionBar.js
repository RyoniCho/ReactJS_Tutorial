import "./Styles/OptionBar.css"
import Config from "./Config";
function OptionBar({ isAuthenticated, actors, selectedActor, setSelectedActor, sortOrder, setSortOrder, owned, setOwned, selectedCategory,setSelectedCategory }) {

    const filteredCategories = Config.categories.filter(cate=>
        (!isAuthenticated&&cate == "AdultVideo") ? false:true
    )

    return (
        <div className="option-bar">
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                <option value="">All</option>
                {filteredCategories.map((cate,index) => 
                        (<option key={index} value={cate}>
                            {cate}
                        </option>)
                    )}
            </select>

            <select value={selectedActor} onChange={e => setSelectedActor(e.target.value)}>
                <option value="">All Actors</option>
                {actors.map(actor => (
                   <option key={actor._id} value={actor.name}>
                                {actor.name}
                            </option>
                ))}
            </select>

            <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                <option value="asc">Release Date: Ascending</option>
                <option value="desc">Release Date: Descending</option>
            </select>

            <select value={owned} onChange={e => setOwned(e.target.value)}>
                <option value="all">All</option>
                <option value="true">Owned</option>
                <option value="false">Not Owned</option>
            </select>
        </div>
    );
}

export default OptionBar;