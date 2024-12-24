import { onMount } from "solid-js";

let App = () => {
  let canvas: HTMLCanvasElement;
  let isMouseDown = false;

  let hue = Math.random() * 360;

  let colour = document.querySelector("#colour") as HTMLInputElement;

  colour.value = hue.toString();

  let lastMouseX = 0;
  let lastMouseY = 0;

  onMount(() => {
    colour.addEventListener("input", function(){
      this.style.color = `hsl(${hue}, 100%, 50%)`;
    });
    colour.dispatchEvent(new Event("input"));



    let ctx = canvas.getContext('2d')!;

    let ws: WebSocket;
    let connect = () => {
      ws = new WebSocket('wss://draw-ws.phaz.uk');

      ws.onopen = () => {
        console.log('Opened');
        ws.send(JSON.stringify({ type: 'auth', hue }));
      }

      ws.onmessage = ( msg ) => {
        let json = JSON.parse(msg.data);

        if(json.type === 'draw'){
          ctx.lineWidth = 10;
          ctx.strokeStyle = `hsl(${json.hue}, 100%, 50%)`;

          ctx.beginPath();
          ctx.moveTo(json.from[0], json.from[1]);
          ctx.lineTo(json.to[0], json.to[1]);
          ctx.stroke();
          ctx.closePath();
        }
      }

      ws.onclose = () => {
        console.log('Reconnecting');
        connect();
      }
    }

    connect();

    colour.onmouseup = () => {
      hue = +colour.value;
      ws.send(JSON.stringify({ type: "auth", hue }))
    }
    
    window.onmousedown = (e) => {
      if (e.target === colour) return;
      isMouseDown = true;
    }
    window.onmouseup = () => isMouseDown = false;

    window.ontouchstart = ( e ) => {
      lastMouseX = e.touches[0].clientX;
      lastMouseY = e.touches[0].clientY;

      isMouseDown = true;
    }

    window.ontouchend = () => isMouseDown = false;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.onresize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    window.ontouchmove = ( e ) => {
      if(isMouseDown){
        ctx.lineWidth = 10;
        ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;

        ws.send(JSON.stringify({
          type: 'draw',
          from: [ lastMouseX, lastMouseY ],
          to: [ e.touches[0].clientX, e.touches[0].clientY ]
        }));

        ctx.beginPath();
        ctx.moveTo(lastMouseX, lastMouseY);
        ctx.lineTo(e.touches[0].clientX, e.touches[0].clientY);
        ctx.stroke();
        ctx.closePath();
      }

      lastMouseX = e.touches[0].clientX;
      lastMouseY = e.touches[0].clientY;
    }

    window.onmousemove = ( e ) => {
      if(isMouseDown){
        ctx.lineWidth = 10;
        ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;

        ws.send(JSON.stringify({
          type: 'draw',
          from: [ lastMouseX, lastMouseY ],
          to: [ e.clientX, e.clientY ]
        }));

        ctx.beginPath();
        ctx.moveTo(lastMouseX, lastMouseY);
        ctx.lineTo(e.clientX, e.clientY);
        ctx.stroke();
        ctx.closePath();
      }

      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }

    let render = () => {
      requestAnimationFrame(render);
    }

    setInterval(() => {
      ctx.fillStyle = '#0001';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, 2000);

    requestAnimationFrame(render);
  })

  return (
    <div>
      <canvas ref={canvas!}></canvas>
    </div>
  )
}

export default App