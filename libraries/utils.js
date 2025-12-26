
// ----------------------------------------
var DIM_A4 = {width:21.0, height:29.7};
var DIM_A3 = {width:29.7, height:42.0};
const DPCM = 30;

// ----------------------------------------
var SERVER_ADDRESS = "";

// ----------------------------------------
var socket, clientId, svgToPlot, bCreateSvg = false, bSaveSvg=false, bPlotSvg=false;
var widthCM,heightCM;
var widthDraw,heightDraw;
var bConnected = false;

// ----------------------------------------
function prepareSketch(canvas, noLoop_=true, bBonnect=true)
{
  if (noLoop_) noLoop();
  canvas.elt.removeAttribute('style');
  canvas.parent('container-canvas')
  setSvgResolutionDPCM(DPCM);
  widthCM = pxToCm(width);
  heightCM = pxToCm(height);
  installUI();
  if (bBonnect)
    connect();
}

// ----------------------------------------
function beginSVG()
{
  if (bSaveSvg || bPlotSvg || !isLooping())
  {
    bCreateSvg = true;
    beginRecordSVG(this);
  }
}

// ----------------------------------------
function endSVG()
{
  if (bCreateSvg)
  {
    svgToPlot = endRecordSVG();
    if (bSaveSvg) saveSVG(svgToPlot, "export.svg");
    if (bPlotSvg) plot(svgToPlot);

    bCreateSvg = false;
    bSaveSvg = false;
    bPlotSvg = false;
  }

}

// ----------------------------------------
function cmToPx(cm){return DPCM * cm}
function pxToCm(px){return px / DPCM}

// ----------------------------------------
function beginDraw(x,y,w,h,bDrawZone=false)
{
    push();
    translate(x,y);
    if (bDrawZone)
    {
        push();
        noFill();
        strokeWeight(2);
        stroke(255,0,0);
        rect(0,0,w,h);
        pop();
    }
    widthDraw = w;
    heightDraw = h;
}

// ----------------------------------------
function endDraw()
{
    pop();
}

// ----------------------------------------
function beginDrawCM(x,y,w,h,bDrawZone=false)
{
    beginDraw(cmToPx(x),cmToPx(y),cmToPx(w),cmToPx(h), bDrawZone);
}

// ----------------------------------------
function endDrawCM()
{
    endDraw();
}

// ----------------------------------------
function textSVG(svgFont,s,x,y,sca=30)
{
  svgFont.drawString(s, x, y, sca);
}

// ----------------------------------------
function drawSquareGrid(x,y,w,res,cbCell)
{
  let d = w/res;
  push();
    noFill();
    translate(x,y);
    for (let j=0; j<res; j++)
      for (let i=0; i<res; i++)
      {
        let xCell = d*i, yCell = d*j;
          if (cbCell) 
            cbCell(xCell,yCell,d,i,j)
          else 
            square(xCell,yCell,d);
      }
  pop();
}

// ----------------------------------------
function drawSquareGridCM(xCM,yCM,wCM,res,cbCell)
{
  let dCM = wCM/res;
  push();
    noFill();
    //translate(cmToPx(xCM),cmToPx(yCM));
    for (let j=0; j<res; j++)
      for (let i=0; i<res; i++)
      {
        let xCellCM = xCM+dCM*i, yCellCM = yCM+dCM*j;
          push();
          if (cbCell) 
            cbCell(xCellCM,yCellCM,dCM,i,j)
          else 
            square(xCellCM,yCellCM,dCM);
          pop();
      }
  pop();
}

// ----------------------------------------
/*function connect()
{
  bConnected = false;
  clientId = getClientId();
  SERVER_ADDRESS = `${SERVER_IP}:${SERVER_PORT}`
  socket = new WebSocket(`ws://${SERVER_ADDRESS}?clientId=${clientId}&pseudo=${PSEUDO}`);
  socket.onmessage = (msg) => 
  {
    let data = JSON.parse(msg.data);
    if (data.status == "connected")
    {
      clientId = data.id
      bConnected = true;
      updateUI();
      console.log(`connected, clientId=${clientId}`);
    }
    else 
    if (data.status == "queued"){}
    else if (data.status == "queue-infos")
    {
      updateLayoutInfos(data.queue);
      //console.log(data.queue)
    }
  };

  /*
  Style
  let queue = [];
  for (let i=0;i<8;i++)
    queue.push({
      id : generateClientId(),
      client_id : generateClientId(), 
      status : 'processing',
      pseudo : PSEUDO,
      timestamp : Date.now()
    });
  updateLayoutInfos(queue);
  */
}

// ----------------------------------------
function updateUI()
{
  if (bConnected)
    document.getElementById('btn-plot-svg').removeAttribute('disabled', !bConnected);
  else
    document.getElementById('btn-plot-svg').setAttribute('disabled', true);
}

// ----------------------------------------
function installUI()
{
  document.getElementById('btn-save-svg').addEventListener('click', e=>
  {
    if (isLooping()) bSaveSvg = true;   
    else  
     if (svgToPlot)
        saveSVG(svgToPlot, "export.svg");
  });
  document.getElementById('btn-plot-svg').addEventListener('click', e=>
  {
    if (!bConnected)
    {
      return;
    }

    if (isLooping()) bPlotSvg = true;    
    else
      if (svgToPlot)
        plot(svgToPlot);
  });
  document.getElementById('btn-draw').setAttribute('style', `display:${isLooping() ? 'none' : 'inline-block'}` );
  document.getElementById('btn-draw').addEventListener('click', e=>redraw());

  updateUI();
}

// ----------------------------------------
function saveSVG(svgContent,filename)
{
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${PSEUDO}_${filename}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ----------------------------------------
function call(end_point, data={}, cbDone)
{
  fetch(`http://${SERVER_ADDRESS}/${end_point}`, 
  {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
  })
  .then( response=>response.json() )
  .then( result=>{
    if (isFunction(cbDone)) 
      cbDone(result)
  })
}

// ----------------------------------------
function plot(svg,cbDone)
{
  call('plot', { svg : svg, id: clientId }, cbDone);
}

// ----------------------------------------
function removeItemQueue(id)
{
  call('remove', {id:id});
}

// ----------------------------------------
function updateLayoutInfos(queue)
{
  let container = document.getElementById("container-queue-infos");
  container.innerHTML = '';

  if (queue.length > 0)
  {
    let rows = '';
    queue.forEach( info => {
      rows += `<tr>
        <!-- <td>${shortenString(info.id,10,5)}</td> -->
        <td>${info.pseudo} (${shortenString(info.client_id,10,5)})</td>
        <td>${info.status}</td>
        <td>${formatTimestamp(info.timestamp)}</td>`
      if (info.client_id == clientId && info.status != 'processing') 
        rows+=`<td><button data-id="${info.id}">Supprimer</button></td>`
      else 
        rows+=`<td>&nbsp;</td>`
      rows+=`</tr>`;
    })
    container.innerHTML = `<table>${rows}</table>`;
  
    container.querySelectorAll("button").forEach( button=>
    {
      button.addEventListener("click", (event) => removeItemQueue(event.target.dataset.id) )
    })
  }
}

// ----------------------------------------
function generateClientId() 
{
  return 'client-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

// ----------------------------------------
function getClientId()
{
  let clientId = localStorage.getItem("clientId");
  if (!clientId) 
  {
    clientId = generateClientId();
    localStorage.setItem("clientId", clientId);
  }
  return clientId;
}

// ----------------------------------------
function isFunction(f)
{
    return typeof f === "function";
}

// ----------------------------------------------------
function shortenString(str, startLength, endLength)
{
    if (str.length <= startLength + endLength) 
        return str; // No need to shorten
    return str.substring(0, startLength) + '[...]' + str.substring(str.length - endLength);
}

// ----------------------------------------------------
function formatTimestamp(ts)
{
    return new Date(ts).toLocaleString();
}
  
function getBBoxWithTransform(el, svgRoot) {
  const bbox = el.getBBox();         // bbox locale
  const m = el.getCTM();              // transformation cumulative (local → SVG)
  const p = svgRoot.createSVGPoint(); // point utilitaire

  // 4 coins du rectangle local
  const corners = [
    [bbox.x, bbox.y],
    [bbox.x + bbox.width, bbox.y],
    [bbox.x, bbox.y + bbox.height],
    [bbox.x + bbox.width, bbox.y + bbox.height]
  ];

  // Transformation des coins
  const transformed = corners.map(([x, y]) => {
    p.x = x;
    p.y = y;
    return p.matrixTransform(m);
  });

  const xs = transformed.map(pt => pt.x);
  const ys = transformed.map(pt => pt.y);

  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys)
  };
}

function getGlobalSvgBBoxFromString(svgString) {
  // 1. Parse la string en SVG DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svg = doc.documentElement;

  // 2. Insérer le SVG hors écran pour que getCTM/getBBox fonctionnent
  svg.style.position = "absolute";
  svg.style.left = "0px";
  svg.style.top = "0px";
  document.body.appendChild(svg);

  // 4. Parcourt tous les éléments pour créer la bbox globale
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  console.log(svgString);
  console.log(svg.getScreenCTM())
  svg.querySelectorAll(`circle,
  ellipse,
  rect,
  line,
  polyline,
  polygon,
  path,
  text,
  image,
  use
  `).forEach(el => 
  {
    if (typeof el.getBBox === "function") {
      try {
        //const box = el.getBBox();
        //if (!box) return;
        console.log( el.getCTM() )
        const box = getBBoxWithTransform(el,svg);


        minX = Math.min(minX, box.x);
        minY = Math.min(minY, box.y);
        maxX = Math.max(maxX, box.x + box.width);
        maxY = Math.max(maxY, box.y + box.height);
      } catch {}
    }
  });

  // 5. Nettoyage
  svg.remove();

  if (minX === Infinity) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

//=====================================================
//=====================================================
// Class to handle SVG font parsing and rendering
class SvgFont {
  constructor(filePath) {
    this.glyphs = {};
    this.unitsPerEm = 1000;
    this.ready = false;

    // Load the SVG font file
    loadStrings(filePath, (strings) => {
      this.loadData(strings.join("\n"));
      this.ready = true;
    });
  }

  isReady() {
    return this.ready;
  }

  //---------------------------------------------------------
  // Load and parse the SVG font data
  loadData(svgData) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgData, "text/xml");

    // Parse the glyphs
    const glyphElements = svgDoc.querySelectorAll("glyph");
    glyphElements.forEach((glyph) => {
      const unicode = glyph.getAttribute("unicode");
      if (unicode !== null) { // Ensure glyph has a valid unicode attribute
        const pathData = glyph.getAttribute("d");
        const horizAdvX = parseFloat(glyph.getAttribute("horiz-adv-x") || 0);
        this.glyphs[unicode] = { d: pathData, horizAdvX };
      }
    });

    // Parse font-face for scale metrics
    const fontFace = svgDoc.querySelector("font-face");
    if (fontFace) {
      this.unitsPerEm = parseFloat(fontFace.getAttribute("units-per-em") || 1000);
    }
  }

  //---------------------------------------------------------
  // Draw a single glyph at the specified position and scale
  drawGlyph(pathData, x, y, sca) {
    const commands = pathData.match(/[A-Za-z][^A-Za-z]*/g) || [];
    const nCommands = commands.length; 
    let currentX = x;
    let currentY = y;
    let prevControlX = null;
    let prevControlY = null;
    
    for (let i=0; i<nCommands; i++){
      const command = commands[i]; 
      const type = command[0];
      const args = command
        .slice(1)
        .trim()
        .split(/[ ,]+/)
        .map(parseFloat);
      let px, py;
      
      switch (type) {
          
        case "M": // Move to (absolute)
          currentX = x + sca * (args[0] / this.unitsPerEm);
          currentY = y - sca * (args[1] / this.unitsPerEm);
          prevControlX = null;
          prevControlY = null;
          break;
        case "m": // Move to (relative)
          currentX += sca * (args[0] / this.unitsPerEm);
          currentY -= sca * (args[1] / this.unitsPerEm);
          prevControlX = null;
          prevControlY = null;
          break;
          
        case "L": // Line to (absolute)
          px = x + sca * (args[0] / this.unitsPerEm);
          py = y - sca * (args[1] / this.unitsPerEm);
          line(currentX, currentY, px, py);
          currentX = px;
          currentY = py;
          prevControlX = null;
          prevControlY = null;
          break;
        case "l": // Line to (relative)
          px = currentX + sca * (args[0] / this.unitsPerEm);
          py = currentY - sca * (args[1] / this.unitsPerEm);
          line(currentX, currentY, px, py);
          currentX = px;
          currentY = py;
          prevControlX = null;
          prevControlY = null;
          break;
          
        case "H": // Horizontal line to (absolute)
          px = x + sca * (args[0] / this.unitsPerEm);
          line(currentX, currentY, px, currentY);
          currentX = px;
          prevControlX = null;
          prevControlY = null;
          break;
        case "h": // Horizontal line to (relative)
          px = currentX + sca * (args[0] / this.unitsPerEm);
          line(currentX, currentY, px, currentY);
          currentX = px;
          prevControlX = null;
          prevControlY = null;
          break;
          
        case "V": // Vertical line to (absolute)
          py = y - sca * (args[0] / this.unitsPerEm);
          line(currentX, currentY, currentX, py);
          currentY = py;
          prevControlX = null;
          prevControlY = null;
          break;
        case "v": // Vertical line to (relative)
          py = currentY - sca * (args[0] / this.unitsPerEm);
          line(currentX, currentY, currentX, py);
          currentY = py;
          prevControlX = null;
          prevControlY = null;
          break;
          
        case "C": // Cubic Bézier curve (absolute)
          const x1 = currentX;
          const y1 = currentY;
          const x2 = x + sca * (args[0] / this.unitsPerEm);
          const y2 = y - sca * (args[1] / this.unitsPerEm);
          const x3 = x + sca * (args[2] / this.unitsPerEm);
          const y3 = y - sca * (args[3] / this.unitsPerEm);
          const x4 = x + sca * (args[4] / this.unitsPerEm);
          const y4 = y - sca * (args[5] / this.unitsPerEm);
          bezier(x1, y1, x2, y2, x3, y3, x4, y4);
          currentX = x4;
          currentY = y4;
          prevControlX = x3;
          prevControlY = y3;
          break;
        case "c": // Cubic Bézier curve (relative)
          const relX1 = currentX;
          const relY1 = currentY;
          const relX2 = currentX + sca * (args[0] / this.unitsPerEm);
          const relY2 = currentY - sca * (args[1] / this.unitsPerEm);
          const relX3 = currentX + sca * (args[2] / this.unitsPerEm);
          const relY3 = currentY - sca * (args[3] / this.unitsPerEm);
          const relX4 = currentX + sca * (args[4] / this.unitsPerEm);
          const relY4 = currentY - sca * (args[5] / this.unitsPerEm);
          bezier(relX1, relY1, relX2, relY2, relX3, relY3, relX4, relY4);
          currentX = relX4;
          currentY = relY4;
          prevControlX = relX3;
          prevControlY = relY3;
          break;
          
        case "S": // Smooth cubic Bézier curve (absolute)
          const smoothX2 = prevControlX ? 2 * currentX - prevControlX : currentX;
          const smoothY2 = prevControlY ? 2 * currentY - prevControlY : currentY;
          const smoothX3 = x + sca * (args[0] / this.unitsPerEm);
          const smoothY3 = y - sca * (args[1] / this.unitsPerEm);
          const smoothX4 = x + sca * (args[2] / this.unitsPerEm);
          const smoothY4 = y - sca * (args[3] / this.unitsPerEm);
          bezier(currentX, currentY, smoothX2, smoothY2, 
                 smoothX3, smoothY3, smoothX4, smoothY4);
          currentX = smoothX4;
          currentY = smoothY4;
          prevControlX = smoothX3;
          prevControlY = smoothY3;
          break;
        case "s": // Smooth cubic Bézier curve (relative)
          const relSmoothX2 = prevControlX ? 2 * currentX - prevControlX : currentX;
          const relSmoothY2 = prevControlY ? 2 * currentY - prevControlY : currentY;
          const relSmoothX3 = currentX + sca * (args[0] / this.unitsPerEm);
          const relSmoothY3 = currentY - sca * (args[1] / this.unitsPerEm);
          const relSmoothX4 = currentX + sca * (args[2] / this.unitsPerEm);
          const relSmoothY4 = currentY - sca * (args[3] / this.unitsPerEm);
          bezier(currentX, currentY, relSmoothX2, relSmoothY2, 
                 relSmoothX3, relSmoothY3, relSmoothX4, relSmoothY4);
          currentX = relSmoothX4;
          currentY = relSmoothY4;
          prevControlX = relSmoothX3;
          prevControlY = relSmoothY3;
          break;
          
        default:
          // console.warn(`Unsupported SVG command: ${type}`);
          break;
      }
    }
  }

  
  //---------------------------------------------------------
  // Draw a string of text using the parsed font. 
  // Modified to add SVG groups for each glyph, 
  // using p5.plotSvg's beginSvgGroup and endSvgGroup.
  drawString(str, x, y, sca) {
    if (this.isReady()) {
      let cursorX = x;
      const scaleFactor = sca / this.unitsPerEm;
      noFill();

      for (const chr of str) {
        const glyph = this.glyphs[chr];
        if (glyph) {
          // Only draw if there's path data
          if (glyph.d) {
            beginSvgGroup();
            this.drawGlyph(glyph.d, cursorX, y, sca);
            endSvgGroup();
          }
          // Always advance cursorX using horiz-adv-x
          cursorX += glyph.horizAdvX * scaleFactor;
          
        } else {
          console.warn(`Missing glyph: '${chr}' (Unicode: ${chr.charCodeAt(0)})`);
          cursorX += 300 * scaleFactor; // Fallback spacing for missing glyphs
        }
      }
    }
  }
}

function normalizeFaceKeypoints(vectors)
{
  let bb = getBoundingBox(vectors);
  return vectors.map( k=>createVector( (k.x-bb.x)/bb.width, (k.y-bb.y)/bb.height ) )
}

function getBoundingBox(vectors) 
{
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (let v of vectors) {
    minX = min(minX, v.x);
    maxX = max(maxX, v.x);
    minY = min(minY, v.y);
    maxY = max(maxY, v.y);
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function drawFaceWith(face, x,y,w,h, cbDraw)
{
    if (isFunction(cbDraw))
      normalizeFaceKeypoints(face.keypoints??face)
      .forEach( (k,index)=> cbDraw( map(k.x,0,1,x,x+w), map(k.y,0,1,y,y+h), index ) );
}

function drawFaceCircles(face,x,y,w,h,d=20)
{
    normalizeFaceKeypoints(face.keypoints??face)
    .forEach( k=>circle( map(k.x,0,1,x,x+w), map(k.y,0,1,y,y+h) , isFunction(d) ? d() : d) );
}


function faceCopyPoints(keypoints)
{
  return keypoints.map(k=>k.copy())
}
