import React from 'react';
import {createRoot} from 'react-dom/client';
import HLSVideoPlayer from './HLSVideoPlayer';



function openNewWindowWithPlayer(videoSrc)
{
    const newWindow = window.open("","_blank","width=800,height=600");

    newWindow.document.write(
        `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Video Player</title>
        </head>
        <body>
            <div id="video-player-root"></div>
        </body>
        </html>
        `
    );

    newWindow.document.close();


    const root = createRoot(newWindow.document.getElementById("video-player-root"));
    root.render(<HLSVideoPlayer videoSrc={videoSrc}/>)
}


export default openNewWindowWithPlayer;
