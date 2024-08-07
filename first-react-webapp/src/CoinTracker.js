import { useEffect, useState } from "react";

function CoinTracker()
{
    const [loading,setLoading] =useState(true);
    const [coins,setCoins] = useState([]);
    useEffect(()=>{
        console.log("Fetch Coin Info")
        fetch("https://api.coinpaprika.com/v1/tickers").then((response)=>response.json())
        .then((json)=>{setCoins(json); setLoading(false);});
    },[])

    return(

        <div>
            <h1>The Coin</h1>
            {(loading)? <strong>loading...</strong> : (
                <select>
                    {
                        coins.map((coin,index)=>(
                            <option key={index}>{coin.name}({coin.symbol}): ${coin.quotes.USD.price} USD </option>
                        ))
                    }
                </select>
            )}
        </div>
    );
}

export default CoinTracker;