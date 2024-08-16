import "./Styles/OptionBar.css"

function OptionBar({ actors, selectedActor, setSelectedActor, sortOrder, setSortOrder, owned, setOwned }) {

    return (
        <div className="option-bar">
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