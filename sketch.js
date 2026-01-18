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
let currentShape = "circle";
let faceMesh;
let video;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: true };
let shapeBindings = [];

function triggerDrawing() {
  if (!faceReady) return;

  // 把“文字”当成一种新的绘制绑定
  addTextBinding(currentText);
}

let textBindings = [];



let K_INDEX_NOSE = 275;
let VALUES_MAX = 200;
let values = [], amp = 0, ampTarget=0;
let faceReady = false;

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
  document
    .querySelectorAll("#shape-buttons button")
    .forEach(btn => {
      btn.addEventListener("click", () => {
        if (!faceReady)
        {
          console.log("face not ready yet");
          return;
        }
        currentShape = btn.dataset.shape;
        addShapeBindings();
      });
    });
  
  document.addEventListener("click", (e) => {
    const canvasEl = document.querySelector("canvas");
    const buttonsEl = document.querySelector("#shape-buttons");

    if (
      canvasEl.contains(e.target) ||
      buttonsEl.contains(e.target)
    ) {
      return; // 点在画布或按钮上，不触发
      }

  removeRandomEntities(40);
});

}

// 输入框
let currentText = "";

const input = document.getElementById("input-should");
const buttonContainer = document.getElementById("dynamic-buttons");

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const value = input.value.trim();
    if (value === "") return;

    createTextButton(value);
    input.value = "";
  }
});

function createTextButton(text) {
  const btn = document.createElement("button");
  btn.textContent = text;

  btn.addEventListener("click", () => {
    currentText = text;
    triggerDrawing(); // 复用你原来的“图形按钮”逻辑
  });

  buttonContainer.appendChild(btn);

  // 立即触发一次（按你的描述，这是你想要的）
  currentText = text;
  triggerDrawing();
}

function addTextBinding(text) {
  if (faces.length === 0) return;

  let face = faces[0];

  face.keypoints.forEach((kp, index) => {
    if (random() < 0.08) {
      textBindings.push({
        text: text,
        index: index,
        size: random(14, 28)
      });
    }
  });
}


// ----------------------------------------
function gotFaces(results) 
{
  faces = results;
  if (faces.length > 0)
  {
    faceReady = true;
  }
}

// ----------------------------------------
function draw() 
{
  beginSVG();


  // ----------------------------------------
  // <début> Partie éditable pour le dessin
  background(255);

  // 标题
  push();
  fill(0);
  noStroke();
  textAlign(CENTER, TOP);
  textSize(24);
  textStyle(BOLD);
  text("SHAKE IT OFF", width / 2, 10);
  pop();

  


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
       // 对所有“绑定在这个 index 上的图形”进行绘制
      shapeBindings.forEach(binding =>
      {
        if (binding.index === index)
        {
          let jitterX = random(-amp/2, amp/2);
          let jitterY = random(-amp/2, amp/2);

          drawShape(
            binding.shape,
            xFace + jitterX,
            yFace + jitterY,
            (12*binding.scale) + amp * 0.05
          );
        }
      });

      textBindings.forEach(binding => {
        if (binding.index === index) {
          push();
          fill(0);
          noStroke();
          textAlign(CENTER, CENTER);
          textSize(binding.size);
          text(
            binding.text,
            xFace + random(-amp/3, amp/3),
            yFace + random(-amp/3, amp/3)
          );
          pop();
        }
      });

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

  // forme de element
  function drawShape(type,x,y,size)
  {
    push();
    translate(x,y);
    noFill();
    stroke(0);

    switch(type)
    {
      case "circle":
        circle(0,0,size);
        break;
      
      case "square":
        rectMode(CENTER);
        rect(0, 0, size, size);
        break;

      case "triangle":
        triangle(-size/2, size/2,
         0, -size/2,
         size/2, size/2
         );
        break;

      case "cross":
        line(-size/2, 0, size/2, 0);
        line(0, -size/2, 0, size/2);
        break;

    }

    pop();
  }

  //绑定点位与图形
  function addShapeBindings()
  {
    if (faces.length === 0) return;

    let face = faces[0];

    face.keypoints.forEach((kp, index) => {
      if (random() < 0.15)
      {
        shapeBindings.push({
          shape: currentShape,
          index: index,
          scale: random(0.5, 3)
        });
      }
    });
  }

  function removeRandomShapes(n)
  {
    for (let i = 0; i < n; i++)
    {
      if (shapeBindings.length === 0) return;

      let index = floor(random(shapeBindings.length));
      shapeBindings.splice(index, 1);
    }

    console.log("remaining shapes:", shapeBindings.length);
  }

  function removeRandomEntities(totalToRemove)
  {
    let totalShapes = shapeBindings.length;
    let totalTexts  = textBindings.length;
    let totalEntities = totalShapes + totalTexts;

    if (totalEntities === 0) return;

    // 实际能删的数量，防止越界
    let n = min(totalToRemove, totalEntities);

    // 随机决定删多少文字
    let removeTextCount = floor(random(0, n + 1));
    let removeShapeCount = n - removeTextCount;

    // 防止超出各自数组长度
    removeTextCount  = min(removeTextCount,  textBindings.length);
    removeShapeCount = min(removeShapeCount, shapeBindings.length);

    removeRandomTexts(removeTextCount);
    removeRandomShapes(removeShapeCount);

    console.log(
      "removed:",
      removeShapeCount, "shapes,",
      removeTextCount, "texts",
      "| remaining:",
      shapeBindings.length, "shapes,",
      textBindings.length, "texts"
    );
  }

function removeRandomTexts(n)
{
  for (let i = 0; i < n; i++)
  {
    if (textBindings.length === 0) return;

    let index = floor(random(textBindings.length));
    textBindings.splice(index, 1);
  }
}
