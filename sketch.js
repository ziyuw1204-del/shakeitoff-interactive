// ----------------------------------------
// PSEUDO
const PSEUDO = "Ziyu"; // à changer

// ----------------------------------------
// IP (adresse) du serveur d'impression
const SERVER_IP     = "192.168.1.11"; // à changer
const SERVER_PORT   = 3000; // à changer en fonction du plotter
const DO_CONNECT    = false; // se connecte-t-on ou pas ? 
const MODE_SIMPLE   = false; 

// ----------------------------------------
// Dimension de la feuille et précision
const DIM_SHEET = DIM_A4;


// ----------------------------------------
let faceMesh;
let video;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: true };

let K_INDEX_NOSE = 275;
let VALUES_MAX = 200;
let values = [], amp = 0, ampTarget=0;

let _debug_ = false;

// ----------------------------------------
function preload() {
  faceMesh = ml5.faceMesh(options);
}

// ----------------------------------------
function setup() 
{
  let canvas = createCanvas(DIM_SHEET.width*DPCM, DIM_SHEET.height*DPCM);
  prepareSketch(canvas, MODE_SIMPLE, DO_CONNECT);
  // Création de la vidéo
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  // Détection de visage
  faceMesh.detectStart(video, gotFaces);
}

// ----------------------------------------
function gotFaces(results) 
{
  faces = results;
}

// ----------------------------------------
function draw() 
{
  beginSVG();

  // ----------------------------------------
  // <début> Partie éditable pour le dessin
  background(255);

  // Draw all the tracked face points
  noFill();
  stroke(0);

  let margin = cmToPx(3.0);

  for (let i = 0; i < faces.length; i++) 
  {
    // compute nose movement
    if (values.length>5)
    {
      let delta = abs(values[values.length-1] - values[values.length-5])
      ampTarget = delta * 1500; // amplitude
    }

    amp += (ampTarget-amp)*0.1; // valeur de retour equilibre, plus petit = plus lent
    
    let ampRepo = 5;

    drawFaceWith( faces[i], margin,margin,width-2*margin,height-2*margin, (xFace,yFace, index)=>
    {
      if (index == K_INDEX_NOSE)
      {
        values.push( map(xFace,0,width,0,1) );
        if (values.length > VALUES_MAX)
          values.shift();
      }


        circle(xFace +random(-ampRepo,ampRepo) + random(-amp/2,amp/2) ,yFace + +random(-ampRepo,ampRepo) + random(-amp/2,amp/2),10);
      //text(`${index}`,xFace+5,yFace)
    })
    
  }

  // <fin> Partie éditable pour le dessin
  // ----------------------------------------
  endSVG();

  if (_debug_)
  {
    let bb = {x:0,y:height,w:200,h:100}
    beginShape();
    values.forEach( (v,i)=>{
      vertex( i, map(v,0,1,bb.y,bb.y-bb.h) );
    })
    endShape();

  }

//  image(video, 0, 0);
}
