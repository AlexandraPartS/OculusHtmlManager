import '../style/app.css';
import * as querystring from 'querystring';
import { StreamClientScrcpy } from './googDevice/client/StreamClientScrcpy';
import { HostTracker } from './client/HostTracker';
import { BaseDeviceTracker } from './client/BaseDeviceTracker';

window.onload = async function (): Promise<void> {

    /// #if USE_H264_CONVERTER
    const { MsePlayer } = await import('./player/MsePlayer');
    StreamClientScrcpy.registerPlayer(MsePlayer);
    /// #endif

    HostTracker.start();
      
    /// Video stream output description:
    /// 1. Promise function expects Oculus connection with short interval(delay) for timespan(waitTime) and farther wiht elongate interval *5
    /// 2. The solution is performed with a counter n (not Date()).
    let delay = 1000; 
    let waitTime = 30000;

    let promise = new Promise(function(resolve) {
        let n=0;
        let timerId = setTimeout(function loadChecking() {
            try{
                let ylink = document.getElementsByClassName('link-stream')[0].hasAttribute("href");
                if(ylink === true){
                    setTimeout(() => { clearInterval(timerId);});
                    resolve('Glasses connected');
                }
            }
            catch(e){
                console.log(`[Dev]: Waiting for Oculus connection \n` + e.name +`  ` + e.message);
            }
            n++;
            if(n*delay > waitTime){timerId = setTimeout(loadChecking, delay*5);}
            else{timerId = setTimeout(loadChecking, delay);}
        }, delay);
    });
    promise.then(
        function(){
            let target = document.getElementsByClassName('link-stream')[0].getAttribute('href');
            if(target !== null ){
                const hash = target.replace(/^#!/, '');
                const parsedQuery = querystring.parse(hash);
                StreamClientScrcpy.start(parsedQuery); //this is starts the server Node & Websocket
            }
        }
    ).then(
        function(){
            BaseDeviceTracker.setVideoStanding();
        }
    );

};
